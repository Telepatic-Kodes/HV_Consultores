# Phase 6: Automation & Advanced Integration - Design Document

**Phase**: 6 (Automation & Advanced Integration)
**Status**: DESIGN PHASE
**Target Completion**: 2026-01-11
**Complexity Level**: ADVANCED

---

## Overview

Phase 6 adds intelligent automation, advanced notification systems, and external integrations to the HV-Consultores platform. This phase enables the system to proactively manage document lifecycle events, send timely notifications, and integrate with popular communication and business tools.

**Key Objectives:**
1. Automate document retention policy execution
2. Implement comprehensive notification system (Email, Slack, In-App)
3. Enable external system integrations (webhooks)
4. Add batch operation capabilities
5. Create alert and monitoring system
6. Implement scheduled job processing

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│              Automation & Integration Layer                  │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │ Auto-Execute │    │   Alerts &   │    │  External    │  │
│  │   Engine     │    │ Notifications│    │ Integrations │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│         │                   │                    │            │
│         ├─ Archive          ├─ Email            ├─ Slack     │
│         ├─ Delete           ├─ Slack            ├─ Webhooks  │
│         ├─ Notify           ├─ In-App           ├─ Teams     │
│         └─ Track            └─ Push (future)    └─ Custom    │
│                                                               │
├─────────────────────────────────────────────────────────────┤
│              Batch Operations & Job Queue                    │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │ Batch Email  │    │ Batch Archive│    │   Job Queue  │  │
│  │ Distribution │    │   / Delete   │    │  & Scheduler │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│                                                               │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
        ┌───────────────────────────────────┐
        │   Phase 5 Compliance Core          │
        │   (Retention, Reports, Audit)      │
        └───────────────────────────────────┘
```

---

## Feature 1: Auto-Execution Engine

### Purpose
Automatically execute retention policy actions when documents reach expiration, without manual intervention.

### Database Tables

#### `automation_executions` (New)
Tracks all automated action executions:

```sql
CREATE TABLE automation_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES clientes(id),

  -- Execution details
  tipo_accion VARCHAR(50) NOT NULL, -- 'ARCHIVE', 'DELETE', 'NOTIFY'
  cantidad_documentos INTEGER,
  documentos_id UUID[], -- Array of document IDs

  -- Status
  estado VARCHAR(50) DEFAULT 'PENDING', -- PENDING, RUNNING, SUCCESS, FAILED
  inicio TIMESTAMP WITH TIME ZONE,
  fin TIMESTAMP WITH TIME ZONE,
  duracion_segundos INTEGER,

  -- Results
  exitosos INTEGER DEFAULT 0,
  fallidos INTEGER DEFAULT 0,
  errores TEXT,

  -- Metadata
  activado_por UUID REFERENCES auth.users(id),
  creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(cliente_id, creado_en)
);

CREATE INDEX idx_automation_executions_cliente ON automation_executions(cliente_id);
CREATE INDEX idx_automation_executions_estado ON automation_executions(estado);
CREATE INDEX idx_automation_executions_creado ON automation_executions(creado_en);
```

#### `automation_rules` (New)
Configurable rules for automatic execution:

```sql
CREATE TABLE automation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES clientes(id),

  -- Rule definition
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT,

  -- Triggers
  tipo_trigger VARCHAR(50) NOT NULL, -- 'ON_EXPIRATION', 'ON_SCHEDULE', 'ON_EVENT'
  condicion_dias_antes INTEGER, -- Execute X days before expiration

  -- Actions
  acciones TEXT[] NOT NULL, -- ['ARCHIVE', 'NOTIFY', 'DELETE']

  -- Schedule (if ON_SCHEDULE)
  frecuencia VARCHAR(50), -- 'DIARIA', 'SEMANAL', 'MENSUAL'
  dia_semana INTEGER,
  dia_mes INTEGER,
  hora TIME,

  -- Status
  activa BOOLEAN DEFAULT TRUE,
  ultima_ejecucion TIMESTAMP WITH TIME ZONE,
  proxima_ejecucion TIMESTAMP WITH TIME ZONE,

  -- Metadata
  creada_por UUID NOT NULL REFERENCES auth.users(id),
  creada_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  actualizada_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(cliente_id, nombre)
);

