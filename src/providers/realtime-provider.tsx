'use client'

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import {
  useNotificacionesRealtime,
  useBotJobsRealtime,
  useDocumentosRealtime,
  useF29Realtime,
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
  const [userId, setUserId] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [notificaciones, setNotificaciones] = useState<RealtimeNotificacion[]>([])
  const [eventosRecientes, setEventosRecientes] = useState<RealtimeEvent[]>([])
  const [botsEnEjecucion, setBotsEnEjecucion] = useState(0)

  // Obtener usuario actual
  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUserId(user?.id || null)

      // Para modo demo, usar un ID ficticio
      if (!user) {
        setUserId('demo-user')
      }
    }
    getUser()

    // Escuchar cambios de auth
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id || 'demo-user')
    })

    return () => subscription.unsubscribe()
  }, [])

  // Verificar conexión realtime
  useEffect(() => {
    const checkConnection = () => {
      const channels = supabase.getChannels()
      setIsConnected(channels.length > 0)
    }

    // Verificar cada 5 segundos
    const interval = setInterval(checkConnection, 5000)
    checkConnection()

    return () => clearInterval(interval)
  }, [])

  // Handler para nuevas notificaciones
  const handleNuevaNotificacion = useCallback(
    (notif: { id: string; tipo: string; titulo: string; mensaje: string; enlace?: string }) => {
      const nuevaNotif: RealtimeNotificacion = {
        id: notif.id,
        tipo: notif.tipo as RealtimeNotificacion['tipo'],
        titulo: notif.titulo,
        mensaje: notif.mensaje,
        enlace: notif.enlace,
        timestamp: new Date(),
      }

      setNotificaciones((prev) => [nuevaNotif, ...prev].slice(0, 10))

      // Agregar a eventos recientes
      setEventosRecientes((prev) =>
        [
          {
            type: 'notificacion' as const,
            data: notif,
            timestamp: new Date(),
          },
          ...prev,
        ].slice(0, 20)
      )

      // Reproducir sonido de notificación (opcional)
      playNotificationSound()
    },
    []
  )

  // Handler para actualizaciones de bots
  const handleBotJobUpdate = useCallback(
    (job: { id: string; status: string; bot_id: string; mensaje_error?: string }) => {
      setEventosRecientes((prev) =>
        [
          {
            type: 'bot_job' as const,
            data: job,
            timestamp: new Date(),
          },
          ...prev,
        ].slice(0, 20)
      )

      // Actualizar contador de bots en ejecución
      if (job.status === 'ejecutando') {
        setBotsEnEjecucion((prev) => prev + 1)
      } else if (job.status === 'completado' || job.status === 'fallido') {
        setBotsEnEjecucion((prev) => Math.max(0, prev - 1))

        // Crear notificación interna para el resultado del bot
        const notif: RealtimeNotificacion = {
          id: `bot-${job.id}`,
          tipo: job.status === 'completado' ? 'success' : 'error',
          titulo: job.status === 'completado' ? 'Bot completado' : 'Bot fallido',
          mensaje:
            job.status === 'completado'
              ? 'La tarea del bot ha finalizado exitosamente'
              : job.mensaje_error || 'Error en la ejecución del bot',
          enlace: '/dashboard/bots',
          timestamp: new Date(),
        }
        setNotificaciones((prev) => [notif, ...prev].slice(0, 10))
      }
    },
    []
  )

  // Handler para documentos clasificados
  const handleDocumentoClasificado = useCallback(
    (doc: { id: string; folio: string; cliente_id: string; status: string }) => {
      setEventosRecientes((prev) =>
        [
          {
            type: 'documento' as const,
            data: doc,
            timestamp: new Date(),
          },
          ...prev,
        ].slice(0, 20)
      )
    },
    []
  )

  // Handler para F29 actualizados
  const handleF29Update = useCallback(
    (f29: { id: string; cliente_id: string; periodo: string; status: string }) => {
      setEventosRecientes((prev) =>
        [
          {
            type: 'f29' as const,
            data: f29,
            timestamp: new Date(),
          },
          ...prev,
        ].slice(0, 20)
      )

      // Notificar cambios importantes de F29
      if (f29.status === 'validado' || f29.status === 'aprobado') {
        const notif: RealtimeNotificacion = {
          id: `f29-${f29.id}`,
          tipo: 'success',
          titulo: `F29 ${f29.status}`,
          mensaje: `El formulario F29 del período ${f29.periodo} ha sido ${f29.status}`,
          enlace: '/dashboard/f29',
          timestamp: new Date(),
        }
        setNotificaciones((prev) => [notif, ...prev].slice(0, 10))
      }
    },
    []
  )

  // Suscripciones Realtime
  useNotificacionesRealtime(userId, handleNuevaNotificacion)
  useBotJobsRealtime(handleBotJobUpdate)
  useDocumentosRealtime(handleDocumentoClasificado)
  useF29Realtime(handleF29Update)

  // Acciones
  const clearNotificacion = useCallback((id: string) => {
    setNotificaciones((prev) => prev.filter((n) => n.id !== id))
  }, [])

  const clearAllNotificaciones = useCallback(() => {
    setNotificaciones([])
  }, [])

  const value: RealtimeContextType = {
    userId,
    isConnected,
    notificaciones,
    eventosRecientes,
    clearNotificacion,
    clearAllNotificaciones,
    notificacionesNoLeidas: notificaciones.length,
    botsEnEjecucion,
  }

  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>
}

// Función auxiliar para sonido de notificación
function playNotificationSound() {
  // Solo en cliente y si está permitido
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
