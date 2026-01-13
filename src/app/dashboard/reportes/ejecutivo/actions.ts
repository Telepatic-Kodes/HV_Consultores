'use server'

import { createClient } from '@/lib/supabase-server'
import type {
  ExecutiveDashboardData,
  ExecutiveKPI,
  WaterfallDataPoint,
  CategoryBreakdown,
  TimeSeriesPoint,
  Insight,
} from '@/types/reportes-ejecutivo.types'

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

// Obtener período actual en formato YYYY-MM
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
  const supabase = createClient()

  const ahora = new Date()
  const mesActual = periodo || getCurrentPeriodo()
  const [year, month] = mesActual.split('-').map(Number)

  const inicioMes = new Date(year, month - 1, 1).toISOString()
  const finMes = new Date(year, month, 0, 23, 59, 59).toISOString()
  const inicioMesAnterior = new Date(year, month - 2, 1).toISOString()
  const finMesAnterior = new Date(year, month - 1, 0, 23, 59, 59).toISOString()

  // Base query builder
  const buildQuery = (table: string, filters: Record<string, any> = {}) => {
    let query = supabase.from(table).select('*', { count: 'exact', head: true })
    Object.entries(filters).forEach(([key, value]) => {
      query = query.eq(key, value)
    })
    if (clienteId) query = query.eq('cliente_id', clienteId)
    return query
  }

  // Consultas paralelas para el mes actual
  const [
    { count: docsActual },
    { count: docsMesAnterior },
    { count: docsClasificadosActual },
    { count: docsClasificadosMesAnterior },
    { count: f29Actual },
    { count: f29MesAnterior },
    { count: botsExitososActual },
    { count: botsExitososMesAnterior },
    { count: botsFallidosActual },
    { count: chatSesionesActual },
    { count: chatSesionesMesAnterior },
  ] = await Promise.all([
    // Documentos mes actual
    supabase
      .from('documentos')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', inicioMes)
      .lte('created_at', finMes)
      .then(r => r),
    // Documentos mes anterior
    supabase
      .from('documentos')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', inicioMesAnterior)
      .lte('created_at', finMesAnterior)
      .then(r => r),
    // Docs clasificados mes actual
    supabase
      .from('documentos')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'clasificado')
      .gte('created_at', inicioMes)
      .lte('created_at', finMes)
      .then(r => r),
    // Docs clasificados mes anterior
    supabase
      .from('documentos')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'clasificado')
      .gte('created_at', inicioMesAnterior)
      .lte('created_at', finMesAnterior)
      .then(r => r),
    // F29 mes actual
    supabase
      .from('f29_calculos')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', inicioMes)
      .lte('created_at', finMes)
      .then(r => r),
    // F29 mes anterior
    supabase
      .from('f29_calculos')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', inicioMesAnterior)
      .lte('created_at', finMesAnterior)
      .then(r => r),
    // Bots exitosos actual
    supabase
      .from('bot_jobs')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completado')
      .gte('created_at', inicioMes)
      .lte('created_at', finMes)
      .then(r => r),
    // Bots exitosos mes anterior
    supabase
      .from('bot_jobs')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completado')
      .gte('created_at', inicioMesAnterior)
      .lte('created_at', finMesAnterior)
      .then(r => r),
    // Bots fallidos actual
    supabase
      .from('bot_jobs')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'fallido')
      .gte('created_at', inicioMes)
      .lte('created_at', finMes)
      .then(r => r),
    // Chat sesiones actual
    supabase
      .from('chat_sesiones')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', inicioMes)
      .lte('created_at', finMes)
      .then(r => r),
    // Chat sesiones mes anterior
    supabase
      .from('chat_sesiones')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', inicioMesAnterior)
      .lte('created_at', finMesAnterior)
      .then(r => r),
  ])

  // Obtener sparkline data (últimos 12 meses)
  const sparklineData = await getSparklineData(clienteId)

  // Calcular métricas
  const docs = docsActual || 0
  const docsAnt = docsMesAnterior || 0
  const docsChange = docsAnt > 0 ? ((docs - docsAnt) / docsAnt) * 100 : 0

  const clasificados = docsClasificadosActual || 0
  const clasificadosAnt = docsClasificadosMesAnterior || 0
  const clasificadosChange = clasificadosAnt > 0 ? ((clasificados - clasificadosAnt) / clasificadosAnt) * 100 : 0

  const f29 = f29Actual || 0
  const f29Ant = f29MesAnterior || 0
  const f29Change = f29Ant > 0 ? ((f29 - f29Ant) / f29Ant) * 100 : 0

  const botsExitosos = botsExitososActual || 0
  const botsExitososAnt = botsExitososMesAnterior || 0
  const botsFallidos = botsFallidosActual || 0
  const tasaExito = (botsExitosos + botsFallidos) > 0
    ? (botsExitosos / (botsExitosos + botsFallidos)) * 100
    : 100

  const chatSesiones = chatSesionesActual || 0
  const chatSesionesAnt = chatSesionesMesAnterior || 0
  const chatChange = chatSesionesAnt > 0 ? ((chatSesiones - chatSesionesAnt) / chatSesionesAnt) * 100 : 0

  // Horas ahorradas (estimación: 5 min por doc, 15 min por F29)
  const horasAhorradas = Math.round((docs * 5 + f29 * 15) / 60)
  const horasAhorradasAnt = Math.round((docsAnt * 5 + f29Ant * 15) / 60)
  const horasChange = horasAhorradasAnt > 0 ? ((horasAhorradas - horasAhorradasAnt) / horasAhorradasAnt) * 100 : 0

  const getTrend = (change: number): 'up' | 'down' | 'stable' => {
    if (change > 1) return 'up'
    if (change < -1) return 'down'
    return 'stable'
  }

  const getStatus = (change: number, invertido = false): 'positive' | 'negative' | 'neutral' | 'warning' => {
    if (Math.abs(change) < 1) return 'neutral'
    if (invertido) return change < 0 ? 'positive' : 'negative'
    return change > 0 ? 'positive' : 'negative'
  }

  return [
    {
      id: 'documentos-procesados',
      title: 'Documentos Procesados',
      value: docs,
      formattedValue: docs.toLocaleString('es-CL'),
      change: docs - docsAnt,
      changePercent: docsChange,
      trend: getTrend(docsChange),
      status: getStatus(docsChange),
      sparklineData: sparklineData.documentos,
      icon: '📄',
      description: 'Total de documentos este período',
    },
    {
      id: 'tasa-clasificacion',
      title: 'Tasa Clasificación',
      value: docs > 0 ? (clasificados / docs) * 100 : 0,
      formattedValue: docs > 0 ? `${((clasificados / docs) * 100).toFixed(1)}%` : '0%',
      change: clasificados - clasificadosAnt,
      changePercent: clasificadosChange,
      trend: getTrend(clasificadosChange),
      status: getStatus(clasificadosChange),
      sparklineData: sparklineData.clasificacion,
      target: 95,
      icon: '🎯',
      description: 'Documentos clasificados automáticamente',
    },
    {
      id: 'f29-generados',
      title: 'F29 Generados',
      value: f29,
      formattedValue: f29.toLocaleString('es-CL'),
      change: f29 - f29Ant,
      changePercent: f29Change,
      trend: getTrend(f29Change),
      status: getStatus(f29Change),
      sparklineData: sparklineData.f29,
      icon: '📋',
      description: 'Formularios tributarios',
    },
    {
      id: 'horas-ahorradas',
      title: 'Horas Ahorradas',
      value: horasAhorradas,
      formattedValue: `${horasAhorradas}h`,
      change: horasAhorradas - horasAhorradasAnt,
      changePercent: horasChange,
      trend: getTrend(horasChange),
      status: getStatus(horasChange),
      sparklineData: sparklineData.horas,
      icon: '⏱️',
      description: 'Tiempo estimado de ahorro',
    },
    {
      id: 'tasa-exito-bots',
      title: 'Éxito Automatización',
      value: tasaExito,
      formattedValue: `${tasaExito.toFixed(1)}%`,
      trend: tasaExito >= 95 ? 'up' : tasaExito >= 85 ? 'stable' : 'down',
      status: tasaExito >= 95 ? 'positive' : tasaExito >= 85 ? 'neutral' : 'negative',
      sparklineData: sparklineData.bots,
      target: 95,
      icon: '🤖',
      description: 'Jobs de bots completados',
    },
    {
      id: 'sesiones-chat',
      title: 'Sesiones Chat IA',
      value: chatSesiones,
      formattedValue: chatSesiones.toLocaleString('es-CL'),
      change: chatSesiones - chatSesionesAnt,
      changePercent: chatChange,
      trend: getTrend(chatChange),
      status: getStatus(chatChange),
      sparklineData: sparklineData.chat,
      icon: '💬',
      description: 'Consultas de asistencia',
    },
  ]
}

