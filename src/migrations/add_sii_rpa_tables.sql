-- Migration: add_sii_rpa_tables.sql
-- SII RPA System Database Schema
-- HV Consultores - Sistema de automatización para portal SII

-- ============================================================================
-- ENUMS
-- ============================================================================

DO $$ BEGIN
  CREATE TYPE sii_task_type AS ENUM (
    'login_test',
    'f29_submit',
    'f29_download',
    'libro_compras',
    'libro_ventas',
    'situacion_tributaria',
    'certificate_download'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE sii_auth_method AS ENUM (
    'rut_clave',
    'clave_unica',
    'certificado_digital'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE sii_job_status AS ENUM (
    'pendiente',
    'ejecutando',
    'completado',
    'fallido',
    'cancelado'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- EXTEND CREDENCIALES_PORTALES FOR SII
-- ============================================================================

ALTER TABLE credenciales_portales
ADD COLUMN IF NOT EXISTS metodo_autenticacion sii_auth_method DEFAULT 'rut_clave',
ADD COLUMN IF NOT EXISTS rut_representante VARCHAR(12),
ADD COLUMN IF NOT EXISTS certificado_archivo TEXT,
ADD COLUMN IF NOT EXISTS certificado_password_enc TEXT,
ADD COLUMN IF NOT EXISTS ultimo_login_exitoso TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS intentos_fallidos INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS bloqueado_hasta TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_credenciales_sii
ON credenciales_portales(cliente_id)
WHERE portal = 'sii';

-- ============================================================================
-- SII JOBS
-- ============================================================================

CREATE TABLE IF NOT EXISTS sii_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_job_id UUID REFERENCES bot_jobs(id) ON DELETE CASCADE,
  cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,

  -- Task specification
  task_type sii_task_type NOT NULL,
  periodo VARCHAR(7),

  -- Parameters
  parametros JSONB DEFAULT '{}',

  -- F29 specific
  f29_calculo_id UUID REFERENCES f29_calculos(id),
  codigos_f29 JSONB,

  -- Execution tracking
  status sii_job_status DEFAULT 'pendiente',
  execution_server VARCHAR(100),
  browser_session_id VARCHAR(255),

  -- Timing
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,

  -- Results
  archivos_descargados TEXT[],
  datos_extraidos JSONB,
  error_message TEXT,

  -- Screenshots for audit
  screenshots JSONB DEFAULT '[]',

  -- Retry
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_sii_jobs_cliente ON sii_jobs(cliente_id);
CREATE INDEX idx_sii_jobs_task ON sii_jobs(task_type);
CREATE INDEX idx_sii_jobs_status ON sii_jobs(status);
CREATE INDEX idx_sii_jobs_periodo ON sii_jobs(periodo);
CREATE INDEX idx_sii_jobs_created ON sii_jobs(created_at DESC);

-- ============================================================================
-- SII EXECUTION STEPS
-- ============================================================================

CREATE TABLE IF NOT EXISTS sii_execution_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sii_job_id UUID NOT NULL REFERENCES sii_jobs(id) ON DELETE CASCADE,

  -- Step details
  step_number INTEGER NOT NULL,
  step_name VARCHAR(100) NOT NULL,
  step_description TEXT,

  -- Status
  status VARCHAR(50) NOT NULL DEFAULT 'pending',

  -- Timing
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  duration_ms INTEGER,

  -- Data
  input_data JSONB,
  output_data JSONB,
  screenshot_path TEXT,

  -- Error handling
  error_code VARCHAR(50),
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT unique_step_per_job UNIQUE(sii_job_id, step_number)
);

CREATE INDEX idx_sii_steps_job ON sii_execution_steps(sii_job_id);
CREATE INDEX idx_sii_steps_status ON sii_execution_steps(status);

-- ============================================================================
-- SII SITUACION TRIBUTARIA (cached tax status)
-- ============================================================================

CREATE TABLE IF NOT EXISTS sii_situacion_tributaria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,

  -- Basic info
  rut VARCHAR(12) NOT NULL,
  razon_social VARCHAR(255),
  nombre_fantasia VARCHAR(255),

  -- Tax status
  inicio_actividades DATE,
  termino_giro DATE,
  actividades_economicas JSONB,

  -- DTE status
  facturador_electronico BOOLEAN DEFAULT FALSE,
  fecha_certificacion_dte DATE,

  -- IVA status
  contribuyente_iva BOOLEAN DEFAULT TRUE,

  -- PPM status
  tasa_ppm_vigente DECIMAL(5,4),

  -- Compliance
  declaraciones_pendientes JSONB,
  mora_tributaria BOOLEAN DEFAULT FALSE,
  monto_deuda DECIMAL(15,2),

  -- Raw HTML (for audit)
  html_raw TEXT,

  -- Validity
  consultado_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  valido_hasta TIMESTAMP WITH TIME ZONE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT unique_situacion_per_cliente UNIQUE(cliente_id)
);

CREATE INDEX idx_situacion_cliente ON sii_situacion_tributaria(cliente_id);
CREATE INDEX idx_situacion_rut ON sii_situacion_tributaria(rut);

-- ============================================================================
-- SII F29 SUBMISSIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS sii_f29_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  f29_calculo_id UUID NOT NULL REFERENCES f29_calculos(id) ON DELETE CASCADE,
  sii_job_id UUID REFERENCES sii_jobs(id),

  -- Submission data
  periodo VARCHAR(7) NOT NULL,
  tipo_declaracion VARCHAR(50) DEFAULT 'original',
  numero_rectificatoria INTEGER,

  -- SII response
  folio_sii VARCHAR(50),
  fecha_presentacion TIMESTAMP WITH TIME ZONE,
  numero_comprobante VARCHAR(100),

  -- Document storage
  comprobante_pdf_path TEXT,
  xml_path TEXT,

  -- Amounts confirmed by SII
  total_declarado DECIMAL(15,2),
  total_a_pagar DECIMAL(15,2),
  remanente_periodo_siguiente DECIMAL(15,2),

  -- Status
  estado VARCHAR(50) DEFAULT 'pendiente',
  observaciones_sii TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_f29_submissions_calculo ON sii_f29_submissions(f29_calculo_id);
CREATE INDEX idx_f29_submissions_periodo ON sii_f29_submissions(periodo);
CREATE INDEX idx_f29_submissions_folio ON sii_f29_submissions(folio_sii);

-- ============================================================================
-- SII LIBROS DOWNLOADS
-- ============================================================================

CREATE TABLE IF NOT EXISTS sii_libros_downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  sii_job_id UUID REFERENCES sii_jobs(id),

  -- Libro details
  tipo_libro VARCHAR(50) NOT NULL,
  periodo VARCHAR(7) NOT NULL,

  -- File storage
  archivo_csv_path TEXT,
  archivo_xml_path TEXT,
  archivo_pdf_path TEXT,

  -- Summary data
  total_documentos INTEGER,
  monto_neto_total DECIMAL(15,2),
  monto_iva_total DECIMAL(15,2),
  monto_total DECIMAL(15,2),

  -- Metadata
  fecha_descarga TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  hash_archivo VARCHAR(64),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_libros_cliente ON sii_libros_downloads(cliente_id);
CREATE INDEX idx_libros_periodo ON sii_libros_downloads(periodo);
CREATE INDEX idx_libros_tipo ON sii_libros_downloads(tipo_libro);

-- ============================================================================
-- SII RPA SERVERS
-- ============================================================================

CREATE TABLE IF NOT EXISTS sii_rpa_servers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Server identification
  server_name VARCHAR(100) NOT NULL UNIQUE,
  server_url VARCHAR(255) NOT NULL,
  api_key_hash VARCHAR(64) NOT NULL,

  -- Capabilities
  max_concurrent_jobs INTEGER DEFAULT 3,
  supported_tasks sii_task_type[] DEFAULT ARRAY[
    'login_test',
    'f29_download',
    'libro_compras',
    'libro_ventas',
    'situacion_tributaria'
  ]::sii_task_type[],

  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  last_heartbeat TIMESTAMP WITH TIME ZONE,
  current_jobs INTEGER DEFAULT 0,

  -- Performance metrics
  total_jobs_executed INTEGER DEFAULT 0,
  success_rate DECIMAL(5,2) DEFAULT 0,
  avg_execution_time_ms INTEGER,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_rpa_servers_active ON sii_rpa_servers(is_active);

-- ============================================================================
-- SCHEDULED SII TASKS
-- ============================================================================

CREATE TABLE IF NOT EXISTS sii_scheduled_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,

  -- Schedule
  task_type sii_task_type NOT NULL,
  cron_expression VARCHAR(50) NOT NULL,
  descripcion TEXT,

  -- Configuration
  parametros JSONB DEFAULT '{}',
  activo BOOLEAN DEFAULT TRUE,

  -- Execution tracking
  ultima_ejecucion TIMESTAMP WITH TIME ZONE,
  proxima_ejecucion TIMESTAMP WITH TIME ZONE,
  ultimo_resultado VARCHAR(50),
  ultimo_error TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT unique_schedule_per_client_task UNIQUE(cliente_id, task_type)
);

