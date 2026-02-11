// Supabase browser client REMOVED — now using Convex for all data access.
// This file provides backward-compatible exports during migration.

export function createClient() {
  return {
    auth: {
      getUser: async () => ({ data: { user: { id: 'demo-user', email: 'demo@hvconsultores.cl' } }, error: null }),
      getSession: async () => ({ data: { session: { user: { id: 'demo-user' } } }, error: null }),
      signInWithPassword: async () => ({ data: { user: { id: 'demo-user', email: 'demo@hvconsultores.cl' } }, error: null }),
      onAuthStateChange: (_callback: any) => ({ data: { subscription: { unsubscribe: () => {} } } }),
    },
    from: (_table: string) => {
      const chain: any = {
        select: () => chain,
        insert: () => chain,
        update: () => chain,
        delete: () => chain,
        eq: () => chain,
        order: () => chain,
        limit: () => chain,
        single: () => chain,
        then: (resolve: any) => resolve({ data: [], error: null }),
      }
      return chain
    },
  } as any
}
