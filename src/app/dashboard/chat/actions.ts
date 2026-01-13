'use server'

import { createClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'
import type { Database } from '@/types/database.types'
import { generarRespuestaOpenAI, isOpenAIConfigured, buscarDocumentosRelevantes, type ChatMessage } from '@/lib/openai'

type ChatSesion = Database['public']['Tables']['chat_sesiones']['Row']
type ChatMensaje = Database['public']['Tables']['chat_mensajes']['Row']

export interface SesionConMensajes extends ChatSesion {
  mensajes: ChatMensaje[]
  ultimo_mensaje?: string
}

export interface MensajeConFuentes extends ChatMensaje {
  fuentes_parsed: { titulo: string; contenido: string }[]
}

// Obtener sesiones del usuario
export async function getSesiones(): Promise<SesionConMensajes[]> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('chat_sesiones')
    .select(`
      *,
      mensajes:chat_mensajes(*)
    `)
    .eq('usuario_id', user.id)
    .eq('activa', true)
    .order('updated_at', { ascending: false })
    .limit(20)

  if (error) {
    console.error('Error fetching sesiones:', error)
    return []
  }

  return (data || []).map(s => ({
    ...s,
    ultimo_mensaje: (s.mensajes as ChatMensaje[])?.slice(-1)[0]?.contenido?.substring(0, 50) || '',
    mensajes: s.mensajes as ChatMensaje[],
  }))
}

// Obtener o crear sesión activa
export async function getOrCreateSesion(sesionId?: string): Promise<SesionConMensajes | null> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()

  // Si hay sesionId, intentar obtenerla
  if (sesionId) {
    const { data } = await supabase
      .from('chat_sesiones')
      .select(`*, mensajes:chat_mensajes(*)`)
      .eq('id', sesionId)
      .single()

    if (data) {
      return {
        ...data,
        mensajes: (data.mensajes as ChatMensaje[]) || [],
      }
    }
  }

  // Si no hay usuario autenticado, retornar sesión demo
  if (!user) {
    // Retornar sesión demo sin persistir en DB
    return {
      id: 'demo-session',
      usuario_id: 'demo',
      titulo: 'Sesión de demostración',
      activa: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      mensajes: [{
        id: 'welcome-msg',
        sesion_id: 'demo-session',
        rol: 'assistant',
        contenido: '¡Hola! Soy HV-Chat, tu asistente de inteligencia artificial para consultas contables y tributarias chilenas. Puedo ayudarte con:\n\n• Normativa del SII\n• Formularios F29 y F22\n• Régimen tributario (14A, 14D)\n• IVA, PPM y retenciones\n• Plazos y procedimientos\n\n⚠️ **Modo Demo**: Inicia sesión para guardar tus conversaciones.\n\n¿En qué puedo ayudarte hoy?',
        created_at: new Date().toISOString(),
        fuentes: null,
        tokens_input: null,
        tokens_output: null,
        modelo_usado: null,
        latencia_ms: null,
      }],
    }
  }

  // Crear nueva sesión para usuario autenticado
  const { data: nuevaSesion, error } = await supabase
    .from('chat_sesiones')
    .insert({
      usuario_id: user.id,
      titulo: 'Nueva conversación',
      activa: true,
    })
    .select()
    .single()

  if (error || !nuevaSesion) {
    console.error('Error creating sesion:', error)
    // Retornar sesión demo como fallback
    return {
      id: 'demo-session',
      usuario_id: user.id,
      titulo: 'Sesión temporal',
      activa: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      mensajes: [{
        id: 'welcome-msg',
        sesion_id: 'demo-session',
        rol: 'assistant',
        contenido: '¡Hola! Soy HV-Chat, tu asistente para consultas contables y tributarias.\n\n¿En qué puedo ayudarte hoy?',
        created_at: new Date().toISOString(),
        fuentes: null,
        tokens_input: null,
        tokens_output: null,
        modelo_usado: null,
        latencia_ms: null,
      }],
    }
  }

  // Agregar mensaje de bienvenida
  await supabase.from('chat_mensajes').insert({
    sesion_id: nuevaSesion.id,
    rol: 'assistant',
    contenido: '¡Hola! Soy HV-Chat, tu asistente de inteligencia artificial para consultas contables y tributarias chilenas. Puedo ayudarte con:\n\n• Normativa del SII\n• Formularios F29 y F22\n• Régimen tributario (14A, 14D)\n• IVA, PPM y retenciones\n• Plazos y procedimientos\n\n¿En qué puedo ayudarte hoy?',
  })

  return {
    ...nuevaSesion,
    mensajes: [],
  }
}

