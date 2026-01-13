'use client'

import { useState, useTransition } from 'react'
import { Download, RefreshCw, Filter, Presentation, FileText, TrendingUp, BarChart3, Target, Lightbulb } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

// Executive Charts
import { WaterfallChart } from '@/components/dashboard/executive-charts/waterfall-chart'
import { BulletChart, BulletGroup } from '@/components/dashboard/executive-charts/bullet-chart'
import { GaugeChart } from '@/components/dashboard/executive-charts/gauge-chart'
import { Sparkline } from '@/components/dashboard/executive-charts/sparkline'
import { EXECUTIVE_COLORS } from '@/components/dashboard/executive-charts/chart-utils'

// Executive KPIs
import { KPISparklineCard, HeroKPI } from '@/components/dashboard/executive-kpis/kpi-sparkline'
import { KPIComparisonCard, ComparisonTable } from '@/components/dashboard/executive-kpis/kpi-comparison'
import { KPITargetCard, CircularTarget } from '@/components/dashboard/executive-kpis/kpi-target'
import { KPIGrid } from '@/components/dashboard/executive-kpis/kpi-grid'

// Actions
import { getExecutiveDashboardData } from './actions'

// Types
import type { ExecutiveDashboardData, ExecutiveKPI, Insight } from '@/types/reportes-ejecutivo.types'

// Recharts para gráfico de evolución
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'

interface EjecutivoContentProps {
  initialData: ExecutiveDashboardData
  clientes: { id: string; rut: string; razon_social: string }[]
}

