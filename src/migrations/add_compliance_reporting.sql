-- Phase 5: Advanced Compliance & Reporting
-- Adds tables and functions for audit logging, compliance tracking, and reporting

-- ============================================================================
-- AUDIT LOG TABLE (Enhanced)
-- ============================================================================

CREATE TABLE IF NOT EXISTS audit_logs_extended (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL REFERENCES auth.users(id),

  -- Action details
  tabla VARCHAR(100) NOT NULL,
  accion VARCHAR(50) NOT NULL, -- INSERT, UPDATE, DELETE, APPROVE, REJECT
  registro_id UUID,
  datos_anteriores JSONB,
  datos_nuevos JSONB,

  -- Context
  ip_address INET,
  user_agent TEXT,
  navegador TEXT,
  dispositivo VARCHAR(50),
  ubicacion TEXT,

  -- Security
  requiere_justificacion BOOLEAN DEFAULT FALSE,
  justificacion TEXT,
  requiere_confirmacion BOOLEAN DEFAULT FALSE,
  confirmacion_enviada_en TIMESTAMP WITH TIME ZONE,
  confirmacion_completada_en TIMESTAMP WITH TIME ZONE,

  -- Timestamps
  creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(cliente_id, registro_id, tabla, accion, creado_en)
);

CREATE INDEX idx_audit_logs_cliente ON audit_logs_extended(cliente_id);
CREATE INDEX idx_audit_logs_usuario ON audit_logs_extended(usuario_id);
CREATE INDEX idx_audit_logs_tabla ON audit_logs_extended(tabla);
CREATE INDEX idx_audit_logs_accion ON audit_logs_extended(accion);
CREATE INDEX idx_audit_logs_fecha ON audit_logs_extended(creado_en);

-- ============================================================================
-- DOCUMENT RETENTION POLICY TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS document_retention_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT,

  -- Retention rules
  tipo_documento VARCHAR(100),
  anos_retener INTEGER NOT NULL DEFAULT 7,
  requiere_archivado BOOLEAN DEFAULT FALSE,
  requiere_sii_confirmacion BOOLEAN DEFAULT FALSE,

  -- Deletion rules
  accion_vencimiento VARCHAR(50) NOT NULL, -- 'ARCHIVE', 'DELETE', 'NOTIFY'
  notificar_antes_dias INTEGER DEFAULT 30,

  -- Status
  activa BOOLEAN DEFAULT TRUE,
  aplicada_automaticamente BOOLEAN DEFAULT FALSE,

  -- Metadata
  creada_por UUID NOT NULL REFERENCES auth.users(id),
  creada_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  actualizada_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(cliente_id, nombre)
);

CREATE INDEX idx_retention_policies_cliente ON document_retention_policies(cliente_id);
CREATE INDEX idx_retention_policies_tipo ON document_retention_policies(tipo_documento);
CREATE INDEX idx_retention_policies_activa ON document_retention_policies(activa);

-- ============================================================================
-- DOCUMENT LIFECYCLE TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS document_lifecycle (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  documento_carga_id UUID NOT NULL REFERENCES documento_cargas(id) ON DELETE CASCADE,
  cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,

  -- Lifecycle states
  estado_actual VARCHAR(50),
  ciclo_numero INTEGER DEFAULT 1,

  -- Dates
  fecha_creacion TIMESTAMP WITH TIME ZONE,
  fecha_aprobacion TIMESTAMP WITH TIME ZONE,
  fecha_archivado TIMESTAMP WITH TIME ZONE,
  fecha_destruccion_programada TIMESTAMP WITH TIME ZONE,
  fecha_destruido TIMESTAMP WITH TIME ZONE,

  -- Retention tracking
  politica_retencion_id UUID REFERENCES document_retention_policies(id),
  dias_restantes INTEGER,
  porcentaje_retencion DECIMAL(5,2),

  -- Location
  ubicacion_fisica VARCHAR(255),
  ubicacion_digital VARCHAR(255),

  -- Metadata
  registrado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(documento_carga_id)
);

CREATE INDEX idx_document_lifecycle_cliente ON document_lifecycle(cliente_id);
CREATE INDEX idx_document_lifecycle_documento ON document_lifecycle(documento_carga_id);
CREATE INDEX idx_document_lifecycle_fecha_destruccion ON document_lifecycle(fecha_destruccion_programada);