// Obtener datos para sparklines (últimos 12 meses)
async function getSparklineData(clienteId?: string): Promise<Record<string, number[]>> {
  const supabase = createClient()
  const data: Record<string, number[]> = {
    documentos: [],
    clasificacion: [],
    f29: [],
    horas: [],
    bots: [],
    chat: [],
  }

  for (let i = 11; i >= 0; i--) {
    const fecha = new Date()
    fecha.setMonth(fecha.getMonth() - i)
    const inicioMes = new Date(fecha.getFullYear(), fecha.getMonth(), 1).toISOString()
    const finMes = new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0, 23, 59, 59).toISOString()

    const [
      { count: docs },
      { count: clasificados },
      { count: f29 },
      { count: botsOk },
      { count: botsFail },
      { count: chat },
    ] = await Promise.all([
      supabase.from('documentos').select('*', { count: 'exact', head: true })
        .gte('created_at', inicioMes).lte('created_at', finMes),
      supabase.from('documentos').select('*', { count: 'exact', head: true })
        .eq('status', 'clasificado').gte('created_at', inicioMes).lte('created_at', finMes),
      supabase.from('f29_calculos').select('*', { count: 'exact', head: true })
        .gte('created_at', inicioMes).lte('created_at', finMes),
      supabase.from('bot_jobs').select('*', { count: 'exact', head: true })
        .eq('status', 'completado').gte('created_at', inicioMes).lte('created_at', finMes),
      supabase.from('bot_jobs').select('*', { count: 'exact', head: true })
        .eq('status', 'fallido').gte('created_at', inicioMes).lte('created_at', finMes),
      supabase.from('chat_sesiones').select('*', { count: 'exact', head: true })
        .gte('created_at', inicioMes).lte('created_at', finMes),
    ])

    const docsCount = docs || 0
    const clasifCount = clasificados || 0
    const f29Count = f29 || 0
    const botsOkCount = botsOk || 0
    const botsFailCount = botsFail || 0
    const chatCount = chat || 0

    data.documentos.push(docsCount)
    data.clasificacion.push(docsCount > 0 ? (clasifCount / docsCount) * 100 : 0)
    data.f29.push(f29Count)
    data.horas.push(Math.round((docsCount * 5 + f29Count * 15) / 60))
    data.bots.push((botsOkCount + botsFailCount) > 0 ? (botsOkCount / (botsOkCount + botsFailCount)) * 100 : 100)
    data.chat.push(chatCount)
  }

  return data
}

