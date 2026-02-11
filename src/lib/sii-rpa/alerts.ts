// SII RPA Alerts
// Sistema de alertas para notificaciones Slack y Email

// ============================================================================
// TYPES
// ============================================================================

export type AlertSeverity = 'info' | 'warning' | 'error' | 'critical'

export type AlertType =
  | 'job_failed'
  | 'job_completed'
  | 'server_down'
  | 'server_recovered'
  | 'credentials_invalid'
  | 'rate_limit_exceeded'
  | 'consecutive_failures'
  | 'scheduled_task_failed'

export interface AlertPayload {
  type: AlertType
  severity: AlertSeverity
  title: string
  message: string
  details?: Record<string, unknown>
  timestamp: string
}

export interface AlertConfig {
  slack?: {
    webhookUrl: string
    channel?: string
    mentions?: string[] // ["@here", "@channel", "<@USER_ID>"]
  }
  email?: {
    to: string[]
    from: string
    smtpHost?: string
    smtpPort?: number
  }
  minSeverity?: AlertSeverity
}

// ============================================================================
// SEVERITY LEVELS
// ============================================================================

const SEVERITY_LEVELS: Record<AlertSeverity, number> = {
  info: 0,
  warning: 1,
  error: 2,
  critical: 3,
}

const SEVERITY_COLORS: Record<AlertSeverity, string> = {
  info: '#36a64f',      // Green
  warning: '#ff9800',   // Orange
  error: '#f44336',     // Red
  critical: '#9c27b0',  // Purple
}

const SEVERITY_EMOJI: Record<AlertSeverity, string> = {
  info: ':white_check_mark:',
  warning: ':warning:',
  error: ':x:',
  critical: ':rotating_light:',
}

// ============================================================================
// SLACK INTEGRATION
// ============================================================================

async function sendSlackAlert(
  payload: AlertPayload,
  config: NonNullable<AlertConfig['slack']>
): Promise<boolean> {
  const blocks = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: `${SEVERITY_EMOJI[payload.severity]} ${payload.title}`,
        emoji: true,
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: payload.message,
      },
    },
  ]

  // Add details if present
  if (payload.details && Object.keys(payload.details).length > 0) {
    const detailsText = Object.entries(payload.details)
      .map(([key, value]) => `*${key}:* ${value}`)
      .join('\n')

    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: detailsText,
      },
    })
  }

  // Add timestamp footer
  blocks.push({
    type: 'context',
    elements: [
      {
        type: 'mrkdwn',
        text: `SII RPA | ${new Date(payload.timestamp).toLocaleString('es-CL')}`,
      },
    ],
  } as unknown as typeof blocks[0])

  // Build Slack message
  const slackMessage: Record<string, unknown> = {
    channel: config.channel,
    attachments: [
      {
        color: SEVERITY_COLORS[payload.severity],
        blocks,
      },
    ],
  }

  // Add mentions for critical alerts
  if (config.mentions && payload.severity === 'critical') {
    slackMessage.text = config.mentions.join(' ')
  }

  try {
    const response = await fetch(config.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(slackMessage),
    })

    return response.ok
  } catch (error) {
    console.error('[Alerts] Slack send failed:', error)
    return false
  }
}

// ============================================================================
// EMAIL INTEGRATION (usando API genérica)
// ============================================================================

