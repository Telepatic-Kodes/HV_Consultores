'use client'

import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'

// Convex queries are inherently reactive — no manual subscriptions needed.
// Components using useQuery() auto-re-render when underlying data changes.

// Hook for real-time notifications
export function useNotificacionesRealtime(userId: string | null) {
  const notifications = useQuery(
    api.notifications.listNotifications,
    userId ? { usuario_id: userId as any, leida: false } : 'skip'
  )
  return notifications ?? []
}

// Hook for active bot jobs in real-time
export function useBotJobsRealtime() {
  const activeJobs = useQuery(api.bots.getActiveJobs, {})
  return activeJobs ?? []
}

// Hook for pending documents in real-time
export function useDocumentosRealtime() {
  const documents = useQuery(api.documents.getDocumentsByStatus, {
    status: 'pendiente',
    limit: 50,
  })
  return documents ?? []
}

// Hook for F29 submissions in real-time
export function useF29Realtime() {
  const submissions = useQuery(api.f29.listSubmissions, { limit: 50 })
  return submissions ?? []
}
