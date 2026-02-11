'use client'

import { useState } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Loader2, Plus, TrendingUp, TrendingDown, Minus } from 'lucide-react'

type Moneda = 'UF' | 'USD' | 'EUR'

const MONEDA_LABELS: Record<Moneda, string> = {
  UF: 'UF',
  USD: 'Dólar USA',
  EUR: 'Euro',
}

export function RatesTable() {
  const [selectedMoneda, setSelectedMoneda] = useState<Moneda>('UF')
  const [page, setPage] = useState(0)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [newFecha, setNewFecha] = useState('')
  const [newValor, setNewValor] = useState('')

  const PAGE_SIZE = 30
  const history = useQuery(api.currency.getRateHistory, {
    moneda: selectedMoneda,
    limit: PAGE_SIZE + 1, // Fetch one extra to know if there's more
  })

  const setRate = useMutation(api.currency.setExchangeRate)

  const handleAddRate = async () => {
    if (!newFecha || !newValor) return
    await setRate({
      moneda: selectedMoneda,
      fecha: newFecha,
      valor: Number(newValor),
      fuente: 'manual',
    })
    setAddDialogOpen(false)
    setNewFecha('')
    setNewValor('')
  }

  const displayData = history?.slice(0, PAGE_SIZE) ?? []

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-sm font-medium">
          Historial de Tipos de Cambio
        </CardTitle>
        <div className="flex items-center gap-2">
          <Select
            value={selectedMoneda}
            onValueChange={(v) => {
              setSelectedMoneda(v as Moneda)
              setPage(0)
            }}
          >
            <SelectTrigger className="w-[100px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(MONEDA_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>
                  {v}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            size="sm"
            className="h-8"
            onClick={() => setAddDialogOpen(true)}
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Agregar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {history === undefined ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : displayData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm font-medium">Sin registros</p>
            <p className="text-xs text-muted-foreground mt-1">
              Agrega tipos de cambio manualmente o importa desde una fuente
            </p>
          </div>
        ) : (
          <>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Valor (CLP)</TableHead>
                    <TableHead>Variación</TableHead>
                    <TableHead>Fuente</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayData.map((rate, i) => {
                    const prevRate = displayData[i + 1]
                    const diff = prevRate
                      ? rate.valor - prevRate.valor
                      : 0
                    const diffPct = prevRate
                      ? ((diff / prevRate.valor) * 100).toFixed(2)
                      : null

                    return (
                      <TableRow key={rate._id}>
                        <TableCell>
                          <span className="text-sm">
                            {new Intl.DateTimeFormat('es-CL', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            }).format(new Date(rate.fecha))}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm font-semibold">
                            $
                            {rate.valor.toLocaleString('es-CL', {
                              minimumFractionDigits:
                                selectedMoneda === 'UF' ? 2 : 0,
                              maximumFractionDigits:
                                selectedMoneda === 'UF' ? 2 : 2,
                            })}
                          </span>
                        </TableCell>
                        <TableCell>
                          {diffPct !== null ? (
                            <div className="flex items-center gap-1">
                              {diff > 0 ? (
                                <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                              ) : diff < 0 ? (
                                <TrendingDown className="h-3.5 w-3.5 text-red-500" />
                              ) : (
                                <Minus className="h-3.5 w-3.5 text-muted-foreground" />
                              )}
                              <span
                                className={`text-xs font-medium ${
                                  diff > 0
                                    ? 'text-emerald-600'
                                    : diff < 0
                                    ? 'text-red-600'
                                    : 'text-muted-foreground'
                                }`}
                              >
                                {diff > 0 ? '+' : ''}
                                {diffPct}%
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              —
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className="text-[10px]"
                          >
                            {rate.fuente ?? 'manual'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>

            {(history?.length ?? 0) > PAGE_SIZE && (
              <div className="flex justify-center pt-3">
                <p className="text-xs text-muted-foreground">
                  Mostrando últimos {PAGE_SIZE} registros
                </p>
              </div>
            )}
          </>
        )}
      </CardContent>

      {/* Add Rate Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Agregar Tipo de Cambio</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Moneda</Label>
              <Badge variant="secondary">{selectedMoneda}</Badge>
            </div>
            <div className="space-y-2">
              <Label htmlFor="rate-fecha">Fecha</Label>
              <Input
                id="rate-fecha"
                type="date"
                value={newFecha}
                onChange={(e) => setNewFecha(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rate-valor">Valor en CLP</Label>
              <Input
                id="rate-valor"
                type="number"
                step="0.01"
                placeholder={
                  selectedMoneda === 'UF' ? '38250.00' : '900'
                }
                value={newValor}
                onChange={(e) => setNewValor(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAddDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleAddRate}
              disabled={!newFecha || !newValor}
            >
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
