'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Play,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
  Download,
  Settings,
  RefreshCw,
  Calendar,
  Users,
  Activity,
  Shield,
} from 'lucide-react'
import type { SiiJob, SiiDashboardStats, SiiScheduledTask, SiiTaskType } from '@/lib/sii-rpa/types'
import { TaskSelector } from './task-selector'
import { JobHistory } from './job-history'
import { CredentialsManager } from './credentials-manager'
import { F29Integration } from './f29-integration'

// ============================================================================
// TYPES
// ============================================================================

interface ClienteConCredenciales {
  id: string
  nombre: string
  rut: string
  credencial_id: string
  ultimo_login?: string
  validacion_exitosa: boolean
}

interface SiiDashboardContentProps {
  stats: SiiDashboardStats
  jobsRecientes: SiiJob[]
  clientes: ClienteConCredenciales[]
  scheduledTasks: SiiScheduledTask[]
}

// ============================================================================
// TASK TYPE LABELS
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

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function SiiDashboardContent({
  stats,
  jobsRecientes,
  clientes,
  scheduledTasks,
}: SiiDashboardContentProps) {
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedCliente, setSelectedCliente] = useState<string | null>(null)

  return (
    <div className="flex-1 space-y-4 p-4 md:p-6 lg:p-8">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Clientes Configurados"
          value={stats.total_clientes_con_credenciales}
          description="Con credenciales SII activas"
          icon={Users}
          variant="default"
        />
        <StatsCard
          title="Jobs Hoy"
          value={stats.jobs_hoy}
          description={`${stats.jobs_exitosos_hoy} exitosos, ${stats.jobs_fallidos_hoy} fallidos`}
          icon={Activity}
          variant="default"
        />
        <StatsCard
          title="Jobs Exitosos"
          value={stats.jobs_exitosos_hoy}
          description="Completados hoy"
          icon={CheckCircle2}
          variant="success"
        />
        <StatsCard
          title="Pendientes"
          value={stats.jobs_pendientes}
          description="En cola de ejecución"
          icon={Clock}
          variant={stats.jobs_pendientes > 5 ? 'warning' : 'default'}
        />
      </div>

      {/* Próxima Tarea Programada */}
      {stats.proxima_tarea_programada && (
        <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-blue-500" />
              <div>
                <p className="font-medium">Próxima Tarea Programada</p>
                <p className="text-sm text-muted-foreground">
                  {stats.proxima_tarea_programada.cliente_nombre} -{' '}
                  {TASK_TYPE_LABELS[stats.proxima_tarea_programada.task_type]}
                </p>
              </div>
            </div>
            <Badge variant="outline" className="bg-background">
              {new Date(stats.proxima_tarea_programada.proxima_ejecucion).toLocaleString('es-CL')}
            </Badge>
          </CardContent>
        </Card>
      )}

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5 lg:w-[650px]">
          <TabsTrigger value="overview">
            <Activity className="mr-2 h-4 w-4" />
            Resumen
          </TabsTrigger>
          <TabsTrigger value="tasks">
            <Play className="mr-2 h-4 w-4" />
            Ejecutar
          </TabsTrigger>
          <TabsTrigger value="f29">
            <FileText className="mr-2 h-4 w-4" />
            F29
          </TabsTrigger>
          <TabsTrigger value="history">
            <Download className="mr-2 h-4 w-4" />
            Historial
          </TabsTrigger>
          <TabsTrigger value="credentials">
            <Shield className="mr-2 h-4 w-4" />
            Credenciales
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Jobs Recientes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Jobs Recientes
                </CardTitle>
                <CardDescription>Últimas ejecuciones del sistema</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {jobsRecientes.slice(0, 5).map((job) => (
                    <JobRow key={job.id} job={job} />
                  ))}
                  {jobsRecientes.length === 0 && (
                    <p className="text-center text-muted-foreground py-4">
                      No hay jobs recientes
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Clientes Activos */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Clientes Configurados
                </CardTitle>
                <CardDescription>Clientes con credenciales SII activas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {clientes.slice(0, 5).map((cliente) => (
                    <ClienteRow
                      key={cliente.id}
                      cliente={cliente}
                      onSelect={() => {
                        setSelectedCliente(cliente.id)
                        setActiveTab('tasks')
                      }}
                    />
                  ))}
                  {clientes.length === 0 && (
                    <div className="text-center py-4">
                      <p className="text-muted-foreground">No hay clientes configurados</p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={() => setActiveTab('credentials')}
                      >
                        <Shield className="mr-2 h-4 w-4" />
                        Configurar Credenciales
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tareas Programadas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Tareas Programadas
              </CardTitle>
              <CardDescription>Ejecuciones automáticas configuradas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {scheduledTasks.slice(0, 5).map((task) => (
                  <ScheduledTaskRow key={task.id} task={task} />
                ))}
                {scheduledTasks.length === 0 && (
                  <p className="text-center text-muted-foreground py-4">
                    No hay tareas programadas
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tasks Tab */}
        <TabsContent value="tasks">
          <TaskSelector
            clientes={clientes}
            selectedCliente={selectedCliente}
            onClienteChange={setSelectedCliente}
          />
        </TabsContent>

        {/* F29 Integration Tab */}
        <TabsContent value="f29">
          <F29Integration clienteId={selectedCliente || undefined} />
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history">
          <JobHistory jobs={jobsRecientes} />
        </TabsContent>

        {/* Credentials Tab */}
        <TabsContent value="credentials">
          <CredentialsManager clientes={clientes} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function StatsCard({
  title,
  value,
  description,
  icon: Icon,
  variant = 'default',
}: {
  title: string
  value: number
  description: string
  icon: React.ComponentType<{ className?: string }>
  variant?: 'default' | 'success' | 'warning' | 'error'
}) {
  const variantStyles = {
    default: 'bg-card',
    success: 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800',
    warning: 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800',
    error: 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800',
  }

  const iconStyles = {
    default: 'text-muted-foreground',
    success: 'text-green-500',
    warning: 'text-yellow-500',
    error: 'text-red-500',
  }

  return (
    <Card className={variantStyles[variant]}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${iconStyles[variant]}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )
}

function JobRow({ job }: { job: SiiJob }) {
  const statusConfig = {
    pendiente: { icon: Clock, color: 'text-yellow-500', badge: 'bg-yellow-100' },
    ejecutando: { icon: RefreshCw, color: 'text-blue-500', badge: 'bg-blue-100' },
    completado: { icon: CheckCircle2, color: 'text-green-500', badge: 'bg-green-100' },
    fallido: { icon: XCircle, color: 'text-red-500', badge: 'bg-red-100' },
    cancelado: { icon: AlertCircle, color: 'text-gray-500', badge: 'bg-gray-100' },
  }

  const config = statusConfig[job.status]
  const Icon = config.icon

  return (
    <div className="flex items-center justify-between rounded-lg border p-3">
      <div className="flex items-center gap-3">
        <Icon className={`h-4 w-4 ${config.color}`} />
        <div>
          <p className="text-sm font-medium">{TASK_TYPE_LABELS[job.task_type]}</p>
          <p className="text-xs text-muted-foreground">
            {new Date(job.created_at).toLocaleString('es-CL')}
          </p>
        </div>
      </div>
      <Badge variant="outline" className={config.badge}>
        {job.status}
      </Badge>
    </div>
  )
}

function ClienteRow({
  cliente,
  onSelect,
}: {
  cliente: ClienteConCredenciales
  onSelect: () => void
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border p-3">
      <div>
        <p className="text-sm font-medium">{cliente.nombre}</p>
        <p className="text-xs text-muted-foreground">{cliente.rut}</p>
      </div>
      <div className="flex items-center gap-2">
        {cliente.validacion_exitosa ? (
          <Badge variant="outline" className="bg-green-100">
            <CheckCircle2 className="mr-1 h-3 w-3" />
            Validado
          </Badge>
        ) : (
          <Badge variant="outline" className="bg-yellow-100">
            <AlertCircle className="mr-1 h-3 w-3" />
            Sin validar
          </Badge>
        )}
        <Button size="sm" variant="ghost" onClick={onSelect}>
          <Play className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

function ScheduledTaskRow({ task }: { task: SiiScheduledTask }) {
  return (
    <div className="flex items-center justify-between rounded-lg border p-3">
      <div className="flex items-center gap-3">
        <Calendar className={`h-4 w-4 ${task.activo ? 'text-blue-500' : 'text-gray-400'}`} />
        <div>
          <p className="text-sm font-medium">{TASK_TYPE_LABELS[task.task_type]}</p>
          <p className="text-xs text-muted-foreground">{task.cron_expression}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant={task.activo ? 'default' : 'secondary'}>
          {task.activo ? 'Activa' : 'Inactiva'}
        </Badge>
        {task.proxima_ejecucion && (
          <span className="text-xs text-muted-foreground">
            {new Date(task.proxima_ejecucion).toLocaleDateString('es-CL')}
          </span>
        )}
      </div>
    </div>
  )
}
