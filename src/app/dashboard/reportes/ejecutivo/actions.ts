'use server'
// TODO: Phase 2 - Implement executive dashboard analytics in Convex
// Tables needed: documentos, f29_calculos, bot_jobs, chat_sesiones, clientes

import type {
  ExecutiveDashboardData,
  ExecutiveKPI,
  WaterfallDataPoint,
  CategoryBreakdown,
  TimeSeriesPoint,
  Insight,
} from '@/types/reportes-ejecutivo.types'
import { getServerProfileId } from '@/lib/auth-server'

// ============================================
// DASHBOARD EJECUTIVO - SERVER ACTIONS
// ============================================

// Obtener datos completos del dashboard ejecutivo
export async function getExecutiveDashboardData(
  clienteId?: string,
  periodo?: string
): Promise<ExecutiveDashboardData> {
  const [kpis, waterfall, categoryBreakdown, evolution, insights] = await Promise.all([
    getExecutiveKPIs(clienteId, periodo),
    getWaterfallData(clienteId, periodo),
    getCategoryBreakdown(clienteId, periodo),
    getEvolutionData(clienteId),
    generateInsights(clienteId, periodo),
  ])

  return {
    periodo: periodo || getCurrentPeriodo(),
    kpis,
    waterfall,
    categoryBreakdown,
    evolution,
    insights,
  }
}

// Obtener periodo actual en formato YYYY-MM
function getCurrentPeriodo(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

// ============================================
// KPIs EJECUTIVOS
// ============================================

export async function getExecutiveKPIs(
  clienteId?: string,
  periodo?: string
): Promise<ExecutiveKPI[]> {
  // TODO: implement with Convex
  const emptySparkline = new Array(12).fill(0)

  return [
    {
      id: 'documentos-procesados',
      title: 'Documentos Procesados',
      value: 0,
      formattedValue: '0',
      change: 0,
      changePercent: 0,
      trend: 'stable' as const,
      status: 'neutral' as const,
      sparklineData: emptySparkline,
      icon: '📄',
      description: 'Total de documentos este periodo',
    },
    {
      id: 'tasa-clasificacion',
      title: 'Tasa Clasificacion',
      value: 0,
      formattedValue: '0%',
      change: 0,
      changePercent: 0,
      trend: 'stable' as const,
      status: 'neutral' as const,
      sparklineData: emptySparkline,
      target: 95,
      icon: '🎯',
      description: 'Documentos clasificados automaticamente',
    },
    {
      id: 'f29-generados',
      title: 'F29 Generados',
      value: 0,
      formattedValue: '0',
      change: 0,
      changePercent: 0,
      trend: 'stable' as const,
      status: 'neutral' as const,
      sparklineData: emptySparkline,
      icon: '📋',
      description: 'Formularios tributarios',
    },
    {
      id: 'horas-ahorradas',
      title: 'Horas Ahorradas',
      value: 0,
      formattedValue: '0h',
      change: 0,
      changePercent: 0,
      trend: 'stable' as const,
      status: 'neutral' as const,
      sparklineData: emptySparkline,
      icon: '⏱️',
      description: 'Tiempo estimado de ahorro',
    },
    {
      id: 'tasa-exito-bots',
      title: 'Exito Automatizacion',
      value: 100,
      formattedValue: '100.0%',
      trend: 'stable' as const,
      status: 'neutral' as const,
      sparklineData: emptySparkline,
      target: 95,
      icon: '🤖',
      description: 'Jobs de bots completados',
    },
    {
      id: 'sesiones-chat',
      title: 'Sesiones Chat IA',
      value: 0,
      formattedValue: '0',
      change: 0,
      changePercent: 0,
      trend: 'stable' as const,
      status: 'neutral' as const,
      sparklineData: emptySparkline,
      icon: '💬',
      description: 'Consultas de asistencia',
    },
  ]
}

// ============================================
// WATERFALL CHART - FLUJO DE CAJA
// ============================================

export async function getWaterfallData(
  clienteId?: string,
  periodo?: string
): Promise<WaterfallDataPoint[]> {
  // TODO: returns empty waterfall until Convex module is implemented
  return [
    { name: 'Inicio Periodo', value: 0, type: 'total' },
    { name: 'Ingresos Ventas', value: 0, type: 'increase' },
    { name: 'Gastos Compras', value: 0, type: 'decrease' },
    { name: 'IVA Debito', value: 0, type: 'increase' },
    { name: 'IVA Credito', value: 0, type: 'decrease' },
    { name: 'Flujo Neto', value: 0, type: 'total' },
  ]
}

// ============================================
// CATEGORY BREAKDOWN - DESGLOSE POR CATEGORIA
// ============================================

export async function getCategoryBreakdown(
  clienteId?: string,
  periodo?: string
): Promise<CategoryBreakdown[]> {
  // TODO: returns empty data until Convex module is implemented
  return []
}

// ============================================
// EVOLUCION TEMPORAL
// ============================================

export async function getEvolutionData(clienteId?: string): Promise<TimeSeriesPoint[]> {
  // TODO: returns empty data until Convex module is implemented
  return []
}

// ============================================
// INSIGHTS AUTOMATICOS
// ============================================

export async function generateInsights(
  clienteId?: string,
  periodo?: string
): Promise<Insight[]> {
  // TODO: returns empty data until Convex module is implemented
  return []
}

// ============================================
// EXPORTAR DASHBOARD A PDF
// ============================================

export async function getExecutiveDashboardForPDF(
  clienteId?: string,
  periodo?: string
) {
  const data = await getExecutiveDashboardData(clienteId, periodo)

  return {
    ...data,
    cliente: null,
    generadoEn: new Date().toISOString(),
  }
}
