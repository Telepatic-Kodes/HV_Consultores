'use client'

import { useState } from 'react'
import { useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ArrowRightLeft, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

type Moneda = 'CLP' | 'USD' | 'EUR' | 'UF'

const MONEDAS: { value: Moneda; label: string; symbol: string }[] = [
  { value: 'CLP', label: 'Peso Chileno', symbol: '$' },
  { value: 'UF', label: 'UF', symbol: 'UF' },
  { value: 'USD', label: 'Dólar USA', symbol: 'US$' },
  { value: 'EUR', label: 'Euro', symbol: '€' },
]

export function CurrencyConverter() {
  const [monto, setMonto] = useState<string>('1000000')
  const [monedaOrigen, setMonedaOrigen] = useState<Moneda>('CLP')
  const [monedaDestino, setMonedaDestino] = useState<Moneda>('UF')

  const conversion = useQuery(
    api.currency.convertAmount,
    monto && Number(monto) > 0
      ? {
          monto: Number(monto),
          monedaOrigen,
          monedaDestino,
        }
      : 'skip'
  )

  const latestRates = useQuery(api.currency.getAllLatestRates)

  const handleSwap = () => {
    setMonedaOrigen(monedaDestino)
    setMonedaDestino(monedaOrigen)
  }

  const getSymbol = (m: Moneda) =>
    MONEDAS.find((x) => x.value === m)?.symbol ?? ''

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">
          Conversor de Moneda
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Input */}
        <div className="space-y-2">
          <Label className="text-xs">Monto</Label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              placeholder="1000000"
              className="flex-1"
            />
            <Select
              value={monedaOrigen}
              onValueChange={(v) => setMonedaOrigen(v as Moneda)}
            >
              <SelectTrigger className="w-[110px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MONEDAS.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Swap button */}
        <div className="flex justify-center">
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0 rounded-full"
            onClick={handleSwap}
          >
            <ArrowRightLeft className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Output */}
        <div className="space-y-2">
          <Label className="text-xs">Resultado</Label>
          <div className="flex items-center gap-2">
            <div className="flex-1 rounded-md border bg-muted/30 px-3 py-2 text-sm font-semibold min-h-[40px] flex items-center">
              {conversion === undefined ? (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              ) : conversion?.monto != null ? (
                <span>
                  {getSymbol(monedaDestino)}{' '}
                  {conversion.monto.toLocaleString('es-CL', {
                    minimumFractionDigits: monedaDestino === 'CLP' ? 0 : 2,
                    maximumFractionDigits: monedaDestino === 'CLP' ? 0 : 2,
                  })}
                </span>
              ) : conversion?.error ? (
                <span className="text-xs text-red-500">{conversion.error}</span>
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </div>
            <Select
              value={monedaDestino}
              onValueChange={(v) => setMonedaDestino(v as Moneda)}
            >
              <SelectTrigger className="w-[110px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MONEDAS.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Rate info */}
        {conversion?.tasa && (
          <p className="text-xs text-muted-foreground text-center">
            1 {monedaOrigen} = {conversion.tasa.toLocaleString('es-CL', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 4,
            })}{' '}
            {monedaDestino}
            {conversion.fecha && (
              <span className="ml-1">
                ({conversion.fecha})
              </span>
            )}
          </p>
        )}

        {/* Latest rates summary */}
        {latestRates && Object.keys(latestRates).length > 0 && (
          <div className="border-t pt-3 mt-2">
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
              Tipos de cambio actuales
            </p>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(latestRates).map(([moneda, rate]: [string, any]) => (
                <div
                  key={moneda}
                  className="rounded-md border p-2 text-center"
                >
                  <p className="text-[10px] text-muted-foreground">{moneda}</p>
                  <p className="text-sm font-semibold">
                    ${rate.valor.toLocaleString('es-CL', {
                      minimumFractionDigits: moneda === 'UF' ? 2 : 0,
                    })}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {rate.fecha}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
