'use client'

import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EXECUTIVE_COLORS } from '../executive-charts/chart-utils'

interface ComparisonTableRow {
  label: string
  periodA: number
  periodB: number
  highlight?: boolean
}

interface PeriodComparisonTableProps {
  title?: string
  subtitle?: string
  periodALabel: string
  periodBLabel: string
  rows: ComparisonTableRow[]
  unit?: 'number' | 'currency' | 'percent'
  showChange?: boolean
  showChangePercent?: boolean
  invertColors?: boolean // true if lower is better
  className?: string
}

export function PeriodComparisonTable({
  title,
  subtitle,
  periodALabel,
  periodBLabel,
  rows,
  unit = 'number',
  showChange = true,
  showChangePercent = true,
  invertColors = false,
  className = '',
}: PeriodComparisonTableProps) {
  // Format value
  const formatValue = (val: number) => {
    switch (unit) {
      case 'currency':
        if (Math.abs(val) >= 1000000) {
          return `$${(val / 1000000).toFixed(1)}M`
        }
        if (Math.abs(val) >= 1000) {
          return `$${(val / 1000).toFixed(0)}K`
        }
        return `$${val.toLocaleString('es-CL')}`
      case 'percent':
        return `${val.toFixed(1)}%`
      default:
        return val.toLocaleString('es-CL')
    }
  }

  // Calculate change
  const getChange = (a: number, b: number) => b - a
  const getChangePercent = (a: number, b: number) => (a !== 0 ? ((b - a) / Math.abs(a)) * 100 : 0)

  // Get trend info
  const getTrend = (a: number, b: number) => {
    const change = b - a
    if (Math.abs(change) < 0.01) return 'stable'
    return change > 0 ? 'up' : 'down'
  }

  // Get color based on trend
  const getTrendColor = (trend: string, isPositive: boolean) => {
    if (trend === 'stable') return EXECUTIVE_COLORS.neutral
    const positive = invertColors ? trend === 'down' : trend === 'up'
    return positive ? EXECUTIVE_COLORS.success : EXECUTIVE_COLORS.danger
  }

  return (
    <Card className={className}>
      {(title || subtitle) && (
        <CardHeader className="pb-2">
          {title && (
            <CardTitle className="text-sm font-semibold uppercase tracking-widest text-muted-foreground/70">
              {title}
            </CardTitle>
          )}
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </CardHeader>
      )}
      <CardContent className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b">
                Métrica
              </th>
              <th
                className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider border-b"
                style={{ color: EXECUTIVE_COLORS.neutral }}
              >
                {periodALabel}
              </th>
              <th
                className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider border-b"
                style={{ color: EXECUTIVE_COLORS.primary }}
              >
                {periodBLabel}
              </th>
              {showChange && (
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b">
                  Cambio
                </th>
              )}
              {showChangePercent && (
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b">
                  % Var.
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => {
              const trend = getTrend(row.periodA, row.periodB)
              const change = getChange(row.periodA, row.periodB)
              const changePercent = getChangePercent(row.periodA, row.periodB)
              const trendColor = getTrendColor(trend, change > 0)

              const TrendIcon =
                trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus

              return (
                <tr
                  key={index}
                  className={`${row.highlight ? 'bg-muted/30' : ''} hover:bg-muted/20 transition-colors`}
                >
                  <td
                    className={`px-4 py-3 text-sm border-b ${row.highlight ? 'font-semibold' : ''}`}
                    style={{ color: EXECUTIVE_COLORS.textPrimary }}
                  >
                    {row.label}
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-mono text-muted-foreground border-b">
                    {formatValue(row.periodA)}
                  </td>
                  <td
                    className="px-4 py-3 text-right text-sm font-mono font-semibold border-b"
                    style={{ color: EXECUTIVE_COLORS.primary }}
                  >
                    {formatValue(row.periodB)}
                  </td>
                  {showChange && (
                    <td
                      className="px-4 py-3 text-right text-sm font-mono border-b"
                      style={{ color: trendColor }}
                    >
                      {change > 0 ? '+' : ''}
                      {formatValue(change)}
                    </td>
                  )}
                  {showChangePercent && (
                    <td className="px-4 py-3 text-center border-b">
                      <span
                        className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full"
                        style={{
                          backgroundColor: `${trendColor}15`,
                          color: trendColor,
                        }}
                      >
                        <TrendIcon className="h-3 w-3" />
                        {changePercent > 0 ? '+' : ''}
                        {changePercent.toFixed(1)}%
                      </span>
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </CardContent>
    </Card>
  )
}

export default PeriodComparisonTable
