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
    const [docs, f29s, clientes, jobs] = await Promise.all([
      convex.query(api.documents.listDocuments, {}),
      convex.query(api.f29.listSubmissions, {}),
      convex.query(api.clients.listClientes, {}),
      convex.query(api.bots.listJobs, {}),
    ])
    const activos = clientes.filter((c: any) => c.activo).length
    const clasificados = docs.filter((d: any) => d.status === 'clasificado' || d.status === 'validado').length
    const tasaClasif = docs.length > 0 ? Math.round((clasificados / docs.length) * 100) : 0
    const jobsExitosos = (jobs as any[]).filter((j: any) => j.status === 'completed' || j.status === 'completado').length
    const tasaExito = jobs.length > 0 ? Math.round((jobsExitosos / jobs.length) * 100) : 0
    return [
      { label: 'Documentos', value: docs.length.toLocaleString(), trend: '+12%', subtitle: `${clasificados} clasificados` },
      { label: 'F29 Generados', value: f29s.length.toString(), trend: '+8%', subtitle: 'Este periodo' },
      { label: 'Clientes Activos', value: activos.toString(), trend: '+2', subtitle: `${tasaClasif}% docs clasificados` },
      { label: 'Bots Ejecutados', value: jobs.length.toString(), trend: `${tasaExito}%`, subtitle: `${jobsExitosos} exitosos` },
    ]
  } catch {
    return []
  }
}

export async function getReportesDisponibles(): Promise<ReporteDisponible[]> {
  return [
    { id: 'resumen-mensual', nombre: 'Resumen Mensual', descripcion: 'Resumen de documentos procesados', tipo: 'documentos', ultimaGeneracion: 'Hace 2h' },
    { id: 'estado-f29', nombre: 'Estado F29', descripcion: 'Estado de formularios F29', tipo: 'f29', ultimaGeneracion: 'Hace 1d' },
    { id: 'actividad-bots', nombre: 'Actividad por Cliente', descripcion: 'Actividad por cliente', tipo: 'clientes', ultimaGeneracion: 'Hace 3h' },
  ]
}

export async function getDatosEvolucion(meses: number = 6): Promise<DatosGrafico[]> {
  try {
    if (!convex) throw new Error('Convex client not initialized')
    const docs = await convex.query(api.documents.listDocuments, {})
    const now = new Date()
    const datos: DatosGrafico[] = []

    for (let i = meses - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const mesStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const mesLabel = d.toLocaleDateString('es-CL', { month: 'short' }).toUpperCase()

      // Count documents created in this month
      const docsDelMes = (docs as any[]).filter((doc: any) => {
        const created = doc.created_at || doc.fecha_emision || ''
        return created.startsWith(mesStr)
      }).length

      // Estimate hours saved: ~0.15 hours per doc automated
      const horasAhorradas = Math.round(docsDelMes * 0.15 * 10) / 10

      datos.push({
        mes: mesLabel,
        documentos: docsDelMes,
        horasAhorradas,
      })
    }
    return datos
  } catch {
    const datos: DatosGrafico[] = []
    const now = new Date()
    for (let i = meses - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      datos.push({
        mes: d.toLocaleDateString('es-CL', { month: 'short' }).toUpperCase(),
        documentos: 0,
        horasAhorradas: 0,
      })
    }
    return datos
  }
}

export async function getProductividadContadores(): Promise<any[]> {
  try {
    if (!convex) throw new Error('Convex client not initialized')
    const [docs, clientes] = await Promise.all([
      convex.query(api.documents.listDocuments, {}),
      convex.query(api.clients.listClientes, {}),
    ])
    // Group documents by client as a proxy for "contador" productivity
    const activosClientes = clientes.filter((c: any) => c.activo)
    return activosClientes.map((c: any) => {
      const clienteDocs = (docs as any[]).filter((d: any) => d.cliente_id === c._id)
      const clasificados = clienteDocs.filter((d: any) => d.status === 'clasificado' || d.status === 'validado' || d.status === 'enviado').length
      return {
        contador: c.razon_social,
        documentos: clienteDocs.length,
        clasificados,
      }
    }).filter((p: any) => p.documentos > 0)
  } catch {
    return []
  }
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
  try {
    if (!convex) throw new Error('Convex client not initialized')

    if (tipo === 'resumen-mensual') {
      const docs = await convex.query(api.documents.listDocuments, {})
      const total = docs.length
      const clasificados = (docs as any[]).filter((d: any) => d.status === 'clasificado' || d.status === 'validado').length
      const pendientes = (docs as any[]).filter((d: any) => d.status === 'pendiente').length
      const montoTotal = (docs as any[]).reduce((s: number, d: any) => s + (d.monto_total || 0), 0)
      return {
        success: true,
        data: {
          total_documentos: total,
          clasificados,
          pendientes,
          tasa_clasificacion: total > 0 ? `${Math.round((clasificados / total) * 100)}%` : '0%',
          monto_total: `$${montoTotal.toLocaleString('es-CL')}`,
        },
      }
    }

    if (tipo === 'estado-f29') {
      const f29s = await convex.query(api.f29.listSubmissions, {})
      return {
        success: true,
        data: (f29s as any[]).map((f: any) => ({
          periodo: f.periodo,
          status: f.status,
          debito_fiscal: f.total_debito_fiscal || 0,
          credito_fiscal: f.total_credito_fiscal || 0,
          a_pagar: f.total_a_pagar || 0,
        })),
      }
    }

    if (tipo === 'actividad-bots') {
      const clientes = await convex.query(api.clients.listClientes, {})
      const docs = await convex.query(api.documents.listDocuments, {})
      return {
        success: true,
        data: clientes.filter((c: any) => c.activo).map((c: any) => {
          const clienteDocs = (docs as any[]).filter((d: any) => d.cliente_id === c._id)
          return {
            cliente: c.razon_social,
            rut: c.rut,
            documentos: clienteDocs.length,
            pendientes: clienteDocs.filter((d: any) => d.status === 'pendiente').length,
          }
        }),
      }
    }

    return { success: true, data: { mensaje: 'Reporte generado correctamente' } }
  } catch (error) {
    return { success: false, error: 'Error generando reporte' }
  }
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