-- ============================================================================
-- COMPLIANCE REPORT TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS compliance_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,

  -- Report details
  tipo_reporte VARCHAR(100) NOT NULL, -- 'AUDIT', 'RETENTION', 'SII', 'GENERAL', 'CUSTOM'
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT,

  -- Report data
  periodo_inicio DATE NOT NULL,
  periodo_fin DATE NOT NULL,
  fecha_generacion TIMESTAMP WITH TIME ZONE,

  -- Content
  resumen_ejecutivo JSONB,
  datos_completos JSONB,
  hallazgos TEXT,
  recomendaciones TEXT,

  -- Export
  formato VARCHAR(50), -- 'PDF', 'EXCEL', 'CSV', 'JSON'
  archivo_url VARCHAR(500),
  archivo_tamaño INTEGER,
  archivo_hash VARCHAR(64),

  -- Status
  estado VARCHAR(50) DEFAULT 'DRAFT', -- DRAFT, REVIEW, APPROVED, DISTRIBUTED
  aprobado_por UUID REFERENCES auth.users(id),
  aprobado_en TIMESTAMP WITH TIME ZONE,

  -- Distribution
  distribuido_a TEXT[], -- Array of emails
  distribuido_en TIMESTAMP WITH TIME ZONE,
  leido_por TEXT[],

  -- Metadata
  creado_por UUID NOT NULL REFERENCES auth.users(id),
  creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(cliente_id, tipo_reporte, periodo_inicio, periodo_fin)
);

CREATE INDEX idx_compliance_reports_cliente ON compliance_reports(cliente_id);
CREATE INDEX idx_compliance_reports_tipo ON compliance_reports(tipo_reporte);
CREATE INDEX idx_compliance_reports_periodo ON compliance_reports(periodo_inicio, periodo_fin);
CREATE INDEX idx_compliance_reports_estado ON compliance_reports(estado);

-- ============================================================================
-- REPORT SCHEDULE TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS report_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,

  -- Report definition
  nombre VARCHAR(255) NOT NULL,
  tipo_reporte VARCHAR(100) NOT NULL,
  descripcion TEXT,

  -- Schedule
  frecuencia VARCHAR(50) NOT NULL, -- 'DIARIA', 'SEMANAL', 'MENSUAL', 'TRIMESTRAL', 'ANUAL'
  dia_semana INTEGER, -- 0-6 (Monday-Sunday)
  dia_mes INTEGER, -- 1-31
  mes VARCHAR(20), -- ENERO, FEBRERO, etc.
  hora_generacion TIME NOT NULL,

  -- Recipients
  destinatarios TEXT[] NOT NULL, -- Array of emails
  copia_a TEXT[], -- CC emails
  incluir_datos_completos BOOLEAN DEFAULT FALSE,
  incluir_graficos BOOLEAN DEFAULT TRUE,

  -- Filters
  filtros JSONB,
  formato VARCHAR(50) DEFAULT 'PDF',

  -- Status
  activa BOOLEAN DEFAULT TRUE,
  ultima_ejecucion TIMESTAMP WITH TIME ZONE,
  proxima_ejecucion TIMESTAMP WITH TIME ZONE,
  intentos_fallidos INTEGER DEFAULT 0,
  ultimo_error TEXT,

  -- Metadata
  creado_por UUID NOT NULL REFERENCES auth.users(id),
  creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(cliente_id, nombre)
);

CREATE INDEX idx_report_schedules_cliente ON report_schedules(cliente_id);
CREATE INDEX idx_report_schedules_frecuencia ON report_schedules(frecuencia);
CREATE INDEX idx_report_schedules_proxima ON report_schedules(proxima_ejecucion);

-- ============================================================================
-- COMPLIANCE CHECKLIST TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS compliance_checklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,

  -- Checklist definition
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT,
  tipo VARCHAR(100) NOT NULL, -- 'LEGAL', 'TAX', 'OPERATIONAL', 'SECURITY'

  -- Items
  items JSONB NOT NULL, -- Array of {id, titulo, descripcion, obligatorio, completado, fecha_completado}

  -- Status
  completada BOOLEAN DEFAULT FALSE,
  porcentaje_completado DECIMAL(5,2) DEFAULT 0,
  proxima_revision DATE,

  -- Metadata
  creado_por UUID NOT NULL REFERENCES auth.users(id),
  creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completado_en TIMESTAMP WITH TIME ZONE,

  UNIQUE(cliente_id, nombre)
);

CREATE INDEX idx_compliance_checklists_cliente ON compliance_checklists(cliente_id);
CREATE INDEX idx_compliance_checklists_tipo ON compliance_checklists(tipo);
CREATE INDEX idx_compliance_checklists_completada ON compliance_checklists(completada);

