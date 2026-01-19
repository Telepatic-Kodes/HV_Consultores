-- =============================================================================
-- HV Consultores - Migración: Cartolas Bancarias y Parametrización
-- Fecha: 2026-01-13
-- Descripción: Tablas para gestión de cartolas bancarias, categorización
--              automática, mapeo contable y conciliación SII
-- =============================================================================

-- =============================================================================
-- TIPOS ENUM
-- =============================================================================

-- Bancos soportados
CREATE TYPE bank_code AS ENUM ('bancochile', 'bancoestado', 'santander', 'bci');

-- Tipos de cuenta bancaria
CREATE TYPE bank_account_type AS ENUM ('corriente', 'vista', 'ahorro', 'credito');

-- Monedas
CREATE TYPE bank_currency AS ENUM ('CLP', 'USD', 'EUR', 'UF');

-- Tipo de transacción
CREATE TYPE transaction_type AS ENUM ('cargo', 'abono');

-- Estado de jobs
CREATE TYPE cartola_job_status AS ENUM (
  'pending', 'queued', 'running', 'downloading',
  'parsing', 'categorizing', 'completed', 'failed', 'cancelled'
);

-- Formato de archivo
CREATE TYPE cartola_file_format AS ENUM ('pdf', 'excel', 'csv', 'ofx', 'unknown');

-- Origen del archivo
CREATE TYPE cartola_file_source AS ENUM ('rpa', 'manual', 'api');

-- Estado de conciliación
CREATE TYPE reconciliation_status AS ENUM ('pending', 'matched', 'partial', 'unmatched', 'manual');

-- Tipo de cuenta contable
CREATE TYPE accounting_type AS ENUM ('activo', 'pasivo', 'patrimonio', 'ingreso', 'gasto');

-- =============================================================================
-- TABLA: cartolas_cuentas_bancarias
-- Cuentas bancarias por cliente
-- =============================================================================

CREATE TABLE IF NOT EXISTS cartolas_cuentas_bancarias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  banco bank_code NOT NULL,
  numero_cuenta VARCHAR(50) NOT NULL,
  tipo_cuenta bank_account_type NOT NULL DEFAULT 'corriente',
  moneda bank_currency DEFAULT 'CLP',
  alias VARCHAR(100),
  credencial_id UUID REFERENCES credenciales_portales(id) ON DELETE SET NULL,
  activa BOOLEAN DEFAULT true,
  saldo_actual DECIMAL(15,2),
  ultima_descarga TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(cliente_id, banco, numero_cuenta)
);

-- Índices
CREATE INDEX idx_cartolas_cuentas_cliente ON cartolas_cuentas_bancarias(cliente_id);
CREATE INDEX idx_cartolas_cuentas_banco ON cartolas_cuentas_bancarias(banco);
CREATE INDEX idx_cartolas_cuentas_activa ON cartolas_cuentas_bancarias(activa) WHERE activa = true;

-- Trigger para updated_at
CREATE TRIGGER update_cartolas_cuentas_updated_at
  BEFORE UPDATE ON cartolas_cuentas_bancarias
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE cartolas_cuentas_bancarias IS 'Cuentas bancarias registradas por cliente para descarga de cartolas';

-- =============================================================================
-- TABLA: cartolas_jobs
-- Jobs de descarga y procesamiento de cartolas
-- =============================================================================

CREATE TABLE IF NOT EXISTS cartolas_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cuenta_id UUID NOT NULL REFERENCES cartolas_cuentas_bancarias(id) ON DELETE CASCADE,
  tipo VARCHAR(30) NOT NULL DEFAULT 'descarga', -- descarga, procesamiento, recategorizacion
  estado cartola_job_status DEFAULT 'pending',
  fecha_inicio TIMESTAMPTZ,
  fecha_fin TIMESTAMPTZ,
  -- Período objetivo
  mes_objetivo INTEGER CHECK (mes_objetivo BETWEEN 1 AND 12),
  año_objetivo INTEGER CHECK (año_objetivo BETWEEN 2000 AND 2100),
  fecha_desde DATE,
  fecha_hasta DATE,
  -- Resultado
  archivo_id UUID,
  transacciones_procesadas INTEGER DEFAULT 0,
  transacciones_categorizadas INTEGER DEFAULT 0,
  -- Errores
  error_mensaje TEXT,
  error_detalle JSONB,
  -- Reintentos
  intentos INTEGER DEFAULT 0,
  max_intentos INTEGER DEFAULT 3,
  proximo_reintento TIMESTAMPTZ,
  -- Metadata
  rpa_server_id VARCHAR(50),
  screenshots TEXT[], -- Array de paths a screenshots
  logs TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_cartolas_jobs_cuenta ON cartolas_jobs(cuenta_id);
