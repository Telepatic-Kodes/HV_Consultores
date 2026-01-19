/**
 * Nubox Webhook Handler
 * Receives status updates from Nubox when documents are processed
 */

import { createClient } from '@/lib/supabase-server'
import { headers } from 'next/headers'
import crypto from 'crypto'

interface NuboxWebhookPayload {
  id: string
  type: string // 'documento.creado', 'documento.validado', 'documento.rechazado'
  timestamp: string
  data: {
    documento_id: string
    folio: string
    estado: string
    estado_sii: string
    pdf_url?: string
    xml_url?: string
    errores?: Array<{
      codigo: string
      mensaje: string
    }>
  }
}

/**
 * Verify Nubox webhook signature
 * Nubox sends an X-Nubox-Signature header with HMAC-SHA256 hash
 */
function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const hash = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex')

  return hash === signature
}

/**
 * Handle Nubox webhook
 */
export async function POST(request: Request) {
  try {
    // Get raw body for signature verification
    const body = await request.text()
    const payload: NuboxWebhookPayload = JSON.parse(body)

    // Verify webhook signature
    const signature = request.headers.get('x-nubox-signature')
    const webhookSecret = process.env.NUBOX_WEBHOOK_SECRET

    if (!webhookSecret) {
      console.warn('NUBOX_WEBHOOK_SECRET not configured')
      return new Response(
        JSON.stringify({ error: 'Webhook secret not configured' }),
        { status: 500 }
      )
    }

    if (!signature || !verifyWebhookSignature(body, signature, webhookSecret)) {
      console.error('Invalid webhook signature')
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        { status: 401 }
      )
    }

    const supabase = createClient()

    // Find document by Nubox ID
    const { data: documentoData, error: findError } = await (supabase as any)
      .from('documento_cargas')
      .select('*')
      .eq('nubox_documento_id', payload.data.documento_id)
      .single()

    if (findError) {
      console.error('Document not found:', findError)
      return new Response(
        JSON.stringify({ error: 'Document not found' }),
        { status: 404 }
      )
    }

    if (!documentoData) {
      return new Response(
        JSON.stringify({ error: 'Document not found' }),
        { status: 404 }
      )
    }

    const documento = documentoData as {
      id: string
      estado: string
      cargado_por: string
      folio_documento?: string
    }

    // Determine new state based on webhook type
    let estadoNuevo = documento.estado
    let accion = ''

    switch (payload.type) {
      case 'documento.validado':
        estadoNuevo = 'validado'
        accion = 'aprobado'
        break
      case 'documento.rechazado':
        estadoNuevo = 'rechazado'
        accion = 'error_nubox'
        break
      case 'documento.creado':
        accion = 'enviado_nubox'
        break
    }

    // Update documento status
    const { error: updateError } = await (supabase as any)
      .from('documento_cargas')
      .update({
        nubox_estado: payload.data.estado,
        nubox_respuesta: payload.data,
        estado: estadoNuevo,
        actualizado_en: new Date().toISOString(),
      })
      .eq('id', documento.id)

    if (updateError) {
      console.error('Error updating documento:', updateError)
      return new Response(
        JSON.stringify({ error: 'Error updating document' }),
        { status: 500 }
      )
    }

    // Log workflow event
    if (accion) {
      const { error: workflowError } = await (supabase as any)
        .from('documento_workflow')
        .insert({
          documento_carga_id: documento.id,
          accion: accion,
          estado_anterior: documento.estado,
          estado_nuevo: estadoNuevo,
          realizado_por: documento.cargado_por, // System action, use uploader as "performer"
          notas: `Webhook de Nubox: ${payload.type}`,
          datos_adicionales: {
            webhook_id: payload.id,
            nubox_estado: payload.data.estado,
            errores: payload.data.errores,
          },
        })

      if (workflowError) {
        console.error('Error logging workflow:', workflowError)
      }
    }

    // Create notification for user
    const { error: notifError } = await supabase
      .from('notificaciones')
      .insert({
        usuario_id: documento.cargado_por,
        tipo: payload.type === 'documento.rechazado' ? 'error' : 'success',
        titulo: `Documento ${documento.folio_documento || 'sin folio'} - ${payload.type}`,
        mensaje: `Tu documento ha sido ${
          payload.type === 'documento.validado'
            ? 'validado exitosamente'
            : payload.type === 'documento.rechazado'
              ? 'rechazado'
              : 'procesado'
        } por Nubox. Estado: ${payload.data.estado}`,
        link: `/dashboard/documentos/${documento.id}`,
      })

    if (notifError) {
      console.error('Error creating notification:', notifError)
    }

    // Return success
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Webhook processed successfully',
        documento_id: documento.id,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

/**
 * Health check for webhook endpoint
 */
export async function GET() {
  return new Response(
    JSON.stringify({
      status: 'ok',
      message: 'Nubox webhook endpoint is ready to receive webhooks',
      endpoint: '/api/webhooks/nubox',
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  )
}
