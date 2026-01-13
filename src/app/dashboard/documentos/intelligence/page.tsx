'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { useSearchParams } from 'next/navigation'
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
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { Brain, TrendingUp, Zap, Loader2 } from 'lucide-react'
import {
  obtenerAnalisisPlantillasCliente,
  obtenerInsights30Dias,
  obtenerResumenEstadisticas,
  obtenerPlantillasRecomendadas,
  obtenerTiposDocumentosTendencia,
  type TemplateAnalytics,
  type DocumentInsight,
} from '../intelligence-actions'
import { TemplateAnalyticsCard } from '@/components/dashboard/TemplateAnalyticsCard'
import { SmartSuggestionsWidget } from '@/components/dashboard/SmartSuggestionsWidget'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

export default function DocumentIntelligencePage() {
  const searchParams = useSearchParams()
  const clienteId = searchParams.get('cliente_id')

  const [loading, setLoading] = useState(true)
  const [insights, setInsights] = useState<DocumentInsight[]>([])
  const [analytics, setAnalytics] = useState<TemplateAnalytics[]>([])
  const [recomendaciones, setRecomendaciones] = useState<any[]>([])
  const [estadisticas, setEstadisticas] = useState<any>(null)
  const [tendencias, setTendencias] = useState<any[]>([])

  useEffect(() => {
    if (clienteId) {
      cargarDatos()
    }
  }, [clienteId])

  const cargarDatos = async () => {
    if (!clienteId) return

    setLoading(true)
    try {
      const [insightsRes, analyticsRes, recomendacionesRes, estadisticasRes, tendenciasRes] =
        await Promise.all([
          obtenerInsights30Dias(clienteId),
          obtenerAnalisisPlantillasCliente(clienteId),
          obtenerPlantillasRecomendadas(clienteId),
          obtenerResumenEstadisticas(clienteId),
          obtenerTiposDocumentosTendencia(clienteId),
        ])

      if (insightsRes.success && insightsRes.insights) {
        setInsights(insightsRes.insights)
      }
      if (analyticsRes.success && analyticsRes.analytics) {
        setAnalytics(analyticsRes.analytics.slice(0, 5))
      }
      if (recomendacionesRes.success && recomendacionesRes.recomendaciones) {
        setRecomendaciones(recomendacionesRes.recomendaciones)
      }
      if (estadisticasRes.success && estadisticasRes.estadisticas) {
        setEstadisticas(estadisticasRes.estadisticas)
      }
      if (tendenciasRes.success && tendenciasRes.tendencias) {
        setTendencias(tendenciasRes.tendencias)
      }
    } catch (error) {
      toast.error('Error al cargar datos de inteligencia')
    } finally {
      setLoading(false)
    }
  }

  if (!clienteId) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Selecciona un cliente para ver análisis</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Brain className="h-8 w-8 text-blue-600" />
            Document Intelligence
          </h1>
          <p className="text-muted-foreground mt-1">
            Análisis inteligente de documentos y patrones de uso
          </p>
        </div>
        <Button onClick={cargarDatos} variant="outline">
          <Zap className="h-4 w-4 mr-2" />
          Actualizar
        </Button>
      </div>

      {/* Statistics Cards */}
      {estadisticas && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Documentos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{estadisticas.total_documentos}</div>
              <p className="text-xs text-muted-foreground">
                {estadisticas.documentos_mes} este mes
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Tasa Aprobación</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {estadisticas.tasa_aprobacion.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">De total procesado</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Monto Promedio</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${(estadisticas.monto_promedio || 0).toLocaleString('es-CL')}
              </div>
              <p className="text-xs text-muted-foreground">Por documento</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Crecimiento</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-bold ${
                  estadisticas.tasa_crecimiento >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {estadisticas.tasa_crecimiento.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">Vs. mes anterior</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Plantilla Top</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm font-bold truncate">
                {estadisticas.plantilla_mas_usada || 'N/A'}
              </div>
              <p className="text-xs text-muted-foreground">Más frecuente</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="templates">Plantillas</TabsTrigger>
          <TabsTrigger value="trends">Tendencias</TabsTrigger>
          <TabsTrigger value="suggestions">Sugerencias</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 30-Day Timeline */}
            <Card>
              <CardHeader>
                <CardTitle>Últimos 30 días</CardTitle>
                <CardDescription>Documentos cargados por día</CardDescription>
              </CardHeader>
              <CardContent>
                {insights.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={insights}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="fecha" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="documentos_cargados"
                        stroke="#3b82f6"
                        name="Cargados"
                      />
                      <Line
                        type="monotone"
                        dataKey="documentos_aprobados"
                        stroke="#10b981"
                        name="Aprobados"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    Sin datos
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle>Plantillas Recomendadas</CardTitle>
                <CardDescription>Mejores opciones para usar</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recomendaciones.length > 0 ? (
                    recomendaciones.map((rec, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 border rounded">
                        <div>
                          <p className="font-medium text-sm">{rec.nombre}</p>
                          <p className="text-xs text-muted-foreground">{rec.razon}</p>
                        </div>
                        <Badge
                          variant={rec.score >= 0.8 ? 'default' : 'secondary'}
                        >
                          {(rec.score * 100).toFixed(0)}
                        </Badge>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Sin recomendaciones disponibles
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates">
          <div className="grid grid-cols-1 gap-6">
            <TemplateAnalyticsCard clienteId={clienteId} />
          </div>
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tendencias de Tipos</CardTitle>
              <CardDescription>Tipos de documento más usados</CardDescription>
            </CardHeader>
            <CardContent>
              {tendencias.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={tendencias}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="tipo" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="#3b82f6" name="Cantidad" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  Sin datos
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Suggestions Tab */}
        <TabsContent value="suggestions">
          <SmartSuggestionsWidget clienteId={clienteId} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