// ============================================
// WATERFALL CHART - FLUJO DE CAJA
// ============================================

export async function getWaterfallData(
  clienteId?: string,
  periodo?: string
): Promise<WaterfallDataPoint[]> {
  const supabase = createClient()

  const mesActual = periodo || getCurrentPeriodo()
  const [year, month] = mesActual.split('-').map(Number)
  const inicioMes = new Date(year, month - 1, 1).toISOString()
  const finMes = new Date(year, month, 0, 23, 59, 59).toISOString()

  // Obtener documentos del período
  let query = supabase
    .from('documentos')
    .select('tipo_documento, es_compra, monto_neto, monto_iva, monto_total')
    .gte('created_at', inicioMes)
    .lte('created_at', finMes)

  if (clienteId) {
    query = query.eq('cliente_id', clienteId)
  }

  const { data: documentos } = await query

  if (!documentos || documentos.length === 0) {
    return [
      { name: 'Inicio', value: 0, type: 'total' },
      { name: 'Ventas', value: 0, type: 'increase' },
      { name: 'Compras', value: 0, type: 'decrease' },
      { name: 'IVA Débito', value: 0, type: 'increase' },
      { name: 'IVA Crédito', value: 0, type: 'decrease' },
      { name: 'Total', value: 0, type: 'total' },
    ]
  }

  // Calcular totales
  const ventas = documentos.filter(d => !d.es_compra)
  const compras = documentos.filter(d => d.es_compra)

  const totalVentas = ventas.reduce((sum, d) => sum + Number(d.monto_neto || 0), 0)
  const totalCompras = compras.reduce((sum, d) => sum + Number(d.monto_neto || 0), 0)
  const ivaDebito = ventas.reduce((sum, d) => sum + Number(d.monto_iva || 0), 0)
  const ivaCredito = compras.reduce((sum, d) => sum + Number(d.monto_iva || 0), 0)

  const flujoNeto = totalVentas - totalCompras + ivaDebito - ivaCredito

  return [
    { name: 'Inicio Período', value: 0, type: 'total' },
    { name: 'Ingresos Ventas', value: totalVentas, type: 'increase' },
    { name: 'Gastos Compras', value: -totalCompras, type: 'decrease' },
    { name: 'IVA Débito', value: ivaDebito, type: 'increase' },
    { name: 'IVA Crédito', value: -ivaCredito, type: 'decrease' },
    { name: 'Flujo Neto', value: flujoNeto, type: 'total' },
  ]
}

