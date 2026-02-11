// @ts-nocheck — temporary: types need update after Convex migration
import { Suspense } from 'react'
import { TopNav } from '@/components/dashboard'
import { SiiDashboardContent } from './components/sii-dashboard'
import { getSiiStats, getJobsRecientes, getClientesConCredenciales, getScheduledTasks } from './actions'

export const dynamic = 'force-dynamic'

export default async function SiiPage() {
  const [stats, jobsRecientes, clientes, scheduledTasks] = await Promise.all([
    getSiiStats(),
    getJobsRecientes(15),
    getClientesConCredenciales(),
    getScheduledTasks(),
  ])

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
