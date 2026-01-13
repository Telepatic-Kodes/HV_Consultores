'use server'

import { createClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'
import type { Database } from '@/types/database.types'

type BotDefinicion = Database['public']['Tables']['bot_definiciones']['Row']
type BotJob = Database['public']['Tables']['bot_jobs']['Row']
type BotLog = Database['public']['Tables']['bot_logs']['Row']

export interface BotConStats extends BotDefinicion {
  jobs_hoy: number
  exitos_hoy: number
  fallos_hoy: number
  ultimo_job: BotJob | null
}

export interface BotJobConDetalles extends BotJob {
  bot: { nombre: string } | null
  cliente: { razon_social: string } | null
  logs: BotLog[]
}

export interface BotStats {
  totalBots: number
  activos: number
  tareasHoy: number
  erroresHoy: number
}

// Obtener lista de bots con estadísticas
export async function getBots(): Promise<BotConStats[]> {
  const supabase = createClient()
  const hoy = new Date().toISOString().split('T')[0]

  const { data: bots, error } = await supabase
    .from('bot_definiciones')
    .select('*')
    .eq('activo', true)
    .order('nombre')

  if (error || !bots) {
    console.error('Error fetching bots:', error)
    return []
  }

  // Para cada bot, obtener estadísticas del día
  const botsConStats = await Promise.all(
    bots.map(async (bot) => {
      const { data: jobs } = await supabase
        .from('bot_jobs')
        .select('*')
        .eq('bot_id', bot.id)
        .gte('created_at', `${hoy}T00:00:00`)

      const { data: ultimoJob } = await supabase
        .from('bot_jobs')
        .select('*')
        .eq('bot_id', bot.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      return {
        ...bot,
        jobs_hoy: jobs?.length || 0,
        exitos_hoy: jobs?.filter(j => j.status === 'completado').length || 0,
        fallos_hoy: jobs?.filter(j => j.status === 'fallido').length || 0,
        ultimo_job: ultimoJob || null,
      }
    })
  )

  return botsConStats
}

// Obtener estadísticas generales
export async function getBotStats(): Promise<BotStats> {
  const supabase = createClient()
  const hoy = new Date().toISOString().split('T')[0]

  const { count: totalBots } = await supabase
    .from('bot_definiciones')
    .select('*', { count: 'exact', head: true })
    .eq('activo', true)

  const { data: jobsHoy } = await supabase
    .from('bot_jobs')
    .select('status')
    .gte('created_at', `${hoy}T00:00:00`)

  const { data: botsEjecutando } = await supabase
    .from('bot_jobs')
    .select('bot_id')
    .eq('status', 'ejecutando')

  return {
    totalBots: totalBots || 0,
    activos: new Set(botsEjecutando?.map(b => b.bot_id)).size,
    tareasHoy: jobsHoy?.length || 0,
    erroresHoy: jobsHoy?.filter(j => j.status === 'fallido').length || 0,
  }
}

// Obtener historial de jobs recientes
export async function getJobsRecientes(limit: number = 20): Promise<BotJobConDetalles[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('bot_jobs')
    .select(`
      *,
      bot:bot_definiciones(nombre),
      cliente:clientes(razon_social),
      logs:bot_logs(*)
    `)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching jobs:', error)
    return []
  }

  return (data || []) as unknown as BotJobConDetalles[]
}

// Ejecutar bot manualmente
export async function ejecutarBot(
  botId: string,
  clienteId?: string
): Promise<{ success: boolean; jobId?: string; error?: string }> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const { data: job, error } = await supabase
    .from('bot_jobs')
    .insert({
      bot_id: botId,
      cliente_id: clienteId || null,
      status: 'pendiente',
      triggered_by: 'manual',
      triggered_by_user: user?.id || null,
      scheduled_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  // Simular inicio de ejecución
  await supabase
    .from('bot_jobs')
    .update({
      status: 'ejecutando',
      started_at: new Date().toISOString(),
    })
    .eq('id', job.id)

  // Agregar log inicial
  await supabase.from('bot_logs').insert({
    job_id: job.id,
    nivel: 'info',
    paso: 'inicio',
    mensaje: 'Bot iniciado manualmente',
  })

  revalidatePath('/dashboard/bots')
  return { success: true, jobId: job.id }
}

// Pausar/Reanudar bot
export async function toggleBotActivo(botId: string): Promise<{ success: boolean }> {
  const supabase = createClient()

  const { data: bot } = await supabase
    .from('bot_definiciones')
    .select('activo')
    .eq('id', botId)
    .single()

  if (!bot) return { success: false }

  await supabase
    .from('bot_definiciones')
    .update({ activo: !bot.activo })
    .eq('id', botId)

  revalidatePath('/dashboard/bots')
  return { success: true }
}

// Cancelar job en ejecución
export async function cancelarJob(jobId: string): Promise<{ success: boolean }> {
  const supabase = createClient()

  await supabase
    .from('bot_jobs')
    .update({
      status: 'cancelado',
      completed_at: new Date().toISOString(),
      error_message: 'Cancelado por el usuario',
    })
    .eq('id', jobId)

  await supabase.from('bot_logs').insert({
    job_id: jobId,
    nivel: 'warning',
    paso: 'cancelacion',
    mensaje: 'Job cancelado por el usuario',
  })

  revalidatePath('/dashboard/bots')
  return { success: true }
}

// Obtener clientes para selector
export async function getClientesParaBot(): Promise<{ id: string; razon_social: string; rut: string }[]> {
  const supabase = createClient()

  const { data } = await supabase
    .from('clientes')
    .select('id, razon_social, rut')
    .eq('activo', true)
    .order('razon_social')

  return data || []
}

// Ejecutar bots pendientes (llamar a Edge Function)
export async function ejecutarBotsPendientes(): Promise<{ success: boolean; jobsProcessed?: number }> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const response = await fetch(`${supabaseUrl}/functions/v1/bot-executor`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const result = await response.json()
    revalidatePath('/dashboard/bots')
    return { success: result.success, jobsProcessed: result.jobsProcessed }
  } catch (error) {
    console.error('Error ejecutando bots:', error)
    return { success: false }
  }
}
