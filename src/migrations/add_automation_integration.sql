-- Phase 6: Automation & Advanced Integration
-- Adds automation engine, notifications, email/Slack integration, webhooks, and batch operations

-- ============================================================================
-- AUTOMATION RULES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS automation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,

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
  dia_semana INTEGER, -- 0-6 (Monday-Sunday)
  dia_mes INTEGER, -- 1-31
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

-- ============================================================================
-- AUTOMATION EXECUTIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS automation_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,

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

-- ============================================================================
-- NOTIFICATIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
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

-- ============================================================================
-- NOTIFICATION PREFERENCES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,

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
CREATE INDEX idx_notification_prefs_cliente ON notification_preferences(cliente_id);

-- ============================================================================
-- EMAIL TEMPLATES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,

  -- Template details
  nombre VARCHAR(255) NOT NULL,
  tipo VARCHAR(50) NOT NULL, -- 'EXPIRATION', 'REPORT', 'APPROVAL', 'CUSTOM'
  asunto VARCHAR(255) NOT NULL,
  cuerpo TEXT NOT NULL, -- HTML template with variables

  -- Status
  activo BOOLEAN DEFAULT TRUE,
  es_default BOOLEAN DEFAULT FALSE,

  -- Metadata
  creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(cliente_id, nombre)
);

CREATE INDEX idx_email_templates_cliente ON email_templates(cliente_id);
CREATE INDEX idx_email_templates_tipo ON email_templates(tipo);

-- ============================================================================
-- EMAIL LOGS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,

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

-- ============================================================================
-- SLACK INTEGRATIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS slack_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,

  -- Slack details
  nombre VARCHAR(255) NOT NULL,
  workspace_nombre VARCHAR(255),
  webhook_url TEXT NOT NULL,
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
CREATE INDEX idx_slack_integrations_activo ON slack_integrations(activo);

-- ============================================================================
-- SLACK MESSAGES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS slack_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
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

-- ============================================================================
-- WEBHOOKS (OUTBOUND) TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,

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

-- ============================================================================
-- WEBHOOK DELIVERIES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID NOT NULL REFERENCES webhooks(id) ON DELETE CASCADE,

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

-- ============================================================================
-- BATCH JOBS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS batch_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,

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

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update timestamps
CREATE OR REPLACE FUNCTION actualizar_timestamp_automation()
RETURNS TRIGGER AS $$
BEGIN
  NEW.actualizado_en = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_actualizar_timestamp_automation_rules
  BEFORE UPDATE ON automation_rules
  FOR EACH ROW
  EXECUTE FUNCTION actualizar_timestamp_automation();

CREATE TRIGGER trigger_actualizar_timestamp_automation_executions
  BEFORE UPDATE ON automation_executions
  FOR EACH ROW
  EXECUTE FUNCTION actualizar_timestamp_automation();

CREATE TRIGGER trigger_actualizar_timestamp_notifications
  BEFORE UPDATE ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION actualizar_timestamp_automation();

CREATE TRIGGER trigger_actualizar_timestamp_email_logs
  BEFORE UPDATE ON email_logs
  FOR EACH ROW
  EXECUTE FUNCTION actualizar_timestamp_automation();

CREATE TRIGGER trigger_actualizar_timestamp_slack_messages
  BEFORE UPDATE ON slack_messages
  FOR EACH ROW
  EXECUTE FUNCTION actualizar_timestamp_automation();

CREATE TRIGGER trigger_actualizar_timestamp_webhooks
  BEFORE UPDATE ON webhooks
  FOR EACH ROW
  EXECUTE FUNCTION actualizar_timestamp_automation();

CREATE TRIGGER trigger_actualizar_timestamp_batch_jobs
  BEFORE UPDATE ON batch_jobs
  FOR EACH ROW
  EXECUTE FUNCTION actualizar_timestamp_automation();

-- ============================================================================
-- DATABASE FUNCTIONS
-- ============================================================================

