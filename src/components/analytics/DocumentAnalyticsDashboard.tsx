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
import { DateRange } from '@/components/ui/calendar'
import { Skeleton } from '@/components/ui/skeleton'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts'
import {
  DocumentMetricsSummary,
  AnalyticsFilter,
} from '@/types/analytics'
import { FileText, Archive, Trash2, TrendingUp } from 'lucide-react'

interface DocumentAnalyticsDashboardProps {
  organizationId: string;
  dateRange?: DateRange;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

export const DocumentAnalyticsDashboard: React.FC<
  DocumentAnalyticsDashboardProps
> = ({ organizationId, dateRange }) => {
  const [metrics, setMetrics] = useState<DocumentMetricsSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [period, setPeriod] = useState('30d')

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setLoading(true)
        setError(null)

        // Calculate date range
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
          default:
            startDate.setMonth(endDate.getMonth() - 1)
        }

        const response = await fetch('/api/analytics/documents', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            organizationId,
            dateRange: {
              startDate,
              endDate,
            },
            groupBy: 'day',
          } as AnalyticsFilter),
        })

        if (!response.ok) {
          throw new Error('Failed to fetch document metrics')
        }

        const data = await response.json()
        setMetrics(data.data)
      } catch (err) {
        console.error('Error fetching metrics:', err)
        setError('Failed to load document analytics')
      } finally {
        setLoading(false)
      }
    }

    fetchMetrics()
  }, [organizationId, period])

  if (loading) {
    return <DashboardSkeleton />
  }

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
            Document Analytics
          </h2>
          <p className='text-muted-foreground'>
            Real-time document metrics and insights
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

      {/* Key Metrics */}
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        <MetricCard
          title='Total Documents'
          value={metrics.totalDocuments}
          icon={FileText}
          color='primary'
        />
        <MetricCard
          title='Active Documents'
          value={metrics.activeDocuments}
          icon={TrendingUp}
          color='success'
        />
        <MetricCard
          title='Storage Used'
          value={`${metrics.storageUsedGB.toFixed(2)} GB`}
          icon={Archive}
          color='warning'
        />
        <MetricCard
          title='Avg Document Age'
          value={`${metrics.averageDocumentAge} days`}
          icon={Trash2}
          color='danger'
        />
      </div>

      {/* Charts */}
      <div className='grid gap-6 md:grid-cols-2'>
        {/* Upload Trend */}
        <Card>
          <CardHeader>
            <CardTitle className='text-lg'>Upload Trend</CardTitle>
          </CardHeader>
          <CardContent>
            {metrics.uploadTrendLast7Days.length > 0 ? (
              <ResponsiveContainer width='100%' height={300}>
                <AreaChart data={metrics.uploadTrendLast7Days}>
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
                  <Area
                    type='monotone'
                    dataKey='uploads'
                    stroke='#3b82f6'
                    fill='#3b82f6'
                    fillOpacity={0.2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <p className='text-sm text-muted-foreground'>No data available</p>
            )}
          </CardContent>
        </Card>

        {/* Documents by Status */}
        <Card>
          <CardHeader>
            <CardTitle className='text-lg'>Documents by Status</CardTitle>
          </CardHeader>
          <CardContent>
            {metrics.documentsByStatus.length > 0 ? (
              <ResponsiveContainer width='100%' height={300}>
                <PieChart>
                  <Pie
                    data={metrics.documentsByStatus}
                    dataKey='count'
                    nameKey='status'
                    cx='50%'
                    cy='50%'
                    outerRadius={100}
                    label
                  >
                    {metrics.documentsByStatus.map((_entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className='text-sm text-muted-foreground'>No data available</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Document Types and Age Distribution */}
      <div className='grid gap-6 md:grid-cols-2'>
        {/* Top Document Types */}
        <Card>
          <CardHeader>
            <CardTitle className='text-lg'>Top Document Types</CardTitle>
          </CardHeader>
          <CardContent>
            {metrics.documentsByType.length > 0 ? (
              <ResponsiveContainer width='100%' height={300}>
                <BarChart data={metrics.documentsByType}>
                  <CartesianGrid strokeDasharray='3 3' />
                  <XAxis dataKey='type' />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey='count' fill='#3b82f6' />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className='text-sm text-muted-foreground'>No data available</p>
            )}
          </CardContent>
        </Card>

        {/* Document Age Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className='text-lg'>Document Age Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {metrics.documentsByAge.length > 0 ? (
              <ResponsiveContainer width='100%' height={300}>
                <BarChart data={metrics.documentsByAge}>
                  <CartesianGrid strokeDasharray='3 3' />
                  <XAxis
                    dataKey='ageGroup'
                    angle={-45}
                    textAnchor='end'
                    height={80}
                  />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey='count' fill='#10b981' />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className='text-sm text-muted-foreground'>No data available</p>
            )}
          </CardContent>
        </Card>
      </div>

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

// Metric Card Component
interface MetricCardProps {
  title: string
  value: string | number
  icon: React.ComponentType<{ className?: string }>
  color: 'primary' | 'success' | 'warning' | 'danger'
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, icon: Icon, color }) => {
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
