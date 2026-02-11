// SII RPA Queue Handler
// HV Consultores - Manejo de cola de trabajos SII

import { supabase } from '@/lib/supabase'
import type {
  SiiJob,
  SiiJobCreateInput,
  SiiJobStatus,
  SiiExecutionStep,
  SiiStepStatus,
  SiiTaskType,
} from './types'

// ============================================================================
// SUPABASE CLIENT
// ============================================================================

// Using mock Supabase client (demo mode) - data access via Convex
function getSupabaseAdmin() {
  return supabase
}

// ============================================================================
// JOB MANAGEMENT
// ============================================================================

/**
 * Crea un nuevo job SII
 */
export async function createSiiJob(input: SiiJobCreateInput): Promise<{
  success: boolean
  job?: SiiJob
  error?: string
}> {
  try {
    const supabase = getSupabaseAdmin()

    const jobData = {
      cliente_id: input.cliente_id,
      task_type: input.task_type,
      periodo: input.periodo,
      parametros: input.parametros || {},
      f29_calculo_id: input.f29_calculo_id,
      codigos_f29: input.codigos_f29,
      status: 'pendiente' as SiiJobStatus,
      archivos_descargados: [],
      screenshots: [],
      retry_count: 0,
      max_retries: 3,
    }

    const { data, error } = await supabase
      .from('sii_jobs')
      .insert(jobData)
      .select()
      .single()

    if (error) {
      console.error('[createSiiJob] Error:', error)
      return { success: false, error: error.message }
    }

    return { success: true, job: data as SiiJob }
  } catch (error) {
    console.error('[createSiiJob] Exception:', error)
    return { success: false, error: 'Error al crear job' }
  }
}

/**
 * Actualiza el estado de un job
 */
export async function updateJobStatus(
  jobId: string,
  status: SiiJobStatus,
  additionalData?: Partial<SiiJob>
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getSupabaseAdmin()

    const updateData: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString(),
      ...additionalData,
    }

    // Agregar timestamps según el estado
    if (status === 'ejecutando' && !additionalData?.started_at) {
      updateData.started_at = new Date().toISOString()
    }

    if (status === 'completado' || status === 'fallido' || status === 'cancelado') {
      updateData.completed_at = new Date().toISOString()
    }

    const { error } = await supabase.from('sii_jobs').update(updateData).eq('id', jobId)

    if (error) {
      console.error('[updateJobStatus] Error:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('[updateJobStatus] Exception:', error)
    return { success: false, error: 'Error al actualizar job' }
  }
}

/**
 * Obtiene un job por ID
 */
export async function getJobById(jobId: string): Promise<{
  success: boolean
  job?: SiiJob
  error?: string
}> {
  try {
    const supabase = getSupabaseAdmin()

    const { data, error } = await supabase
      .from('sii_jobs')
      .select('*')
      .eq('id', jobId)
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, job: data as SiiJob }
  } catch (error) {
    console.error('[getJobById] Exception:', error)
    return { success: false, error: 'Error al obtener job' }
  }
}

/**
 * Obtiene jobs de un cliente
 */
export async function getJobsForCliente(
  clienteId: string,
  options?: {
    status?: SiiJobStatus
    taskType?: SiiTaskType
    limit?: number
    offset?: number
  }
): Promise<{
  success: boolean
  jobs?: SiiJob[]
  total?: number
  error?: string
}> {
  try {
    const supabase = getSupabaseAdmin()

    let query = supabase
      .from('sii_jobs')
      .select('*', { count: 'exact' })
      .eq('cliente_id', clienteId)
      .order('created_at', { ascending: false })

    if (options?.status) {
      query = query.eq('status', options.status)
    }

    if (options?.taskType) {
      query = query.eq('task_type', options.taskType)
    }

    if (options?.limit) {
      query = query.limit(options.limit)
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1)
    }

    const { data, error, count } = await query

    if (error) {
      return { success: false, error: error.message }
    }

    return {
      success: true,
      jobs: data as SiiJob[],
      total: count || 0,
    }
  } catch (error) {
    console.error('[getJobsForCliente] Exception:', error)
    return { success: false, error: 'Error al obtener jobs' }
  }
}

// ============================================================================
// EXECUTION STEPS
// ============================================================================

/**
 * Agrega un paso de ejecución a un job
 */
export async function addExecutionStep(
  jobId: string,
  stepData: {
    step_number: number
    step_name: string
    step_description?: string
    input_data?: Record<string, unknown>
  }
): Promise<{
  success: boolean
  step?: SiiExecutionStep
  error?: string
}> {
  try {
    const supabase = getSupabaseAdmin()

    const { data, error } = await supabase
      .from('sii_execution_steps')
      .insert({
        sii_job_id: jobId,
        ...stepData,
        status: 'running' as SiiStepStatus,
        started_at: new Date().toISOString(),
        retry_count: 0,
      })
      .select()
      .single()

    if (error) {
      console.error('[addExecutionStep] Error:', error)
      return { success: false, error: error.message }
    }

    return { success: true, step: data as SiiExecutionStep }
  } catch (error) {
    console.error('[addExecutionStep] Exception:', error)
    return { success: false, error: 'Error al agregar paso' }
  }
}

/**
 * Actualiza un paso de ejecución
 */
