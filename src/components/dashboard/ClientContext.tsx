'use client'

import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { useConvexAvailable } from '@/providers/convex-provider'

const STORAGE_KEY = 'hv_active_client'

interface Cliente {
  _id: string
  razon_social: string
  rut: string
  nombre_fantasia?: string
  activo?: boolean
}

interface ClientContextType {
  activeClientId: string | null
  activeClient: Cliente | null
  clients: Cliente[]
  setActiveClientId: (id: string | null) => void
  clearActiveClient: () => void
}

const ClientContext = createContext<ClientContextType>({
  activeClientId: null,
  activeClient: null,
  clients: [],
  setActiveClientId: () => {},
  clearActiveClient: () => {},
})

function getStoredClientId(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(STORAGE_KEY)
}

export function ClientProvider({ children }: { children: React.ReactNode }) {
  const [activeClientId, setActiveClientIdState] = useState<string | null>(null)
  const available = useConvexAvailable()

  // Hydrate from localStorage after mount to avoid SSR mismatch
  useEffect(() => {
    const stored = getStoredClientId()
    if (stored) setActiveClientIdState(stored)
  }, [])

  const clientsRaw = useQuery(
    api.clients.listClients,
    available ? { activo: true } : 'skip'
  )

  const clients = (clientsRaw ?? []) as unknown as Cliente[]

  // Validate stored client still exists in active clients list
  useEffect(() => {
    if (activeClientId && clients.length > 0) {
      const exists = clients.some((c) => c._id === activeClientId)
      if (!exists) {
        setActiveClientIdState(null)
        localStorage.removeItem(STORAGE_KEY)
      }
    }
  }, [activeClientId, clients])

  const activeClient = activeClientId
    ? clients.find((c) => c._id === activeClientId) ?? null
    : null

  const setActiveClientId = useCallback((id: string | null) => {
    setActiveClientIdState(id)
    if (id) {
      localStorage.setItem(STORAGE_KEY, id)
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [])

  const clearActiveClient = useCallback(() => {
    setActiveClientIdState(null)
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  return (
    <ClientContext.Provider
      value={{ activeClientId, activeClient, clients, setActiveClientId, clearActiveClient }}
    >
      {children}
    </ClientContext.Provider>
  )
}

export function useClientContext() {
  return useContext(ClientContext)
}
