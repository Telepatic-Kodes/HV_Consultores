'use server'

import { ConvexHttpClient } from "convex/browser"
import { api } from "../../../../convex/_generated/api"

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL
const convex = convexUrl ? new ConvexHttpClient(convexUrl) : null

export interface ReportData {
  periodo: string
  clientes: number
  documentos: number
  f29Generados: number
  botsEjecutados: number
}

// Obtener datos para reportes
export async function getReportData(
  fechaInicio: string,
  fechaFin: string,
  clienteId?: string
): Promise<ReportData[]> {
  try {
    if (!convex) throw new Error('Convex client not initialized')
    // Get all data from Convex
    const [docs, f29s, jobs, clientes] = await Promise.all([
      convex.query(api.documents.listDocuments, {
        clienteId: clienteId as any,
      }),
      convex.query(api.f29.listSubmissions, {
        clienteId: clienteId as any,
      }),
      convex.query(api.bots.listJobs, {
        clienteId: clienteId as any,
      }),
      convex.query(api.clients.listClientes, {}),
    ])

    // Filter by date range
    const docsInRange = docs.filter(d =>
      d.created_at && d.created_at >= fechaInicio && d.created_at <= fechaFin
    )
    const f29sInRange = f29s.filter(f =>
      f.created_at && f.created_at >= fechaInicio && f.created_at <= fechaFin
    )
    const jobsInRange = jobs.filter(j =>
      j.created_at && j.created_at >= fechaInicio && j.created_at <= fechaFin
    )

    // Group by period (month)
    const periodos = new Set<string>()
    docsInRange.forEach(d => {
      if (d.periodo) periodos.add(d.periodo)
    })

    const reportData: ReportData[] = Array.from(periodos).map(periodo => ({
      periodo,
      clientes: clienteId ? 1 : clientes.filter(c => c.activo).length,
      documentos: docsInRange.filter(d => d.periodo === periodo).length,
      f29Generados: f29sInRange.filter(f => f.periodo === periodo).length,
      botsEjecutados: jobsInRange.length,
    }))

    return reportData.sort((a, b) => a.periodo.localeCompare(b.periodo))
  } catch (error) {
    console.error('Error getting report data:', error)
    return []
  }
}

// Obtener reporte de documentos por cliente
export async function getDocumentosReportePorCliente(
  fechaInicio: string,
  fechaFin: string
): Promise<any[]> {
  try {
    if (!convex) throw new Error('Convex client not initialized')
    const [docs, clientes] = await Promise.all([
      convex.query(api.documents.listDocuments, {}),
      convex.query(api.clients.listClientes, {}),
    ])

    // Filter by date
    const docsInRange = docs.filter(d =>
      d.created_at && d.created_at >= fechaInicio && d.created_at <= fechaFin
    )

    // Group by client
    const reportePorCliente = clientes.map(cliente => {
      const clienteDocs = docsInRange.filter(d => d.cliente_id === cliente._id)

      return {
        cliente_id: cliente._id,
        razon_social: cliente.razon_social,
        rut: cliente.rut,
        total_documentos: clienteDocs.length,
        pendientes: clienteDocs.filter(d => d.status === 'pendiente').length,
        clasificados: clienteDocs.filter(d => d.status === 'clasificado').length,
        monto_total: clienteDocs.reduce((sum, d) => sum + (d.monto_total || 0), 0),
      }
    })

    return reportePorCliente.filter(r => r.total_documentos > 0)
  } catch (error) {
    console.error('Error getting documents report:', error)
    return []
  }
}

// Obtener reporte de F29
export async function getF29Reporte(
  fechaInicio: string,
  fechaFin: string,
  clienteId?: string
): Promise<any[]> {
  try {
    if (!convex) throw new Error('Convex client not initialized')
    const f29s = await convex.query(api.f29.listSubmissions, {
      clienteId: clienteId as any,
    })

    // Filter by date
    const f29sInRange = f29s.filter(f =>
      f.created_at && f.created_at >= fechaInicio && f.created_at <= fechaFin
    )

    return f29sInRange.map(f29 => ({
      periodo: f29.periodo,
      status: f29.status,
      total_debito: f29.total_debito_fiscal || 0,
      total_credito: f29.total_credito_fiscal || 0,
      total_a_pagar: f29.total_a_pagar || 0,
      created_at: f29.created_at,
    }))
  } catch (error) {
    console.error('Error getting F29 report:', error)
    return []
  }
}

// Exportar reporte a CSV (helper)
export async function exportarReporteCSV(
  tipo: 'documentos' | 'f29' | 'bots',
  fechaInicio: string,
  fechaFin: string,
  clienteId?: string
): Promise<{ success: boolean; csvData?: string; error?: string }> {
  try {
    let data: any[] = []

    if (tipo === 'documentos') {
      data = await getDocumentosReportePorCliente(fechaInicio, fechaFin)
    } else if (tipo === 'f29') {
      data = await getF29Reporte(fechaInicio, fechaFin, clienteId)
    }

    // Convert to CSV (simple implementation)
    if (data.length === 0) {
      return { success: false, error: 'No hay datos para exportar' }
    }

    const headers = Object.keys(data[0]).join(',')
    const rows = data.map(row =>
      Object.values(row).map(v => `"${v}"`).join(',')
    )
    const csvData = [headers, ...rows].join('\n')

    return { success: true, csvData }
  } catch (error) {
    console.error('Error exportando reporte:', error)
    return { success: false, error: 'Error generando CSV' }
  }
}

