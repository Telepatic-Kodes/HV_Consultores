// @ts-nocheck — temporary: remove after full migration
'use server'
// TODO: Phase 2 - Implement Nubox integration module in Convex
// External API integration with Nubox for document processing

import { revalidatePath } from 'next/cache'

const DEMO_USER_ID = 'demo-user'

/**
 * Enviar documento a Nubox para procesamiento
 */
export async function enviarDocumentoANubox(
  documentoId: string,
  datosFactura: {
    folio: string
    fechaEmision: string
    montoTotal: number
    montoNeto?: number
    montoIva?: number
    rutEmisor: string
    razonSocialEmisor: string
  }
): Promise<{ success: boolean; nuboxId?: string; error?: string }> {
  // Stub: returns success until Convex module is implemented
  return { success: true, nuboxId: 'stub-nubox-id' }
}

/**
 * Obtener estado de documento desde Nubox
 */
export async function obtenerEstadoNubox(
  documentoId: string
): Promise<{ success: boolean; estado?: string; error?: string }> {
  // Stub: returns success until Convex module is implemented
  return { success: true, estado: 'PENDING' }
}

/**
 * Descargar documento de Nubox (PDF o XML)
 */
export async function descargarDocumentoNubox(
  documentoId: string,
  formato: 'pdf' | 'xml'
): Promise<{ success: boolean; nombreArchivo?: string; error?: string }> {
  // Stub: returns success until Convex module is implemented
  return { success: true, nombreArchivo: `stub-document.${formato}` }
}

/**
 * Listar documentos desde Nubox
 */
export async function listarDocumentosNubox(filtros?: {
  estado?: string
  fechaInicio?: string
  fechaFin?: string
}): Promise<{
  success: boolean
  documentos?: Array<{
    id: string
    folio: string
    estado: string
    estadoSii: string
  }>
  error?: string
}> {
  // Stub: returns empty data until Convex module is implemented
  return { success: true, documentos: [] }
}

/**
 * Sincronizar documentos desde Nubox a la BD
 * Util para mantener sincronizado el estado
 */
export async function sincronizarDocumentosNubox(): Promise<{
  success: boolean
  sincronizados: number
  error?: string
}> {
  // Stub: returns success until Convex module is implemented
  return { success: true, sincronizados: 0 }
}
