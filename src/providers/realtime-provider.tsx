'use client'

import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from 'react'
import {
  useNotificacionesRealtime,
  useBotJobsRealtime,
} from '@/hooks/use-realtime'

// Tipos
export interface RealtimeNotificacion {
  id: string
  tipo: 'info' | 'success' | 'warning' | 'error'
  titulo: string
  mensaje: string
  enlace?: string
  timestamp: Date
}

export interface RealtimeEvent {
  type: 'notificacion' | 'bot_job' | 'documento' | 'f29'
  data: Record<string, unknown>
  timestamp: Date
}

interface RealtimeContextType {
  // Estado
  userId: string | null
  isConnected: boolean
  notificaciones: RealtimeNotificacion[]
  eventosRecientes: RealtimeEvent[]

  // Acciones
  clearNotificacion: (id: string) => void
  clearAllNotificaciones: () => void

  // Contadores
  notificacionesNoLeidas: number
  botsEnEjecucion: number
}

const RealtimeContext = createContext<RealtimeContextType | null>(null)

export function useRealtimeContext() {
  const context = useContext(RealtimeContext)
  if (!context) {
    throw new Error('useRealtimeContext debe usarse dentro de RealtimeProvider')
  }
  return context
}

interface RealtimeProviderProps {
  children: ReactNode
}

export function RealtimeProvider({ children }: RealtimeProviderProps) {
  // Demo mode — no real auth needed
  const userId = 'demo-user'

  // Local UI state for toast management
  const [displayedNotifications, setDisplayedNotifications] = useState<RealtimeNotificacion[]>([])
  const [eventosRecientes, setEventosRecientes] = useState<RealtimeEvent[]>([])
  const prevNotifCountRef = useRef(0)

  // Convex reactive queries — auto-update when data changes
  const rawNotifications = useNotificacionesRealtime(userId)
  const activeJobs = useBotJobsRealtime()

  // Convex is always connected if the provider is mounted
  const isConnected = true
  const botsEnEjecucion = activeJobs.filter(
    (j: any) => j.status === 'ejecutando'
  ).length

  // Detect new notifications from Convex and create toasts
  useEffect(() => {
    if (rawNotifications.length > prevNotifCountRef.current) {
      const newCount = rawNotifications.length - prevNotifCountRef.current
      const newItems = rawNotifications.slice(0, newCount)

      const toasts: RealtimeNotificacion[] = newItems.map((n: any) => ({
        id: n._id,
        tipo: (n.tipo || 'info') as RealtimeNotificacion['tipo'],
        titulo: n.titulo || 'Notificación',
        mensaje: n.mensaje || '',
        enlace: n.link,
        timestamp: new Date(),
      }))

      setDisplayedNotifications((prev) => [...toasts, ...prev].slice(0, 10))

      // Add to recent events
      toasts.forEach((t) => {
        setEventosRecientes((prev) =>
          [
            { type: 'notificacion' as const, data: t, timestamp: new Date() },
            ...prev,
          ].slice(0, 20)
        )
      })

      playNotificationSound()
    }
    prevNotifCountRef.current = rawNotifications.length
  }, [rawNotifications.length])

  // Acciones
  const clearNotificacion = useCallback((id: string) => {
    setDisplayedNotifications((prev) => prev.filter((n) => n.id !== id))
  }, [])

  const clearAllNotificaciones = useCallback(() => {
    setDisplayedNotifications([])
  }, [])

  const value: RealtimeContextType = {
    userId,
    isConnected,
    notificaciones: displayedNotifications,
    eventosRecientes,
    clearNotificacion,
    clearAllNotificaciones,
    notificacionesNoLeidas: displayedNotifications.length,
    botsEnEjecucion,
  }

  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>
}

// Función auxiliar para sonido de notificación
function playNotificationSound() {
  if (typeof window !== 'undefined' && 'AudioContext' in window) {
    try {
      const audioContext = new AudioContext()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      oscillator.frequency.value = 800
      oscillator.type = 'sine'
      gainNode.gain.value = 0.1

      oscillator.start()
      oscillator.stop(audioContext.currentTime + 0.1)
    } catch {
      // Silenciar errores de audio
    }
  }
}
