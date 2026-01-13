'use client'

import {
  AreaChart,
  Area,
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
  Legend,
} from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type {
  DocumentosPorDia,
  DocumentosPorTipo,
  F29PorMes,
  BotsActividad,
} from '@/app/dashboard/actions'

// Executive color palette - Navy & Professional
const COLORS = {
  primary: '#0f3460',      // Navy Blue
  secondary: '#1a5091',    // Consulting Blue
  blue: '#1a5091',
  green: '#059669',        // Professional Green
  amber: '#d97706',        // Warm Amber
  red: '#dc2626',
  violet: '#6d28d9',
  cyan: '#0891b2',
  gold: '#b8860b',         // Executive Gold
}

const PIE_COLORS = ['#0f3460', '#1a5091', '#059669', '#d97706', '#6d28d9']

// Grafico de Documentos por Dia (Area)
export function DocumentosPorDiaChart({ data }: { data: DocumentosPorDia[] }) {
  return (
    <Card className="border-border/50 shadow-executive">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">Documentos - Ultimos 7 dias</CardTitle>
            <CardDescription className="text-xs mt-0.5">Recibidos vs clasificados</CardDescription>
          </div>
          <div className="flex items-center gap-3 text-[10px] uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[#1a5091]" />
              <span className="text-muted-foreground">Total</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[#059669]" />
              <span className="text-muted-foreground">Clasificados</span>
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.blue} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={COLORS.blue} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorClasificados" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.green} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={COLORS.green} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="dia"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                className="text-muted-foreground"
              />
              <YAxis
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                className="text-muted-foreground"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
              />
              <Area
                type="monotone"
                dataKey="total"
                name="Total"
                stroke={COLORS.blue}
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorTotal)"
              />
              <Area
                type="monotone"
                dataKey="clasificados"
                name="Clasificados"
                stroke={COLORS.green}
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorClasificados)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

// Grafico de Documentos por Tipo (Pie)
export function DocumentosPorTipoChart({ data }: { data: DocumentosPorTipo[] }) {
  // Calculate percentages for labels
  const total = data.reduce((sum, d) => sum + d.cantidad, 0)
  const dataWithPercent = data.map(d => ({
    ...d,
    porcentaje: total > 0 ? Math.round((d.cantidad / total) * 100) : 0
  }))

  return (
    <Card className="border-border/50 shadow-executive">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Distribucion por Tipo</CardTitle>
        <CardDescription className="text-xs mt-0.5">Tipos de documentos procesados</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={dataWithPercent}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
                dataKey="cantidad"
                nameKey="tipo"
                label={(props: any) => `${props.porcentaje || 0}%`}
                labelLine={false}
              >
                {dataWithPercent.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                formatter={(value: any, name: any) => [`${value} docs`, name]}
              />
              <Legend
                wrapperStyle={{ fontSize: '11px' }}
                iconType="circle"
                iconSize={8}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

// Grafico de F29 por Mes (Barras)
export function F29PorMesChart({ data }: { data: F29PorMes[] }) {
  return (
    <Card className="border-border/50 shadow-executive">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">F29 - Ultimos 6 meses</CardTitle>
            <CardDescription className="text-xs mt-0.5">Estado de declaraciones</CardDescription>
          </div>
          <div className="flex items-center gap-3 text-[10px] uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[#d97706]" />
              <span className="text-muted-foreground">Pendientes</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[#059669]" />
              <span className="text-muted-foreground">Enviados</span>
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="mes"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
              <Bar
                dataKey="borradores"
                name="Pendientes"
                fill={COLORS.amber}
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="enviados"
                name="Enviados"
                fill={COLORS.green}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

// Grafico de Actividad de Bots (Barras horizontales)
export function BotsActividadChart({ data }: { data: BotsActividad[] }) {
  if (data.length === 0) {
    return (
      <Card className="border-border/50 shadow-executive">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Actividad de Bots</CardTitle>
          <CardDescription className="text-xs mt-0.5">Ejecuciones ultimos 30 dias</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] flex flex-col items-center justify-center">
            <div className="h-12 w-12 rounded-xl bg-muted/50 flex items-center justify-center mb-3">
              <svg className="h-6 w-6 text-muted-foreground/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-sm text-muted-foreground">No hay datos de actividad</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border/50 shadow-executive">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">Actividad de Bots</CardTitle>
            <CardDescription className="text-xs mt-0.5">Ejecuciones ultimos 30 dias</CardDescription>
          </div>
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-[#059669]" />
              <span className="text-muted-foreground">OK</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-[#dc2626]" />
              <span className="text-muted-foreground">Error</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-[#d97706]" />
              <span className="text-muted-foreground">Pend</span>
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 5, right: 5, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis
                type="category"
                dataKey="bot"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                width={80}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
              <Bar dataKey="exitosos" name="Exitosos" fill={COLORS.green} stackId="a" />
              <Bar dataKey="fallidos" name="Fallidos" fill={COLORS.red} stackId="a" />
              <Bar dataKey="pendientes" name="Pendientes" fill={COLORS.amber} stackId="a" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

// KPI Card con indicador de tendencia - Executive Style
interface KPICardProps {
  title: string
  value: string | number
  description: string
  icon: React.ReactNode
  trend?: {
    value: number
    isPositive: boolean
  }
  color?: 'blue' | 'green' | 'amber' | 'violet' | 'red'
}

export function KPICard({ title, value, description, icon, trend, color = 'blue' }: KPICardProps) {
  const colorConfig = {
    blue: {
      bg: 'bg-primary/10',
      text: 'text-primary',
      ring: 'ring-primary/20',
      gradient: 'from-primary/5 to-transparent'
    },
    green: {
      bg: 'bg-success/10',
      text: 'text-success',
      ring: 'ring-success/20',
      gradient: 'from-success/5 to-transparent'
    },
    amber: {
      bg: 'bg-warning/10',
      text: 'text-warning',
      ring: 'ring-warning/20',
      gradient: 'from-warning/5 to-transparent'
    },
    violet: {
      bg: 'bg-violet-600/10',
      text: 'text-violet-600',
      ring: 'ring-violet-600/20',
      gradient: 'from-violet-600/5 to-transparent'
    },
    red: {
      bg: 'bg-destructive/10',
      text: 'text-destructive',
      ring: 'ring-destructive/20',
      gradient: 'from-destructive/5 to-transparent'
    },
  }

  const config = colorConfig[color]

  return (
    <Card className="group relative overflow-hidden hover:shadow-executive-md transition-all duration-300">
      {/* Subtle gradient overlay */}
      <div className={`absolute inset-0 bg-gradient-to-br ${config.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

      <CardContent className="relative pt-5 pb-5">
        <div className="flex items-start justify-between mb-4">
          <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${config.bg} ring-1 ${config.ring}`}>
            <div className={config.text}>{icon}</div>
          </div>
          {trend && (
            <span
              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${
                trend.isPositive
                  ? 'bg-success/10 text-success'
                  : 'bg-destructive/10 text-destructive'
              }`}
            >
              {trend.isPositive ? '+' : ''}{trend.value}%
            </span>
          )}
        </div>
        <div className="space-y-1">
          <p className="text-2xl font-bold tracking-tight font-mono">{value}</p>
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="text-[11px] text-muted-foreground leading-relaxed">{description}</p>
        </div>
      </CardContent>
    </Card>
  )
}
