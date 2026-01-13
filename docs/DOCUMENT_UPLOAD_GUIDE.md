# Document Upload & Nubox Integration Guide

## Overview

This guide covers the complete document upload workflow and Nubox integration system implemented in HV-Consultores. The system provides:

- **File Upload**: Single and batch document uploads with validation
- **Workflow Tracking**: Complete audit trail of all document changes
- **Approval System**: Multi-step approval before Nubox submission
- **Nubox Integration**: Automatic submission to Nubox for tax filing
- **Status Monitoring**: Real-time status updates and webhooks
- **Search & Filter**: Quick document lookup and filtering

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Frontend (React/Next.js)                               │
│  - Document Upload Form                                 │
│  - Batch Upload                                         │
│  - Document List & Filters                              │
│  - Workflow Timeline                                    │
│  - Approval Dashboard                                   │
└────────────────┬────────────────────────────────────────┘
                 │
┌─────────────────┴────────────────────────────────────────┐
│  Server Actions                                         │
│  - cargarDocumento()                                    │
│  - cambiarEstadoDocumento()                             │
│  - aprobarDocumento() / rechazarDocumento()             │
│  - obtenerDocumentosCargados()                          │
└────────────────┬────────────────────────────────────────┘
                 │
    ┌────────────┴──────────────┐
    │                           │
┌───┴──────────┐         ┌──────┴──────────┐
│ Supabase DB  │         │  Nubox API      │
│ - documento_ │         │  - Emit docs    │
│   cargas     │         │  - Check status │
│ - documento_ │         │  - Get PDF/XML  │
│   workflow   │         └─────────┬────────┘
│ - documento_ │                   │
│   aprobaciones                   │
└──────────────┘         ┌─────────┴────────┐
                         │ Nubox Webhooks   │
                         │ /api/webhooks/   │
                         │ nubox            │
                         └──────────────────┘
```

## Database Schema

### documento_cargas
Main document storage table

```typescript
{
  id: UUID
  cliente_id: UUID (FK clientes)
  nombre_archivo: VARCHAR
  tipo_documento: 'factura' | 'boleta' | 'nota_credito' | 'nota_debito' | 'guia_despacho'
  tamaño_bytes: BIGINT
  hash_archivo: VARCHAR (SHA-256 for deduplication)
  estado: 'pendiente' | 'validado' | 'enviado_nubox' | 'rechazado'

  // Nubox Integration
  nubox_documento_id: VARCHAR
  nubox_estado: VARCHAR
  nubox_respuesta: JSONB

  // File Metadata
  folio_documento: VARCHAR
  fecha_documento: DATE
  monto_total: DECIMAL

  // Tracking
  cargado_por: UUID (FK auth.users)
  cargado_en: TIMESTAMP
  validado_en: TIMESTAMP
  enviado_en: TIMESTAMP
  actualizado_en: TIMESTAMP
}
```

### documento_workflow
Event log for all changes

```typescript
{
  id: UUID
  documento_carga_id: UUID (FK documento_cargas)
  accion: 'subido' | 'validado' | 'rechazado' | 'enviado_nubox' | 'aprobado' | 'error_nubox'
  estado_anterior: VARCHAR
  estado_nuevo: VARCHAR
  realizado_por: UUID (FK auth.users)
  notas: TEXT
  datos_adicionales: JSONB
  creado_en: TIMESTAMP
}
```

### documento_aprobaciones
Approval workflow tracking

```typescript
{
  id: UUID
  documento_carga_id: UUID (FK documento_cargas)
  asignado_a: UUID (FK auth.users)
  estado: 'pendiente' | 'aprobado' | 'rechazado'
  aprobado_en: TIMESTAMP
  razon_rechazo: TEXT
  creado_en: TIMESTAMP
}
```

## Setup Instructions

### 1. Nubox Credentials

**Testing Environment (UAT)**
- Contact: `soporte@nubox.com`
- Request: Testing API keys and credentials
- API URL: `https://api-uat.nubox.com`

**Production Environment**
- Login to your Nubox account
- Go to Settings → API Keys
- Generate new credentials
- API URL: `https://api.nubox.com`

### 2. Environment Variables

Add to `.env.local`:

