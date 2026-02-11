// @ts-nocheck — temporary: types need update after Convex migration
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
  PieChart,
  Pie,
  Cell,
  ComposedChart,
  Scatter,
  ScatterChart,
} from 'recharts'
import { QueueMetricsSummary, AnalyticsFilter } from '@/types/analytics'
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  Zap,
  TrendingUp,
  Server,
} from 'lucide-react'

interface QueuePerformanceDashboardProps {
  organizationId: string
}

const COLORS = ['#10b981', '#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6']

export const QueuePerformanceDashboard: React.FC<QueuePerformanceDashboardProps> =
  ({ organizationId }) => {
    const [metrics, setMetrics] = useState<QueueMetricsSummary | null>(null)
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

          const response = await fetch('/api/analytics/queue', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              organizationId,
              dateRange: { startDate, endDate },
              groupBy: 'day',
            } as AnalyticsFilter),
          })

          if (!response.ok) throw new Error('Failed to fetch queue metrics')

          const data = await response.json()
          setMetrics(data.data)
        } catch (err) {
          console.error('Error fetching metrics:', err)
          setError('Failed to load queue analytics')
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
            <p className='text-sm text-destructive'>{error || 'No data available'}</p>
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
              Queue & Performance Analytics
            </h2>
            <p className='text-muted-foreground'>
              Job queue health and system performance monitoring
            </p>
          </div>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className='w-[180px]'>
              <SelectValue placeholder='Select period' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='7d'>Last 7 days</SelectItem>
              <SelectItem value='30d'>Last 30 days</SelectItem>
              <SelectItem value='90d'>Last 90 days</SelectItem>
              <SelectItem value='1y'>Last year</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Queue Status Indicators */}
        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
          <StatusCard
            title='Queue Depth'
            value={metrics.currentQueueDepth}
            icon={Activity}
            status={metrics.currentQueueDepth < 50 ? 'healthy' : 'warning'}
            subtitle='pending jobs'
          />
          <StatusCard
            title='Success Rate'
            value={`${metrics.overallSuccessRate}%`}
            icon={CheckCircle2}
            status={metrics.overallSuccessRate > 95 ? 'healthy' : 'warning'}
            subtitle='job completion'
          />
          <StatusCard
            title='Avg Latency'
            value={`${metrics.averageLatencyMs}ms`}
            icon={Zap}
            status={metrics.averageLatencyMs < 1000 ? 'healthy' : 'warning'}
            subtitle='processing time'
          />
          <StatusCard
            title='Throughput'
            value={`${metrics.jobsPerHour}/hr`}
            icon={TrendingUp}
            status='healthy'
            subtitle='jobs processed'
          />
        </div>

        {/* Latency & Success Metrics */}
        <div className='grid gap-6 md:grid-cols-2'>
          {/* Latency Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className='text-lg'>Latency Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                <div>
                  <div className='flex items-center justify-between'>
                    <span className='text-sm text-muted-foreground'>P50 (Median)</span>
                    <span className='font-bold'>{metrics.p50LatencyMs}ms</span>
                  </div>
                  <div className='mt-1 h-2 w-full overflow-hidden rounded-full bg-muted'>
                    <div
                      className='h-full bg-green-500'
                      style={{
                        width: `${Math.min((metrics.p50LatencyMs / metrics.p99LatencyMs) * 100, 100)}%`,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className='flex items-center justify-between'>
                    <span className='text-sm text-muted-foreground'>P95 (95th percentile)</span>
                    <span className='font-bold'>{metrics.p95LatencyMs}ms</span>
                  </div>
                  <div className='mt-1 h-2 w-full overflow-hidden rounded-full bg-muted'>
                    <div
                      className='h-full bg-amber-500'
                      style={{
                        width: `${Math.min((metrics.p95LatencyMs / metrics.p99LatencyMs) * 100, 100)}%`,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className='flex items-center justify-between'>
                    <span className='text-sm text-muted-foreground'>
                      P99 (99th percentile)
                    </span>
                    <span className='font-bold'>{metrics.p99LatencyMs}ms</span>
                  </div>
                  <div className='mt-1 h-2 w-full overflow-hidden rounded-full bg-muted'>
                    <div
                      className='h-full bg-red-500'
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>

                <div className='border-t pt-4'>
                  <p className='text-xs text-muted-foreground'>
                    Performance is healthy when P95 latency is under 2000ms. Consider
                    optimization if exceeding thresholds.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Job Type Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className='text-lg'>Jobs by Type</CardTitle>
            </CardHeader>
            <CardContent>
              {metrics.jobTypeDistribution.length > 0 ? (
                <ResponsiveContainer width='100%' height={300}>
                  <PieChart>
                    <Pie
                      data={metrics.jobTypeDistribution}
                      dataKey='count'
                      nameKey='jobType'
                      cx='50%'
                      cy='50%'
                      outerRadius={100}
                      label
                    >
                      {metrics.jobTypeDistribution.map((_entry: any, index: number) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className='flex h-64 items-center justify-center'>
                  <p className='text-sm text-muted-foreground'>No data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Latency Trend & Job Success Rate */}
        <div className='grid gap-6 md:grid-cols-2'>
          {/* Latency Trend */}
          <Card>
            <CardHeader>
              <CardTitle className='text-lg'>Latency Trend</CardTitle>
            </CardHeader>
            <CardContent>
              {metrics.latencyTrendLast7Days.length > 0 ? (
                <ResponsiveContainer width='100%' height={300}>
                  <ComposedChart data={metrics.latencyTrendLast7Days}>
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
                    <YAxis yAxisId='left' />
                    <YAxis yAxisId='right' orientation='right' />
                    <Tooltip />
                    <Legend />
                    <Line
                      yAxisId='left'
                      type='monotone'
                      dataKey='avgLatencyMs'
                      stroke='#3b82f6'
                      name='Avg Latency'
                    />
                    <Line
                      yAxisId='left'
                      type='monotone'
                      dataKey='p95LatencyMs'
                      stroke='#f59e0b'
                      name='P95 Latency'
                    />
                    <Bar
                      yAxisId='right'
                      dataKey='jobsThroughput'
                      fill='#10b981'
                      name='Jobs/Hour'
                      opacity={0.3}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              ) : (
                <p className='text-sm text-muted-foreground'>No data available</p>
              )}
            </CardContent>
          </Card>

          {/* Job Success by Type */}
          <Card>
            <CardHeader>
              <CardTitle className='text-lg'>Success Rate by Job Type</CardTitle>
            </CardHeader>
            <CardContent>
              {metrics.jobTypeDistribution.length > 0 ? (
                <ResponsiveContainer width='100%' height={300}>
                  <BarChart data={metrics.jobTypeDistribution}>
                    <CartesianGrid strokeDasharray='3 3' />
                    <XAxis dataKey='jobType' />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey='successRate' fill='#10b981' name='Success Rate %' />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className='flex h-64 items-center justify-center'>
                  <p className='text-sm text-muted-foreground'>No data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* System Health */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Server className='h-5 w-5 text-blue-500' />
              System Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='grid gap-6 md:grid-cols-3'>
              <div>
                <div className='flex items-center justify-between'>
                  <span className='text-sm text-muted-foreground'>CPU Usage</span>
                  <span className='font-bold'>{metrics.systemHealth.cpuUsage}%</span>
                </div>
                <div className='mt-2 h-3 w-full overflow-hidden rounded-full bg-muted'>
                  <div
                    className={`h-full ${
                      metrics.systemHealth.cpuUsage < 70
                        ? 'bg-green-500'
                        : metrics.systemHealth.cpuUsage < 85
                        ? 'bg-amber-500'
                        : 'bg-red-500'
                    }`}
                    style={{ width: `${metrics.systemHealth.cpuUsage}%` }}
                  />
                </div>
                <p className='mt-1 text-xs text-muted-foreground'>Normal</p>
              </div>

              <div>
                <div className='flex items-center justify-between'>
                  <span className='text-sm text-muted-foreground'>Memory Usage</span>
                  <span className='font-bold'>{metrics.systemHealth.memoryUsage}%</span>
                </div>
                <div className='mt-2 h-3 w-full overflow-hidden rounded-full bg-muted'>
                  <div
                    className={`h-full ${
                      metrics.systemHealth.memoryUsage < 70
                        ? 'bg-green-500'
                        : metrics.systemHealth.memoryUsage < 85
                        ? 'bg-amber-500'
                        : 'bg-red-500'
                    }`}
                    style={{ width: `${metrics.systemHealth.memoryUsage}%` }}
                  />
                </div>
                <p className='mt-1 text-xs text-muted-foreground'>Normal</p>
              </div>

              <div>
                <div className='flex items-center justify-between'>
                  <span className='text-sm text-muted-foreground'>
                    DB Connections
                  </span>
                  <span className='font-bold'>
                    {metrics.systemHealth.databaseConnections}/100
                  </span>
                </div>
                <div className='mt-2 h-3 w-full overflow-hidden rounded-full bg-muted'>
                  <div
                    className='h-full bg-green-500'
                    style={{
                      width: `${(metrics.systemHealth.databaseConnections / 100) * 100}%`,
                    }}
                  />
                </div>
                <p className='mt-1 text-xs text-muted-foreground'>Healthy</p>
              </div>
            </div>

            <div className='mt-6 border-t pt-4'>
              <p className='text-sm font-medium'>External Service Status</p>
              <div className='mt-3 space-y-2'>
                {metrics.externalServiceStatus.length > 0 ? (
                  metrics.externalServiceStatus.map((service) => (
                    <div key={service.serviceName} className='flex items-center justify-between'>
                      <span className='text-sm text-muted-foreground'>
                        {service.serviceName}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${
                          service.status === 'healthy'
                            ? 'bg-green-100 text-green-700'
                            : service.status === 'degraded'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        <span
                          className={`h-2 w-2 rounded-full ${
                            service.status === 'healthy'
                              ? 'bg-green-500'
                              : service.status === 'degraded'
                              ? 'bg-amber-500'
                              : 'bg-red-500'
                          }`}
                        />
                        {service.status.charAt(0).toUpperCase() + service.status.slice(1)}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className='text-xs text-muted-foreground'>
                    All external services are healthy
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Export Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Export Analytics</CardTitle>
          </CardHeader>
          <CardContent className='flex gap-2'>
            <Button variant='outline'>Export as PDF</Button>
            <Button variant='outline'>Export as Excel</Button>
            <Button variant='outline'>Export as CSV</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

// Status Card Component
interface StatusCardProps {
  title: string
  value: string | number
  icon: React.ComponentType<{ className?: string }>
  status: 'healthy' | 'warning' | 'critical'
  subtitle?: string
}

const StatusCard: React.FC<StatusCardProps> = ({
  title,
  value,
  icon: Icon,
  status,
  subtitle,
}) => {
  const statusColors = {
    healthy: 'bg-green-100 text-green-600 border-green-200',
    warning: 'bg-amber-100 text-amber-600 border-amber-200',
    critical: 'bg-red-100 text-red-600 border-red-200',
  }

  const iconClasses = {
    healthy: 'text-green-600',
    warning: 'text-amber-600',
    critical: 'text-red-600',
  }

  return (
    <Card className={`border-2 ${statusColors[status]}`}>
      <CardContent className='pt-6'>
        <div className='flex items-start justify-between'>
          <div className='space-y-1'>
            <p className='text-sm text-muted-foreground'>{title}</p>
            <p className='text-2xl font-bold'>{value}</p>
            {subtitle && (
              <p className='text-xs text-muted-foreground'>{subtitle}</p>
            )}
          </div>
          <Icon className={`h-5 w-5 ${iconClasses[status]}`} />
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
