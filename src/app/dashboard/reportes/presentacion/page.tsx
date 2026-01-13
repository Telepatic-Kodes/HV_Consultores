import { Suspense } from 'react'
import { PresentacionContent } from './presentacion-content'
import { getExecutiveDashboardData } from '../ejecutivo/actions'
import { getClientesParaReportes } from '../actions'

export const metadata = {
  title: 'Presentación Board | HV Consultores',
  description: 'Sistema de presentación ejecutiva para directorio',
}

export default async function PresentacionPage() {
  const [dashboardData, clientes] = await Promise.all([
    getExecutiveDashboardData(),
    getClientesParaReportes(),
  ])

  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-4">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-sm text-muted-foreground">Cargando presentación...</p>
          </div>
        </div>
      }
    >
      <PresentacionContent initialData={dashboardData} clientes={clientes} />
    </Suspense>
  )
}
