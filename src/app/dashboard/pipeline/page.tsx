// @ts-nocheck
'use client'

import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import type { Id } from '../../../../convex/_generated/dataModel'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Workflow,
  Play,
  Loader2,
  CheckCircle,
  AlertTriangle,
  BarChart3,
} from 'lucide-react'
import { PipelineRunCard } from '@/components/pipeline'

export default function PipelinePage() {
  const activeRuns = useQuery(api.pipeline.getActivePipelineRuns)
  const stats = useQuery(api.pipeline.getPipelineStats)
  const clients = useQuery(api.matching.getClientsWithMatchingStats)

  const startPipeline = useMutation(api.pipeline.startPipeline)
  const pausePipeline = useMutation(api.pipeline.pausePipeline)
  const resumePipeline = useMutation(api.pipeline.resumePipeline)
  const runFullPipeline = useMutation(api.pipeline.runFullPipeline)

  const handleRunForClient = async (clienteId: string) => {
    await runFullPipeline({
      clienteId: clienteId as Id<'clientes'>,
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Workflow className="h-5 w-5 text-primary" />
            </div>
            Pipeline Automatizado
          </h1>
          <p className="text-muted-foreground mt-1">
            Orquesta el flujo completo: importar, normalizar, categorizar, conciliar, validar
          </p>
        </div>
      </div>

      {/* Global Stats */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Runs</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.totalRuns}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completados</CardTitle>
              <CheckCircle className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-emerald-600">
                {stats.completedRuns}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Errores</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-red-600">
                {stats.failedRuns}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tasa Éxito</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.successRate}%</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Active Runs */}
      {activeRuns && activeRuns.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Ejecuciones Activas</h2>
          {activeRuns.map((run) => (
            <PipelineRunCard
              key={run._id}
              run={run}
              onStart={(id) =>
                startPipeline({ runId: id as Id<'pipeline_runs'> })
              }
              onPause={(id) =>
                pausePipeline({ runId: id as Id<'pipeline_runs'> })
              }
              onResume={(id) =>
                resumePipeline({ runId: id as Id<'pipeline_runs'> })
              }
            />
          ))}
        </div>
      )}

      {/* Run Pipeline for Client */}
      <Card>
        <CardHeader>
          <CardTitle>Ejecutar Pipeline</CardTitle>
          <CardDescription>
            Selecciona un cliente para ejecutar el pipeline completo
          </CardDescription>
        </CardHeader>
        <CardContent>
          {clients === undefined ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : clients.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Sin clientes disponibles
            </p>
          ) : (
            <div className="space-y-2">
              {clients.map((item) => (
                <div
                  key={item.cliente._id}
                  className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {item.cliente.razon_social}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {item.cliente.rut} · {item.totalTransacciones} transacciones
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleRunForClient(item.cliente._id)}
                  >
                    <Play className="h-3.5 w-3.5 mr-1" />
                    Ejecutar
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
