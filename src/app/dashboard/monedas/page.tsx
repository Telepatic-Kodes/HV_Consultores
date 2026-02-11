'use client'

import { useQuery } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Coins, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { ExchangeRateChart, CurrencyConverter, RatesTable } from '@/components/monedas'

export default function MonedasPage() {
  const latestRates = useQuery(api.currency.getAllLatestRates)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Coins className="h-5 w-5 text-primary" />
          </div>
          Tipos de Cambio
        </h1>
        <p className="text-muted-foreground mt-1">
          Monitorea y gestiona tipos de cambio para UF, USD y EUR
        </p>
      </div>

      {/* Current rates summary */}
      {latestRates && Object.keys(latestRates).length > 0 && (
        <div className="grid gap-4 md:grid-cols-3">
          {Object.entries(latestRates).map(([moneda, rate]: [string, any]) => (
            <Card key={moneda}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{moneda}</CardTitle>
                <Badge variant="outline" className="text-[10px]">
                  {rate.fecha}
                </Badge>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  $
                  {rate.valor.toLocaleString('es-CL', {
                    minimumFractionDigits: moneda === 'UF' ? 2 : 0,
                    maximumFractionDigits: moneda === 'UF' ? 2 : 2,
                  })}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Fuente: {rate.fuente ?? 'manual'}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Chart + Converter */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ExchangeRateChart />
        </div>
        <div>
          <CurrencyConverter />
        </div>
      </div>

      {/* Historical table */}
      <RatesTable />
    </div>
  )
}
