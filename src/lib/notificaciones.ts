'use server'

import { ConvexHttpClient } from "convex/browser"
import { api } from "../../convex/_generated/api"
import type { Id } from "../../convex/_generated/dataModel"

const convex = process.env.NEXT_PUBLIC_CONVEX_URL
  ? new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!)
  : null
const DEMO_USER_ID = 'demo-user' as Id<"profiles">

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
  if (!convex) {
    return getNotificacionesDemo()
  }

  try {
    const data = await convex.query(api.notifications.listNotifications, {
      usuario_id: DEMO_USER_ID,
      limit: limite,
    })

    if (!data || data.length === 0) {
      return getNotificacionesDemo()
    }

    return data.map((n: any) => ({
      id: n._id ?? n.id,
      usuario_id: n.usuario_id,
      tipo: n.tipo,
      titulo: n.titulo,
      mensaje: n.mensaje,
      leida: n.leida ?? false,
      enlace: n.link ?? n.enlace,
      created_at: n._creationTime ? new Date(n._creationTime).toISOString() : n.created_at,
    })) as Notificacion[]
  } catch (error) {
    console.error('Error fetching notifications from Convex:', error)
    return getNotificacionesDemo()
  }
}

// Obtener estadisticas de notificaciones
export async function getNotificacionStats(): Promise<NotificacionStats> {
  if (!convex) {
    return { total: 5, noLeidas: 3 }
  }

  try {
    const result = await convex.query(api.notifications.getUnreadCount, {
      usuario_id: DEMO_USER_ID,
    })

    const allNotifications = await convex.query(api.notifications.listNotifications, {
      usuario_id: DEMO_USER_ID,
    })

    return {
      total: allNotifications?.length ?? 0,
      noLeidas: result?.count ?? 0,
    }
  } catch (error) {
    console.error('Error fetching notification stats from Convex:', error)
    return { total: 5, noLeidas: 3 }
  }
}

// Marcar notificacion como leida
export async function marcarComoLeida(notificacionId: string): Promise<{ success: boolean }> {
  if (!convex) {
    return { success: true } // Demo mode
  }

  try {
    await convex.mutation(api.notifications.markAsRead, {
      id: notificacionId as any,
    })
    return { success: true }
  } catch (error) {
    console.error('Error marking notification as read:', error)
    return { success: false }
  }
}

// Marcar todas como leidas
export async function marcarTodasComoLeidas(): Promise<{ success: boolean }> {
  if (!convex) {
    return { success: true }
  }

  try {
    await convex.mutation(api.notifications.markAllAsRead, {
      usuario_id: DEMO_USER_ID,
    })
    return { success: true }
  } catch (error) {
    console.error('Error marking all notifications as read:', error)
    return { success: false }
  }
}

// Eliminar notificacion
export async function eliminarNotificacion(notificacionId: string): Promise<{ success: boolean }> {
  if (!convex) {
    return { success: true }
  }

  try {
    await convex.mutation(api.notifications.deleteNotification, {
      id: notificacionId as any,
    })
    return { success: true }
  } catch (error) {
    console.error('Error deleting notification:', error)
    return { success: false }
  }
}

// Crear notificacion (para uso interno del sistema)
export async function crearNotificacion(
  usuarioId: string,
  datos: {
    tipo: 'info' | 'success' | 'warning' | 'error'
    titulo: string
    mensaje: string
    enlace?: string
  }
): Promise<{ success: boolean; notificacion?: Notificacion }> {
  if (!convex) {
    return { success: false }
  }

  try {
    const id = await convex.mutation(api.notifications.createNotification, {
      usuario_id: usuarioId as Id<"profiles">,
      tipo: datos.tipo,
      titulo: datos.titulo,
      mensaje: datos.mensaje,
      link: datos.enlace,
    })

    return {
      success: true,
      notificacion: {
        id: id as any,
        usuario_id: usuarioId,
        tipo: datos.tipo,
        titulo: datos.titulo,
        mensaje: datos.mensaje,
        leida: false,
        enlace: datos.enlace,
        created_at: new Date().toISOString(),
      },
    }
  } catch (error) {
    console.error('Error creating notification:', error)
    return { success: false }
  }
}

// Notificaciones demo para modo sin autenticacion
function getNotificacionesDemo(): Notificacion[] {
  const now = new Date()
  return [
    {
      id: 'demo-1',
      usuario_id: 'demo',
      tipo: 'success',
      titulo: 'Clasificacion completada',
      mensaje: '45 documentos clasificados automaticamente con 98% de precision.',
      leida: false,
      enlace: '/dashboard/clasificador',
      created_at: new Date(now.getTime() - 5 * 60 * 1000).toISOString()
    },
    {
      id: 'demo-2',
      usuario_id: 'demo',
      tipo: 'warning',
      titulo: 'F29 pendiente de validacion',
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
      titulo: 'Error de conexion SII',
      mensaje: 'No se pudo conectar al portal del SII. Reintentando...',
      leida: true,
      created_at: new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString()
    }
  ]
}
