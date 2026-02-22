import { Suspense } from 'react'
import { TopNav } from '@/components/dashboard'
import { DOCUMENTOS_TABS } from '@/lib/module-tabs'
import { ClasificadorContent } from './clasificador-content'
import { getDocumentosPendientes, getClasificadorStats, getClientes, getCuentasContables } from './actions'

export default async function ClasificadorPage({
  searchParams,
}: {
  searchParams: { cliente?: string }
}) {
  const clienteId = searchParams.cliente

  // Fetch data en paralelo
  const [documentos, stats, clientes] = await Promise.all([
    getDocumentosPendientes(clienteId),
    getClasificadorStats(clienteId),
    getClientes(),
  ])

  // Obtener cuentas si hay cliente seleccionado
  const cuentas = clienteId ? await getCuentasContables(clienteId) : []

  return (
    <>
      <TopNav
        title="HV-Class"
        subtitle="Clasificación inteligente de documentos tributarios"
        tabs={DOCUMENTOS_TABS}
      />

      <Suspense fallback={<div className="p-6">Cargando...</div>}>
        <ClasificadorContent
          documentos={documentos}
          stats={stats}
          clientes={clientes}
          cuentas={cuentas}
          clienteIdActual={clienteId}
        />
      </Suspense>
    </>
  )
}
