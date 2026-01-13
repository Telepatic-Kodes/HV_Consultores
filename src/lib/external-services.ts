// External Services Integration
// Email, Slack, and other third-party service integrations

// =============================================================================
// EMAIL SERVICE
// =============================================================================

export interface EmailConfig {
  provider: 'smtp' | 'sendgrid' | 'ses' | 'mailgun'
  smtpHost?: string
  smtpPort?: number
  smtpUser?: string
  smtpPassword?: string
  sendgridApiKey?: string
  sesAccessKey?: string
  sesSecretKey?: string
  sesRegion?: string
  mailgunDomain?: string
  mailgunApiKey?: string
  fromAddress: string
  fromName: string
}

export interface EmailMessage {
  to: string | string[]
  cc?: string[]
  bcc?: string[]
  subject: string
  htmlBody?: string
  textBody?: string
  replyTo?: string
  tags?: string[]
}

/**
 * Send email using configured provider
 */
export async function enviarEmail(
  config: EmailConfig,
  mensaje: EmailMessage
): Promise<{ messageId: string; timestamp: Date }> {
  switch (config.provider) {
    case 'smtp':
      return enviarPorSMTP(config, mensaje)
    case 'sendgrid':
      return enviarPorSendgrid(config, mensaje)
    case 'ses':
      return enviarPorSES(config, mensaje)
    case 'mailgun':
      return enviarPorMailgun(config, mensaje)
    default:
      throw new Error(`Unknown email provider: ${config.provider}`)
  }
}

/**
 * SMTP Email Service
 */
async function enviarPorSMTP(
  config: EmailConfig,
  mensaje: EmailMessage
): Promise<{ messageId: string; timestamp: Date }> {
  // Using nodemailer (requires: npm install nodemailer)
  const nodemailer = require('nodemailer')

  const transporter = nodemailer.createTransport({
    host: config.smtpHost,
    port: config.smtpPort || 587,
    secure: (config.smtpPort || 587) === 465,
    auth: {
      user: config.smtpUser,
      pass: config.smtpPassword,
    },
  })

  const info = await transporter.sendMail({
    from: `${config.fromName} <${config.fromAddress}>`,
    to: Array.isArray(mensaje.to) ? mensaje.to.join(', ') : mensaje.to,
    cc: mensaje.cc?.join(', '),
    bcc: mensaje.bcc?.join(', '),
    subject: mensaje.subject,
    html: mensaje.htmlBody,
    text: mensaje.textBody,
    replyTo: mensaje.replyTo,
  })

  return {
    messageId: info.messageId || `msg_${Date.now()}`,
    timestamp: new Date(),
  }
}

/**
 * SendGrid Email Service
 */
async function enviarPorSendgrid(
  config: EmailConfig,
  mensaje: EmailMessage
): Promise<{ messageId: string; timestamp: Date }> {
  // Using SendGrid API
  const sgMail = require('@sendgrid/mail')
  sgMail.setApiKey(config.sendgridApiKey)

  const destinatarios = Array.isArray(mensaje.to)
    ? mensaje.to.map((email) => ({ email }))
    : [{ email: mensaje.to }]

  const response = await sgMail.send({
    to: destinatarios,
    cc: mensaje.cc?.map((email) => ({ email })),
    bcc: mensaje.bcc?.map((email) => ({ email })),
    from: {
      email: config.fromAddress,
      name: config.fromName,
    },
    subject: mensaje.subject,
    html: mensaje.htmlBody,
    text: mensaje.textBody,
    replyTo: mensaje.replyTo,
    categories: mensaje.tags,
  })

  return {
    messageId: response[0].headers['x-message-id'],
    timestamp: new Date(),
  }
}

/**
 * AWS SES Email Service
 */
async function enviarPorSES(
  config: EmailConfig,
  mensaje: EmailMessage
): Promise<{ messageId: string; timestamp: Date }> {
  // Using AWS SDK
  const AWS = require('aws-sdk')

  const ses = new AWS.SES({
    accessKeyId: config.sesAccessKey,
    secretAccessKey: config.sesSecretKey,
    region: config.sesRegion || 'us-east-1',
  })

  const params = {
    Source: `${config.fromName} <${config.fromAddress}>`,
    Destination: {
      ToAddresses: Array.isArray(mensaje.to) ? mensaje.to : [mensaje.to],
      CcAddresses: mensaje.cc || [],
      BccAddresses: mensaje.bcc || [],
    },
    Message: {
      Subject: { Data: mensaje.subject },
      Body: {
        Html: { Data: mensaje.htmlBody || '' },
        Text: { Data: mensaje.textBody || '' },
      },
    },
    ReplyToAddresses: mensaje.replyTo ? [mensaje.replyTo] : undefined,
  }

  const result = await ses.sendEmail(params).promise()

  return {
    messageId: result.MessageId,
    timestamp: new Date(),
  }
}

