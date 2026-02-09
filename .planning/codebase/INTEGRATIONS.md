# External Integrations

**Analysis Date:** 2026-02-09

## APIs & External Services

**Document Management (Nubox):**
- Nubox - Electronic invoice/document issuance and validation
  - SDK/Client: Custom REST client at `src/lib/nubox.ts`
  - Auth: Bearer token via `NUBOX_PARTNER_TOKEN` and `NUBOX_COMPANY_API_KEY`
  - Webhook endpoint: `POST /api/webhooks/nubox`
  - Signature verification: HMAC-SHA256 via `x-nubox-signature` header
  - Base URL: `process.env.NUBOX_API_URL` (defaults to https://api.nubox.com)
  - Functions:
    - Document issuance: `POST /v1/sales/issuance`
    - Document status: `GET /v1/sales/{documentoId}`
    - PDF download: `GET /v1/sales/{documentoId}/pdf`
    - XML download: `GET /v1/sales/{documentoId}/xml`
    - List sales: `GET /v1/sales` with filters

**AI & Language Models:**
- OpenAI - GPT integration for document analysis and chat
  - SDK: `openai` package 6.16.0
  - Auth: API key via `OPENAI_API_KEY`
  - Model used: `gpt-4o-mini` (economical variant)
  - Functions: Chat completions, embeddings for RAG
  - Integration points:
    - Chat service: `src/lib/openai.ts`
    - Document classification: `src/app/dashboard/clasificador/actions.ts`
    - RAG search: Semantic document search via embeddings

**RPA Automation:**
- SII Portal (Chilean Tax Authority) - RPA automation for tax documents
  - Server: Separate Node.js process in `rpa-server/`
  - Authentication methods:
    - RUT + password
    - Clave Única (national digital ID)
    - Digital certificate
  - Webhook callback: `POST /api/sii-rpa/webhook`
  - Supported tasks:
    - Portal login validation
    - F29 form download and submission
    - Libro de Compras (purchase register) extraction
    - Libro de Ventas (sales register) extraction
    - Financial status queries
  - Browser automation: Playwright + stealth mode
  - Execution management: Job queue in Supabase

**Bank Integration:**
- Bank RPA automation for transaction reconciliation
  - Supported banks: Banco Chile (configured)
  - Extracts: Transaction data, balance information
  - File parsing: Excel and PDF support
  - Normalization: Statement reconciliation with company records
  - Implementation: `src/lib/bank-rpa/`

## Data Storage

**Databases:**
- PostgreSQL (Supabase managed)
  - Connection: `NEXT_PUBLIC_SUPABASE_URL`
  - Client: `@supabase/supabase-js` and `@supabase/auth-helpers-*`
  - Schema management: Migrations in `src/migrations/`
  - Tables (partial list):
    - `documento_cargas` - Document uploads with Nubox tracking
    - `documento_workflow` - Document state transitions
    - `sii_jobs` - RPA job queue and execution history
    - `sii_execution_steps` - Task step-by-step execution logs
    - `credenciales_portales` - Stored portal credentials (SII, banks)
    - `notificaciones` - In-app notifications
    - `usuarios` - User accounts (via Supabase Auth)
    - `alertas_reglas` - Alert configuration rules
    - `reportes_cronograma` - Scheduled report definitions
    - `documentos_conocimiento` - RAG knowledge base for chat
    - Analytics tables for compliance, automation metrics

**File Storage:**
- Supabase Cloud Storage - Document and PDF file storage
  - Endpoint: `gifmgwaogpamdeeiymup.supabase.co/storage/v1/object/public/**`
  - Accessible via Next.js image optimization in `next.config.js`
  - Document types: PDF, XML, Excel files
  - Upload handling: `src/app/dashboard/documentos/actions.ts`

**Caching:**
- Redis-like queue (via Supabase RPC and direct queries)
  - No external Redis deployed currently
  - Queue implementation: `src/lib/queue.ts`

## Authentication & Identity

**Auth Provider:**
- Supabase Auth - User authentication and session management
  - Implementation: SSR helpers at `src/lib/supabase-server.ts` and `src/lib/supabase-browser.ts`
  - Session strategy: Cookie-based with httpOnly flags
  - Protected routes: Next.js middleware at `src/middleware.ts`
  - Sign-in: `src/app/(auth)/login/page.tsx`
  - Sign-up: `src/app/(auth)/registro/page.tsx`

**Portal Credentials:**
- RPA server handles portal-specific authentication
  - Storage: Encrypted in Supabase (via `credenciales_portales` table)
  - Auth methods: RUT+password, Clave Única, digital certificates
  - Validation: Login test jobs to verify credential validity

## Monitoring & Observability

**Error Tracking:**
- Winston logger - Structured logging in RPA server
  - Config: `rpa-server/src/utils/logger.ts`
  - Log levels: error, warn, info, debug
  - Console output in development

**Logs:**
- Console logging for Next.js app
- File logging: RPA server logs via Winston
- Database logs: Job execution steps stored in `sii_execution_steps` table
- Error tracking: Error messages stored in SII jobs and documents

## CI/CD & Deployment

**Hosting:**
- Vercel (recommended for Next.js frontend)
- Separate Node.js hosting for RPA server (self-hosted or Docker)

**CI Pipeline:**
- Not detected in codebase (may be external)

## Environment Configuration

**Required env vars:**

**Frontend (Next.js):**
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL (public)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase public key (public)
- `SUPABASE_SERVICE_ROLE_KEY` - Service role for admin operations (secret)
- `OPENAI_API_KEY` - OpenAI API key (secret)
- `NUBOX_API_URL` - Nubox API base URL
- `NUBOX_PARTNER_TOKEN` - Nubox partner token (secret)
- `NUBOX_COMPANY_API_KEY` - Nubox company key (secret)
- `NUBOX_WEBHOOK_SECRET` - Webhook signature secret (secret)
- `WEBHOOK_SECRET` - General webhook authentication (secret)
- `NEXT_PUBLIC_APP_URL` - Frontend base URL
- Email provider config (provider-specific)
- RPA server webhook URL for callbacks

**RPA Server:**
- `PORT` - Server port (default 3001)
- `SERVER_NAME` - Identifier for this RPA instance
- `NODE_ENV` - Environment (development/production)
- `SUPABASE_URL` - Supabase URL
- `SUPABASE_SERVICE_KEY` - Service role key
- Similar credential storage for Nubox, webhook secret

**Secrets location:**
- Development: `.env` file (local, not committed)
- Production: Environment variables in deployment platform
- Example configs: `.env.example` and `.env.production.example`

## Webhooks & Callbacks

**Incoming:**
- `POST /api/webhooks/nubox` - Document status updates from Nubox
  - Payload: Document state changes, validation results, errors
  - Signature: HMAC-SHA256 verification
  - Triggers: Document validation, rejection, creation events
  - Response handling: Updates `documento_cargas` and creates workflow events

- `POST /api/sii-rpa/webhook` - RPA job completion/failure updates
  - Payload: Job ID, event type (started, step_completed, completed, failed)
  - Auth: Bearer token via `Authorization` header
  - Triggers: Job lifecycle events from RPA server
  - Updates: SII job status, execution steps, credential validation status

**Outgoing:**
- Webhook delivery to configured endpoints from alert rules
  - Implementation: `src/lib/services/alertRuleEngine.ts`
  - Payload: Alert events, document state changes
  - Signature: Custom HMAC-SHA256 signing in `src/lib/external-services.ts`

- Report delivery webhooks
  - Implementation: `src/lib/services/reportGenerator.ts`
  - Payload: Generated report data
  - Recipients: Configured in `reportes_cronograma` table

**Email Integration:**
- Multiple provider support via `src/lib/external-services.ts`
  - Providers: SMTP, SendGrid, AWS SES, Mailgun
  - Configuration: Environment variables determine active provider
  - Use cases: Report delivery, alert notifications, user notifications
  - From address: `process.env.EMAIL_FROM_ADDRESS` (default: noreply@hv-consultores.com)

**Slack Integration:**
- Slack webhook support via `src/lib/external-services.ts`
  - Webhook URL: `SLACK_WEBHOOK_URL` environment variable
  - Message blocks: Rich formatting support (headers, sections, context)
  - Use cases: Alert notifications, report summaries, task completion

## Queue & Job Processing

**Job Queue:**
- Supabase-based queue implementation: `src/lib/queue.ts`
- Job types:
  - `sii_rpa` - Portal automation tasks
  - `nubox_document` - Document submission
  - `report_generation` - Scheduled reports
  - `alert_evaluation` - Alert rule processing
- Storage: `sii_jobs` table with status tracking
- Execution: Consumed by RPA server via polling or push

## Document Processing

**PDF Parsing:**
- `pdf-parse` 2.4.5 - Text extraction from PDF files
- `jspdf` 4.0.0 - PDF generation for reports
- `jspdf-autotable` 5.0.7 - Table generation in PDFs

**Excel Processing:**
- `xlsx` 0.18.5 - Read/write Excel files for bank statements and reports
- Parser: `src/lib/bank-rpa/parsers/excel-parser.ts`

**File Download/Upload:**
- File Saver - Browser-side file operations
- Supabase Storage - Server-side file persistence

---

*Integration audit: 2026-02-09*
