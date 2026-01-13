# Nubox Webhook API Documentation

## Overview

Nubox webhooks allow your application to receive real-time updates when document status changes. This enables automatic status synchronization without requiring polling.

## Webhook Endpoint

```
POST https://yourdomain.com/api/webhooks/nubox
```

## Authentication

### Signature Verification

Every webhook request includes an `X-Nubox-Signature` header containing an HMAC-SHA256 hash of the request body.

**To verify the signature:**

```typescript
import crypto from 'crypto'

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

// Usage
const isValid = verifyWebhookSignature(
  requestBody,
  request.headers.get('x-nubox-signature'),
  process.env.NUBOX_WEBHOOK_SECRET
)
```

**Configuration:**

```bash
# .env.local
NUBOX_WEBHOOK_SECRET=your_webhook_secret_from_nubox
```

## Request Headers

```
Content-Type: application/json
X-Nubox-Signature: sha256=<hmac_hash>
X-Nubox-Timestamp: 2026-01-11T12:00:00Z
```

## Request Payload

### Example Webhook Payload

```json
{
  "id": "webhook_evt_12345678",
  "type": "documento.validado",
  "timestamp": "2026-01-11T12:00:00Z",
  "data": {
    "documento_id": "DOC_123456",
    "folio": "1000001",
    "estado": "validado",
    "estado_sii": "aceptado",
    "pdf_url": "https://api.nubox.com/v1/sales/DOC_123456/pdf",
    "xml_url": "https://api.nubox.com/v1/sales/DOC_123456/xml",
    "errores": null
  }
}
```

### Payload Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique webhook event ID |
| `type` | string | Event type (see below) |
| `timestamp` | string | ISO 8601 timestamp |
| `data.documento_id` | string | Nubox document ID |
| `data.folio` | string | Document folio number |
| `data.estado` | string | Current document status |
| `data.estado_sii` | string | SII validation status |
| `data.pdf_url` | string | URL to download PDF |
| `data.xml_url` | string | URL to download XML |
| `data.errores` | array | Array of error objects (if applicable) |

## Webhook Event Types

### 1. `documento.creado`
Triggered when a document is successfully created in Nubox.

**Status**: Document is now in Nubox, awaiting SII validation

**Payload**:
```json
{
  "type": "documento.creado",
  "data": {
    "documento_id": "DOC_123456",
    "estado": "creado",
    "folio": "1000001"
  }
}
```

**Action**: Update document status to `enviado_nubox`

---

### 2. `documento.validado`
Triggered when Nubox validates the document with SII and it passes validation.

**Status**: Document is valid and accepted by SII

**Payload**:
```json
{
  "type": "documento.validado",
  "data": {
    "documento_id": "DOC_123456",
    "estado": "validado",
    "estado_sii": "aceptado",
    "pdf_url": "https://...",
    "xml_url": "https://..."
  }
}
```

**Action**: Update document status to `validado`, notify user

---

### 3. `documento.rechazado`
Triggered when the document fails SII validation.

**Status**: Document was rejected by SII

**Payload**:
```json
{
  "type": "documento.rechazado",
  "data": {
    "documento_id": "DOC_123456",
    "estado": "rechazado",
    "estado_sii": "rechazado",
    "errores": [
      {
        "codigo": "RUT_INVALID",
        "mensaje": "RUT del receptor es inválido"
      }
    ]
  }
}
```

**Action**: Update document status to `rechazado`, notify user with error details

---

### 4. `documento.aclarado`
Triggered when a document requires clarification from SII.

**Status**: Waiting for SII response

**Payload**:
```json
{
  "type": "documento.aclarado",
  "data": {
    "documento_id": "DOC_123456",
    "estado": "aclarado",
    "estado_sii": "aclarado"
  }
}
```

**Action**: Update document status, notify user

---

## Response Format

### Successful Response

Your endpoint should return a `200 OK` response with the following JSON:

```json
{
  "success": true,
  "message": "Webhook processed successfully",
  "documento_id": "doc_uuid_here"
}
```

**Example**:
```typescript
return new Response(
  JSON.stringify({
    success: true,
    message: 'Webhook processed successfully',
    documento_id: documento.id,
  }),
  { status: 200, headers: { 'Content-Type': 'application/json' } }
)
```

### Error Response

Return appropriate HTTP status codes:

- `400`: Invalid payload/signature
- `404`: Document not found
- `500`: Server error

**Example**:
```json
{
  "error": "Document not found",
  "codigo": "DOC_NOT_FOUND"
}
```

---

## Implementation Example

### Complete Webhook Handler