CREATE INDEX idx_scheduled_tasks_cliente ON sii_scheduled_tasks(cliente_id);
CREATE INDEX idx_scheduled_tasks_proxima ON sii_scheduled_tasks(proxima_ejecucion);
CREATE INDEX idx_scheduled_tasks_activo ON sii_scheduled_tasks(activo);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_sii_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sii_jobs_timestamp ON sii_jobs;
CREATE TRIGGER trigger_sii_jobs_timestamp
  BEFORE UPDATE ON sii_jobs
  FOR EACH ROW EXECUTE FUNCTION update_sii_timestamp();

DROP TRIGGER IF EXISTS trigger_situacion_timestamp ON sii_situacion_tributaria;
CREATE TRIGGER trigger_situacion_timestamp
  BEFORE UPDATE ON sii_situacion_tributaria
  FOR EACH ROW EXECUTE FUNCTION update_sii_timestamp();

DROP TRIGGER IF EXISTS trigger_f29_submissions_timestamp ON sii_f29_submissions;
CREATE TRIGGER trigger_f29_submissions_timestamp
  BEFORE UPDATE ON sii_f29_submissions
  FOR EACH ROW EXECUTE FUNCTION update_sii_timestamp();

DROP TRIGGER IF EXISTS trigger_rpa_servers_timestamp ON sii_rpa_servers;
CREATE TRIGGER trigger_rpa_servers_timestamp
  BEFORE UPDATE ON sii_rpa_servers
  FOR EACH ROW EXECUTE FUNCTION update_sii_timestamp();

