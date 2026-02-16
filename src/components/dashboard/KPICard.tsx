'use client'

import { cn } from '@/lib/utils'
import { BentoCard } from './BentoCard'

interface KPICardProps {
  title: string
  value: string | number
  description: string
  icon: React.ReactNode
  trend?: {
    value: number
    isPositive: boolean
  }
  color?: 'blue' | 'green' | 'amber' | 'violet' | 'red'
}

const dotColors = {
  blue: 'bg-primary',
  green: 'bg-success',
  amber: 'bg-warning',
  violet: 'bg-violet-600',
  red: 'bg-destructive',
}

export function KPICard({ title, value, description, trend, color = 'blue' }: KPICardProps) {
  return (
    <BentoCard>
      <div className="flex items-center gap-2 mb-3">
        <div className={cn('h-2 w-2 rounded-full', dotColors[color])} />
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {title}
        </p>
      </div>
      <p className="text-2xl font-semibold tabular-nums tracking-tight">{value}</p>
      <div className="flex items-center gap-2 mt-1">
        <p className="text-xs text-muted-foreground">{description}</p>
        {trend && (
          <span
            className={cn(
              'text-[10px] font-bold px-1.5 py-0.5 rounded-full',
              trend.isPositive
                ? 'bg-success/10 text-success'
                : 'bg-destructive/10 text-destructive'
            )}
          >
            {trend.isPositive ? '+' : ''}{trend.value}%
          </span>
        )}
      </div>
    </BentoCard>
  )
}