-- ============================================================================
-- DATA GOVERNANCE TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS data_governance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,

  -- Governance settings
  politica_privacidad_url VARCHAR(500),
  politica_seguridad_url VARCHAR(500),
  politica_retencion_url VARCHAR(500),

  -- Consent
  consentimiento_requerido BOOLEAN DEFAULT TRUE,
  consentimiento_version VARCHAR(20),
  consentimiento_fecha TIMESTAMP WITH TIME ZONE,

  -- Data classification
  clasificacion_nivel VARCHAR(50) DEFAULT 'CONFIDENCIAL', -- PUBLICO, INTERNO, CONFIDENCIAL, SECRETO
  requiere_encriptacion BOOLEAN DEFAULT TRUE,
  requiere_autenticacion_multifactor BOOLEAN DEFAULT FALSE,

  -- Access control
  acceso_restringido_a TEXT[], -- Array of roles/departments
  requiere_razon_acceso BOOLEAN DEFAULT TRUE,
  requiere_aprobacion BOOLEAN DEFAULT FALSE,

  -- Audit
  auditar_acceso BOOLEAN DEFAULT TRUE,
  auditar_modificaciones BOOLEAN DEFAULT TRUE,
  retencion_audit_logs_anos INTEGER DEFAULT 7,

  -- Status
  activo BOOLEAN DEFAULT TRUE,
  actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_data_governance_cliente ON data_governance(cliente_id);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to check if document is due for retention action
