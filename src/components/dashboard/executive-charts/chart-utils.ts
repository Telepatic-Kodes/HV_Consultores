// Utilidades y constantes para gráficos ejecutivos estilo McKinsey/Deloitte

export const EXECUTIVE_COLORS = {
  // Colores primarios
  primary: '#0f3460',      // Navy Blue - Principal
  secondary: '#1a5091',    // Consulting Blue
  accent: '#d4a418',       // Executive Gold

  // Estados
  success: '#059669',      // Green
  warning: '#d97706',      // Amber
  danger: '#dc2626',       // Red

  // Neutrales
  neutral: '#6b7280',      // Gray 500
  neutralLight: '#9ca3af', // Gray 400
  neutralDark: '#4b5563',  // Gray 600

  // Fondos
  bgLight: '#f9fafb',      // Gray 50
  bgMuted: '#f3f4f6',      // Gray 100
  bgCard: '#ffffff',

  // Texto
  textPrimary: '#1f2937',  // Gray 800
  textSecondary: '#6b7280', // Gray 500
  textMuted: '#9ca3af',    // Gray 400

  // Bordes
  border: '#e5e7eb',       // Gray 200
  borderLight: '#f3f4f6',  // Gray 100
} as const

// Paleta para gráficos de múltiples series
export const CHART_PALETTE = [
  '#0f3460', // Navy
  '#1a5091', // Blue
  '#059669', // Green
  '#d97706', // Amber
  '#6d28d9', // Violet
  '#0891b2', // Cyan
  '#dc2626', // Red
  '#d4a418', // Gold
] as const

// Gradientes para gráficos
export const GRADIENTS = {
  primary: {
    start: 'rgba(15, 52, 96, 0.8)',
    end: 'rgba(15, 52, 96, 0.1)',
  },
  success: {
    start: 'rgba(5, 150, 105, 0.8)',
    end: 'rgba(5, 150, 105, 0.1)',
  },
  warning: {
    start: 'rgba(217, 119, 6, 0.8)',
    end: 'rgba(217, 119, 6, 0.1)',
  },
  danger: {
    start: 'rgba(220, 38, 38, 0.8)',
    end: 'rgba(220, 38, 38, 0.1)',
  },
} as const

// Configuración común para tooltips
export const TOOLTIP_STYLE = {
  backgroundColor: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '8px',
  fontSize: '12px',
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  padding: '8px 12px',
} as const

// Configuración para ejes
export const AXIS_STYLE = {
  fontSize: 11,
  fontFamily: 'var(--font-mono)',
  fill: EXECUTIVE_COLORS.textSecondary,
} as const

// Formatear valores monetarios (pesos chilenos)
export function formatCurrency(value: number, compact = false): string {
  if (compact) {
    if (Math.abs(value) >= 1000000000) {
      return '$' + (value / 1000000000).toFixed(1) + 'MM'
    }
    if (Math.abs(value) >= 1000000) {
      return '$' + (value / 1000000).toFixed(1) + 'M'
    }
    if (Math.abs(value) >= 1000) {
      return '$' + (value / 1000).toFixed(0) + 'K'
    }
  }
  return '$' + value.toLocaleString('es-CL')
}

// Formatear porcentajes
export function formatPercent(value: number, decimals = 1): string {
  return value.toFixed(decimals) + '%'
}

// Formatear números
export function formatNumber(value: number, compact = false): string {
  if (compact) {
    if (Math.abs(value) >= 1000000) {
      return (value / 1000000).toFixed(1) + 'M'
    }
    if (Math.abs(value) >= 1000) {
      return (value / 1000).toFixed(1) + 'K'
    }
  }
  return value.toLocaleString('es-CL')
}

// Obtener color según el status
export function getStatusColor(status: 'positive' | 'negative' | 'neutral' | 'warning'): string {
  switch (status) {
    case 'positive':
      return EXECUTIVE_COLORS.success
    case 'negative':
      return EXECUTIVE_COLORS.danger
    case 'warning':
      return EXECUTIVE_COLORS.warning
    default:
      return EXECUTIVE_COLORS.neutral
  }
}

// Obtener color para tendencia
export function getTrendColor(trend: 'up' | 'down' | 'stable', invertColors = false): string {
  if (trend === 'stable') return EXECUTIVE_COLORS.neutral

  const isPositive = invertColors ? trend === 'down' : trend === 'up'
  return isPositive ? EXECUTIVE_COLORS.success : EXECUTIVE_COLORS.danger
}

// Interpolar entre dos colores
export function interpolateColor(color1: string, color2: string, factor: number): string {
  const hex = (x: string) => parseInt(x, 16)
  const r1 = hex(color1.slice(1, 3))
  const g1 = hex(color1.slice(3, 5))
  const b1 = hex(color1.slice(5, 7))
  const r2 = hex(color2.slice(1, 3))
  const g2 = hex(color2.slice(3, 5))
  const b2 = hex(color2.slice(5, 7))

  const r = Math.round(r1 + (r2 - r1) * factor)
  const g = Math.round(g1 + (g2 - g1) * factor)
  const b = Math.round(b1 + (b2 - b1) * factor)

  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

// Generar escala de colores para heatmap
export function generateHeatmapScale(
  min: number,
  max: number,
  value: number,
  colorScale: 'blue' | 'green' | 'red' | 'diverging' = 'blue'
): string {
  const normalized = Math.max(0, Math.min(1, (value - min) / (max - min)))

  switch (colorScale) {
    case 'blue':
      return interpolateColor('#f0f9ff', '#0f3460', normalized)
    case 'green':
      return interpolateColor('#f0fdf4', '#059669', normalized)
    case 'red':
      return interpolateColor('#fef2f2', '#dc2626', normalized)
    case 'diverging':
      if (normalized < 0.5) {
        return interpolateColor('#dc2626', '#f3f4f6', normalized * 2)
      }
      return interpolateColor('#f3f4f6', '#059669', (normalized - 0.5) * 2)
    default:
      return interpolateColor('#f0f9ff', '#0f3460', normalized)
  }
}

// Calcular dominio para ejes (con padding)
export function calculateDomain(values: number[], padding = 0.1): [number, number] {
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min
  const paddingValue = range * padding

  return [
    min >= 0 ? 0 : min - paddingValue,
    max + paddingValue,
  ]
}

// Calcular ticks óptimos para un eje
export function calculateTicks(min: number, max: number, targetCount = 5): number[] {
  const range = max - min
  const roughStep = range / (targetCount - 1)

  // Redondear el step a un número "bonito"
  const magnitude = Math.pow(10, Math.floor(Math.log10(roughStep)))
  const normalized = roughStep / magnitude

  let step: number
  if (normalized < 1.5) step = magnitude
  else if (normalized < 3) step = 2 * magnitude
  else if (normalized < 7) step = 5 * magnitude
  else step = 10 * magnitude

  const start = Math.floor(min / step) * step
  const ticks: number[] = []

  for (let i = start; i <= max; i += step) {
    ticks.push(Math.round(i * 1000) / 1000)
  }

  return ticks
}

// Generar ID único para gradientes SVG
export function generateGradientId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`
}

// Calcular posición de etiqueta
export function calculateLabelPosition(
  x: number,
  y: number,
  width: number,
  height: number,
  value: number,
  isNegative: boolean
): { x: number; y: number; anchor: 'start' | 'middle' | 'end' } {
  return {
    x: x + width / 2,
    y: isNegative ? y + height + 14 : y - 6,
    anchor: 'middle',
  }
}

// Animación de entrada
export const ANIMATION_CONFIG = {
  duration: 800,
  easing: 'ease-out',
  delay: 100,
} as const
