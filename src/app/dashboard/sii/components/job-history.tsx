// @ts-nocheck — temporary: types need update after Convex migration
'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  Search,
  Eye,
  Download,
  FileImage,
  StopCircle,
  Loader2,
} from 'lucide-react'
import { cancelJob } from '../actions'
import type { SiiJob, SiiTaskType, SiiJobStatus, SiiExecutionStep } from '@/lib/sii-rpa/types'

// ============================================================================
// TYPES
// ============================================================================

interface JobHistoryProps {
  jobs: SiiJob[]
}

// ============================================================================
// CONSTANTS
// ============================================================================

const TASK_TYPE_LABELS: Record<SiiTaskType, string> = {
  login_test: 'Validar Login',
  f29_submit: 'Enviar F29',
  f29_download: 'Descargar F29',
  libro_compras: 'Libro Compras',
  libro_ventas: 'Libro Ventas',
  situacion_tributaria: 'Situación Tributaria',
  certificate_download: 'Descargar Certificado',
}

const STATUS_CONFIG: Record<
  SiiJobStatus,
  {
    icon: React.ComponentType<{ className?: string }>
    color: string
    bgColor: string
    label: string
  }
> = {
  pendiente: {
    icon: Clock,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900',
    label: 'Pendiente',
  },
  ejecutando: {
    icon: RefreshCw,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100 dark:bg-blue-900',
    label: 'Ejecutando',
  },
  completado: {
    icon: CheckCircle2,
    color: 'text-green-600',
    bgColor: 'bg-green-100 dark:bg-green-900',
    label: 'Completado',
  },
  fallido: {
    icon: XCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-100 dark:bg-red-900',
    label: 'Fallido',
  },
  cancelado: {
    icon: AlertCircle,
    color: 'text-gray-600',
    bgColor: 'bg-gray-100 dark:bg-gray-900',
    label: 'Cancelado',
  },
}

// ============================================================================
// COMPONENT
// ============================================================================

