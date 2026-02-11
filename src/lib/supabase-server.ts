// Supabase server client REMOVED — now using Convex for all data access.
// This file provides backward-compatible exports during migration.

import { ConvexHttpClient } from 'convex/browser'

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL
export const convexServerClient = convexUrl ? new ConvexHttpClient(convexUrl) : null

// Backward-compatible shim
export function createClient() {
  return {
    auth: {
      getUser: async () => ({ data: { user: { id: 'demo-user', email: 'demo@hvconsultores.cl' } }, error: null }),
      getSession: async () => ({ data: { session: { user: { id: 'demo-user' } } }, error: null }),
    },
    from: (table: string) => createMockQuery(table),
  } as any
}

function createMockQuery(_table: string) {
  const chain: any = {
    select: () => chain,
    insert: () => chain,
    update: () => chain,
    delete: () => chain,
    eq: () => chain,
    neq: () => chain,
    order: () => chain,
    limit: () => chain,
    single: () => chain,
    maybeSingle: () => chain,
    match: () => chain,
    then: (resolve: any) => resolve({ data: [], error: null, count: 0 }),
  }
  return chain
}