```typescript
// app/api/webhooks/nubox/route.ts

import { createClient } from '@/lib/supabase-server'
import crypto from 'crypto'

interface NuboxWebhookPayload {
  id: string
  type: string
  timestamp: string
  data: {
    documento_id: string
    folio: string
    estado: string
    estado_sii: string
    pdf_url?: string
    xml_url?: string
    errores?: Array<{ codigo: string; mensaje: string }>
  }
}

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

export async function POST(request: Request) {
  try {
    // Get raw body
    const body = await request.text()
    const payload: NuboxWebhookPayload = JSON.parse(body)

    // Verify signature
    const signature = request.headers.get('x-nubox-signature')
    const secret = process.env.NUBOX_WEBHOOK_SECRET

    if (!secret || !signature) {
      return new Response(
        JSON.stringify({ error: 'Missing webhook secret or signature' }),
        { status: 500 }
      )
    }

    if (!verifyWebhookSignature(body, signature, secret)) {
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        { status: 401 }
      )
    }

    // Create Supabase client
    const supabase = createClient()

    // Find document
    const { data: documento } = await supabase
      .from('documento_cargas')
      .select('*')
      .eq('nubox_documento_id', payload.data.documento_id)
      .single()

    if (!documento) {
      return new Response(
        JSON.stringify({ error: 'Document not found' }),
        { status: 404 }
      )
    }

    // Update documento status
    let estadoNuevo = documento.estado
    let accion = payload.type

    switch (payload.type) {
      case 'documento.validado':
        estadoNuevo = 'validado'
        break
      case 'documento.rechazado':
        estadoNuevo = 'rechazado'
        break
    }

    await supabase
      .from('documento_cargas')
      .update({
        nubox_estado: payload.data.estado,
        nubox_respuesta: payload.data,
        estado: estadoNuevo,
        actualizado_en: new Date().toISOString(),
      })
      .eq('id', documento.id)

    // Log workflow event
    await supabase
      .from('documento_workflow')
      .insert({
        documento_carga_id: documento.id,
        accion,
        estado_anterior: documento.estado,
        estado_nuevo: estadoNuevo,
        realizado_por: documento.cargado_por,
        notas: `Webhook: ${payload.type}`,
        datos_adicionales: { webhook_id: payload.id },
      })

    // Send notification
    await supabase
      .from('notificaciones')
      .insert({
        usuario_id: documento.cargado_por,
        tipo: payload.type === 'documento.rechazado' ? 'error' : 'success',
        titulo: `Documento ${documento.folio_documento}`,
        mensaje: `Estado actualizado: ${payload.data.estado}`,
        link: `/dashboard/documentos/${documento.id}`,
      })

    return new Response(
      JSON.stringify({
        success: true,
        documento_id: documento.id,
      }),
      { status: 200 }
    )
  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500 }
    )
  }
}

export async function GET() {
  return new Response(
    JSON.stringify({
      status: 'ok',
      message: 'Nubox webhook endpoint ready',
    }),
    { status: 200 }
  )
}
```

---

## Setup Instructions

### 1. Configure Environment Variable

Add to `.env.local`:
```bash
NUBOX_WEBHOOK_SECRET=your_secret_from_nubox
```

### 2. Register Webhook in Nubox

1. Login to Nubox dashboard
2. Go to **Settings** → **Webhooks**
3. Click **Add Webhook**
4. Enter URL: `https://yourdomain.com/api/webhooks/nubox`
5. Select events:
   - ☑ documento.creado
   - ☑ documento.validado
   - ☑ documento.rechazado
   - ☑ documento.aclarado (optional)
6. Copy the **Webhook Secret**
7. Add to `.env.local` as `NUBOX_WEBHOOK_SECRET`

### 3. Test Webhook

```bash
# Test endpoint is accessible
curl -X GET https://yourdomain.com/api/webhooks/nubox

# Should return 200 OK with status message
```

---

## Retry Policy

### Nubox Retry Behavior

Nubox retries failed webhooks with exponential backoff:
- Initial attempt: Immediate
- Retry 1: 5 minutes
- Retry 2: 30 minutes
- Retry 3: 2 hours
- Retry 4: 24 hours

**Max retries**: 4 attempts over 24 hours

### Your Response Requirements

Endpoint must:
- ✅ Respond within **30 seconds**
- ✅ Return HTTP `2xx` status on success
- ✅ Verify signature before processing
- ✅ Be idempotent (safe to process same event twice)

### Idempotency

To handle retries safely:

```typescript
// Check if webhook already processed
const { data: existingEvent } = await supabase
  .from('webhook_events')
  .select('*')
  .eq('webhook_id', payload.id)
  .single()

if (existingEvent) {
  // Already processed, return success
  return new Response(
    JSON.stringify({ success: true, duplicate: true }),
    { status: 200 }
  )
}

// Process webhook...

// Log processed webhook
await supabase
  .from('webhook_events')
  .insert({
    webhook_id: payload.id,
    tipo: payload.type,
    procesado_en: new Date().toISOString(),
  })
```

