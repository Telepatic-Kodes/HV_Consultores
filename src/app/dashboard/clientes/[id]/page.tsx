import { Suspense } from 'react'
import { TopNav } from '@/components/dashboard'
import { getClienteOverview } from './actions'
import { ClienteDetailContent } from './cliente-detail-content'

interface Props {
  params: Promise<{ id: string }>
}

export default async function ClienteDetailPage({ params }: Props) {
  const { id } = await params
  const overview = await getClienteOverview(id)

  const title = overview.cliente?.razon_social ?? 'Cliente'
  const subtitle = overview.cliente?.rut ?? ''

  return (
    <>
      <TopNav title={title} subtitle={subtitle} />

      <Suspense fallback={<div className="p-6">Cargando...</div>}>
        <ClienteDetailContent overview={overview} clienteId={id} />
      </Suspense>
    </>
  )
}
