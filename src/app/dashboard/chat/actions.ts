// @ts-nocheck — temporary: remove after full migration
'use server'

import { ConvexHttpClient } from "convex/browser"
import { api } from "../../../../convex/_generated/api"
import { revalidatePath } from 'next/cache'
import { generarRespuestaOpenAI, isOpenAIConfigured, type ChatMessage } from '@/lib/openai'

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!)
const DEMO_USER_ID = 'demo-user'

type ChatSesion = {
  id: string
  usuario_id: string
  titulo: string
  activa: boolean
  created_at: string
  updated_at: string
}

type ChatMensaje = {
  id: string
  sesion_id: string
  rol: string
  contenido: string
  created_at: string
  fuentes: any
  tokens_input: number | null
  tokens_output: number | null
  modelo_usado: string | null
  latencia_ms: number | null
}

export interface SesionConMensajes extends ChatSesion {
  mensajes: ChatMensaje[]
  ultimo_mensaje?: string
}

export interface MensajeConFuentes extends ChatMensaje {
  fuentes_parsed: { titulo: string; contenido: string }[]
}

// Obtener sesiones del usuario
export async function getSesiones(): Promise<SesionConMensajes[]> {
  try {
    const data = await convex.query(api.chat.listChatSesiones, {
      usuario_id: DEMO_USER_ID,
      activa: true,
    })

    if (!data || data.length === 0) return []

    // For each session, get its messages
    const sesiones: SesionConMensajes[] = []
    for (const s of data) {
      const mensajes = await convex.query(api.chat.getChatMensajes, {
        sesion_id: s._id as any,
      })

      const mappedMensajes: ChatMensaje[] = (mensajes || []).map((m: any) => ({
        id: m._id ?? m.id,
        sesion_id: m.sesion_id,
        rol: m.rol,
        contenido: m.contenido,
        created_at: m._creationTime ? new Date(m._creationTime).toISOString() : m.created_at,
        fuentes: m.fuentes ?? null,
        tokens_input: m.tokens_input ?? null,
        tokens_output: m.tokens_output ?? null,
        modelo_usado: m.modelo_usado ?? null,
        latencia_ms: m.latencia_ms ?? null,
      }))

      sesiones.push({
        id: s._id ?? s.id,
        usuario_id: s.usuario_id,
        titulo: s.titulo ?? 'Nueva conversacion',
        activa: s.activa ?? true,
        created_at: s._creationTime ? new Date(s._creationTime).toISOString() : s.created_at,
        updated_at: s.updated_at ?? new Date().toISOString(),
        mensajes: mappedMensajes,
        ultimo_mensaje: mappedMensajes.slice(-1)[0]?.contenido?.substring(0, 50) || '',
      })
    }

    return sesiones
  } catch (error) {
    console.error('Error fetching sesiones:', error)
    return []
  }
}

