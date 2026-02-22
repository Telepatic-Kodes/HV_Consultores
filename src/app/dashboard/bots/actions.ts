'use server'

import { ConvexHttpClient } from "convex/browser"
import { api } from "../../../../convex/_generated/api"
import { revalidatePath } from 'next/cache'

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL
const convex = convexUrl ? new ConvexHttpClient(convexUrl) : null

// Get bots list with stats (mapped to BotConStats)
export async function getBots(): Promise<BotConStats[]> {
  try {
    if (!convex) throw new Error('Convex client not initialized')
    const [bots, jobs] = await Promise.all([
      convex.query(api.bots.listBotDefiniciones, {}),
      convex.query(api.bots.listJobs, {}),
    ])
    const today = new Date().toISOString().slice(0, 10)
    return (bots as any[]).map((b: any) => {
      const botJobs = (jobs as any[]).filter((j: any) => j.bot_id === b._id)
      const todayJobs = botJobs.filter((j: any) => j.created_at?.startsWith(today))
      return {
        _id: b._id,
        id: b._id,
        nombre: b.nombre,
        tipo: b.portal || 'rpa',
        descripcion: b.descripcion,
        portal: b.portal,
        activo: b.activo ?? true,
        total_jobs: botJobs.length,
        jobs_exitosos: botJobs.filter((j: any) => j.status === 'completado').length,
        jobs_fallidos: botJobs.filter((j: any) => j.status === 'fallido').length,
        exitos_hoy: todayJobs.filter((j: any) => j.status === 'completado').length,
        fallos_hoy: todayJobs.filter((j: any) => j.status === 'fallido').length,
        ultimo_job: botJobs[0] || null,
      }
    })
  } catch (error) {
    console.error('Error fetching bots:', error)
    return []
  }
}

// Get bot jobs
export async function getBotJobs(botId?: string) {
  try {
    if (!convex) throw new Error('Convex client not initialized')
    const jobs = await convex.query(api.bots.listJobs, {})
    return botId ? jobs.filter(j => j.bot_id === botId) : jobs
  } catch (error) {
    console.error('Error fetching bot jobs:', error)
    return []
  }
}

// Create bot job
export async function createBotJob(botId: string, clienteId?: string, config?: any) {
  try {
    if (!convex) throw new Error('Convex client not initialized')
    const jobId = await convex.mutation(api.bots.createJob, {
      bot_id: botId as any,
      cliente_id: clienteId as any,
      config_override: config,
    })
    revalidatePath('/dashboard/bots')
    return { success: true, jobId }
  } catch (error) {
    console.error('Error creating bot job:', error)
    return { success: false, error: 'Error creando job' }
  }
}

// --- Backward-compatible exports for page components ---

export interface BotConStats {
  _id: string
  id: string
  nombre: string
  tipo: string
  descripcion?: string
  portal?: string
  activo: boolean
  total_jobs: number
  jobs_exitosos: number
  jobs_fallidos: number
  exitos_hoy: number
  fallos_hoy: number
  ultimo_job?: { status: string; created_at?: string; completed_at?: string; started_at?: string; error_message?: string } | null
}

export interface BotJobConDetalles {
  _id: string
  id: string
  bot_id: string
  bot?: { nombre: string } | null
  bot_nombre?: string
  cliente?: { razon_social: string; rut?: string } | null
  cliente_nombre?: string
  status: string
  created_at?: string
  completed_at?: string
  error_message?: string
}

export interface BotStats {
  total: number
  totalBots: number
  activos: number
  ejecutando: number
  fallidos: number
  tareasHoy: number
  erroresHoy: number
}

export async function getBotStats(): Promise<BotStats> {
  try {
    if (!convex) throw new Error('Convex client not initialized')
    const [bots, jobs] = await Promise.all([
      convex.query(api.bots.listBotDefinitions, {}),
      convex.query(api.bots.listJobs, {}),
    ])
    const today = new Date().toISOString().slice(0, 10)
    const todayJobs = jobs.filter((j: any) => j.created_at?.startsWith(today))
    return {
      total: bots.length,
      totalBots: bots.length,
      activos: bots.filter((b: any) => b.activo).length,
      ejecutando: jobs.filter((j: any) => j.status === 'ejecutando').length,
      fallidos: jobs.filter((j: any) => j.status === 'fallido').length,
      tareasHoy: todayJobs.length,
      erroresHoy: todayJobs.filter((j: any) => j.status === 'fallido').length,
    }
  } catch {
    return { total: 0, totalBots: 0, activos: 0, ejecutando: 0, fallidos: 0, tareasHoy: 0, erroresHoy: 0 }
  }
}

export async function getJobsRecientes(limit: number = 20): Promise<BotJobConDetalles[]> {
  try {
    if (!convex) throw new Error('Convex client not initialized')
    const [jobs, bots, clientes] = await Promise.all([
      convex.query(api.bots.listJobs, {}),
      convex.query(api.bots.listBotDefiniciones, {}),
      convex.query(api.clients.listClientes, {}),
    ])
    const botMap = new Map((bots as any[]).map(b => [b._id, b]))
    const clienteMap = new Map((clientes as any[]).map(c => [c._id, c]))

    return (jobs as any[]).slice(0, limit).map((job: any) => {
      const bot = botMap.get(job.bot_id)
      const cliente = clienteMap.get(job.cliente_id)
      return {
        ...job,
        id: job._id,
        bot: bot ? { nombre: bot.nombre } : null,
        bot_nombre: bot?.nombre,
        cliente: cliente ? { razon_social: cliente.razon_social, rut: cliente.rut } : null,
        cliente_nombre: cliente?.razon_social,
      }
    })
  } catch (error) {
    console.error('Error fetching recent jobs:', error)
    return []
  }
}

export async function getClientesParaBot(): Promise<{ id: string; razon_social: string; rut: string }[]> {
  try {
    if (!convex) throw new Error('Convex client not initialized')
    const clientes = await convex.query(api.clients.listClientes, {})
    return (clientes as any[]).map(c => ({
      id: c._id,
      razon_social: c.razon_social,
      rut: c.rut,
    }))
  } catch {
    return []
  }
}

export async function ejecutarBot(
  botId: string,
  clienteId?: string,
  config?: any
): Promise<{ success: boolean; error?: string }> {
  return createBotJob(botId, clienteId, config)
}

export async function cancelarJob(
  jobId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!convex) throw new Error('Convex client not initialized')
    await convex.mutation(api.bots.updateJobStatus, {
      id: jobId as any,
      status: 'cancelado',
    })
    revalidatePath('/dashboard/bots')
    return { success: true }
  } catch {
    return { success: false, error: 'Error cancelando job' }
  }
}
