'use server'
// TODO: Phase 2 - Implement automation module in Convex
// Tables needed: automation_rules, automation_executions, notifications,
// notification_preferences, email_templates, email_logs, slack_integrations,
// slack_messages, webhooks, webhook_deliveries, batch_jobs

const DEMO_USER_ID = 'demo-user'

// =============================================================================
// AUTOMATION RULES - CRUD Operations
// =============================================================================

export async function obtenerReglas(clienteId: string) {
  // Stub: returns empty data until Convex module is implemented
  return []
}

export async function crearRegla(
  clienteId: string,
  datos: {
    nombre: string
    descripcion?: string
    tipo_trigger: string
    condicion_dias_antes?: number
    acciones: string[]
    frecuencia?: string
    dia_semana?: number
    dia_mes?: number
    hora?: string
  }
) {
  // Stub: returns success until Convex module is implemented
  return { id: 'stub-rule-id' }
}

export async function actualizarRegla(
  reglaId: string,
  datos: Partial<{
    nombre: string
    descripcion: string
    tipo_trigger: string
    condicion_dias_antes: number
    acciones: string[]
    frecuencia: string
    dia_semana: number
    dia_mes: number
    hora: string
    activa: boolean
  }>
) {
  // Stub: no-op until Convex module is implemented
}

export async function eliminarRegla(reglaId: string) {
  // Stub: no-op until Convex module is implemented
}

export async function alternarRegla(reglaId: string, activa: boolean) {
  // Stub: no-op until Convex module is implemented
}

export async function toggleRegla(reglaId: string) {
  // Stub: no-op until Convex module is implemented
}

// =============================================================================
// AUTOMATION EXECUTION - Trigger & History
// =============================================================================

export async function ejecutarReglaManualmente(reglaId: string) {
  // Stub: returns success until Convex module is implemented
  return {
    success: true,
    exitosos: 0,
    fallidos: 0,
    duracion_segundos: 0,
    errores: [],
  }
}

export async function obtenerEjecuciones(clienteId: string) {
  // Stub: returns empty data until Convex module is implemented
  return []
}

export async function obtenerDetalleEjecucion(ejecucionId: string) {
  // Stub: returns null until Convex module is implemented
  return null
}

// =============================================================================
// NOTIFICATIONS - Management & Reading
// =============================================================================

export async function obtenerNotificaciones(usuarioId: string) {
  // Stub: returns empty data until Convex module is implemented
  return []
}

export async function marcarComoLeido(notificacionId: string) {
  // Stub: no-op until Convex module is implemented
}

export async function marcarTodosComoLeidos(usuarioId: string) {
  // Stub: no-op until Convex module is implemented
}

export async function eliminarNotificacion(notificacionId: string) {
  // Stub: no-op until Convex module is implemented
}

export async function obtenerResumenNotificaciones(
  usuarioId: string,
  clienteId: string
) {
  // Stub: returns empty summary until Convex module is implemented
  return {
    total: 0,
    sin_leer: 0,
    por_tipo: {},
  }
}

// =============================================================================
// NOTIFICATION PREFERENCES
// =============================================================================

export async function obtenerPreferencias(usuarioId: string): Promise<Record<string, any> | null> {
  // Stub: returns null until Convex module is implemented
  return null
}

export async function actualizarPreferencias(
  usuarioId: string,
  clienteId: string,
  datos: Partial<{
    email_habilitado: boolean
    email_direccion: string
    slack_habilitado: boolean
    slack_webhook_url: string
    slack_canal: string
    inapp_habilitado: boolean
    resumen_frecuencia: string
    alertas_vencimiento: boolean
    alertas_aprobacion: boolean
    alertas_sistema: boolean
    alertas_cumplimiento: boolean
  }>
) {
  // Stub: no-op until Convex module is implemented
}

// =============================================================================
// EMAIL TEMPLATES
// =============================================================================

export async function obtenerTemplatesEmail(clienteId: string) {
  // Stub: returns empty data until Convex module is implemented
  return []
}

export async function crearTemplateEmail(
  clienteId: string,
  datos: {
    nombre: string
    tipo: string
    asunto: string
    cuerpo: string
    es_default?: boolean
  }
) {
  // Stub: returns success until Convex module is implemented
  return { id: 'stub-email-template-id' }
}

export async function actualizarTemplateEmail(
  templateId: string,
  datos: Partial<{
    nombre: string
    tipo: string
    asunto: string
    cuerpo: string
    activo: boolean
    es_default: boolean
  }>
) {
  // Stub: no-op until Convex module is implemented
}

// =============================================================================
// EMAIL SENDING
// =============================================================================

export async function enviarEmail(
  clienteId: string,
  datos: {
    para: string
    cc?: string[]
    bcc?: string[]
    asunto: string
    cuerpo: string
    templateId?: string
    variables?: Record<string, string>
  }
) {
  // Stub: returns success until Convex module is implemented
  return { id: 'stub-email-id', estado: 'PENDING' }
}

