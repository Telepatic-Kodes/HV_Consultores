import {
  TopNav,
  HeroCard,
  CommandCenter,
} from '@/components/dashboard'
import {
  getDashboardStats,
  getKPIs,
} from './actions'

export default async function DashboardPage() {
  const [stats, kpis] = await Promise.all([
    getDashboardStats(),
    getKPIs(),
  ])

  return (
    <>
      <TopNav title="Centro de Comando" />

      <main className="p-4 md:p-6 lg:p-8 space-y-6">
        <HeroCard resumen={stats.resumen} isEmpty={kpis.clientesActivos === 0} />
        <CommandCenter kpis={kpis} />
      </main>
    </>
  )
}