CREATE OR REPLACE FUNCTION verificar_documentos_vencidos(
  p_cliente_id UUID
)
RETURNS TABLE (
  documento_id UUID,
  tipo_documento VARCHAR,
  dias_restantes INTEGER,
  accion_pendiente VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    dl.documento_carga_id,
    dc.tipo_documento,
    dl.dias_restantes,
    drp.accion_vencimiento
  FROM document_lifecycle dl
  JOIN documento_cargas dc ON dl.documento_carga_id = dc.id
  JOIN document_retention_policies drp ON dl.politica_retencion_id = drp.id
  WHERE dl.cliente_id = p_cliente_id
    AND dl.dias_restantes <= 30
    AND dl.fecha_destruido IS NULL
  ORDER BY dl.dias_restantes ASC;
END;
$$ LANGUAGE plpgsql;

-- Function to generate compliance summary
CREATE OR REPLACE FUNCTION obtener_resumen_cumplimiento(
  p_cliente_id UUID,
  p_fecha_inicio DATE,
  p_fecha_fin DATE
)
RETURNS TABLE (
  total_documentos INTEGER,
  documentos_aprobados INTEGER,
  documentos_archivados INTEGER,
  documentos_vencidos INTEGER,
  tasa_cumplimiento DECIMAL,
  hallazgos_criticos INTEGER,
  acciones_requeridas INTEGER
) AS $$
DECLARE
  v_total INTEGER;
  v_aprobados INTEGER;
  v_archivados INTEGER;
  v_vencidos INTEGER;
  v_tasa DECIMAL;
  v_criticos INTEGER;
  v_acciones INTEGER;
BEGIN
  -- Get document count
  SELECT COUNT(*) INTO v_total
  FROM documento_cargas
  WHERE cliente_id = p_cliente_id
    AND DATE(cargado_en) BETWEEN p_fecha_inicio AND p_fecha_fin;

  -- Get approved count
  SELECT COUNT(*) INTO v_aprobados
  FROM documento_cargas
  WHERE cliente_id = p_cliente_id
    AND estado = 'aprobado'
    AND DATE(cargado_en) BETWEEN p_fecha_inicio AND p_fecha_fin;

  -- Get archived count
  SELECT COUNT(*) INTO v_archivados
  FROM document_lifecycle
  WHERE cliente_id = p_cliente_id
    AND fecha_archivado IS NOT NULL
    AND DATE(fecha_archivado) BETWEEN p_fecha_inicio AND p_fecha_fin;

  -- Get expired count
  SELECT COUNT(*) INTO v_vencidos
  FROM document_lifecycle
  WHERE cliente_id = p_cliente_id
    AND dias_restantes <= 0;

  -- Calculate compliance rate
  v_tasa := CASE WHEN v_total > 0 THEN (v_aprobados::DECIMAL / v_total * 100) ELSE 0 END;

  -- Count critical findings
  SELECT COUNT(*) INTO v_criticos
  FROM audit_logs_extended
  WHERE cliente_id = p_cliente_id
    AND accion IN ('DELETE', 'REJECT', 'DENY')
    AND DATE(creado_en) BETWEEN p_fecha_inicio AND p_fecha_fin;

  -- Count required actions
  SELECT COUNT(*) INTO v_acciones
  FROM document_lifecycle
  WHERE cliente_id = p_cliente_id
    AND dias_restantes BETWEEN 1 AND 30;

  RETURN QUERY SELECT v_total, v_aprobados, v_archivados, v_vencidos, v_tasa, v_criticos, v_acciones;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update timestamps
CREATE OR REPLACE FUNCTION actualizar_timestamp_audit()
RETURNS TRIGGER AS $$
BEGIN
  NEW.actualizado_en = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_actualizar_timestamp_audit
  BEFORE UPDATE ON audit_logs_extended
  FOR EACH ROW
  EXECUTE FUNCTION actualizar_timestamp_audit();

CREATE TRIGGER trigger_actualizar_timestamp_compliance
  BEFORE UPDATE ON compliance_reports
  FOR EACH ROW
  EXECUTE FUNCTION actualizar_timestamp_audit();

CREATE TRIGGER trigger_actualizar_timestamp_schedules
  BEFORE UPDATE ON report_schedules
  FOR EACH ROW
  EXECUTE FUNCTION actualizar_timestamp_audit();

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE audit_logs_extended ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_retention_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_lifecycle ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_governance ENABLE ROW LEVEL SECURITY;

-- Audit logs policies
CREATE POLICY "Users can view audit logs for their clients" ON audit_logs_extended
  FOR SELECT
  USING (
    cliente_id IN (
      SELECT id FROM clientes WHERE contador_asignado_id = auth.uid()
    ) OR
    (SELECT is_admin() FROM auth.users WHERE id = auth.uid())
  );

-- Retention policies
CREATE POLICY "Users can view retention policies" ON document_retention_policies
  FOR SELECT
  USING (
    cliente_id IN (
      SELECT id FROM clientes WHERE contador_asignado_id = auth.uid()
    ) OR
    (SELECT is_admin() FROM auth.users WHERE id = auth.uid())
  );

CREATE POLICY "Users can manage retention policies for their clients" ON document_retention_policies
  FOR ALL
  USING (
    cliente_id IN (
      SELECT id FROM clientes WHERE contador_asignado_id = auth.uid()
    ) OR
    (SELECT is_admin() FROM auth.users WHERE id = auth.uid())
  );

-- Document lifecycle
CREATE POLICY "Users can view document lifecycle" ON document_lifecycle
  FOR SELECT
  USING (
    cliente_id IN (
      SELECT id FROM clientes WHERE contador_asignado_id = auth.uid()
    ) OR
    (SELECT is_admin() FROM auth.users WHERE id = auth.uid())
  );

-- Compliance reports
CREATE POLICY "Users can view compliance reports" ON compliance_reports
  FOR SELECT
  USING (
    cliente_id IN (
      SELECT id FROM clientes WHERE contador_asignado_id = auth.uid()
    ) OR
    (SELECT is_admin() FROM auth.users WHERE id = auth.uid())
  );

CREATE POLICY "Users can create compliance reports" ON compliance_reports
  FOR INSERT
  WITH CHECK (
    cliente_id IN (
      SELECT id FROM clientes WHERE contador_asignado_id = auth.uid()
    ) OR
    (SELECT is_admin() FROM auth.users WHERE id = auth.uid())
  );

-- Report schedules
CREATE POLICY "Users can manage report schedules" ON report_schedules
  FOR ALL
  USING (
    cliente_id IN (
      SELECT id FROM clientes WHERE contador_asignado_id = auth.uid()
    ) OR
    (SELECT is_admin() FROM auth.users WHERE id = auth.uid())
  );

-- Compliance checklists
CREATE POLICY "Users can manage compliance checklists" ON compliance_checklists
  FOR ALL
  USING (
    cliente_id IN (
      SELECT id FROM clientes WHERE contador_asignado_id = auth.uid()
    ) OR
    (SELECT is_admin() FROM auth.users WHERE id = auth.uid())
  );

-- Data governance
CREATE POLICY "Users can view data governance policies" ON data_governance
  FOR SELECT
  USING (
    cliente_id IN (
      SELECT id FROM clientes WHERE contador_asignado_id = auth.uid()
    ) OR
    (SELECT is_admin() FROM auth.users WHERE id = auth.uid())
  );

CREATE POLICY "Users can update data governance for their clients" ON data_governance
  FOR UPDATE
  USING (
    cliente_id IN (
      SELECT id FROM clientes WHERE contador_asignado_id = auth.uid()
    ) OR
    (SELECT is_admin() FROM auth.users WHERE id = auth.uid())
  );