// Enviar mensaje y obtener respuesta
export async function enviarMensaje(
  sesionId: string,
  contenido: string
): Promise<{ success: boolean; respuesta?: ChatMensaje; error?: string }> {
  const supabase = createClient()

  // Buscar en base de conocimiento
  const { data: conocimiento } = await supabase
    .from('documentos_conocimiento')
    .select('titulo, contenido, categoria')
    .eq('activo', true)
    .limit(3)

  // Si es sesión demo, solo generar respuesta sin guardar en DB
  if (sesionId === 'demo-session') {
    try {
      const respuestaData = await generarRespuestaIA(contenido, [], conocimiento || [])

      const respuestaDemo: ChatMensaje = {
        id: `demo-${Date.now()}`,
        sesion_id: 'demo-session',
        rol: 'assistant',
        contenido: respuestaData.texto,
        fuentes: respuestaData.fuentes as any,
        created_at: new Date().toISOString(),
        tokens_input: respuestaData.tokens_input,
        tokens_output: respuestaData.tokens_output,
        modelo_usado: respuestaData.modelo,
        latencia_ms: respuestaData.latencia_ms,
      }

      return { success: true, respuesta: respuestaDemo }
    } catch (error) {
      console.error('Error generando respuesta demo:', error)
      // Fallback a respuestas predefinidas
      const respuestaFallback = generarRespuestaFallback(contenido, conocimiento || [])
      const respuestaDemo: ChatMensaje = {
        id: `demo-${Date.now()}`,
        sesion_id: 'demo-session',
        rol: 'assistant',
        contenido: respuestaFallback.texto,
        fuentes: respuestaFallback.fuentes as any,
        created_at: new Date().toISOString(),
        tokens_input: null,
        tokens_output: null,
        modelo_usado: 'hv-chat-fallback',
        latencia_ms: null,
      }
      return { success: true, respuesta: respuestaDemo }
    }
  }

  // Guardar mensaje del usuario
  const { error: userMsgError } = await supabase.from('chat_mensajes').insert({
    sesion_id: sesionId,
    rol: 'user',
    contenido: contenido,
  })

  if (userMsgError) {
    return { success: false, error: userMsgError.message }
  }

  // Obtener historial de mensajes para contexto
  const { data: historial } = await supabase
    .from('chat_mensajes')
    .select('rol, contenido')
    .eq('sesion_id', sesionId)
    .order('created_at', { ascending: true })
    .limit(10)

  const historialFormateado: ChatMessage[] = (historial || [])
    .filter((m) => m.rol === 'user' || m.rol === 'assistant')
    .map((m) => ({
      role: m.rol as 'user' | 'assistant',
      content: m.contenido || '',
    }))

  // Generar respuesta con IA
  let respuestaData: {
    texto: string
    fuentes: { titulo: string; contenido: string }[]
    modelo: string
    tokens_input: number | null
    tokens_output: number | null
    latencia_ms: number | null
  }

  try {
    respuestaData = await generarRespuestaIA(contenido, historialFormateado, conocimiento || [])
  } catch (error) {
    console.error('Error generando respuesta IA:', error)
    // Fallback a respuestas predefinidas
    const fallback = generarRespuestaFallback(contenido, conocimiento || [])
    respuestaData = {
      ...fallback,
      modelo: 'hv-chat-fallback',
      tokens_input: null,
      tokens_output: null,
      latencia_ms: null,
    }
  }

  // Guardar respuesta del asistente
  const { data: respuesta, error: assistantError } = await supabase
    .from('chat_mensajes')
    .insert({
      sesion_id: sesionId,
      rol: 'assistant',
      contenido: respuestaData.texto,
      fuentes: respuestaData.fuentes,
      modelo_usado: respuestaData.modelo,
      tokens_input: respuestaData.tokens_input,
      tokens_output: respuestaData.tokens_output,
      latencia_ms: respuestaData.latencia_ms,
    })
    .select()
    .single()

  if (assistantError) {
    return { success: false, error: assistantError.message }
  }

  // Actualizar título de la sesión si es el primer mensaje real
  const { count: mensajesCount } = await supabase
    .from('chat_mensajes')
    .select('id', { count: 'exact', head: true })
    .eq('sesion_id', sesionId)

  if (mensajesCount === 3) { // bienvenida + user + assistant
    await supabase
      .from('chat_sesiones')
      .update({
        titulo: contenido.substring(0, 50) + (contenido.length > 50 ? '...' : ''),
        updated_at: new Date().toISOString(),
      })
      .eq('id', sesionId)
  }

  revalidatePath('/dashboard/chat')
  return { success: true, respuesta }
}