// --- Backward-compatible exports for page components ---

export interface MetricaGeneral {
  id?: string
  titulo?: string
  valor?: number | string
  cambio?: number
  icono?: string
  label?: string
  value?: string | number
  trend?: string
  subtitle?: string
}

export interface ReporteDisponible {
  id: string
  titulo?: string
  descripcion: string
  tipo: string
  disponible?: boolean
  ultimaGeneracion?: string
  nombre?: string
}

export interface DatosGrafico {
  label?: string
  valor?: number
  color?: string
  documentos?: number
  horasAhorradas?: number
  mes?: string
}

export async function getMetricasGenerales(): Promise<MetricaGeneral[]> {
  try {
    if (!convex) throw new Error('Convex client not initialized')
    const [docs, f29s, clientes] = await Promise.all([
      convex.query(api.documents.listDocuments, {}),
      convex.query(api.f29.listSubmissions, {}),
      convex.query(api.clients.listClientes, {}),
    ])
    return [
      { id: 'docs', titulo: 'Documentos', valor: docs.length, icono: '📄' },
      { id: 'f29', titulo: 'F29 Generados', valor: f29s.length, icono: '📋' },
      { id: 'clientes', titulo: 'Clientes Activos', valor: clientes.filter((c: any) => c.activo).length, icono: '👥' },
    ]
  } catch {
    return []
  }
}

export async function getReportesDisponibles(): Promise<ReporteDisponible[]> {
  return [
    { id: 'documentos', titulo: 'Reporte de Documentos', descripcion: 'Resumen de documentos procesados', tipo: 'documentos', disponible: true },
    { id: 'f29', titulo: 'Reporte F29', descripcion: 'Estado de formularios F29', tipo: 'f29', disponible: true },
    { id: 'clientes', titulo: 'Reporte de Clientes', descripcion: 'Actividad por cliente', tipo: 'clientes', disponible: true },
  ]
}

export async function getDatosEvolucion(meses: number = 6): Promise<DatosGrafico[]> {
  const datos: DatosGrafico[] = []
  const now = new Date()
  for (let i = meses - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    datos.push({
      label: d.toLocaleDateString('es-CL', { month: 'short' }),
      valor: 0,
    })
  }
  return datos
}

export async function getProductividadContadores(): Promise<any[]> {
  return [
    { id: '1', nombre: 'Demo Contador', documentos_procesados: 0, f29_generados: 0 },
  ]
}

export async function getClientesParaReportes(): Promise<any[]> {
  try {
    if (!convex) throw new Error('Convex client not initialized')
    const clientes = await convex.query(api.clients.listClientes, {})
    return clientes.filter((c: any) => c.activo)
  } catch {
    return []
  }
}

export async function generarReporte(
  tipo: string,
  clienteId?: string,
  periodo?: string
): Promise<{ success: boolean; data?: any; error?: string }> {
  return { success: true, data: null }
}

export async function getPeriodosDisponibles(_clienteId?: string): Promise<string[]> {
  const now = new Date()
  const periodos: string[] = []
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    periodos.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }
  return periodos
}

export async function getDocumentosParaReporte(clienteId?: string, periodo?: string): Promise<any> {
  try {
    if (!convex) throw new Error('Convex client not initialized')
    const docs = await convex.query(api.documents.listDocuments, {
      clienteId: clienteId as any,
      periodo,
    })
    return { documentos: docs }
  } catch {
    return { documentos: [] }
  }
}

export async function getResumenMensualParaReporte(clienteId?: string, periodo?: string): Promise<any> {
  try {
    if (!convex) throw new Error('Convex client not initialized')
    const [docs, f29s] = await Promise.all([
      convex.query(api.documents.listDocuments, { clienteId: clienteId as any, periodo }),
      convex.query(api.f29.listSubmissions, { clienteId: clienteId as any, periodo }),
    ])
    return {
      total_documentos: docs.length,
      total_f29: f29s.length,
      monto_total: docs.reduce((s: number, d: any) => s + (d.monto_total || 0), 0),
    }
  } catch {
    return { total_documentos: 0, total_f29: 0, monto_total: 0 }
  }
}

export async function getDatosF29ParaReporte(clienteIdOrF29Id?: string, periodo?: string): Promise<any> {
  if (!clienteIdOrF29Id) return null
  try {
    if (!convex) throw new Error('Convex client not initialized')
    const submissions = await convex.query(api.f29.listSubmissions, {})
    if (periodo) {
      return (submissions as any[]).find(
        (s: any) => s.cliente_id === clienteIdOrF29Id && s.periodo === periodo
      ) || null
    }
    return (submissions as any[]).find((s: any) => s._id === clienteIdOrF29Id) || null
  } catch {
    return null
  }
}