CREATE INDEX idx_automation_rules_cliente ON automation_rules(cliente_id);
CREATE INDEX idx_automation_rules_activa ON automation_rules(activa);
CREATE INDEX idx_automation_rules_proxima ON automation_rules(proxima_ejecucion);
```

### Server Actions

```typescript
// automation-actions.ts

// Rule Management
obtenerReglas(clienteId: string): Promise<Rule[]>
crearRegla(clienteId: string, datos: RuleData): Promise<{ id: string }>
actualizarRegla(reglaId: string, datos: Partial<RuleData>): Promise<void>
eliminarRegla(reglaId: string): Promise<void>
alternarRegla(reglaId: string, activa: boolean): Promise<void>

// Execution Triggers
ejecutarReglaManualmente(reglaId: string): Promise<ExecutionResult>
obtenerEjecuciones(clienteId: string): Promise<Execution[]>
obtenerDetalleEjecucion(ejecucionId: string): Promise<ExecutionDetail>

// Batch Operations
archivarDocumentos(clienteId: string, docIds: string[]): Promise<Result>
eliminarDocumentos(clienteId: string, docIds: string[]): Promise<Result>
notificarDocumentosVencidos(clienteId: string): Promise<Result>
```

### Features

1. **Automatic Expiration Handling**
   - Daily check for documents due for retention action
   - Execute configured actions automatically
   - Track execution history
   - Handle errors gracefully

2. **Configurable Rules**
   - Create custom automation rules per client
   - Set conditions (days before expiration)
   - Specify multiple actions per rule
   - Enable/disable without deletion

3. **Batch Operations**
   - Archive multiple documents
   - Delete multiple documents
   - Send notifications in batch
   - Track progress

4. **Error Handling & Retries**
   - Log all errors
   - Retry failed operations
   - Alert on persistent failures
   - Audit trail of all actions

---

## Feature 2: Alert & Notification System

### Purpose
Send timely notifications about document expiration, compliance issues, and system events through multiple channels.

### Database Tables

#### `notifications` (New)
Central notification tracking:

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES clientes(id),
  usuario_id UUID REFERENCES auth.users(id),

  -- Notification details
  tipo VARCHAR(50) NOT NULL, -- 'EXPIRATION', 'ALERT', 'COMPLIANCE', 'SYSTEM'
  titulo VARCHAR(255) NOT NULL,
  mensaje TEXT NOT NULL,

  -- Context
  referencia_tipo VARCHAR(50), -- 'documento', 'politica', 'reporte'
  referencia_id UUID,

  -- Delivery
  canales_enviado TEXT[], -- ['EMAIL', 'SLACK', 'IN_APP']
  enviado_en TIMESTAMP WITH TIME ZONE,
  leido BOOLEAN DEFAULT FALSE,
  leido_en TIMESTAMP WITH TIME ZONE,

  -- Status
  estado VARCHAR(50) DEFAULT 'PENDING', -- PENDING, SENT, FAILED
  intentos INTEGER DEFAULT 0,
  ultimo_error TEXT,

  -- Metadata
  creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(cliente_id, tipo, referencia_id, creado_en)
);

CREATE INDEX idx_notifications_cliente ON notifications(cliente_id);
CREATE INDEX idx_notifications_usuario ON notifications(usuario_id);
CREATE INDEX idx_notifications_estado ON notifications(estado);
CREATE INDEX idx_notifications_creado ON notifications(creado_en);
```

#### `notification_preferences` (New)
User notification preferences:

```sql
CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES auth.users(id),
  cliente_id UUID NOT NULL REFERENCES clientes(id),

  -- Email preferences
  email_habilitado BOOLEAN DEFAULT TRUE,
  email_direccion VARCHAR(255),

  -- Slack preferences
  slack_habilitado BOOLEAN DEFAULT FALSE,
  slack_webhook_url TEXT,
  slack_canal VARCHAR(255),

  -- In-app preferences
  inapp_habilitado BOOLEAN DEFAULT TRUE,

  -- Frequency
  resumen_frecuencia VARCHAR(50), -- 'INMEDIATA', 'DIARIA', 'SEMANAL'

  -- Notification types
  alertas_vencimiento BOOLEAN DEFAULT TRUE,
  alertas_aprobacion BOOLEAN DEFAULT TRUE,
  alertas_sistema BOOLEAN DEFAULT FALSE,
  alertas_cumplimiento BOOLEAN DEFAULT TRUE,

  -- Metadata
  actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(usuario_id, cliente_id)
);

CREATE INDEX idx_notification_prefs_usuario ON notification_preferences(usuario_id);
```

### Server Actions

```typescript
// notifications-actions.ts

// Notification Management
obtenerNotificaciones(usuarioId: string): Promise<Notification[]>
marcarComoLeido(notificacionId: string): Promise<void>
marcarTodosComoLeidos(usuarioId: string): Promise<void>
eliminarNotificacion(notificacionId: string): Promise<void>

// Alert Management
crearAlerta(clienteId: string, datos: AlertData): Promise<{ id: string }>
obtenerAlertas(clienteId: string): Promise<Alert[]>
reconocerAlerta(alertaId: string): Promise<void>

// Preferences
obtenerPreferencias(usuarioId: string): Promise<Preferences>
actualizarPreferencias(usuarioId: string, datos: Partial<Preferences>): Promise<void>

// Send notifications
enviarNotificaciones(clienteId: string, tipo: string): Promise<Result>
enviarResumenDiario(usuarioId: string): Promise<Result>
```

### Notification Types

1. **Expiration Alerts**
   - Documents approaching expiration (30, 14, 7, 1 days)
   - Documents past expiration
   - Retention policy trigger notifications

2. **Compliance Alerts**
   - Compliance score drop
   - Critical findings detected
   - Audit log anomalies
   - Data governance violations

3. **Operational Alerts**
   - Document approval pending
   - Large upload completed
   - Report generation completed
   - Job failure notifications

4. **System Alerts**
   - High error rates
   - Performance degradation
   - Backup failures
   - Security events

---

## Feature 3: Email Integration

### Purpose
Send emails for notifications, reports, and alerts through configured SMTP.

### Configuration

```typescript
interface EmailConfig {
  smtpHost: string
  smtpPort: number
  smtpUser: string
  smtpPassword: string
  fromAddress: string
  fromName: string
  replyTo?: string
}
```

### Database Tables

#### `email_templates` (New)
Email template management:

```sql
CREATE TABLE email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES clientes(id),

  -- Template details
  nombre VARCHAR(255) NOT NULL,
  tipo VARCHAR(50) NOT NULL, -- 'EXPIRATION', 'REPORT', 'APPROVAL', 'CUSTOM'
  asunto VARCHAR(255) NOT NULL,
  cuerpo TEXT NOT NULL, -- HTML template with variables

  -- Variables available: {usuario_nombre}, {documento_tipo}, {dias_restantes}, etc.

  -- Status
  activo BOOLEAN DEFAULT TRUE,
  es_default BOOLEAN DEFAULT FALSE,

  -- Metadata
  creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(cliente_id, nombre)
);

CREATE INDEX idx_email_templates_cliente ON email_templates(cliente_id);
```

#### `email_logs` (New)
Track all sent emails:

```sql
CREATE TABLE email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES clientes(id),

  -- Email details
  para VARCHAR(255) NOT NULL,
  cc TEXT[],
  bcc TEXT[],
  asunto VARCHAR(255) NOT NULL,

  -- Content
  template_id UUID REFERENCES email_templates(id),
  variables JSONB,

  -- Delivery
  estado VARCHAR(50) DEFAULT 'PENDING', -- PENDING, SENT, FAILED, BOUNCED
  enviado_en TIMESTAMP WITH TIME ZONE,
  error_mensaje TEXT,
  intentos INTEGER DEFAULT 0,
  proxima_tentativa TIMESTAMP WITH TIME ZONE,

  -- Tracking
  abierto BOOLEAN DEFAULT FALSE,
  abierto_en TIMESTAMP WITH TIME ZONE,

  -- Metadata
  creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_email_logs_cliente ON email_logs(cliente_id);
CREATE INDEX idx_email_logs_estado ON email_logs(estado);
CREATE INDEX idx_email_logs_enviado ON email_logs(enviado_en);
```