DROP TRIGGER IF EXISTS trigger_scheduled_tasks_timestamp ON sii_scheduled_tasks;
CREATE TRIGGER trigger_scheduled_tasks_timestamp
  BEFORE UPDATE ON sii_scheduled_tasks
  FOR EACH ROW EXECUTE FUNCTION update_sii_timestamp();

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE sii_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sii_execution_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE sii_situacion_tributaria ENABLE ROW LEVEL SECURITY;
ALTER TABLE sii_f29_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sii_libros_downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE sii_scheduled_tasks ENABLE ROW LEVEL SECURITY;

-- SII Jobs policy
DROP POLICY IF EXISTS "Users can manage SII jobs for their clients" ON sii_jobs;
CREATE POLICY "Users can manage SII jobs for their clients" ON sii_jobs
  FOR ALL USING (
    cliente_id IN (
      SELECT id FROM clientes WHERE contador_asignado_id = auth.uid()
    ) OR is_admin(auth.uid())
  );

-- Execution steps policy
DROP POLICY IF EXISTS "Users can view execution steps for their jobs" ON sii_execution_steps;
CREATE POLICY "Users can view execution steps for their jobs" ON sii_execution_steps
  FOR SELECT USING (
    sii_job_id IN (
      SELECT id FROM sii_jobs WHERE cliente_id IN (
        SELECT id FROM clientes WHERE contador_asignado_id = auth.uid()
      )
    ) OR is_admin(auth.uid())
  );

-- Situacion tributaria policy
DROP POLICY IF EXISTS "Users can view situacion for their clients" ON sii_situacion_tributaria;
CREATE POLICY "Users can view situacion for their clients" ON sii_situacion_tributaria
  FOR ALL USING (
    cliente_id IN (
      SELECT id FROM clientes WHERE contador_asignado_id = auth.uid()
    ) OR is_admin(auth.uid())
  );

