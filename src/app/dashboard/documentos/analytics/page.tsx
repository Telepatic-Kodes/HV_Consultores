// @ts-nocheck
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
} from 'recharts'
import { obtenerDocumentosCargados } from '../actions'
import { Loader2, TrendingUp, Calendar, DollarSign, CheckCircle2 } from 'lucide-react'
import { format, subDays, startOfDay } from 'date-fns'
import { es } from 'date-fns/locale'
import type { Database } from '@/types/database.types'

type DocumentoCarga = Database['public']['Tables']['documento_cargas']['Row']

export default function DocumentAnalyticsPage() {
  const [documentos, setDocumentos] = useState<DocumentoCarga[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const cargarDocumentos = async () => {
      setLoading(true)
      try {
        const docs = await obtenerDocumentosCargados()
        setDocumentos(docs)
      } finally {
        setLoading(false)
      }
    }

    cargarDocumentos()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // Calculate statistics
  const total = documentos.length
  const montoTotal = documentos.reduce((sum, doc) => sum + (doc.monto_total || 0), 0)
  const tasaExito =
    total > 0
      ? Math.round(
          ((documentos.filter((d) => d.estado === 'validado' || d.estado === 'enviado_nubox').length) /
            total) *
            100
        )
      : 0

  // Status distribution
  const estadoData = [
    {
      name: 'Pendiente',
      value: documentos.filter((d) => d.estado === 'pendiente').length,
      fill: '#FBBF24',
    },
    {
      name: 'Validado',
      value: documentos.filter((d) => d.estado === 'validado').length,
      fill: '#34D399',
    },
    {
      name: 'Enviado',
      value: documentos.filter((d) => d.estado === 'enviado_nubox').length,
      fill: '#A78BFA',
    },
    {
      name: 'Rechazado',
      value: documentos.filter((d) => d.estado === 'rechazado').length,
      fill: '#F87171',
    },
  ].filter((item) => item.value > 0)

  // Document type distribution
  const tipoData = Object.entries(
    documentos.reduce(
      (acc, doc) => {
        acc[doc.tipo_documento] = (acc[doc.tipo_documento] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    )
  ).map(([tipo, count]) => ({
    name: tipo,
    value: count,
  }))

  // Daily uploads (last 30 days)
  const dailyData: Record<string, number> = {}
  for (let i = 29; i >= 0; i--) {
    const date = format(subDays(new Date(), i), 'yyyy-MM-dd')
    dailyData[date] = 0
  }

  documentos.forEach((doc) => {
    if (doc.cargado_en) {
      const date = format(new Date(doc.cargado_en), 'yyyy-MM-dd')
      if (date in dailyData) {
        dailyData[date]++
      }
    }
  })

  const dailyChartData = Object.entries(dailyData).map(([date, count]) => ({
    date: format(new Date(date), 'dd MMM', { locale: es }),
    uploads: count,
  }))

  // Amount by type
  const montoByTipo = Object.entries(
    documentos.reduce(
      (acc, doc) => {
        if (!acc[doc.tipo_documento]) {
          acc[doc.tipo_documento] = 0
        }
        acc[doc.tipo_documento] += doc.monto_total || 0
        return acc
      },
      {} as Record<string, number>
    )
  ).map(([tipo, monto]) => ({
    name: tipo,
    monto: Math.round(monto),
  }))

  const colores = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Analítica de Documentos</h1>
        <p className="text-muted-foreground mt-1">
          Estadísticas y tendencias de documentos cargados
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Documentos</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{total}</div>
            <p className="text-xs text-muted-foreground">todos los tiempos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monto Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(montoTotal / 1000000).toFixed(1)}M
            </div>
            <p className="text-xs text-muted-foreground">valor procesado</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasa de Éxito</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{tasaExito}%</div>
            <p className="text-xs text-muted-foreground">documentos procesados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Promedio por Documento</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${total > 0 ? (montoTotal / total).toLocaleString('es-CL') : '0'}
            </div>
            <p className="text-xs text-muted-foreground">monto promedio</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="timeline" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="estado">Estado</TabsTrigger>
          <TabsTrigger value="tipo">Tipo</TabsTrigger>
          <TabsTrigger value="monto">Monto</TabsTrigger>
        </TabsList>

        {/* Daily Uploads Timeline */}
        <TabsContent value="timeline" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Cargas por Día (Últimos 30 días)</CardTitle>
              <CardDescription>Número de documentos cargados cada día</CardDescription>
            </CardHeader>
            <CardContent>
              {dailyChartData.some((d) => d.uploads > 0) ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={dailyChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="date" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1f2937',
                        border: '1px solid #374151',
                        borderRadius: '0.5rem',
                      }}
                      labelStyle={{ color: '#f3f4f6' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="uploads"
                      stroke="#3B82F6"
                      strokeWidth={2}
                      dot={{ fill: '#3B82F6', r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-64 text-muted-foreground">
                  No hay datos para mostrar
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Status Distribution */}
        <TabsContent value="estado" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Distribución por Estado</CardTitle>
              <CardDescription>Proporción de documentos por estado actual</CardDescription>
            </CardHeader>
            <CardContent>
              {estadoData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={estadoData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) =>
                        `${name}: ${value} (${Math.round((value / total) * 100)}%)`
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {estadoData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1f2937',
                        border: '1px solid #374151',
                        borderRadius: '0.5rem',
                      }}
                      labelStyle={{ color: '#f3f4f6' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-64 text-muted-foreground">
                  No hay datos para mostrar
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Document Type */}
        <TabsContent value="tipo" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Documentos por Tipo</CardTitle>
              <CardDescription>Cantidad de documentos por tipo</CardDescription>
            </CardHeader>
            <CardContent>
              {tipoData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={tipoData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="name" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1f2937',
                        border: '1px solid #374151',
                        borderRadius: '0.5rem',
                      }}
                      labelStyle={{ color: '#f3f4f6' }}
                    />
                    <Bar
                      dataKey="value"
                      fill="#3B82F6"
                      radius={[8, 8, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-64 text-muted-foreground">
                  No hay datos para mostrar
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Amount by Type */}
        <TabsContent value="monto" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Monto por Tipo de Documento</CardTitle>
              <CardDescription>Valor total procesado por tipo</CardDescription>
            </CardHeader>
            <CardContent>
              {montoByTipo.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={montoByTipo}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="name" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1f2937',
                        border: '1px solid #374151',
                        borderRadius: '0.5rem',
                      }}
                      labelStyle={{ color: '#f3f4f6' }}
                      formatter={(value: number) => `$${value.toLocaleString('es-CL')}`}
                    />
                    <Bar dataKey="monto" fill="#10B981" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-64 text-muted-foreground">
                  No hay datos para mostrar
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
