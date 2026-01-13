-- Phase 4: Document Intelligence & Analytics
-- Adds tables and functions for template analytics, document classification, and insights

-- ============================================================================
-- TEMPLATE ANALYTICS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS template_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plantilla_id UUID NOT NULL REFERENCES documento_plantillas(id) ON DELETE CASCADE,
  cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,

  -- Usage metrics
  uso_total INTEGER DEFAULT 0,
  uso_mes_actual INTEGER DEFAULT 0,
  uso_mes_anterior INTEGER DEFAULT 0,

  -- Time tracking
  primera_usada_en TIMESTAMP WITH TIME ZONE,
  ultima_usada_en TIMESTAMP WITH TIME ZONE,
  dias_sin_usar INTEGER DEFAULT 0,

  -- Success metrics
  documentos_exitosos INTEGER DEFAULT 0,
  documentos_rechazados INTEGER DEFAULT 0,
  tasa_exito DECIMAL(5,2) DEFAULT 100,

  -- Amount tracking
  monto_total_procesado DECIMAL(15,2) DEFAULT 0,
  monto_promedio DECIMAL(12,2) DEFAULT 0,
  monto_minimo DECIMAL(12,2),
  monto_maximo DECIMAL(12,2),

  -- Performance
  tiempo_promedio_ms INTEGER DEFAULT 0,

  -- Metadata
  analizado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(plantilla_id, cliente_id)
);

CREATE INDEX idx_template_analytics_cliente_id ON template_analytics(cliente_id);
CREATE INDEX idx_template_analytics_plantilla_id ON template_analytics(plantilla_id);
CREATE INDEX idx_template_analytics_tasa_exito ON template_analytics(tasa_exito);

-- ============================================================================
-- DOCUMENT CLASSIFICATION TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS document_classifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  documento_carga_id UUID NOT NULL REFERENCES documento_cargas(id) ON DELETE CASCADE,
  cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,

  -- Classification results
  tipo_predicho TEXT,
  tipo_real TEXT,
  confianza DECIMAL(5,2),

  -- Folio prediction
  folio_sugerido TEXT,
  folio_usado TEXT,
  folio_correcto BOOLEAN DEFAULT NULL,

  -- Template suggestion
  plantilla_sugerida_id UUID REFERENCES documento_plantillas(id),
  plantilla_usada_id UUID REFERENCES documento_plantillas(id),

  -- Amount prediction
  monto_sugerido DECIMAL(12,2),
  monto_real DECIMAL(12,2),
  diferencia_monto DECIMAL(12,2),

  -- ML model info
  modelo_version TEXT,
  features_usados JSONB,
  probabilidades JSONB,

  -- Feedback
  feedback_usuario TEXT,
  retroalimentacion_usada BOOLEAN DEFAULT FALSE,

  -- Timestamps
  clasificado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(documento_carga_id)
);

CREATE INDEX idx_document_classifications_cliente ON document_classifications(cliente_id);
CREATE INDEX idx_document_classifications_tipo_predicho ON document_classifications(tipo_predicho);
CREATE INDEX idx_document_classifications_confianza ON document_classifications(confianza);
CREATE INDEX idx_document_classifications_plantilla ON document_classifications(plantilla_sugerida_id);

-- ============================================================================
-- DOCUMENT INSIGHTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS document_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,

  -- Date tracking
  fecha DATE NOT NULL,
  mes TEXT NOT NULL,
  ano INTEGER NOT NULL,

  -- Document statistics
  documentos_cargados INTEGER DEFAULT 0,
  documentos_aprobados INTEGER DEFAULT 0,
  documentos_rechazados INTEGER DEFAULT 0,
  documentos_en_proceso INTEGER DEFAULT 0,

  -- Type breakdown
  facturas_count INTEGER DEFAULT 0,
  boletas_count INTEGER DEFAULT 0,
  notas_credito_count INTEGER DEFAULT 0,
  notas_debito_count INTEGER DEFAULT 0,
  otros_count INTEGER DEFAULT 0,

  -- Amount metrics
  monto_total DECIMAL(15,2) DEFAULT 0,
  monto_promedio DECIMAL(12,2) DEFAULT 0,
  monto_maximo DECIMAL(12,2),
  monto_minimo DECIMAL(12,2),

  -- Time metrics
  tiempo_promedio_aprobacion_horas DECIMAL(8,2) DEFAULT 0,

  -- Template usage
  plantillas_usadas INTEGER DEFAULT 0,
  plantilla_mas_usada_id UUID REFERENCES documento_plantillas(id),

  -- Trends
  tendencia_mes_anterior DECIMAL(5,2),
  indice_crecimiento DECIMAL(5,2),

  -- Metadata
  analizado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(cliente_id, fecha)
);

