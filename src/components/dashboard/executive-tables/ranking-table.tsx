'use client'

import { ArrowUp, ArrowDown, Minus, Trophy, Medal, Award } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EXECUTIVE_COLORS } from '../executive-charts/chart-utils'

interface RankingTableRow {
  rank: number
  previousRank?: number
  name: string
  value: number
  secondaryValue?: number
  badge?: string
}

interface RankingTableProps {
  title?: string
  subtitle?: string
  valueLabel: string
  secondaryValueLabel?: string
  rows: RankingTableRow[]
  unit?: 'number' | 'currency' | 'percent'
  showMovement?: boolean
  showMedals?: boolean
  maxRows?: number
  className?: string
}

export function RankingTable({
  title,
  subtitle,
  valueLabel,
  secondaryValueLabel,
  rows,
  unit = 'number',
  showMovement = true,
  showMedals = true,
  maxRows = 10,
  className = '',
}: RankingTableProps) {
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

  // Get movement indicator
  const getMovement = (current: number, previous?: number) => {
    if (previous === undefined) return null
    const diff = previous - current // Positive means improved (lower rank is better)
    if (diff > 0) return { direction: 'up', value: diff }
    if (diff < 0) return { direction: 'down', value: Math.abs(diff) }
    return { direction: 'stable', value: 0 }
  }

  // Get medal for top positions
  const getMedal = (rank: number) => {
    if (!showMedals) return null
    switch (rank) {
      case 1:
        return <Trophy className="h-5 w-5 text-yellow-500" />
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />
      case 3:
        return <Award className="h-5 w-5 text-amber-600" />
      default:
        return null
    }
  }

  // Calculate max value for bar
  const maxValue = Math.max(...rows.map((r) => r.value))

  // Limit rows
  const displayRows = rows.slice(0, maxRows)

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
              <th className="px-3 py-2 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b w-12">
                #
              </th>
              {showMovement && (
                <th className="px-2 py-2 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b w-10">
                  Δ
                </th>
              )}
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b">
                Nombre
              </th>
              <th
                className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wider border-b"
                style={{ color: EXECUTIVE_COLORS.primary }}
              >
                {valueLabel}
              </th>
              {secondaryValueLabel && (
                <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b">
                  {secondaryValueLabel}
                </th>
              )}
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b w-32">
                {/* Bar */}
              </th>
            </tr>
          </thead>
          <tbody>
            {displayRows.map((row, index) => {
              const movement = getMovement(row.rank, row.previousRank)
              const medal = getMedal(row.rank)
              const barWidth = maxValue > 0 ? (row.value / maxValue) * 100 : 0

              return (
                <tr
                  key={index}
                  className={`${row.rank <= 3 ? 'bg-muted/20' : ''} hover:bg-muted/10 transition-colors`}
                >
                  {/* Rank */}
                  <td className="px-3 py-3 text-center border-b">
                    <div className="flex items-center justify-center gap-1">
                      {medal || (
                        <span
                          className="text-sm font-bold"
                          style={{
                            color:
                              row.rank <= 3
                                ? EXECUTIVE_COLORS.primary
                                : EXECUTIVE_COLORS.neutral,
                          }}
                        >
                          {row.rank}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Movement */}
                  {showMovement && (
                    <td className="px-2 py-3 text-center border-b">
                      {movement && movement.direction !== 'stable' && (
                        <span
                          className="inline-flex items-center text-xs font-semibold"
                          style={{
                            color:
                              movement.direction === 'up'
                                ? EXECUTIVE_COLORS.success
                                : EXECUTIVE_COLORS.danger,
                          }}
                        >
                          {movement.direction === 'up' ? (
                            <ArrowUp className="h-3 w-3" />
                          ) : (
                            <ArrowDown className="h-3 w-3" />
                          )}
                          {movement.value}
                        </span>
                      )}
                      {movement && movement.direction === 'stable' && (
                        <Minus className="h-3 w-3 mx-auto text-muted-foreground/50" />
                      )}
                    </td>
                  )}

                  {/* Name */}
                  <td
                    className={`px-3 py-3 text-sm border-b ${row.rank <= 3 ? 'font-semibold' : ''}`}
                  >
                    <div className="flex items-center gap-2">
                      {row.name}
                      {row.badge && (
                        <span
                          className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                          style={{
                            backgroundColor: `${EXECUTIVE_COLORS.accent}20`,
                            color: EXECUTIVE_COLORS.accent,
                          }}
                        >
                          {row.badge}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Value */}
                  <td
                    className="px-3 py-3 text-right text-sm font-mono font-semibold border-b"
                    style={{ color: EXECUTIVE_COLORS.primary }}
                  >
                    {formatValue(row.value)}
                  </td>

                  {/* Secondary Value */}
                  {secondaryValueLabel && (
                    <td className="px-3 py-3 text-right text-sm font-mono text-muted-foreground border-b">
                      {row.secondaryValue !== undefined
                        ? formatValue(row.secondaryValue)
                        : '-'}
                    </td>
                  )}

                  {/* Bar */}
                  <td className="px-3 py-3 border-b">
                    <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${barWidth}%`,
                          backgroundColor:
                            row.rank === 1
                              ? EXECUTIVE_COLORS.success
                              : row.rank === 2
                                ? EXECUTIVE_COLORS.secondary
                                : row.rank === 3
                                  ? EXECUTIVE_COLORS.accent
                                  : EXECUTIVE_COLORS.neutral,
                        }}
                      />
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {rows.length > maxRows && (
          <p className="text-xs text-muted-foreground text-center mt-3">
            Mostrando {maxRows} de {rows.length} registros
          </p>
        )}
      </CardContent>
    </Card>
  )
}

export default RankingTable
