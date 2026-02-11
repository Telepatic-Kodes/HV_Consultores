// @ts-nocheck — temporary: remove after npx convex dev generates real types
'use client'

import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { useConvexAvailable } from '@/providers/convex-provider'

/**
 * Realtime hooks powered by Convex reactive queries.
 *
 * Uses useConvexAvailable() to determine if ConvexProvider is mounted.
 * When unavailable, passes 'skip' to useQuery so hooks are always called
 * (satisfying React's rules) but no actual query is executed.
 *
 * When Convex IS available and _generated types are real, useQuery
 * subscribes reactively — components auto-update on data changes.
 */

export function useNotificacionesRealtime(userId: string | null): any[] {
  const available = useConvexAvailable()
  // Skip notification query – no real auth user ID available yet.
  // Once auth is wired, pass { usuario_id: validConvexId, leida: false }.
  const result = useQuery(
    api.notifications.listNotifications,
    'skip'
  )
  return result ?? []
}

export function useBotJobsRealtime(): any[] {
  const available = useConvexAvailable()
  const result = useQuery(api.bots.getActiveJobs, available ? {} : 'skip')
  return result ?? []
}

export function useDocumentosRealtime(): any[] {
  const available = useConvexAvailable()
  const result = useQuery(api.documents.listDocuments, available ? {} : 'skip')
  return result ?? []
}

export function useF29Realtime(): any[] {
  const available = useConvexAvailable()
  const result = useQuery(api.f29.listSubmissions, available ? {} : 'skip')
  return result ?? []
}
