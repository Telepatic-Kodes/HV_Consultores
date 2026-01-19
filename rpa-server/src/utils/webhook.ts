// HV Consultores - SII RPA Server
// Webhook Utility - Send updates back to main application

import { logger } from './logger'

type WebhookEvent = 'started' | 'step_completed' | 'completed' | 'failed'

interface WebhookPayload {
  job_id: string
  event: WebhookEvent
  data?: Record<string, unknown>
  timestamp: string
  server_name: string
}

export async function sendWebhook(
  jobId: string,
  event: WebhookEvent,
  data?: Record<string, unknown>
): Promise<void> {
  const webhookUrl = process.env.WEBHOOK_URL

  if (!webhookUrl) {
    logger.debug('Webhook URL not configured, skipping', { jobId, event })
    return
  }

  const payload: WebhookPayload = {
    job_id: jobId,
    event,
    data,
    timestamp: new Date().toISOString(),
    server_name: process.env.SERVER_NAME || 'rpa-server',
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.WEBHOOK_SECRET || ''}`,
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      logger.error('Webhook delivery failed', {
        jobId,
        event,
        status: response.status,
      })
    } else {
      logger.debug('Webhook delivered', { jobId, event })
    }
  } catch (error) {
    logger.error('Webhook error', { jobId, event, error })
  }
}
