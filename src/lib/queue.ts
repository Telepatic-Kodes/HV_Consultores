// @ts-nocheck
// Job Queue System for Phase 6 Automation
// Supports both Bull (Redis) and Database-based queue implementations

import { supabase as supabaseClient } from '@/lib/supabase'
import type { Database } from '@/types/database.types'

const createClient = () => supabaseClient

// =============================================================================
// JOB QUEUE TYPES
// =============================================================================

export interface QueueJob {
  id: string
  type:
    | 'email'
    | 'webhook'
    | 'archive'
    | 'delete'
    | 'notification'
    | 'report'
  datos: Record<string, any>
  estado: 'pending' | 'processing' | 'completed' | 'failed'
  intentos: number
  maxIntentos: number
  resultado?: Record<string, any>
  error?: string
  creado_en: Date
  actualizado_en: Date
  proxima_tentativa?: Date
}

// =============================================================================
// DATABASE-BASED QUEUE (Works without Redis)
// =============================================================================

class DatabaseQueue {
  private supabase = createClient<Database>(
    process.env.SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  )

  private procesadorActivo = false
  private intervalo: NodeJS.Timeout | null = null

  /**
   * Add job to queue
   */
  async add(
    tipo: QueueJob['type'],
    datos: Record<string, any>,
    opciones?: {
      maxIntentos?: number
      delay?: number
    }
  ): Promise<string> {
    const jobId = crypto.randomUUID()
    const ahora = new Date()
    const proximaTentativa = opciones?.delay
      ? new Date(ahora.getTime() + opciones.delay * 1000)
      : ahora

    const { error } = await this.supabase
      .from('queue_jobs')
      .insert([
        {
          id: jobId,
          tipo,
          datos,
          estado: 'pending',
          intentos: 0,
          max_intentos: opciones?.maxIntentos || 3,
          creado_en: ahora,
          actualizado_en: ahora,
          proxima_tentativa: proximaTentativa,
        },
      ])

    if (error) throw error
    return jobId
  }

  /**
   * Get job by ID
   */
  async get(jobId: string): Promise<QueueJob | null> {
    const { data, error } = await this.supabase
      .from('queue_jobs')
      .select('*')
      .eq('id', jobId)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data || null
  }

  /**
   * Get pending jobs
   */
  async getPending(limit: number = 10): Promise<QueueJob[]> {
    const ahora = new Date()

    const { data, error } = await this.supabase
      .from('queue_jobs')
      .select('*')
      .eq('estado', 'pending')
      .lte('proxima_tentativa', ahora.toISOString())
      .lt('intentos', this.supabase.from('queue_jobs').select('*').limit(1))
      .order('creado_en', { ascending: true })
      .limit(limit)

    if (error) throw error
    return data || []
  }

  /**
   * Mark job as processing
   */
  async markProcessing(jobId: string): Promise<void> {
    const { error } = await this.supabase
      .from('queue_jobs')
      .update({
        estado: 'processing',
        actualizado_en: new Date(),
      })
      .eq('id', jobId)

    if (error) throw error
  }

  /**
   * Mark job as completed
   */
  async markCompleted(
    jobId: string,
    resultado?: Record<string, any>
  ): Promise<void> {
    const { error } = await this.supabase
      .from('queue_jobs')
      .update({
        estado: 'completed',
        resultado,
        actualizado_en: new Date(),
      })
      .eq('id', jobId)

    if (error) throw error
  }

  /**
   * Mark job as failed with retry
   */
  async markFailed(
    jobId: string,
    error: string,
    debeReintentar: boolean = true
  ): Promise<void> {
    const job = await this.get(jobId)
    if (!job) throw new Error('Job not found')

    const nuevoIntento = job.intentos + 1
    const debesFallar = nuevoIntento >= job.maxIntentos

    if (debesFallar || !debeReintentar) {
      // Job failed permanently
      const { error: updateError } = await this.supabase
        .from('queue_jobs')
        .update({
          estado: 'failed',
          error,
          actualizado_en: new Date(),
          intentos: nuevoIntento,
        })
        .eq('id', jobId)

      if (updateError) throw updateError
    } else {
      // Retry with exponential backoff
      const tiempoEspera = Math.pow(2, nuevoIntento) * 60 // exponential backoff in seconds
      const proximaTentativa = new Date(
        Date.now() + tiempoEspera * 1000
      )

      const { error: updateError } = await this.supabase
        .from('queue_jobs')
        .update({
          estado: 'pending',
          error,
          actualizado_en: new Date(),
          intentos: nuevoIntento,
          proxima_tentativa: proximaTentativa,
        })
        .eq('id', jobId)

      if (updateError) throw updateError
    }
  }