-- F29 submissions policy
DROP POLICY IF EXISTS "Users can view F29 submissions for their clients" ON sii_f29_submissions;
CREATE POLICY "Users can view F29 submissions for their clients" ON sii_f29_submissions
  FOR ALL USING (
    f29_calculo_id IN (
      SELECT id FROM f29_calculos WHERE cliente_id IN (
        SELECT id FROM clientes WHERE contador_asignado_id = auth.uid()
      )
    ) OR is_admin(auth.uid())
  );

-- Libro downloads policy
DROP POLICY IF EXISTS "Users can view libro downloads for their clients" ON sii_libros_downloads;
CREATE POLICY "Users can view libro downloads for their clients" ON sii_libros_downloads
  FOR ALL USING (
    cliente_id IN (
      SELECT id FROM clientes WHERE contador_asignado_id = auth.uid()
    ) OR is_admin(auth.uid())
  );

-- Scheduled tasks policy
DROP POLICY IF EXISTS "Users can manage schedules for their clients" ON sii_scheduled_tasks;
CREATE POLICY "Users can manage schedules for their clients" ON sii_scheduled_tasks
  FOR ALL USING (
    cliente_id IN (
      SELECT id FROM clientes WHERE contador_asignado_id = auth.uid()
    ) OR is_admin(auth.uid())
  );

-- ============================================================================
-- DATABASE FUNCTIONS
-- ============================================================================

-- Function to get next available RPA server
CREATE OR REPLACE FUNCTION get_available_rpa_server(p_task_type sii_task_type)
RETURNS TABLE (
  server_id UUID,
  server_url VARCHAR,
  server_name VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id,
    s.server_url,
    s.server_name
  FROM sii_rpa_servers s
  WHERE s.is_active = TRUE
    AND p_task_type = ANY(s.supported_tasks)
    AND s.current_jobs < s.max_concurrent_jobs
    AND (s.last_heartbeat IS NULL OR s.last_heartbeat > NOW() - INTERVAL '5 minutes')
  ORDER BY s.current_jobs ASC, s.success_rate DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Function to get pending SII jobs
CREATE OR REPLACE FUNCTION get_pending_sii_jobs(p_limit INTEGER DEFAULT 10)
RETURNS TABLE (
  job_id UUID,
  cliente_id UUID,
  task_type sii_task_type,
  parametros JSONB,
  priority INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    sj.id,
    sj.cliente_id,
    sj.task_type,
    sj.parametros,
    CASE
      WHEN sj.task_type = 'f29_submit' THEN 1
      WHEN sj.task_type = 'situacion_tributaria' THEN 2
      ELSE 3
    END as priority
  FROM sii_jobs sj
  WHERE sj.status = 'pendiente'
    AND sj.execution_server IS NULL
  ORDER BY priority ASC, sj.created_at ASC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate SII job statistics
CREATE OR REPLACE FUNCTION get_sii_job_stats(p_cliente_id UUID DEFAULT NULL)
RETURNS TABLE (
  total_jobs BIGINT,
  successful_jobs BIGINT,
  failed_jobs BIGINT,
  pending_jobs BIGINT,
  success_rate DECIMAL,
  avg_duration_seconds DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT as total_jobs,
    COUNT(*) FILTER (WHERE sj.status = 'completado')::BIGINT as successful_jobs,
    COUNT(*) FILTER (WHERE sj.status = 'fallido')::BIGINT as failed_jobs,
    COUNT(*) FILTER (WHERE sj.status IN ('pendiente', 'ejecutando'))::BIGINT as pending_jobs,
    ROUND(
      (COUNT(*) FILTER (WHERE sj.status = 'completado')::DECIMAL / NULLIF(COUNT(*), 0)) * 100,
      2
    ) as success_rate,
    ROUND(
      AVG(EXTRACT(EPOCH FROM (sj.completed_at - sj.started_at))) FILTER (WHERE sj.completed_at IS NOT NULL),
      2
    ) as avg_duration_seconds
  FROM sii_jobs sj
  WHERE (p_cliente_id IS NULL OR sj.cliente_id = p_cliente_id);
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STORAGE BUCKET (run manually in Supabase dashboard)
-- ============================================================================
-- CREATE BUCKET: sii-screenshots (public: false)
-- CREATE BUCKET: sii-documents (public: false)
