// SII RPA Status API Route
// GET - Check job status

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verify authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }

    const jobId = request.nextUrl.searchParams.get('jobId')

    if (!jobId) {
      return NextResponse.json(
        { success: false, error: 'jobId es requerido' },
        { status: 400 }
      )
    }

    // Get job with steps
    const { data: jobData, error } = await (supabase as any)
      .from('sii_jobs')
      .select(
        `
        *,
        cliente:clientes(nombre_razon_social, rut),
        steps:sii_execution_steps(*)
      `
      )
      .eq('id', jobId)
      .single()

    if (error || !jobData) {
      return NextResponse.json({ success: false, error: 'Job no encontrado' }, { status: 404 })
    }

    const job = jobData as {
      id: string
      status: string
      task_type: string
      steps: unknown[]
      archivos_descargados: unknown
      datos_extraidos: unknown
      error_message: string | null
    }

    // Calculate progress
    const steps = (job.steps || []) as Array<{ status?: string; step_name?: string }>
    const completedSteps = steps.filter((s) => s.status === 'success').length
    const totalSteps = getExpectedSteps(job.task_type)
    const progress = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0

    return NextResponse.json({
      success: true,
      job_id: job.id,
      status: job.status,
      progress,
      current_step: getCurrentStep(job.status, steps),
      steps,
      results: {
        files: job.archivos_descargados,
        data: job.datos_extraidos,
      },
      error: job.error_message,
    })
  } catch (error) {
    console.error('[SII RPA Status] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

function getExpectedSteps(taskType: string): number {
  const stepCounts: Record<string, number> = {
    login_test: 2,
    situacion_tributaria: 3,
    libro_compras: 4,
    libro_ventas: 4,
    f29_submit: 5,
    f29_download: 3,
    certificate_download: 3,
  }

  return stepCounts[taskType] || 3
}

function getCurrentStep(status: string, steps: Array<{ status?: string; step_name?: string }>): string {
  if (status === 'pendiente') return 'En cola'
  if (status === 'completado') return 'Completado'
  if (status === 'fallido') return 'Error'
  if (status === 'cancelado') return 'Cancelado'

  // Get last step name
  const lastStep = steps[steps.length - 1]
  return lastStep?.step_name || 'Procesando...'
}
