'use server'

import { ConvexHttpClient } from "convex/browser"
import { api } from "@/convex/_generated/api"
import { revalidatePath } from 'next/cache'

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!)

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