### Server Actions

```typescript
// email-actions.ts

// Template Management
obtenerTemplates(clienteId: string): Promise<EmailTemplate[]>
crearTemplate(clienteId: string, datos: TemplateData): Promise<{ id: string }>
actualizarTemplate(templateId: string, datos: Partial<TemplateData>): Promise<void>

// Email Sending
enviarEmail(clienteId: string, datos: EmailData): Promise<{ id: string }>
enviarEmailBatch(clienteId: string, emails: EmailData[]): Promise<BatchResult>
enviarReporteEmail(reporteId: string, destinatarios: string[]): Promise<Result>

// Log Management
obtenerEmailLogs(clienteId: string): Promise<EmailLog[]>
reenviarEmail(emailLogId: string): Promise<Result>
```

### Email Features

1. **Email Templates**
   - Create custom templates per client
   - Variable substitution
   - HTML formatting
   - Preview before send

2. **Batch Email Distribution**
   - Send to multiple recipients
   - CC/BCC support
   - Retry failed sends
   - Throttle to avoid rate limits

3. **Email Tracking**
   - Track delivery status
   - Track open events
   - Log all sends
   - Audit trail

---

## Feature 4: Slack Integration

### Purpose
Send alerts and notifications to Slack for real-time visibility and team coordination.

### Database Tables

#### `slack_integrations` (New)
Slack webhook management:

```sql
CREATE TABLE slack_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES clientes(id),

  -- Slack details
  nombre VARCHAR(255) NOT NULL,
  workspace_nombre VARCHAR(255),
  webhook_url TEXT NOT NULL (encrypted),
  canal VARCHAR(255) NOT NULL,

  -- Configuration
  eventos_habilitados TEXT[], -- ['EXPIRATION', 'COMPLIANCE', 'ERROR']
  formato VARCHAR(50) DEFAULT 'BLOCKS', -- 'TEXT', 'BLOCKS'

  -- Status
  activo BOOLEAN DEFAULT TRUE,
  ultima_prueba TIMESTAMP WITH TIME ZONE,
  ultimo_error TEXT,

  -- Metadata
  creado_por UUID NOT NULL REFERENCES auth.users(id),
  creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(cliente_id, webhook_url)
);

CREATE INDEX idx_slack_integrations_cliente ON slack_integrations(cliente_id);
```

#### `slack_messages` (New)
Track Slack messages sent:

```sql
CREATE TABLE slack_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES clientes(id),
  slack_integration_id UUID REFERENCES slack_integrations(id),

  -- Message details
  tipo VARCHAR(50) NOT NULL, -- 'ALERT', 'REPORT', 'NOTIFICATION'
  mensaje TEXT NOT NULL,

  -- Delivery
  estado VARCHAR(50) DEFAULT 'PENDING', -- PENDING, SENT, FAILED
  timestamp_slack VARCHAR(255), -- Slack message timestamp
  enviado_en TIMESTAMP WITH TIME ZONE,
  error_mensaje TEXT,

  -- Metadata
  creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_slack_messages_cliente ON slack_messages(cliente_id);
CREATE INDEX idx_slack_messages_estado ON slack_messages(estado);
```

### Server Actions