async function sendEmailAlert(
  payload: AlertPayload,
  config: NonNullable<AlertConfig['email']>
): Promise<boolean> {
  // Para producción, integrar con servicio de email (SendGrid, Resend, etc.)
  // Este es un placeholder que loguea el intento

  const subject = `[SII RPA ${payload.severity.toUpperCase()}] ${payload.title}`

  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: ${SEVERITY_COLORS[payload.severity]}; color: white; padding: 15px; border-radius: 5px 5px 0 0;">
        <h2 style="margin: 0;">${payload.title}</h2>
      </div>
      <div style="padding: 20px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 5px 5px;">
        <p>${payload.message}</p>
        ${
          payload.details
            ? `
        <hr style="border: none; border-top: 1px solid #eee; margin: 15px 0;">
        <h4 style="margin-bottom: 10px;">Detalles:</h4>
        <table style="width: 100%; border-collapse: collapse;">
          ${Object.entries(payload.details)
            .map(
              ([key, value]) => `
            <tr>
              <td style="padding: 5px; border-bottom: 1px solid #eee; font-weight: bold;">${key}</td>
              <td style="padding: 5px; border-bottom: 1px solid #eee;">${value}</td>
            </tr>
          `
            )
            .join('')}
        </table>
        `
            : ''
        }
        <hr style="border: none; border-top: 1px solid #eee; margin: 15px 0;">
        <p style="color: #666; font-size: 12px;">
          Este mensaje fue generado automáticamente por el sistema SII RPA de HV Consultores.
          <br>Fecha: ${new Date(payload.timestamp).toLocaleString('es-CL')}
        </p>
      </div>
    </div>
  `

  console.log('[Alerts] Email would be sent:', {
    to: config.to,
    from: config.from,
    subject,
  })

  // TODO: Integrar con servicio de email real
  // Ejemplo con Resend:
  // const resend = new Resend(process.env.RESEND_API_KEY)
  // await resend.emails.send({ from, to, subject, html: htmlBody })

  return true
}

// ============================================================================
// MAIN ALERT FUNCTION
// ============================================================================

/**
 * Envía una alerta a los canales configurados
 */
export async function sendAlert(
  payload: Omit<AlertPayload, 'timestamp'>,
  config: AlertConfig
): Promise<{ slack: boolean; email: boolean }> {
  const fullPayload: AlertPayload = {
    ...payload,
    timestamp: new Date().toISOString(),
  }

  const results = {
    slack: false,
    email: false,
  }

  // Check minimum severity
  const minSeverityLevel = SEVERITY_LEVELS[config.minSeverity || 'info']
  const payloadSeverityLevel = SEVERITY_LEVELS[payload.severity]

  if (payloadSeverityLevel < minSeverityLevel) {
    return results
  }

  // Send to Slack
  if (config.slack?.webhookUrl) {
    results.slack = await sendSlackAlert(fullPayload, config.slack)
  }

  // Send email
  if (config.email?.to && config.email.to.length > 0) {
    results.email = await sendEmailAlert(fullPayload, config.email)
  }

  return results
}

// ============================================================================
// ALERT HELPERS
// ============================================================================

/**
 * Alerta de job fallido
 */
export function createJobFailedAlert(
  jobId: string,
  taskType: string,
  clienteName: string,
  errorMessage: string,
  retryCount: number
): Omit<AlertPayload, 'timestamp'> {
  const isCritical = retryCount >= 3

  return {
    type: 'job_failed',
    severity: isCritical ? 'critical' : 'error',
    title: `Job Fallido: ${taskType}`,
    message: `El job para *${clienteName}* ha fallido${retryCount > 1 ? ` después de ${retryCount} intentos` : ''}.`,
    details: {
      'Job ID': jobId,
      'Tipo de tarea': taskType,
      Cliente: clienteName,
      Error: errorMessage,
      Reintentos: retryCount,
    },
  }
}

/**
 * Alerta de servidor caído
 */
export function createServerDownAlert(
  serverName: string,
  lastHeartbeat: string
): Omit<AlertPayload, 'timestamp'> {
  return {
    type: 'server_down',
    severity: 'critical',
    title: `Servidor RPA No Responde`,
    message: `El servidor *${serverName}* no ha enviado heartbeat desde ${lastHeartbeat}.`,
    details: {
      Servidor: serverName,
      'Último heartbeat': lastHeartbeat,
    },
  }
}

/**
 * Alerta de servidor recuperado
 */
export function createServerRecoveredAlert(
  serverName: string,
  downtimeMinutes: number
): Omit<AlertPayload, 'timestamp'> {
  return {
    type: 'server_recovered',
    severity: 'info',
    title: `Servidor RPA Recuperado`,
    message: `El servidor *${serverName}* está funcionando nuevamente.`,
    details: {
      Servidor: serverName,
      'Tiempo caído': `${downtimeMinutes} minutos`,
    },
  }
}

/**
 * Alerta de credenciales inválidas
 */
export function createInvalidCredentialsAlert(
  clienteName: string,
  clienteRut: string
): Omit<AlertPayload, 'timestamp'> {
  return {
    type: 'credentials_invalid',
    severity: 'warning',
    title: `Credenciales Inválidas`,
    message: `Las credenciales SII de *${clienteName}* no son válidas.`,
    details: {
      Cliente: clienteName,
      RUT: clienteRut,
      Acción: 'Actualizar credenciales en el dashboard',
    },
  }
}

/**
 * Alerta de fallos consecutivos
 */
export function createConsecutiveFailuresAlert(
  serverName: string,
  failureCount: number,
  taskTypes: string[]
): Omit<AlertPayload, 'timestamp'> {
  return {
    type: 'consecutive_failures',
    severity: 'critical',
    title: `${failureCount} Fallos Consecutivos`,
    message: `El servidor *${serverName}* ha tenido ${failureCount} fallos consecutivos.`,
    details: {
      Servidor: serverName,
      Fallos: failureCount,
      'Tareas afectadas': taskTypes.join(', '),
    },
  }
}

// ============================================================================
// ALERT CONFIG LOADER
// ============================================================================

/**
 * Carga la configuración de alertas desde variables de entorno
 */
export function loadAlertConfig(): AlertConfig {
  return {
    slack: process.env.SLACK_WEBHOOK_URL
      ? {
          webhookUrl: process.env.SLACK_WEBHOOK_URL,
          channel: process.env.SLACK_CHANNEL,
          mentions: process.env.SLACK_MENTIONS?.split(','),
        }
      : undefined,
    email: process.env.ALERT_EMAIL_TO
      ? {
          to: process.env.ALERT_EMAIL_TO.split(','),
          from: process.env.ALERT_EMAIL_FROM || 'noreply@hvconsultores.cl',
        }
      : undefined,
    minSeverity: (process.env.ALERT_MIN_SEVERITY as AlertSeverity) || 'warning',
  }
}