CREATE INDEX idx_cartolas_jobs_estado ON cartolas_jobs(estado);
CREATE INDEX idx_cartolas_jobs_periodo ON cartolas_jobs(año_objetivo, mes_objetivo);
CREATE INDEX idx_cartolas_jobs_pendientes ON cartolas_jobs(estado, proximo_reintento)
  WHERE estado IN ('pending', 'failed');

-- Trigger para updated_at
CREATE TRIGGER update_cartolas_jobs_updated_at
  BEFORE UPDATE ON cartolas_jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE cartolas_jobs IS 'Jobs de descarga y procesamiento de cartolas bancarias';

-- =============================================================================
-- TABLA: cartolas_archivos
-- Archivos de cartola descargados o subidos
-- =============================================================================

CREATE TABLE IF NOT EXISTS cartolas_archivos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cuenta_id UUID NOT NULL REFERENCES cartolas_cuentas_bancarias(id) ON DELETE CASCADE,
  job_id UUID REFERENCES cartolas_jobs(id) ON DELETE SET NULL,
  nombre_archivo VARCHAR(255) NOT NULL,
  formato cartola_file_format NOT NULL DEFAULT 'pdf',
  origen cartola_file_source NOT NULL DEFAULT 'manual',
  storage_path TEXT NOT NULL,
  tamaño_bytes INTEGER,
  hash_contenido VARCHAR(64), -- SHA-256
  -- Período
  mes INTEGER NOT NULL CHECK (mes BETWEEN 1 AND 12),
  año INTEGER NOT NULL CHECK (año BETWEEN 2000 AND 2100),
  fecha_desde DATE,
  fecha_hasta DATE,
  -- Procesamiento
  procesado BOOLEAN DEFAULT false,
  fecha_procesamiento TIMESTAMPTZ,
  error_procesamiento TEXT,
  -- Estadísticas
  total_transacciones INTEGER DEFAULT 0,
  saldo_inicial DECIMAL(15,2),
  saldo_final DECIMAL(15,2),
  total_cargos DECIMAL(15,2) DEFAULT 0,
  total_abonos DECIMAL(15,2) DEFAULT 0,
  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_cartolas_archivos_cuenta ON cartolas_archivos(cuenta_id);
CREATE INDEX idx_cartolas_archivos_periodo ON cartolas_archivos(año, mes);
CREATE INDEX idx_cartolas_archivos_procesado ON cartolas_archivos(procesado) WHERE procesado = false;
CREATE UNIQUE INDEX idx_cartolas_archivos_hash ON cartolas_archivos(cuenta_id, hash_contenido)
  WHERE hash_contenido IS NOT NULL;

COMMENT ON TABLE cartolas_archivos IS 'Archivos de cartola bancaria descargados o subidos manualmente';

-- =============================================================================
-- TABLA: cartolas_categorias
-- Categorías para clasificación de transacciones
-- =============================================================================

CREATE TABLE IF NOT EXISTS cartolas_categorias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(10) NOT NULL UNIQUE,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,
  tipo_default transaction_type,
  cuenta_contable_default VARCHAR(20),
  color VARCHAR(20) DEFAULT '#6b7280',
  icono VARCHAR(50),
  orden INTEGER DEFAULT 100,
  activa BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insertar categorías por defecto
