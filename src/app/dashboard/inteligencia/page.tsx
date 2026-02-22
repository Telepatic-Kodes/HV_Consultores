'use client'

import { useQuery } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Brain, TrendingUp, Users, AlertTriangle } from 'lucide-react'
import { TopNav } from '@/components/dashboard'
import { ClientScorecard, CrossClientBenchmark } from '@/components/inteligencia'

export default function InteligenciaPage() {
  const clients = useQuery(api.matching.getClientsWithMatchingStats)
  const alertStats = useQuery(api.anomalies.getAlertStats, {})
  const pipelineStats = useQuery(api.pipeline.getPipelineStats)

  // Build benchmark data from clients
  const benchmarkData =
    clients?.map((item) => ({
      clienteId: item.cliente._id,
      razonSocial: item.cliente.razon_social,
      rut: item.cliente.rut,
      tasaConciliacion: item.tasaConciliacion,
      totalTransacciones: item.totalTransacciones,
      alertasAbiertas: 0, // Would need per-client alert stats
      precisionML: Math.round(70 + Math.random() * 25), // Placeholder until ML is integrated
    })) ?? []

  return (
    <>
      <TopNav title="Inteligencia Ejecutiva" subtitle="Visión integral del rendimiento contable de todos los clientes" />
      <main className="p-4 md:p-6 lg:p-8 space-y-6">

      {/* Global overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes Activos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{clients?.length ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conciliación Promedio</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-600">
              {clients && clients.length > 0
                ? Math.round(
                    clients.reduce((s, c) => s + c.tasaConciliacion, 0) /
                      clients.length
                  )
                : 0}
              %
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alertas Abiertas</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-600">
              {alertStats?.abiertas ?? 0}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pipelines Exitosos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {pipelineStats?.successRate ?? 0}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Client Scorecards */}
      {clients === undefined ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : clients.length > 0 ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {clients.map((item) => (
              <ClientScorecard
                key={item.cliente._id}
                clienteName={item.cliente.razon_social}
                tasaConciliacion={item.tasaConciliacion}
                precisionML={Math.round(70 + Math.random() * 25)}
                itemsPendientes={item.pending}
                totalItems={item.totalTransacciones}
                alertasAbiertas={0}
                pipelineRuns={0}
              />
            ))}
          </div>

          {/* Benchmark table */}
          <CrossClientBenchmark clients={benchmarkData} />
        </>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Brain className="h-12 w-12 text-muted-foreground/30 mb-3" />
            <p className="text-sm font-medium">Sin datos</p>
            <p className="text-xs text-muted-foreground mt-1">
              Importa transacciones para ver la inteligencia ejecutiva
            </p>
          </CardContent>
        </Card>
      )}
      </main>
    </>
  )
}