CREATE INDEX idx_document_insights_cliente ON document_insights(cliente_id);
CREATE INDEX idx_document_insights_fecha ON document_insights(fecha);
CREATE INDEX idx_document_insights_mes ON document_insights(ano, mes);

-- ============================================================================
-- SMART SUGGESTIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS smart_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,

  -- What is being suggested
  tipo_sugerencia TEXT NOT NULL, -- 'template', 'folio', 'amount', 'category'

  -- The suggestion
  sugerencia_id UUID,
  sugerencia_texto TEXT,

  -- Confidence and reasoning
  confianza DECIMAL(5,2),
  razon TEXT,
  contexto JSONB,

  -- Timing
  basado_en TEXT, -- 'frequency', 'pattern', 'history', 'ml_model'

  -- User feedback
  aceptada BOOLEAN DEFAULT NULL,
  retroalimentacion_usuario TEXT,

  -- Timestamps
  sugerida_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  aceptada_en TIMESTAMP WITH TIME ZONE,

  UNIQUE(cliente_id, tipo_sugerencia, sugerencia_id)
);

CREATE INDEX idx_smart_suggestions_cliente ON smart_suggestions(cliente_id);
CREATE INDEX idx_smart_suggestions_tipo ON smart_suggestions(tipo_sugerencia);
CREATE INDEX idx_smart_suggestions_confianza ON smart_suggestions(confianza);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to calculate template usage analytics
CREATE OR REPLACE FUNCTION calcular_analisis_plantilla(
  p_plantilla_id UUID
)
RETURNS TABLE (
  uso_total INTEGER,
  uso_mes_actual INTEGER,
  tasa_exito DECIMAL,
  monto_promedio DECIMAL,
  dias_sin_usar INTEGER
) AS $$
DECLARE
  v_uso_total INTEGER;
  v_uso_mes INTEGER;
  v_exitosos INTEGER;
  v_total INTEGER;
  v_tasa DECIMAL;
  v_promedio DECIMAL;
  v_dias INTEGER;
BEGIN
  -- Get total usage
  SELECT COUNT(*) INTO v_uso_total
  FROM documento_cargas
  WHERE plantilla_id = p_plantilla_id;

  -- Get this month's usage
  SELECT COUNT(*) INTO v_uso_mes
  FROM documento_cargas
  WHERE plantilla_id = p_plantilla_id
    AND DATE_TRUNC('month', cargado_en) = DATE_TRUNC('month', NOW());

  -- Calculate success rate
  SELECT COUNT(*) INTO v_exitosos
  FROM documento_cargas
  WHERE plantilla_id = p_plantilla_id
    AND estado IN ('validado', 'aprobado', 'enviado_nubox');

  v_total := COALESCE(v_uso_total, 1);
  v_tasa := (COALESCE(v_exitosos, 0)::DECIMAL / v_total) * 100;

  -- Calculate average amount
  SELECT AVG(monto_total) INTO v_promedio
  FROM documento_cargas
  WHERE plantilla_id = p_plantilla_id;

  -- Calculate days without use
  SELECT EXTRACT(DAY FROM (NOW() - MAX(cargado_en)))::INTEGER INTO v_dias
  FROM documento_cargas
  WHERE plantilla_id = p_plantilla_id;

  RETURN QUERY SELECT v_uso_total, v_uso_mes, v_tasa, v_promedio, COALESCE(v_dias, 0);
END;
$$ LANGUAGE plpgsql;