// Obtener o crear sesion activa
export async function getOrCreateSesion(sesionId?: string): Promise<SesionConMensajes | null> {
  // Si hay sesionId, intentar obtenerla
  if (sesionId && sesionId !== 'demo-session') {
    try {
      const data = await convex.query(api.chat.getChatSesion, {
        id: sesionId as any,
      })

      if (data) {
        const mensajes = await convex.query(api.chat.getChatMensajes, {
          sesion_id: data._id as any,
        })

        const mappedMensajes: ChatMensaje[] = (mensajes || []).map((m: any) => ({
          id: m._id ?? m.id,
          sesion_id: m.sesion_id,
          rol: m.rol,
          contenido: m.contenido,
          created_at: m._creationTime ? new Date(m._creationTime).toISOString() : m.created_at,
          fuentes: m.fuentes ?? null,
          tokens_input: m.tokens_input ?? null,
          tokens_output: m.tokens_output ?? null,
          modelo_usado: m.modelo_usado ?? null,
          latencia_ms: m.latencia_ms ?? null,
        }))

        return {
          id: data._id ?? data.id,
          usuario_id: data.usuario_id,
          titulo: data.titulo ?? 'Nueva conversacion',
          activa: data.activa ?? true,
          created_at: data._creationTime ? new Date(data._creationTime).toISOString() : data.created_at,
          updated_at: data.updated_at ?? new Date().toISOString(),
          mensajes: mappedMensajes,
        }
      }
    } catch (error) {
      console.error('Error fetching session:', error)
    }
  }

  // Si es sesion demo o no hay Convex URL
  if (sesionId === 'demo-session' || !process.env.NEXT_PUBLIC_CONVEX_URL) {
    return {
      id: 'demo-session',
      usuario_id: 'demo',
      titulo: 'Sesion de demostracion',
      activa: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      mensajes: [{
        id: 'welcome-msg',
        sesion_id: 'demo-session',
        rol: 'assistant',
        contenido: '!Hola! Soy HV-Chat, tu asistente de inteligencia artificial para consultas contables y tributarias chilenas. Puedo ayudarte con:\n\n- Normativa del SII\n- Formularios F29 y F22\n- Regimen tributario (14A, 14D)\n- IVA, PPM y retenciones\n- Plazos y procedimientos\n\n**Modo Demo**: Inicia sesion para guardar tus conversaciones.\n\nEn que puedo ayudarte hoy?',
        created_at: new Date().toISOString(),
        fuentes: null,
        tokens_input: null,
        tokens_output: null,
        modelo_usado: null,
        latencia_ms: null,
      }],
    }
  }

  // Crear nueva sesion para usuario
  try {
    const nuevaSesionId = await convex.mutation(api.chat.createChatSesion, {
      usuario_id: DEMO_USER_ID,
      titulo: 'Nueva conversacion',
    })

    // Agregar mensaje de bienvenida
    await convex.mutation(api.chat.sendChatMensaje, {
      sesion_id: nuevaSesionId as any,
      rol: 'assistant',
      contenido: '!Hola! Soy HV-Chat, tu asistente de inteligencia artificial para consultas contables y tributarias chilenas. Puedo ayudarte con:\n\n- Normativa del SII\n- Formularios F29 y F22\n- Regimen tributario (14A, 14D)\n- IVA, PPM y retenciones\n- Plazos y procedimientos\n\nEn que puedo ayudarte hoy?',
    })

    return {
      id: nuevaSesionId as any,
      usuario_id: DEMO_USER_ID,
      titulo: 'Nueva conversacion',
      activa: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      mensajes: [],
    }
  } catch (error) {
    console.error('Error creating sesion:', error)
    // Retornar sesion demo como fallback
    return {
      id: 'demo-session',
      usuario_id: DEMO_USER_ID,
      titulo: 'Sesion temporal',
      activa: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      mensajes: [{
        id: 'welcome-msg',
        sesion_id: 'demo-session',
        rol: 'assistant',
        contenido: '!Hola! Soy HV-Chat, tu asistente para consultas contables y tributarias.\n\nEn que puedo ayudarte hoy?',
        created_at: new Date().toISOString(),
        fuentes: null,
        tokens_input: null,
        tokens_output: null,
        modelo_usado: null,
        latencia_ms: null,
      }],
    }
  }
}

