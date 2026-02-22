'use client'

import { useState } from 'react'
import { useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
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
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
  ComposedChart,
  Line,
} from 'recharts'
import {
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle2,
  AlertCircle,
  Zap,
} from 'lucide-react'

interface AutomationAnalyticsDashboardProps {
  organizationId: string
}

export const AutomationAnalyticsDashboard: React.FC<
  AutomationAnalyticsDashboardProps
> = ({ organizationId }) => {
  const [period, setPeriod] = useState('30d')
  const metrics = useQuery(api.analytics.getAutomationMetrics, { period })
  const loading = metrics === undefined

  if (loading) return <DashboardSkeleton />

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-3xl font-bold tracking-tight'>
            Analítica de Automatización
          </h2>
          <p className='text-muted-foreground'>
            Rendimiento de reglas y análisis de ROI de automatización
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

      {/* Key Metrics */}
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        <MetricCard
          title='Reglas Activas'
          value={metrics.activeRules}
          icon={Zap}
          color='primary'
          trend={{
            direction: metrics.activeRules > 5 ? 'up' : 'stable',
            value: '+2',
            period: 'vs mes anterior',
          }}
        />
        <MetricCard
          title='Tasa de Éxito'
          value={`${metrics.overallSuccessRate}%`}
          icon={CheckCircle2}
          color='success'
          trend={{
            direction: metrics.overallSuccessRate > 85 ? 'up' : 'down',
            value: '2.5%',
            period: 'mejora',
          }}
        />
        <MetricCard
          title='Tiempo Promedio Ejecución'
          value={`${metrics.averageExecutionTimeMs}ms`}
          icon={Clock}
          color='warning'
          trend={{
            direction: 'down',
            value: '15%',
            period: 'más rápido',
          }}
        />
        <MetricCard
          title='Horas Ahorradas/Mes'
          value={Math.round(metrics.hoursPerMonthSaved)}
          icon={TrendingUp}
          color='success'
          trend={{
            direction: 'up',
            value: '+8h',
            period: 'vs mes anterior',
          }}
        />
      </div>

      {/* Execution Trend & Success Rate */}
      <div className='grid gap-6 md:grid-cols-2'>
        {/* Execution Trend */}
        <Card>
          <CardHeader>
            <CardTitle className='text-lg'>Tendencia de Ejecución</CardTitle>
          </CardHeader>
          <CardContent>
            {metrics.executionTrendLast7Days.length > 0 ? (
              <ResponsiveContainer width='100%' height={300}>
                <ComposedChart data={metrics.executionTrendLast7Days}>
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
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(0, 0, 0, 0.8)',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#fff',
                    }}
                  />
                  <Legend />
                  <Bar dataKey='successCount' fill='#10b981' name='Exitosas' />
                  <Bar dataKey='failureCount' fill='#ef4444' name='Fallidas' />
                  <Line
                    type='monotone'
                    dataKey='executions'
                    stroke='#3b82f6'
                    name='Total Ejecuciones'
                    yAxisId='right'
                  />
                  <YAxis yAxisId='right' orientation='right' />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <p className='text-sm text-muted-foreground'>Sin datos disponibles</p>
            )}
          </CardContent>
        </Card>

        {/* Success Rate Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className='text-lg'>Distribución Tasa de Éxito</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width='100%' height={300}>
              <AreaChart
                data={[
                  { name: 'Tasa de Éxito', value: metrics.overallSuccessRate },
                  { name: 'Tasa de Fallo', value: 100 - metrics.overallSuccessRate },
                ]}
                layout='vertical'
              >
                <CartesianGrid strokeDasharray='3 3' />
                <XAxis type='number' />
                <YAxis dataKey='name' type='category' width={100} />
                <Tooltip />
                <Area
                  type='monotone'
                  dataKey='value'
                  stroke='#10b981'
                  fill='#10b981'
                  fillOpacity={0.6}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Performing vs Worst Performing Rules */}
      <div className='grid gap-6 md:grid-cols-2'>
        {/* Top Performing Rules */}
        <Card>
          <CardHeader>
            <CardTitle className='text-lg'>Reglas con Mejor Rendimiento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              {metrics.topPerformingRules.length > 0 ? (
                metrics.topPerformingRules.map((rule: any, idx: number) => (
                  <div key={rule.ruleId} className='flex items-center justify-between'>
                    <div className='flex-1'>
                      <div className='flex items-center gap-2'>
                        <span className='text-sm font-medium'>#{idx + 1}</span>
                        <div className='min-w-0 flex-1'>
                          <p className='truncate text-sm font-medium'>
                            {rule.ruleName}
                          </p>
                          <p className='text-xs text-muted-foreground'>
                            {rule.executionCount} ejecuciones
                          </p>
                        </div>
                      </div>
                      <div className='mt-1 h-2 w-full overflow-hidden rounded-full bg-muted'>
                        <div
                          className='h-full bg-green-500'
                          style={{ width: `${rule.successRate}%` }}
                        />
                      </div>
                    </div>
                    <span className='ml-4 whitespace-nowrap text-sm font-bold text-green-600'>
                      {rule.successRate}%
                    </span>
                  </div>
                ))
              ) : (
                <p className='text-sm text-muted-foreground'>Sin datos disponibles</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Worst Performing Rules */}
        <Card>
          <CardHeader>
            <CardTitle className='text-lg'>Reglas que Requieren Atención</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              {metrics.worstPerformingRules.length > 0 ? (
                metrics.worstPerformingRules.map((rule: any, idx: number) => (
                  <div key={rule.ruleId} className='flex items-center justify-between'>
                    <div className='flex-1'>
                      <div className='flex items-center gap-2'>
                        <span className='text-sm font-medium'>#{idx + 1}</span>
                        <div className='min-w-0 flex-1'>
                          <p className='truncate text-sm font-medium'>
                            {rule.ruleName}
                          </p>
                          <p className='text-xs text-muted-foreground'>
                            Último error: {rule.lastError}
                          </p>
                        </div>
                      </div>
                      <div className='mt-1 h-2 w-full overflow-hidden rounded-full bg-muted'>
                        <div
                          className='h-full bg-red-500'
                          style={{ width: `${rule.failureRate}%` }}
                        />
                      </div>
                    </div>
                    <span className='ml-4 whitespace-nowrap text-sm font-bold text-red-600'>
                      {rule.failureRate}%
                    </span>
                  </div>
                ))
              ) : (
                <p className='text-sm text-muted-foreground'>Todas las reglas funcionan correctamente</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ROI Metrics */}
      <div className='grid gap-6 md:grid-cols-2'>
        <Card>
          <CardHeader>
            <CardTitle className='text-lg'>Ejecución por Tipo de Tarea</CardTitle>
          </CardHeader>
          <CardContent>
            {metrics.topPerformingRules.length > 0 ? (
              <ResponsiveContainer width='100%' height={300}>
                <BarChart
                  data={metrics.topPerformingRules.map((r: any) => ({
                    type: r.ruleName,
                    count: r.executionCount,
                    success: Math.round(r.executionCount * r.successRate / 100),
                  }))}
                >
                  <CartesianGrid strokeDasharray='3 3' />
                  <XAxis dataKey='type' />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey='success' fill='#10b981' name='Exitosas' />
                  <Bar dataKey='count' fill='#cbd5e1' name='Total' />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className='text-sm text-muted-foreground'>Sin datos disponibles</p>
            )}
          </CardContent>
        </Card>

        {/* ROI & Time Saved */}
        <Card>
          <CardHeader>
            <CardTitle className='text-lg'>ROI de Automatización</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              <div className='rounded-lg bg-gradient-to-r from-green-500/10 to-emerald-500/10 p-4'>
                <div className='flex items-baseline gap-2'>
                  <span className='text-4xl font-bold text-green-600'>
                    {Math.round(metrics.hoursPerMonthSaved)}
                  </span>
                  <span className='text-lg text-muted-foreground'>
                    horas ahorradas/mes
                  </span>
                </div>
                <p className='mt-2 text-sm text-muted-foreground'>
                  Equivalente al {Math.round((metrics.hoursPerMonthSaved / 160) * 100)}% de un FTE
                </p>
              </div>

              <div className='space-y-2'>
                <div className='flex justify-between text-sm'>
                  <span className='text-muted-foreground'>Anualmente:</span>
                  <span className='font-bold'>
                    {Math.round(metrics.hoursPerMonthSaved * 12)} horas
                  </span>
                </div>
                <div className='flex justify-between text-sm'>
                  <span className='text-muted-foreground'>Ahorro en Costos:</span>
                  <span className='font-bold text-green-600'>
                    ${Math.round(metrics.hoursPerMonthSaved * 12 * 50)}
                  </span>
                </div>
                <div className='flex justify-between text-sm'>
                  <span className='text-muted-foreground'>Reglas Activas:</span>
                  <span className='font-bold'>{metrics.activeRules}</span>
                </div>
              </div>

              <div className='mt-4 border-t pt-4'>
                <p className='text-xs text-muted-foreground'>
                  Basado en {metrics.overallSuccessRate}% de tasa de éxito y tiempo
                  promedio de ejecución de {metrics.averageExecutionTimeMs}ms por tarea.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Error Trend Analysis */}
      {metrics.errorTrendAnalysis.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className='text-lg'>Análisis de Errores</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width='100%' height={300}>
              <BarChart data={metrics.errorTrendAnalysis}>
                <CartesianGrid strokeDasharray='3 3' />
                <XAxis dataKey='errorType' />
                <YAxis />
                <Tooltip />
                <Bar dataKey='percentage' fill='#ef4444' />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <AlertCircle className='h-5 w-5 text-amber-500' />
            Recomendaciones
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className='space-y-2 text-sm'>
            <li className='flex gap-2'>
              <span className='text-amber-500'>▸</span>
              <span>
                Revisar y optimizar reglas con tasa de éxito inferior al 80% para mejorar
                el rendimiento
              </span>
            </li>
            <li className='flex gap-2'>
              <span className='text-amber-500'>▸</span>
              <span>
                Considerar aumentar la cobertura de reglas de automatización - actualmente ahorrando{' '}
                {Math.round(metrics.hoursPerMonthSaved)} horas/mes
              </span>
            </li>
            <li className='flex gap-2'>
              <span className='text-amber-500'>▸</span>
              <span>
                Las integraciones webhook tienen la mayor latencia - optimizar para mejorar
                el rendimiento
              </span>
            </li>
            <li className='flex gap-2'>
              <span className='text-amber-500'>▸</span>
              <span>
                Las reglas de automatización por email son las más confiables - continuar usando
                patrones similares
              </span>
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Export Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Exportar Analítica</CardTitle>
        </CardHeader>
        <CardContent className='flex gap-2'>
          <Button variant='outline'>Exportar PDF</Button>
          <Button variant='outline'>Exportar Excel</Button>
          <Button variant='outline'>Exportar CSV</Button>
        </CardContent>
      </Card>
    </div>
  )
}

