'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import {
  ComplianceMetricsSummary,
  AnalyticsFilter,
} from '@/types/analytics'
import {
  CheckCircle,
  AlertCircle,
  Clock,
  Shield,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react'

interface ComplianceAnalyticsDashboardProps {
  organizationId: string
}

const FRAMEWORK_COLORS = {
  GDPR: '#3b82f6',
  HIPAA: '#10b981',
  SOC2: '#f59e0b',
  ISO27001: '#ef4444',
}

const COMPLIANCE_FRAMEWORKS = ['GDPR', 'HIPAA', 'SOC2', 'ISO27001'] as const

export const ComplianceAnalyticsDashboard: React.FC<ComplianceAnalyticsDashboardProps> = ({
  organizationId,
}) => {
  const [metrics, setMetrics] = useState<ComplianceMetricsSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [period, setPeriod] = useState('30d')

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setLoading(true)
        setError(null)

        const endDate = new Date()
        const startDate = new Date()
        switch (period) {
          case '7d':
            startDate.setDate(endDate.getDate() - 7)
            break
          case '30d':
            startDate.setMonth(endDate.getMonth() - 1)
            break
          case '90d':
            startDate.setMonth(endDate.getMonth() - 3)
            break
          case '1y':
            startDate.setFullYear(endDate.getFullYear() - 1)
            break
        }

        const response = await fetch('/api/analytics/compliance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            organizationId,
            dateRange: { startDate, endDate },
            groupBy: 'day',
          } as AnalyticsFilter),
        })

        if (!response.ok) throw new Error('Error al obtener métricas de cumplimiento')

        const data = await response.json()
        setMetrics(data.data)
      } catch (err) {
        console.error('Error fetching metrics:', err)
        setError('Error al cargar analítica de cumplimiento')
      } finally {
        setLoading(false)
      }
    }

    fetchMetrics()
  }, [organizationId, period])

  if (loading) return <DashboardSkeleton />

  if (error || !metrics) {
    return (
      <Card className='border-destructive'>
        <CardContent className='pt-6'>
          <p className='text-sm text-destructive'>{error || 'Sin datos disponibles'}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-3xl font-bold tracking-tight'>
            Cumplimiento y Reportes de Auditoría
          </h2>
          <p className='text-muted-foreground'>
            Seguimiento de cumplimiento GDPR, HIPAA, SOC2 e ISO 27001
          </p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className='w-[180px]'>
            <SelectValue placeholder='Seleccionar período' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='7d'>Últimos 7 días</SelectItem>
            <SelectItem value='30d'>Últimos 30 días</SelectItem>
            <SelectItem value='90d'>Últimos 90 días</SelectItem>
            <SelectItem value='1y'>Último año</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Overall Compliance Score */}
      <Card className='bg-gradient-to-br from-blue-50 to-cyan-50'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Shield className='h-5 w-5 text-blue-600' />
            Puntaje General de Cumplimiento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='flex items-baseline gap-4'>
            <span className='text-6xl font-bold text-blue-600'>
              {metrics.overallScore}
            </span>
            <div>
              <span className='text-lg text-muted-foreground'>/100</span>
              <p className='text-sm text-muted-foreground'>
                {metrics.overallScore >= 90
                  ? '✓ Excelente'
                  : metrics.overallScore >= 75
                    ? '⚠ Bueno'
                    : '✗ Requiere Atención'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Framework Compliance Scores */}
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        {COMPLIANCE_FRAMEWORKS.map((framework) => {
          const score = metrics[`${framework.toLowerCase()}Score` as keyof typeof metrics] as number
          const frameworkStatus = metrics.frameworks.find(f => f.framework === framework)

          return (
            <ComplianceScoreCard
              key={framework}
              framework={framework}
              score={score}
              status={frameworkStatus?.status || 'in-progress'}
            />
          )
        })}
      </div>

      {/* Compliance Radar Chart */}
      <Card>
        <CardHeader>
          <CardTitle className='text-lg'>Radar de Cumplimiento por Marco</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width='100%' height={350}>
            <RadarChart
              data={COMPLIANCE_FRAMEWORKS.map(framework => ({
                name: framework,
                score: metrics[`${framework.toLowerCase()}Score` as keyof typeof metrics],
              }))}
            >
              <PolarGrid strokeDasharray='3 3' />
              <PolarAngleAxis dataKey='name' />
              <PolarRadiusAxis angle={90} domain={[0, 100]} />
              <Radar
                name='Puntaje de Cumplimiento'
                dataKey='score'
                stroke='#3b82f6'
                fill='#3b82f6'
                fillOpacity={0.6}
              />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Framework Details Grid */}
      <div className='grid gap-6 md:grid-cols-2'>
        {metrics.frameworks.map((framework) => (
          <Card key={framework.framework}>
            <CardHeader>
              <CardTitle className='text-lg flex items-center justify-between'>
                {framework.framework}
                <StatusBadge status={framework.status} />
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div>
                <div className='flex items-center justify-between mb-2'>
                  <span className='text-sm text-muted-foreground'>Última Auditoría</span>
                  <span className='text-sm font-medium'>
                    {new Date(framework.lastAudit).toLocaleDateString()}
                  </span>
                </div>
                <div className='flex items-center justify-between'>
                  <span className='text-sm text-muted-foreground'>Próxima Auditoría</span>
                  <span className='text-sm font-medium'>
                    {new Date(framework.nextAudit).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className='border-t pt-4'>
                <div className='flex items-center justify-between mb-2'>
                  <span className='text-sm font-medium'>Problemas Encontrados</span>
                  <span className='text-lg font-bold text-red-600'>
                    {framework.issues}
                  </span>
                </div>
                <div className='flex items-center justify-between'>
                  <span className='text-sm font-medium'>Resueltos</span>
                  <span className='text-lg font-bold text-green-600'>
                    {framework.resolved}
                  </span>
                </div>
              </div>

              <div className='h-2 w-full overflow-hidden rounded-full bg-muted'>
                <div
                  className='h-full bg-gradient-to-r from-green-500 to-emerald-500'
                  style={{
                    width: `${(framework.resolved / Math.max(framework.issues, 1)) * 100}%`,
                  }}
                />
              </div>
              <p className='text-xs text-muted-foreground'>
                {framework.resolved} de {framework.issues} problemas resueltos
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Violations */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <AlertTriangle className='h-5 w-5 text-amber-600' />
            Violaciones y Hallazgos Recientes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {metrics.recentViolations.length > 0 ? (
            <div className='space-y-3'>
              {metrics.recentViolations.map((violation) => (
                <div key={violation.id} className='border rounded-lg p-3'>
                  <div className='flex items-start justify-between gap-2'>
                    <div className='flex-1'>
                      <div className='flex items-center gap-2'>
                        <span className='text-xs font-semibold text-white bg-gray-700 px-2 py-1 rounded'>
                          {violation.framework}
                        </span>
                        <SeverityBadge severity={violation.severity} />
                      </div>
                      <p className='mt-2 text-sm font-medium'>{violation.description}</p>
                      <p className='mt-1 text-xs text-muted-foreground'>
                        Detectado: {new Date(violation.detectedDate).toLocaleDateString()}
                        {violation.resolvedDate && ` • Resuelto: ${new Date(violation.resolvedDate).toLocaleDateString()}`}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className='flex items-center justify-center py-8'>
              <div className='text-center'>
                <CheckCircle className='h-12 w-12 text-green-500 mx-auto mb-2' />
                <p className='text-sm font-medium'>No se encontraron violaciones</p>
                <p className='text-xs text-muted-foreground'>Su organización está en buen estado</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Violation Timeline */}
      {metrics.violationTrendLast30Days && metrics.violationTrendLast30Days.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className='text-lg'>Tendencia de Violaciones (Últimos 30 Días)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width='100%' height={300}>
              <LineChart data={metrics.violationTrendLast30Days}>
                <CartesianGrid strokeDasharray='3 3' />
                <XAxis
                  dataKey='date'
                  tickFormatter={(date) =>
                    new Date(date).toLocaleDateString('es-ES', {
                      month: 'short',
                      day: 'numeric',
                    })
                  }
                />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type='monotone'
                  dataKey='count'
                  stroke='#ef4444'
                  name='Nuevas Violaciones'
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Control Implementation Status */}
      <Card>
        <CardHeader>
          <CardTitle className='text-lg'>Estado de Implementación de Controles</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            <div>
              <div className='flex items-center justify-between mb-2'>
                <span className='text-sm font-medium'>Controles Totales</span>
                <span className='text-sm font-bold'>{metrics.controlStatus.total}</span>
              </div>
              <div className='h-2 w-full overflow-hidden rounded-full bg-muted'>
                <div
                  className='h-full bg-blue-500'
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            <div>
              <div className='flex items-center justify-between mb-2'>
                <span className='text-sm font-medium'>Implementados</span>
                <span className='text-sm font-bold'>{metrics.controlStatus.implemented}</span>
              </div>
              <div className='h-2 w-full overflow-hidden rounded-full bg-muted'>
                <div
                  className='h-full bg-green-500'
                  style={{
                    width: `${(metrics.controlStatus.implemented / metrics.controlStatus.total) * 100}%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className='flex items-center justify-between mb-2'>
                <span className='text-sm font-medium'>Probados</span>
                <span className='text-sm font-bold'>{metrics.controlStatus.tested}</span>
              </div>
              <div className='h-2 w-full overflow-hidden rounded-full bg-muted'>
                <div
                  className='h-full bg-amber-500'
                  style={{
                    width: `${(metrics.controlStatus.tested / metrics.controlStatus.total) * 100}%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className='flex items-center justify-between mb-2'>
                <span className='text-sm font-medium'>En Cumplimiento</span>
                <span className='text-sm font-bold'>{metrics.controlStatus.compliant}</span>
              </div>
              <div className='h-2 w-full overflow-hidden rounded-full bg-muted'>
                <div
                  className='h-full bg-emerald-500'
                  style={{
                    width: `${(metrics.controlStatus.compliant / metrics.controlStatus.total) * 100}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Compliance Insights */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <TrendingUp className='h-5 w-5 text-blue-600' />
            Perspectivas de Cumplimiento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='space-y-3'>
            <div className='flex items-start gap-3'>
              <span className='text-green-500 mt-1'>✓</span>
              <div>
                <p className='text-sm font-medium'>Estado del Puntaje General</p>
                <p className='text-xs text-muted-foreground'>
                  {metrics.overallScore >= 90
                    ? 'Su organización mantiene un excelente cumplimiento en todos los marcos.'
                    : metrics.overallScore >= 75
                      ? 'Buen estado de cumplimiento. Enfóquese en resolver los hallazgos restantes.'
                      : 'Acción requerida. Múltiples marcos necesitan atención.'}
                </p>
              </div>
            </div>

            <div className='flex items-start gap-3'>
              <span className='text-blue-500 mt-1'>ℹ</span>
              <div>
                <p className='text-sm font-medium'>Próximas Auditorías</p>
                <p className='text-xs text-muted-foreground'>
                  {metrics.frameworks.some(f => new Date(f.nextAudit) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))
                    ? 'Tiene auditorías programadas dentro de los próximos 30 días.'
                    : 'No hay auditorías programadas en los próximos 30 días.'}
                </p>
              </div>
            </div>

            <div className='flex items-start gap-3'>
              <span className='text-amber-500 mt-1'>⚠</span>
              <div>
                <p className='text-sm font-medium'>Violaciones Activas</p>
                <p className='text-xs text-muted-foreground'>
                  {metrics.recentViolations.some(v => !v.resolvedDate)
                    ? `${metrics.recentViolations.filter(v => !v.resolvedDate).length} violación(es) sin resolver requieren atención inmediata.`
                    : 'Todas las violaciones han sido resueltas.'}
                </p>
              </div>
            </div>

            <div className='flex items-start gap-3'>
              <span className='text-purple-500 mt-1'>→</span>
              <div>
                <p className='text-sm font-medium'>Implementación de Controles</p>
                <p className='text-xs text-muted-foreground'>
                  {Math.round((metrics.controlStatus.compliant / metrics.controlStatus.total) * 100)}% de los controles están en total cumplimiento.
                  {metrics.controlStatus.compliant < metrics.controlStatus.total && ' Considere priorizar los controles restantes.'}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Exportar Reporte de Cumplimiento</CardTitle>
        </CardHeader>
        <CardContent className='flex gap-2'>
          <Button variant='outline'>Exportar PDF</Button>
          <Button variant='outline'>Exportar Excel</Button>
          <Button variant='outline'>Exportar Registro de Auditoría</Button>
        </CardContent>
      </Card>
    </div>
  )
}

// Metric Card Component
interface ComplianceScoreCardProps {
  framework: string
  score: number
  status: 'compliant' | 'non-compliant' | 'in-progress'
}

const ComplianceScoreCard: React.FC<ComplianceScoreCardProps> = ({
  framework,
  score,
  status,
}) => {
  const statusColor =
    status === 'compliant'
      ? 'text-green-600'
      : status === 'non-compliant'
        ? 'text-red-600'
        : 'text-amber-600'

  const statusIcon =
    status === 'compliant' ? '✓' : status === 'non-compliant' ? '✗' : '⟳'

  return (
    <Card>
      <CardContent className='pt-6'>
        <div className='flex items-start justify-between'>
          <div className='space-y-1'>
            <p className='text-sm text-muted-foreground'>{framework}</p>
            <p className='text-2xl font-bold'>{score}</p>
            <p className={`text-xs font-medium ${statusColor}`}>
              {statusIcon} {status === 'compliant' ? 'cumple' : status === 'non-compliant' ? 'no cumple' : 'en progreso'}
            </p>
          </div>
          <Shield className='h-5 w-5 text-muted-foreground' />
        </div>
      </CardContent>
    </Card>
  )
}

// Status Badge Component
interface StatusBadgeProps {
  status: 'compliant' | 'non-compliant' | 'in-progress'
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const styles = {
    compliant: 'bg-green-100 text-green-800',
    'non-compliant': 'bg-red-100 text-red-800',
    'in-progress': 'bg-amber-100 text-amber-800',
  }

  return (
    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${styles[status]}`}>
      {status === 'compliant' ? 'cumple' : status === 'non-compliant' ? 'no cumple' : 'en progreso'}
    </span>
  )
}

// Severity Badge Component
interface SeverityBadgeProps {
  severity: 'high' | 'medium' | 'low'
}

const SeverityBadge: React.FC<SeverityBadgeProps> = ({ severity }) => {
  const styles = {
    high: 'bg-red-100 text-red-800',
    medium: 'bg-amber-100 text-amber-800',
    low: 'bg-blue-100 text-blue-800',
  }

  return (
    <span className={`text-xs font-semibold px-2 py-1 rounded ${styles[severity]}`}>
      {severity === 'high' ? 'alta' : severity === 'medium' ? 'media' : 'baja'} severidad
    </span>
  )
}

// Loading Skeleton
const DashboardSkeleton = () => (
  <div className='space-y-6'>
    <Skeleton className='h-10 w-64' />
    <Skeleton className='h-32 w-full' />
    <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
      {[...Array(4)].map((_, i) => (
        <Card key={i}>
          <CardContent className='pt-6'>
            <Skeleton className='h-20 w-full' />
          </CardContent>
        </Card>
      ))}
    </div>
    <div className='grid gap-6 md:grid-cols-2'>
      {[...Array(2)].map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className='h-6 w-32' />
          </CardHeader>
          <CardContent>
            <Skeleton className='h-64 w-full' />
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
)
