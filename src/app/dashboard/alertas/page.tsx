'use client'

import { TopNav } from '@/components/dashboard'
import { INTELIGENCIA_TABS } from '@/lib/module-tabs'
import { AlertsCenter } from '@/components/alertas'

export default function AlertasPage() {
  return (
    <>
      <TopNav title="Centro de Alertas" subtitle="Monitorea anomalías, duplicados y transacciones inusuales" tabs={INTELIGENCIA_TABS} />
      <main className="p-4 md:p-6 lg:p-8 space-y-6">
        <AlertsCenter />
      </main>
    </>
  )
}
