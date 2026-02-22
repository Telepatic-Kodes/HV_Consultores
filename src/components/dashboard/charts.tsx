'use client'

import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { BentoCard } from './BentoCard'
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

// Grafico de Documentos por Dia (Area)
export function DocumentosPorDiaChart({ data }: { data: DocumentosPorDia[] }) {
  return (
    <BentoCard noPadding>
      <div className="px-5 pt-5 pb-2">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Documentos - Últimos 7 días</p>
            <p className="text-[10px] text-muted-foreground/70 mt-0.5">Recibidos vs clasificados</p>
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
      </div>
      <div className="px-3 pb-4">
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
      </div>
    </BentoCard>
  )
}

// Grafico de Documentos por Tipo (Horizontal Bar)
export function DocumentosPorTipoChart({ data }: { data: DocumentosPorTipo[] }) {
  return (
    <BentoCard noPadding>
      <div className="px-5 pt-5 pb-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Distribución por Tipo
        </p>
        <p className="text-[10px] text-muted-foreground/70 mt-0.5">Tipos de documentos procesados</p>
      </div>
      <div className="px-3 pb-4">
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ top: 5, right: 15, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis
                type="category"
                dataKey="tipo"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                width={90}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                formatter={(value: any) => [`${value} docs`]}
              />
              <Bar dataKey="cantidad" fill={COLORS.primary} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </BentoCard>
  )
}

// Grafico de F29 por Mes (Barras)
export function F29PorMesChart({ data }: { data: F29PorMes[] }) {
  return (
    <BentoCard noPadding>
      <div className="px-5 pt-5 pb-2">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">F29 - Últimos 6 meses</p>
            <p className="text-[10px] text-muted-foreground/70 mt-0.5">Estado de declaraciones</p>
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
      </div>
      <div className="px-3 pb-4">
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
      </div>
    </BentoCard>
  )
}

// Grafico de Actividad de Bots (Barras horizontales)
export function BotsActividadChart({ data }: { data: BotsActividad[] }) {
  if (data.length === 0) {
    return (
      <BentoCard noPadding>
        <div className="px-5 pt-5 pb-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Actividad de Bots</p>
          <p className="text-[10px] text-muted-foreground/70 mt-0.5">Ejecuciones ultimos 30 dias</p>
        </div>
        <div className="px-3 pb-4">
          <div className="h-[200px] flex flex-col items-center justify-center">
            <div className="h-12 w-12 rounded-xl bg-muted/50 flex items-center justify-center mb-3">
              <svg className="h-6 w-6 text-muted-foreground/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-sm text-muted-foreground">No hay datos de actividad</p>
          </div>
        </div>
      </BentoCard>
    )
  }

  return (
    <BentoCard noPadding>
      <div className="px-5 pt-5 pb-2">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Actividad de Bots</p>
            <p className="text-[10px] text-muted-foreground/70 mt-0.5">Ejecuciones ultimos 30 dias</p>
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
      </div>
      <div className="px-3 pb-4">
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
      </div>
    </BentoCard>
  )
}