```bash
# Nubox API Configuration
NUBOX_API_URL=https://api-uat.nubox.com
NUBOX_PARTNER_TOKEN=NP_SECRET_UAT_xxxxxxxxxxxxx
NUBOX_COMPANY_API_KEY=NP_KEY_UAT_xxxxxxxx.xxxxxxxxxx

# Webhook Verification (optional but recommended)
NUBOX_WEBHOOK_SECRET=your_webhook_secret_here
```

### 3. Webhook Configuration

In Nubox Dashboard:
1. Go to Settings → Webhooks
2. Add new webhook endpoint: `https://yourdomain.com/api/webhooks/nubox`
3. Select events: `documento.creado`, `documento.validado`, `documento.rechazado`
4. Copy webhook secret and add to `NUBOX_WEBHOOK_SECRET` in `.env.local`

### 4. Create Storage Bucket (Optional)

For storing downloaded PDFs/XMLs from Nubox:

```sql
-- In Supabase Dashboard or SQL Editor
INSERT INTO storage.buckets (id, name, public)
VALUES ('documentos', 'documentos', false);

-- Set RLS policy
CREATE POLICY "Users can view own bucket documents"
ON storage.objects
FOR SELECT
USING (bucket_id = 'documentos');
```

## Usage

### For Regular Users

#### Upload Single Document
1. Go to **Documentos** → **Cargar Documento**
2. Select document type (Factura, Boleta, etc.)
3. (Optional) Enter folio, date, amount
4. Select file (PDF, JPG, PNG, TIFF - max 50MB)
5. Click "Cargar Documento"

#### Upload Multiple Documents (Batch)
1. Go to **Documentos** → **Carga en Lote**
2. Drag & drop multiple files or click to select
3. Documents upload sequentially with progress tracking
4. View upload status for each file

#### Monitor Documents
1. Go to **Documentos** → **Documentos**
2. View all uploaded documents with status
3. Use search to find by filename or folio
4. Filter by status or document type
5. Click document to see full details and workflow history

### For Approvers/Managers

#### Review Pending Documents
1. Go to **Documentos** → **Aprobaciones**
2. View all documents waiting for approval
3. Review document metadata
4. Click ✓ to approve or ✗ to reject
5. If rejecting, enter rejection reason

#### Send Approved Document to Nubox
1. From document details page
2. Ensure document is in "Validado" status
3. Click "Enviar a Nubox"
4. System automatically submits to Nubox API

#### Check Nubox Status
1. From document details page
2. Click "Actualizar Estado"
3. System polls Nubox for latest validation status
4. Status updates automatically via webhooks

## API Endpoints

### Document Upload
```typescript
POST /app/dashboard/documentos/actions
cargarDocumento(
  clienteId: string,
  tipoDocumento: string,
  archivoBytes: ArrayBuffer,
  nombreArchivo: string,
  metadatos?: {
    folioDocumento?: string
    fechaDocumento?: string
    montoTotal?: number
  }
): Promise<{ success: boolean; documentoId?: string; error?: string }>
```

### Nubox Integration
```typescript
POST /app/dashboard/documentos/nubox-actions
enviarDocumentoANubox(
  documentoId: string,
  datosFactura: {
    folio: string
    fechaEmision: string
    montoTotal: number
    // ... more fields
  }
): Promise<{ success: boolean; nuboxId?: string; error?: string }>

GET /app/dashboard/documentos/nubox-actions
obtenerEstadoNubox(documentoId: string)
```

### Webhook
```
POST /api/webhooks/nubox
Receives: NuboxWebhookPayload
{
  id: string
  type: 'documento.creado' | 'documento.validado' | 'documento.rechazado'
  timestamp: string
  data: {
    documento_id: string
    estado: string
    // ... more data
  }
}
```

## Complete Document Workflow

```
1. User Uploads File
   └─> Validate file (type, size, hash)
   └─> Create documento_cargas record
   └─> Log "subido" event in workflow

2. File Review (Optional)
   └─> Assign to approver
   └─> Approver reviews documento_aprobaciones

3. Approval Decision
   ├─ Approve → Change estado to "validado"
   └─ Reject → Change estado to "rechazado"

4. User Submits to Nubox
   └─> enviarDocumentoANubox()
   └─> Nubox validates with SII (async)
   └─> Return documento_id
   └─> Update estado to "enviado_nubox"

5. Nubox Processes (Background)
   └─> SII validation in progress
   └─> Document status changes (validado/rechazado)
   └─> Nubox sends webhook

6. Webhook Received
   └─> /api/webhooks/nubox
   └─> Verify signature
   └─> Update documento_cargas
   └─> Create workflow event
   └─> Send notification to user

7. User Downloads Results (Optional)
   └─> Download PDF from Nubox
   └─> Download XML from Nubox
   └─> Store in Supabase Storage
```