// Función principal para generar respuestas con IA (con RAG)
async function generarRespuestaIA(
  pregunta: string,
  historial: ChatMessage[],
  conocimientoBasico: { titulo: string; contenido: string; categoria: string }[]
): Promise<{
  texto: string
  fuentes: { titulo: string; contenido: string }[]
  modelo: string
  tokens_input: number | null
  tokens_output: number | null
  latencia_ms: number | null
}> {
  // Verificar si OpenAI está configurado
  if (!isOpenAIConfigured()) {
    console.log('OpenAI no configurado, usando respuestas predefinidas')
    const fallback = generarRespuestaFallback(pregunta, conocimientoBasico)
    return {
      ...fallback,
      modelo: 'hv-chat-local',
      tokens_input: null,
      tokens_output: null,
      latencia_ms: null,
    }
  }

  const supabase = createClient()

  // RAG: Buscar documentos relevantes usando búsqueda semántica
  let conocimientoRAG: { titulo: string; contenido: string; categoria: string }[] = []

  try {
    const documentosRelevantes = await buscarDocumentosRelevantes(supabase, pregunta, 3, 0.5)

    if (documentosRelevantes.length > 0) {
      console.log(`RAG: Encontrados ${documentosRelevantes.length} documentos relevantes`)
      conocimientoRAG = documentosRelevantes.map(doc => ({
        titulo: doc.titulo,
        contenido: doc.contenido,
        categoria: doc.categoria,
      }))
    }
  } catch (error) {
    console.log('RAG: Error en búsqueda semántica, continuando sin RAG:', error)
  }

  // Combinar conocimiento básico con RAG (priorizando RAG)
  const conocimientoCombinado = [...conocimientoRAG, ...conocimientoBasico].slice(0, 5)

  // Usar OpenAI con el conocimiento combinado
  const respuesta = await generarRespuestaOpenAI(pregunta, historial, conocimientoCombinado)

  // Agregar fuentes de RAG a las fuentes extraídas
  const fuentesRAG = conocimientoRAG.map(doc => ({
    titulo: doc.titulo,
    contenido: `Categoría: ${doc.categoria}`,
  }))

  return {
    texto: respuesta.texto,
    fuentes: [...fuentesRAG, ...respuesta.fuentes].slice(0, 5),
    modelo: respuesta.modelo + (conocimientoRAG.length > 0 ? ' + RAG' : ''),
    tokens_input: respuesta.tokens_input,
    tokens_output: respuesta.tokens_output,
    latencia_ms: respuesta.latencia_ms,
  }
}

