-- Create documento_plantillas (Document Templates) table
CREATE TABLE IF NOT EXISTS documento_plantillas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  tipo_documento TEXT NOT NULL,

  -- Template fields
  folio_documento_prefijo TEXT,
  folio_documento_siguiente INTEGER DEFAULT 1,
  fecha_documento_default DATE,

  -- Amount template
  monto_total_default DECIMAL(12,2),

  -- Status
  activa BOOLEAN DEFAULT true,
  uso_count INTEGER DEFAULT 0,
  ultima_usada_en TIMESTAMP WITH TIME ZONE,

  -- Metadata
  creada_por UUID NOT NULL REFERENCES auth.users(id),
  creada_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  actualizada_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  UNIQUE(cliente_id, nombre)
);

-- Create indexes for better query performance
CREATE INDEX idx_documento_plantillas_cliente_id ON documento_plantillas(cliente_id);
CREATE INDEX idx_documento_plantillas_activa ON documento_plantillas(activa);
CREATE INDEX idx_documento_plantillas_tipo ON documento_plantillas(tipo_documento);

-- Enable RLS
ALTER TABLE documento_plantillas ENABLE ROW LEVEL SECURITY;

-- RLS Policies for documento_plantillas
-- Users can see templates for their assigned clients
CREATE POLICY "Users can view templates for their clients" ON documento_plantillas
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT contador_asignado_id FROM clientes WHERE id = cliente_id
    ) OR
    (SELECT is_admin() FROM auth.users WHERE id = auth.uid())
  );

-- Users can create templates for their assigned clients
CREATE POLICY "Users can create templates for their clients" ON documento_plantillas
  FOR INSERT
  WITH CHECK (
    creada_por = auth.uid() AND (
      auth.uid() IN (
        SELECT contador_asignado_id FROM clientes WHERE id = cliente_id
      ) OR
      (SELECT is_admin() FROM auth.users WHERE id = auth.uid())
    )
  );

-- Users can update templates for their assigned clients
CREATE POLICY "Users can update templates for their clients" ON documento_plantillas
  FOR UPDATE
  USING (
    creada_por = auth.uid() OR
    (SELECT is_admin() FROM auth.users WHERE id = auth.uid())
  )
  WITH CHECK (
    auth.uid() IN (
      SELECT contador_asignado_id FROM clientes WHERE id = cliente_id
    ) OR
    (SELECT is_admin() FROM auth.users WHERE id = auth.uid())
  );

-- Users can delete templates they created
CREATE POLICY "Users can delete templates they created" ON documento_plantillas
  FOR DELETE
  USING (
    creada_por = auth.uid() OR
    (SELECT is_admin() FROM auth.users WHERE id = auth.uid())
  );

-- Create trigger to update actualizada_en
CREATE OR REPLACE FUNCTION actualizar_timestamp_plantilla()
RETURNS TRIGGER AS $$
BEGIN
  NEW.actualizada_en = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_actualizar_timestamp_plantilla
  BEFORE UPDATE ON documento_plantillas
  FOR EACH ROW
  EXECUTE FUNCTION actualizar_timestamp_plantilla();

-- Create function to get next folio for template
CREATE OR REPLACE FUNCTION obtener_proximo_folio_plantilla(
  p_plantilla_id UUID
)
RETURNS INTEGER AS $$
DECLARE
  v_siguiente INTEGER;
BEGIN
  SELECT folio_documento_siguiente INTO v_siguiente
  FROM documento_plantillas
  WHERE id = p_plantilla_id;

  RETURN v_siguiente;
END;
$$ LANGUAGE plpgsql;

-- Create function to increment folio counter
CREATE OR REPLACE FUNCTION incrementar_folio_plantilla(
  p_plantilla_id UUID
)
RETURNS VOID AS $$
BEGIN
  UPDATE documento_plantillas
  SET folio_documento_siguiente = folio_documento_siguiente + 1,
      ultima_usada_en = NOW(),
      uso_count = uso_count + 1
  WHERE id = p_plantilla_id;
END;
$$ LANGUAGE plpgsql;