INSERT INTO cartolas_categorias (codigo, nombre, descripcion, tipo_default, color, icono, orden) VALUES
  ('VEN', 'Ventas/Ingresos', 'Ingresos por ventas y servicios', 'abono', '#22c55e', 'TrendingUp', 1),
  ('COM', 'Compras/Proveedores', 'Pagos a proveedores y compras', 'cargo', '#ef4444', 'ShoppingCart', 2),
  ('REM', 'Sueldos/Remuneraciones', 'Pagos de remuneraciones y cotizaciones', 'cargo', '#f59e0b', 'Users', 3),
  ('IMP', 'Impuestos', 'Pagos de impuestos (IVA, PPM, F29)', 'cargo', '#8b5cf6', 'FileText', 4),
  ('SER', 'Servicios Básicos', 'Luz, agua, gas, teléfono, internet', 'cargo', '#3b82f6', 'Zap', 5),
  ('FIN', 'Gastos Financieros', 'Comisiones, intereses, seguros bancarios', 'cargo', '#ec4899', 'CreditCard', 6),
  ('TRF', 'Transferencias Internas', 'Traspasos entre cuentas propias', NULL, '#6b7280', 'ArrowLeftRight', 7),
  ('OTR', 'Otros', 'Transacciones sin categoría específica', NULL, '#a1a1aa', 'MoreHorizontal', 99)
ON CONFLICT (codigo) DO NOTHING;

COMMENT ON TABLE cartolas_categorias IS 'Categorías para clasificación de transacciones bancarias';

-- =============================================================================
-- TABLA: cartolas_transacciones
-- Transacciones bancarias extraídas de cartolas
-- =============================================================================

CREATE TABLE IF NOT EXISTS cartolas_transacciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cuenta_id UUID NOT NULL REFERENCES cartolas_cuentas_bancarias(id) ON DELETE CASCADE,
  cartola_archivo_id UUID REFERENCES cartolas_archivos(id) ON DELETE SET NULL,
  -- Datos de la transacción
  fecha DATE NOT NULL,
  fecha_valor DATE,
  descripcion TEXT NOT NULL,
  descripcion_normalizada TEXT,
  referencia VARCHAR(100),
  monto DECIMAL(15,2) NOT NULL,
  tipo transaction_type NOT NULL,
  saldo DECIMAL(15,2),
  -- Parametrización
  categoria_id UUID REFERENCES cartolas_categorias(id) ON DELETE SET NULL,
  categoria_confianza DECIMAL(3,2) CHECK (categoria_confianza BETWEEN 0 AND 1),
  categorizado_manual BOOLEAN DEFAULT false,
  cuenta_contable VARCHAR(20),
  centro_costo VARCHAR(50),
  -- Conciliación SII
  conciliado_sii BOOLEAN DEFAULT false,
  documento_sii_id UUID, -- Referencia a documento en módulo docs
  estado_conciliacion reconciliation_status DEFAULT 'pending',
  -- Detección de duplicados
  hash_transaccion VARCHAR(64) NOT NULL,
  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Evitar duplicados por cuenta
  UNIQUE(cuenta_id, hash_transaccion)
);

-- Índices
CREATE INDEX idx_cartolas_trans_cuenta ON cartolas_transacciones(cuenta_id);
CREATE INDEX idx_cartolas_trans_archivo ON cartolas_transacciones(cartola_archivo_id);
CREATE INDEX idx_cartolas_trans_fecha ON cartolas_transacciones(fecha DESC);
CREATE INDEX idx_cartolas_trans_categoria ON cartolas_transacciones(categoria_id);
CREATE INDEX idx_cartolas_trans_tipo ON cartolas_transacciones(tipo);
CREATE INDEX idx_cartolas_trans_conciliacion ON cartolas_transacciones(estado_conciliacion);
CREATE INDEX idx_cartolas_trans_sin_categorizar ON cartolas_transacciones(cuenta_id, fecha)
  WHERE categoria_id IS NULL;
CREATE INDEX idx_cartolas_trans_sin_conciliar ON cartolas_transacciones(cuenta_id, fecha)
  WHERE conciliado_sii = false AND estado_conciliacion = 'pending';

-- Índice para búsqueda de texto
CREATE INDEX idx_cartolas_trans_descripcion ON cartolas_transacciones
  USING gin(to_tsvector('spanish', descripcion));

