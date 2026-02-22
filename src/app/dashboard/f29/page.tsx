import { Suspense } from 'react'
import { TopNav } from '@/components/dashboard'
import { TRIBUTARIO_TABS } from '@/lib/module-tabs'
import { F29Content } from './f29-content'
import { getF29List, getF29Stats, getClientesConDocumentos, getPeriodosDisponibles } from './actions'

export default async function F29Page({
  searchParams,
}: {
  searchParams: { periodo?: string }
}) {
  const periodos = await getPeriodosDisponibles()
  const periodoActual = searchParams.periodo || periodos[0] || '2026-01'

  const [f29List, stats, clientes] = await Promise.all([
    getF29List(periodoActual),
    getF29Stats(periodoActual),
    getClientesConDocumentos(),
  ])

  return (
    <>
      <TopNav
        title="HV-F29"
        subtitle="Automatización de formularios F29"
        tabs={TRIBUTARIO_TABS}
      />

      <Suspense fallback={<div className="p-6">Cargando...</div>}>
        <F29Content
          f29List={f29List}
          stats={stats}
          clientes={clientes}
          periodos={periodos}
          periodoActual={periodoActual}
        />
      </Suspense>
    </>
  )
}