// ============================================
// CATEGORY BREAKDOWN - DESGLOSE POR CATEGORÍA
// ============================================

export async function getCategoryBreakdown(
  clienteId?: string,
  periodo?: string
): Promise<CategoryBreakdown[]> {
  const supabase = createClient()

  const mesActual = periodo || getCurrentPeriodo()
  const [year, month] = mesActual.split('-').map(Number)
  const inicioMes = new Date(year, month - 1, 1).toISOString()
  const finMes = new Date(year, month, 0, 23, 59, 59).toISOString()

  let query = supabase
    .from('documentos')
    .select('tipo_documento, es_compra, monto_total')
    .gte('created_at', inicioMes)
    .lte('created_at', finMes)

  if (clienteId) {
    query = query.eq('cliente_id', clienteId)
  }

  const { data: documentos } = await query

  if (!documentos || documentos.length === 0) {
    return []
  }

  // Agrupar por tipo
  const tipoLabels: Record<string, string> = {
    'FACTURA_ELECTRONICA': 'Facturas',
    'FACTURA_EXENTA': 'Facturas Exentas',
    'BOLETA_ELECTRONICA': 'Boletas',
    'NOTA_CREDITO': 'Notas Crédito',
    'NOTA_DEBITO': 'Notas Débito',
    'FACTURA_COMPRA': 'Compras',
    'GUIA_DESPACHO': 'Guías',
  }

  const agrupado: Record<string, { cantidad: number; monto: number }> = {}

  documentos.forEach(doc => {
    const tipo = tipoLabels[doc.tipo_documento] || doc.tipo_documento || 'Otros'
    if (!agrupado[tipo]) {
      agrupado[tipo] = { cantidad: 0, monto: 0 }
    }
    agrupado[tipo].cantidad++
    agrupado[tipo].monto += Number(doc.monto_total || 0)
  })

  const total = Object.values(agrupado).reduce((sum, v) => sum + v.monto, 0)

  return Object.entries(agrupado)
    .map(([category, data]) => ({
      category,
      value: data.monto,
      count: data.cantidad,
      percentage: total > 0 ? (data.monto / total) * 100 : 0,
    }))
    .sort((a, b) => b.value - a.value)
}