  /**
   * Start processing queue
   */
  startProcessing(
    manejadores: Record<
      string,
      (datos: Record<string, any>) => Promise<Record<string, any>>
    >,
    intervaloSegundos: number = 10
  ): void {
    if (this.procesadorActivo) return

    this.procesadorActivo = true
    console.log('Queue processor started')

    this.intervalo = setInterval(async () => {
      try {
        await this.procesarJobs(manejadores)
      } catch (error) {
        console.error('Error processing queue:', error)
      }
    }, intervaloSegundos * 1000)
  }

  /**
   * Stop processing queue
   */
  stopProcessing(): void {
    if (this.intervalo) {
      clearInterval(this.intervalo)
      this.intervalo = null
      this.procesadorActivo = false
      console.log('Queue processor stopped')
    }
  }

  /**
   * Process pending jobs
   */
  private async procesarJobs(
    manejadores: Record<
      string,
      (datos: Record<string, any>) => Promise<Record<string, any>>
    >
  ): Promise<void> {
    const empleos = await this.getPending(10)

    for (const empleo of empleos) {
      try {
        await this.markProcessing(empleo.id)

        const manejador = manejadores[empleo.tipo]
        if (!manejador) {
          throw new Error(`No handler for job type: ${empleo.tipo}`)
        }

        const resultado = await manejador(empleo.datos)
        await this.markCompleted(empleo.id, resultado)

        console.log(`Job ${empleo.id} completed successfully`)
      } catch (error) {
        const mensajeError = error instanceof Error ? error.message : String(error)
        await this.markFailed(empleo.id, mensajeError)
        console.error(`Job ${empleo.id} failed:`, mensajeError)
      }
    }
  }

  /**
   * Get queue stats
   */
  async getStats(): Promise<{
    pending: number
    processing: number
    completed: number
    failed: number
    total: number
  }> {
    const { data, error } = await this.supabase
      .from('queue_jobs')
      .select('estado, count')
      .returns<Array<{ estado: string; count: number }>>()

    if (error) throw error

    const stats = {
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0,
      total: 0,
    }

    for (const row of data || []) {
      stats[row.estado as keyof typeof stats] = row.count
      stats.total += row.count
    }

    return stats
  }
}

// =============================================================================
// QUEUE HANDLERS
// =============================================================================

/**
 * Email Job Handler
 */
export async function handleEmailJob(datos: Record<string, any>): Promise<Record<string, any>> {
  const { para, asunto, cuerpo, templateId } = datos

  // TODO: Integrate with actual email service (SendGrid, AWS SES, etc.)
  // For now, just log it
  console.log(`Sending email to ${para}: ${asunto}`)

  return {
    success: true,
    messageId: `msg_${Date.now()}`,
    timestamp: new Date(),
  }
}

/**
 * Webhook Job Handler
 */
export async function handleWebhookJob(
  datos: Record<string, any>
): Promise<Record<string, any>> {
  const { url, evento, payload, secret } = datos

  try {
    // Create HMAC signature
    const timestamp = Math.floor(Date.now() / 1000)
    const signedContent = `${timestamp}.${JSON.stringify(payload)}`
    const crypto = await import('crypto')
    const signature = crypto
      .createHmac('sha256', secret)
      .update(signedContent)
      .digest('hex')

    // Send webhook
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': `sha256=${signature}`,
        'X-Webhook-Timestamp': timestamp.toString(),
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(30000), // 30 second timeout
    })

    if (!response.ok) {
      throw new Error(`Webhook failed with status ${response.status}`)
    }

    return {
      success: true,
      status: response.status,
      timestamp: new Date(),
    }
  } catch (error) {
    throw new Error(
      `Webhook delivery failed: ${error instanceof Error ? error.message : String(error)}`
    )
  }
}

/**
 * Archive Job Handler
 */
export async function handleArchiveJob(
  datos: Record<string, any>
): Promise<Record<string, any>> {
  const { clienteId, documentoIds } = datos
  const supabase = createClient<Database>(
    process.env.SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  )

  let archivados = 0

  for (const docId of documentoIds || []) {
    try {
      await supabase
        .from('document_lifecycle')
        .update({
          estado_actual: 'ARCHIVADO',
          fecha_archivado: new Date(),
        })
        .eq('documento_carga_id', docId)

      archivados++
    } catch (error) {
      console.error(`Error archiving document ${docId}:`, error)
    }
  }

  return {
    success: true,
    archivados,
    total: documentoIds?.length || 0,
    timestamp: new Date(),
  }
}

/**
 * Delete Job Handler
 */
