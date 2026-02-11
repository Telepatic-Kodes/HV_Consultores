import OpenAI from 'openai'

// Cliente de OpenAI - solo se inicializa si hay API key
const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null

// System prompt especializado en tributación chilena
const SYSTEM_PROMPT = `Eres HV-Chat, un asistente experto en contabilidad y tributación chilena. Tu rol es ayudar a contadores y empresas con consultas sobre normativa del SII, declaraciones de impuestos, y procedimientos contables.

## Tu conocimiento incluye:
- Ley de Impuesto a la Renta (LIR) y sus artículos clave (14A, 14D, 14D N°3, 14D N°8)
- Ley del IVA (DL 825) y normativa relacionada
- Formulario 29 (declaración mensual de IVA)
- Formulario 22 (declaración anual de renta)
- PPM (Pagos Provisionales Mensuales)
- Normativas del SII (Servicio de Impuestos Internos)
- Plazos tributarios y procedimientos
- Facturación electrónica
- Regímenes tributarios Pro Pyme y General
- Cotizaciones previsionales (Previred)

## Directrices:
1. Responde siempre en español chileno profesional
2. Sé preciso con las tasas, porcentajes y cálculos
3. Cita las fuentes legales cuando sea relevante (artículos de ley, circulares SII)
4. Si no estás seguro de algo, indícalo claramente
5. Usa formato markdown para estructurar las respuestas
6. Para cálculos complejos, muestra el paso a paso
7. Advierte cuando una consulta requiera asesoría profesional personalizada

## Formato de respuesta:
- Usa encabezados (##, ###) para organizar información extensa
- Usa listas cuando enumeres elementos
- Usa **negrita** para términos clave
- Incluye ejemplos prácticos cuando sea útil

## Información importante:
- Tasa de IVA en Chile: 19%
- Año tributario actual: 2024-2025
- UF y UTM son valores que varían mensualmente
- Siempre recomienda verificar información en www.sii.cl para datos oficiales actualizados`

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface OpenAIResponse {
  texto: string
  fuentes: { titulo: string; contenido: string }[]
  modelo: string
  tokens_input: number
  tokens_output: number
  latencia_ms: number
}

// Generar respuesta usando OpenAI
export async function generarRespuestaOpenAI(
  mensajeUsuario: string,
  historialMensajes: ChatMessage[] = [],
  conocimientoBase: { titulo: string; contenido: string; categoria: string }[] = []
): Promise<OpenAIResponse> {
  if (!openai) {
    throw new Error('OpenAI no está configurado. Verifica OPENAI_API_KEY en .env.local')
  }

  const startTime = Date.now()

  // Construir contexto adicional si hay documentos de conocimiento
  let contextoAdicional = ''
  if (conocimientoBase.length > 0) {
    contextoAdicional = '\n\n## Documentos de referencia relevantes:\n'
    conocimientoBase.forEach((doc, i) => {
      contextoAdicional += `\n### ${i + 1}. ${doc.titulo} (${doc.categoria})\n${doc.contenido}\n`
    })
  }

  // Construir mensajes para la API
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    {
      role: 'system',
      content: SYSTEM_PROMPT + contextoAdicional,
    },
    ...historialMensajes.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
    {
      role: 'user',
      content: mensajeUsuario,
    },
  ]

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Modelo económico pero capaz
      messages,
      temperature: 0.7,
      max_tokens: 1500,
    })

    const latencia = Date.now() - startTime
    const respuesta = completion.choices[0]?.message?.content || 'No pude generar una respuesta.'

    // Extraer fuentes mencionadas en la respuesta
    const fuentes = extraerFuentes(respuesta)

    return {
      texto: respuesta,
      fuentes,
      modelo: completion.model,
      tokens_input: completion.usage?.prompt_tokens || 0,
      tokens_output: completion.usage?.completion_tokens || 0,
      latencia_ms: latencia,
    }
  } catch (error) {
    console.error('Error en OpenAI:', error)
    throw error
  }
}

// Extraer fuentes legales mencionadas en la respuesta
function extraerFuentes(texto: string): { titulo: string; contenido: string }[] {
  const fuentes: { titulo: string; contenido: string }[] = []

  // Patrones comunes de fuentes legales chilenas
  const patrones = [
    /Art(?:ículo|\.)\s*(\d+)\s*(?:de la\s*)?(LIR|Ley de Impuesto a la Renta)/gi,
    /Art(?:ículo|\.)\s*(\d+)\s*(?:del\s*)?(DL\s*825|Decreto Ley 825)/gi,
    /Circular\s*(?:SII\s*)?(?:N°?\s*)?(\d+)/gi,
    /Resolución\s*(?:Ex\.\s*)?(?:N°?\s*)?(\d+)/gi,
  ]

  patrones.forEach((patron) => {
    let match: RegExpExecArray | null
    while ((match = patron.exec(texto)) !== null) {
      const fuenteTexto = match[0]
      if (!fuentes.some((f) => f.titulo === fuenteTexto)) {
        fuentes.push({
          titulo: fuenteTexto,
          contenido: 'Fuente normativa citada en la respuesta',
        })
      }
    }
  })

  return fuentes.slice(0, 5) // Máximo 5 fuentes
}

// Verificar si OpenAI está disponible
export function isOpenAIConfigured(): boolean {
  return !!openai
}

// ============================================
// FUNCIONES DE EMBEDDINGS PARA RAG
// ============================================

// Modelo de embeddings de OpenAI
const EMBEDDING_MODEL = 'text-embedding-3-small'
const EMBEDDING_DIMENSIONS = 1536

// Generar embedding para un texto
export async function generarEmbedding(texto: string): Promise<number[]> {
  if (!openai) {
    throw new Error('OpenAI no está configurado')
  }

  try {
    const response = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: texto.slice(0, 8000), // Límite de tokens
      dimensions: EMBEDDING_DIMENSIONS,
    })

    return response.data[0].embedding
  } catch (error) {
    console.error('Error generando embedding:', error)
    throw error
  }
}

// Generar embeddings para múltiples textos (batch)
export async function generarEmbeddingsBatch(textos: string[]): Promise<number[][]> {
  if (!openai) {
    throw new Error('OpenAI no está configurado')
  }

  try {
    const response = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: textos.map(t => t.slice(0, 8000)),
      dimensions: EMBEDDING_DIMENSIONS,
    })

    return response.data.map(d => d.embedding)
  } catch (error) {
    console.error('Error generando embeddings batch:', error)
    throw error
  }
}

// Interfaz para documentos con similitud
export interface DocumentoConSimilitud {
  id: string
  titulo: string
  contenido: string
  categoria: string
  similarity: number
}

// TODO: Phase 2 - Implement vector search in Convex
// Was: Supabase RPC 'search_documentos_conocimiento' with pgvector
// Buscar documentos similares (stub - returns empty until Convex vector search is implemented)
export async function buscarDocumentosRelevantes(
  _supabaseClient: any,
  _pregunta: string,
  _limite: number = 3,
  _umbralSimilitud: number = 0.5
): Promise<DocumentoConSimilitud[]> {
  // Stub: returns empty array until Convex vector search module is implemented
  return []
}