COMMENT ON TABLE cartolas_transacciones IS 'Transacciones bancarias extraídas de cartolas';

-- =============================================================================
-- TABLA: cartolas_reglas_categorizacion
-- Reglas para categorización automática
-- =============================================================================

CREATE TABLE IF NOT EXISTS cartolas_reglas_categorizacion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE, -- NULL = regla global
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,
  categoria_id UUID NOT NULL REFERENCES cartolas_categorias(id) ON DELETE CASCADE,
  cuenta_contable VARCHAR(20),
  centro_costo VARCHAR(50),
  -- Condiciones
  patron_descripcion TEXT[], -- Patrones regex
  palabras_clave TEXT[], -- Palabras exactas (case insensitive)
  monto_min DECIMAL(15,2),
  monto_max DECIMAL(15,2),
  tipo_transaccion transaction_type, -- NULL = ambos
  banco bank_code, -- NULL = todos los bancos
  -- Configuración
  prioridad INTEGER DEFAULT 100, -- Menor = mayor prioridad
  activa BOOLEAN DEFAULT true,
  -- Estadísticas
  veces_aplicada INTEGER DEFAULT 0,
  ultima_aplicacion TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_cartolas_reglas_cliente ON cartolas_reglas_categorizacion(cliente_id);
CREATE INDEX idx_cartolas_reglas_categoria ON cartolas_reglas_categorizacion(categoria_id);
CREATE INDEX idx_cartolas_reglas_activa ON cartolas_reglas_categorizacion(activa, prioridad)
  WHERE activa = true;

-- Trigger para updated_at
CREATE TRIGGER update_cartolas_reglas_updated_at
  BEFORE UPDATE ON cartolas_reglas_categorizacion
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insertar reglas globales por defecto
INSERT INTO cartolas_reglas_categorizacion (nombre, categoria_id, palabras_clave, tipo_transaccion, prioridad) VALUES
  ('Sueldos AFP', (SELECT id FROM cartolas_categorias WHERE codigo = 'REM'),
   ARRAY['AFP', 'PREVIRED', 'COTIZACION', 'PENSION'], 'cargo', 10),
  ('Sueldos Salud', (SELECT id FROM cartolas_categorias WHERE codigo = 'REM'),
   ARRAY['ISAPRE', 'FONASA', 'SALUD'], 'cargo', 10),
  ('Impuestos SII', (SELECT id FROM cartolas_categorias WHERE codigo = 'IMP'),
   ARRAY['SII', 'TESORERIA', 'F29', 'IVA', 'PPM', 'RENTA'], 'cargo', 20),
  ('Servicios Eléctricos', (SELECT id FROM cartolas_categorias WHERE codigo = 'SER'),
   ARRAY['ENEL', 'CGE', 'CHILQUINTA', 'LUZ', 'ELECTRICA'], 'cargo', 30),
  ('Servicios Agua', (SELECT id FROM cartolas_categorias WHERE codigo = 'SER'),
   ARRAY['AGUAS ANDINAS', 'ESVAL', 'ESSBIO', 'AGUA'], 'cargo', 30),
  ('Servicios Telecom', (SELECT id FROM cartolas_categorias WHERE codigo = 'SER'),
   ARRAY['ENTEL', 'MOVISTAR', 'CLARO', 'VTR', 'WOM', 'TELEFONO', 'INTERNET'], 'cargo', 30),
  ('Gastos Bancarios', (SELECT id FROM cartolas_categorias WHERE codigo = 'FIN'),
   ARRAY['COMISION', 'MANTENCION', 'CARGO BANCARIO', 'SEGURO DESGRAVAMEN'], 'cargo', 40),
  ('Transferencias Propias', (SELECT id FROM cartolas_categorias WHERE codigo = 'TRF'),
   ARRAY['TRASPASO ENTRE CUENTAS', 'TRANSFERENCIA PROPIA'], NULL, 50);

COMMENT ON TABLE cartolas_reglas_categorizacion IS 'Reglas para categorización automática de transacciones';

