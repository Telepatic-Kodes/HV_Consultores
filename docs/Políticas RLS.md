# Políticas RLS (Row Level Security)

> Documentación de las políticas de seguridad a nivel de fila en Supabase.

## ¿Qué es RLS?

Row Level Security permite definir qué filas puede ver, insertar, actualizar o eliminar cada usuario basándose en su rol o identidad.

## Estado Actual

⚠️ **Nota**: La autenticación está temporalmente desactivada para desarrollo. Cuando se reactive, las políticas RLS controlarán el acceso.

## Políticas por Tabla

### `profiles`

```sql
-- Ver perfil propio
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);

-- Actualizar perfil propio
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id);

-- Admin ve todos
CREATE POLICY "Admins can view all profiles"
ON profiles FOR SELECT
USING (is_admin(auth.uid()));
```

### `clientes`

```sql
-- Contadores ven clientes asignados
CREATE POLICY "Users see assigned clients"
ON clientes FOR SELECT
USING (
  contador_asignado_id = auth.uid()
  OR is_admin(auth.uid())
);

-- Solo admin crea clientes
CREATE POLICY "Only admins create clients"
ON clientes FOR INSERT
WITH CHECK (is_admin(auth.uid()));

-- Contador puede actualizar sus clientes
CREATE POLICY "Users update assigned clients"
ON clientes FOR UPDATE
USING (
  contador_asignado_id = auth.uid()
  OR is_admin(auth.uid())
);
```

### `documentos`

```sql
-- Ver documentos de clientes asignados
CREATE POLICY "Users see client documents"
ON documentos FOR SELECT
USING (
  cliente_id IN (SELECT id FROM clientes WHERE contador_asignado_id = auth.uid())
  OR is_admin(auth.uid())
);

-- Clasificar documentos
CREATE POLICY "Users can classify documents"
ON documentos FOR UPDATE
USING (
  cliente_id IN (SELECT id FROM clientes WHERE contador_asignado_id = auth.uid())
  OR is_admin(auth.uid())
);
```

### `f29_calculos`

```sql
-- Ver F29 de clientes asignados
CREATE POLICY "Users see client F29"
ON f29_calculos FOR SELECT
USING (
  cliente_id IN (SELECT id FROM clientes WHERE contador_asignado_id = auth.uid())
  OR is_admin(auth.uid())
);

-- Crear/actualizar F29
CREATE POLICY "Users manage client F29"
ON f29_calculos FOR ALL
USING (
  cliente_id IN (SELECT id FROM clientes WHERE contador_asignado_id = auth.uid())
  OR is_admin(auth.uid())
);
```

### `chat_sesiones`

```sql
-- Ver sesiones propias
CREATE POLICY "Users see own chat sessions"
ON chat_sesiones FOR SELECT
USING (usuario_id = auth.uid());

-- Crear sesiones propias
CREATE POLICY "Users create own sessions"
ON chat_sesiones FOR INSERT
WITH CHECK (usuario_id = auth.uid());

-- Actualizar sesiones propias
CREATE POLICY "Users update own sessions"
ON chat_sesiones FOR UPDATE
USING (usuario_id = auth.uid());
```

### `chat_mensajes`

```sql
-- Ver mensajes de sesiones propias
CREATE POLICY "Users see own messages"
ON chat_mensajes FOR SELECT
USING (
  sesion_id IN (SELECT id FROM chat_sesiones WHERE usuario_id = auth.uid())
);

-- Crear mensajes en sesiones propias
CREATE POLICY "Users create messages in own sessions"
ON chat_mensajes FOR INSERT
WITH CHECK (
  sesion_id IN (SELECT id FROM chat_sesiones WHERE usuario_id = auth.uid())
);
```

### `configuracion_sistema`

```sql
-- Ver configuración propia
CREATE POLICY "Users see own config"
ON configuracion_sistema FOR SELECT
USING (
  clave LIKE 'notificaciones_' || auth.uid()::text || '%'
  OR is_admin(auth.uid())
);

-- Admin modifica todo
CREATE POLICY "Admins manage all config"
ON configuracion_sistema FOR ALL
USING (is_admin(auth.uid()));
```

## Función Helper: `is_admin`

```sql
CREATE OR REPLACE FUNCTION is_admin(user_uuid uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = user_uuid
    AND r.nombre = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Función Helper: `get_assigned_clients`

```sql
CREATE OR REPLACE FUNCTION get_assigned_clients(user_uuid uuid)
RETURNS uuid[] AS $$
BEGIN
  IF is_admin(user_uuid) THEN
    RETURN ARRAY(SELECT id FROM clientes WHERE activo = true);
  END IF;

  RETURN ARRAY(
    SELECT id FROM clientes
    WHERE contador_asignado_id = user_uuid
    AND activo = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Habilitar RLS

```sql
-- Habilitar RLS en una tabla
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;

-- Forzar RLS para el owner también
ALTER TABLE clientes FORCE ROW LEVEL SECURITY;
```

## Debugging RLS

### Ver políticas activas

```sql
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public';
```

### Probar como usuario específico

```sql
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claims" = '{"sub": "user-uuid-here"}';

SELECT * FROM clientes;  -- Solo verá los permitidos
```

## Errores Comunes

### Error 42501: Violación de política

```
new row violates row-level security policy for table "X"
```

**Causa**: Intentando insertar/actualizar sin permisos.
**Solución**: Verificar que el usuario tenga política INSERT/UPDATE.

### No se ven filas

**Causa**: Política SELECT muy restrictiva.
**Solución**: Verificar la cláusula USING de SELECT.

## Ver también

- [[Esquema de Base de Datos]]
- [[Configuración]]
