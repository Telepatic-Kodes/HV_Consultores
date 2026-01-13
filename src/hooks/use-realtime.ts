'use client'

import { useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import type { RealtimeChannel } from '@supabase/supabase-js'

type PostgresChangeEvent = 'INSERT' | 'UPDATE' | 'DELETE' | '*'

interface RealtimePayload<T> {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE'
  new: T
  old: T
}

interface UseRealtimeOptions<T> {
  table: string
  schema?: string
  event?: PostgresChangeEvent
  filter?: string
  onInsert?: (payload: T) => void
  onUpdate?: (payload: { old: T; new: T }) => void
  onDelete?: (payload: T) => void
  onChange?: (payload: RealtimePayload<T>) => void
  enabled?: boolean
}

// Hook genérico para suscribirse a cambios en tiempo real
export function useRealtime<T extends Record<string, unknown>>({
  table,
  schema = 'public',
  event = '*',
  filter,
  onInsert,
  onUpdate,
  onDelete,
  onChange,
  enabled = true,
}: UseRealtimeOptions<T>) {
  const channelRef = useRef<RealtimeChannel | null>(null)

  const handleChange = useCallback(
    (payload: RealtimePayload<T>) => {
      // Callback general
      onChange?.(payload)

      // Callbacks específicos por evento
      switch (payload.eventType) {
        case 'INSERT':
          onInsert?.(payload.new as T)
          break
        case 'UPDATE':
          onUpdate?.({ old: payload.old as T, new: payload.new as T })
          break
        case 'DELETE':
          onDelete?.(payload.old as T)
          break
      }
    },
    [onChange, onInsert, onUpdate, onDelete]
  )

  useEffect(() => {
    if (!enabled) return

    // Crear canal único para esta suscripción
    const channelName = `realtime-${table}-${Date.now()}`

    const channelConfig = {
      event,
      schema,
      table,
      filter,
    }

    channelRef.current = supabase
      .channel(channelName)
      .on(
        'postgres_changes' as any,
        channelConfig as any,
        handleChange as any
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`[Realtime] Suscrito a ${table}`)
        } else if (status === 'CHANNEL_ERROR') {
          console.error(`[Realtime] Error en canal ${table}`)
        }
      })

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [table, schema, event, filter, enabled, handleChange])

  return {
    channel: channelRef.current,
  }
}

// Hook específico para notificaciones en tiempo real
export function useNotificacionesRealtime(
  userId: string | null,
  onNuevaNotificacion: (notificacion: {
    id: string
    tipo: string
    titulo: string
    mensaje: string
    enlace?: string
  }) => void
) {
  useRealtime({
    table: 'notificaciones',
    event: 'INSERT',
    filter: userId ? `usuario_id=eq.${userId}` : undefined,
    enabled: !!userId,
    onInsert: (payload) => {
      onNuevaNotificacion({
        id: payload.id as string,
        tipo: payload.tipo as string,
        titulo: payload.titulo as string,
        mensaje: payload.mensaje as string,
        enlace: payload.enlace as string | undefined,
      })
    },
  })
}

// Hook para estado de bots en tiempo real
export function useBotJobsRealtime(
  onJobUpdate: (job: {
    id: string
    status: string
    bot_id: string
    mensaje_error?: string
  }) => void
) {
  useRealtime({
    table: 'bot_jobs',
    event: 'UPDATE',
    onUpdate: ({ new: newJob }) => {
      onJobUpdate({
        id: newJob.id as string,
        status: newJob.status as string,
        bot_id: newJob.bot_id as string,
        mensaje_error: newJob.mensaje_error as string | undefined,
      })
    },
  })
}

// Hook para documentos clasificados en tiempo real
export function useDocumentosRealtime(
  onDocumentoClasificado: (documento: {
    id: string
    folio: string
    cliente_id: string
    status: string
  }) => void
) {
  useRealtime({
    table: 'documentos',
    event: 'UPDATE',
    onUpdate: ({ new: doc }) => {
      if (doc.status === 'clasificado') {
        onDocumentoClasificado({
          id: doc.id as string,
          folio: doc.folio as string,
          cliente_id: doc.cliente_id as string,
          status: doc.status as string,
        })
      }
    },
  })
}

// Hook para F29 actualizados en tiempo real
export function useF29Realtime(
  onF29Update: (f29: {
    id: string
    cliente_id: string
    periodo: string
    status: string
  }) => void
) {
  useRealtime({
    table: 'f29_calculos',
    event: 'UPDATE',
    onUpdate: ({ new: f29 }) => {
      onF29Update({
        id: f29.id as string,
        cliente_id: f29.cliente_id as string,
        periodo: f29.periodo as string,
        status: f29.status as string,
      })
    },
  })
}
