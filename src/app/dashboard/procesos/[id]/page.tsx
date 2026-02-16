import { Suspense } from 'react'
import { TopNav } from '@/components/dashboard'
import { getProcesoConTareas, getCliente } from './actions'
import { ProcesoDetailContent } from './proceso-detail'
import { redirect } from 'next/navigation'

interface Props {
  params: Promise<{ id: string }>
}

export default async function ProcesoDetailPage({ params }: Props) {
  const { id } = await params
  const procesoData = await getProcesoConTareas(id)

  if (!procesoData) {
    redirect('/dashboard/procesos')
  }

  const cliente = await getCliente(procesoData.cliente_id)
  const clienteNombre = cliente?.razon_social ?? 'Cliente'

  return (
    <>
      <TopNav
        title={procesoData.nombre}
        subtitle={`${clienteNombre} · ${procesoData.periodo || procesoData.tipo}`}
      />

      <Suspense fallback={<div className="p-6">Cargando...</div>}>
        <ProcesoDetailContent
          proceso={procesoData}
          clienteNombre={clienteNombre}
        />
      </Suspense>
    </>
  )
}