export async function handleDeleteJob(
  datos: Record<string, any>
): Promise<Record<string, any>> {
  const { clienteId, documentoIds } = datos
  const supabase = createClient<Database>(
    process.env.SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  )

  let eliminados = 0

  for (const docId of documentoIds || []) {
    try {
      await supabase
        .from('document_lifecycle')
        .update({
          estado_actual: 'ELIMINADO',
          fecha_destruido: new Date(),
        })
        .eq('documento_carga_id', docId)

      eliminados++
    } catch (error) {
      console.error(`Error deleting document ${docId}:`, error)
    }
  }

  return {
    success: true,
    eliminados,
    total: documentoIds?.length || 0,
    timestamp: new Date(),
  }
}

/**
 * Notification Job Handler
 */
export async function handleNotificationJob(
  datos: Record<string, any>
): Promise<Record<string, any>> {
  const { usuarioId, clienteId, tipo, titulo, mensaje } = datos
  const supabase = createClient<Database>(
    process.env.SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  )

  const { data, error } = await supabase
    .from('notifications')
    .insert([
      {
        usuario_id: usuarioId,
        cliente_id: clienteId,
        tipo,
        titulo,
        mensaje,
        estado: 'SENT',
        enviado_en: new Date(),
      },
    ])
    .select()

  if (error) throw error

  return {
    success: true,
    notificationId: data?.[0]?.id,
    timestamp: new Date(),
  }
}

/**
 * Report Generation Job Handler
 */
export async function handleReportJob(
  datos: Record<string, any>
): Promise<Record<string, any>> {
  const { reporteId, clienteId, tipo, periodoInicio, periodoFin } = datos
  const supabase = createClient<Database>(
    process.env.SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  )

  // Generate report based on type
  let resumen_ejecutivo = {}
  let datos_completos = {}

  if (tipo === 'AUDIT') {
    // Fetch audit logs for period
    const { data: logs } = await supabase
      .from('audit_logs_extended')
      .select('*')
      .eq('cliente_id', clienteId)
      .gte('creado_en', periodoInicio)
      .lte('creado_en', periodoFin)

    resumen_ejecutivo = {
      totalOperaciones: logs?.length || 0,
      operacionesPorTipo: agruparPorTipo(logs || []),
    }
    datos_completos = { auditLogs: logs }
  }

  // Update report with generated content
  const { error } = await supabase
    .from('compliance_reports')
    .update({
      resumen_ejecutivo: resumen_ejecutivo,
      datos_completos: datos_completos,
      estado: 'APPROVED',
      fecha_generacion: new Date(),
    })
    .eq('id', reporteId)

  if (error) throw error

  return {
    success: true,
    reporteId,
    timestamp: new Date(),
  }
}

// =============================================================================
// SCHEDULER
// =============================================================================

export class Scheduler {
  private trabajosProgram: Map<string, NodeJS.Timeout> = new Map()

  /**
   * Schedule a job at specific cron time
   */
  scheduleJob(
    nombre: string,
    cronExpression: string,
    callback: () => Promise<void>
  ): void {
    // Simple cron parser - for production, use 'cron' npm package
    const [minuto, hora, diaMes] = cronExpression.split(' ').map(Number)

    const verificarYEjecutar = () => {
      const ahora = new Date()
      const debeEjecutarse =
        ahora.getMinutes() === minuto &&
        ahora.getHours() === hora &&
        (isNaN(diaMes) || ahora.getDate() === diaMes)

      if (debeEjecutarse) {
        console.log(`Executing scheduled job: ${nombre}`)
        callback().catch((error) => {
          console.error(`Error executing scheduled job ${nombre}:`, error)
        })
      }
    }

    // Check every minute
    const intervalo = setInterval(verificarYEjecutar, 60000)
    this.trabajosProgram.set(nombre, intervalo)
    console.log(`Scheduled job registered: ${nombre} (${cronExpression})`)
  }

  /**
   * Cancel scheduled job
   */
  cancelJob(nombre: string): void {
    const intervalo = this.trabajosProgram.get(nombre)
    if (intervalo) {
      clearInterval(intervalo)
      this.trabajosProgram.delete(nombre)
      console.log(`Scheduled job cancelled: ${nombre}`)
    }
  }

  /**
   * Cancel all scheduled jobs
   */
  cancelAll(): void {
    for (const [nombre, intervalo] of this.trabajosProgram) {
      clearInterval(intervalo)
    }
    this.trabajosProgram.clear()
    console.log('All scheduled jobs cancelled')
  }
}

// =============================================================================
// SINGLETON EXPORTS
// =============================================================================

export const queue = new DatabaseQueue()
export const scheduler = new Scheduler()

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function agruparPorTipo(
  logs: Array<{ tabla?: string }>
): Record<string, number> {
  const grupos: Record<string, number> = {}

  for (const log of logs) {
    const tipo = log.tabla || 'unknown'
    grupos[tipo] = (grupos[tipo] || 0) + 1
  }

  return grupos
}