-- =============================================================================
-- TABLA: cartolas_plan_cuentas_mapping
-- Mapeo de categorías a plan de cuentas contable
-- =============================================================================

CREATE TABLE IF NOT EXISTS cartolas_plan_cuentas_mapping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE, -- NULL = mapeo global
  categoria_id UUID NOT NULL REFERENCES cartolas_categorias(id) ON DELETE CASCADE,
  cuenta_contable VARCHAR(20) NOT NULL,
  nombre_cuenta VARCHAR(100) NOT NULL,
  tipo_cuenta accounting_type NOT NULL,
  centro_costo_default VARCHAR(50),
  activa BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(cliente_id, categoria_id, cuenta_contable)
);

-- Índices
CREATE INDEX idx_cartolas_plan_cliente ON cartolas_plan_cuentas_mapping(cliente_id);
CREATE INDEX idx_cartolas_plan_categoria ON cartolas_plan_cuentas_mapping(categoria_id);

-- Trigger para updated_at
CREATE TRIGGER update_cartolas_plan_updated_at
  BEFORE UPDATE ON cartolas_plan_cuentas_mapping
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE cartolas_plan_cuentas_mapping IS 'Mapeo de categorías de transacciones a cuentas contables';

-- =============================================================================
-- TABLA: cartolas_conciliacion_sii
-- Resultados de conciliación con documentos SII
-- =============================================================================

CREATE TABLE IF NOT EXISTS cartolas_conciliacion_sii (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaccion_id UUID NOT NULL REFERENCES cartolas_transacciones(id) ON DELETE CASCADE,
  documento_sii_id UUID, -- Referencia a documento del módulo de documentos
  -- Datos del documento SII (si existe match)
  tipo_documento VARCHAR(20), -- factura, boleta, nc, nd
  folio_documento VARCHAR(50),
  rut_contraparte VARCHAR(12),
  nombre_contraparte VARCHAR(200),
  monto_documento DECIMAL(15,2),
  fecha_documento DATE,
  -- Resultado
  estado reconciliation_status DEFAULT 'pending',
  confianza_match DECIMAL(3,2) CHECK (confianza_match BETWEEN 0 AND 1),
  diferencia_monto DECIMAL(15,2),
  diferencia_dias INTEGER,
  -- Auditoría
  match_manual BOOLEAN DEFAULT false,
  usuario_match UUID,
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_cartolas_concil_transaccion ON cartolas_conciliacion_sii(transaccion_id);
CREATE INDEX idx_cartolas_concil_documento ON cartolas_conciliacion_sii(documento_sii_id);
CREATE INDEX idx_cartolas_concil_estado ON cartolas_conciliacion_sii(estado);

-- Trigger para updated_at
CREATE TRIGGER update_cartolas_concil_updated_at
  BEFORE UPDATE ON cartolas_conciliacion_sii
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE cartolas_conciliacion_sii IS 'Resultados de conciliación entre transacciones bancarias y documentos SII';

-- =============================================================================
-- TABLA: cartolas_estadisticas_mensuales
-- Estadísticas agregadas por cuenta y mes
-- =============================================================================

CREATE TABLE IF NOT EXISTS cartolas_estadisticas_mensuales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cuenta_id UUID NOT NULL REFERENCES cartolas_cuentas_bancarias(id) ON DELETE CASCADE,
  año INTEGER NOT NULL CHECK (año BETWEEN 2000 AND 2100),
  mes INTEGER NOT NULL CHECK (mes BETWEEN 1 AND 12),
  -- Totales
  total_transacciones INTEGER DEFAULT 0,
  total_cargos DECIMAL(15,2) DEFAULT 0,
  total_abonos DECIMAL(15,2) DEFAULT 0,
  cantidad_cargos INTEGER DEFAULT 0,
  cantidad_abonos INTEGER DEFAULT 0,
  -- Saldos
  saldo_inicio DECIMAL(15,2),
  saldo_fin DECIMAL(15,2),
  -- Categorización
  transacciones_categorizadas INTEGER DEFAULT 0,
  transacciones_sin_categoria INTEGER DEFAULT 0,
  -- Conciliación
  transacciones_conciliadas INTEGER DEFAULT 0,
  transacciones_sin_conciliar INTEGER DEFAULT 0,
  -- Metadata
  ultima_actualizacion TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(cuenta_id, año, mes)
);

