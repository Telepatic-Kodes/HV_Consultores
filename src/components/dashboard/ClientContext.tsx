'use client'

import { createContext, useContext, useState, useCallback } from 'react'
import { useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { useConvexAvailable } from '@/providers/convex-provider'

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

export function ClientProvider({ children }: { children: React.ReactNode }) {
  const [activeClientId, setActiveClientIdState] = useState<string | null>(null)
  const available = useConvexAvailable()

  const clientsRaw = useQuery(
    api.clients.listClients,
    available ? { activo: true } : 'skip'
  )

  const clients = (clientsRaw ?? []) as unknown as Cliente[]

  const activeClient = activeClientId
    ? clients.find((c) => c._id === activeClientId) ?? null
    : null

  const setActiveClientId = useCallback((id: string | null) => {
    setActiveClientIdState(id)
  }, [])

  const clearActiveClient = useCallback(() => {
    setActiveClientIdState(null)
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
