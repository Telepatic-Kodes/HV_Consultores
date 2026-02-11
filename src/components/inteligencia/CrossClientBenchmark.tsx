// @ts-nocheck
'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ArrowUp, ArrowDown, Minus } from 'lucide-react'

interface ClientBenchmark {
  clienteId: string
  razonSocial: string
  rut: string
  tasaConciliacion: number
  totalTransacciones: number
  alertasAbiertas: number
  precisionML: number
}

interface CrossClientBenchmarkProps {
  clients: ClientBenchmark[]
}

function getRankIcon(current: number, avg: number) {
  if (current > avg + 5) return <ArrowUp className="h-3.5 w-3.5 text-emerald-500" />
  if (current < avg - 5) return <ArrowDown className="h-3.5 w-3.5 text-red-500" />
  return <Minus className="h-3.5 w-3.5 text-muted-foreground" />
}

export function CrossClientBenchmark({ clients }: CrossClientBenchmarkProps) {
  if (clients.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <p className="text-sm text-muted-foreground">Sin datos</p>
        </CardContent>
      </Card>
    )
  }

  const avgConciliacion =
    clients.reduce((s, c) => s + c.tasaConciliacion, 0) / clients.length
  const avgPrecision =
    clients.reduce((s, c) => s + c.precisionML, 0) / clients.length

  const sorted = [...clients].sort(
    (a, b) => b.tasaConciliacion - a.tasaConciliacion
  )

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">
          Benchmark entre Clientes
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Conciliación</TableHead>
                <TableHead>Precisión ML</TableHead>
                <TableHead>Transacciones</TableHead>
                <TableHead>Alertas</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((client, i) => (
                <TableRow key={client.clienteId}>
                  <TableCell>
                    <span className="text-xs font-mono text-muted-foreground">
                      {i + 1}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm font-medium">{client.razonSocial}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {client.rut}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress
                        value={client.tasaConciliacion}
                        className={`h-1.5 w-16 ${
                          client.tasaConciliacion >= 80
                            ? '[&>div]:bg-emerald-500'
                            : client.tasaConciliacion >= 50
                            ? '[&>div]:bg-amber-500'
                            : '[&>div]:bg-red-500'
                        }`}
                      />
                      <span className="text-xs font-semibold">
                        {client.tasaConciliacion}%
                      </span>
                      {getRankIcon(client.tasaConciliacion, avgConciliacion)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold">
                        {client.precisionML}%
                      </span>
                      {getRankIcon(client.precisionML, avgPrecision)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs font-medium">
                      {client.totalTransacciones}
                    </span>
                  </TableCell>
                  <TableCell>
                    {client.alertasAbiertas > 0 ? (
                      <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-[10px]">
                        {client.alertasAbiertas}
                      </Badge>
                    ) : (
                      <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-[10px]">
                        0
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Averages */}
        <div className="flex items-center gap-4 pt-3 text-xs text-muted-foreground">
          <span>
            Promedio conciliación:{' '}
            <span className="font-semibold text-foreground">
              {Math.round(avgConciliacion)}%
            </span>
          </span>
          <span>
            Promedio ML:{' '}
            <span className="font-semibold text-foreground">
              {Math.round(avgPrecision)}%
            </span>
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
