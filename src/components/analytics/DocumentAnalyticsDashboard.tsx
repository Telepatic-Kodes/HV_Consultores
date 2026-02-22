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
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts'
import { FileText, Archive, Trash2, TrendingUp } from 'lucide-react'

interface DocumentAnalyticsDashboardProps {
  organizationId: string;
  dateRange?: any;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

export const DocumentAnalyticsDashboard: React.FC<
  DocumentAnalyticsDashboardProps
> = ({ organizationId }) => {
  const [period, setPeriod] = useState('30d')
  const metrics = useQuery(api.analytics.getDocumentMetrics, { period })
  const loading = metrics === undefined

  if (loading) {
    return <DashboardSkeleton />
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-3xl font-bold tracking-tight'>
            Analítica de Documentos
          </h2>
          <p className='text-muted-foreground'>
            Métricas en tiempo real de documentos
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
          title='Total Documentos'
          value={metrics.totalDocuments}
          icon={FileText}
          color='primary'
        />
        <MetricCard
          title='Documentos Activos'
          value={metrics.activeDocuments}
          icon={TrendingUp}
          color='success'
        />
        <MetricCard
          title='Almacenamiento Usado'
          value={`${metrics.storageUsedGB.toFixed(2)} GB`}
          icon={Archive}
          color='warning'
        />
        <MetricCard
          title='Edad Promedio'
          value={`${metrics.averageDocumentAge} días`}
          icon={Trash2}
          color='danger'
        />
      </div>

      {/* Charts */}
      <div className='grid gap-6 md:grid-cols-2'>
        {/* Upload Trend */}
        <Card>
          <CardHeader>
            <CardTitle className='text-lg'>Tendencia de Carga</CardTitle>
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
              <p className='text-sm text-muted-foreground'>Sin datos disponibles</p>
            )}
          </CardContent>
        </Card>

        {/* Documents by Status */}
        <Card>
          <CardHeader>
            <CardTitle className='text-lg'>Documentos por Estado</CardTitle>
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
              <p className='text-sm text-muted-foreground'>Sin datos disponibles</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Document Types and Age Distribution */}
      <div className='grid gap-6 md:grid-cols-2'>
        {/* Top Document Types */}
        <Card>
          <CardHeader>
            <CardTitle className='text-lg'>Tipos Principales</CardTitle>
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
              <p className='text-sm text-muted-foreground'>Sin datos disponibles</p>
            )}
          </CardContent>
        </Card>

        {/* Document Age Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className='text-lg'>Distribución por Antigüedad</CardTitle>
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
              <p className='text-sm text-muted-foreground'>Sin datos disponibles</p>
            )}
          </CardContent>
        </Card>
      </div>

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
