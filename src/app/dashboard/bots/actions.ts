'use server'

import { ConvexHttpClient } from "convex/browser"
import { api } from "@/convex/_generated/api"
import { revalidatePath } from 'next/cache'

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!)

// Get bots list
export async function getBots() {
  try {
    return await convex.query(api.bots.listBotDefinitions, {})
  } catch (error) {
    console.error('Error fetching bots:', error)
    return []
  }
}

// Get bot jobs
export async function getBotJobs(botId?: string) {
  try {
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
