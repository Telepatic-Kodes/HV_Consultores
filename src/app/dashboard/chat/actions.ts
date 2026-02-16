'use server'

import { ConvexHttpClient } from "convex/browser"
import { api } from "../../../../convex/_generated/api"
import { Id } from "../../../../convex/_generated/dataModel"
import { revalidatePath } from 'next/cache'
import { generarRespuestaOpenAI, isOpenAIConfigured, type ChatMessage } from '@/lib/openai'

import { getServerProfileId } from '@/lib/auth-server'

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!)

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
    const profileId = await getServerProfileId()
    const data = await convex.query(api.chat.listChatSesiones, {
      usuario_id: profileId,
      activa: true,
    })

    if (!data || data.length === 0) return []

    // For each session, get its messages
    const sesiones: SesionConMensajes[] = []
    for (const s of data) {
      const mensajes = await convex.query(api.chat.getChatMensajes, {
        sesion_id: s._id,
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
        id: s._id,
        usuario_id: s.usuario_id as string,
        titulo: s.titulo ?? 'Nueva conversacion',
        activa: s.activa ?? true,
        created_at: s._creationTime ? new Date(s._creationTime).toISOString() : (s.created_at ?? new Date().toISOString()),
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
  if (sesionId) {
    try {
      const data = await convex.query(api.chat.getChatSesion, {
        id: sesionId as Id<"chat_sesiones">,
      })

      if (data) {
        const mensajes = await convex.query(api.chat.getChatMensajes, {
          sesion_id: data._id,
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
          id: data._id,
          usuario_id: data.usuario_id as string,
          titulo: data.titulo ?? 'Nueva conversacion',
          activa: data.activa ?? true,
          created_at: data._creationTime ? new Date(data._creationTime).toISOString() : (data.created_at ?? new Date().toISOString()),
          updated_at: data.updated_at ?? new Date().toISOString(),
          mensajes: mappedMensajes,
        }
      }
    } catch (error) {
      console.error('Error fetching session:', error)
    }
  }

  // Crear nueva sesion para usuario
  try {
    const profileId = await getServerProfileId()
    const nuevaSesionId = await convex.mutation(api.chat.createChatSesion, {
      usuario_id: profileId,
      titulo: 'Nueva conversacion',
    })

    // Agregar mensaje de bienvenida
    await convex.mutation(api.chat.sendChatMensaje, {
      sesion_id: nuevaSesionId,
      rol: 'assistant',
      contenido: '!Hola! Soy HV-Chat, tu asistente de inteligencia artificial para consultas contables y tributarias chilenas. Puedo ayudarte con:\n\n- Normativa del SII\n- Formularios F29 y F22\n- Regimen tributario (14A, 14D)\n- IVA, PPM y retenciones\n- Plazos y procedimientos\n\nEn que puedo ayudarte hoy?',
    })

    return {
      id: nuevaSesionId as string,
      usuario_id: profileId as any as string,
      titulo: 'Nueva conversacion',
      activa: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      mensajes: [],
    }
  } catch (error) {
    console.error('Error creating sesion:', error)
    return null
  }
}

// Enviar mensaje y obtener respuesta
export async function enviarMensaje(
  sesionId: string,
  contenido: string
): Promise<{ success: boolean; respuesta?: ChatMensaje; error?: string }> {
  // Basic knowledge for IA context
  const conocimiento: { titulo: string; contenido: string; categoria: string }[] = []

  try {
    // Guardar mensaje del usuario via Convex
    await convex.mutation(api.chat.sendChatMensaje, {
      sesion_id: sesionId as Id<"chat_sesiones">,
      rol: 'user',
      contenido: contenido,
    })

    // Obtener historial de mensajes para contexto
    const historial = await convex.query(api.chat.getChatMensajes, {
      sesion_id: sesionId as Id<"chat_sesiones">,
      limit: 10,
    })

    const historialFormateado: ChatMessage[] = (historial || [])
      .filter((m: any) => m.rol === 'user' || m.rol === 'assistant')
      .map((m: any) => ({
        role: m.rol as 'user' | 'assistant',
        content: m.contenido || '',
      }))

    // Generar respuesta con IA
    const respuestaData = await generarRespuestaIA(contenido, historialFormateado, conocimiento)

    // Guardar respuesta del asistente via Convex
    const respuestaId = await convex.mutation(api.chat.sendChatMensaje, {
      sesion_id: sesionId as Id<"chat_sesiones">,
      rol: 'assistant',
      contenido: respuestaData.texto,
      fuentes: respuestaData.fuentes as any,
      modelo_usado: respuestaData.modelo,
    })

    const respuesta: ChatMensaje = {
      id: respuestaId as string,
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
      sesion_id: sesionId as Id<"chat_sesiones">,
    })

    if (allMensajes && allMensajes.length === 3) { // bienvenida + user + assistant
      try {
        await convex.mutation(api.chat.updateSesionTitulo, {
          id: sesionId as Id<"chat_sesiones">,
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
  if (!isOpenAIConfigured()) {
    throw new Error('OpenAI no esta configurado. Configura OPENAI_API_KEY para usar el chat.')
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

// Dar feedback a un mensaje
export async function darFeedback(
  mensajeId: string,
  rating: 1 | 5,
  comentario?: string
): Promise<{ success: boolean }> {
  // TODO: Implement chat feedback in Convex
  return { success: true }
}

// Eliminar sesion
export async function eliminarSesion(sesionId: string): Promise<{ success: boolean }> {
  try {
    await convex.mutation(api.chat.archiveChatSesion, {
      id: sesionId as Id<"chat_sesiones">,
    })

    revalidatePath('/dashboard/chat')
    return { success: true }
  } catch (error) {
    console.error('Error deleting session:', error)
    return { success: false }
  }
}
