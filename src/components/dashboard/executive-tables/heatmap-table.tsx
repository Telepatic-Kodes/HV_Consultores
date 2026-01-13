'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EXECUTIVE_COLORS, generateHeatmapScale } from '../executive-charts/chart-utils'

interface HeatmapTableProps {
  title?: string
  subtitle?: string
  columns: string[]
  rows: {
    label: string
    values: number[]
    highlight?: boolean
  }[]
  unit?: 'number' | 'currency' | 'percent'
  colorScale?: 'green' | 'blue' | 'red' | 'divergent'
  showTotals?: boolean
  className?: string
}

export function HeatmapTable({
  title,
  subtitle,
  columns,
  rows,
  unit = 'number',
  colorScale = 'blue',
  showTotals = false,
  className = '',
}: HeatmapTableProps) {
  // Calculate min/max for color scale
  const { min, max } = useMemo(() => {
    const allValues = rows.flatMap((row) => row.values)
    return {
      min: Math.min(...allValues),
      max: Math.max(...allValues),
    }
  }, [rows])

  // Format value based on unit
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

  // Get cell color based on value
  const getCellColor = (value: number) => {
    const normalizedValue = max !== min ? (value - min) / (max - min) : 0.5

    switch (colorScale) {
      case 'green':
        return `rgba(5, 150, 105, ${0.1 + normalizedValue * 0.5})`
      case 'red':
        return `rgba(220, 38, 38, ${0.1 + normalizedValue * 0.5})`
      case 'divergent':
        const midpoint = (max + min) / 2
        if (value < midpoint) {
          const intensity = 1 - (value - min) / (midpoint - min)
          return `rgba(220, 38, 38, ${0.1 + intensity * 0.4})`
        } else {
          const intensity = (value - midpoint) / (max - midpoint)
          return `rgba(5, 150, 105, ${0.1 + intensity * 0.4})`
        }
      default: // blue
        return `rgba(26, 80, 145, ${0.1 + normalizedValue * 0.5})`
    }
  }

  // Calculate totals
  const columnTotals = useMemo(() => {
    if (!showTotals) return []
    return columns.map((_, colIndex) =>
      rows.reduce((sum, row) => sum + row.values[colIndex], 0)
    )
  }, [columns, rows, showTotals])

  const rowTotals = useMemo(() => {
    if (!showTotals) return []
    return rows.map((row) => row.values.reduce((sum, val) => sum + val, 0))
  }, [rows, showTotals])

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
              <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground border-b">
                {/* Empty corner */}
              </th>
              {columns.map((col, index) => (
                <th
                  key={index}
                  className="px-3 py-2 text-center text-xs font-semibold uppercase tracking-wider border-b"
                  style={{ color: EXECUTIVE_COLORS.primary }}
                >
                  {col}
                </th>
              ))}
              {showTotals && (
                <th
                  className="px-3 py-2 text-center text-xs font-semibold uppercase tracking-wider border-b"
                  style={{ color: EXECUTIVE_COLORS.primary }}
                >
                  Total
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className={row.highlight ? 'font-semibold' : ''}
              >
                <td
                  className="px-3 py-2 text-sm border-b whitespace-nowrap"
                  style={{ color: EXECUTIVE_COLORS.textPrimary }}
                >
                  {row.label}
                </td>
                {row.values.map((value, colIndex) => (
                  <td
                    key={colIndex}
                    className="px-3 py-2 text-center text-sm font-mono border-b transition-colors"
                    style={{ backgroundColor: getCellColor(value) }}
                  >
                    {formatValue(value)}
                  </td>
                ))}
                {showTotals && (
                  <td
                    className="px-3 py-2 text-center text-sm font-mono font-semibold border-b"
                    style={{
                      backgroundColor: `${EXECUTIVE_COLORS.primary}10`,
                      color: EXECUTIVE_COLORS.primary,
                    }}
                  >
                    {formatValue(rowTotals[rowIndex])}
                  </td>
                )}
              </tr>
            ))}
            {showTotals && (
              <tr className="font-semibold">
                <td
                  className="px-3 py-2 text-sm"
                  style={{ color: EXECUTIVE_COLORS.primary }}
                >
                  Total
                </td>
                {columnTotals.map((total, index) => (
                  <td
                    key={index}
                    className="px-3 py-2 text-center text-sm font-mono"
                    style={{
                      backgroundColor: `${EXECUTIVE_COLORS.primary}10`,
                      color: EXECUTIVE_COLORS.primary,
                    }}
                  >
                    {formatValue(total)}
                  </td>
                ))}
                {showTotals && (
                  <td
                    className="px-3 py-2 text-center text-sm font-mono"
                    style={{
                      backgroundColor: `${EXECUTIVE_COLORS.primary}20`,
                      color: EXECUTIVE_COLORS.primary,
                    }}
                  >
                    {formatValue(columnTotals.reduce((a, b) => a + b, 0))}
                  </td>
                )}
              </tr>
            )}
          </tbody>
        </table>

        {/* Legend */}
        <div className="flex items-center justify-end gap-4 mt-4 text-xs text-muted-foreground">
          <span>Menor</span>
          <div className="flex h-3">
            {[0, 0.25, 0.5, 0.75, 1].map((intensity) => (
              <div
                key={intensity}
                className="w-6 h-full"
                style={{
                  backgroundColor:
                    colorScale === 'green'
                      ? `rgba(5, 150, 105, ${0.1 + intensity * 0.5})`
                      : colorScale === 'red'
                        ? `rgba(220, 38, 38, ${0.1 + intensity * 0.5})`
                        : `rgba(26, 80, 145, ${0.1 + intensity * 0.5})`,
                }}
              />
            ))}
          </div>
          <span>Mayor</span>
        </div>
      </CardContent>
    </Card>
  )
}

export default HeatmapTable
