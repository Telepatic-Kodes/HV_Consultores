# Esquema de Base de Datos

> Documentación completa del esquema PostgreSQL en Supabase.

## Diagrama ER Simplificado

```
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│   profiles   │       │   clientes   │       │  documentos  │
├──────────────┤       ├──────────────┤       ├──────────────┤
│ id (PK)      │◄──────│ contador_id  │       │ id (PK)      │
│ nombre       │       │ id (PK)      │◄──────│ cliente_id   │
│ cargo        │       │ razon_social │       │ folio        │
│ telefono     │       │ rut          │       │ monto_total  │
└──────────────┘       │ regimen      │       │ status       │
                       └──────────────┘       │ cuenta_id    │
                              │               └──────────────┘
                              │                      │
                              ▼                      ▼
                       ┌──────────────┐       ┌──────────────┐
                       │ f29_calculos │       │clasificac_ml │
                       ├──────────────┤       ├──────────────┤
                       │ id (PK)      │       │ id (PK)      │
                       │ cliente_id   │       │ documento_id │
                       │ periodo      │       │ cuenta_id    │
                       │ status       │       │ confidence   │
                       └──────────────┘       └──────────────┘
```

## Tablas Principales

### `profiles`
Perfiles de usuarios (extende auth.users).

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | uuid | PK, referencia a auth.users |
| nombre_completo | text | Nombre del usuario |
| cargo | text | Cargo en el estudio |
| telefono | text | Teléfono de contacto |
| avatar_url | text | URL de avatar |
| activo | boolean | Usuario activo |
| created_at | timestamp | Fecha creación |
| updated_at | timestamp | Última actualización |

### `clientes`
Clientes del estudio contable.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | uuid | PK |
| razon_social | text | Nombre legal |
| rut | text | RUT único |
| nombre_fantasia | text | Nombre comercial |
| regimen_tributario | enum | 14A, 14D, 14D_N3, 14D_N8 |
| contador_asignado_id | uuid | FK a profiles |
| giro | text | Actividad económica |
| direccion | text | Dirección |
| comuna | text | Comuna |
| region | text | Región |
| tasa_ppm | decimal | Tasa PPM mensual |
| nubox_id | text | ID en Nubox |
| activo | boolean | Cliente activo |
| created_at | timestamp | Fecha creación |
| updated_at | timestamp | Última actualización |

### `documentos`
Documentos tributarios (facturas, boletas, NC, ND).

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | uuid | PK |
| cliente_id | uuid | FK a clientes |
| tipo_documento | text | Factura, Boleta, NC, ND |
| folio | text | Número de documento |
| fecha_emision | date | Fecha emisión |
| periodo | text | YYYY-MM |
| rut_emisor | text | RUT del emisor |
| razon_social_emisor | text | Nombre del emisor |
| giro_emisor | text | Giro del emisor |
| monto_neto | decimal | Monto neto |
| monto_iva | decimal | Monto IVA |
| monto_total | decimal | Monto total |
| es_compra | boolean | true=compra, false=venta |
| status | enum | pendiente, clasificado, revisado, aprobado, exportado |
| cuenta_sugerida_id | uuid | FK cuenta ML |
| cuenta_final_id | uuid | FK cuenta confirmada |
| confidence_score | decimal | Confianza del ML |
| clasificado_por | uuid | FK a profiles |
| clasificado_at | timestamp | Fecha clasificación |
| glosa | text | Descripción |
| es_activo_fijo | boolean | Es activo fijo |
| nubox_id | text | ID en Nubox |
| created_at | timestamp | Fecha creación |
| updated_at | timestamp | Última actualización |

