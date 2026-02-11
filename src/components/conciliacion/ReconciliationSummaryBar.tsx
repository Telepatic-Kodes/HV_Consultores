'use client'

import { Progress } from '@/components/ui/progress'

interface ReconciliationSummaryBarProps {
  matched: number
  partial: number
  unmatched: number
  pending: number
  total: number
}

export function ReconciliationSummaryBar({
  matched,
  partial,
  unmatched,
  pending,
  total,
}: ReconciliationSummaryBarProps) {
  const safeTotal = total > 0 ? total : 1
  const matchedPct = (matched / safeTotal) * 100
  const partialPct = (partial / safeTotal) * 100
  const unmatchedPct = (unmatched / safeTotal) * 100
  const pendingPct = (pending / safeTotal) * 100
  const conciliadasPct = Math.round(matchedPct)

  return (
    <div className="space-y-3">
      {/* Summary text */}
      <p className="text-sm text-muted-foreground">
        <span className="font-semibold text-foreground">{matched}</span> de{' '}
        <span className="font-semibold text-foreground">{total}</span>{' '}
        transacciones conciliadas ({conciliadasPct}%)
      </p>

      {/* Stacked bar */}
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted">
        {matchedPct > 0 && (
          <div
            className="h-full bg-emerald-500 transition-all duration-500"
            style={{ width: `${matchedPct}%` }}
          />
        )}
        {partialPct > 0 && (
          <div
            className="h-full bg-blue-500 transition-all duration-500"
            style={{ width: `${partialPct}%` }}
          />
        )}
        {unmatchedPct > 0 && (
          <div
            className="h-full bg-red-500 transition-all duration-500"
            style={{ width: `${unmatchedPct}%` }}
          />
        )}
        {pendingPct > 0 && (
          <div
            className="h-full bg-gray-400 transition-all duration-500"
            style={{ width: `${pendingPct}%` }}
          />
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500" />
          <span>Conciliadas ({matched})</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-blue-500" />
          <span>Parciales ({partial})</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-red-500" />
          <span>Sin match ({unmatched})</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-gray-400" />
          <span>Pendientes ({pending})</span>
        </div>
      </div>
    </div>
  )
}
