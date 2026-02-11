/**
 * Nubox Webhook Handler
 * Receives status updates from Nubox when documents are processed
 */

import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
// TODO: Phase 2 - Implement document status updates via Convex mutations

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
export async function POST(request: NextRequest) {
  try {
    // Get raw body for signature verification
    const body = await request.text()
    const payload: NuboxWebhookPayload = JSON.parse(body)

    // Verify webhook signature
    const signature = request.headers.get('x-nubox-signature')
    const webhookSecret = process.env.NUBOX_WEBHOOK_SECRET

    if (!webhookSecret) {
      console.warn('NUBOX_WEBHOOK_SECRET not configured')
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      )
    }

    if (!signature || !verifyWebhookSignature(body, signature, webhookSecret)) {
      console.error('Invalid webhook signature')
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      )
    }

    // TODO: Phase 2 - Implement via Convex mutations:
    // 1. Find document by Nubox ID in Convex
    // 2. Update documento_cargas status
    // 3. Log workflow event in documento_workflow
    // 4. Create notification for user

    console.log(`[Nubox Webhook] Received event: ${payload.type} for documento: ${payload.data.documento_id}`)

    return NextResponse.json(
      {
        success: true,
        message: 'Webhook received - pending Convex migration for persistence',
        documento_id: payload.data.documento_id,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 400 }
    )
  }
}

/**
 * Health check for webhook endpoint
 */
export async function GET() {
  return NextResponse.json(
    {
      status: 'ok',
      message: 'Nubox webhook endpoint is ready to receive webhooks',
      endpoint: '/api/webhooks/nubox',
    },
    { status: 200 }
  )
}
