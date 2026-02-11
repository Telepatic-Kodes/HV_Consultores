// @ts-nocheck — temporary: remove after npx convex dev generates real types
'use server'

import { ConvexHttpClient } from "convex/browser"
import { api } from "../../../../convex/_generated/api"
import { revalidatePath } from 'next/cache'
import crypto from 'crypto'

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL
const convex = convexUrl ? new ConvexHttpClient(convexUrl) : null

// Tipos locales para documento_cargas (tabla no incluida en schema Convex actual)
export interface DocumentoCarga {
  id: string
  cliente_id: string
  nombre_archivo: string
  tipo_documento: string
  ruta_storage: string
  tamaño_bytes: number
  hash_archivo: string
  estado: string
  folio_documento?: string | null
  fecha_documento?: string | null
  monto_total?: number | null
  nubox_documento_id?: string | null
  nubox_estado?: string | null
  cargado_en?: string | null
  cargado_por?: string | null
  validado_en?: string | null
  validado_por?: string | null
  metadata?: Record<string, unknown> | null
}

export interface DocumentoWorkflow {
  id: string
  documento_id: string
  etapa: string
  estado: string
  usuario_id?: string | null
  comentario?: string | null
  created_at?: string | null
}

export interface DocumentoAprobacion {
  id: string
  documento_id: string
  aprobador_id: string
  nivel: number
  estado: string
  comentario?: string | null
  fecha_decision?: string | null
  created_at?: string | null
}

export interface DocumentoCargaConWorkflow extends DocumentoCarga {
  workflow?: DocumentoWorkflow[]
  aprobaciones?: DocumentoAprobacion[]
}

// Validar archivo
function validarArchivo(file: {
  name: string
  size: number
  type: string
}): { valido: boolean; error?: string } {
  const maxSize = 50 * 1024 * 1024 // 50MB
  const tiposPermitidos = ['application/pdf', 'image/jpeg', 'image/png', 'image/tiff']

  if (file.size > maxSize) {
    return { valido: false, error: 'Archivo demasiado grande (máximo 50MB)' }
  }

  if (!tiposPermitidos.includes(file.type)) {
    return { valido: false, error: 'Tipo de archivo no permitido. Use PDF, JPG, PNG o TIFF' }
  }

  return { valido: true }
}

// Calcular hash SHA-256 de un archivo
function calcularHashArchivo(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex')
}

// Cargar documento (migrado a Convex)
export async function cargarDocumento(
  clienteId: string,
  tipoDocumento: string,
  archivoBytes: ArrayBuffer,
  nombreArchivo: string,
  metadatos?: {
    folioDocumento?: string
    fechaDocumento?: string
    montoTotal?: number
  }
): Promise<{ success: boolean; documentoId?: string; error?: string }> {
  try {
    // Convert ArrayBuffer to Buffer
    const buffer = Buffer.from(archivoBytes)
    const hashArchivo = calcularHashArchivo(buffer)

    // Validate file
    const validacion = validarArchivo({
      name: nombreArchivo,
      size: buffer.length,
      type: 'application/pdf',
    })

    if (!validacion.valido) {
      return { success: false, error: validacion.error }
    }

    // Create document via Convex (simplified - document_cargas table not in current schema)
    // For now, create as a regular documento
    const documentId = await convex.mutation(api.documents.createDocument, {
      cliente_id: clienteId as any, // Convex ID type
      tipo_documento: tipoDocumento,
      folio: metadatos?.folioDocumento || `AUTO-${Date.now()}`,
      periodo: new Date().toISOString().substring(0, 7), // YYYY-MM
      fecha_emision: metadatos?.fechaDocumento || new Date().toISOString().split('T')[0],
      rut_emisor: '00000000-0', // Placeholder
      es_compra: true,
      monto_total: metadatos?.montoTotal,
    })

    revalidatePath('/dashboard/documentos')
    return { success: true, documentoId: documentId as string }
  } catch (error) {
    console.error('Error cargando documento:', error)
    return { success: false, error: 'Error al registrar el documento' }
  }
}

// Obtener documentos cargados (from Convex)
export async function obtenerDocumentosCargados(clienteId?: string): Promise<any[]> {
  try {
    const docs = await convex.query(api.documents.listDocuments, {
      clienteId: clienteId as any,
    })
    return docs
  } catch (error) {
    console.error('Error fetching documentos:', error)
    return []
  }
}

// Cambiar estado de documento
export async function cambiarEstadoDocumento(
  documentoId: string,
  estadoNuevo: string,
  notas?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await convex.mutation(api.documents.updateDocument, {
      id: documentoId as any,
      status: estadoNuevo as any,
    })

    revalidatePath('/dashboard/documentos')
    return { success: true }
  } catch (error) {
    console.error('Error actualizando documento:', error)
    return { success: false, error: 'Error actualizando documento' }
  }
}

// Crear aprobación (placeholder - aprobaciones table not in schema yet)
export async function crearAprobacion(
  documentoId: string,
  asignadoA: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // TODO: Implement when documento_aprobaciones table added to Convex schema
    revalidatePath('/dashboard/documentos')
    return { success: true }
  } catch (error) {
    return { success: false, error: 'Error creando aprobación' }
  }
}

// Aprobar documento
export async function aprobarDocumento(
  aprobacionId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // TODO: Implement when documento_aprobaciones table added to Convex schema
    revalidatePath('/dashboard/documentos')
    return { success: true }
  } catch (error) {
    return { success: false, error: 'Error aprobando documento' }
  }
}

// Rechazar documento
export async function rechazarDocumento(
  aprobacionId: string,
  razonRechazo: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // TODO: Implement when documento_aprobaciones table added to Convex schema
    revalidatePath('/dashboard/documentos')
    return { success: true }
  } catch (error) {
    return { success: false, error: 'Error rechazando documento' }
  }
}

// Obtener estadísticas de documentos
export async function obtenerEstadisticasDocumentos(clienteId?: string): Promise<{
  total: number
  pendiente: number
  subido: number
  validado: number
  enviado: number
  rechazado: number
}> {
  try {
    const docs = await convex.query(api.documents.listDocuments, {
      clienteId: clienteId as any,
    })

    const stats = {
      total: docs.length,
      pendiente: docs.filter(d => d.status === 'pendiente').length,
      subido: 0, // Not in current schema
      validado: docs.filter(d => d.status === 'revisado').length,
      enviado: docs.filter(d => d.status === 'exportado').length,
      rechazado: 0, // Not in current schema
    }

    return stats
  } catch (error) {
    console.error('Error getting document stats:', error)
    return {
      total: 0,
      pendiente: 0,
      subido: 0,
      validado: 0,
      enviado: 0,
      rechazado: 0,
    }
  }
}