```typescript
// slack-actions.ts

// Integration Management
obtenerIntegracionesSlack(clienteId: string): Promise<SlackIntegration[]>
crearIntegracionSlack(clienteId: string, datos: SlackData): Promise<{ id: string }>
actualizarIntegracionSlack(integracionId: string, datos: Partial<SlackData>): Promise<void>
pruebaIntegracionSlack(integracionId: string): Promise<TestResult>

// Message Sending
enviarAlertaSlack(clienteId: string, alerta: AlertData): Promise<Result>
enviarResumenSlack(clienteId: string, tipo: string): Promise<Result>

// Log Management
obtenerMensajesSlack(clienteId: string): Promise<SlackMessage[]>
```

### Slack Features

1. **Rich Notifications**
   - Expiration alerts with document details
   - Compliance summaries
   - Report completion notifications
   - Error/warning alerts

2. **Interactive Messages**
   - Action buttons (approve, archive, etc.)
   - Quick replies
   - Threaded conversations

3. **Message Formatting**
   - Blocks API for rich layout
   - Color coding for severity
   - Inline images/attachments
   - Emoji support

---

## Feature 5: Webhook System (Outbound)

### Purpose
Send events to external systems for integration and automation.

### Database Tables

#### `webhooks` (New)
Outbound webhook configuration:

```sql
CREATE TABLE webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES clientes(id),

  -- Webhook details
  nombre VARCHAR(255) NOT NULL,
  url VARCHAR(500) NOT NULL,
  evento_tipo VARCHAR(50) NOT NULL, -- 'documento.creado', 'documento.aprobado', etc.

  -- Security
  secret VARCHAR(255) NOT NULL, -- For HMAC signature
  headers JSONB, -- Custom headers to send

  -- Configuration
  activo BOOLEAN DEFAULT TRUE,
  reintentos INTEGER DEFAULT 3,
  timeout_segundos INTEGER DEFAULT 30,

  -- Status
  ultima_ejecucion TIMESTAMP WITH TIME ZONE,
  ultimo_error TEXT,
  fallidos_consecutivos INTEGER DEFAULT 0,

  -- Metadata
  creado_por UUID NOT NULL REFERENCES auth.users(id),
  creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(cliente_id, url, evento_tipo)
);

CREATE INDEX idx_webhooks_cliente ON webhooks(cliente_id);
CREATE INDEX idx_webhooks_activo ON webhooks(activo);
```

#### `webhook_deliveries` (New)
Track webhook delivery attempts:

```sql
CREATE TABLE webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID NOT NULL REFERENCES webhooks(id),

  -- Delivery details
  evento_datos JSONB NOT NULL,
  http_metodo VARCHAR(10) DEFAULT 'POST',

  -- Response
  http_status INTEGER,
  respuesta TEXT,
  duracion_ms INTEGER,

  -- Status
  estado VARCHAR(50) DEFAULT 'PENDING', -- PENDING, SUCCESS, FAILED, RETRY
  intento_numero INTEGER DEFAULT 1,
  proxima_tentativa TIMESTAMP WITH TIME ZONE,

  -- Metadata
  enviado_en TIMESTAMP WITH TIME ZONE,
  creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_webhook_deliveries_webhook ON webhook_deliveries(webhook_id);
CREATE INDEX idx_webhook_deliveries_estado ON webhook_deliveries(estado);
CREATE INDEX idx_webhook_deliveries_proxima ON webhook_deliveries(proxima_tentativa);
```

### Server Actions

```typescript
// webhooks-actions.ts

// Webhook Management
obtenerWebhooks(clienteId: string): Promise<Webhook[]>
crearWebhook(clienteId: string, datos: WebhookData): Promise<{ id: string }>
actualizarWebhook(webhookId: string, datos: Partial<WebhookData>): Promise<void>
eliminarWebhook(webhookId: string): Promise<void>
pruebaWebhook(webhookId: string, datosEjemplo?: any): Promise<TestResult>

// Delivery Management
obtenerEntregas(webhookId: string): Promise<Delivery[]>
reintentarEntrega(entregaId: string): Promise<Result>
```

### Webhook Events

1. **Document Events**
   - `documento.creado` - New document uploaded
   - `documento.aprobado` - Document approved
   - `documento.rechazado` - Document rejected
   - `documento.enviado` - Document sent to Nubox