export function JobHistory({ jobs }: JobHistoryProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<SiiJobStatus | 'all'>('all')
  const [taskFilter, setTaskFilter] = useState<SiiTaskType | 'all'>('all')
  const [selectedJob, setSelectedJob] = useState<SiiJob | null>(null)

  // Filtrar jobs
  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      searchTerm === '' ||
      TASK_TYPE_LABELS[job.task_type].toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.id.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === 'all' || job.status === statusFilter
    const matchesTask = taskFilter === 'all' || job.task_type === taskFilter

    return matchesSearch && matchesStatus && matchesTask
  })

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Historial de Jobs</CardTitle>
          <CardDescription>Registro de todas las ejecuciones del sistema SII RPA</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por tarea o ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as SiiJobStatus | 'all')}
            >
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="pendiente">Pendiente</SelectItem>
                <SelectItem value="ejecutando">Ejecutando</SelectItem>
                <SelectItem value="completado">Completado</SelectItem>
                <SelectItem value="fallido">Fallido</SelectItem>
                <SelectItem value="cancelado">Cancelado</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={taskFilter}
              onValueChange={(v) => setTaskFilter(v as SiiTaskType | 'all')}
            >
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Tipo de tarea" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las tareas</SelectItem>
                {Object.entries(TASK_TYPE_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de Jobs */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Estado</TableHead>
                <TableHead>Tarea</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Período</TableHead>
                <TableHead>Creado</TableHead>
                <TableHead>Duración</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredJobs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No se encontraron jobs
                  </TableCell>
                </TableRow>
              ) : (
                filteredJobs.map((job) => (
                  <JobRow
                    key={job.id}
                    job={job}
                    onViewDetails={() => setSelectedJob(job)}
                  />
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal de Detalles */}
      <JobDetailsDialog job={selectedJob} onClose={() => setSelectedJob(null)} />
    </div>
  )
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function JobRow({
  job,
  onViewDetails,
}: {
  job: SiiJob
  onViewDetails: () => void
}) {
  const [isPending, startTransition] = useTransition()
  const config = STATUS_CONFIG[job.status]
  const Icon = config.icon

  const handleCancel = () => {
    startTransition(async () => {
      await cancelJob(job.id)
    })
  }

  const duration = job.completed_at && job.started_at
    ? formatDuration(new Date(job.started_at), new Date(job.completed_at))
    : job.started_at
      ? 'En curso...'
      : '-'

  const cliente = job.cliente as { nombre_razon_social?: string; rut?: string } | undefined

  return (
    <TableRow>
      <TableCell>
        <Badge variant="outline" className={`${config.bgColor} ${config.color} border-0`}>
          <Icon className={`mr-1 h-3 w-3 ${job.status === 'ejecutando' ? 'animate-spin' : ''}`} />
          {config.label}
        </Badge>
      </TableCell>
      <TableCell className="font-medium">{TASK_TYPE_LABELS[job.task_type]}</TableCell>
      <TableCell>
        <div>
          <p className="text-sm">{cliente?.nombre_razon_social || 'N/A'}</p>
          <p className="text-xs text-muted-foreground">{cliente?.rut || ''}</p>
        </div>
      </TableCell>
      <TableCell>{job.periodo || '-'}</TableCell>
      <TableCell>
        <div>
          <p className="text-sm">{new Date(job.created_at).toLocaleDateString('es-CL')}</p>
          <p className="text-xs text-muted-foreground">
            {new Date(job.created_at).toLocaleTimeString('es-CL')}
          </p>
        </div>
      </TableCell>
      <TableCell>{duration}</TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-2">
          <Button size="sm" variant="ghost" onClick={onViewDetails}>
            <Eye className="h-4 w-4" />
          </Button>
          {(job.status === 'pendiente' || job.status === 'ejecutando') && (
            <Button
              size="sm"
              variant="ghost"
              onClick={handleCancel}
              disabled={isPending}
              className="text-red-600 hover:text-red-700"
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <StopCircle className="h-4 w-4" />
              )}
            </Button>
          )}
          {job.archivos_descargados && job.archivos_descargados.length > 0 && (
            <Button size="sm" variant="ghost">
              <Download className="h-4 w-4" />
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  )
}

function JobDetailsDialog({
  job,
  onClose,
}: {
  job: SiiJob | null
  onClose: () => void
}) {
  if (!job) return null

  const config = STATUS_CONFIG[job.status]
  const Icon = config.icon
  const cliente = job.cliente as { nombre_razon_social?: string; rut?: string } | undefined
  const steps = (job as SiiJob & { steps?: SiiExecutionStep[] }).steps || []

  return (
    <Dialog open={!!job} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className={config.color} />
            {TASK_TYPE_LABELS[job.task_type]}
          </DialogTitle>
          <DialogDescription>
            Job ID: {job.id}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Info General */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Cliente</p>
              <p>{cliente?.nombre_razon_social || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">RUT</p>
              <p>{cliente?.rut || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Período</p>
              <p>{job.periodo || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Estado</p>
              <Badge variant="outline" className={`${config.bgColor} ${config.color} border-0`}>
                {config.label}
              </Badge>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Creado</p>
              <p>{new Date(job.created_at).toLocaleString('es-CL')}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Reintentos</p>
              <p>
                {job.retry_count} / {job.max_retries}
              </p>
            </div>
          </div>

          {/* Error */}
          {job.error_message && (
            <div className="rounded-lg bg-red-50 p-4 dark:bg-red-950">
              <p className="text-sm font-medium text-red-800 dark:text-red-200">Error</p>
              <p className="text-sm text-red-700 dark:text-red-300">{job.error_message}</p>
            </div>
          )}

          {/* Pasos de Ejecución */}
          {steps.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-medium text-muted-foreground">
                Pasos de Ejecución
              </p>
              <div className="space-y-2">
                {steps.map((step, index) => (
                  <div
                    key={step.id}
                    className="flex items-center gap-3 rounded-lg border p-3"
                  >
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs">
                      {index + 1}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{step.step_name}</p>
                      {step.step_description && (
                        <p className="text-xs text-muted-foreground">{step.step_description}</p>
                      )}
                    </div>
                    <StepStatusBadge status={step.status} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Archivos Descargados */}
          {job.archivos_descargados && job.archivos_descargados.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-medium text-muted-foreground">
                Archivos Descargados
              </p>
              <div className="space-y-2">
                {job.archivos_descargados.map((archivo, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 rounded-lg border p-2"
                  >
                    <Download className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{archivo}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Screenshots */}
          {job.screenshots && job.screenshots.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-medium text-muted-foreground">Screenshots</p>
              <div className="flex gap-2 flex-wrap">
                {job.screenshots.map((screenshot, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 rounded-lg border p-2"
                  >
                    <FileImage className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{screenshot.step}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function StepStatusBadge({ status }: { status: string }) {
  const configs: Record<string, { color: string; bg: string }> = {
    pending: { color: 'text-gray-600', bg: 'bg-gray-100' },
    running: { color: 'text-blue-600', bg: 'bg-blue-100' },
    success: { color: 'text-green-600', bg: 'bg-green-100' },
    failed: { color: 'text-red-600', bg: 'bg-red-100' },
    skipped: { color: 'text-yellow-600', bg: 'bg-yellow-100' },
  }

  const config = configs[status] || configs.pending

  return (
    <Badge variant="outline" className={`${config.bg} ${config.color} border-0`}>
      {status}
    </Badge>
  )
}

// ============================================================================
// HELPERS
// ============================================================================

function formatDuration(start: Date, end: Date): string {
  const ms = end.getTime() - start.getTime()
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)

  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`
  }
  return `${seconds}s`
}