---

## Monitoring & Debugging

### Check Webhook Status

In Nubox Dashboard → **Webhooks**:
- View delivery history
- See HTTP response codes
- Check retry attempts

### Enable Webhook Logging

```typescript
// Log all webhooks
console.log('Webhook received:', {
  type: payload.type,
  documentoId: payload.data.documento_id,
  timestamp: payload.timestamp,
  signature: signature.substring(0, 20) + '...',
})
```

### Test with Sample Payload

```bash
#!/bin/bash

WEBHOOK_SECRET="your_secret"
PAYLOAD='{"id":"test_123","type":"documento.validado","timestamp":"2026-01-11T12:00:00Z","data":{"documento_id":"DOC_123","folio":"1000001","estado":"validado"}}'

SIGNATURE=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "$WEBHOOK_SECRET" -hex | cut -d' ' -f2)

curl -X POST https://yourdomain.com/api/webhooks/nubox \
  -H "Content-Type: application/json" \
  -H "X-Nubox-Signature: sha256=$SIGNATURE" \
  -d "$PAYLOAD"
```

---

## Error Handling

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `Invalid signature` | Wrong secret | Verify `NUBOX_WEBHOOK_SECRET` |
| `Document not found` | Document deleted | Implement graceful handling |
| `Timeout (30s+)` | Slow processing | Optimize database queries |
| `500 Server Error` | Unexpected error | Check server logs |

### Best Practices

1. **Always verify signature** - Ensure only Nubox can trigger updates
2. **Use transactions** - Atomic document + workflow + notification updates
3. **Handle duplicates** - Process same webhook safely multiple times
4. **Log everything** - Maintain audit trail of webhook processing
5. **Monitor delivery** - Setup alerts for failed webhooks
6. **Fast response** - Return success before doing heavy work
7. **Queue processing** - Use background jobs for long operations

---

## Examples

### Handle Document Validation

```typescript
// When documento.validado webhook received
case 'documento.validado': {
  // 1. Update document status
  await updateDocumento(docId, { estado: 'validado' })

  // 2. Download PDF & XML if available
  if (payload.data.pdf_url) {
    await downloadAndStore(payload.data.pdf_url, 'pdf')
  }

  // 3. Create audit log
  await logWorkflow({
    accion: 'validado_nubox',
    notas: 'Documento validado por SII',
  })

  // 4. Notify user
  await createNotification({
    titulo: 'Documento Validado',
    mensaje: `Tu documento ${folio} fue validado correctamente`,
  })

  break
}
```

### Handle Document Rejection

```typescript
// When documento.rechazado webhook received
case 'documento.rechazado': {
  // 1. Update status
  await updateDocumento(docId, { estado: 'rechazado' })

  // 2. Extract error details
  const errores = payload.data.errores?.map(e => e.mensaje).join('\n')

  // 3. Log with errors
  await logWorkflow({
    accion: 'rechazado',
    notas: `Errores: ${errores}`,
    datos_adicionales: { errores: payload.data.errores },
  })

  // 4. Alert user
  await createNotification({
    tipo: 'error',
    titulo: 'Documento Rechazado',
    mensaje: `Tu documento fue rechazado. Razón: ${errores}`,
  })

  break
}
```

---

## Troubleshooting

### Webhooks Not Triggering?

1. Verify endpoint is **publicly accessible**
   ```bash
   curl https://yourdomain.com/api/webhooks/nubox
   ```

2. Check webhook configuration in Nubox Dashboard
   - Correct URL?
   - Events selected?
   - Webhook active?

3. Review delivery logs
   - HTTP response code?
   - Signature verification passed?
   - Any errors in response?

### Signature Verification Failing?

1. Verify secret is correct
   ```bash
   echo $NUBOX_WEBHOOK_SECRET
   ```

2. Ensure using **raw request body** (not parsed JSON)
   ```typescript
   const body = await request.text() // ✅ Raw body
   // NOT
   const body = await request.json() // ❌ Parsed
   ```

3. Check character encoding is UTF-8

### Document Not Found?

1. Verify Nubox ID matches database
   ```sql
   SELECT * FROM documento_cargas
   WHERE nubox_documento_id = 'incoming_id'
   ```

2. Document might have been deleted
   - Implement graceful 404 handling
   - Return success to prevent retries

---

## Support

For issues with:
- **Webhook delivery**: Check Nubox Dashboard webhook logs
- **Signature verification**: Review secret & hashing algorithm
- **Document sync**: Verify document exists in database
- **General questions**: Contact Nubox support at `soporte@nubox.com`

**Last Updated**: 2026-01-11
