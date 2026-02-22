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
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ScatterChart,
  Scatter,
} from 'recharts'
import {
  TeamMetricsSummary,
  AnalyticsFilter,
} from '@/types/analytics'
import {
  Users,
  TrendingUp,
  MessageSquare,
  Share2,
  Clock,
  Award,
} from 'lucide-react'

interface TeamAnalyticsDashboardProps {
  organizationId: string
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

export const TeamAnalyticsDashboard: React.FC<TeamAnalyticsDashboardProps> = ({
  organizationId,
}) => {
  const [metrics, setMetrics] = useState<TeamMetricsSummary | null>(null)
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

        const response = await fetch('/api/analytics/team', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            organizationId,
            dateRange: { startDate, endDate },
            groupBy: 'day',
          } as AnalyticsFilter),
        })

        if (!response.ok) throw new Error('Failed to fetch team metrics')

        const data = await response.json()
        setMetrics(data.data)
      } catch (err) {
        console.error('Error fetching metrics:', err)
        setError('Error al cargar analítica de equipo')
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
            Analítica de Equipo
          </h2>
          <p className='text-muted-foreground'>
            Actividad de usuarios, productividad y métricas de colaboración
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
          title='Usuarios Activos'
          value={metrics.activeUsers}
          icon={Users}
          color='primary'
          subtitle='usuarios con actividad'
        />
        <MetricCard
          title='Hora Pico de Actividad'
          value={`${metrics.peakActivityHour}:00`}
          icon={Clock}
          color='success'
          subtitle='más productivo'
        />
        <MetricCard
          title='Documentos Compartidos'
          value={metrics.collaborationMetrics.sharedDocumentsLast30Days}
          icon={Share2}
          color='warning'
          subtitle='este período'
        />
        <MetricCard
          title='Total Comentarios'
          value={metrics.collaborationMetrics.totalComments}
          icon={MessageSquare}
          color='info'
          subtitle='colaboración del equipo'
        />
      </div>

      {/* Activity Trend & Top Performers */}
      <div className='grid gap-6 md:grid-cols-2'>
        {/* Activity Trend */}
        <Card>
          <CardHeader>
            <CardTitle className='text-lg'>Tendencia de Actividad del Equipo</CardTitle>
          </CardHeader>
          <CardContent>
            {metrics.activityTrendLast7Days.length > 0 ? (
              <ResponsiveContainer width='100%' height={300}>
                <AreaChart data={metrics.activityTrendLast7Days}>
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
                    formatter={(value) => `${value} usuarios activos`}
                  />
                  <Area
                    type='monotone'
                    dataKey='value'
                    stroke='#3b82f6'
                    fill='#3b82f6'
                    fillOpacity={0.2}
                    name='Usuarios Activos'
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <p className='text-sm text-muted-foreground'>Sin datos disponibles</p>
            )}
          </CardContent>
        </Card>

        {/* Top Performers */}
        <Card>
          <CardHeader>
            <CardTitle className='text-lg'>Mejores Colaboradores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              {metrics.topPerformers.length > 0 ? (
                metrics.topPerformers.map((user, idx) => (
                  <div key={user.userId} className='flex items-center justify-between'>
                    <div className='flex-1'>
                      <div className='flex items-center gap-2'>
                        <div className='flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-xs font-bold text-white'>
                          {idx + 1}
                        </div>
                        <div className='min-w-0 flex-1'>
                          <p className='truncate text-sm font-medium'>
                            {user.userName}
                          </p>
                          <p className='text-xs text-muted-foreground'>
                            {user.department}
                          </p>
                        </div>
                      </div>
                      <div className='mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted'>
                        <div
                          className='h-full bg-gradient-to-r from-blue-500 to-purple-500'
                          style={{
                            width: `${(user.actionCount / (metrics.topPerformers[0]?.actionCount || 1)) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                    <span className='ml-4 whitespace-nowrap text-sm font-bold'>
                      {user.actionCount}
                    </span>
                  </div>
                ))
              ) : (
                <p className='text-sm text-muted-foreground'>Sin datos de usuarios disponibles</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Department Breakdown & Collaboration Metrics */}
      <div className='grid gap-6 md:grid-cols-2'>
        {/* Department Performance */}
        <Card>
          <CardHeader>
            <CardTitle className='text-lg'>Comparación por Departamento</CardTitle>
          </CardHeader>
          <CardContent>
            {metrics.departmentBreakdown.length > 0 ? (
              <ResponsiveContainer width='100%' height={300}>
                <BarChart data={metrics.departmentBreakdown}>
                  <CartesianGrid strokeDasharray='3 3' />
                  <XAxis dataKey='department' />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey='userCount' fill='#3b82f6' name='Usuarios' />
                  <Bar
                    dataKey='activityScore'
                    fill='#10b981'
                    name='Puntaje de Actividad'
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className='flex h-64 items-center justify-center'>
                <p className='text-sm text-muted-foreground'>
                  Datos de departamento aún no disponibles
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Collaboration Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className='text-lg'>Resumen de Colaboración</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              <div className='rounded-lg bg-gradient-to-br from-blue-500/10 to-cyan-500/10 p-4'>
                <div className='flex items-baseline gap-2'>
                  <span className='text-4xl font-bold text-blue-600'>
                    {metrics.collaborationMetrics.averageCollaborationScore}
                  </span>
                  <span className='text-lg text-muted-foreground'>/100</span>
                </div>
                <p className='mt-1 text-sm text-muted-foreground'>
                  Puntaje de colaboración del equipo
                </p>
              </div>

              <div className='space-y-3 border-t pt-4'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-2'>
                    <Share2 className='h-4 w-4 text-blue-500' />
                    <span className='text-sm text-muted-foreground'>
                      Documentos Compartidos
                    </span>
                  </div>
                  <span className='font-bold'>
                    {metrics.collaborationMetrics.sharedDocumentsLast30Days}
                  </span>
                </div>

                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-2'>
                    <MessageSquare className='h-4 w-4 text-green-500' />
                    <span className='text-sm text-muted-foreground'>
                      Total Comentarios
                    </span>
                  </div>
                  <span className='font-bold'>
                    {metrics.collaborationMetrics.totalComments}
                  </span>
                </div>

                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-2'>
                    <Clock className='h-4 w-4 text-amber-500' />
                    <span className='text-sm text-muted-foreground'>
                      Duración Promedio de Sesión
                    </span>
                  </div>
                  <span className='font-bold'>{metrics.averageSessionDuration} min</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Productivity Insights */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <TrendingUp className='h-5 w-5 text-green-500' />
            Perspectivas de Productividad
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='space-y-3'>
            <div className='flex items-start gap-3'>
              <span className='text-green-500'>✓</span>
              <div>
                <p className='text-sm font-medium'>Horas Pico de Productividad</p>
                <p className='text-xs text-muted-foreground'>
                  El equipo es más activo entre las {metrics.peakActivityHour}:00-
                  {metrics.peakActivityHour + 1}:00. Considere agendar reuniones
                  importantes en esta franja horaria.
                </p>
              </div>
            </div>

            <div className='flex items-start gap-3'>
              <span className='text-blue-500'>✓</span>
              <div>
                <p className='text-sm font-medium'>Duración de Sesión</p>
                <p className='text-xs text-muted-foreground'>
                  La duración promedio de sesión es de {metrics.averageSessionDuration} minutos,
                  lo que indica buen compromiso y tiempo de concentración.
                </p>
              </div>
            </div>

            <div className='flex items-start gap-3'>
              <span className='text-purple-500'>✓</span>
              <div>
                <p className='text-sm font-medium'>Puntaje de Colaboración</p>
                <p className='text-xs text-muted-foreground'>
                  Puntaje de colaboración del equipo de {metrics.collaborationMetrics.averageCollaborationScore}/100 con{' '}
                  {metrics.collaborationMetrics.sharedDocumentsLast30Days} documentos compartidos demuestra buen trabajo en equipo.
                </p>
              </div>
            </div>

            <div className='flex items-start gap-3'>
              <span className='text-amber-500'>✓</span>
              <div>
                <p className='text-sm font-medium'>Reconocimiento al Mejor Colaborador</p>
                <p className='text-xs text-muted-foreground'>
                  {metrics.topPerformers[0]?.userName || 'Usuario'} lidera el equipo con{' '}
                  {metrics.topPerformers[0]?.actionCount} acciones. Considere reconocer
                  a los mejores colaboradores.
                </p>
              </div>
            </div>
          </div>
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

// Metric Card Component
interface MetricCardProps {
  title: string
  value: string | number
  icon: React.ComponentType<{ className?: string }>
  color: 'primary' | 'success' | 'warning' | 'info'
  subtitle?: string
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  icon: Icon,
  color,
  subtitle,
}) => {
  const colorClasses = {
    primary: 'bg-blue-100 text-blue-600',
    success: 'bg-green-100 text-green-600',
    warning: 'bg-amber-100 text-amber-600',
    info: 'bg-cyan-100 text-cyan-600',
  }

  return (
    <Card>
      <CardContent className='pt-6'>
        <div className='flex items-start justify-between'>
          <div className='space-y-1'>
            <p className='text-sm text-muted-foreground'>{title}</p>
            <p className='text-2xl font-bold'>{value}</p>
            {subtitle && (
              <p className='text-xs text-muted-foreground'>{subtitle}</p>
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