// ============================================
// EVOLUCIÓN TEMPORAL
// ============================================

export async function getEvolutionData(clienteId?: string): Promise<TimeSeriesPoint[]> {
  const supabase = createClient()
  const datos: TimeSeriesPoint[] = []

  for (let i = 11; i >= 0; i--) {
    const fecha = new Date()
    fecha.setMonth(fecha.getMonth() - i)
    const inicioMes = new Date(fecha.getFullYear(), fecha.getMonth(), 1).toISOString()
    const finMes = new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0, 23, 59, 59).toISOString()

    let queryDocs = supabase
      .from('documentos')
      .select('monto_total, es_compra')
      .gte('created_at', inicioMes)
      .lte('created_at', finMes)

    if (clienteId) {
      queryDocs = queryDocs.eq('cliente_id', clienteId)
    }

    const { data: docs } = await queryDocs

    const ventas = (docs || []).filter(d => !d.es_compra)
    const compras = (docs || []).filter(d => d.es_compra)

    const totalVentas = ventas.reduce((sum, d) => sum + Number(d.monto_total || 0), 0)
    const totalCompras = compras.reduce((sum, d) => sum + Number(d.monto_total || 0), 0)

    datos.push({
      date: fecha.toLocaleDateString('es-CL', { month: 'short', year: '2-digit' }),
      value: totalVentas,
      previousValue: totalCompras,
      label: fecha.toLocaleDateString('es-CL', { month: 'long', year: 'numeric' }),
    })
  }

  return datos
}

// ============================================
// INSIGHTS AUTOMÁTICOS
// ============================================