-- Function to get template recommendations for a client
CREATE OR REPLACE FUNCTION obtener_plantillas_recomendadas(
  p_cliente_id UUID,
  p_limite INTEGER DEFAULT 5
)
RETURNS TABLE (
  plantilla_id UUID,
  nombre TEXT,
  score DECIMAL,
  razon TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.id,
    t.nombre,
    ((ta.uso_mes_actual::DECIMAL / NULLIF(ta.uso_total, 0)) * ta.tasa_exito / 100)::DECIMAL,
    CASE
      WHEN ta.uso_mes_actual > ta.uso_mes_anterior THEN 'Tendencia creciente'
      WHEN ta.tasa_exito > 95 THEN 'Tasa de éxito muy alta'
      WHEN ta.uso_total > 10 THEN 'Muy frecuente'
      ELSE 'Recomendada'
    END
  FROM documento_plantillas t
  LEFT JOIN template_analytics ta ON t.id = ta.plantilla_id
  WHERE t.cliente_id = p_cliente_id
    AND t.activa = true
  ORDER BY COALESCE(ta.tasa_exito, 0) DESC, COALESCE(ta.uso_total, 0) DESC
  LIMIT p_limite;
END;
$$ LANGUAGE plpgsql;

-- Function to get insights for a date range
CREATE OR REPLACE FUNCTION obtener_insights_rango(
  p_cliente_id UUID,
  p_fecha_inicio DATE,
  p_fecha_fin DATE
)
RETURNS TABLE (
  fecha DATE,
  documentos_cargados INTEGER,
  documentos_aprobados INTEGER,
  monto_total DECIMAL,
  tasa_aprobacion DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    di.fecha,
    di.documentos_cargados,
    di.documentos_aprobados,
    di.monto_total,
    CASE
      WHEN di.documentos_cargados > 0 THEN (di.documentos_aprobados::DECIMAL / di.documentos_cargados * 100)
      ELSE 0
    END
  FROM document_insights di
  WHERE di.cliente_id = p_cliente_id
    AND di.fecha BETWEEN p_fecha_inicio AND p_fecha_fin
  ORDER BY di.fecha;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update analytics timestamp
CREATE OR REPLACE FUNCTION actualizar_timestamp_analytics()
RETURNS TRIGGER AS $$
BEGIN
  NEW.actualizado_en = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_actualizar_timestamp_analytics
  BEFORE UPDATE ON template_analytics
  FOR EACH ROW
  EXECUTE FUNCTION actualizar_timestamp_analytics();

-- Auto-update classifications timestamp
CREATE OR REPLACE FUNCTION actualizar_timestamp_classifications()
RETURNS TRIGGER AS $$
BEGIN
  NEW.actualizado_en = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_actualizar_timestamp_classifications
  BEFORE UPDATE ON document_classifications
  FOR EACH ROW
  EXECUTE FUNCTION actualizar_timestamp_classifications();

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE template_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_classifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE smart_suggestions ENABLE ROW LEVEL SECURITY;

-- Template Analytics Policies
CREATE POLICY "Users can view template analytics for their clients" ON template_analytics
  FOR SELECT
  USING (
    cliente_id IN (
      SELECT id FROM clientes WHERE contador_asignado_id = auth.uid()
    ) OR
    (SELECT is_admin() FROM auth.users WHERE id = auth.uid())
  );

-- Document Classifications Policies
CREATE POLICY "Users can view document classifications for their clients" ON document_classifications
  FOR SELECT
  USING (
    cliente_id IN (
      SELECT id FROM clientes WHERE contador_asignado_id = auth.uid()
    ) OR
    (SELECT is_admin() FROM auth.users WHERE id = auth.uid())
  );

CREATE POLICY "Users can update classifications for their clients" ON document_classifications
  FOR UPDATE
  USING (
    cliente_id IN (
      SELECT id FROM clientes WHERE contador_asignado_id = auth.uid()
    ) OR
    (SELECT is_admin() FROM auth.users WHERE id = auth.uid())
  );

-- Document Insights Policies
CREATE POLICY "Users can view insights for their clients" ON document_insights
  FOR SELECT
  USING (
    cliente_id IN (
      SELECT id FROM clientes WHERE contador_asignado_id = auth.uid()
    ) OR
    (SELECT is_admin() FROM auth.users WHERE id = auth.uid())
  );

-- Smart Suggestions Policies
CREATE POLICY "Users can view suggestions for their clients" ON smart_suggestions
  FOR SELECT
  USING (
    cliente_id IN (
      SELECT id FROM clientes WHERE contador_asignado_id = auth.uid()
    ) OR
    (SELECT is_admin() FROM auth.users WHERE id = auth.uid())
  );

CREATE POLICY "Users can update suggestions for their clients" ON smart_suggestions
  FOR UPDATE
  USING (
    cliente_id IN (
      SELECT id FROM clientes WHERE contador_asignado_id = auth.uid()
    ) OR
    (SELECT is_admin() FROM auth.users WHERE id = auth.uid())
  );
