'use client'

import { useQuery } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Coins, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { TopNav } from '@/components/dashboard'
import { ExchangeRateChart, CurrencyConverter, RatesTable } from '@/components/monedas'

export default function MonedasPage() {
  const latestRates = useQuery(api.currency.getAllLatestRates)

  return (
    <>
      <TopNav title="Tipos de Cambio" subtitle="Monitorea y gestiona tipos de cambio para UF, USD y EUR" />
      <main className="p-4 md:p-6 lg:p-8 space-y-6">

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
      </main>
    </>
  )
}
