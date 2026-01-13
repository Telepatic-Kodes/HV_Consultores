'use client'

import { useMemo } from 'react'
import { EXECUTIVE_COLORS, formatPercent } from './chart-utils'

interface GaugeZone {
  from: number
  to: number
  color: string
  label?: string
}

interface GaugeChartProps {
  value: number
  min?: number
  max?: number
  title?: string
  subtitle?: string
  zones?: GaugeZone[]
  size?: number
  thickness?: number
  showValue?: boolean
  unit?: string
  className?: string
}

export function GaugeChart({
  value,
  min = 0,
  max = 100,
  title,
  subtitle,
  zones,
  size = 200,
  thickness = 20,
  showValue = true,
  unit = '%',
  className = '',
}: GaugeChartProps) {
  const { normalizedValue, rotation, circumference, arcs, valueColor } = useMemo(() => {
    // Normalizar valor (0-1)
    const normalized = Math.max(0, Math.min(1, (value - min) / (max - min)))

    // Radio y circunferencia
    const radius = (size - thickness) / 2
    const circ = Math.PI * radius // Solo media circunferencia (180°)

    // Calcular rotación de la aguja
    const rot = normalized * 180 - 90 // -90 a 90 grados

    // Zonas por defecto si no se proporcionan
    const defaultZones: GaugeZone[] = zones || [
      { from: 0, to: 0.33, color: EXECUTIVE_COLORS.danger, label: 'Bajo' },
      { from: 0.33, to: 0.66, color: EXECUTIVE_COLORS.warning, label: 'Medio' },
      { from: 0.66, to: 1, color: EXECUTIVE_COLORS.success, label: 'Alto' },
    ]

    // Determinar color del valor según zona
    let valColor: string = EXECUTIVE_COLORS.neutral
    for (const zone of defaultZones) {
      const zoneNormFrom = (zone.from - min) / (max - min)
      const zoneNormTo = (zone.to - min) / (max - min)
      if (normalized >= zoneNormFrom && normalized <= zoneNormTo) {
        valColor = zone.color
        break
      }
    }

    // Generar arcos para zonas
    const arcData = defaultZones.map((zone) => {
      const zoneNormFrom = Math.max(0, (zone.from - min) / (max - min))
      const zoneNormTo = Math.min(1, (zone.to - min) / (max - min))
      const startAngle = zoneNormFrom * 180 - 180
      const endAngle = zoneNormTo * 180 - 180

      return {
        ...zone,
        startAngle,
        endAngle,
        path: describeArc(size / 2, size / 2, radius, startAngle, endAngle),
      }
    })

    return {
      normalizedValue: normalized,
      rotation: rot,
      circumference: circ,
      arcs: arcData,
      valueColor: valColor,
    }
  }, [value, min, max, size, thickness, zones])

  // Función para describir un arco SVG
  function describeArc(x: number, y: number, radius: number, startAngle: number, endAngle: number): string {
    const start = polarToCartesian(x, y, radius, endAngle)
    const end = polarToCartesian(x, y, radius, startAngle)
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1'

    return ['M', start.x, start.y, 'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y].join(' ')
  }

  function polarToCartesian(centerX: number, centerY: number, radius: number, angleInDegrees: number) {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0
    return {
      x: centerX + radius * Math.cos(angleInRadians),
      y: centerY + radius * Math.sin(angleInRadians),
    }
  }

  const radius = (size - thickness) / 2
  const center = size / 2

  return (
    <div className={`flex flex-col items-center ${className}`}>
      {/* Título */}
      {title && (
        <div className="text-center mb-2">
          <h4 className="text-sm font-semibold text-foreground">{title}</h4>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
      )}

      {/* Gauge */}
      <div className="relative" style={{ width: size, height: size / 2 + 20 }}>
        <svg width={size} height={size / 2 + 10} viewBox={`0 0 ${size} ${size / 2 + 10}`}>
          {/* Arcos de zona */}
          {arcs.map((arc, index) => (
            <path
              key={index}
              d={arc.path}
              fill="none"
              stroke={arc.color}
              strokeWidth={thickness}
              strokeLinecap="round"
              opacity={0.2}
            />
          ))}

          {/* Arco de valor (progreso) */}
          <path
            d={describeArc(center, center, radius, -180, -180 + normalizedValue * 180)}
            fill="none"
            stroke={valueColor}
            strokeWidth={thickness}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
            style={{
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
            }}
          />

          {/* Centro decorativo */}
          <circle cx={center} cy={center} r={thickness / 2} fill={EXECUTIVE_COLORS.bgCard} stroke={EXECUTIVE_COLORS.border} />

          {/* Aguja */}
          <g
            transform={`rotate(${rotation}, ${center}, ${center})`}
            className="transition-all duration-700 ease-out"
          >
            <line
              x1={center}
              y1={center}
              x2={center}
              y2={center - radius + thickness + 5}
              stroke={EXECUTIVE_COLORS.textPrimary}
              strokeWidth={3}
              strokeLinecap="round"
            />
            <circle cx={center} cy={center} r={6} fill={EXECUTIVE_COLORS.textPrimary} />
          </g>

          {/* Marcas de escala */}
          {[0, 0.25, 0.5, 0.75, 1].map((tick, i) => {
            const angle = tick * 180 - 180
            const outerPoint = polarToCartesian(center, center, radius + thickness / 2 + 2, angle)
            const innerPoint = polarToCartesian(center, center, radius + thickness / 2 - 4, angle)

            return (
              <line
                key={i}
                x1={outerPoint.x}
                y1={outerPoint.y}
                x2={innerPoint.x}
                y2={innerPoint.y}
                stroke={EXECUTIVE_COLORS.neutralLight}
                strokeWidth={1.5}
              />
            )
          })}
        </svg>

        {/* Valor central */}
        {showValue && (
          <div
            className="absolute left-1/2 -translate-x-1/2 text-center"
            style={{ bottom: 0 }}
          >
            <span
              className="text-2xl font-bold font-mono"
              style={{ color: valueColor }}
            >
              {typeof value === 'number' ? Math.round(value) : value}
              {unit && <span className="text-sm ml-0.5">{unit}</span>}
            </span>
          </div>
        )}
      </div>

      {/* Etiquetas de zona */}
      <div className="flex justify-between w-full px-4 mt-2 text-[10px] text-muted-foreground">
        <span>{min}{unit}</span>
        <span>{max}{unit}</span>
      </div>
    </div>
  )
}

// Variante mini para uso en cards
interface MiniGaugeProps {
  value: number
  max?: number
  size?: number
  color?: string
  className?: string
}

export function MiniGauge({ value, max = 100, size = 48, color, className = '' }: MiniGaugeProps) {
  const percent = Math.min((value / max) * 100, 100)
  const autoColor = color || (percent >= 70 ? EXECUTIVE_COLORS.success : percent >= 40 ? EXECUTIVE_COLORS.warning : EXECUTIVE_COLORS.danger)

  const radius = (size - 8) / 2
  const circumference = Math.PI * radius
  const strokeDashoffset = circumference - (percent / 100) * circumference

  return (
    <div className={`relative ${className}`} style={{ width: size, height: size / 2 + 4 }}>
      <svg width={size} height={size / 2 + 4} viewBox={`0 0 ${size} ${size / 2 + 4}`}>
        {/* Background arc */}
        <path
          d={`M 4 ${size / 2} A ${radius} ${radius} 0 0 1 ${size - 4} ${size / 2}`}
          fill="none"
          stroke={EXECUTIVE_COLORS.border}
          strokeWidth={4}
          strokeLinecap="round"
        />
        {/* Value arc */}
        <path
          d={`M 4 ${size / 2} A ${radius} ${radius} 0 0 1 ${size - 4} ${size / 2}`}
          fill="none"
          stroke={autoColor}
          strokeWidth={4}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-500"
        />
      </svg>
      {/* Value */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2">
        <span className="text-xs font-bold font-mono" style={{ color: autoColor }}>
          {Math.round(value)}%
        </span>
      </div>
    </div>
  )
}

export default GaugeChart
