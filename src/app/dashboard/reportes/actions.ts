'use server'

import { ConvexHttpClient } from "convex/browser"
import { api } from "@/convex/_generated/api"

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!)

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
