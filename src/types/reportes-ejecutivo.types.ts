// Tipos para Reportes Ejecutivos Estilo McKinsey/Deloitte

// ============================================
// COLORES EJECUTIVOS
// ============================================
export const EXECUTIVE_COLORS = {
  primary: '#0f3460',      // Navy Blue
  secondary: '#1a5091',    // Consulting Blue
  accent: '#d4a418',       // Executive Gold
  success: '#059669',      // Green
  warning: '#d97706',      // Amber
  danger: '#dc2626',       // Red
  neutral: '#6b7280',      // Gray
  light: '#f3f4f6',        // Light Gray
  dark: '#1f2937',         // Dark Gray
} as const

// ============================================
// KPIs EJECUTIVOS
// ============================================
export interface ExecutiveKPI {
  id: string
  title: string
  value: number
  formattedValue: string
  previousValue?: number
  change?: number
  changePercent?: number
  trend: 'up' | 'down' | 'stable'
  status: 'positive' | 'negative' | 'neutral' | 'warning'
  sparklineData?: number[]
  target?: number
  targetPercent?: number
  unit?: string
  icon?: string
  description?: string
}

export interface KPIComparison {
  current: {
    value: number
    label: string
    period: string
  }
  previous: {
    value: number
    label: string
    period: string
  }
  change: number
  changePercent: number
  trend: 'up' | 'down' | 'stable'
}

// ============================================
// GRÁFICOS EJECUTIVOS
// ============================================

// Waterfall Chart
export interface WaterfallDataPoint {
  name: string
  value: number
  type: 'increase' | 'decrease' | 'total' | 'subtotal'
  color?: string
  formattedValue?: string
}

export interface WaterfallChartData {
  title: string
  subtitle?: string
  data: WaterfallDataPoint[]
  startValue?: number
  currency?: string
}

// Bullet Chart
export interface BulletChartData {
  title: string
  subtitle?: string
  actual: number
  target: number
  ranges: [number, number, number] // [poor, satisfactory, good]
  unit?: string
  formattedActual?: string
  formattedTarget?: string
}

// Gauge Chart
export interface GaugeChartData {
  title: string
  value: number
  min: number
  max: number
  zones?: {
    from: number
    to: number
    color: string
    label?: string
  }[]
  unit?: string
  formattedValue?: string
}

// Sparkline
export interface SparklineData {
  values: number[]
  color?: string
  showArea?: boolean
  showDots?: boolean
  height?: number
  width?: number
}

// Treemap
export interface TreemapNode {
  name: string
  value: number
  children?: TreemapNode[]
  color?: string
  formattedValue?: string
  percent?: number
}

// Category Breakdown (for pie/treemap charts)
export interface CategoryBreakdown {
  category: string
  value: number
  count: number
  percentage: number
  color?: string
}

// Time Series
export interface TimeSeriesPoint {
  date: string
  value: number
  label?: string
  comparativeValue?: number
  previousValue?: number
}

// ============================================
// INSIGHTS Y RECOMENDACIONES
// ============================================
export interface Insight {
  id: string
  type: 'positive' | 'negative' | 'neutral' | 'alert'
  category: 'trend' | 'anomaly' | 'comparison' | 'recommendation' | 'milestone'
  title: string
  description: string
  metric?: {
    value: number
    change: number
    unit: string
    formattedValue?: string
  }
  priority: 1 | 2 | 3
  icon?: string
  actionable?: boolean
  action?: string
}

export interface Recommendation {
  id: string
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
  category: string
  impact?: string
  effort?: string
  deadline?: string
}

export interface Anomaly {
  type: 'spike' | 'drop' | 'trend_change' | 'outlier'
  date: string
  value: number
  expectedValue: number
  deviation: number
  severity: 'high' | 'medium' | 'low'
  description: string
}

// ============================================
// DASHBOARD EJECUTIVO
// ============================================
export interface ExecutiveDashboardData {
  periodo: string
  periodoAnterior?: string
  clienteId?: string
  clienteNombre?: string
  generatedAt?: string

  // KPIs principales
  kpis: ExecutiveKPI[]

  // Gráficos
  waterfall: WaterfallDataPoint[]
  categoryBreakdown: CategoryBreakdown[]
  evolution: TimeSeriesPoint[]

  // Insights
  insights: Insight[]
  recommendations?: Recommendation[]

  // Tablas resumidas
  tables?: {
    topClientes?: ClienteRanking[]
    documentFunnel?: FunnelStep[]
    f29Status?: F29StatusRow[]
  }
}

export interface ClienteRanking {
  position: number
  previousPosition?: number
  movement: 'up' | 'down' | 'stable' | 'new'
  clienteId: string
  nombre: string
  rut: string
  documentos: number
  monto: number
  formattedMonto: string
}

export interface FunnelStep {
  step: string
  count: number
  percent: number
  dropoff?: number
  color?: string
}

