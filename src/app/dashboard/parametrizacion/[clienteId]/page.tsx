'use client'

import { useParams, useRouter } from 'next/navigation'
import { useQuery } from 'convex/react'
import { api } from '../../../../../convex/_generated/api'
import type { Id } from '../../../../../convex/_generated/dataModel'
import { ClientOnboardingWizard } from '@/components/parametrizacion/ClientOnboardingWizard'
import { Loader2 } from 'lucide-react'

export default function ClientParametrizacionPage() {
  const params = useParams()
  const router = useRouter()
  const clienteId = params.clienteId as string

  // We need to get client info - reuse getClientsWithMatchingStats for now
  const clients = useQuery(api.matching.getClientsWithMatchingStats)
  const client = clients?.find((c) => c.cliente._id === clienteId)

  if (clients === undefined) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!client) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-sm font-medium">Cliente no encontrado</p>
      </div>
    )
  }

  return (
    <div className="py-6">
      <ClientOnboardingWizard
        clienteId={clienteId}
        clienteName={client.cliente.razon_social}
        onComplete={() => router.push('/dashboard/parametrizacion')}
      />
    </div>
  )
}
