-- Queue System for Phase 6 Job Processing
-- Supports background job queue, scheduling, and retry logic

-- ============================================================================
-- QUEUE JOBS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS queue_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Job definition
  tipo VARCHAR(50) NOT NULL, -- 'email', 'webhook', 'archive', 'delete', 'notification', 'report'
  datos JSONB NOT NULL,

  -- Status tracking
  estado VARCHAR(50) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  intentos INTEGER DEFAULT 0,
  max_intentos INTEGER DEFAULT 3,
  error TEXT,

  -- Results
  resultado JSONB,

  -- Scheduling
  creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  proxima_tentativa TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT queue_jobs_estado_check CHECK (estado IN ('pending', 'processing', 'completed', 'failed'))
);

CREATE INDEX idx_queue_jobs_estado ON queue_jobs(estado);
CREATE INDEX idx_queue_jobs_proxima ON queue_jobs(proxima_tentativa);
CREATE INDEX idx_queue_jobs_creado ON queue_jobs(creado_en);

-- ============================================================================
-- SCHEDULED JOBS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS scheduled_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Job definition
  nombre VARCHAR(255) NOT NULL UNIQUE,
  descripcion TEXT,
  cron_expression VARCHAR(50) NOT NULL, -- '0 2 *' = 2 AM daily
  tipo VARCHAR(50) NOT NULL,
  parametros JSONB,

  -- Status
  activo BOOLEAN DEFAULT TRUE,
  ultima_ejecucion TIMESTAMP WITH TIME ZONE,
  proxima_ejecucion TIMESTAMP WITH TIME ZONE,
  ultimo_resultado JSONB,
  ultimo_error TEXT,

  -- Metadata
  creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT scheduled_jobs_nombre_check CHECK (nombre != '')
);

CREATE INDEX idx_scheduled_jobs_activo ON scheduled_jobs(activo);
CREATE INDEX idx_scheduled_jobs_proxima ON scheduled_jobs(proxima_ejecucion);

-- ============================================================================
-- QUEUE STATS VIEW
-- ============================================================================

CREATE OR REPLACE VIEW queue_stats AS
SELECT
  estado,
  COUNT(*) as count,
  MAX(actualizado_en) as ultimo_actualizado
FROM queue_jobs
GROUP BY estado;

-- ============================================================================
-- QUEUE FUNCTIONS
-- ============================================================================

-- Function to count jobs by status
CREATE OR REPLACE FUNCTION contar_trabajos_por_estado()
RETURNS TABLE (
  estado VARCHAR,
  cantidad INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT q.estado, COUNT(*)::INTEGER
  FROM queue_jobs q
  GROUP BY q.estado;
END;
$$ LANGUAGE plpgsql;

-- Function to get pending jobs
CREATE OR REPLACE FUNCTION obtener_trabajos_pendientes(
  p_limite INTEGER DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  tipo VARCHAR,
  datos JSONB,
  creado_en TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    q.id,
    q.tipo,
    q.datos,
    q.creado_en
  FROM queue_jobs q
  WHERE q.estado = 'pending'
    AND q.proxima_tentativa <= NOW()
    AND q.intentos < q.max_intentos
  ORDER BY q.creado_en ASC
  LIMIT p_limite;
END;
$$ LANGUAGE plpgsql;

-- Function to retry failed jobs
CREATE OR REPLACE FUNCTION reintentar_trabajos_fallidos()
RETURNS INTEGER AS $$
DECLARE
  v_actualizado INTEGER;
BEGIN
  UPDATE queue_jobs
  SET
    estado = 'pending',
    proxima_tentativa = NOW() + (POWER(2, intentos) || ' seconds')::INTERVAL,
    actualizado_en = NOW()
  WHERE estado = 'failed'
    AND intentos < max_intentos
    AND proxima_tentativa <= NOW();

  GET DIAGNOSTICS v_actualizado = ROW_COUNT;
  RETURN v_actualizado;
END;
$$ LANGUAGE plpgsql;

-- Function to clean old completed jobs
CREATE OR REPLACE FUNCTION limpiar_trabajos_antiguos(
  p_dias_retencion INTEGER DEFAULT 30
)
RETURNS INTEGER AS $$
DECLARE
  v_eliminado INTEGER;
BEGIN
  DELETE FROM queue_jobs
  WHERE estado = 'completed'
    AND actualizado_en < NOW() - (p_dias_retencion || ' days')::INTERVAL;

  GET DIAGNOSTICS v_eliminado = ROW_COUNT;
  RETURN v_eliminado;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update timestamp for queue_jobs
CREATE OR REPLACE FUNCTION actualizar_timestamp_queue()
RETURNS TRIGGER AS $$
BEGIN
  NEW.actualizado_en = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_actualizar_timestamp_queue_jobs
  BEFORE UPDATE ON queue_jobs
  FOR EACH ROW
  EXECUTE FUNCTION actualizar_timestamp_queue();

CREATE TRIGGER trigger_actualizar_timestamp_scheduled_jobs
  BEFORE UPDATE ON scheduled_jobs
  FOR EACH ROW
  EXECUTE FUNCTION actualizar_timestamp_queue();

-- ============================================================================
-- MAINTENANCE TASKS
-- ============================================================================

-- Run maintenance every hour (cleanup old jobs, retry failed ones)
-- This can be integrated with a cron job or application scheduler

-- SELECT limpiar_trabajos_antiguos(30); -- Cleanup jobs older than 30 days
-- SELECT reintentar_trabajos_fallidos(); -- Retry failed jobs with backoff
