'use client'

import { Card, CardContent } from '@/components/ui/card'

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

export function KPICard({ title, value, description, icon, trend, color = 'blue' }: KPICardProps) {
  const colorConfig = {
    blue: {
      bg: 'bg-primary/10',
      text: 'text-primary',
      ring: 'ring-primary/20',
      gradient: 'from-primary/5 to-transparent'
    },
    green: {
      bg: 'bg-success/10',
      text: 'text-success',
      ring: 'ring-success/20',
      gradient: 'from-success/5 to-transparent'
    },
    amber: {
      bg: 'bg-warning/10',
      text: 'text-warning',
      ring: 'ring-warning/20',
      gradient: 'from-warning/5 to-transparent'
    },
    violet: {
      bg: 'bg-violet-600/10',
      text: 'text-violet-600',
      ring: 'ring-violet-600/20',
      gradient: 'from-violet-600/5 to-transparent'
    },
    red: {
      bg: 'bg-destructive/10',
      text: 'text-destructive',
      ring: 'ring-destructive/20',
      gradient: 'from-destructive/5 to-transparent'
    },
  }

  const config = colorConfig[color]

  return (
    <Card className="group relative overflow-hidden hover:shadow-executive-md transition-all duration-300">
      <div className={`absolute inset-0 bg-gradient-to-br ${config.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
      <CardContent className="relative pt-5 pb-5">
        <div className="flex items-start justify-between mb-4">
          <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${config.bg} ring-1 ${config.ring}`}>
            <div className={config.text}>{icon}</div>
          </div>
          {trend && (
            <span
              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${
                trend.isPositive
                  ? 'bg-success/10 text-success'
                  : 'bg-destructive/10 text-destructive'
              }`}
            >
              {trend.isPositive ? '+' : ''}{trend.value}%
            </span>
          )}
        </div>
        <div className="space-y-1">
          <p className="text-2xl font-bold tracking-tight font-mono">{value}</p>
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="text-[11px] text-muted-foreground leading-relaxed">{description}</p>
        </div>
      </CardContent>
    </Card>
  )
}