2. **Compliance Events**
   - `documento.vencido` - Document expiration triggered
   - `reporte.generado` - Report generated
   - `auditoria.evento` - Audit event created

3. **System Events**
   - `politica.ejecutada` - Retention policy executed
   - `error.critico` - Critical error occurred
   - `backup.completado` - Backup completed

---

## Feature 6: Batch Operations

### Purpose
Enable efficient bulk operations on multiple documents.

### Database Tables

#### `batch_jobs` (New)
Track batch operation progress:

```sql
CREATE TABLE batch_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES clientes(id),

  -- Job details
  tipo_operacion VARCHAR(50) NOT NULL, -- 'ARCHIVE', 'DELETE', 'EMAIL', 'EXPORT'
  descripcion TEXT,

  -- Items
  cantidad_total INTEGER NOT NULL,
  cantidad_procesados INTEGER DEFAULT 0,
  cantidad_exitosos INTEGER DEFAULT 0,
  cantidad_fallidos INTEGER DEFAULT 0,

  -- Status
  estado VARCHAR(50) DEFAULT 'PENDING', -- PENDING, RUNNING, COMPLETED, FAILED
  porcentaje_completado DECIMAL(5,2) DEFAULT 0,
  inicio TIMESTAMP WITH TIME ZONE,
  fin TIMESTAMP WITH TIME ZONE,

  -- Parameters
  parametros JSONB,
  resultados JSONB,
  errores TEXT,

  -- Metadata
  creado_por UUID NOT NULL REFERENCES auth.users(id),
  creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_batch_jobs_cliente ON batch_jobs(cliente_id);
CREATE INDEX idx_batch_jobs_estado ON batch_jobs(estado);
CREATE INDEX idx_batch_jobs_creado ON batch_jobs(creado_en);
```

### Server Actions

```typescript
// batch-actions.ts

// Batch Operations
iniciarBatchArchivo(clienteId: string, documentoIds: string[]): Promise<BatchJob>
iniciarBatchEliminacion(clienteId: string, documentoIds: string[]): Promise<BatchJob>
iniciarBatchEmails(clienteId: string, datos: EmailBatchData): Promise<BatchJob>
iniciarBatchExporta(clienteId: string, filtros: FilterData): Promise<BatchJob>

// Progress Tracking
obtenerBatchJob(jobId: string): Promise<BatchJob>
obtenerBatchJobs(clienteId: string): Promise<BatchJob[]>
cancelarBatchJob(jobId: string): Promise<void>
```

---

## Feature 7: Scheduler & Job Queue

### Purpose
Execute automated tasks on schedule and process background jobs reliably.

### Implementation

```typescript
// scheduler.ts
// Using later.js or node-cron for scheduling

interface ScheduledJob {
  id: string
  nombre: string
  cronExpression: string // "0 2 * * *" = 2 AM daily
  handler: () => Promise<void>
  habilitado: boolean
  ultimaEjecucion?: Date
  proximaEjecucion?: Date
}

// Scheduled Jobs:
// 1. Verificar documentos vencidos - Daily at 2 AM
// 2. Ejecutar reglas de automación - Daily at 3 AM
// 3. Enviar resúmenes diarios - Daily at 8 AM
// 4. Rescindir reportes programados - Based on schedule
// 5. Reintentar webhooks fallidos - Every 15 minutes
// 6. Limpiar logs antiguos - Weekly
// 7. Generar métricas - Daily at midnight
// 8. Validar integridad de datos - Weekly
```

### Job Queue Processing

```typescript
// queue-processor.ts
// Using Bull or similar job queue

interface QueueJob {
  id: string
  tipo: string // 'email', 'webhook', 'export', 'archive'
  datos: any
  intentos: number
  maxIntentos: number
  estado: string
  resultado?: any
  error?: string
}

// Queue Types:
// 1. Email Queue - Send notifications
// 2. Webhook Queue - Deliver webhooks
// 3. Archive Queue - Archive documents
// 4. Export Queue - Generate exports
// 5. Report Queue - Generate reports
// 6. Notification Queue - Send all notifications
```

