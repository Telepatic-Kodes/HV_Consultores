// @ts-nocheck
'use client'

// =============================================================================
// Conciliación - Client-specific reconciliation workspace
// =============================================================================

import { useParams } from 'next/navigation'
import { useQuery } from 'convex/react'
import { api } from '../../../../../convex/_generated/api'
import type { Id } from '../../../../../convex/_generated/dataModel'
import Link from 'next/link'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MatchingWorkspace } from '@/components/conciliacion/MatchingWorkspace'

export default function ClienteConciliacionPage() {
  const params = useParams()
  const clienteId = params.clienteId as string

  // Fetch client info
  const clientes = useQuery(api.clients.listClientes, {})
  const cliente = clientes?.find((c) => c._id === clienteId)

  if (clientes === undefined) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Back navigation */}
      <Link href="/dashboard/conciliacion">
        <Button variant="ghost" size="sm" className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Volver a Conciliación
        </Button>
      </Link>

      {/* Workspace */}
      <MatchingWorkspace
        clienteId={clienteId}
        clienteNombre={cliente?.razon_social}
      />
    </div>
  )
}
