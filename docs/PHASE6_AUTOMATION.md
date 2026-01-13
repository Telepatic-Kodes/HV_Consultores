# Phase 6: Automatización e Integraciones

**Estado**: ✅ PRODUCTION READY
**Fecha**: 2026-01-13
**Ubicación**: `/dashboard/documentos/automation`

---

## Descripción General

Sistema completo de automatización que permite:
- Reglas automáticas para gestión de documentos
- Notificaciones multicanal (Email, Slack, In-App)
- Webhooks para integración con sistemas externos
- Operaciones por lotes

---

## Acceso

### Navegación
```
Sidebar → Automatización
```

### URL Directa
```
/dashboard/documentos/automation?cliente_id={UUID}
```

---

## Pestañas del Dashboard

### 1. Reglas
Gestión de reglas de automatización.

**Tipos de Disparadores:**
| Tipo | Descripción |
|------|-------------|
| `ON_EXPIRATION` | Al vencer documento |
| `ON_SCHEDULE` | Programado (diario/semanal/mensual) |
| `ON_EVENT` | Por evento del sistema |

**Acciones Disponibles:**
- `ARCHIVE` - Archivar documentos
- `DELETE` - Eliminar documentos
- `NOTIFY` - Enviar notificaciones

### 2. Historial
Registro de ejecuciones de reglas con:
- Fecha y hora
- Tipo de acción
- Documentos afectados
- Éxitos/Fallos
- Duración

### 3. Notificaciones
Centro de notificaciones con:
- Lista de notificaciones (leídas/no leídas)
- Marcar como leído (individual/todas)
- Panel de preferencias del usuario

**Tipos de Notificación:**
- `EXPIRATION` - Vencimiento de documentos
- `COMPLIANCE` - Alertas de cumplimiento
- `ERROR` - Errores del sistema
- `SYSTEM` - Notificaciones del sistema

### 4. Email
Gestión de templates de correo electrónico.

**Variables Disponibles:**
```
{usuario_nombre}    - Nombre del usuario
{cliente_nombre}    - Nombre del cliente
{documento_tipo}    - Tipo de documento
{documento_folio}   - Folio del documento
{dias_restantes}    - Días hasta vencimiento
{fecha_vencimiento} - Fecha de vencimiento
{fecha_actual}      - Fecha actual
{enlace_documento}  - Enlace al documento
```

### 5. Integraciones
Configuración de integraciones externas.

**Slack:**
- Webhook URL de Incoming Webhooks
- Selección de canal
- Tipos de eventos a notificar

**Webhooks Outbound:**
- URL HTTPS del endpoint
- Secret para firma HMAC-SHA256
- Tipos de eventos
- Reintentos y timeout

### 6. Batch Jobs
Monitoreo de operaciones por lotes.
- Progreso en tiempo real
- Estado (Pendiente/En ejecución/Completado/Error)
- Cantidad procesada vs total

---

## Componentes UI

### Diálogos
| Componente | Función |
|------------|---------|
| `CreateRuleDialog` | Crear/editar reglas |
| `SlackIntegrationDialog` | Configurar Slack |
| `WebhookDialog` | Configurar webhooks |
| `BatchOperationsDialog` | Iniciar operaciones masivas |

### Gestores
| Componente | Función |
|------------|---------|
| `EmailTemplatesManager` | CRUD de templates |
| `NotificationPreferences` | Preferencias de usuario |
| `WebhookDeliveries` | Historial de entregas |

---

## Server Actions

### Reglas
```typescript
obtenerReglas(clienteId)
crearRegla(clienteId, datos)
actualizarRegla(reglaId, datos)
eliminarRegla(reglaId)
toggleRegla(reglaId)
ejecutarReglaManualmente(reglaId)
```

### Notificaciones
```typescript
obtenerNotificaciones(usuarioId)
marcarComoLeido(notifId)
marcarTodosComoLeidos(usuarioId)
obtenerPreferencias(usuarioId)
actualizarPreferencias(usuarioId, clienteId, datos)
```

### Email
```typescript
obtenerTemplatesEmail(clienteId)
crearTemplateEmail(clienteId, datos)
actualizarTemplateEmail(templateId, datos)
```

### Slack
```typescript
obtenerIntegracionesSlack(clienteId)
crearIntegracionSlack(clienteId, datos)
actualizarIntegracionSlack(integracionId, datos)
pruebaIntegracionSlack(integracionId)
```

### Webhooks
```typescript
obtenerWebhooks(clienteId)
crearWebhook(clienteId, datos)
actualizarWebhook(webhookId, datos)
obtenerEntregasWebhook(webhookId)
reintentarEntrega(entregaId)
```

### Batch
```typescript
obtenerBatchJobs(clienteId)
iniciarBatchArchivo(clienteId, documentoIds)
iniciarBatchEliminacion(clienteId, documentoIds)
```

---

## Base de Datos

### Tablas
| Tabla | Descripción |
|-------|-------------|
| `automation_rules` | Reglas de automatización |
| `automation_executions` | Historial de ejecuciones |
| `notifications` | Notificaciones del sistema |
| `notification_preferences` | Preferencias de usuario |
| `email_templates` | Templates de email |
| `email_logs` | Registro de emails enviados |
| `slack_integrations` | Integraciones Slack |
| `slack_messages` | Mensajes Slack enviados |
| `webhooks` | Configuración webhooks |
| `webhook_deliveries` | Entregas de webhooks |
| `batch_jobs` | Trabajos por lotes |

### Migración
```
src/migrations/add_automation_integration.sql
```

---

## Seguridad

### Verificación Webhook (HMAC-SHA256)
```typescript
// Header enviado: X-Signature
// Formato: sha256=HASH

const signature = crypto
  .createHmac('sha256', secret)
  .update(JSON.stringify(payload))
  .digest('hex')
```

### RLS Policies
- Reglas y configuraciones aisladas por cliente
- Notificaciones visibles solo para el usuario
- Preferencias editables solo por el propietario

---

## Enlaces Relacionados

- [[PHASE5_COMPLIANCE]] - Cumplimiento y Reportes
- [[Server Actions]] - Acciones del servidor
- [[Esquema de Base de Datos]] - Estructura de BD
- [[Políticas RLS]] - Seguridad por filas
