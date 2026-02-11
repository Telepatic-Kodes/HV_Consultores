'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  TrendingUp,
  CheckCircle,
  AlertTriangle,
  Clock,
  Brain,
} from 'lucide-react'

interface ScorecardMetric {
  label: string
  value: number
  max: number
  icon: any
  color: string
  barColor: string
}

interface ClientScorecardProps {
  clienteName: string
  tasaConciliacion: number
  precisionML: number
  itemsPendientes: number
  totalItems: number
  alertasAbiertas: number
  pipelineRuns: number
}

function getRiskLevel(
  tasaConciliacion: number,
  alertasAbiertas: number
): { label: string; color: string } {
  if (tasaConciliacion >= 80 && alertasAbiertas <= 2) {
    return { label: 'Bajo', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' }
  }
  if (tasaConciliacion >= 50 || alertasAbiertas <= 5) {
    return { label: 'Medio', color: 'bg-amber-100 text-amber-700 border-amber-200' }
  }
  return { label: 'Alto', color: 'bg-red-100 text-red-700 border-red-200' }
}

export function ClientScorecard({
  clienteName,
  tasaConciliacion,
  precisionML,
  itemsPendientes,
  totalItems,
  alertasAbiertas,
  pipelineRuns,
}: ClientScorecardProps) {
  const risk = getRiskLevel(tasaConciliacion, alertasAbiertas)

  const metrics: ScorecardMetric[] = [
    {
      label: 'Tasa Conciliación',
      value: tasaConciliacion,
      max: 100,
      icon: CheckCircle,
      color: tasaConciliacion >= 80 ? 'text-emerald-600' : tasaConciliacion >= 50 ? 'text-amber-600' : 'text-red-600',
      barColor: tasaConciliacion >= 80 ? '[&>div]:bg-emerald-500' : tasaConciliacion >= 50 ? '[&>div]:bg-amber-500' : '[&>div]:bg-red-500',
    },
    {
      label: 'Precisión ML',
      value: precisionML,
      max: 100,
      icon: Brain,
      color: precisionML >= 80 ? 'text-emerald-600' : precisionML >= 60 ? 'text-amber-600' : 'text-red-600',
      barColor: precisionML >= 80 ? '[&>div]:bg-emerald-500' : precisionML >= 60 ? '[&>div]:bg-amber-500' : '[&>div]:bg-red-500',
    },
    {
      label: 'Items Procesados',
      value: totalItems - itemsPendientes,
      max: totalItems,
      icon: TrendingUp,
      color: 'text-blue-600',
      barColor: '[&>div]:bg-blue-500',
    },
  ]

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{clienteName}</CardTitle>
          <div className="flex items-center gap-2">
            <Badge className={risk.color}>
              Riesgo {risk.label}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {metrics.map((metric) => (
          <div key={metric.label} className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <metric.icon className={`h-4 w-4 ${metric.color}`} />
                <span className="text-xs font-medium text-muted-foreground">
                  {metric.label}
                </span>
              </div>
              <span className={`text-xs font-semibold ${metric.color}`}>
                {metric.value}
                {metric.max === 100 ? '%' : `/${metric.max}`}
              </span>
            </div>
            <Progress
              value={(metric.value / metric.max) * 100}
              className={`h-1.5 ${metric.barColor}`}
            />
          </div>
        ))}

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t">
          <div className="text-center">
            <p className="text-lg font-bold">{itemsPendientes}</p>
            <p className="text-[10px] text-muted-foreground">Pendientes</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-amber-600">
              {alertasAbiertas}
            </p>
            <p className="text-[10px] text-muted-foreground">Alertas</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-blue-600">{pipelineRuns}</p>
            <p className="text-[10px] text-muted-foreground">Pipelines</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