export interface F29StatusRow {
  clienteId: string
  nombre: string
  rut: string
  periodo: string
  status: 'pendiente' | 'borrador' | 'calculado' | 'validado' | 'aprobado' | 'enviado'
  totalAPagar: number
  formattedTotal: string
  alertas: number
}

// ============================================
// INFORME PDF EJECUTIVO
// ============================================
export interface InformeEjecutivoData {
  // Portada
  portada: {
    titulo: string
    subtitulo?: string
    cliente: {
      nombre: string
      rut: string
      giro?: string
    }
    periodo: string
    fechaGeneracion: string
    confidencial?: boolean
  }

  // Resumen ejecutivo
  resumen: {
    kpis: ExecutiveKPI[]
    highlights: string[]
    comparativa: {
      label: string
      actual: number
      anterior: number
      change: number
    }[]
    statusGeneral: 'excelente' | 'bueno' | 'regular' | 'critico'
  }

  // Análisis detallado
  analisis: {
    titulo: string
    descripcion?: string
    tipo: 'waterfall' | 'barchart' | 'linechart' | 'table' | 'text'
    datos: any
  }[]

  // Insights y recomendaciones
  insights: Insight[]
  recommendations: Recommendation[]

  // Anexos
  anexos: {
    titulo: string
    tipo: 'documentos' | 'f29' | 'transacciones'
    datos: any[]
  }[]

  // Footer
  footer: {
    empresa: string
    contacto?: string
    disclaimer?: string
  }
}

// ============================================
// PRESENTACIÓN BOARD
// ============================================
export type SlideType =
  | 'title'
  | 'kpi'
  | 'chart'
  | 'comparison'
  | 'insight'
  | 'table'
  | 'summary'
  | 'agenda'
  | 'section'

export interface Slide {
  id: string
  type: SlideType
  title?: string
  subtitle?: string
  content: any
  notes?: string
  transition?: 'fade' | 'slide' | 'zoom'
  backgroundColor?: string
}

export interface PresentacionData {
  metadata: {
    titulo: string
    cliente: string
    periodo: string
    autor?: string
    fechaCreacion: string
    version?: string
  }
  tema: {
    primaryColor: string
    secondaryColor: string
    accentColor: string
    fontFamily: string
    logoUrl?: string
  }
  slides: Slide[]
  totalDuration?: number // minutos estimados
}

// ============================================
// TABLAS PROFESIONALES
// ============================================
export interface HeatmapCell {
  value: number
  formattedValue: string
  intensity: number // 0-1
  color?: string
}

export interface HeatmapTableData {
  title: string
  rows: string[]
  columns: string[]
  data: HeatmapCell[][]
  showTotals?: boolean
}

export interface ComparisonTableRow {
  label: string
  current: number
  previous: number
  change: number
  changePercent: number
  formattedCurrent: string
  formattedPrevious: string
  status: 'positive' | 'negative' | 'neutral'
}

export interface RankingTableRow {
  position: number
  previousPosition?: number
  label: string
  value: number
  formattedValue: string
  sparkline?: number[]
  badge?: string
}

// ============================================
// UTILIDADES
// ============================================
export type PeriodoTipo = 'mensual' | 'trimestral' | 'semestral' | 'anual'

export interface PeriodoRange {
  inicio: string
  fin: string
  tipo: PeriodoTipo
  label: string
}

export interface FormatOptions {
  currency?: boolean
  decimals?: number
  compact?: boolean
  sign?: boolean
  locale?: string
}

// Función helper para formatear valores
export function formatValue(value: number, options: FormatOptions = {}): string {
  const { currency = false, decimals = 0, compact = false, sign = false, locale = 'es-CL' } = options

  let formatted: string

  if (compact && Math.abs(value) >= 1000000) {
    formatted = (value / 1000000).toFixed(1) + 'M'
  } else if (compact && Math.abs(value) >= 1000) {
    formatted = (value / 1000).toFixed(1) + 'K'
  } else {
    formatted = value.toLocaleString(locale, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })
  }

  if (currency) {
    formatted = '$' + formatted
  }

  if (sign && value > 0) {
    formatted = '+' + formatted
  }

  return formatted
}

// Función helper para calcular cambio porcentual
export function calculateChange(current: number, previous: number): { change: number; percent: number; trend: 'up' | 'down' | 'stable' } {
  const change = current - previous
  const percent = previous !== 0 ? ((change / Math.abs(previous)) * 100) : 0
  const trend = change > 0 ? 'up' : change < 0 ? 'down' : 'stable'

  return { change, percent: Math.round(percent * 10) / 10, trend }
}

// Función helper para determinar status basado en cambio
export function getStatusFromChange(change: number, invertPositive = false): 'positive' | 'negative' | 'neutral' {
  if (change === 0) return 'neutral'
  const isPositive = invertPositive ? change < 0 : change > 0
  return isPositive ? 'positive' : 'negative'
}