// Enviar mensaje y obtener respuesta
export async function enviarMensaje(
  sesionId: string,
  contenido: string
): Promise<{ success: boolean; respuesta?: ChatMensaje; error?: string }> {
  // Basic knowledge for IA context (no Supabase RAG)
  const conocimiento: { titulo: string; contenido: string; categoria: string }[] = []

  // Si es sesion demo, solo generar respuesta sin guardar en DB
  if (sesionId === 'demo-session') {
    try {
      const respuestaData = await generarRespuestaIA(contenido, [], conocimiento)

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
      const respuestaFallback = generarRespuestaFallback(contenido, conocimiento)
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

  try {
    // Guardar mensaje del usuario via Convex
    await convex.mutation(api.chat.sendChatMensaje, {
      sesion_id: sesionId as any,
      rol: 'user',
      contenido: contenido,
    })

    // Obtener historial de mensajes para contexto
    const historial = await convex.query(api.chat.getChatMensajes, {
      sesion_id: sesionId as any,
      limit: 10,
    })

    const historialFormateado: ChatMessage[] = (historial || [])
      .filter((m: any) => m.rol === 'user' || m.rol === 'assistant')
      .map((m: any) => ({
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
      respuestaData = await generarRespuestaIA(contenido, historialFormateado, conocimiento)
    } catch (error) {
      console.error('Error generando respuesta IA:', error)
      // Fallback a respuestas predefinidas
      const fallback = generarRespuestaFallback(contenido, conocimiento)
      respuestaData = {
        ...fallback,
        modelo: 'hv-chat-fallback',
        tokens_input: null,
        tokens_output: null,
        latencia_ms: null,
      }
    }

    // Guardar respuesta del asistente via Convex
    const respuestaId = await convex.mutation(api.chat.sendChatMensaje, {
      sesion_id: sesionId as any,
      rol: 'assistant',
      contenido: respuestaData.texto,
      fuentes: respuestaData.fuentes as any,
      modelo_usado: respuestaData.modelo,
    })

    const respuesta: ChatMensaje = {
      id: respuestaId as any,
      sesion_id: sesionId,
      rol: 'assistant',
      contenido: respuestaData.texto,
      fuentes: respuestaData.fuentes as any,
      created_at: new Date().toISOString(),
      tokens_input: respuestaData.tokens_input,
      tokens_output: respuestaData.tokens_output,
      modelo_usado: respuestaData.modelo,
      latencia_ms: respuestaData.latencia_ms,
    }

    // Actualizar titulo de la sesion si es el primer mensaje real
    const allMensajes = await convex.query(api.chat.getChatMensajes, {
      sesion_id: sesionId as any,
    })

    if (allMensajes && allMensajes.length === 3) { // bienvenida + user + assistant
      try {
        await convex.mutation(api.chat.updateSesionTitulo, {
          id: sesionId as any,
          titulo: contenido.substring(0, 50) + (contenido.length > 50 ? '...' : ''),
        })
      } catch (e) {
        console.error('Error updating session title:', e)
      }
    }

    revalidatePath('/dashboard/chat')
    return { success: true, respuesta }
  } catch (error) {
    console.error('Error in enviarMensaje:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Error enviando mensaje' }
  }
}

// Funcion principal para generar respuestas con IA
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
  // Verificar si OpenAI esta configurado
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

  // Use the basic knowledge passed in (no Supabase RAG)
  const conocimientoCombinado = conocimientoBasico.slice(0, 5)

  // Usar OpenAI con el conocimiento combinado
  const respuesta = await generarRespuestaOpenAI(pregunta, historial, conocimientoCombinado)

  return {
    texto: respuesta.texto,
    fuentes: respuesta.fuentes.slice(0, 5),
    modelo: respuesta.modelo,
    tokens_input: respuesta.tokens_input,
    tokens_output: respuesta.tokens_output,
    latencia_ms: respuesta.latencia_ms,
  }
}

// Funcion de fallback para generar respuestas predefinidas (cuando OpenAI no esta disponible)
function generarRespuestaFallback(
  pregunta: string,
  conocimiento: { titulo: string; contenido: string; categoria: string }[]
): { texto: string; fuentes: any[] } {
  const preguntaLower = pregunta.toLowerCase()

  // Respuestas predefinidas basadas en palabras clave
  if (preguntaLower.includes('f29') || preguntaLower.includes('formulario 29')) {
    return {
      texto: `El Formulario 29 es la declaracion mensual de IVA y otros impuestos ante el SII. Contiene:

**Debito Fiscal (Codigo 89):** IVA de tus ventas
**Credito Fiscal (Codigo 538):** IVA de tus compras
**PPM (Codigo 563):** Pagos Provisionales Mensuales

**Plazos de declaracion:**
- Contribuyentes con factura electronica: hasta el dia 20
- Otros contribuyentes: hasta el dia 12

**Importante:** Si tienes credito fiscal mayor al debito, el remanente se acumula para el proximo periodo, actualizado por IPC.`,
      fuentes: [
        { titulo: 'Circular SII N 42', contenido: 'Instrucciones sobre F29' },
        { titulo: 'Manual F29 SII', contenido: 'Procedimientos de declaracion' },
      ],
    }
  }

  if (preguntaLower.includes('ppm') || preguntaLower.includes('pago provisional')) {
    return {
      texto: `Los **Pagos Provisionales Mensuales (PPM)** son anticipos del Impuesto a la Renta que deben realizar las empresas.

**Calculo:**
PPM = Ingresos Brutos x Tasa PPM

**Tasas comunes:**
- Regimen General: Variable segun resultado anterior
- Regimen 14D N3: 0.25%
- Regimen 14D N8: Exento de PPM

**Declaracion:** Se declaran mensualmente en el F29, codigo 563.

**Creditos:** Los PPM pagados se imputan contra el Impuesto de Primera Categoria en la declaracion anual (F22).`,
      fuentes: [
        { titulo: 'Art. 84 LIR', contenido: 'Normas sobre PPM' },
      ],
    }
  }

  if (preguntaLower.includes('14d') || preguntaLower.includes('regimen') || preguntaLower.includes('pyme')) {
    return {
      texto: `Los regimenes tributarios del articulo 14 de la LIR son:

**14A - Regimen General:**
- Tributacion completa
- Credito por IDPC al 65%
- Sin limites de ventas

**14D N3 - Pro Pyme General:**
- Hasta 75.000 UF de ventas anuales
- Tributacion sobre base devengada
- PPM reducido (0.25%)

**14D N8 - Pro Pyme Transparente:**
- Hasta 75.000 UF de ventas
- Sin tributacion a nivel de empresa
- Socios tributan directamente
- Exento de PPM

**Recomendacion:** Para determinar el regimen optimo, analiza el nivel de retiros vs utilidades retenidas.`,
      fuentes: [
        { titulo: 'Art. 14 LIR', contenido: 'Regimenes tributarios' },
        { titulo: 'Circular 62/2020', contenido: 'Reforma tributaria' },
      ],
    }
  }

  if (preguntaLower.includes('iva') || preguntaLower.includes('impuesto al valor')) {
    return {
      texto: `El **IVA (Impuesto al Valor Agregado)** en Chile:

**Tasa:** 19% sobre el valor neto

**Calculo:**
- IVA Debito: 19% de tus ventas afectas
- IVA Credito: 19% de tus compras afectas
- IVA a Pagar = Debito - Credito

**Operaciones exentas comunes:**
- Exportaciones
- Transporte internacional
- Intereses financieros
- Arriendos de inmuebles sin muebles

**Documentos:**
- Factura electronica (afecta)
- Factura exenta
- Boleta electronica
- Nota de credito/debito`,
      fuentes: [
        { titulo: 'DL 825', contenido: 'Ley del IVA' },
      ],
    }
  }

  // Respuesta generica
  return {
    texto: `Gracias por tu consulta. Para darte una respuesta mas precisa, podrias especificar si tu pregunta esta relacionada con:

1. **Declaraciones mensuales** (F29, IVA, PPM)
2. **Declaracion anual** (F22, Renta)
3. **Regimen tributario** (14A, 14D, Pro Pyme)
4. **Documentos tributarios** (Facturas, Boletas)
5. **Otro tema contable/tributario**

Tambien puedo ayudarte con consultas sobre la normativa del SII, plazos, y procedimientos especificos.`,
    fuentes: [],
  }
}

// Dar feedback a un mensaje
export async function darFeedback(
  mensajeId: string,
  rating: 1 | 5,
  comentario?: string
): Promise<{ success: boolean }> {
  // TODO: Implement chat feedback in Convex when available
  // For now, just return success in demo mode
  console.log('Feedback received (demo mode):', { mensajeId, rating, comentario })
  return { success: true }
}

// Eliminar sesion
export async function eliminarSesion(sesionId: string): Promise<{ success: boolean }> {
  try {
    await convex.mutation(api.chat.archiveChatSesion, {
      id: sesionId as any,
    })

    revalidatePath('/dashboard/chat')
    return { success: true }
  } catch (error) {
    console.error('Error deleting session:', error)
    return { success: true } // Return true anyway for demo mode
  }
}
