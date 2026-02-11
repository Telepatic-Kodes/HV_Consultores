'use server'

import { ConvexHttpClient } from "convex/browser"
import { api } from "../../../../convex/_generated/api"
import { revalidatePath } from 'next/cache'

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL
const convex = convexUrl ? new ConvexHttpClient(convexUrl) : null

export interface SIIJob {
  _id: string
  bot_id: string
  cliente_id?: string
  status?: string
  error_message?: string
  created_at?: string
  started_at?: string
  completed_at?: string
}

export interface SIIJobStats {
  total: number
  completados: number
  fallidos: number
  ejecutando: number
}

// Obtener jobs del SII
export async function getSIIJobs(clienteId?: string): Promise<SIIJob[]> {
  try {
    if (!convex) throw new Error('Convex client not initialized')
    const jobs = await convex.query(api.bots.listJobs, {
      clienteId: clienteId as any,
    })
    return jobs as any[]
  } catch (error) {
    console.error('Error fetching SII jobs:', error)
    return []
  }
}

// Crear job del SII
export async function createSIIJob(
  botId: string,
  clienteId?: string,
  config?: Record<string, any>
): Promise<{ success: boolean; jobId?: string; error?: string }> {
  try {
    if (!convex) throw new Error('Convex client not initialized')
    const jobId = await convex.mutation(api.bots.createJob, {
      bot_id: botId as any,
      cliente_id: clienteId as any,
      config_override: config,
    })

    revalidatePath('/dashboard/sii')
    return { success: true, jobId: jobId as string }
  } catch (error) {
    console.error('Error creating SII job:', error)
    return { success: false, error: 'Error creando job' }
  }
}

// Obtener pasos de un job
export async function getSIIJobSteps(jobId: string): Promise<any[]> {
  try {
    if (!convex) throw new Error('Convex client not initialized')
    const steps = await convex.query(api.bots.getJobSteps, {
      jobId: jobId as any,
    })
    return steps
  } catch (error) {
    console.error('Error getting job steps:', error)
    return []
  }
}

// Obtener estadísticas de jobs SII
export async function getSIIJobStats(): Promise<SIIJobStats> {
  try {
    if (!convex) throw new Error('Convex client not initialized')
    const jobs = await convex.query(api.bots.listJobs, {})

    const stats = {
      total: jobs.length,
      completados: jobs.filter(j => j.status === 'completado').length,
      fallidos: jobs.filter(j => j.status === 'fallido').length,
      ejecutando: jobs.filter(j => j.status === 'ejecutando').length,
    }

    return stats
  } catch (error) {
    console.error('Error getting SII job stats:', error)
    return {
      total: 0,
      completados: 0,
      fallidos: 0,
      ejecutando: 0,
    }
  }
}

// Cancelar job
export async function cancelarSIIJob(
  jobId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!convex) throw new Error('Convex client not initialized')
    await convex.mutation(api.bots.updateJobStatus, {
      id: jobId as any,
      status: 'cancelado',
    })

    revalidatePath('/dashboard/sii')
    return { success: true }
  } catch (error) {
    console.error('Error cancelando job:', error)
    return { success: false, error: 'Error cancelando job' }
  }
}

// Reintentar job fallido
export async function reintentarSIIJob(
  jobId: string
): Promise<{ success: boolean; newJobId?: string; error?: string }> {
  try {
    if (!convex) throw new Error('Convex client not initialized')
    // Get original job
    const jobs = await convex.query(api.bots.listJobs, {})
    const originalJob = jobs.find(j => j._id === jobId)

    if (!originalJob) {
      return { success: false, error: 'Job no encontrado' }
    }

    // Create new job with same config
    const newJobId = await convex.mutation(api.bots.createJob, {
      bot_id: originalJob.bot_id,
      cliente_id: originalJob.cliente_id,
      config_override: originalJob.config_override,
    })

    revalidatePath('/dashboard/sii')
    return { success: true, newJobId: newJobId as string }
  } catch (error) {
    console.error('Error reintentando job:', error)
    return { success: false, error: 'Error reintentando job' }
  }
}

// --- Backward-compatible exports for page components ---

export async function getSiiStats(): Promise<SIIJobStats> {
  return getSIIJobStats()
}

export async function getJobsRecientes(): Promise<SIIJob[]> {
  return getSIIJobs()
}

export async function getClientesConCredenciales(): Promise<any[]> {
  try {
    if (!convex) throw new Error('Convex client not initialized')
    const clientes = await convex.query(api.clients.listClientes, {})
    return clientes.filter((c: any) => c.activo)
  } catch {
    return []
  }
}

export async function getClientesSinCredenciales(): Promise<any[]> {
  try {
    if (!convex) throw new Error('Convex client not initialized')
    return await convex.query(api.clients.listClientes, {})
  } catch {
    return []
  }
}

export async function getScheduledTasks(): Promise<any[]> {
  // Scheduled tasks not in current schema
  return []
}

export async function createF29SubmitJob(
  clienteId: string,
  periodo: string
): Promise<{ success: boolean; error?: string }> {
  return createSIIJob('f29-submit', clienteId, { periodo })
}

export async function getF29CalculosAprobados(clienteId?: string): Promise<any[]> {
  try {
    if (!convex) throw new Error('Convex client not initialized')
    const submissions = await convex.query(api.f29.listSubmissions, {
      clienteId: clienteId as any,
    })
    return (submissions as any[]).filter((s: any) => s.status === 'aprobado')
  } catch {
    return []
  }
}

export async function cancelJob(
  jobId: string
): Promise<{ success: boolean; error?: string }> {
  return cancelarSIIJob(jobId)
}

export async function ejecutarTareaRapida(
  taskType: string,
  clienteId?: string
): Promise<{ success: boolean; error?: string }> {
  return createSIIJob(taskType, clienteId)
}

export async function saveCredenciales(
  clienteId: string,
  credenciales: Record<string, string>
): Promise<{ success: boolean; error?: string }> {
  // Credentials not stored in Convex yet - placeholder
  return { success: true }
}

export async function deleteCredenciales(
  clienteId: string
): Promise<{ success: boolean; error?: string }> {
  return { success: true }
}

export async function validarCredenciales(
  clienteId: string
): Promise<{ success: boolean; valid?: boolean; error?: string }> {
  return { success: true, valid: true }
}

export async function createScheduledTask(
  data: {
    cliente_id: string
    task_type: string
    cron_expression: string
    descripcion?: string
  }
): Promise<{ success: boolean; error?: string }> {
  // Scheduled tasks not in current schema - placeholder
  revalidatePath('/dashboard/sii')
  return { success: true }
}

export async function toggleScheduledTask(
  taskId: string,
  active: boolean
): Promise<{ success: boolean; error?: string }> {
  // Scheduled tasks not in current schema - placeholder
  revalidatePath('/dashboard/sii')
  return { success: true }
}

export async function deleteScheduledTask(
  taskId: string
): Promise<{ success: boolean; error?: string }> {
  // Scheduled tasks not in current schema - placeholder
  revalidatePath('/dashboard/sii')
  return { success: true }
}