---

## Integration with Phase 5

Phase 6 builds on Phase 5 compliance and reporting:

1. **Retention Policy Automation**
   - Auto-execute retention actions from Phase 5 policies
   - Trigger alerts when documents expire
   - Log all executions in audit trail

2. **Report Distribution**
   - Auto-send scheduled reports (Phase 5)
   - Email to recipients
   - Slack notifications

3. **Compliance Alerts**
   - Alert on compliance score changes
   - Notify on critical findings
   - Monitor audit log anomalies

4. **Event Logging**
   - Log all automation actions
   - Track notification delivery
   - Maintain complete audit trail

---

## Security Considerations

### 1. Webhook Security
- HMAC-SHA256 signature verification (matching Phase 1)
- Encrypted webhook URLs in database
- Timeout and retry limits
- Event filtering per webhook

### 2. Email Security
- Use TLS/SSL for SMTP
- Encrypt stored credentials
- Validate email addresses
- Rate limiting to prevent spam

### 3. Slack Security
- Encrypt webhook URLs
- Validate payloads before sending
- Sanitize sensitive data
- Limited scope webhooks

### 4. Batch Operations
- Transactional processing
- Rollback on failure
- User-initiated only (except scheduled)
- Complete audit trail

### 5. Automation Rules
- Validation before execution
- Dry-run capability
- Approval workflows for critical actions
- Complete logging

---

## RLS Policies (4 New)

```sql
-- automation_rules
CREATE POLICY "Users can manage automation rules for their clients"
  ON automation_rules FOR ALL
  USING (
    cliente_id IN (SELECT id FROM clientes WHERE contador_asignado_id = auth.uid())
    OR (SELECT is_admin() FROM auth.users WHERE id = auth.uid())
  );

-- notifications
CREATE POLICY "Users see their own notifications"
  ON notifications FOR SELECT
  USING (
    usuario_id = auth.uid()
    OR cliente_id IN (SELECT id FROM clientes WHERE contador_asignado_id = auth.uid())
  );

-- email_templates
CREATE POLICY "Users can manage templates for their clients"
  ON email_templates FOR ALL
  USING (
    cliente_id IN (SELECT id FROM clientes WHERE contador_asignado_id = auth.uid())
    OR (SELECT is_admin() FROM auth.users WHERE id = auth.uid())
  );

-- webhooks
CREATE POLICY "Users can manage webhooks for their clients"
  ON webhooks FOR ALL
  USING (
    cliente_id IN (SELECT id FROM clientes WHERE contador_asignado_id = auth.uid())
    OR (SELECT is_admin() FROM auth.users WHERE id = auth.uid())
  );
```

---

## UI/Dashboard Components

### 1. Automation Rules Management Page
- Create/edit/delete rules
- Configure triggers and actions
- Test rules manually
- View execution history

### 2. Notifications Center
- View all notifications
- Mark as read
- Configure preferences
- Set frequency/channels

### 3. Email Templates Manager
- Create custom templates
- Preview templates
- Test send
- Version control

### 4. Slack Integration Settings
- Connect Slack workspace
- Configure events
- Test webhook
- View message history

### 5. Batch Operations Dashboard
- Start batch job
- Monitor progress
- View results
- Download report

### 6. Automation Dashboard
- View active rules
- View execution history
- Monitor success rates
- View error logs

---

## Summary

**Phase 6 adds:**
- 6 new database tables (14 total with indexes and triggers)
- 30+ new server actions
- 6 new dashboard pages
- Complete automation engine
- Multi-channel notification system
- Email and Slack integration
- Webhook system
- Batch operation capability
- Job scheduling and queue processing

**Estimated Code Addition:**
- Database migrations: ~600 lines
- Server actions: ~800 lines
- Dashboard pages: ~1,000 lines
- Scheduler/Queue: ~400 lines
- Total: ~2,800 lines

**Status**: DESIGN COMPLETE - Ready for implementation

---

**Document Version**: 1.0
**Date**: 2026-01-11
**Status**: DESIGN PHASE COMPLETE
