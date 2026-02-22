'use client'

import { useEffect, useState } from 'react'
import {
  TopNav,
  HeroCard,
  CommandCenter,
  ClientPicker,
} from '@/components/dashboard'
import { useClientContext } from '@/components/dashboard/ClientContext'
import { getDashboardStats, getKPIs } from './actions'
import type { KPIsDashboard, DashboardStats } from './actions'
import { Loader2 } from 'lucide-react'

export default function DashboardPage() {
  const { activeClientId, activeClient } = useClientContext()
  const [kpis, setKpis] = useState<KPIsDashboard | null>(null)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!activeClientId) {
      setKpis(null)
      setStats(null)
      return
    }

    setLoading(true)
    Promise.all([getKPIs(), getDashboardStats()])
      .then(([k, s]) => {
        setKpis(k)
        setStats(s)
      })
      .finally(() => setLoading(false))
  }, [activeClientId])

  // No client selected → show picker
  if (!activeClientId) {
    return (
      <>
        <TopNav title="Centro de Comando" />
        <main className="p-4 md:p-6 lg:p-8">
          <ClientPicker />
        </main>
      </>
    )
  }

  // Loading KPIs for selected client
  if (loading || !kpis || !stats) {
    return (
      <>
        <TopNav title="Centro de Comando" />
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </>
    )
  }

  // Client active → show command center
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
