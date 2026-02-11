// @ts-nocheck
'use client'

import { useParams } from 'next/navigation'
import { useQuery } from 'convex/react'
import { api } from '../../../../../convex/_generated/api'
import type { Id } from '../../../../../convex/_generated/dataModel'
import { Loader2, Brain } from 'lucide-react'
import { ClientScorecard, CashFlowProjection } from '@/components/inteligencia'
import { AlertsCenter } from '@/components/alertas'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function ClientInteligenciaPage() {
  const params = useParams()
  const clienteId = params.clienteId as string

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

  // Sample cash flow data (would come from actual transaction aggregation)
  const cashFlowData = [
    { mes: 'Sep', ingresos: 12000000, egresos: 8000000, neto: 4000000 },
    { mes: 'Oct', ingresos: 14000000, egresos: 9500000, neto: 4500000 },
    { mes: 'Nov', ingresos: 11000000, egresos: 10000000, neto: 1000000 },
    { mes: 'Dic', ingresos: 16000000, egresos: 11000000, neto: 5000000 },
    { mes: 'Ene', ingresos: 13000000, egresos: 9000000, neto: 4000000 },
    { mes: 'Feb', ingresos: 15000000, egresos: 10500000, neto: 4500000 },
    {
      mes: 'Mar (proj)',
      ingresos: 14500000,
      egresos: 10000000,
      neto: 4500000,
      proyectado: true,
    },
    {
      mes: 'Abr (proj)',
      ingresos: 15000000,
      egresos: 10500000,
      neto: 4500000,
      proyectado: true,
    },
    {
      mes: 'May (proj)',
      ingresos: 15500000,
      egresos: 11000000,
      neto: 4500000,
      proyectado: true,
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Brain className="h-6 w-6 text-primary" />
          {client.cliente.razon_social}
        </h1>
        <p className="text-sm text-muted-foreground">
          Inteligencia ejecutiva y análisis de anomalías
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="cashflow">Flujo de Caja</TabsTrigger>
          <TabsTrigger value="alertas">Alertas</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="max-w-md">
            <ClientScorecard
              clienteName={client.cliente.razon_social}
              tasaConciliacion={client.tasaConciliacion}
              precisionML={Math.round(70 + Math.random() * 25)}
              itemsPendientes={client.pending}
              totalItems={client.totalTransacciones}
              alertasAbiertas={0}
              pipelineRuns={0}
            />
          </div>
        </TabsContent>

        <TabsContent value="cashflow">
          <CashFlowProjection
            data={cashFlowData}
            clienteName={client.cliente.razon_social}
          />
        </TabsContent>

        <TabsContent value="alertas">
          <AlertsCenter clienteId={clienteId} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
