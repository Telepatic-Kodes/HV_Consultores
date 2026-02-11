// @ts-nocheck — temporary: remove after full migration
'use server'

import { createClient } from '@/lib/supabase-server'
import { crearClienteNubox } from '@/lib/nubox'
import { revalidatePath } from 'next/cache'

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
  const supabase = createClient()
  const nuboxClient = crearClienteNubox()

  if (!nuboxClient) {
    return { success: false, error: 'Cliente Nubox no configurado' }
  }

  // Validar autenticación
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { success: false, error: 'No autenticado' }
  }

  // Obtener documento
  const { data: documento, error: docError } = await supabase
    .from('documento_cargas')
    .select('*')
    .eq('id', documentoId)
    .single()

  if (docError || !documento) {
    return { success: false, error: 'Documento no encontrado' }
  }

  // Enviar a Nubox
  const result = await nuboxClient.emitirDocumento({
    tipo: documento.tipo_documento,
    folio: datosFactura.folio,
    fechaEmision: datosFactura.fechaEmision,
    montoTotal: datosFactura.montoTotal,
    montoNeto: datosFactura.montoNeto,
    montoIva: datosFactura.montoIva,
    rutEmisor: datosFactura.rutEmisor,
    razonSocialEmisor: datosFactura.razonSocialEmisor,
  })

  if (!result.success || !result.data) {
    // Registrar error en workflow
    await supabase
      .from('documento_workflow')
      .insert({
        documento_carga_id: documentoId,
        accion: 'error_nubox',
        estado_anterior: documento.estado,
        estado_nuevo: documento.estado,
        realizado_por: user.id,
        notas: `Error Nubox: ${result.error}`,
      })

    return { success: false, error: result.error }
  }

  // Actualizar documento con respuesta Nubox
  const { error: updateError } = await supabase
    .from('documento_cargas')
    .update({
      nubox_documento_id: result.data.id,
      nubox_estado: result.data.estado,
      nubox_respuesta: result.data,
      estado: 'enviado_nubox',
      enviado_en: new Date().toISOString(),
      actualizado_en: new Date().toISOString(),
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
      accion: 'enviado_nubox',
      estado_anterior: documento.estado,
      estado_nuevo: 'enviado_nubox',
      realizado_por: user.id,
      notas: `Enviado a Nubox con ID ${result.data.id}`,
      datos_adicionales: { nubox_id: result.data.id },
    })

  revalidatePath('/dashboard/documentos')
  return { success: true, nuboxId: result.data.id }
}

/**
 * Obtener estado de documento desde Nubox
 */
export async function obtenerEstadoNubox(
  documentoId: string
): Promise<{ success: boolean; estado?: string; error?: string }> {
  const supabase = createClient()
  const nuboxClient = crearClienteNubox()

  if (!nuboxClient) {
    return { success: false, error: 'Cliente Nubox no configurado' }
  }

  // Obtener documento
  const { data: documento, error: docError } = await supabase
    .from('documento_cargas')
    .select('nubox_documento_id')
    .eq('id', documentoId)
    .single()

  if (docError || !documento || !documento.nubox_documento_id) {
    return { success: false, error: 'Documento Nubox no encontrado' }
  }

  // Obtener estado de Nubox
  const result = await nuboxClient.obtenerEstadoDocumento(documento.nubox_documento_id)

  if (!result.success || !result.data) {
    return { success: false, error: result.error }
  }

  // Actualizar estado en la BD
  await supabase
    .from('documento_cargas')
    .update({
      nubox_estado: result.data.estado,
      nubox_respuesta: result.data,
      actualizado_en: new Date().toISOString(),
    })
    .eq('id', documentoId)

  return { success: true, estado: result.data.estado }
}

/**
 * Descargar documento de Nubox (PDF o XML)
 */
export async function descargarDocumentoNubox(
  documentoId: string,
  formato: 'pdf' | 'xml'
): Promise<{ success: boolean; nombreArchivo?: string; error?: string }> {
  const supabase = createClient()
  const nuboxClient = crearClienteNubox()

  if (!nuboxClient) {
    return { success: false, error: 'Cliente Nubox no configurado' }
  }

  // Obtener documento
  const { data: documento, error: docError } = await supabase
    .from('documento_cargas')
    .select('nubox_documento_id, nombre_archivo')
    .eq('id', documentoId)
    .single()

  if (docError || !documento || !documento.nubox_documento_id) {
    return { success: false, error: 'Documento Nubox no encontrado' }
  }

  // Descargar de Nubox
  const result =
    formato === 'pdf'
      ? await nuboxClient.descargarPdf(documento.nubox_documento_id)
      : await nuboxClient.descargarXml(documento.nubox_documento_id)

  if (!result.success || !result.buffer) {
    return { success: false, error: result.error }
  }

  // Guardar en Supabase Storage
  const nombreArchivo = `${documento.nubox_documento_id}.${formato}`
  const rutaAlmacenamiento = `documentos/${documento.nubox_documento_id}/${nombreArchivo}`

  const { error: uploadError } = await supabase.storage
    .from('documentos')
    .upload(rutaAlmacenamiento, result.buffer, {
      upsert: true,
    })

  if (uploadError) {
    return { success: false, error: `Error guardando archivo: ${uploadError.message}` }
  }

  // Actualizar ruta en BD
  await supabase
    .from('documento_cargas')
    .update({
      ruta_almacenamiento: rutaAlmacenamiento,
      actualizado_en: new Date().toISOString(),
    })
    .eq('id', documentoId)

  revalidatePath('/dashboard/documentos')
  return { success: true, nombreArchivo }
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
  const nuboxClient = crearClienteNubox()

  if (!nuboxClient) {
    return { success: false, error: 'Cliente Nubox no configurado' }
  }

  const result = await nuboxClient.listarVentas(filtros)

  if (!result.success) {
    return { success: false, error: result.error }
  }

  return {
    success: true,
    documentos: result.data?.map((doc) => ({
      id: doc.id,
      folio: doc.folio,
      estado: doc.estado,
      estadoSii: doc.estadoSii,
    })),
  }
}

/**
 * Sincronizar documentos desde Nubox a la BD
 * Útil para mantener sincronizado el estado
 */
export async function sincronizarDocumentosNubox(): Promise<{
  success: boolean
  sincronizados: number
  error?: string
}> {
  const supabase = createClient()
  const nuboxClient = crearClienteNubox()

  if (!nuboxClient) {
    return { success: false, sincronizados: 0, error: 'Cliente Nubox no configurado' }
  }

  // Obtener documentos que están en Nubox
  const result = await nuboxClient.listarVentas()

  if (!result.success || !result.data) {
    return { success: false, sincronizados: 0, error: result.error }
  }

  // Actualizar estado de documentos en nuestra BD
  let sincronizados = 0

  for (const doc of result.data) {
    const { error: updateError } = await supabase
      .from('documento_cargas')
      .update({
        nubox_estado: doc.estado,
        nubox_respuesta: doc,
        actualizado_en: new Date().toISOString(),
      })
      .eq('nubox_documento_id', doc.id)

    if (!updateError) {
      sincronizados++
    }
  }

  return { success: true, sincronizados }
}
