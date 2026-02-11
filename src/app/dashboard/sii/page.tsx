import { Suspense } from 'react'
import { TopNav } from '@/components/dashboard'
import { SiiDashboardContent } from './components/sii-dashboard'
import { getSiiStats, getJobsRecientes, getClientesConCredenciales, getScheduledTasks } from './actions'
import type { SiiDashboardStats, SiiJob } from '@/lib/sii-rpa/types'

export const dynamic = 'force-dynamic'

export default async function SiiPage() {
  const [rawStats, rawJobs, clientes, scheduledTasks] = await Promise.all([
    getSiiStats(),
    getJobsRecientes(),
    getClientesConCredenciales(),
    getScheduledTasks(),
  ])

  // Map SIIJobStats to SiiDashboardStats
  const stats: SiiDashboardStats = {
    total_clientes_con_credenciales: clientes.length,
    jobs_hoy: rawStats.total,
    jobs_exitosos_hoy: rawStats.completados,
    jobs_fallidos_hoy: rawStats.fallidos,
    jobs_pendientes: rawStats.ejecutando,
  }

  // Map SIIJob[] to SiiJob[]
  const jobsRecientes: SiiJob[] = rawJobs.map((j) => ({
    id: j._id,
    cliente_id: j.cliente_id || '',
    task_type: 'login_test' as const,
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
  }))

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
