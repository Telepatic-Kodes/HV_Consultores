// SII RPA Queue Handler
// HV Consultores - Manejo de cola de trabajos SII
// TODO: Phase 2 - Implement SII RPA queue in Convex
// Tables needed: sii_jobs, sii_execution_steps

import type {
  SiiJob,
  SiiJobCreateInput,
  SiiJobStatus,
  SiiExecutionStep,
  SiiStepStatus,
  SiiTaskType,
} from './types'

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
  // Stub: returns success until Convex module is implemented
  return { success: true, job: undefined, error: undefined }
}

/**
 * Actualiza el estado de un job
 */
export async function updateJobStatus(
  jobId: string,
  status: SiiJobStatus,
  additionalData?: Partial<SiiJob>
): Promise<{ success: boolean; error?: string }> {
  // Stub: returns success until Convex module is implemented
  return { success: true }
}

/**
 * Obtiene un job por ID
 */
export async function getJobById(jobId: string): Promise<{
  success: boolean
  job?: SiiJob
  error?: string
}> {
  // Stub: returns not found until Convex module is implemented
  return { success: false, error: 'Job not found (demo mode)' }
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
  // Stub: returns empty data until Convex module is implemented
  return {
    success: true,
    jobs: [],
    total: 0,
  }
}

// ============================================================================
// EXECUTION STEPS
// ============================================================================

/**
 * Agrega un paso de ejecucion a un job
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
  // Stub: returns success until Convex module is implemented
  return { success: true, step: undefined }
}

/**
 * Actualiza un paso de ejecucion
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
  // Stub: returns success until Convex module is implemented
  return { success: true }
}

// ============================================================================
// QUEUE HANDLER CLASS
// ============================================================================

export class SiiQueueHandler {
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
    // Stub: returns empty data until Convex module is implemented
    return []
  }

  /**
   * Reclama un job para procesamiento
   * Usa update condicional para evitar race conditions
   */
  async claimJob(jobId: string, serverName: string): Promise<boolean> {
    // Stub: returns false until Convex module is implemented
    return false
  }

  /**
   * Libera un job despues de procesarlo
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
    // Stub: returns success until Convex module is implemented
    this.releaseJob(jobId)
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
    // Stub: returns success until Convex module is implemented
    this.releaseJob(jobId)
    return true
  }

  /**
   * Obtiene estadisticas de la cola
   */
  async getQueueStats(): Promise<{
    pending: number
    running: number
    completed_today: number
    failed_today: number
  }> {
    // Stub: returns empty stats until Convex module is implemented
    return {
      pending: 0,
      running: 0,
      completed_today: 0,
      failed_today: 0,
    }
  }

  /**
   * Verifica si hay capacidad para procesar mas jobs
   */
  hasCapacity(): boolean {
    return this.processingJobs.size < this.maxConcurrent
  }

  /**
   * Obtiene el numero de jobs en procesamiento
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