## Security Features

### Row-Level Security (RLS)
- Users only see documents from their assigned clients
- Admins see all documents
- Approvers can only approve documents assigned to them
- Document workflow/approvals filtered by document access

### File Validation
- Type checking (PDF, JPG, PNG, TIFF only)
- Size limit (50MB max)
- SHA-256 hash for deduplication
- Prevents duplicate uploads

### Webhook Security
- HMAC-SHA256 signature verification
- Only Nubox can trigger status updates
- Validates `X-Nubox-Signature` header

### Data Protection
- Encrypted credential storage
- Secure Supabase Storage buckets
- Audit trail of all changes
- Workflow events logged

## Error Handling

### Common Errors

**"Archivo demasiado grande"**
- Max file size: 50MB
- Compress or split large files

**"Este archivo ya fue cargado"**
- File deduplication by hash
- Same file cannot be uploaded twice
- Delete previous version if needed

**"Credenciales de Nubox no configuradas"**
- Check `.env.local` for Nubox variables
- Verify `NUBOX_PARTNER_TOKEN` and `NUBOX_COMPANY_API_KEY`

**"Error validando documento en Nubox"**
- Verify document data (dates, amounts, RUTs)
- Check Nubox API status
- Review Nubox error response in workflow

### Monitoring

View error details in:
- **Document Details** → **Historial de Actividad**
- **Workflow Timeline** shows all errors and their reasons
- Check `nubox_respuesta` JSONB field for Nubox error details

## Testing

### Unit Test Document Submission
1. Go to `/dashboard/documentos?cliente_id=<test-client-id>`
2. Upload test PDF with sample data
3. Verify document appears in list (estado: "pendiente")
4. Click to view details
5. In "Estado Nubox" card, verify "No enviado a Nubox"

### Test Approval Flow
1. Go to `/dashboard/documentos/aprobaciones`
2. See pending documents
3. Click ✓ to approve
4. Verify estado changed to "validado"

### Test Nubox Submission
1. After approval, click "Enviar a Nubox"
2. Verify estado changed to "enviado_nubox"
3. Check `nubox_documento_id` populated
4. Click "Actualizar Estado" to check progress

### Test Webhook (Optional)
```bash
# Test webhook endpoint
curl -X POST http://localhost:3000/api/webhooks/nubox \
  -H "Content-Type: application/json" \
  -H "X-Nubox-Signature: <valid-hmac>" \
  -d '{
    "id": "webhook_123",
    "type": "documento.validado",
    "timestamp": "2026-01-11T00:00:00Z",
    "data": {
      "documento_id": "<nubox-doc-id>",
      "estado": "validado"
    }
  }'
```

## Troubleshooting

### Documents Not Appearing
1. Check if user is assigned to correct client
2. Verify RLS policies are enabled
3. Check browser console for errors

### Nubox Not Processing
1. Verify Nubox credentials in `.env.local`
2. Check Nubox API status page
3. Review document data for errors
4. Check `nubox_respuesta` in database

### Webhooks Not Updating
1. Verify `NUBOX_WEBHOOK_SECRET` configured
2. Check webhook endpoint is publicly accessible
3. Verify webhook URL in Nubox dashboard settings
4. Review server logs for webhook errors

## Performance Optimization

- Documents indexed by `cliente_id` and `estado` for fast queries
- Hash-based deduplication prevents storage bloat
- Async Nubox processing doesn't block user
- Batch upload uses sequential processing with progress
- Search uses ILIKE for case-insensitive matching

## Future Enhancements

- [ ] OCR for document text extraction
- [ ] Automatic document classification
- [ ] Receipt/document image recognition
- [ ] Bulk actions (approve/reject multiple)
- [ ] Document templates with pre-filled data
- [ ] Export to Excel/CSV
- [ ] Document archival after N days
- [ ] Integration with accounting software

## Support

For issues with:
- **Document Upload**: Check file format and size
- **Nubox Integration**: Visit https://developers.nubox.com/api-docs
- **Database**: Check Supabase logs
- **Webhooks**: Verify signature and endpoint access

Contact Nubox support at `soporte@nubox.com` for API-specific issues.