export async function enviarEmailBatch(
  clienteId: string,
  emails: Array<{
    para: string
    cc?: string[]
    asunto: string
    cuerpo: string
  }>
) {
  // Stub: returns success until Convex module is implemented
  return {
    enviados: 0,
    estado: 'PENDING',
  }
}

export async function obtenerEmailLogs(clienteId: string) {
  // Stub: returns empty data until Convex module is implemented
  return []
}

// =============================================================================
// SLACK INTEGRATION
// =============================================================================

export async function obtenerIntegracionesSlack(clienteId: string) {
  // Stub: returns empty data until Convex module is implemented
  return []
}

export async function crearIntegracionSlack(
  clienteId: string,
  datos: {
    nombre: string
    workspace_nombre: string
    webhook_url: string
    canal: string
    eventos_habilitados?: string[]
  }
) {
  // Stub: returns success until Convex module is implemented
  return { id: 'stub-slack-integration-id' }
}

export async function actualizarIntegracionSlack(
  integracionId: string,
  datos: Partial<{
    nombre: string
    workspace_nombre: string
    canal: string
    eventos_habilitados: string[]
    activo: boolean
  }>
) {
  // Stub: no-op until Convex module is implemented
}

export async function pruebaIntegracionSlack(integracionId: string) {
  // Stub: returns success until Convex module is implemented
  return { success: true, message: 'Stub: Webhook test not available in demo mode' }
}

export async function enviarAlertaSlack(
  clienteId: string,
  datos: {
    titulo: string
    mensaje: string
    severidad?: 'info' | 'warning' | 'error'
  }
) {
  // Stub: returns success until Convex module is implemented
  return {
    enviados: 0,
    errores: undefined,
  }
}

// =============================================================================
// WEBHOOKS (OUTBOUND)
// =============================================================================

export async function obtenerWebhooks(clienteId: string) {
  // Stub: returns empty data until Convex module is implemented
  return []
}

export async function crearWebhook(
  clienteId: string,
  datos: {
    nombre: string
    url: string
    evento_tipo: string
    secret: string
    headers?: Record<string, string>
    reintentos?: number
    timeout_segundos?: number
  }
) {
  // Stub: returns success until Convex module is implemented
  return { id: 'stub-webhook-id' }
}

export async function actualizarWebhook(
  webhookId: string,
  datos: Partial<{
    nombre: string
    url: string
    evento_tipo: string
    activo: boolean
    reintentos: number
    timeout_segundos: number
  }>
) {
  // Stub: no-op until Convex module is implemented
}

export async function obtenerEntregasWebhook(webhookId: string) {
  // Stub: returns empty data until Convex module is implemented
  return []
}

export async function reintentarEntrega(entregaId: string) {
  // Stub: returns success until Convex module is implemented
  return { success: true, message: 'Stub: Retry not available in demo mode' }
}

// =============================================================================
// BATCH OPERATIONS
// =============================================================================

export async function iniciarBatchArchivo(
  clienteId: string,
  documentoIds: string[]
) {
  // Stub: returns success until Convex module is implemented
  return { jobId: 'stub-batch-job-id', estado: 'PENDING' }
}

export async function iniciarBatchEliminacion(
  clienteId: string,
  documentoIds: string[]
) {
  // Stub: returns success until Convex module is implemented
  return { jobId: 'stub-batch-job-id', estado: 'PENDING' }
}

export async function obtenerBatchJob(jobId: string) {
  // Stub: returns null until Convex module is implemented
  return null
}

export async function obtenerBatchJobs(clienteId: string) {
  // Stub: returns empty data until Convex module is implemented
  return []
}

export async function cancelarBatchJob(jobId: string) {
  // Stub: no-op until Convex module is implemented
}

// =============================================================================
// HELPER FUNCTIONS (pure logic, no Supabase dependency)
// =============================================================================

function calculateNextExecution(rule: any): Date {
  const now = new Date()

  if (rule.frecuencia === 'DIARIA') {
    const next = new Date(now)
    next.setDate(next.getDate() + 1)
    if (rule.hora) {
      const [hours, minutes] = rule.hora.split(':')
      next.setHours(parseInt(hours), parseInt(minutes), 0, 0)
    }
    return next
  }

  if (rule.frecuencia === 'SEMANAL') {
    const next = new Date(now)
    const daysUntil = (rule.dia_semana - next.getDay() + 7) % 7 || 7
    next.setDate(next.getDate() + daysUntil)
    if (rule.hora) {
      const [hours, minutes] = rule.hora.split(':')
      next.setHours(parseInt(hours), parseInt(minutes), 0, 0)
    }
    return next
  }

  if (rule.frecuencia === 'MENSUAL') {
    const next = new Date(now)
    next.setMonth(next.getMonth() + 1)
    next.setDate(rule.dia_mes)
    if (rule.hora) {
      const [hours, minutes] = rule.hora.split(':')
      next.setHours(parseInt(hours), parseInt(minutes), 0, 0)
    }
    return next
  }

  return now
}
