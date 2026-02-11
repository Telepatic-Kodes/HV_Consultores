// SII RPA Webhook API Route
// POST - Receive updates from RPA server
// Uses Convex bots module to persist job state updates

import { NextRequest, NextResponse } from 'next/server'
import { ConvexHttpClient } from 'convex/browser'
import { api } from '../../../../../convex/_generated/api'

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!)

export async function POST(request: NextRequest) {
  try {
    // Verify webhook secret
    const authHeader = request.headers.get('authorization')
    const expectedSecret = process.env.WEBHOOK_SECRET

    if (expectedSecret) {
      const providedSecret = authHeader?.replace('Bearer ', '')
      if (providedSecret !== expectedSecret) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    const payload = await request.json()
    const { job_id, event, data, timestamp, server_name } = payload

    if (!job_id || !event) {
      return NextResponse.json(
        { error: 'Missing required fields: job_id, event' },
        { status: 400 }
      )
    }

    // Process based on event type using Convex bots module
    switch (event) {
      case 'started':
        await handleStarted(job_id, server_name)
        break

      case 'step_completed':
        await handleStepCompleted(job_id, data)
        break

      case 'completed':
        await handleCompleted(job_id, data)
        break

      case 'failed':
        await handleFailed(job_id, data)
        break

      default:
        console.warn(`[SII RPA Webhook] Unknown event type: ${event}`)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[SII RPA Webhook] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function handleStarted(jobId: string, serverName?: string) {
  try {
    await convex.mutation(api.bots.updateJobStatus, {
      id: jobId as any,
      status: 'ejecutando',
    })
  } catch (error) {
    console.error('[SII RPA Webhook] Error updating job to started:', error)
  }
}

async function handleStepCompleted(
  jobId: string,
  data?: Record<string, unknown>
) {
  if (!data?.step) return

  try {
    await convex.mutation(api.bots.addExecutionStep, {
      job_id: jobId as any,
      paso: data.step as string,
      nivel: 'info',
      mensaje: `Step completed: ${data.step}`,
      metadata: data.data as any,
    })
  } catch (error) {
    console.error('[SII RPA Webhook] Error adding step:', error)
  }
}

async function handleCompleted(
  jobId: string,
  data?: Record<string, unknown>
) {
  try {
    const resultado: Record<string, unknown> = {}

    if (data?.result) {
      resultado.datos_extraidos = data.result
    }

    if (data?.files && Array.isArray(data.files)) {
      resultado.archivos_descargados = data.files.map((f: { path?: string }) => f.path)
    }

    if (data?.screenshots) {
      resultado.screenshots = data.screenshots
    }

    await convex.mutation(api.bots.completeJob, {
      id: jobId as any,
      resultado: Object.keys(resultado).length > 0 ? resultado : undefined,
    })
  } catch (error) {
    console.error('[SII RPA Webhook] Error completing job:', error)
  }
}

async function handleFailed(
  jobId: string,
  data?: Record<string, unknown>
) {
  try {
    const errorData = data?.error as { code?: string; message?: string } | undefined
    const errorMessage = errorData?.message || 'Error desconocido'

    await convex.mutation(api.bots.failJob, {
      id: jobId as any,
      error_message: errorMessage,
      shouldRetry: true,
    })
  } catch (error) {
    console.error('[SII RPA Webhook] Error failing job:', error)
  }
}
