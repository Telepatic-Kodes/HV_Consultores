'use server'

import { createClient } from '@/lib/supabase-server'

export interface Notificacion {
  id: string
  usuario_id: string
  tipo: 'info' | 'success' | 'warning' | 'error'
  titulo: string
  mensaje: string
  leida: boolean
  enlace?: string
  created_at: string
}

export interface NotificacionStats {
  total: number
  noLeidas: number
}

// Obtener notificaciones del usuario
export async function getNotificaciones(limite: number = 10): Promise<Notificacion[]> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()

  // Si no hay usuario, devolver notificaciones demo
  if (!user) {
    return getNotificacionesDemo()
  }

  const { data, error } = await supabase
    .from('notificaciones')
    .select('*')
    .eq('usuario_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limite)

  if (error || !data) {
    console.error('Error fetching notifications:', error)
    return getNotificacionesDemo()
  }

  return data as Notificacion[]
}

// Obtener estadísticas de notificaciones
export async function getNotificacionStats(): Promise<NotificacionStats> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { total: 5, noLeidas: 3 }
  }

  const { count: total } = await supabase
    .from('notificaciones')
    .select('*', { count: 'exact', head: true })
    .eq('usuario_id', user.id)

  const { count: noLeidas } = await supabase
    .from('notificaciones')
    .select('*', { count: 'exact', head: true })
    .eq('usuario_id', user.id)
    .eq('leida', false)

  return {
    total: total || 0,
    noLeidas: noLeidas || 0
  }
}

// Marcar notificación como leída
export async function marcarComoLeida(notificacionId: string): Promise<{ success: boolean }> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: true } // Demo mode
  }

  const { error } = await supabase
    .from('notificaciones')
    .update({ leida: true })
    .eq('id', notificacionId)
    .eq('usuario_id', user.id)

  return { success: !error }
}

// Marcar todas como leídas
export async function marcarTodasComoLeidas(): Promise<{ success: boolean }> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: true }
  }

  const { error } = await supabase
    .from('notificaciones')
    .update({ leida: true })
    .eq('usuario_id', user.id)
    .eq('leida', false)

  return { success: !error }
}

// Eliminar notificación
export async function eliminarNotificacion(notificacionId: string): Promise<{ success: boolean }> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: true }
  }

  const { error } = await supabase
    .from('notificaciones')
    .delete()
    .eq('id', notificacionId)
    .eq('usuario_id', user.id)

  return { success: !error }
}

// Crear notificación (para uso interno del sistema)
export async function crearNotificacion(
  usuarioId: string,
  datos: {
    tipo: 'info' | 'success' | 'warning' | 'error'
    titulo: string
    mensaje: string
    enlace?: string
  }
): Promise<{ success: boolean; notificacion?: Notificacion }> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('notificaciones')
    .insert({
      usuario_id: usuarioId,
      tipo: datos.tipo,
      titulo: datos.titulo,
      mensaje: datos.mensaje,
      enlace: datos.enlace,
      leida: false
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating notification:', error)
    return { success: false }
  }

  return { success: true, notificacion: data as Notificacion }
}

// Notificaciones demo para modo sin autenticación
function getNotificacionesDemo(): Notificacion[] {
  const now = new Date()
  return [
    {
      id: 'demo-1',
      usuario_id: 'demo',
      tipo: 'success',
      titulo: 'Clasificación completada',
      mensaje: '45 documentos clasificados automáticamente con 98% de precisión.',
      leida: false,
      enlace: '/dashboard/clasificador',
      created_at: new Date(now.getTime() - 5 * 60 * 1000).toISOString()
    },
    {
      id: 'demo-2',
      usuario_id: 'demo',
      tipo: 'warning',
      titulo: 'F29 pendiente de validación',
      mensaje: 'El F29 de Empresa ABC SpA tiene diferencias en IVA.',
      leida: false,
      enlace: '/dashboard/f29',
      created_at: new Date(now.getTime() - 30 * 60 * 1000).toISOString()
    },
    {
      id: 'demo-3',
      usuario_id: 'demo',
      tipo: 'info',
      titulo: 'Bot ejecutado exitosamente',
      mensaje: 'Descarga de libros completada para 12 empresas.',
      leida: false,
      enlace: '/dashboard/bots',
      created_at: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'demo-4',
      usuario_id: 'demo',
      tipo: 'success',
      titulo: 'Nuevo cliente agregado',
      mensaje: 'Tech Solutions Ltda. ha sido registrado correctamente.',
      leida: true,
      enlace: '/dashboard/clientes',
      created_at: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'demo-5',
      usuario_id: 'demo',
      tipo: 'error',
      titulo: 'Error de conexión SII',
      mensaje: 'No se pudo conectar al portal del SII. Reintentando...',
      leida: true,
      created_at: new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString()
    }
  ]
}
