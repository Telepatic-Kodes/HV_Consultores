'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  TrendingUp,
  TrendingDown,
  CheckCircle,
  Clock,
  AlertCircle,
  Search,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Transaction {
  _id: string
  fecha: string
  descripcion: string
  monto: number
  tipo?: 'cargo' | 'abono'
  categoria?: string
  estado_conciliacion?: 'pending' | 'matched' | 'partial' | 'unmatched' | 'manual'
  banco: string
}

interface TransactionRowProps {
  transaction: Transaction
  selected: boolean
  onClick: () => void
}

const statusConfig: Record<
  NonNullable<Transaction['estado_conciliacion']>,
  { label: string; className: string; icon: React.ElementType }
> = {
  matched: {
    label: 'Conciliado',
    className: 'bg-green-100 text-green-800 border-green-200',
    icon: CheckCircle,
  },
  partial: {
    label: 'Parcial',
    className: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: Search,
  },
  unmatched: {
    label: 'Sin match',
    className: 'bg-red-100 text-red-800 border-red-200',
    icon: AlertCircle,
  },
  pending: {
    label: 'Pendiente',
    className: 'bg-amber-100 text-amber-800 border-amber-200',
    icon: Clock,
  },
  manual: {
    label: 'Manual',
    className: 'bg-purple-100 text-purple-800 border-purple-200',
    icon: CheckCircle,
  },
}

function formatDate(fecha: string): string {
  try {
    const date = new Date(fecha)
    return date.toLocaleDateString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  } catch {
    return fecha
  }
}

function formatAmount(monto: number): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
  }).format(Math.abs(monto))
}

function truncateText(text: string, maxLength: number = 40): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

export function TransactionRow({ transaction, selected, onClick }: TransactionRowProps) {
  const isCargo = transaction.tipo === 'cargo' || (!transaction.tipo && transaction.monto < 0)
  const status = transaction.estado_conciliacion ?? 'pending'
  const statusInfo = statusConfig[status]
  const StatusIcon = statusInfo.icon

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick()
        }
      }}
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
        'hover:bg-muted/50',
        selected && 'ring-2 ring-primary border-primary'
      )}
    >
      {/* Type indicator icon */}
      <div
        className={cn(
          'flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full',
          isCargo ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'
        )}
      >
        {isCargo ? (
          <TrendingDown className="h-4 w-4" />
        ) : (
          <TrendingUp className="h-4 w-4" />
        )}
      </div>

      {/* Date */}
      <span className="flex-shrink-0 w-24 text-sm text-muted-foreground">
        {formatDate(transaction.fecha)}
      </span>

      {/* Description */}
      <span className="flex-1 min-w-0 text-sm font-medium truncate" title={transaction.descripcion}>
        {truncateText(transaction.descripcion)}
      </span>

      {/* Category badge */}
      {transaction.categoria && (
        <Badge variant="secondary" className="flex-shrink-0">
          {transaction.categoria}
        </Badge>
      )}

      {/* Amount */}
      <span
        className={cn(
          'flex-shrink-0 w-28 text-sm font-semibold text-right tabular-nums',
          isCargo ? 'text-red-600' : 'text-green-600'
        )}
      >
        {isCargo ? '-' : '+'}{formatAmount(transaction.monto)}
      </span>

      {/* Reconciliation status badge */}
      <Badge
        variant="outline"
        className={cn('flex-shrink-0 gap-1', statusInfo.className)}
      >
        <StatusIcon className="h-3 w-3" />
        {statusInfo.label}
      </Badge>

      {/* Bank name */}
      <span className="flex-shrink-0 w-20 text-xs text-muted-foreground text-right">
        {transaction.banco}
      </span>

      {/* Detail button */}
      <Button
        variant="ghost"
        size="icon"
        className="flex-shrink-0 h-8 w-8"
        onClick={(e) => {
          e.stopPropagation()
        }}
      >
        <Search className="h-4 w-4" />
      </Button>
    </div>
  )
}
