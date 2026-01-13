'use client'

import { ArrowUp, ArrowDown, ArrowRight, TrendingUp, TrendingDown } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { EXECUTIVE_COLORS, getTrendColor, formatCurrency } from '../executive-charts/chart-utils'

interface KPIComparisonProps {
  title: string
  currentValue: number
  currentLabel?: string
  previousValue: number
  previousLabel?: string
  unit?: 'currency' | 'percent' | 'number'
  invertColors?: boolean // true si menor es mejor (ej: gastos)
  showBar?: boolean
  className?: string
}

export function KPIComparisonCard({
  title,
  currentValue,
  currentLabel = 'Actual',
  previousValue,
  previousLabel = 'Anterior',
  unit = 'number',
  invertColors = false,
  showBar = true,
  className = '',
}: KPIComparisonProps) {
  const change = currentValue - previousValue
  const changePercent = previousValue !== 0 ? (change / Math.abs(previousValue)) * 100 : 0
  const trend = change > 0 ? 'up' : change < 0 ? 'down' : 'stable'
  const isPositive = invertColors ? change < 0 : change > 0
  const statusColor = isPositive ? EXECUTIVE_COLORS.success : change === 0 ? EXECUTIVE_COLORS.neutral : EXECUTIVE_COLORS.danger

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

  // Calcular barra de progreso
  const maxVal = Math.max(currentValue, previousValue) * 1.1
  const currentPercent = (currentValue / maxVal) * 100
  const previousPercent = (previousValue / maxVal) * 100

  return (
    <Card className={`overflow-hidden ${className}`}>
      <CardContent className="pt-5 pb-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/70">
              {title}
            </p>
          </div>
          <span
            className="inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full"
            style={{
              backgroundColor: `${statusColor}15`,
              color: statusColor,
            }}
          >
            {trend === 'up' ? <ArrowUp className="h-3 w-3" /> : trend === 'down' ? <ArrowDown className="h-3 w-3" /> : <ArrowRight className="h-3 w-3" />}
            {changePercent > 0 ? '+' : ''}{changePercent.toFixed(1)}%
          </span>
        </div>

        {/* Values comparison */}
        <div className="grid grid-cols-2 gap-4">
          {/* Current */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              {currentLabel}
            </p>
            <p className="text-2xl font-bold font-mono tracking-tight">
              {formatValue(currentValue)}
            </p>
            {showBar && (
              <div className="h-2 bg-muted/30 rounded-full mt-2 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${currentPercent}%`,
                    backgroundColor: EXECUTIVE_COLORS.primary,
                  }}
                />
              </div>
            )}
          </div>

          {/* Previous */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              {previousLabel}
            </p>
            <p className="text-2xl font-bold font-mono tracking-tight text-muted-foreground">
              {formatValue(previousValue)}
            </p>
            {showBar && (
              <div className="h-2 bg-muted/30 rounded-full mt-2 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${previousPercent}%`,
                    backgroundColor: EXECUTIVE_COLORS.neutralLight,
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Change indicator */}
        <div className="mt-4 pt-4 border-t border-border/30">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Diferencia</span>
            <span
              className="font-semibold font-mono"
              style={{ color: statusColor }}
            >
              {change > 0 ? '+' : ''}{formatValue(change)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Variante inline compacta
interface InlineComparisonProps {
  label: string
  current: number
  previous: number
  unit?: 'currency' | 'percent' | 'number'
  invertColors?: boolean
  className?: string
}

export function InlineComparison({
  label,
  current,
  previous,
  unit = 'number',
  invertColors = false,
  className = '',
}: InlineComparisonProps) {
  const change = current - previous
  const changePercent = previous !== 0 ? (change / Math.abs(previous)) * 100 : 0
  const isPositive = invertColors ? change < 0 : change > 0
  const statusColor = isPositive ? EXECUTIVE_COLORS.success : change === 0 ? EXECUTIVE_COLORS.neutral : EXECUTIVE_COLORS.danger

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
    <div className={`flex items-center justify-between py-2 ${className}`}>
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="flex items-center gap-3">
        <span className="text-sm font-mono font-semibold">{formatValue(current)}</span>
        <span
          className="text-xs font-semibold flex items-center gap-0.5"
          style={{ color: statusColor }}
        >
          {change > 0 ? <TrendingUp className="h-3 w-3" /> : change < 0 ? <TrendingDown className="h-3 w-3" /> : null}
          {changePercent > 0 ? '+' : ''}{changePercent.toFixed(1)}%
        </span>
      </div>
    </div>
  )
}

// Tabla de comparación múltiple
interface ComparisonTableProps {
  title?: string
  items: Array<{
    label: string
    current: number
    previous: number
  }>
  unit?: 'currency' | 'percent' | 'number'
  invertColors?: boolean
  className?: string
}

export function ComparisonTable({
  title,
  items,
  unit = 'number',
  invertColors = false,
  className = '',
}: ComparisonTableProps) {
  return (
    <Card className={className}>
      <CardContent className="pt-5 pb-4">
        {title && (
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/70 mb-4">
            {title}
          </p>
        )}
        <div className="space-y-1 divide-y divide-border/30">
          {items.map((item, index) => (
            <InlineComparison
              key={index}
              label={item.label}
              current={item.current}
              previous={item.previous}
              unit={unit}
              invertColors={invertColors}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export default KPIComparisonCard