export async function generateInsights(
  clienteId?: string,
  periodo?: string
): Promise<Insight[]> {
  const supabase = createClient()
  const insights: Insight[] = []

  const mesActual = periodo || getCurrentPeriodo()
  const [year, month] = mesActual.split('-').map(Number)
  const inicioMes = new Date(year, month - 1, 1).toISOString()
  const finMes = new Date(year, month, 0, 23, 59, 59).toISOString()
  const inicioMesAnterior = new Date(year, month - 2, 1).toISOString()
  const finMesAnterior = new Date(year, month - 1, 0, 23, 59, 59).toISOString()

  // 1. Documentos procesados vs mes anterior
  const [{ count: docsActual }, { count: docsMesAnterior }] = await Promise.all([
    supabase.from('documentos').select('*', { count: 'exact', head: true })
      .gte('created_at', inicioMes).lte('created_at', finMes),
    supabase.from('documentos').select('*', { count: 'exact', head: true })
      .gte('created_at', inicioMesAnterior).lte('created_at', finMesAnterior),
  ])

  const docs = docsActual || 0
  const docsAnt = docsMesAnterior || 0
  const docsChange = docsAnt > 0 ? ((docs - docsAnt) / docsAnt) * 100 : 0

  if (Math.abs(docsChange) > 10) {
    insights.push({
      id: 'docs-trend',
      type: docsChange > 0 ? 'positive' : 'negative',
      category: 'trend',
      title: docsChange > 0 ? 'Aumento en procesamiento' : 'Reducción en procesamiento',
      description: `Los documentos procesados ${docsChange > 0 ? 'aumentaron' : 'disminuyeron'} un ${Math.abs(docsChange).toFixed(1)}% respecto al mes anterior`,
      metric: { value: docs, change: docsChange, unit: 'documentos' },
      priority: Math.abs(docsChange) > 25 ? 1 : 2,
    })
  }

  // 2. Documentos pendientes
  const { count: pendientes } = await supabase
    .from('documentos')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pendiente')

  if ((pendientes || 0) > 10) {
    insights.push({
      id: 'pending-docs',
      type: 'alert',
      category: 'anomaly',
      title: 'Documentos pendientes',
      description: `Hay ${pendientes} documentos pendientes de clasificación que requieren atención`,
      metric: { value: pendientes || 0, change: 0, unit: 'pendientes' },
      priority: (pendientes || 0) > 50 ? 1 : 2,
    })
  }

  // 3. Tasa de éxito de bots
  const [{ count: botsOk }, { count: botsFail }] = await Promise.all([
    supabase.from('bot_jobs').select('*', { count: 'exact', head: true })
      .eq('status', 'completado').gte('created_at', inicioMes).lte('created_at', finMes),
    supabase.from('bot_jobs').select('*', { count: 'exact', head: true })
      .eq('status', 'fallido').gte('created_at', inicioMes).lte('created_at', finMes),
  ])

  const totalBots = (botsOk || 0) + (botsFail || 0)
  const tasaExito = totalBots > 0 ? ((botsOk || 0) / totalBots) * 100 : 100

  if (tasaExito < 90 && totalBots > 5) {
    insights.push({
      id: 'bot-failure',
      type: 'alert',
      category: 'anomaly',
      title: 'Tasa de éxito baja en automatización',
      description: `La tasa de éxito de los bots es ${tasaExito.toFixed(1)}%. Se recomienda revisar los jobs fallidos`,
      metric: { value: tasaExito, change: 0, unit: '%' },
      priority: tasaExito < 80 ? 1 : 2,
    })
  } else if (tasaExito >= 98 && totalBots > 10) {
    insights.push({
      id: 'bot-success',
      type: 'positive',
      category: 'trend',
      title: 'Excelente rendimiento de automatización',
      description: `Los bots mantienen una tasa de éxito del ${tasaExito.toFixed(1)}%`,
      metric: { value: tasaExito, change: 0, unit: '%' },
      priority: 3,
    })
  }

  // 4. F29 próximos a vencer
  const hoy = new Date()
  const diaDelMes = hoy.getDate()
  if (diaDelMes > 5 && diaDelMes < 12) {
    const { count: f29Pendientes } = await supabase
      .from('f29_calculos')
      .select('*', { count: 'exact', head: true })
      .eq('periodo', mesActual)
      .in('status', ['borrador', 'calculado'])

    if ((f29Pendientes || 0) > 0) {
      insights.push({
        id: 'f29-deadline',
        type: 'alert',
        category: 'recommendation',
        title: 'F29 próximos a vencer',
        description: `Hay ${f29Pendientes} F29 del período actual que deben presentarse antes del día 12`,
        metric: { value: f29Pendientes || 0, change: 0, unit: 'formularios' },
        priority: 1,
      })
    }
  }

  // 5. Horas ahorradas
  const horasAhorradas = Math.round((docs * 5 + (docsActual || 0) * 15) / 60)
  if (horasAhorradas > 10) {
    insights.push({
      id: 'hours-saved',
      type: 'positive',
      category: 'trend',
      title: 'Ahorro significativo de tiempo',
      description: `Este mes se han ahorrado aproximadamente ${horasAhorradas} horas de trabajo manual`,
      metric: { value: horasAhorradas, change: 0, unit: 'horas' },
      priority: 3,
    })
  }

  // Ordenar por prioridad
  return insights.sort((a, b) => a.priority - b.priority)
}

// ============================================
// EXPORTAR DASHBOARD A PDF
// ============================================

export async function getExecutiveDashboardForPDF(
  clienteId?: string,
  periodo?: string
) {
  const data = await getExecutiveDashboardData(clienteId, periodo)

  // Obtener información del cliente si se especifica
  let clienteInfo = null
  if (clienteId) {
    const supabase = createClient()
    const { data: cliente } = await supabase
      .from('clientes')
      .select('rut, razon_social')
      .eq('id', clienteId)
      .single()
    clienteInfo = cliente
  }

  return {
    ...data,
    cliente: clienteInfo,
    generadoEn: new Date().toISOString(),
  }
}
