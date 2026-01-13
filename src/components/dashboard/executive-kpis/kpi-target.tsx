'use client'

import { Target, CheckCircle, AlertCircle, Clock } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { EXECUTIVE_COLORS, formatCurrency } from '../executive-charts/chart-utils'
import { MiniGauge } from '../executive-charts/gauge-chart'

interface KPITargetCardProps {
  title: string
  currentValue: number
  targetValue: number
  unit?: 'currency' | 'percent' | 'number'
  deadline?: string
  showGauge?: boolean
  className?: string
}

export function KPITargetCard({
  title,
  currentValue,
  targetValue,
  unit = 'number',
  deadline,
  showGauge = true,
  className = '',
}: KPITargetCardProps) {
  const percentComplete = Math.min((currentValue / targetValue) * 100, 100)
  const remaining = targetValue - currentValue
  const isComplete = currentValue >= targetValue

  // Determinar estado
  let status: 'on-track' | 'at-risk' | 'behind' | 'complete' = 'on-track'
  if (isComplete) {
    status = 'complete'
  } else if (percentComplete >= 80) {
    status = 'on-track'
  } else if (percentComplete >= 50) {
    status = 'at-risk'
  } else {
    status = 'behind'
  }

  const statusConfig = {
    complete: {
      color: EXECUTIVE_COLORS.success,
      icon: CheckCircle,
      label: 'Completado',
      bgColor: `${EXECUTIVE_COLORS.success}15`,
    },
    'on-track': {
      color: EXECUTIVE_COLORS.success,
      icon: Target,
      label: 'En camino',
      bgColor: `${EXECUTIVE_COLORS.success}15`,
    },
    'at-risk': {
      color: EXECUTIVE_COLORS.warning,
      icon: AlertCircle,
      label: 'En riesgo',
      bgColor: `${EXECUTIVE_COLORS.warning}15`,
    },
    behind: {
      color: EXECUTIVE_COLORS.danger,
      icon: Clock,
      label: 'Atrasado',
      bgColor: `${EXECUTIVE_COLORS.danger}15`,
    },
  }

  const config = statusConfig[status]
  const StatusIcon = config.icon

  // Formatear valores
  const formatValue = (val: number) => {
    switch (unit) {
      case 'currency':
        return formatCurrency(val, true)
      case 'percent':
        return val.toFixed(1) + '%'
      default:
        return val.toLocaleString('es-CL')
    }
  }

  return (
    <Card className={`overflow-hidden ${className}`}>
      <CardContent className="pt-5 pb-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/70">
              {title}
            </p>
            {deadline && (
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Fecha límite: {deadline}
              </p>
            )}
          </div>
          <span
            className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full"
            style={{
              backgroundColor: config.bgColor,
              color: config.color,
            }}
          >
            <StatusIcon className="h-3 w-3" />
            {config.label}
          </span>
        </div>

        {/* Main content */}
        <div className="flex items-end justify-between gap-4">
          <div className="flex-1">
            {/* Current value */}
            <p className="text-2xl font-bold font-mono tracking-tight">
              {formatValue(currentValue)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              de {formatValue(targetValue)} objetivo
            </p>

            {/* Progress bar */}
            <div className="mt-4">
              <div className="h-2.5 bg-muted/30 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{
                    width: `${percentComplete}%`,
                    backgroundColor: config.color,
                  }}
                />
              </div>
              <div className="flex justify-between mt-1.5 text-[10px] text-muted-foreground">
                <span>{percentComplete.toFixed(0)}% completado</span>
                {!isComplete && <span>Faltan {formatValue(remaining)}</span>}
              </div>
            </div>
          </div>

          {/* Gauge */}
          {showGauge && (
            <MiniGauge
              value={percentComplete}
              max={100}
              size={60}
              color={config.color}
            />
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Variante con múltiples objetivos
interface MultiTargetKPIProps {
  title?: string
  targets: Array<{
    label: string
    current: number
    target: number
    unit?: 'currency' | 'percent' | 'number'
  }>
  className?: string
}

export function MultiTargetKPI({ title, targets, className = '' }: MultiTargetKPIProps) {
  return (
    <Card className={className}>
      <CardContent className="pt-5 pb-4">
        {title && (
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/70 mb-4">
            {title}
          </p>
        )}

        <div className="space-y-4">
          {targets.map((target, index) => {
            const percent = Math.min((target.current / target.target) * 100, 100)
            const isComplete = target.current >= target.target
            const color = isComplete
              ? EXECUTIVE_COLORS.success
              : percent >= 70
              ? EXECUTIVE_COLORS.secondary
              : percent >= 40
              ? EXECUTIVE_COLORS.warning
              : EXECUTIVE_COLORS.danger

            const formatValue = (val: number) => {
              switch (target.unit) {
                case 'currency':
                  return formatCurrency(val, true)
                case 'percent':
                  return val.toFixed(1) + '%'
                default:
                  return val.toLocaleString('es-CL')
              }
            }

            return (
              <div key={index} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{target.label}</span>
                  <span className="font-mono">
                    <span className="font-semibold">{formatValue(target.current)}</span>
                    <span className="text-muted-foreground">/{formatValue(target.target)}</span>
                  </span>
                </div>
                <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${percent}%`,
                      backgroundColor: color,
                    }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

// Variante circular para métricas de porcentaje
interface CircularTargetProps {
  title: string
  value: number
  target?: number
  size?: number
  className?: string
}

export function CircularTarget({
  title,
  value,
  target = 100,
  size = 120,
  className = '',
}: CircularTargetProps) {
  const percent = Math.min((value / target) * 100, 100)
  const isComplete = value >= target
  const color = isComplete
    ? EXECUTIVE_COLORS.success
    : percent >= 70
    ? EXECUTIVE_COLORS.secondary
    : percent >= 40
    ? EXECUTIVE_COLORS.warning
    : EXECUTIVE_COLORS.danger

  const strokeWidth = 8
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (percent / 100) * circumference

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={EXECUTIVE_COLORS.border}
            strokeWidth={strokeWidth}
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-700 ease-out"
          />
        </svg>

        {/* Center value */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="text-2xl font-bold font-mono"
            style={{ color }}
          >
            {Math.round(value)}%
          </span>
          {isComplete && (
            <CheckCircle className="h-4 w-4 mt-1" style={{ color }} />
          )}
        </div>
      </div>

      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/70 mt-3 text-center">
        {title}
      </p>
    </div>
  )
}

export default KPITargetCard
