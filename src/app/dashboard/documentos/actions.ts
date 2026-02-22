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

// Cargar documento (migrado a Convex) — accepts FormData for proper serialization
export async function cargarDocumento(
  formData: FormData
): Promise<{ success: boolean; documentoId?: string; error?: string }> {
  try {
    const clienteId = formData.get('clienteId') as string
    const tipoDocumento = formData.get('tipoDocumento') as string
    const archivo = formData.get('archivo') as File | null
    const folioDocumento = formData.get('folioDocumento') as string | undefined
    const fechaDocumento = formData.get('fechaDocumento') as string | undefined
    const montoTotalStr = formData.get('montoTotal') as string | undefined

    if (!clienteId) {
      return { success: false, error: 'Debes seleccionar un cliente' }
    }
    if (!archivo || !(archivo instanceof File)) {
      return { success: false, error: 'No se recibió el archivo' }
    }

    // Validate file
    const validacion = validarArchivo({
      name: archivo.name,
      size: archivo.size,
      type: archivo.type || 'application/pdf',
    })

    if (!validacion.valido) {
      return { success: false, error: validacion.error }
    }

    // Read bytes for hash
    const buffer = Buffer.from(await archivo.arrayBuffer())
    const hashArchivo = calcularHashArchivo(buffer)

    if (!convex) throw new Error('Convex client not initialized')

    const documentId = await convex.mutation(api.documents.createDocument, {
      cliente_id: clienteId as any,
      tipo_documento: tipoDocumento,
      folio: folioDocumento || `AUTO-${Date.now()}`,
      periodo: new Date().toISOString().substring(0, 7),
      fecha_emision: fechaDocumento || new Date().toISOString().split('T')[0],
      rut_emisor: '00000000-0',
      es_compra: true,
      monto_total: montoTotalStr ? parseFloat(montoTotalStr) : undefined,
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
    if (!convex) throw new Error('Convex client not initialized')
    const docs = await convex.query(api.documents.listDocuments, {
      clienteId: clienteId as any,
    })
    return (docs as any[]).map((d: any) => ({
      id: d._id,
      cliente_id: d.cliente_id,
      nombre_archivo: d.nombre_archivo,
      tipo_documento: d.tipo_documento,
      folio_documento: d.folio,
      fecha_documento: d.fecha_emision,
      monto_total: d.monto_total,
      estado: d.status ?? 'pendiente',
      nubox_documento_id: d.nubox_documento_id,
      nubox_estado: d.nubox_estado,
      rut_emisor: d.rut_emisor,
      razon_social_emisor: d.razon_social_emisor,
    }))
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
    if (!convex) throw new Error('Convex client not initialized')
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
  clasificado: number
  revisado: number
  aprobado: number
  exportado: number
}> {
  try {
    if (!convex) throw new Error('Convex client not initialized')
    const docs = await convex.query(api.documents.listDocuments, {
      clienteId: clienteId as any,
    })

    const stats = {
      total: docs.length,
      pendiente: docs.filter(d => d.status === 'pendiente').length,
      clasificado: docs.filter(d => d.status === 'clasificado').length,
      revisado: docs.filter(d => d.status === 'revisado').length,
      aprobado: docs.filter(d => d.status === 'aprobado').length,
      exportado: docs.filter(d => d.status === 'exportado').length,
    }

    return stats
  } catch (error) {
    console.error('Error getting document stats:', error)
    return {
      total: 0,
      pendiente: 0,
      clasificado: 0,
      revisado: 0,
      aprobado: 0,
      exportado: 0,
    }
  }
}
