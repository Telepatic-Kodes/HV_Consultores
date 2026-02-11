// Supabase client REMOVED — now using Convex for all data access.
// This file provides backward-compatible exports during migration.
// Files still importing from here should be migrated to use Convex directly.

import { ConvexHttpClient } from 'convex/browser'

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL

// Server-side Convex client for use in Server Actions and API routes
export const convexClient = convexUrl ? new ConvexHttpClient(convexUrl) : null

// Backward-compatible shim: DO NOT use for new code
// This provides a mock supabase object so unmigrated files don't crash at import time
export const supabase = {
  auth: {
    getUser: async () => ({ data: { user: { id: 'demo-user', email: 'demo@hvconsultores.cl' } }, error: null }),
    getSession: async () => ({ data: { session: { user: { id: 'demo-user' } } }, error: null }),
    onAuthStateChange: (_callback: any) => ({ data: { subscription: { unsubscribe: () => {} } } }),
    signInWithPassword: async () => ({ data: { user: { id: 'demo-user' } }, error: null }),
    signUp: async () => ({ data: { user: { id: 'demo-user' } }, error: null }),
    signOut: async () => ({ error: null }),
  },
  from: (table: string) => createMockQuery(table),
  channel: () => ({
    on: () => ({ subscribe: () => ({ unsubscribe: () => {} }) }),
    subscribe: () => ({ unsubscribe: () => {} }),
  }),
  getChannels: () => [],
  removeChannel: () => {},
} as any

// Mock query builder that returns empty results
// This prevents crashes in unmigrated files while they're being converted
function createMockQuery(_table: string) {
  const chain: any = {
    select: () => chain,
    insert: () => chain,
    update: () => chain,
    delete: () => chain,
    upsert: () => chain,
    eq: () => chain,
    neq: () => chain,
    gt: () => chain,
    gte: () => chain,
    lt: () => chain,
    lte: () => chain,
    like: () => chain,
    ilike: () => chain,
    is: () => chain,
    in: () => chain,
    order: () => chain,
    limit: () => chain,
    range: () => chain,
    single: () => chain,
    maybeSingle: () => chain,
    match: () => chain,
    filter: () => chain,
    or: () => chain,
    not: () => chain,
    then: (resolve: any) => resolve({ data: [], error: null, count: 0 }),
  }
  return chain
}

// Backward-compatible type export
export type Database = any

export const createServiceClient = () => supabase