/**
 * Mailgun Email Service
 */
async function enviarPorMailgun(
  config: EmailConfig,
  mensaje: EmailMessage
): Promise<{ messageId: string; timestamp: Date }> {
  // Using Mailgun API
  const mailgun = require('mailgun.js')
  const FormData = require('form-data')

  const mg = mailgun.client({
    username: 'api',
    key: config.mailgunApiKey,
  })

  const messageData = {
    from: `${config.fromName} <${config.fromAddress}>`,
    to: Array.isArray(mensaje.to) ? mensaje.to : [mensaje.to],
    cc: mensaje.cc || [],
    bcc: mensaje.bcc || [],
    subject: mensaje.subject,
    html: mensaje.htmlBody,
    text: mensaje.textBody,
    'h:Reply-To': mensaje.replyTo,
    o:tag: mensaje.tags || [],
  }

  const result = await mg.messages.create(config.mailgunDomain || '', messageData)

  return {
    messageId: result.id,
    timestamp: new Date(),
  }
}

// =============================================================================
// SLACK SERVICE
// =============================================================================

export interface SlackMessage {
  channel: string
  text?: string
  blocks?: Array<Record<string, any>>
  threadTimestamp?: string
  metadata?: Record<string, any>
}

/**
 * Send Slack message
 */
export async function enviarSlack(
  webhookUrl: string,
  mensaje: SlackMessage
): Promise<{ ok: boolean; timestamp: string }> {
  const payload = {
    channel: mensaje.channel,
    text: mensaje.text,
    blocks: mensaje.blocks,
    thread_ts: mensaje.threadTimestamp,
    metadata: mensaje.metadata,
  }

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw new Error(`Slack API error: ${response.statusText}`)
  }

  const data = await response.json()
  return {
    ok: data.ok,
    timestamp: data.ts || new Date().toISOString(),
  }
}

/**
 * Create rich Slack message blocks
 */
export function createSlackBlocks(title: string, content: string, color?: string) {
  return [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: title,
        emoji: true,
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: content,
      },
    },
    {
      type: 'divider',
    },
    {
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: `_Generated at ${new Date().toLocaleString()}_`,
        },
      ],
    },
  ]
}

// =============================================================================
// WEBHOOK SERVICE
// =============================================================================

export interface WebhookPayload {
  event: string
  timestamp: number
  data: Record<string, any>
}

/**
 * Send webhook to external URL with HMAC signature
 */
export async function enviarWebhook(
  url: string,
  payload: WebhookPayload,
  secret: string,
  timeout: number = 30000
): Promise<{ success: boolean; status: number; body: string }> {
  const crypto = await import('crypto')

  // Create HMAC signature
  const timestamp = Math.floor(Date.now() / 1000)
  const signedContent = `${timestamp}.${JSON.stringify(payload)}`
  const signature = crypto
    .createHmac('sha256', secret)
    .update(signedContent)
    .digest('hex')

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': `sha256=${signature}`,
        'X-Webhook-Timestamp': timestamp.toString(),
        'User-Agent': 'HV-Consultores/1.0',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    const body = await response.text()

    return {
      success: response.ok,
      status: response.status,
      body,
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Webhook request timeout after ${timeout}ms`)
    }
    throw error
  }
}

// =============================================================================
// SERVICE HELPERS
// =============================================================================

/**
 * Validate email address
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validate webhook URL
 */
export function isValidWebhookUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

/**
 * Validate Slack webhook URL
 */
export function isValidSlackWebhook(url: string): boolean {
  return (
    url.startsWith('https://hooks.slack.com/services/') && isValidWebhookUrl(url)
  )
}

/**
 * Get email configuration from environment
 */
export function getEmailConfig(): EmailConfig {
  const provider = (process.env.EMAIL_PROVIDER || 'smtp') as EmailConfig['provider']

  return {
    provider,
    smtpHost: process.env.SMTP_HOST,
    smtpPort: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587,
    smtpUser: process.env.SMTP_USER,
    smtpPassword: process.env.SMTP_PASSWORD,
    sendgridApiKey: process.env.SENDGRID_API_KEY,
    sesAccessKey: process.env.AWS_SES_ACCESS_KEY,
    sesSecretKey: process.env.AWS_SES_SECRET_KEY,
    sesRegion: process.env.AWS_SES_REGION,
    mailgunDomain: process.env.MAILGUN_DOMAIN,
    mailgunApiKey: process.env.MAILGUN_API_KEY,
    fromAddress: process.env.EMAIL_FROM_ADDRESS || 'noreply@hv-consultores.com',
    fromName: process.env.EMAIL_FROM_NAME || 'HV-Consultores',
  }
}
