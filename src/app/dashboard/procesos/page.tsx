import { Suspense } from 'react'
import { TopNav } from '@/components/dashboard'
import { ProcesosContent } from './procesos-content'
import { getProcesos, getProcesoStats, getPlantillas, getClientes } from './actions'

export default async function ProcesosPage() {
  const [procesos, stats, plantillas, clientes] = await Promise.all([
    getProcesos(),
    getProcesoStats(),
    getPlantillas(),
    getClientes(),
  ])

  return (
    <>
      <TopNav
        title="Procesos"
        subtitle="Gestión de procesos y tareas contables"
      />

      <Suspense fallback={<div className="p-6">Cargando...</div>}>
        <ProcesosContent
          procesos={procesos}
          stats={stats}
          plantillas={plantillas}
          clientes={clientes}
        />
      </Suspense>
    </>
  )
}
