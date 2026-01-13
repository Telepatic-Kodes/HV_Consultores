'use client'

import { useMemo } from 'react'
import { EXECUTIVE_COLORS, formatCurrency, formatPercent } from './chart-utils'

interface BulletChartProps {
  title: string
  subtitle?: string
  actual: number
  target: number
  ranges?: [number, number, number] // [poor, satisfactory, good] thresholds
  max?: number
  unit?: 'currency' | 'percent' | 'number'
  showLabels?: boolean
  height?: number
  className?: string
}

export function BulletChart({
  title,
  subtitle,
  actual,
  target,
  ranges,
  max,
  unit = 'number',
  showLabels = true,
  height = 48,
  className = '',
}: BulletChartProps) {
  const { normalizedActual, normalizedTarget, normalizedRanges, maxValue, formattedActual, formattedTarget, percentOfTarget } =
    useMemo(() => {
      // Calcular el máximo
      const computedMax = max || Math.max(actual, target) * 1.2
      const computedRanges = ranges || [computedMax * 0.3, computedMax * 0.6, computedMax]

      // Normalizar valores (0-100%)
      const normalize = (value: number) => (value / computedMax) * 100

      // Formatear valores según la unidad
      const format = (value: number) => {
        switch (unit) {
          case 'currency':
            return formatCurrency(value, true)
          case 'percent':
            return formatPercent(value)
          default:
            return value.toLocaleString('es-CL')
        }
      }

      return {
        normalizedActual: normalize(actual),
        normalizedTarget: normalize(target),
        normalizedRanges: computedRanges.map(normalize) as [number, number, number],
        maxValue: computedMax,
        formattedActual: format(actual),
        formattedTarget: format(target),
        percentOfTarget: Math.round((actual / target) * 100),
      }
    }, [actual, target, ranges, max, unit])

  // Determinar el estado basado en el rendimiento
  const status = useMemo(() => {
    const ratio = actual / target
    if (ratio >= 1) return 'excellent'
    if (ratio >= 0.8) return 'good'
    if (ratio >= 0.6) return 'satisfactory'
    return 'poor'
  }, [actual, target])

  const statusColors = {
    excellent: EXECUTIVE_COLORS.success,
    good: EXECUTIVE_COLORS.secondary,
    satisfactory: EXECUTIVE_COLORS.warning,
    poor: EXECUTIVE_COLORS.danger,
  }

  const barColor = statusColors[status]

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h4 className="text-sm font-semibold text-foreground">{title}</h4>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        {showLabels && (
          <div className="text-right">
            <p className="text-lg font-bold font-mono" style={{ color: barColor }}>
              {formattedActual}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {percentOfTarget}% del objetivo
            </p>
          </div>
        )}
      </div>

      {/* Bullet Bar */}
      <div className="relative" style={{ height }}>
        {/* Background ranges */}
        <div className="absolute inset-0 flex rounded overflow-hidden">
          {/* Poor range */}
          <div
            className="h-full"
            style={{
              width: `${normalizedRanges[0]}%`,
              backgroundColor: `${EXECUTIVE_COLORS.danger}15`,
            }}
          />
          {/* Satisfactory range */}
          <div
            className="h-full"
            style={{
              width: `${normalizedRanges[1] - normalizedRanges[0]}%`,
              backgroundColor: `${EXECUTIVE_COLORS.warning}15`,
            }}
          />
          {/* Good range */}
          <div
            className="h-full"
            style={{
              width: `${normalizedRanges[2] - normalizedRanges[1]}%`,
              backgroundColor: `${EXECUTIVE_COLORS.success}15`,
            }}
          />
        </div>

        {/* Actual value bar */}
        <div
          className="absolute top-1/2 -translate-y-1/2 h-[60%] rounded transition-all duration-700 ease-out"
          style={{
            width: `${Math.min(normalizedActual, 100)}%`,
            backgroundColor: barColor,
          }}
        />

        {/* Target marker */}
        <div
          className="absolute top-0 bottom-0 w-0.5 transition-all duration-500"
          style={{
            left: `${Math.min(normalizedTarget, 100)}%`,
            backgroundColor: EXECUTIVE_COLORS.textPrimary,
          }}
        >
          {/* Target diamond */}
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rotate-45"
            style={{ backgroundColor: EXECUTIVE_COLORS.textPrimary }}
          />
        </div>

        {/* Scale markers */}
        <div className="absolute -bottom-5 left-0 right-0 flex justify-between text-[9px] text-muted-foreground font-mono">
          <span>0</span>
          <span style={{ marginLeft: `${normalizedTarget - 5}%` }}>Meta: {formattedTarget}</span>
          <span>{unit === 'currency' ? formatCurrency(maxValue, true) : maxValue.toLocaleString('es-CL')}</span>
        </div>
      </div>
    </div>
  )
}

// Variante horizontal compacta para dashboards
interface CompactBulletProps {
  label: string
  actual: number
  target: number
  unit?: 'currency' | 'percent' | 'number'
  className?: string
}

export function CompactBullet({ label, actual, target, unit = 'number', className = '' }: CompactBulletProps) {
  const percent = Math.min((actual / target) * 100, 100)
  const isOnTarget = actual >= target

  const format = (value: number) => {
    switch (unit) {
      case 'currency':
        return formatCurrency(value, true)
      case 'percent':
        return formatPercent(value)
      default:
        return value.toLocaleString('es-CL')
    }
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <span className="text-xs text-muted-foreground w-24 truncate">{label}</span>
      <div className="flex-1 h-2 bg-muted/30 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${percent}%`,
            backgroundColor: isOnTarget ? EXECUTIVE_COLORS.success : EXECUTIVE_COLORS.warning,
          }}
        />
      </div>
      <span className="text-xs font-mono w-16 text-right">
        {format(actual)}
      </span>
    </div>
  )
}

// Grupo de bullets para comparativas
interface BulletGroupProps {
  title?: string
  items: Array<{
    label: string
    actual: number
    target: number
  }>
  unit?: 'currency' | 'percent' | 'number'
  className?: string
}

export function BulletGroup({ title, items, unit = 'number', className = '' }: BulletGroupProps) {
  return (
    <div className={className}>
      {title && <h4 className="text-sm font-semibold text-foreground mb-3">{title}</h4>}
      <div className="space-y-3">
        {items.map((item, index) => (
          <CompactBullet
            key={index}
            label={item.label}
            actual={item.actual}
            target={item.target}
            unit={unit}
          />
        ))}
      </div>
    </div>
  )
}

export default BulletChart
