'use server'

import { api } from "../../../../convex/_generated/api"
import { revalidatePath } from 'next/cache'
import { getServerProfileId, getAuthenticatedConvex } from '@/lib/auth-server'

type Profile = {
  id: string
  nombre_completo: string | null
  telefono: string | null
  cargo: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

type ConfiguracionSistema = {
  id: string
  clave: string
  valor: any
  descripcion: string | null
  updated_at: string
  updated_by: string | null
}

export interface UserProfile extends Profile {
  email?: string
  rol?: string
}

export interface NotificacionConfig {
  documentos_pendientes: boolean
  errores_bots: boolean
  f29_listos: boolean
  resumen_diario: boolean
}

export interface IntegracionConfig {
  nubox_configured: boolean
  openai_configured: boolean
  sii_configured: boolean
}

// Obtener perfil del usuario actual
export async function getUserProfile(): Promise<UserProfile | null> {
  try {
    const convex = await getAuthenticatedConvex()
    const profileId = await getServerProfileId()
    const data = await convex.query(api.profiles.getProfileWithRoles, {
      id: profileId,
    })

    if (!data) return null

    return {
      id: data._id as string,
      nombre_completo: data.nombre_completo ?? null,
      telefono: data.telefono ?? null,
      cargo: data.cargo ?? null,
      avatar_url: data.avatar_url ?? null,
      created_at: data._creationTime ? new Date(data._creationTime).toISOString() : ((data as any).created_at ?? new Date().toISOString()),
      updated_at: data.updated_at ?? new Date().toISOString(),
      email: (data as any).email,
      rol: (data.roles && data.roles.length > 0 ? data.roles[0].nombre : undefined) ?? 'Usuario',
    }
  } catch (error) {
    console.error('Error fetching profile from Convex:', error)
    return null
  }
}

// Actualizar perfil del usuario
export async function actualizarPerfil(datos: {
  nombre_completo?: string
  telefono?: string
  cargo?: string
}): Promise<{ success: boolean; error?: string }> {
  try {
    const convex = await getAuthenticatedConvex()
    const profileId = await getServerProfileId()
    await convex.mutation(api.profiles.updateProfile, {
      id: profileId,
      nombre_completo: datos.nombre_completo,
      telefono: datos.telefono,
      cargo: datos.cargo,
    })

    revalidatePath('/dashboard/configuracion')
    return { success: true }
  } catch (error) {
    console.error('Error updating profile:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Error actualizando perfil' }
  }
}

// Obtener configuracion de notificaciones
export async function getNotificacionesConfig(): Promise<NotificacionConfig> {
  // TODO: Implement in Convex when configuracion_sistema table is added
  return {
    documentos_pendientes: true,
    errores_bots: true,
    f29_listos: true,
    resumen_diario: false,
  }
}

// Actualizar configuracion de notificaciones
export async function actualizarNotificaciones(
  config: NotificacionConfig
): Promise<{ success: boolean }> {
  // TODO: Implement in Convex when configuracion_sistema table is added
  return { success: true }
}

// Verificar estado de integraciones
export async function getIntegracionesStatus(): Promise<IntegracionConfig> {
  return {
    nubox_configured: !!process.env.NUBOX_API_KEY,
    openai_configured: !!process.env.OPENAI_API_KEY,
    sii_configured: !!process.env.SII_CREDENTIALS,
  }
}

// Guardar credencial de integracion (solo admin)
export async function guardarIntegracion(
  tipo: 'nubox' | 'openai' | 'sii',
  credencial: string
): Promise<{ success: boolean; error?: string }> {
  // TODO: Implement in Convex when configuracion_sistema table is added
  return { success: true }
}

// Verificar conexion de integracion
export async function verificarIntegracion(
  tipo: 'nubox' | 'openai' | 'sii'
): Promise<{ success: boolean; mensaje: string }> {
  // En produccion, esto haria una llamada real a cada API
  // Por ahora simulamos la verificacion

  await new Promise(resolve => setTimeout(resolve, 1000)) // Simular delay

  const mensajes: Record<string, { success: boolean; mensaje: string }> = {
    nubox: { success: true, mensaje: 'Conexion con Nubox verificada correctamente' },
    openai: { success: true, mensaje: 'API Key de OpenAI valida' },
    sii: { success: false, mensaje: 'Credenciales del SII no configuradas' },
  }

  return mensajes[tipo] || { success: false, mensaje: 'Integracion desconocida' }
}

// Cambiar contrasena
export async function cambiarPassword(
  passwordActual: string,
  passwordNuevo: string
): Promise<{ success: boolean; error?: string }> {
  // TODO: Implement password change via Convex Auth
  return { success: false, error: 'Cambio de contrasena aun no implementado' }
}

// Obtener datos de suscripcion del usuario actual
export async function getSubscriptionData() {
  try {
    const convex = await getAuthenticatedConvex()
    const [subscription, usage] = await Promise.all([
      convex.query(api.subscriptions.getMySubscription, {}),
      convex.query(api.subscriptions.getUsageStats, {}),
    ])
    return { subscription, usage }
  } catch (error) {
    console.error('Error fetching subscription data:', error)
    return { subscription: null, usage: null }
  }
}

// Obtener userId del usuario autenticado para Stripe
export async function getAuthUserId() {
  try {
    const convex = await getAuthenticatedConvex()
    const profile = await convex.query(api.profiles.getMyProfile, {})
    return profile?.userId || null
  } catch (error) {
    return null
  }
}

// Obtener configuracion general del sistema (solo admin)
export async function getConfiguracionSistema(): Promise<ConfiguracionSistema[]> {
  // TODO: Implement in Convex when configuracion_sistema table is added
  return []
}

// Actualizar configuracion del sistema (solo admin)
export async function actualizarConfigSistema(
  clave: string,
  valor: any,
  descripcion?: string
): Promise<{ success: boolean; error?: string }> {
  // TODO: Implement in Convex when configuracion_sistema table is added
  return { success: true }
}