### `f29_calculos`
Cálculos de Formulario 29.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | uuid | PK |
| cliente_id | uuid | FK a clientes |
| periodo | text | YYYY-MM |
| status | enum | borrador, calculado, validado, aprobado, enviado |
| total_debito_fiscal | decimal | Código 89 |
| total_credito_fiscal | decimal | Código 538 |
| remanente_anterior | decimal | Código 77 |
| remanente_actualizado | decimal | Actualizado por IPC |
| ppm_determinado | decimal | Código 563 |
| retenciones_honorarios | decimal | Código 153 |
| impuesto_unico | decimal | Código 48 |
| total_a_pagar | decimal | Código 91 |
| aprobado_por | uuid | FK a profiles |
| aprobado_at | timestamp | Fecha aprobación |
| folio_sii | text | Folio asignado por SII |
| enviado_sii_at | timestamp | Fecha envío |
| created_at | timestamp | Fecha creación |
| updated_at | timestamp | Última actualización |

### `clasificaciones_ml`
Predicciones del modelo ML.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | uuid | PK |
| documento_id | uuid | FK a documentos |
| cuenta_predicha_id | uuid | FK a cuentas_contables |
| confidence | decimal | 0.0 a 1.0 |
| ranking | int | 1, 2, 3... |
| modelo_version | text | Versión del modelo |
| features_input | jsonb | Features usadas |
| shap_values | jsonb | Explicabilidad |
| created_at | timestamp | Fecha predicción |

### `chat_sesiones`
Sesiones de chat.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | uuid | PK |
| usuario_id | uuid | FK a profiles |
| titulo | text | Título de la sesión |
| activa | boolean | Sesión activa |
| created_at | timestamp | Fecha creación |
| updated_at | timestamp | Última actualización |

### `chat_mensajes`
Mensajes del chat.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | uuid | PK |
| sesion_id | uuid | FK a chat_sesiones |
| rol | text | 'user' o 'assistant' |
| contenido | text | Texto del mensaje |
| fuentes | jsonb | Array de fuentes citadas |
| modelo_usado | text | Modelo IA usado |
| tokens_input | int | Tokens de entrada |
| tokens_output | int | Tokens de salida |
| latencia_ms | int | Tiempo de respuesta |
| created_at | timestamp | Fecha mensaje |

### `bot_definiciones`
Definición de bots RPA.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | uuid | PK |
| nombre | text | Nombre del bot |
| descripcion | text | Descripción |
| portal | text | sii, previred, tesoreria |
| config_default | jsonb | Configuración por defecto |
| frecuencia_default | text | Cron expression |
| activo | boolean | Bot activo |
| created_at | timestamp | Fecha creación |

### `bot_jobs`
Ejecuciones de bots.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | uuid | PK |
| bot_id | uuid | FK a bot_definiciones |
| cliente_id | uuid | FK a clientes |
| status | enum | pendiente, ejecutando, completado, fallido, cancelado |
| triggered_by | text | manual, schedule, webhook |
| triggered_by_user | uuid | FK a profiles |
| config_override | jsonb | Config específica |
| resultado | jsonb | Resultado de ejecución |
| error_message | text | Mensaje de error |
| retry_count | int | Intentos realizados |
| max_retries | int | Máximo de reintentos |
| scheduled_at | timestamp | Fecha programada |
| started_at | timestamp | Inicio ejecución |
| completed_at | timestamp | Fin ejecución |
| created_at | timestamp | Fecha creación |

## Enums

```sql
CREATE TYPE documento_status AS ENUM (
  'pendiente', 'clasificado', 'revisado', 'aprobado', 'exportado'
);

CREATE TYPE f29_status AS ENUM (
  'borrador', 'calculado', 'validado', 'aprobado', 'enviado'
);

CREATE TYPE bot_job_status AS ENUM (
  'pendiente', 'ejecutando', 'completado', 'fallido', 'cancelado'
);

CREATE TYPE regimen_tributario AS ENUM (
  '14A', '14D', '14D_N3', '14D_N8'
);

CREATE TYPE validacion_resultado AS ENUM (
  'ok', 'warning', 'error'
);
```

## Funciones RPC

### `is_admin(user_uuid)`
Verifica si usuario es administrador.

### `get_assigned_clients(user_uuid)`
Retorna IDs de clientes asignados al usuario.

### `search_knowledge_base(...)`
Búsqueda semántica en base de conocimiento.

## Ver también

- [[Tipos TypeScript]]
- [[Políticas RLS]]
