'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { PipelineVisualizer } from './PipelineVisualizer'
import { Play, Pause, RotateCcw, Clock } from 'lucide-react'

interface PipelineRunCardProps {
  run: {
    _id: string
    estado: string
    paso_actual?: number
    total_pasos?: number
    resultado?: {
      transacciones_importadas?: number
      transacciones_matched?: number
      alertas_generadas?: number
      errores?: number
    }
    error_message?: string
    started_at?: string
    completed_at?: string
    periodo?: string
    cliente?: { razon_social: string; rut: string } | null
  }
  onStart?: (runId: string) => void
  onPause?: (runId: string) => void
  onResume?: (runId: string) => void
}

function getStatusBadge(estado: string) {
  switch (estado) {
    case 'completed':
      return { label: 'Completado', className: 'bg-emerald-100 text-emerald-700 border-emerald-200' }
    case 'failed':
      return { label: 'Error', className: 'bg-red-100 text-red-700 border-red-200' }
    case 'paused':
      return { label: 'Pausado', className: 'bg-amber-100 text-amber-700 border-amber-200' }
    case 'pending':
      return { label: 'Pendiente', className: 'bg-gray-100 text-gray-700 border-gray-200' }
    default:
      return { label: 'En proceso', className: 'bg-blue-100 text-blue-700 border-blue-200' }
  }
}

function formatDuration(start?: string, end?: string): string {
  if (!start) return '—'
  const s = new Date(start).getTime()
  const e = end ? new Date(end).getTime() : Date.now()
  const seconds = Math.round((e - s) / 1000)
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.round(seconds / 60)
  return `${minutes}m`
}

export function PipelineRunCard({
  run,
  onStart,
  onPause,
  onResume,
}: PipelineRunCardProps) {
  const status = getStatusBadge(run.estado)
  const isActive =
    run.estado !== 'completed' &&
    run.estado !== 'failed' &&
    run.estado !== 'pending' &&
    run.estado !== 'paused'

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {run.cliente && (
              <span className="text-sm font-semibold">
                {run.cliente.razon_social}
              </span>
            )}
            {run.periodo && (
              <Badge variant="outline" className="text-[10px]">
                {run.periodo}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Badge className={status.className}>{status.label}</Badge>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {formatDuration(run.started_at, run.completed_at)}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Pipeline steps */}
        <PipelineVisualizer
          estado={run.estado}
          pasoActual={run.paso_actual}
        />

        {/* Results */}
        {run.resultado && (
          <div className="grid grid-cols-4 gap-3 text-center">
            <div className="rounded-md border p-2">
              <p className="text-[10px] text-muted-foreground">Importadas</p>
              <p className="text-lg font-bold">
                {run.resultado.transacciones_importadas ?? 0}
              </p>
            </div>
            <div className="rounded-md border border-emerald-200 bg-emerald-50/50 p-2">
              <p className="text-[10px] text-emerald-600">Conciliadas</p>
              <p className="text-lg font-bold text-emerald-700">
                {run.resultado.transacciones_matched ?? 0}
              </p>
            </div>
            <div className="rounded-md border border-amber-200 bg-amber-50/50 p-2">
              <p className="text-[10px] text-amber-600">Alertas</p>
              <p className="text-lg font-bold text-amber-700">
                {run.resultado.alertas_generadas ?? 0}
              </p>
            </div>
            <div className="rounded-md border border-red-200 bg-red-50/50 p-2">
              <p className="text-[10px] text-red-600">Errores</p>
              <p className="text-lg font-bold text-red-700">
                {run.resultado.errores ?? 0}
              </p>
            </div>
          </div>
        )}

        {/* Error message */}
        {run.error_message && (
          <div className="rounded-md border border-red-200 bg-red-50/50 p-3">
            <p className="text-xs text-red-600">{run.error_message}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2">
          {run.estado === 'pending' && onStart && (
            <Button size="sm" onClick={() => onStart(run._id)}>
              <Play className="h-3.5 w-3.5 mr-1" />
              Iniciar
            </Button>
          )}
          {isActive && onPause && (
            <Button size="sm" variant="outline" onClick={() => onPause(run._id)}>
              <Pause className="h-3.5 w-3.5 mr-1" />
              Pausar
            </Button>
          )}
          {run.estado === 'paused' && onResume && (
            <Button size="sm" onClick={() => onResume(run._id)}>
              <RotateCcw className="h-3.5 w-3.5 mr-1" />
              Reanudar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
