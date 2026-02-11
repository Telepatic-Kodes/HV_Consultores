'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, Clock, AlertCircle, TrendingUp } from 'lucide-react'

interface ReconciliationStatsProps {
  stats: {
    total: number
    matched: number
    partial: number
    unmatched: number
    pending: number
    montoTotal: number
    montoConciliado: number
    montoPendiente: number
    tasaConciliacion: number
  }
}

function formatCLP(amount: number): string {
  return `$${amount.toLocaleString('es-CL')}`
}

function getProgressColor(rate: number): {
  ring: string
  text: string
  bg: string
} {
  if (rate >= 80) {
    return {
      ring: 'border-emerald-500',
      text: 'text-emerald-500',
      bg: 'bg-emerald-500/10',
    }
  }
  if (rate >= 50) {
    return {
      ring: 'border-amber-500',
      text: 'text-amber-500',
      bg: 'bg-amber-500/10',
    }
  }
  return {
    ring: 'border-red-500',
    text: 'text-red-500',
    bg: 'bg-red-500/10',
  }
}

export function ReconciliationStats({ stats }: ReconciliationStatsProps) {
  const progressColor = getProgressColor(stats.tasaConciliacion)
  const pendingTotal = stats.pending + stats.unmatched

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Tasa Conciliacion */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Tasa Conciliacion
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <div
              className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-4 ${progressColor.ring} ${progressColor.bg}`}
            >
              <span
                className={`text-base font-bold ${progressColor.text}`}
              >
                {stats.tasaConciliacion}%
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-2xl font-bold tracking-tight">
                {stats.matched}
                <span className="text-sm font-normal text-muted-foreground">
                  /{stats.total}
                </span>
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {formatCLP(stats.montoTotal)} total
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Conciliadas */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Conciliadas
          </CardTitle>
          <CheckCircle className="h-4 w-4 text-emerald-500" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <p className="text-2xl font-bold tracking-tight">
              {stats.matched}
            </p>
            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Conciliado</Badge>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            {formatCLP(stats.montoConciliado)}
          </p>
        </CardContent>
      </Card>

      {/* Pendientes */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Pendientes
          </CardTitle>
          <Clock className="h-4 w-4 text-amber-500" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <p className="text-2xl font-bold tracking-tight">
              {pendingTotal}
            </p>
            <Badge className="bg-amber-100 text-amber-700 border-amber-200">Pendiente</Badge>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            {formatCLP(stats.montoPendiente)}
          </p>
        </CardContent>
      </Card>

      {/* Parciales */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Parciales
          </CardTitle>
          <AlertCircle className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <p className="text-2xl font-bold tracking-tight">
              {stats.partial}
            </p>
            <Badge className="bg-blue-100 text-blue-700 border-blue-200">Parcial</Badge>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Requieren revision manual
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
