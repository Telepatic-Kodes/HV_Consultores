import { Suspense } from 'react'
import { TopNav } from '@/components/dashboard'
import { BotsContent } from './bots-content'
import { getBots, getBotStats, getJobsRecientes, getClientesParaBot } from './actions'

export default async function BotsPage() {
  const [bots, stats, jobsRecientes, clientes] = await Promise.all([
    getBots(),
    getBotStats(),
    getJobsRecientes(15),
    getClientesParaBot(),
  ])

  return (
    <>
      <TopNav
        title="HV-Bot"
        subtitle="RPA para portales gubernamentales"
      />

      <Suspense fallback={<div className="p-6">Cargando...</div>}>
        <BotsContent
          bots={bots}
          stats={stats}
          jobsRecientes={jobsRecientes}
          clientes={clientes}
        />
      </Suspense>
    </>
  )
}