// Metric Card Component with Trend
interface MetricCardProps {
  title: string
  value: string | number
  icon: React.ComponentType<{ className?: string }>
  color: 'primary' | 'success' | 'warning' | 'danger'
  trend?: {
    direction: 'up' | 'down' | 'stable'
    value: string
    period: string
  }
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  icon: Icon,
  color,
  trend,
}) => {
  const colorClasses = {
    primary: 'bg-blue-100 text-blue-600',
    success: 'bg-green-100 text-green-600',
    warning: 'bg-amber-100 text-amber-600',
    danger: 'bg-red-100 text-red-600',
  }

  return (
    <Card>
      <CardContent className='pt-6'>
        <div className='flex items-start justify-between'>
          <div className='space-y-1'>
            <p className='text-sm text-muted-foreground'>{title}</p>
            <p className='text-2xl font-bold'>{value}</p>
            {trend && (
              <div className='flex items-center gap-1'>
                {trend.direction === 'up' && (
                  <TrendingUp className='h-3 w-3 text-green-600' />
                )}
                {trend.direction === 'down' && (
                  <TrendingDown className='h-3 w-3 text-red-600' />
                )}
                <span className='text-xs text-muted-foreground'>
                  {trend.value} {trend.period}
                </span>
              </div>
            )}
          </div>
          <div className={`rounded-lg p-2 ${colorClasses[color]}`}>
            <Icon className='h-5 w-5' />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Loading Skeleton
const DashboardSkeleton = () => (
  <div className='space-y-6'>
    <Skeleton className='h-10 w-64' />
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
