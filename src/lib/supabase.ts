import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database.types'

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gifmgwaogpamdeeiymup.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Cliente público para uso en frontend
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

// Cliente con service role para uso en backend/server-side
export const createServiceClient = () => {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not defined')
  }
  return createClient<Database>(supabaseUrl, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

// Tipos exportados para conveniencia
export type { Database }
