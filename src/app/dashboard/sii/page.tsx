import { Suspense } from 'react'
import { TopNav } from '@/components/dashboard'
import { SiiDashboardContent } from './components/sii-dashboard'
import { getSiiStats, getJobsRecientes, getClientesConCredenciales, getScheduledTasks, getBotDefiniciones } from './actions'
import type { SiiDashboardStats, SiiJob, SiiTaskType } from '@/lib/sii-rpa/types'

export const dynamic = 'force-dynamic'

// Map bot portal/name to SII task types
const BOT_TASK_MAP: Record<string, SiiTaskType> = {
  'clasificador': 'login_test',
  'interno': 'login_test',
  'banco': 'libro_compras',
  'sii': 'f29_submit',
}

function inferTaskType(botPortal?: string, botNombre?: string): SiiTaskType {
  if (botPortal && BOT_TASK_MAP[botPortal]) return BOT_TASK_MAP[botPortal]
  if (botNombre?.toLowerCase().includes('f29')) return 'f29_submit'
  if (botNombre?.toLowerCase().includes('concilia')) return 'libro_compras'
  if (botNombre?.toLowerCase().includes('clasifica')) return 'login_test'
  return 'login_test'
}

export default async function SiiPage() {
  const [rawStats, rawJobs, clientes, scheduledTasks, bots] = await Promise.all([
    getSiiStats(),
    getJobsRecientes(),
    getClientesConCredenciales(),
    getScheduledTasks(),
    getBotDefiniciones(),
  ])

  const botMap = new Map(bots.map((b: any) => [b._id, b]))

  // Map SIIJobStats to SiiDashboardStats
  const stats: SiiDashboardStats = {
    total_clientes_con_credenciales: clientes.length,
    jobs_hoy: rawStats.total,
    jobs_exitosos_hoy: rawStats.completados,
    jobs_fallidos_hoy: rawStats.fallidos,
    jobs_pendientes: rawStats.ejecutando,
  }

  // Map SIIJob[] to SiiJob[]
  const jobsRecientes: SiiJob[] = rawJobs.map((j) => {
    const bot = botMap.get(j.bot_id)
    return {
      id: j._id,
      cliente_id: j.cliente_id || '',
      task_type: inferTaskType(bot?.portal, bot?.nombre),
      parametros: {},
      status: (j.status as SiiJob['status']) || 'pendiente',
      archivos_descargados: [],
      screenshots: [],
      retry_count: 0,
      max_retries: 3,
      created_at: j.created_at || new Date().toISOString(),
      updated_at: j.created_at || new Date().toISOString(),
      started_at: j.started_at,
      completed_at: j.completed_at,
      error_message: j.error_message,
    }
  })

  return (
    <>
      <TopNav
        title="SII RPA"
        subtitle="Automatización del Portal SII"
      />

      <Suspense fallback={<div className="p-6">Cargando...</div>}>
        <SiiDashboardContent
          stats={stats}
          jobsRecientes={jobsRecientes}
          clientes={clientes}
          scheduledTasks={scheduledTasks}
        />
      </Suspense>
    </>
  )
}
