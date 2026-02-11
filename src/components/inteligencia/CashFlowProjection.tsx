// @ts-nocheck
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'

interface MonthData {
  mes: string
  ingresos: number
  egresos: number
  neto: number
  proyectado?: boolean
}

interface CashFlowProjectionProps {
  data: MonthData[]
  clienteName?: string
}

function formatCLP(amount: number): string {
  if (Math.abs(amount) >= 1_000_000) {
    return `$${(amount / 1_000_000).toFixed(1)}M`
  }
  return `$${amount.toLocaleString('es-CL')}`
}

export function CashFlowProjection({
  data,
  clienteName,
}: CashFlowProjectionProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <p className="text-sm text-muted-foreground">
            Sin datos de flujo de caja
          </p>
        </CardContent>
      </Card>
    )
  }

  const historico = data.filter((d) => !d.proyectado)
  const proyectado = data.filter((d) => d.proyectado)
  const lastHistorico = historico[historico.length - 1]
  const lastProyectado = proyectado[proyectado.length - 1]

  const trend =
    lastProyectado && lastHistorico
      ? lastProyectado.neto > lastHistorico.neto
        ? 'positiva'
        : 'negativa'
      : 'neutral'

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-sm font-medium">
            Proyección Flujo de Caja
          </CardTitle>
          {clienteName && (
            <p className="text-xs text-muted-foreground">{clienteName}</p>
          )}
        </div>
        <Badge
          className={
            trend === 'positiva'
              ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
              : trend === 'negativa'
              ? 'bg-red-100 text-red-700 border-red-200'
              : 'bg-gray-100 text-gray-700 border-gray-200'
          }
        >
          Tendencia {trend}
        </Badge>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
            <YAxis
              tick={{ fontSize: 11 }}
              tickFormatter={(val) => formatCLP(val)}
            />
            <Tooltip
              formatter={(val: number, name: string) => [
                formatCLP(val),
                name === 'ingresos'
                  ? 'Ingresos'
                  : name === 'egresos'
                  ? 'Egresos'
                  : 'Neto',
              ]}
            />
            <Legend
              formatter={(value) =>
                value === 'ingresos'
                  ? 'Ingresos'
                  : value === 'egresos'
                  ? 'Egresos'
                  : 'Neto'
              }
            />
            <Area
              type="monotone"
              dataKey="ingresos"
              stroke="#10b981"
              fill="#10b981"
              fillOpacity={0.1}
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="egresos"
              stroke="#ef4444"
              fill="#ef4444"
              fillOpacity={0.1}
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="neto"
              stroke="#3b82f6"
              fill="#3b82f6"
              fillOpacity={0.15}
              strokeWidth={2}
              strokeDasharray="5 5"
            />
          </AreaChart>
        </ResponsiveContainer>

        {/* Summary */}
        {lastProyectado && (
          <div className="grid grid-cols-3 gap-3 pt-3 border-t mt-3">
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Proj. Ingresos</p>
              <p className="text-sm font-semibold text-emerald-600">
                {formatCLP(lastProyectado.ingresos)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Proj. Egresos</p>
              <p className="text-sm font-semibold text-red-600">
                {formatCLP(lastProyectado.egresos)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Proj. Neto</p>
              <p
                className={`text-sm font-semibold ${
                  lastProyectado.neto >= 0
                    ? 'text-emerald-600'
                    : 'text-red-600'
                }`}
              >
                {formatCLP(lastProyectado.neto)}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
