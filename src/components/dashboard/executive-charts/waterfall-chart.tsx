'use client'

import { useMemo } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from 'recharts'
import { EXECUTIVE_COLORS, TOOLTIP_STYLE, formatCurrency } from './chart-utils'
import type { WaterfallDataPoint } from '@/types/reportes-ejecutivo.types'

interface WaterfallChartProps {
  data: WaterfallDataPoint[]
  title?: string
  subtitle?: string
  height?: number
  showConnectors?: boolean
  startValue?: number
  currency?: boolean
  className?: string
}

export function WaterfallChart({
  data,
  title,
  subtitle,
  height = 300,
  showConnectors = true,
  startValue = 0,
  currency = true,
  className = '',
}: WaterfallChartProps) {
  // Procesar datos para formato waterfall
  const processedData = useMemo(() => {
    let runningTotal = startValue

    return data.map((item, index) => {
      const isTotal = item.type === 'total'
      const isSubtotal = item.type === 'subtotal'

      let base = 0
      let value = item.value

      if (isTotal || isSubtotal) {
        // Para totales, la barra va desde 0 hasta el valor total
        value = runningTotal
        base = 0
      } else {
        // Para incrementos/decrementos, la barra empieza donde terminó la anterior
        base = runningTotal
        runningTotal += item.value
      }

      // Determinar color
      let fill = item.color
      if (!fill) {
        if (isTotal || isSubtotal) {
          fill = EXECUTIVE_COLORS.primary
        } else if (item.value >= 0) {
          fill = EXECUTIVE_COLORS.success
        } else {
          fill = EXECUTIVE_COLORS.danger
        }
      }

      return {
        ...item,
        name: item.name,
        value: Math.abs(value),
        base: item.value < 0 && !isTotal && !isSubtotal ? runningTotal : base,
        originalValue: item.value,
        fill,
        runningTotal,
        isTotal: isTotal || isSubtotal,
        formattedValue: currency ? formatCurrency(item.value) : item.value.toLocaleString('es-CL'),
      }
    })
  }, [data, startValue, currency])

  // Calcular dominio para el eje Y
  const yDomain = useMemo(() => {
    const allValues = processedData.flatMap(d => [d.base, d.base + d.value])
    const min = Math.min(0, ...allValues)
    const max = Math.max(...allValues)
    const padding = (max - min) * 0.1

    return [min - padding, max + padding]
  }, [processedData])

  // Renderizar barra con forma personalizada
  const renderWaterfallBar = (props: any) => {
    const { x, y, width, height: barHeight, payload } = props

    const isPositive = payload.originalValue >= 0
    const isTotal = payload.isTotal
    const radius = 3

    // Calcular posición Y correcta para valores negativos
    const actualY = isPositive || isTotal ? y : y

    return (
      <g>
        {/* Barra principal */}
        <rect
          x={x}
          y={actualY}
          width={width}
          height={Math.abs(barHeight)}
          fill={payload.fill}
          rx={radius}
          ry={radius}
          className="transition-all duration-300 hover:opacity-80"
        />

        {/* Patrón de rayas para totales */}
        {isTotal && (
          <rect
            x={x}
            y={actualY}
            width={width}
            height={Math.abs(barHeight)}
            fill="url(#total-pattern)"
            rx={radius}
            ry={radius}
            opacity={0.1}
          />
        )}
      </g>
    )
  }

  // Tooltip personalizado
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload[0]) return null

    const data = payload[0].payload

    return (
      <div style={TOOLTIP_STYLE} className="shadow-lg">
        <p className="font-semibold text-foreground text-sm mb-1">{data.name}</p>
        <p
          className="text-sm font-mono"
          style={{ color: data.originalValue >= 0 ? EXECUTIVE_COLORS.success : EXECUTIVE_COLORS.danger }}
        >
          {data.originalValue >= 0 ? '+' : ''}
          {data.formattedValue}
        </p>
        {!data.isTotal && (
          <p className="text-xs text-muted-foreground mt-1">
            Total acumulado: {currency ? formatCurrency(data.runningTotal) : data.runningTotal.toLocaleString('es-CL')}
          </p>
        )}
      </div>
    )
  }

  return (
    <div className={className}>
      {/* Header */}
      {(title || subtitle) && (
        <div className="mb-4">
          {title && <h3 className="text-base font-semibold text-foreground">{title}</h3>}
          {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
      )}

      {/* Chart */}
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={processedData}
            margin={{ top: 20, right: 20, left: 10, bottom: 5 }}
          >
            {/* Patrón para totales */}
            <defs>
              <pattern id="total-pattern" patternUnits="userSpaceOnUse" width="4" height="4">
                <path
                  d="M-1,1 l2,-2 M0,4 l4,-4 M3,5 l2,-2"
                  style={{ stroke: EXECUTIVE_COLORS.bgCard, strokeWidth: 1 }}
                />
              </pattern>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke={EXECUTIVE_COLORS.border} vertical={false} />

            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: EXECUTIVE_COLORS.textSecondary }}
              tickLine={false}
              axisLine={{ stroke: EXECUTIVE_COLORS.border }}
              interval={0}
              angle={-45}
              textAnchor="end"
              height={60}
            />

            <YAxis
              tick={{ fontSize: 11, fill: EXECUTIVE_COLORS.textSecondary }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => currency ? formatCurrency(value, true) : formatCurrency(value, true)}
              domain={yDomain}
              width={70}
            />

            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />

            <ReferenceLine y={0} stroke={EXECUTIVE_COLORS.neutralDark} strokeWidth={1} />

            {/* Barra base (invisible) para posicionamiento */}
            <Bar dataKey="base" stackId="waterfall" fill="transparent" />

            {/* Barra de valor */}
            <Bar
              dataKey="value"
              stackId="waterfall"
              shape={renderWaterfallBar}
              isAnimationActive={true}
              animationDuration={800}
              animationEasing="ease-out"
            >
              {processedData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Leyenda */}
      <div className="flex items-center justify-center gap-6 mt-4 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: EXECUTIVE_COLORS.success }} />
          <span className="text-muted-foreground">Ingresos</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: EXECUTIVE_COLORS.danger }} />
          <span className="text-muted-foreground">Egresos</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: EXECUTIVE_COLORS.primary }} />
          <span className="text-muted-foreground">Total</span>
        </div>
      </div>
    </div>
  )
}

export default WaterfallChart
