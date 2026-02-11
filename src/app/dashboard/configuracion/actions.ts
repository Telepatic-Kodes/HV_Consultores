// @ts-nocheck — temporary: remove after full migration
'use server'

import { ConvexHttpClient } from "convex/browser"
import { api } from "../../../../convex/_generated/api"
import { revalidatePath } from 'next/cache'

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!)
const DEMO_USER_ID = 'demo-user'

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
    const data = await convex.query(api.profiles.getProfileWithRoles, {
      id: DEMO_USER_ID as any,
    })

    if (!data) return null

    return {
      id: data._id ?? data.id ?? DEMO_USER_ID,
      nombre_completo: data.nombre_completo ?? null,
      telefono: data.telefono ?? null,
      cargo: data.cargo ?? null,
      avatar_url: data.avatar_url ?? null,
      created_at: data._creationTime ? new Date(data._creationTime).toISOString() : data.created_at ?? new Date().toISOString(),
      updated_at: data.updated_at ?? new Date().toISOString(),
      email: data.email ?? 'demo@hvconsultores.cl',
      rol: data.rol ?? 'Usuario',
    }
  } catch (error) {
    console.error('Error fetching profile from Convex:', error)
    // Return demo profile as fallback
    return {
      id: DEMO_USER_ID,
      nombre_completo: 'Usuario Demo',
      telefono: null,
      cargo: 'Contador',
      avatar_url: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      email: 'demo@hvconsultores.cl',
      rol: 'Usuario',
    }
  }
}

// Actualizar perfil del usuario
export async function actualizarPerfil(datos: {
  nombre_completo?: string
  telefono?: string
  cargo?: string
}): Promise<{ success: boolean; error?: string }> {
  try {
    await convex.mutation(api.profiles.updateProfile, {
      id: DEMO_USER_ID as any,
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
// TODO: Implement in Convex when configuracion_sistema table is migrated
export async function getNotificacionesConfig(): Promise<NotificacionConfig> {
  // Return default config - no Convex equivalent for configuracion_sistema yet
  return {
    documentos_pendientes: true,
    errores_bots: true,
    f29_listos: true,
    resumen_diario: false,
  }
}

// Actualizar configuracion de notificaciones
// TODO: Implement in Convex when configuracion_sistema table is migrated
export async function actualizarNotificaciones(
  config: NotificacionConfig
): Promise<{ success: boolean }> {
  // Stub - no Convex equivalent for configuracion_sistema yet
  console.log('Notification config update (stub):', config)
  return { success: true }
}

// Verificar estado de integraciones
// TODO: Implement in Convex when configuracion_sistema table is migrated
export async function getIntegracionesStatus(): Promise<IntegracionConfig> {
  // Check env vars directly instead of querying configuracion_sistema
  return {
    nubox_configured: !!process.env.NUBOX_API_KEY,
    openai_configured: !!process.env.OPENAI_API_KEY,
    sii_configured: !!process.env.SII_CREDENTIALS,
  }
}

// Guardar credencial de integracion (solo admin)
// TODO: Implement in Convex when configuracion_sistema table is migrated
export async function guardarIntegracion(
  tipo: 'nubox' | 'openai' | 'sii',
  credencial: string
): Promise<{ success: boolean; error?: string }> {
  // Stub - no Convex equivalent for configuracion_sistema yet
  console.log('Integration save (stub):', tipo)
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
// TODO: Implement proper auth when Convex auth is set up
export async function cambiarPassword(
  passwordActual: string,
  passwordNuevo: string
): Promise<{ success: boolean; error?: string }> {
  // Demo mode - no auth system in Convex yet
  console.log('Password change requested (demo mode)')
  return { success: true }
}

// Obtener configuracion general del sistema (solo admin)
// TODO: Implement in Convex when configuracion_sistema table is migrated
export async function getConfiguracionSistema(): Promise<ConfiguracionSistema[]> {
  // Stub - return empty array, no Convex equivalent yet
  return []
}

// Actualizar configuracion del sistema (solo admin)
// TODO: Implement in Convex when configuracion_sistema table is migrated
export async function actualizarConfigSistema(
  clave: string,
  valor: any,
  descripcion?: string
): Promise<{ success: boolean; error?: string }> {
  // Stub - no Convex equivalent for configuracion_sistema yet
  console.log('System config update (stub):', clave)
  return { success: true }
}