// Función de fallback para generar respuestas predefinidas (cuando OpenAI no está disponible)
function generarRespuestaFallback(
  pregunta: string,
  conocimiento: { titulo: string; contenido: string; categoria: string }[]
): { texto: string; fuentes: any[] } {
  const preguntaLower = pregunta.toLowerCase()

  // Respuestas predefinidas basadas en palabras clave
  if (preguntaLower.includes('f29') || preguntaLower.includes('formulario 29')) {
    return {
      texto: `El Formulario 29 es la declaración mensual de IVA y otros impuestos ante el SII. Contiene:

**Débito Fiscal (Código 89):** IVA de tus ventas
**Crédito Fiscal (Código 538):** IVA de tus compras
**PPM (Código 563):** Pagos Provisionales Mensuales

**Plazos de declaración:**
- Contribuyentes con factura electrónica: hasta el día 20
- Otros contribuyentes: hasta el día 12

**Importante:** Si tienes crédito fiscal mayor al débito, el remanente se acumula para el próximo período, actualizado por IPC.`,
      fuentes: [
        { titulo: 'Circular SII N° 42', contenido: 'Instrucciones sobre F29' },
        { titulo: 'Manual F29 SII', contenido: 'Procedimientos de declaración' },
      ],
    }
  }

  if (preguntaLower.includes('ppm') || preguntaLower.includes('pago provisional')) {
    return {
      texto: `Los **Pagos Provisionales Mensuales (PPM)** son anticipos del Impuesto a la Renta que deben realizar las empresas.

**Cálculo:**
PPM = Ingresos Brutos × Tasa PPM

**Tasas comunes:**
- Régimen General: Variable según resultado anterior
- Régimen 14D N°3: 0.25%
- Régimen 14D N°8: Exento de PPM

**Declaración:** Se declaran mensualmente en el F29, código 563.

**Créditos:** Los PPM pagados se imputan contra el Impuesto de Primera Categoría en la declaración anual (F22).`,
      fuentes: [
        { titulo: 'Art. 84 LIR', contenido: 'Normas sobre PPM' },
      ],
    }
  }

  if (preguntaLower.includes('14d') || preguntaLower.includes('régimen') || preguntaLower.includes('pyme')) {
    return {
      texto: `Los regímenes tributarios del artículo 14 de la LIR son:

**14A - Régimen General:**
- Tributación completa
- Crédito por IDPC al 65%
- Sin límites de ventas

**14D N°3 - Pro Pyme General:**
- Hasta 75.000 UF de ventas anuales
- Tributación sobre base devengada
- PPM reducido (0.25%)

**14D N°8 - Pro Pyme Transparente:**
- Hasta 75.000 UF de ventas
- Sin tributación a nivel de empresa
- Socios tributan directamente
- Exento de PPM

**Recomendación:** Para determinar el régimen óptimo, analiza el nivel de retiros vs utilidades retenidas.`,
      fuentes: [
        { titulo: 'Art. 14 LIR', contenido: 'Regímenes tributarios' },
        { titulo: 'Circular 62/2020', contenido: 'Reforma tributaria' },
      ],
    }
  }

  if (preguntaLower.includes('iva') || preguntaLower.includes('impuesto al valor')) {
    return {
      texto: `El **IVA (Impuesto al Valor Agregado)** en Chile:

**Tasa:** 19% sobre el valor neto

**Cálculo:**
- IVA Débito: 19% de tus ventas afectas
- IVA Crédito: 19% de tus compras afectas
- IVA a Pagar = Débito - Crédito

**Operaciones exentas comunes:**
- Exportaciones
- Transporte internacional
- Intereses financieros
- Arriendos de inmuebles sin muebles

**Documentos:**
- Factura electrónica (afecta)
- Factura exenta
- Boleta electrónica
- Nota de crédito/débito`,
      fuentes: [
        { titulo: 'DL 825', contenido: 'Ley del IVA' },
      ],
    }
  }

  // Respuesta genérica
  return {
    texto: `Gracias por tu consulta. Para darte una respuesta más precisa, ¿podrías especificar si tu pregunta está relacionada con:

1. **Declaraciones mensuales** (F29, IVA, PPM)
2. **Declaración anual** (F22, Renta)
3. **Régimen tributario** (14A, 14D, Pro Pyme)
4. **Documentos tributarios** (Facturas, Boletas)
5. **Otro tema contable/tributario**

También puedo ayudarte con consultas sobre la normativa del SII, plazos, y procedimientos específicos.`,
    fuentes: [],
  }
}

// Dar feedback a un mensaje
export async function darFeedback(
  mensajeId: string,
  rating: 1 | 5,
  comentario?: string
): Promise<{ success: boolean }> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false }

  await supabase.from('chat_feedback').insert({
    mensaje_id: mensajeId,
    usuario_id: user.id,
    rating,
    comentario,
  })

  return { success: true }
}

// Eliminar sesión
export async function eliminarSesion(sesionId: string): Promise<{ success: boolean }> {
  const supabase = createClient()

  await supabase
    .from('chat_sesiones')
    .update({ activa: false })
    .eq('id', sesionId)

  revalidatePath('/dashboard/chat')
  return { success: true }
}
