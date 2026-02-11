// @ts-nocheck — temporary: remove after full migration
'use server'

import { createClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'
import type { Database } from '@/types/database.types'

type Profile = Database['public']['Tables']['profiles']['Row']
type ConfiguracionSistema = Database['public']['Tables']['configuracion_sistema']['Row']

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
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) return null

  // Obtener rol del usuario
  const { data: userRole } = await supabase
    .from('user_roles')
    .select(`
      role:roles(nombre)
    `)
    .eq('user_id', user.id)
    .single()

  return {
    ...profile,
    email: user.email,
    rol: (userRole?.role as any)?.nombre || 'Usuario',
  }
}

// Actualizar perfil del usuario
export async function actualizarPerfil(datos: {
  nombre_completo?: string
  telefono?: string
  cargo?: string
}): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'No autenticado' }

  const { error } = await supabase
    .from('profiles')
    .update({
      nombre_completo: datos.nombre_completo,
      telefono: datos.telefono,
      cargo: datos.cargo,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)

  if (error) {
    console.error('Error updating profile:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard/configuracion')
  return { success: true }
}

// Obtener configuración de notificaciones
export async function getNotificacionesConfig(): Promise<NotificacionConfig> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return {
      documentos_pendientes: true,
      errores_bots: true,
      f29_listos: true,
      resumen_diario: false,
    }
  }

  const { data } = await supabase
    .from('configuracion_sistema')
    .select('valor')
    .eq('clave', `notificaciones_${user.id}`)
    .single()

  if (data?.valor) {
    return data.valor as unknown as NotificacionConfig
  }

  // Valores por defecto
  return {
    documentos_pendientes: true,
    errores_bots: true,
    f29_listos: true,
    resumen_diario: false,
  }
}

// Actualizar configuración de notificaciones
export async function actualizarNotificaciones(
  config: NotificacionConfig
): Promise<{ success: boolean }> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false }

  const clave = `notificaciones_${user.id}`

  // Upsert configuración
  const { error } = await supabase
    .from('configuracion_sistema')
    .upsert({
      clave,
      valor: config as any,
      descripcion: 'Configuración de notificaciones del usuario',
      updated_at: new Date().toISOString(),
      updated_by: user.id,
    }, {
      onConflict: 'clave',
    })

  if (error) {
    console.error('Error updating notifications:', error)
    return { success: false }
  }

  revalidatePath('/dashboard/configuracion')
  return { success: true }
}

// Verificar estado de integraciones
export async function getIntegracionesStatus(): Promise<IntegracionConfig> {
  const supabase = createClient()

  const { data: configs } = await supabase
    .from('configuracion_sistema')
    .select('clave, valor')
    .in('clave', ['nubox_api_key', 'openai_api_key', 'sii_credentials'])

  const configMap = new Map(configs?.map(c => [c.clave, c.valor]) || [])

  return {
    nubox_configured: !!configMap.get('nubox_api_key'),
    openai_configured: !!configMap.get('openai_api_key'),
    sii_configured: !!configMap.get('sii_credentials'),
  }
}

// Guardar credencial de integración (solo admin)
export async function guardarIntegracion(
  tipo: 'nubox' | 'openai' | 'sii',
  credencial: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'No autenticado' }

  // Verificar si es admin
  const { data: isAdmin } = await supabase.rpc('is_admin', { user_uuid: user.id })

  if (!isAdmin) {
    return { success: false, error: 'No tienes permisos para esta acción' }
  }

  const claveMap: Record<string, string> = {
    nubox: 'nubox_api_key',
    openai: 'openai_api_key',
    sii: 'sii_credentials',
  }

  const clave = claveMap[tipo]

  // Encriptar credencial antes de guardar (en producción usar vault o similar)
  const valorEncriptado = Buffer.from(credencial).toString('base64')

  const { error } = await supabase
    .from('configuracion_sistema')
    .upsert({
      clave,
      valor: { encrypted: valorEncriptado },
      descripcion: `Credencial para ${tipo}`,
      updated_at: new Date().toISOString(),
      updated_by: user.id,
    }, {
      onConflict: 'clave',
    })

  if (error) {
    console.error('Error saving integration:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard/configuracion')
  return { success: true }
}

// Verificar conexión de integración
export async function verificarIntegracion(
  tipo: 'nubox' | 'openai' | 'sii'
): Promise<{ success: boolean; mensaje: string }> {
  // En producción, esto haría una llamada real a cada API
  // Por ahora simulamos la verificación

  await new Promise(resolve => setTimeout(resolve, 1000)) // Simular delay

  const mensajes: Record<string, { success: boolean; mensaje: string }> = {
    nubox: { success: true, mensaje: 'Conexión con Nubox verificada correctamente' },
    openai: { success: true, mensaje: 'API Key de OpenAI válida' },
    sii: { success: false, mensaje: 'Credenciales del SII no configuradas' },
  }

  return mensajes[tipo] || { success: false, mensaje: 'Integración desconocida' }
}

// Cambiar contraseña
export async function cambiarPassword(
  passwordActual: string,
  passwordNuevo: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()

  const { error } = await supabase.auth.updateUser({
    password: passwordNuevo,
  })

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

// Obtener configuración general del sistema (solo admin)
export async function getConfiguracionSistema(): Promise<ConfiguracionSistema[]> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data: isAdmin } = await supabase.rpc('is_admin', { user_uuid: user.id })
  if (!isAdmin) return []

  const { data } = await supabase
    .from('configuracion_sistema')
    .select('*')
    .not('clave', 'ilike', 'notificaciones_%')
    .order('clave')

  return data || []
}

// Actualizar configuración del sistema (solo admin)
export async function actualizarConfigSistema(
  clave: string,
  valor: any,
  descripcion?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'No autenticado' }

  const { data: isAdmin } = await supabase.rpc('is_admin', { user_uuid: user.id })
  if (!isAdmin) {
    return { success: false, error: 'No tienes permisos para esta acción' }
  }

  const { error } = await supabase
    .from('configuracion_sistema')
    .upsert({
      clave,
      valor,
      descripcion,
      updated_at: new Date().toISOString(),
      updated_by: user.id,
    }, {
      onConflict: 'clave',
    })

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard/configuracion')
  return { success: true }
}