-- Function to get pending automation actions
CREATE OR REPLACE FUNCTION obtener_acciones_automatizacion(
  p_cliente_id UUID
)
RETURNS TABLE (
  documento_id UUID,
  tipo_documento VARCHAR,
  dias_restantes INTEGER,
  accion VARCHAR,
  politica_nombre VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    dl.documento_carga_id,
    dc.tipo_documento,
    dl.dias_restantes,
    drp.accion_vencimiento,
    drp.nombre
  FROM document_lifecycle dl
  JOIN documento_cargas dc ON dl.documento_carga_id = dc.id
  JOIN document_retention_policies drp ON dl.politica_retencion_id = drp.id
  WHERE dl.cliente_id = p_cliente_id
    AND dl.dias_restantes <= 0
    AND dl.fecha_destruido IS NULL
  ORDER BY dl.dias_restantes ASC;
END;
$$ LANGUAGE plpgsql;

-- Function to get notification summary
CREATE OR REPLACE FUNCTION obtener_resumen_notificaciones(
  p_usuario_id UUID,
  p_cliente_id UUID
)
RETURNS TABLE (
  total_notificaciones INTEGER,
  no_leidas INTEGER,
  pendientes_envio INTEGER,
  fallidas INTEGER
) AS $$
DECLARE
  v_total INTEGER;
  v_no_leidas INTEGER;
  v_pendientes INTEGER;
  v_fallidas INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_total
  FROM notifications
  WHERE usuario_id = p_usuario_id AND cliente_id = p_cliente_id;

  SELECT COUNT(*) INTO v_no_leidas
  FROM notifications
  WHERE usuario_id = p_usuario_id AND cliente_id = p_cliente_id AND leido = FALSE;

  SELECT COUNT(*) INTO v_pendientes
  FROM notifications
  WHERE usuario_id = p_usuario_id AND cliente_id = p_cliente_id AND estado = 'PENDING';

  SELECT COUNT(*) INTO v_fallidas
  FROM notifications
  WHERE usuario_id = p_usuario_id AND cliente_id = p_cliente_id AND estado = 'FAILED';

  RETURN QUERY SELECT v_total, v_no_leidas, v_pendientes, v_fallidas;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Enable RLS on all new tables
ALTER TABLE automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE slack_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE slack_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE batch_jobs ENABLE ROW LEVEL SECURITY;

-- Automation rules policies
CREATE POLICY "Users can manage automation rules for their clients" ON automation_rules
  FOR ALL
  USING (
    cliente_id IN (
      SELECT id FROM clientes WHERE contador_asignado_id = auth.uid()
    ) OR
    (SELECT is_admin() FROM auth.users WHERE id = auth.uid())
  );

-- Automation executions policies
CREATE POLICY "Users can view automation executions for their clients" ON automation_executions
  FOR SELECT
  USING (
    cliente_id IN (
      SELECT id FROM clientes WHERE contador_asignado_id = auth.uid()
    ) OR
    (SELECT is_admin() FROM auth.users WHERE id = auth.uid())
  );

-- Notifications policies
CREATE POLICY "Users see their own notifications" ON notifications
  FOR SELECT
  USING (
    usuario_id = auth.uid() OR
    cliente_id IN (
      SELECT id FROM clientes WHERE contador_asignado_id = auth.uid()
    ) OR
    (SELECT is_admin() FROM auth.users WHERE id = auth.uid())
  );

CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE
  USING (usuario_id = auth.uid());

-- Notification preferences policies
CREATE POLICY "Users can manage their own preferences" ON notification_preferences
  FOR ALL
  USING (usuario_id = auth.uid());

-- Email templates policies
CREATE POLICY "Users can manage templates for their clients" ON email_templates
  FOR ALL
  USING (
    cliente_id IN (
      SELECT id FROM clientes WHERE contador_asignado_id = auth.uid()
    ) OR
    (SELECT is_admin() FROM auth.users WHERE id = auth.uid())
  );

-- Email logs policies
CREATE POLICY "Users can view email logs for their clients" ON email_logs
  FOR SELECT
  USING (
    cliente_id IN (
      SELECT id FROM clientes WHERE contador_asignado_id = auth.uid()
    ) OR
    (SELECT is_admin() FROM auth.users WHERE id = auth.uid())
  );

-- Slack integrations policies
CREATE POLICY "Users can manage Slack integrations for their clients" ON slack_integrations
  FOR ALL
  USING (
    cliente_id IN (
      SELECT id FROM clientes WHERE contador_asignado_id = auth.uid()
    ) OR
    (SELECT is_admin() FROM auth.users WHERE id = auth.uid())
  );

-- Slack messages policies
CREATE POLICY "Users can view Slack messages for their clients" ON slack_messages
  FOR SELECT
  USING (
    cliente_id IN (
      SELECT id FROM clientes WHERE contador_asignado_id = auth.uid()
    ) OR
    (SELECT is_admin() FROM auth.users WHERE id = auth.uid())
  );

-- Webhooks policies
CREATE POLICY "Users can manage webhooks for their clients" ON webhooks
  FOR ALL
  USING (
    cliente_id IN (
      SELECT id FROM clientes WHERE contador_asignado_id = auth.uid()
    ) OR
    (SELECT is_admin() FROM auth.users WHERE id = auth.uid())
  );

-- Webhook deliveries policies
CREATE POLICY "Users can view webhook deliveries for their clients" ON webhook_deliveries
  FOR SELECT
  USING (
    webhook_id IN (
      SELECT id FROM webhooks WHERE cliente_id IN (
        SELECT id FROM clientes WHERE contador_asignado_id = auth.uid()
      )
    ) OR
    (SELECT is_admin() FROM auth.users WHERE id = auth.uid())
  );

-- Batch jobs policies
CREATE POLICY "Users can manage batch jobs for their clients" ON batch_jobs
  FOR ALL
  USING (
    cliente_id IN (
      SELECT id FROM clientes WHERE contador_asignado_id = auth.uid()
    ) OR
    (SELECT is_admin() FROM auth.users WHERE id = auth.uid())
  );
