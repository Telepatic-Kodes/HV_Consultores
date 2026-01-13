import { Suspense } from 'react'
import { TopNav } from '@/components/dashboard'
import { ClientesContent } from './clientes-content'
import { getClientes, getClienteStats, getContadores } from './actions'

export default async function ClientesPage() {
  const [clientes, stats, contadores] = await Promise.all([
    getClientes(),
    getClienteStats(),
    getContadores(),
  ])

  return (
    <>
      <TopNav
        title="Clientes"
        subtitle="Gestión de clientes y su estado"
      />

      <Suspense fallback={<div className="p-6">Cargando...</div>}>
        <ClientesContent
          clientes={clientes}
          stats={stats}
          contadores={contadores}
        />
      </Suspense>
    </>
  )
}
