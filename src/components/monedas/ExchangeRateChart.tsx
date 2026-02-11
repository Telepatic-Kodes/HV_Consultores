'use client'

import { useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { useState } from 'react'
import { Button } from '@/components/ui/button'

type Moneda = 'UF' | 'USD' | 'EUR'

const MONEDA_COLORS: Record<Moneda, string> = {
  UF: '#8b5cf6',
  USD: '#3b82f6',
  EUR: '#f59e0b',
}

const MONEDA_LABELS: Record<Moneda, string> = {
  UF: 'UF (CLP)',
  USD: 'USD (CLP)',
  EUR: 'EUR (CLP)',
}

interface ExchangeRateChartProps {
  moneda?: Moneda
  limit?: number
}

export function ExchangeRateChart({
  moneda: initialMoneda,
  limit = 90,
}: ExchangeRateChartProps) {
  const [selectedMoneda, setSelectedMoneda] = useState<Moneda>(
    initialMoneda ?? 'UF'
  )

  const history = useQuery(api.currency.getRateHistory, {
    moneda: selectedMoneda,
    limit,
  })

  const chartData =
    history
      ?.slice()
      .reverse()
      .map((r) => ({
        fecha: r.fecha,
        fechaLabel: new Intl.DateTimeFormat('es-CL', {
          day: '2-digit',
          month: 'short',
        }).format(new Date(r.fecha)),
        valor: r.valor,
      })) ?? []

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">
          Tipo de Cambio Histórico
        </CardTitle>
        <div className="flex items-center gap-1">
          {(['UF', 'USD', 'EUR'] as Moneda[]).map((m) => (
            <Button
              key={m}
              variant={selectedMoneda === m ? 'default' : 'outline'}
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => setSelectedMoneda(m)}
            >
              {m}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {history === undefined ? (
          <div className="flex items-center justify-center h-[300px]">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[300px] text-center">
            <p className="text-sm font-medium">Sin datos</p>
            <p className="text-xs text-muted-foreground mt-1">
              Importa tipos de cambio para ver el gráfico
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="fechaLabel"
                tick={{ fontSize: 11 }}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 11 }}
                domain={['auto', 'auto']}
                tickFormatter={(val) =>
                  selectedMoneda === 'UF'
                    ? `$${val.toLocaleString('es-CL')}`
                    : `$${val}`
                }
              />
              <Tooltip
                formatter={(val) => [
                  `$${Number(val).toLocaleString('es-CL', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}`,
                  MONEDA_LABELS[selectedMoneda],
                ]}
                labelFormatter={(label) => label}
              />
              <Line
                type="monotone"
                dataKey="valor"
                stroke={MONEDA_COLORS[selectedMoneda]}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
