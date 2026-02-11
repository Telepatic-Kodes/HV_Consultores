'use server'

import { ConvexHttpClient } from "convex/browser"
import { api } from "../../../../convex/_generated/api"
import { revalidatePath } from 'next/cache'

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL
const convex = convexUrl ? new ConvexHttpClient(convexUrl) : null

export interface F29ConDetalles {
  _id: string
  cliente_id: string
  periodo: string
  status?: string
  total_a_pagar?: number
  total_debito_fiscal?: number
  total_credito_fiscal?: number
  created_at?: string
}

export interface F29Stats {
  total: number
  aprobados: number
  conAlertas: number
  borradores: number
}

// Obtener lista de F29 con detalles
export async function getF29List(periodo?: string): Promise<F29ConDetalles[]> {
  try {
    if (!convex) throw new Error('Convex client not initialized')
    const submissions = await convex.query(api.f29.listSubmissions, {
      periodo,
    })
    return submissions as any[]
  } catch (error) {
    console.error('Error fetching F29 list:', error)
    return []
  }
}

// Obtener estadísticas de F29
export async function getF29Stats(periodo?: string): Promise<F29Stats> {
  try {
    if (!convex) throw new Error('Convex client not initialized')
    const submissions = await convex.query(api.f29.listSubmissions, {
      periodo,
    })

    const stats = {
      total: submissions.length,
      aprobados: submissions.filter(f => f.status === 'aprobado' || f.status === 'enviado').length,
      conAlertas: submissions.filter(f => f.status === 'validado').length,
      borradores: submissions.filter(f => f.status === 'borrador' || f.status === 'calculado').length,
    }

    return stats
  } catch (error) {
    console.error('Error getting F29 stats:', error)
    return {
      total: 0,
      aprobados: 0,
      conAlertas: 0,
      borradores: 0,
    }
  }
}

// Generar F29 automáticamente desde documentos clasificados
export async function generarF29(
  clienteId: string,
  periodo: string
): Promise<{ success: boolean; f29Id?: string; error?: string }> {
  try {
    if (!convex) throw new Error('Convex client not initialized')
    // Get documents for the period
    const docs = await convex.query(api.documents.listDocuments, {
      clienteId: clienteId as any,
      periodo,
    })

    // Calculate totals from documents
    const debitoFiscal = docs
      .filter(d => !d.es_compra)
      .reduce((sum, d) => sum + (d.monto_iva || 0), 0)

    const creditoFiscal = docs
      .filter(d => d.es_compra)
      .reduce((sum, d) => sum + (d.monto_iva || 0), 0)

    // Create F29 submission
    const f29Id = await convex.mutation(api.f29.createSubmission, {
      cliente_id: clienteId as any,
      periodo,
      total_debito_fiscal: debitoFiscal,
      total_credito_fiscal: creditoFiscal,
      total_a_pagar: Math.max(0, debitoFiscal - creditoFiscal),
    })

    revalidatePath('/dashboard/f29')
    return { success: true, f29Id: f29Id as string }
  } catch (error) {
    console.error('Error generando F29:', error)
    return { success: false, error: 'Error generando F29' }
  }
}

// Actualizar estado de F29
export async function actualizarEstadoF29(
  f29Id: string,
  nuevoEstado: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!convex) throw new Error('Convex client not initialized')
    await convex.mutation(api.f29.updateSubmissionStatus, {
      id: f29Id as any,
      status: nuevoEstado as any,
    })

    revalidatePath('/dashboard/f29')
    return { success: true }
  } catch (error) {
    console.error('Error actualizando F29:', error)
    return { success: false, error: 'Error actualizando estado' }
  }
}

// Obtener validaciones de un F29
export async function getF29Validations(f29Id: string): Promise<any[]> {
  try {
    if (!convex) throw new Error('Convex client not initialized')
    const validations = await convex.query(api.f29.getSubmissionValidations, {
      f29CalculoId: f29Id as any,
    })
    return validations
  } catch (error) {
    console.error('Error getting validations:', error)
    return []
  }
}

// Aprobar F29
export async function aprobarF29(
  f29Id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!convex) throw new Error('Convex client not initialized')
    await convex.mutation(api.f29.updateSubmissionStatus, {
      id: f29Id as any,
      status: 'aprobado',
    })

    revalidatePath('/dashboard/f29')
    return { success: true }
  } catch (error) {
    console.error('Error aprobando F29:', error)
    return { success: false, error: 'Error aprobando F29' }
  }
}

// Enviar F29 al SII (placeholder)
export async function enviarF29AlSII(
  f29Id: string
): Promise<{ success: boolean; error?: string; folioSII?: string }> {
  try {
    if (!convex) throw new Error('Convex client not initialized')
    // TODO: Implement actual SII submission logic
    await convex.mutation(api.f29.updateSubmissionStatus, {
      id: f29Id as any,
      status: 'enviado',
    })

    revalidatePath('/dashboard/f29')
    return { success: true, folioSII: `F29-${Date.now()}` }
  } catch (error) {
    console.error('Error enviando F29:', error)
    return { success: false, error: 'Error enviando al SII' }
  }
}

// Eliminar F29
export async function eliminarF29(
  f29Id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!convex) throw new Error('Convex client not initialized')
    await convex.mutation(api.f29.deleteSubmission, {
      id: f29Id as any,
    })

    revalidatePath('/dashboard/f29')
    return { success: true }
  } catch (error) {
    console.error('Error eliminando F29:', error)
    return { success: false, error: 'Error eliminando F29' }
  }
}

// --- Backward-compatible exports for page components ---

export async function getClientesConDocumentos(): Promise<any[]> {
  try {
    if (!convex) throw new Error('Convex client not initialized')
    const clientes = await convex.query(api.clients.listClientes, {})
    return clientes.filter((c: any) => c.activo)
  } catch {
    return []
  }
}

export async function getPeriodosDisponibles(): Promise<string[]> {
  const now = new Date()
  const periodos: string[] = []
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    periodos.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }
  return periodos
}

export async function getDatosF29ParaReporte(f29Id?: string): Promise<any> {
  if (!f29Id) return null
  try {
    if (!convex) throw new Error('Convex client not initialized')
    const submissions = await convex.query(api.f29.listSubmissions, {})
    return (submissions as any[]).find((s: any) => s._id === f29Id) || null
  } catch {
    return null
  }
}

export async function getDocumentosParaReporte(clienteId?: string, periodo?: string): Promise<any[]> {
  try {
    if (!convex) throw new Error('Convex client not initialized')
    const docs = await convex.query(api.documents.listDocuments, {
      clienteId: clienteId as any,
      periodo,
    })
    return docs
  } catch {
    return []
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

export async function generarReporte(
  tipo: string,
  clienteId?: string,
  periodo?: string
): Promise<{ success: boolean; error?: string }> {
  // Reports are generated on the fly from queries
  return { success: true }
}
