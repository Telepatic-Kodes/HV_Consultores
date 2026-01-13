'use client'

import { useMemo } from 'react'
import { EXECUTIVE_COLORS, getTrendColor } from './chart-utils'

interface SparklineProps {
  data: number[]
  width?: number
  height?: number
  color?: string
  showArea?: boolean
  showDots?: boolean
  showLastDot?: boolean
  showTrend?: boolean
  strokeWidth?: number
  className?: string
  animated?: boolean
}

export function Sparkline({
  data,
  width = 100,
  height = 32,
  color,
  showArea = true,
  showDots = false,
  showLastDot = true,
  showTrend = false,
  strokeWidth = 2,
  className = '',
  animated = true,
}: SparklineProps) {
  const { path, areaPath, points, trend, lastPoint, minY, maxY } = useMemo(() => {
    if (!data || data.length < 2) {
      return { path: '', areaPath: '', points: [], trend: 'stable' as const, lastPoint: null, minY: 0, maxY: 0 }
    }

    const padding = 4
    const effectiveWidth = width - padding * 2
    const effectiveHeight = height - padding * 2

    const minVal = Math.min(...data)
    const maxVal = Math.max(...data)
    const range = maxVal - minVal || 1

    // Normalizar puntos
    const normalizedPoints = data.map((value, index) => ({
      x: padding + (index / (data.length - 1)) * effectiveWidth,
      y: padding + effectiveHeight - ((value - minVal) / range) * effectiveHeight,
      value,
    }))

    // Crear path para línea
    const linePath = normalizedPoints
      .map((point, i) => `${i === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
      .join(' ')

    // Crear path para área
    const areaPathStr = `${linePath} L ${normalizedPoints[normalizedPoints.length - 1].x} ${height - padding} L ${padding} ${height - padding} Z`

    // Calcular tendencia
    const firstHalf = data.slice(0, Math.floor(data.length / 2))
    const secondHalf = data.slice(Math.floor(data.length / 2))
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length
    const trendDir = secondAvg > firstAvg * 1.02 ? 'up' : secondAvg < firstAvg * 0.98 ? 'down' : 'stable'

    return {
      path: linePath,
      areaPath: areaPathStr,
      points: normalizedPoints,
      trend: trendDir as 'up' | 'down' | 'stable',
      lastPoint: normalizedPoints[normalizedPoints.length - 1],
      minY: minVal,
      maxY: maxVal,
    }
  }, [data, width, height])

  // Determinar color
  const lineColor = color || (showTrend ? getTrendColor(trend) : EXECUTIVE_COLORS.primary)

  if (!data || data.length < 2) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ width, height }}>
        <span className="text-[10px] text-muted-foreground">Sin datos</span>
      </div>
    )
  }

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      style={{ overflow: 'visible' }}
    >
      {/* Gradient definition for area */}
      <defs>
        <linearGradient id={`sparkline-gradient-${lineColor.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={lineColor} stopOpacity={0.3} />
          <stop offset="100%" stopColor={lineColor} stopOpacity={0.02} />
        </linearGradient>
      </defs>

      {/* Area fill */}
      {showArea && (
        <path
          d={areaPath}
          fill={`url(#sparkline-gradient-${lineColor.replace('#', '')})`}
          className={animated ? 'animate-in fade-in duration-700' : ''}
        />
      )}

      {/* Main line */}
      <path
        d={path}
        fill="none"
        stroke={lineColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={animated ? 'animate-in fade-in slide-in-from-left-2 duration-700' : ''}
        style={{
          strokeDasharray: animated ? 1000 : 0,
          strokeDashoffset: animated ? 0 : 0,
        }}
      />

      {/* All dots */}
      {showDots &&
        points.map((point, i) => (
          <circle
            key={i}
            cx={point.x}
            cy={point.y}
            r={2}
            fill={EXECUTIVE_COLORS.bgCard}
            stroke={lineColor}
            strokeWidth={1.5}
          />
        ))}

      {/* Last dot highlight */}
      {showLastDot && lastPoint && (
        <g>
          {/* Outer glow */}
          <circle
            cx={lastPoint.x}
            cy={lastPoint.y}
            r={5}
            fill={lineColor}
            opacity={0.2}
            className={animated ? 'animate-pulse' : ''}
          />
          {/* Inner dot */}
          <circle
            cx={lastPoint.x}
            cy={lastPoint.y}
            r={3}
            fill={EXECUTIVE_COLORS.bgCard}
            stroke={lineColor}
            strokeWidth={2}
          />
        </g>
      )}
    </svg>
  )
}

// Variante mini para uso inline
interface MiniSparklineProps {
  data: number[]
  trend?: 'up' | 'down' | 'stable'
  className?: string
}

export function MiniSparkline({ data, trend, className = '' }: MiniSparklineProps) {
  const color = trend ? getTrendColor(trend) : undefined

  return (
    <Sparkline
      data={data}
      width={60}
      height={20}
      color={color}
      showArea={false}
      showDots={false}
      showLastDot={false}
      showTrend={!trend}
      strokeWidth={1.5}
      className={className}
      animated={false}
    />
  )
}

// Variante con barra de comparación
interface SparklineBarProps {
  data: number[]
  width?: number
  height?: number
  color?: string
  className?: string
}

export function SparklineBar({ data, width = 80, height = 24, color, className = '' }: SparklineBarProps) {
  if (!data || data.length === 0) return null

  const maxVal = Math.max(...data)
  const barWidth = (width - (data.length - 1) * 2) / data.length

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className={className}>
      {data.map((value, i) => {
        const barHeight = (value / maxVal) * height
        const isLast = i === data.length - 1

        return (
          <rect
            key={i}
            x={i * (barWidth + 2)}
            y={height - barHeight}
            width={barWidth}
            height={barHeight}
            fill={isLast ? (color || EXECUTIVE_COLORS.primary) : EXECUTIVE_COLORS.neutralLight}
            rx={1}
            className="transition-all duration-300"
          />
        )
      })}
    </svg>
  )
}

export default Sparkline
