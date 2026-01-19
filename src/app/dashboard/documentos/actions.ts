'use server'

import { createClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'
import crypto from 'crypto'

// Tipos locales para documento_cargas (tabla no incluida en types generados)
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

// Cargar documento
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
  const supabase = createClient()

  // Validar autenticación
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { success: false, error: 'No autenticado' }
  }

  // Validar cliente
  const { data: cliente, error: clienteError } = await supabase
    .from('clientes')
    .select('id')
    .eq('id', clienteId)
    .single()

  if (clienteError || !cliente) {
    return { success: false, error: 'Cliente no encontrado' }
  }

  // Convertir ArrayBuffer a Buffer
  const buffer = Buffer.from(archivoBytes)
  const hashArchivo = calcularHashArchivo(buffer)

  // Validar archivo
  const validacion = validarArchivo({
    name: nombreArchivo,
    size: buffer.length,
    type: 'application/pdf', // Por ahora asumimos PDF
  })

  if (!validacion.valido) {
    return { success: false, error: validacion.error }
  }

  // Verificar duplicados por hash
  const { data: duplicado } = await supabase
    .from('documento_cargas')
    .select('id')
    .eq('hash_archivo', hashArchivo)
    .single()

  if (duplicado) {
    return { success: false, error: 'Este archivo ya fue cargado previamente' }
  }

  // Crear registro de carga
  const { data: documentoCarga, error: insertError } = await supabase
    .from('documento_cargas')
    .insert({
      cliente_id: clienteId,
      nombre_archivo: nombreArchivo,
      tipo_documento: tipoDocumento as any,
      tamaño_bytes: buffer.length,
      hash_archivo: hashArchivo,
      estado: 'pendiente',
      cargado_por: user.id,
      folio_documento: metadatos?.folioDocumento,
      fecha_documento: metadatos?.fechaDocumento ? new Date(metadatos.fechaDocumento).toISOString().split('T')[0] : null,
      monto_total: metadatos?.montoTotal,
    })
    .select()
    .single()

  if (insertError) {
    console.error('Error creando registro de carga:', insertError)
    return { success: false, error: 'Error al registrar el documento' }
  }

  // Registrar evento en workflow
  await supabase
    .from('documento_workflow')
    .insert({
      documento_carga_id: documentoCarga.id,
      accion: 'subido',
      estado_nuevo: 'pendiente',
      realizado_por: user.id,
      notas: `Archivo ${nombreArchivo} cargado`,
    })

  revalidatePath('/dashboard/documentos')
  return { success: true, documentoId: documentoCarga.id }
}

// Obtener documentos cargados
export async function obtenerDocumentosCargados(clienteId?: string): Promise<DocumentoCargaConWorkflow[]> {
  const supabase = createClient()

  let query = supabase
    .from('documento_cargas')
    .select(`
      *,
      workflow:documento_workflow(*)
    `)
    .order('cargado_en', { ascending: false })

  if (clienteId) {
    query = query.eq('cliente_id', clienteId)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching documentos:', error)
    return []
  }

  return (data || []) as DocumentoCargaConWorkflow[]
}

// Cambiar estado de documento
export async function cambiarEstadoDocumento(
  documentoId: string,
  estadoNuevo: string,
  notas?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()

  // Validar autenticación
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { success: false, error: 'No autenticado' }
  }

  // Obtener documento actual
  const { data: documento, error: getError } = await supabase
    .from('documento_cargas')
    .select('estado')
    .eq('id', documentoId)
    .single()

  if (getError || !documento) {
    return { success: false, error: 'Documento no encontrado' }
  }

  // Actualizar documento
  const { error: updateError } = await supabase
    .from('documento_cargas')
    .update({
      estado: estadoNuevo,
      actualizado_en: new Date().toISOString(),
      ...(estadoNuevo === 'validado' && { validado_en: new Date().toISOString() }),
      ...(estadoNuevo === 'enviado_nubox' && { enviado_en: new Date().toISOString() }),
    })
    .eq('id', documentoId)

  if (updateError) {
    return { success: false, error: 'Error actualizando documento' }
  }

  // Registrar en workflow
  await supabase
    .from('documento_workflow')
    .insert({
      documento_carga_id: documentoId,
      accion: estadoNuevo,
      estado_anterior: documento.estado,
      estado_nuevo: estadoNuevo,
      realizado_por: user.id,
      notas: notas,
    })

  revalidatePath('/dashboard/documentos')
  return { success: true }
}

// Crear aprobación
export async function crearAprobacion(
  documentoId: string,
  asignadoA: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()

  const { error } = await supabase
    .from('documento_aprobaciones')
    .insert({
      documento_carga_id: documentoId,
      asignado_a: asignadoA,
      estado: 'pendiente',
    })

  if (error) {
    return { success: false, error: 'Error creando aprobación' }
  }

  revalidatePath('/dashboard/documentos')
  return { success: true }
}

// Aprobar documento
export async function aprobarDocumento(
  aprobacionId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { success: false, error: 'No autenticado' }
  }

  const { error: updateError } = await supabase
    .from('documento_aprobaciones')
    .update({
      estado: 'aprobado',
      aprobado_en: new Date().toISOString(),
    })
    .eq('id', aprobacionId)

  if (updateError) {
    return { success: false, error: 'Error aprobando documento' }
  }

  revalidatePath('/dashboard/documentos')
  return { success: true }
}

// Rechazar documento
export async function rechazarDocumento(
  aprobacionId: string,
  razonRechazo: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()

  const { error } = await supabase
    .from('documento_aprobaciones')
    .update({
      estado: 'rechazado',
      razon_rechazo: razonRechazo,
      aprobado_en: new Date().toISOString(),
    })
    .eq('id', aprobacionId)

  if (error) {
    return { success: false, error: 'Error rechazando documento' }
  }

  revalidatePath('/dashboard/documentos')
  return { success: true }
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
  const supabase = createClient()

  let query = supabase.from('documento_cargas').select('estado', { count: 'exact', head: true })

  if (clienteId) {
    query = query.eq('cliente_id', clienteId)
  }

  const { count: total } = await query

  const estados = ['pendiente', 'subido', 'validado', 'enviado_nubox', 'rechazado']
  const counts: Record<string, number> = {}

  for (const estado of estados) {
    const countQuery = supabase
      .from('documento_cargas')
      .select('id', { count: 'exact', head: true })
      .eq('estado', estado)

    if (clienteId) {
      countQuery.eq('cliente_id', clienteId)
    }

    const { count } = await countQuery
    counts[estado] = count || 0
  }

  return {
    total: total || 0,
    pendiente: counts['pendiente'] || 0,
    subido: counts['subido'] || 0,
    validado: counts['validado'] || 0,
    enviado: counts['enviado_nubox'] || 0,
    rechazado: counts['rechazado'] || 0,
  }
}