-- Índices
CREATE INDEX idx_cartolas_stats_cuenta ON cartolas_estadisticas_mensuales(cuenta_id);
CREATE INDEX idx_cartolas_stats_periodo ON cartolas_estadisticas_mensuales(año DESC, mes DESC);

COMMENT ON TABLE cartolas_estadisticas_mensuales IS 'Estadísticas agregadas mensuales por cuenta bancaria';

-- =============================================================================
-- FUNCIONES AUXILIARES
-- =============================================================================

-- Función para generar hash de transacción (evitar duplicados)
CREATE OR REPLACE FUNCTION generate_transaction_hash(
  p_cuenta_id UUID,
  p_fecha DATE,
  p_descripcion TEXT,
  p_monto DECIMAL,
  p_tipo transaction_type
) RETURNS VARCHAR(64) AS $$
BEGIN
  RETURN encode(
    sha256(
      (p_cuenta_id::text || p_fecha::text || p_descripcion || p_monto::text || p_tipo::text)::bytea
    ),
    'hex'
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Función para normalizar descripción de transacción
CREATE OR REPLACE FUNCTION normalize_transaction_description(description TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN upper(
    regexp_replace(
      regexp_replace(
        trim(description),
        '\s+', ' ', 'g'  -- Múltiples espacios a uno
      ),
      '[^A-Z0-9ÁÉÍÓÚÑ\s]', '', 'g'  -- Solo alfanuméricos
    )
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- Trigger para auto-generar hash de transacción
CREATE OR REPLACE FUNCTION trigger_generate_transaction_hash()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.hash_transaccion IS NULL OR NEW.hash_transaccion = '' THEN
    NEW.hash_transaccion := generate_transaction_hash(
      NEW.cuenta_id,
      NEW.fecha,
      NEW.descripcion,
      NEW.monto,
      NEW.tipo
    );
  END IF;

  IF NEW.descripcion_normalizada IS NULL THEN
    NEW.descripcion_normalizada := normalize_transaction_description(NEW.descripcion);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER before_insert_transaction_hash
  BEFORE INSERT ON cartolas_transacciones
  FOR EACH ROW EXECUTE FUNCTION trigger_generate_transaction_hash();

-- Trigger para actualizar estadísticas al insertar transacciones
CREATE OR REPLACE FUNCTION trigger_update_monthly_stats()
RETURNS TRIGGER AS $$
DECLARE
  v_año INTEGER;
  v_mes INTEGER;
BEGIN
  v_año := EXTRACT(YEAR FROM NEW.fecha);
  v_mes := EXTRACT(MONTH FROM NEW.fecha);

  INSERT INTO cartolas_estadisticas_mensuales (cuenta_id, año, mes)
  VALUES (NEW.cuenta_id, v_año, v_mes)
  ON CONFLICT (cuenta_id, año, mes) DO NOTHING;

  UPDATE cartolas_estadisticas_mensuales
  SET
    total_transacciones = total_transacciones + 1,
    total_cargos = CASE WHEN NEW.tipo = 'cargo' THEN total_cargos + NEW.monto ELSE total_cargos END,
    total_abonos = CASE WHEN NEW.tipo = 'abono' THEN total_abonos + NEW.monto ELSE total_abonos END,
    cantidad_cargos = CASE WHEN NEW.tipo = 'cargo' THEN cantidad_cargos + 1 ELSE cantidad_cargos END,
    cantidad_abonos = CASE WHEN NEW.tipo = 'abono' THEN cantidad_abonos + 1 ELSE cantidad_abonos END,
    transacciones_sin_categoria = CASE WHEN NEW.categoria_id IS NULL THEN transacciones_sin_categoria + 1 ELSE transacciones_sin_categoria END,
    transacciones_categorizadas = CASE WHEN NEW.categoria_id IS NOT NULL THEN transacciones_categorizadas + 1 ELSE transacciones_categorizadas END,
    ultima_actualizacion = NOW()
  WHERE cuenta_id = NEW.cuenta_id AND año = v_año AND mes = v_mes;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER after_insert_transaction_stats
  AFTER INSERT ON cartolas_transacciones
  FOR EACH ROW EXECUTE FUNCTION trigger_update_monthly_stats();

-- =============================================================================
-- RLS POLICIES
-- =============================================================================

-- Habilitar RLS
ALTER TABLE cartolas_cuentas_bancarias ENABLE ROW LEVEL SECURITY;
ALTER TABLE cartolas_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE cartolas_archivos ENABLE ROW LEVEL SECURITY;
ALTER TABLE cartolas_transacciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE cartolas_reglas_categorizacion ENABLE ROW LEVEL SECURITY;
ALTER TABLE cartolas_plan_cuentas_mapping ENABLE ROW LEVEL SECURITY;
ALTER TABLE cartolas_conciliacion_sii ENABLE ROW LEVEL SECURITY;
ALTER TABLE cartolas_estadisticas_mensuales ENABLE ROW LEVEL SECURITY;

-- Políticas para cartolas_cuentas_bancarias
CREATE POLICY "Usuarios ven cuentas de sus clientes" ON cartolas_cuentas_bancarias
  FOR SELECT USING (
    cliente_id IN (
      SELECT c.id FROM clientes c
      WHERE c.user_id = auth.uid() OR c.contador_id = auth.uid()
    )
  );

CREATE POLICY "Usuarios gestionan cuentas de sus clientes" ON cartolas_cuentas_bancarias
  FOR ALL USING (
    cliente_id IN (
      SELECT c.id FROM clientes c
      WHERE c.user_id = auth.uid() OR c.contador_id = auth.uid()
    )
  );

-- Políticas para cartolas_jobs
CREATE POLICY "Usuarios ven jobs de sus cuentas" ON cartolas_jobs
  FOR SELECT USING (
    cuenta_id IN (
      SELECT cb.id FROM cartolas_cuentas_bancarias cb
      JOIN clientes c ON cb.cliente_id = c.id
      WHERE c.user_id = auth.uid() OR c.contador_id = auth.uid()
    )
  );

-- Políticas para cartolas_transacciones
CREATE POLICY "Usuarios ven transacciones de sus cuentas" ON cartolas_transacciones
  FOR SELECT USING (
    cuenta_id IN (
      SELECT cb.id FROM cartolas_cuentas_bancarias cb
      JOIN clientes c ON cb.cliente_id = c.id
      WHERE c.user_id = auth.uid() OR c.contador_id = auth.uid()
    )
  );

-- Categorías son públicas (solo lectura)
CREATE POLICY "Todos ven categorías" ON cartolas_categorias
  FOR SELECT USING (true);

-- Políticas para reglas de categorización
CREATE POLICY "Usuarios ven reglas globales y propias" ON cartolas_reglas_categorizacion
  FOR SELECT USING (
    cliente_id IS NULL OR
    cliente_id IN (
      SELECT c.id FROM clientes c
      WHERE c.user_id = auth.uid() OR c.contador_id = auth.uid()
    )
  );

-- =============================================================================
-- GRANTS
-- =============================================================================

-- Permisos para rol anon (público)
GRANT SELECT ON cartolas_categorias TO anon;

-- Permisos para rol authenticated
GRANT ALL ON cartolas_cuentas_bancarias TO authenticated;
GRANT ALL ON cartolas_jobs TO authenticated;
GRANT ALL ON cartolas_archivos TO authenticated;
GRANT ALL ON cartolas_transacciones TO authenticated;
GRANT SELECT ON cartolas_categorias TO authenticated;
GRANT ALL ON cartolas_reglas_categorizacion TO authenticated;
GRANT ALL ON cartolas_plan_cuentas_mapping TO authenticated;
GRANT ALL ON cartolas_conciliacion_sii TO authenticated;
GRANT ALL ON cartolas_estadisticas_mensuales TO authenticated;

-- Permisos para service_role (backend)
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;

-- =============================================================================
-- FIN DE MIGRACIÓN
-- =============================================================================
