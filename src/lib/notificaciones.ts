'use server'

import { ConvexHttpClient } from "convex/browser"
import { api } from "../../convex/_generated/api"
import type { Id } from "../../convex/_generated/dataModel"
import { getServerProfileId, getAuthenticatedConvex } from '@/lib/auth-server'

const convex = process.env.NEXT_PUBLIC_CONVEX_URL
  ? new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!)
  : null

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
    return []
  }

  try {
    const profileId = await getServerProfileId()
    const data = await convex.query(api.notifications.listNotifications, {
      usuario_id: profileId,
      limit: limite,
    })

    if (!data || data.length === 0) {
      return []
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
    return []
  }
}

// Obtener estadisticas de notificaciones
export async function getNotificacionStats(): Promise<NotificacionStats> {
  if (!convex) {
    return { total: 0, noLeidas: 0 }
  }

  try {
    const profileId = await getServerProfileId()
    const result = await convex.query(api.notifications.getUnreadCount, {
      usuario_id: profileId,
    })

    const allNotifications = await convex.query(api.notifications.listNotifications, {
      usuario_id: profileId,
    })

    return {
      total: allNotifications?.length ?? 0,
      noLeidas: result?.count ?? 0,
    }
  } catch (error) {
    console.error('Error fetching notification stats from Convex:', error)
    return { total: 0, noLeidas: 0 }
  }
}

// Marcar notificacion como leida
export async function marcarComoLeida(notificacionId: string): Promise<{ success: boolean }> {
  if (!convex) {
    return { success: false }
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
    const profileId = await getServerProfileId()
    await convex.mutation(api.notifications.markAllAsRead, {
      usuario_id: profileId,
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