export function EjecutivoContent({ initialData, clientes }: EjecutivoContentProps) {
  const [data, setData] = useState<ExecutiveDashboardData>(initialData)
  const [selectedCliente, setSelectedCliente] = useState<string>('all')
  const [selectedPeriodo, setSelectedPeriodo] = useState<string>(initialData.periodo)
  const [isPending, startTransition] = useTransition()

  // Generar lista de períodos (últimos 12 meses)
  const periodos = Array.from({ length: 12 }, (_, i) => {
    const date = new Date()
    date.setMonth(date.getMonth() - i)
    const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    const label = date.toLocaleDateString('es-CL', { month: 'long', year: 'numeric' })
    return { value, label }
  })

  // Actualizar datos cuando cambian los filtros
  const refreshData = () => {
    startTransition(async () => {
      const newData = await getExecutiveDashboardData(
        selectedCliente === 'all' ? undefined : selectedCliente,
        selectedPeriodo || undefined
      )
      setData(newData)
    })
  }

  // Formatear moneda
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      maximumFractionDigits: 0,
    }).format(value)
  }

  // Obtener ícono para insight
  const getInsightIcon = (type: Insight['type']) => {
    switch (type) {
      case 'positive':
        return <TrendingUp className="h-4 w-4" />
      case 'negative':
        return <BarChart3 className="h-4 w-4" />
      case 'alert':
        return <Target className="h-4 w-4" />
      default:
        return <Lightbulb className="h-4 w-4" />
    }
  }

  // Obtener color para insight
  const getInsightColor = (type: Insight['type']) => {
    switch (type) {
      case 'positive':
        return EXECUTIVE_COLORS.success
      case 'negative':
        return EXECUTIVE_COLORS.danger
      case 'alert':
        return EXECUTIVE_COLORS.warning
      default:
        return EXECUTIVE_COLORS.neutral
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-executive-navy">
            Dashboard Ejecutivo
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Vista ejecutiva con métricas clave y análisis profesional
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Filtro de Cliente */}
          <Select value={selectedCliente} onValueChange={setSelectedCliente}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Todos los clientes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los clientes</SelectItem>
              {clientes.map((cliente) => (
                <SelectItem key={cliente.id} value={cliente.id}>
                  {cliente.razon_social}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Filtro de Período */}
          <Select value={selectedPeriodo} onValueChange={setSelectedPeriodo}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              {periodos.map((periodo) => (
                <SelectItem key={periodo.value} value={periodo.value}>
                  {periodo.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Botón Actualizar */}
          <Button
            variant="outline"
            size="icon"
            onClick={refreshData}
            disabled={isPending}
          >
            <RefreshCw className={`h-4 w-4 ${isPending ? 'animate-spin' : ''}`} />
          </Button>

          {/* Botón Exportar */}
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Exportar
          </Button>

          {/* Botón Presentación */}
          <Button className="gap-2 bg-executive-navy hover:bg-executive-navy/90">
            <Presentation className="h-4 w-4" />
            Presentación
          </Button>
        </div>
      </div>

      {/* Tabs de contenido */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="overview" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Resumen
          </TabsTrigger>
          <TabsTrigger value="kpis" className="gap-2">
            <Target className="h-4 w-4" />
            KPIs
          </TabsTrigger>
          <TabsTrigger value="analysis" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Análisis
          </TabsTrigger>
          <TabsTrigger value="insights" className="gap-2">
            <Lightbulb className="h-4 w-4" />
            Insights
          </TabsTrigger>
        </TabsList>

        {/* Tab: Resumen */}
        <TabsContent value="overview" className="space-y-6">
          {/* KPIs Grid Principal */}
          <KPIGrid columns={3} gap="md">
            {data.kpis.slice(0, 6).map((kpi) => (
              <KPISparklineCard key={kpi.id} kpi={kpi} size="md" />
            ))}
          </KPIGrid>

          {/* Gráficos principales */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Waterfall Chart */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold uppercase tracking-widest text-muted-foreground/70">
                  Flujo de Caja
                </CardTitle>
              </CardHeader>
              <CardContent>
                <WaterfallChart
                  data={data.waterfall}
                  height={300}
                  currency
                />
              </CardContent>
            </Card>

            {/* Evolución Temporal */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold uppercase tracking-widest text-muted-foreground/70">
                  Evolución Mensual
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={data.evolution}
                      margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={EXECUTIVE_COLORS.success} stopOpacity={0.3} />
                          <stop offset="95%" stopColor={EXECUTIVE_COLORS.success} stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorCompras" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={EXECUTIVE_COLORS.danger} stopOpacity={0.3} />
                          <stop offset="95%" stopColor={EXECUTIVE_COLORS.danger} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={EXECUTIVE_COLORS.border} />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 11, fill: EXECUTIVE_COLORS.textSecondary }}
                        axisLine={{ stroke: EXECUTIVE_COLORS.border }}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: EXECUTIVE_COLORS.textSecondary }}
                        axisLine={{ stroke: EXECUTIVE_COLORS.border }}
                        tickFormatter={(value) => `$${(value / 1000000).toFixed(0)}M`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: EXECUTIVE_COLORS.bgCard,
                          border: `1px solid ${EXECUTIVE_COLORS.border}`,
                          borderRadius: 8,
                          fontSize: 12,
                        }}
                        formatter={(value: number | string | undefined) => [formatCurrency((value ?? 0) as number), '']}
                      />
                      <Legend
                        wrapperStyle={{ fontSize: 11 }}
                        iconType="circle"
                      />
                      <Area
                        type="monotone"
                        dataKey="value"
                        name="Ventas"
                        stroke={EXECUTIVE_COLORS.success}
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorVentas)"
                      />
                      <Area
                        type="monotone"
                        dataKey="previousValue"
                        name="Compras"
                        stroke={EXECUTIVE_COLORS.danger}
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorCompras)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Desglose por categoría y Insights */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Desglose por tipo */}
            <Card className="lg:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold uppercase tracking-widest text-muted-foreground/70">
                  Desglose por Tipo de Documento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.categoryBreakdown.slice(0, 6).map((cat, index) => (
                    <div key={cat.category} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{cat.category}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-muted-foreground">
                            {cat.count} docs
                          </span>
                          <span className="font-mono font-semibold">
                            {formatCurrency(cat.value)}
                          </span>
                        </div>
                      </div>
                      <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${cat.percentage}%`,
                            backgroundColor: [
                              EXECUTIVE_COLORS.primary,
                              EXECUTIVE_COLORS.secondary,
                              EXECUTIVE_COLORS.success,
                              EXECUTIVE_COLORS.accent,
                              EXECUTIVE_COLORS.warning,
                              EXECUTIVE_COLORS.neutral,
                            ][index % 6],
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Executive Summary */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold uppercase tracking-widest text-muted-foreground/70">
                  Executive Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.insights.slice(0, 4).map((insight) => (
                    <div
                      key={insight.id}
                      className="p-3 rounded-lg border"
                      style={{
                        borderColor: `${getInsightColor(insight.type)}30`,
                        backgroundColor: `${getInsightColor(insight.type)}08`,
                      }}
                    >
                      <div className="flex items-start gap-2">
                        <div
                          className="p-1.5 rounded-md"
                          style={{
                            backgroundColor: `${getInsightColor(insight.type)}20`,
                            color: getInsightColor(insight.type),
                          }}
                        >
                          {getInsightIcon(insight.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold">{insight.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                            {insight.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab: KPIs Detallados */}
        <TabsContent value="kpis" className="space-y-6">
          {/* Hero KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.kpis.slice(0, 3).map((kpi) => (
              <HeroKPI
                key={kpi.id}
                title={kpi.title}
                value={kpi.formattedValue}
                subtitle={kpi.description}
                change={kpi.changePercent}
                trend={kpi.trend}
                icon={<span className="text-2xl">{kpi.icon}</span>}
                color={kpi.status === 'positive' ? 'success' : kpi.status === 'negative' ? 'danger' : 'primary'}
                sparklineData={kpi.sparklineData}
              />
            ))}
          </div>

          {/* KPIs con Target */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {data.kpis
              .filter((kpi) => kpi.target)
              .map((kpi) => (
                <KPITargetCard
                  key={kpi.id}
                  title={kpi.title}
                  currentValue={kpi.value}
                  targetValue={kpi.target!}
                  unit={kpi.id.includes('tasa') || kpi.id.includes('exito') ? 'percent' : 'number'}
                />
              ))}
          </div>

          {/* Gauges */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold uppercase tracking-widest text-muted-foreground/70">
                Indicadores de Rendimiento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center justify-around gap-8 py-4">
                {data.kpis
                  .filter((kpi) => kpi.id.includes('tasa') || kpi.id.includes('exito'))
                  .slice(0, 3)
                  .map((kpi) => (
                    <GaugeChart
                      key={kpi.id}
                      value={kpi.value}
                      title={kpi.title}
                      subtitle={kpi.description}
                      size={160}
                    />
                  ))}
              </div>
            </CardContent>
          </Card>

          {/* Bullet Charts */}
          <BulletGroup
            title="Cumplimiento de Objetivos"
            items={data.kpis
              .filter((kpi) => kpi.target)
              .map((kpi) => ({
                label: kpi.title,
                actual: kpi.value,
                target: kpi.target!,
              }))}
            unit="number"
          />
        </TabsContent>

        {/* Tab: Análisis */}
        <TabsContent value="analysis" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Comparativas */}
            <KPIComparisonCard
              title="Documentos vs Mes Anterior"
              currentValue={data.kpis[0]?.value || 0}
              currentLabel="Este mes"
              previousValue={(data.kpis[0]?.value || 0) - (data.kpis[0]?.change || 0)}
              previousLabel="Mes anterior"
              unit="number"
            />

            <ComparisonTable
              title="Resumen Comparativo"
              items={data.kpis.slice(0, 4).map((kpi) => ({
                label: kpi.title,
                current: kpi.value,
                previous: kpi.value - (kpi.change || 0),
              }))}
              unit="number"
            />
          </div>

          {/* Circular Targets */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold uppercase tracking-widest text-muted-foreground/70">
                Metas del Período
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center justify-around gap-8 py-4">
                {data.kpis
                  .filter((kpi) => kpi.target)
                  .slice(0, 4)
                  .map((kpi) => (
                    <CircularTarget
                      key={kpi.id}
                      title={kpi.title}
                      value={kpi.value}
                      target={kpi.target}
                      size={100}
                    />
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Insights */}
        <TabsContent value="insights" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Lista de Insights */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold uppercase tracking-widest text-muted-foreground/70">
                  Insights del Período
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.insights.map((insight, index) => (
                    <div
                      key={insight.id}
                      className="p-4 rounded-lg border transition-all hover:shadow-md"
                      style={{
                        borderColor: `${getInsightColor(insight.type)}40`,
                        backgroundColor: `${getInsightColor(insight.type)}05`,
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className="flex items-center justify-center h-8 w-8 rounded-lg shrink-0"
                          style={{
                            backgroundColor: `${getInsightColor(insight.type)}20`,
                            color: getInsightColor(insight.type),
                          }}
                        >
                          {getInsightIcon(insight.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold">{insight.title}</p>
                            <span
                              className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                              style={{
                                backgroundColor: `${getInsightColor(insight.type)}20`,
                                color: getInsightColor(insight.type),
                              }}
                            >
                              P{insight.priority}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {insight.description}
                          </p>
                          {insight.metric && (
                            <div className="flex items-center gap-3 mt-2">
                              <span className="text-lg font-bold font-mono">
                                {insight.metric.value.toLocaleString('es-CL')}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {insight.metric.unit}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {data.insights.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Lightbulb className="h-12 w-12 mx-auto mb-3 opacity-30" />
                      <p>No hay insights disponibles para este período</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Recomendaciones */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold uppercase tracking-widest text-muted-foreground/70">
                  Recomendaciones
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.insights
                    .filter((i) => i.category === 'recommendation' || i.type === 'alert')
                    .map((insight, index) => (
                      <div
                        key={insight.id}
                        className="flex items-start gap-3 p-3 rounded-lg bg-muted/30"
                      >
                        <div className="flex items-center justify-center h-6 w-6 rounded-full bg-executive-navy text-white text-xs font-bold shrink-0">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{insight.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {insight.description}
                          </p>
                        </div>
                      </div>
                    ))}

                  {data.insights.filter((i) => i.category === 'recommendation' || i.type === 'alert').length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Target className="h-12 w-12 mx-auto mb-3 opacity-30" />
                      <p>No hay recomendaciones pendientes</p>
                      <p className="text-xs mt-1">Los indicadores están dentro de parámetros normales</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
