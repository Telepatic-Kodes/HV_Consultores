'use client'

import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Sparkline } from '../executive-charts/sparkline'
import { EXECUTIVE_COLORS, getTrendColor, formatCurrency, formatPercent } from '../executive-charts/chart-utils'
import type { ExecutiveKPI } from '@/types/reportes-ejecutivo.types'

interface KPISparklineCardProps {
  kpi: ExecutiveKPI
  showSparkline?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function KPISparklineCard({
  kpi,
  showSparkline = true,
  size = 'md',
  className = '',
}: KPISparklineCardProps) {
  const {
    title,
    formattedValue,
    change,
    changePercent,
    trend,
    status,
    sparklineData,
    icon,
    description,
  } = kpi

  const trendColor = getTrendColor(trend)
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus

  // Tamaños según variant
  const sizeConfig = {
    sm: {
      padding: 'pt-4 pb-4 px-4',
      valueSize: 'text-xl',
      titleSize: 'text-[10px]',
      iconSize: 'h-8 w-8',
      sparklineWidth: 60,
      sparklineHeight: 24,
    },
    md: {
      padding: 'pt-5 pb-5 px-5',
      valueSize: 'text-2xl',
      titleSize: 'text-xs',
      iconSize: 'h-10 w-10',
      sparklineWidth: 80,
      sparklineHeight: 28,
    },
    lg: {
      padding: 'pt-6 pb-6 px-6',
      valueSize: 'text-3xl',
      titleSize: 'text-sm',
      iconSize: 'h-12 w-12',
      sparklineWidth: 100,
      sparklineHeight: 32,
    },
  }

  const config = sizeConfig[size]

  return (
    <Card className={`group relative overflow-hidden hover:shadow-executive-md transition-all duration-300 ${className}`}>
      {/* Gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <CardContent className={`relative ${config.padding}`}>
        {/* Header row: Title and Icon */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <p className={`${config.titleSize} font-semibold uppercase tracking-widest text-muted-foreground/70`}>
              {title}
            </p>
            {description && (
              <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">
                {description}
              </p>
            )}
          </div>
          {icon && (
            <div
              className={`${config.iconSize} rounded-lg flex items-center justify-center ring-1`}
              style={{
                backgroundColor: `${EXECUTIVE_COLORS.primary}10`,
                borderColor: `${EXECUTIVE_COLORS.primary}20`,
              }}
            >
              <span className="text-primary" style={{ fontSize: size === 'lg' ? 20 : size === 'md' ? 16 : 14 }}>
                {icon}
              </span>
            </div>
          )}
        </div>

        {/* Value and Sparkline */}
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className={`${config.valueSize} font-bold tracking-tight font-mono`}>
              {formattedValue}
            </p>

            {/* Trend indicator */}
            {typeof changePercent === 'number' && (
              <div className="flex items-center gap-1.5 mt-1.5">
                <span
                  className="inline-flex items-center gap-1 text-xs font-semibold px-1.5 py-0.5 rounded"
                  style={{
                    backgroundColor: `${trendColor}15`,
                    color: trendColor,
                  }}
                >
                  <TrendIcon className="h-3 w-3" />
                  {changePercent > 0 ? '+' : ''}{changePercent.toFixed(1)}%
                </span>
                <span className="text-[10px] text-muted-foreground">
                  vs anterior
                </span>
              </div>
            )}
          </div>

          {/* Sparkline */}
          {showSparkline && sparklineData && sparklineData.length > 1 && (
            <Sparkline
              data={sparklineData}
              width={config.sparklineWidth}
              height={config.sparklineHeight}
              color={trendColor}
              showTrend
            />
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Variante compacta para dashboards densos
interface CompactKPIProps {
  title: string
  value: string | number
  change?: number
  trend?: 'up' | 'down' | 'stable'
  sparklineData?: number[]
  className?: string
}

export function CompactKPI({
  title,
  value,
  change,
  trend = 'stable',
  sparklineData,
  className = '',
}: CompactKPIProps) {
  const trendColor = getTrendColor(trend)
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus

  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg bg-muted/30 ${className}`}>
      {/* Sparkline mini */}
      {sparklineData && sparklineData.length > 1 && (
        <Sparkline
          data={sparklineData}
          width={40}
          height={20}
          showArea={false}
          showLastDot={false}
          strokeWidth={1.5}
          color={trendColor}
          animated={false}
        />
      )}

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 truncate">
          {title}
        </p>
        <div className="flex items-baseline gap-2">
          <span className="text-lg font-bold font-mono">{value}</span>
          {typeof change === 'number' && (
            <span
              className="text-[10px] font-semibold flex items-center gap-0.5"
              style={{ color: trendColor }}
            >
              <TrendIcon className="h-2.5 w-2.5" />
              {change > 0 ? '+' : ''}{change}%
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

// Variante con icono grande para métricas principales
interface HeroKPIProps {
  title: string
  value: string | number
  subtitle?: string
  change?: number
  trend?: 'up' | 'down' | 'stable'
  icon: React.ReactNode
  color?: 'primary' | 'success' | 'warning' | 'danger'
  sparklineData?: number[]
  className?: string
}

export function HeroKPI({
  title,
  value,
  subtitle,
  change,
  trend = 'stable',
  icon,
  color = 'primary',
  sparklineData,
  className = '',
}: HeroKPIProps) {
  const colorMap = {
    primary: EXECUTIVE_COLORS.primary,
    success: EXECUTIVE_COLORS.success,
    warning: EXECUTIVE_COLORS.warning,
    danger: EXECUTIVE_COLORS.danger,
  }

  const baseColor = colorMap[color]
  const trendColor = getTrendColor(trend)
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus

  return (
    <Card className={`group relative overflow-hidden ${className}`}>
      {/* Background accent */}
      <div
        className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-10"
        style={{ backgroundColor: baseColor }}
      />

      <CardContent className="relative pt-6 pb-6">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div
            className="h-14 w-14 rounded-xl flex items-center justify-center ring-1 shrink-0"
            style={{
              backgroundColor: `${baseColor}10`,
              borderColor: `${baseColor}20`,
            }}
          >
            <div style={{ color: baseColor }}>{icon}</div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/70">
              {title}
            </p>
            <p className="text-3xl font-bold tracking-tight font-mono mt-1">
              {value}
            </p>
            {subtitle && (
              <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
            )}

            {/* Trend and Sparkline row */}
            <div className="flex items-center justify-between mt-3">
              {typeof change === 'number' && (
                <span
                  className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full"
                  style={{
                    backgroundColor: `${trendColor}15`,
                    color: trendColor,
                  }}
                >
                  <TrendIcon className="h-3 w-3" />
                  {change > 0 ? '+' : ''}{change}%
                </span>
              )}

              {sparklineData && sparklineData.length > 1 && (
                <Sparkline
                  data={sparklineData}
                  width={80}
                  height={24}
                  color={baseColor}
                  showArea
                  showLastDot
                />
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default KPISparklineCard