export async function updateExecutionStep(
  stepId: string,
  updateData: {
    status: SiiStepStatus
    output_data?: Record<string, unknown>
    screenshot_path?: string
    error_code?: string
    error_message?: string
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getSupabaseAdmin()

    const completedAt = new Date().toISOString()
    const startedAt = (
      await supabase
        .from('sii_execution_steps')
        .select('started_at')
        .eq('id', stepId)
        .single()
    ).data?.started_at

    const duration = startedAt
      ? new Date(completedAt).getTime() - new Date(startedAt).getTime()
      : null

    const { error } = await supabase
      .from('sii_execution_steps')
      .update({
        ...updateData,
        completed_at: completedAt,
        duration_ms: duration,
      })
      .eq('id', stepId)

    if (error) {
      console.error('[updateExecutionStep] Error:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('[updateExecutionStep] Exception:', error)
    return { success: false, error: 'Error al actualizar paso' }
  }
}

// ============================================================================
// QUEUE HANDLER CLASS
// ============================================================================

export class SiiQueueHandler {
  private supabase = getSupabaseAdmin()
  private processingJobs: Set<string> = new Set()
  private maxConcurrent: number = 5
  private pollInterval: number = 5000 // 5 segundos

  constructor(options?: { maxConcurrent?: number; pollInterval?: number }) {
    if (options?.maxConcurrent) this.maxConcurrent = options.maxConcurrent
    if (options?.pollInterval) this.pollInterval = options.pollInterval
  }

  /**
   * Obtiene jobs pendientes de la cola
   */
  async getPendingJobs(limit: number = 10): Promise<SiiJob[]> {
    const { data, error } = await this.supabase
      .from('sii_jobs')
      .select('*')
      .eq('status', 'pendiente')
      .order('created_at', { ascending: true })
      .limit(limit)

    if (error) {
      console.error('[getPendingJobs] Error:', error)
      return []
    }

    return data as SiiJob[]
  }

  /**
   * Reclama un job para procesamiento
   * Usa update condicional para evitar race conditions
   */
  async claimJob(jobId: string, serverName: string): Promise<boolean> {
    if (this.processingJobs.has(jobId)) return false

    const { error } = await this.supabase
      .from('sii_jobs')
      .update({
        status: 'ejecutando',
        execution_server: serverName,
        started_at: new Date().toISOString(),
      })
      .eq('id', jobId)
      .eq('status', 'pendiente')

    if (error) {
      console.error('[claimJob] Error:', error)
      return false
    }

    this.processingJobs.add(jobId)
    return true
  }

  /**
   * Libera un job después de procesarlo
   */
  releaseJob(jobId: string): void {
    this.processingJobs.delete(jobId)
  }

  /**
   * Marca un job como completado
   */
  async completeJob(
    jobId: string,
    result: {
      archivos?: string[]
      datos?: Record<string, unknown>
      screenshots?: Array<{ step: string; path: string; timestamp: string }>
    }
  ): Promise<boolean> {
    const { error } = await this.supabase
      .from('sii_jobs')
      .update({
        status: 'completado',
        completed_at: new Date().toISOString(),
        archivos_descargados: result.archivos || [],
        datos_extraidos: result.datos || {},
        screenshots: result.screenshots || [],
      })
      .eq('id', jobId)

    this.releaseJob(jobId)

    if (error) {
      console.error('[completeJob] Error:', error)
      return false
    }

    return true
  }

  /**
   * Marca un job como fallido
   */
  async failJob(
    jobId: string,
    error: {
      message: string
      code?: string
    },
    shouldRetry: boolean = true
  ): Promise<boolean> {
    const job = await getJobById(jobId)
    if (!job.success || !job.job) return false

    const currentRetries = job.job.retry_count || 0
    const maxRetries = job.job.max_retries || 3

    if (shouldRetry && currentRetries < maxRetries) {
      // Reintentar
      const { error: updateError } = await this.supabase
        .from('sii_jobs')
        .update({
          status: 'pendiente',
          retry_count: currentRetries + 1,
          error_message: error.message,
        })
        .eq('id', jobId)

      this.releaseJob(jobId)
      return !updateError
    }

    // Marcar como fallido definitivamente
    const { error: updateError } = await this.supabase
      .from('sii_jobs')
      .update({
        status: 'fallido',
        completed_at: new Date().toISOString(),
        error_message: error.message,
      })
      .eq('id', jobId)

    this.releaseJob(jobId)
    return !updateError
  }

  /**
   * Obtiene estadísticas de la cola
   */
  async getQueueStats(): Promise<{
    pending: number
    running: number
    completed_today: number
    failed_today: number
  }> {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const [pending, running, completedToday, failedToday] = await Promise.all([
      this.supabase
        .from('sii_jobs')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pendiente'),
      this.supabase
        .from('sii_jobs')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'ejecutando'),
      this.supabase
        .from('sii_jobs')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'completado')
        .gte('completed_at', today.toISOString()),
      this.supabase
        .from('sii_jobs')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'fallido')
        .gte('completed_at', today.toISOString()),
    ])

    return {
      pending: pending.count || 0,
      running: running.count || 0,
      completed_today: completedToday.count || 0,
      failed_today: failedToday.count || 0,
    }
  }

  /**
   * Verifica si hay capacidad para procesar más jobs
   */
  hasCapacity(): boolean {
    return this.processingJobs.size < this.maxConcurrent
  }

  /**
   * Obtiene el número de jobs en procesamiento
   */
  getProcessingCount(): number {
    return this.processingJobs.size
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let queueHandlerInstance: SiiQueueHandler | null = null

export function getQueueHandler(
  options?: { maxConcurrent?: number; pollInterval?: number }
): SiiQueueHandler {
  if (!queueHandlerInstance) {
    queueHandlerInstance = new SiiQueueHandler(options)
  }
  return queueHandlerInstance
}
