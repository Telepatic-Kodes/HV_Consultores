'use client'

import { useParams } from 'next/navigation'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../../../convex/_generated/api'
import type { Id } from '../../../../../convex/_generated/dataModel'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, Workflow, Play } from 'lucide-react'
import { PipelineRunCard } from '@/components/pipeline'

export default function ClientPipelinePage() {
  const params = useParams()
  const clienteId = params.clienteId as string

  const runs = useQuery(api.pipeline.getPipelineRuns, {
    clienteId: clienteId as Id<'clientes'>,
    limit: 10,
  })

  const startPipeline = useMutation(api.pipeline.startPipeline)
  const pausePipeline = useMutation(api.pipeline.pausePipeline)
  const resumePipeline = useMutation(api.pipeline.resumePipeline)
  const runFullPipeline = useMutation(api.pipeline.runFullPipeline)

  const handleNewRun = async () => {
    await runFullPipeline({
      clienteId: clienteId as Id<'clientes'>,
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Workflow className="h-6 w-6 text-primary" />
            Pipeline del Cliente
          </h1>
        </div>
        <Button onClick={handleNewRun}>
          <Play className="h-4 w-4 mr-1" />
          Nuevo Pipeline
        </Button>
      </div>

      {runs === undefined ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : runs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Workflow className="h-12 w-12 text-muted-foreground/30 mb-3" />
            <p className="text-sm font-medium">Sin ejecuciones</p>
            <p className="text-xs text-muted-foreground mt-1">
              Ejecuta el pipeline para procesar transacciones automáticamente
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {runs.map((run) => (
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
    </div>
  )
}
