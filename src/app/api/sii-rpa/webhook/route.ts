// SII RPA Webhook API Route
// POST - Receive updates from RPA server

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Use service role for webhook processing
function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceKey) {
    throw new Error('Supabase credentials not configured')
  }

  return createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  })
}

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

    const supabase = getSupabaseAdmin()

    // Process based on event type
    switch (event) {
      case 'started':
        await handleStarted(supabase, job_id, server_name)
        break

      case 'step_completed':
        await handleStepCompleted(supabase, job_id, data)
        break

      case 'completed':
        await handleCompleted(supabase, job_id, data)
        break

      case 'failed':
        await handleFailed(supabase, job_id, data)
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

async function handleStarted(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  jobId: string,
  serverName?: string
) {
  await supabase
    .from('sii_jobs')
    .update({
      status: 'ejecutando',
      execution_server: serverName,
      started_at: new Date().toISOString(),
    })
    .eq('id', jobId)
}

async function handleStepCompleted(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  jobId: string,
  data?: Record<string, unknown>
) {
  if (!data?.step) return

  // Get current step count
  const { count } = await supabase
    .from('sii_execution_steps')
    .select('*', { count: 'exact', head: true })
    .eq('sii_job_id', jobId)

  // Add execution step
  await supabase.from('sii_execution_steps').insert({
    sii_job_id: jobId,
    step_number: (count || 0) + 1,
    step_name: data.step as string,
    status: 'success',
    output_data: data.data as Record<string, unknown> | undefined,
    completed_at: new Date().toISOString(),
    retry_count: 0,
  })
}

async function handleCompleted(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  jobId: string,
  data?: Record<string, unknown>
) {
  const updateData: Record<string, unknown> = {
    status: 'completado',
    completed_at: new Date().toISOString(),
  }

  if (data?.result) {
    updateData.datos_extraidos = data.result
  }

  if (data?.files && Array.isArray(data.files)) {
    updateData.archivos_descargados = data.files.map((f: { path?: string }) => f.path)
  }

  if (data?.screenshots) {
    updateData.screenshots = data.screenshots
  }

  await supabase.from('sii_jobs').update(updateData).eq('id', jobId)

  // Update credential validation status if this was a login test
  const { data: job } = await supabase
    .from('sii_jobs')
    .select('task_type, cliente_id')
    .eq('id', jobId)
    .single()

  if (job?.task_type === 'login_test') {
    await supabase
      .from('credenciales_portales')
      .update({
        validacion_exitosa: true,
        ultimo_login_exitoso: new Date().toISOString(),
        intentos_fallidos: 0,
      })
      .eq('cliente_id', job.cliente_id)
      .eq('portal', 'sii')
  }
}

async function handleFailed(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  jobId: string,
  data?: Record<string, unknown>
) {
  // Get current job to check retry count
  const { data: job } = await supabase
    .from('sii_jobs')
    .select('retry_count, max_retries, cliente_id, task_type')
    .eq('id', jobId)
    .single()

  if (!job) return

  const currentRetries = job.retry_count || 0
  const maxRetries = job.max_retries || 3
  const errorData = data?.error as { code?: string; message?: string } | undefined

  if (currentRetries < maxRetries - 1) {
    // Schedule retry
    await supabase
      .from('sii_jobs')
      .update({
        status: 'pendiente',
        retry_count: currentRetries + 1,
        error_message: errorData?.message || 'Error desconocido',
      })
      .eq('id', jobId)
  } else {
    // Mark as failed
    await supabase
      .from('sii_jobs')
      .update({
        status: 'fallido',
        completed_at: new Date().toISOString(),
        error_message: errorData?.message || 'Error desconocido',
      })
      .eq('id', jobId)

    // Update credential status if login failed
    if (job.task_type === 'login_test') {
      await supabase
        .from('credenciales_portales')
        .update({
          validacion_exitosa: false,
          intentos_fallidos: supabase.rpc('increment_field', {
            row_id: job.cliente_id,
            field_name: 'intentos_fallidos',
          }),
        })
        .eq('cliente_id', job.cliente_id)
        .eq('portal', 'sii')
    }
  }
}
