'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Server,
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  Cpu,
  HardDrive,
  Zap,
  AlertTriangle,
} from 'lucide-react'
import type { SiiRpaServer } from '@/lib/sii-rpa/types'

// ============================================================================
// TYPES
// ============================================================================

interface ServerMonitorProps {
  servers: SiiRpaServer[]
  onRefresh: () => void
  isLoading?: boolean
}

interface ServerHealth {
  status: 'healthy' | 'degraded' | 'down' | 'unknown'
  lastCheck: Date
  latencyMs?: number
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ServerMonitor({ servers, onRefresh, isLoading = false }: ServerMonitorProps) {
  const [serverHealth, setServerHealth] = useState<Map<string, ServerHealth>>(new Map())
  const [checking, setChecking] = useState(false)

  // Check server health periodically
  useEffect(() => {
    const checkHealth = async () => {
      const newHealth = new Map<string, ServerHealth>()

      for (const server of servers) {
        if (!server.is_active) {
          newHealth.set(server.id, { status: 'down', lastCheck: new Date() })
          continue
        }

        // Check if heartbeat is recent (within 2 minutes)
        const lastHeartbeat = server.last_heartbeat
          ? new Date(server.last_heartbeat)
          : null
        const now = new Date()

        if (!lastHeartbeat) {
          newHealth.set(server.id, { status: 'unknown', lastCheck: now })
        } else if (now.getTime() - lastHeartbeat.getTime() > 2 * 60 * 1000) {
          newHealth.set(server.id, { status: 'down', lastCheck: now })
        } else if (server.success_rate < 80) {
          newHealth.set(server.id, { status: 'degraded', lastCheck: now })
        } else {
          newHealth.set(server.id, { status: 'healthy', lastCheck: now })
        }
      }

      setServerHealth(newHealth)
    }

    checkHealth()
    const interval = setInterval(checkHealth, 30000) // Check every 30 seconds

    return () => clearInterval(interval)
  }, [servers])

  const handleRefresh = async () => {
    setChecking(true)
    await onRefresh()
    setChecking(false)
  }

  // Calculate overall status
  const healthyCount = Array.from(serverHealth.values()).filter(
    (h) => h.status === 'healthy'
  ).length
  const totalActive = servers.filter((s) => s.is_active).length

  return (
    <div className="space-y-4">
      {/* Overview Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              Servidores RPA
            </CardTitle>
            <CardDescription>Estado de los servidores de automatización</CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={checking || isLoading}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${checking || isLoading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">
                  Servidores Activos
                </span>
                <span className="text-sm font-medium">
                  {healthyCount} / {totalActive}
                </span>
              </div>
              <Progress
                value={totalActive > 0 ? (healthyCount / totalActive) * 100 : 0}
                className="h-2"
              />
            </div>
            <StatusBadge
              status={
                healthyCount === totalActive
                  ? 'healthy'
                  : healthyCount > 0
                  ? 'degraded'
                  : 'down'
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Server List */}
      <div className="grid gap-4 md:grid-cols-2">
        {servers.map((server) => {
          const health = serverHealth.get(server.id)
          return (
            <ServerCard key={server.id} server={server} health={health} />
          )
        })}

        {servers.length === 0 && (
          <Card className="col-span-2">
            <CardContent className="flex flex-col items-center justify-center py-10">
              <Server className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">
                No hay servidores RPA configurados.
                <br />
                Configure un servidor para comenzar.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

// ============================================================================
// SERVER CARD
// ============================================================================

function ServerCard({
  server,
  health,
}: {
  server: SiiRpaServer
  health?: ServerHealth
}) {
  const status = health?.status || 'unknown'
  const utilizationPercent =
    server.max_concurrent_jobs > 0
      ? (server.current_jobs / server.max_concurrent_jobs) * 100
      : 0

  return (
    <Card
      className={
        status === 'down'
          ? 'border-red-200 dark:border-red-800'
          : status === 'degraded'
          ? 'border-yellow-200 dark:border-yellow-800'
          : ''
      }
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <ServerStatusIcon status={status} />
            {server.server_name}
          </CardTitle>
          <StatusBadge status={status} size="sm" />
        </div>
        <CardDescription className="text-xs">{server.server_url}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <StatItem
            icon={Activity}
            label="Jobs Activos"
            value={`${server.current_jobs} / ${server.max_concurrent_jobs}`}
          />
          <StatItem
            icon={Zap}
            label="Tasa de Éxito"
            value={`${server.success_rate.toFixed(1)}%`}
            highlight={server.success_rate < 80}
          />
          <StatItem
            icon={Clock}
            label="Tiempo Promedio"
            value={
              server.avg_execution_time_ms
                ? `${Math.round(server.avg_execution_time_ms / 1000)}s`
                : 'N/A'
            }
          />
          <StatItem
            icon={HardDrive}
            label="Total Ejecutados"
            value={server.total_jobs_executed.toString()}
          />
        </div>

        {/* Utilization Bar */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-muted-foreground">Utilización</span>
            <span className="text-xs font-medium">{utilizationPercent.toFixed(0)}%</span>
          </div>
          <Progress
            value={utilizationPercent}
            className={`h-2 ${
              utilizationPercent > 80
                ? '[&>div]:bg-red-500'
                : utilizationPercent > 60
                ? '[&>div]:bg-yellow-500'
                : ''
            }`}
          />
        </div>

        {/* Supported Tasks */}
        <div>
          <p className="text-xs text-muted-foreground mb-2">Tareas Soportadas</p>
          <div className="flex flex-wrap gap-1">
            {server.supported_tasks.map((task) => (
              <Badge key={task} variant="secondary" className="text-xs">
                {TASK_LABELS[task] || task}
              </Badge>
            ))}
          </div>
        </div>

        {/* Last Heartbeat */}
        {server.last_heartbeat && (
          <p className="text-xs text-muted-foreground">
            Último heartbeat: {new Date(server.last_heartbeat).toLocaleString('es-CL')}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function StatusBadge({
  status,
  size = 'default',
}: {
  status: 'healthy' | 'degraded' | 'down' | 'unknown'
  size?: 'default' | 'sm'
}) {
  const config = {
    healthy: {
      label: 'Saludable',
      variant: 'default' as const,
      className: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    },
    degraded: {
      label: 'Degradado',
      variant: 'default' as const,
      className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
    },
    down: {
      label: 'Caído',
      variant: 'destructive' as const,
      className: '',
    },
    unknown: {
      label: 'Desconocido',
      variant: 'secondary' as const,
      className: '',
    },
  }

  const cfg = config[status]

  return (
    <Badge
      variant={cfg.variant}
      className={`${cfg.className} ${size === 'sm' ? 'text-xs' : ''}`}
    >
      {cfg.label}
    </Badge>
  )
}

function ServerStatusIcon({ status }: { status: 'healthy' | 'degraded' | 'down' | 'unknown' }) {
  switch (status) {
    case 'healthy':
      return <CheckCircle2 className="h-4 w-4 text-green-500" />
    case 'degraded':
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />
    case 'down':
      return <XCircle className="h-4 w-4 text-red-500" />
    default:
      return <Clock className="h-4 w-4 text-muted-foreground" />
  }
}

function StatItem({
  icon: Icon,
  label,
  value,
  highlight = false,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={`text-sm font-medium ${highlight ? 'text-yellow-600' : ''}`}>
          {value}
        </p>
      </div>
    </div>
  )
}

// ============================================================================
// CONSTANTS
// ============================================================================

const TASK_LABELS: Record<string, string> = {
  login_test: 'Login',
  f29_submit: 'F29 Envío',
  f29_download: 'F29 Descarga',
  libro_compras: 'L. Compras',
  libro_ventas: 'L. Ventas',
  situacion_tributaria: 'Situación',
  certificate_download: 'Certificados',
}
