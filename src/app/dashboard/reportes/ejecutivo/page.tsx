import { Suspense } from 'react'
import { EjecutivoContent } from './ejecutivo-content'
import { getExecutiveDashboardData } from './actions'
import { getClientesParaReportes } from '../actions'

export const metadata = {
  title: 'Dashboard Ejecutivo | HV Consultores',
  description: 'Vista ejecutiva con métricas clave, KPIs y análisis profesional',
}

export default async function EjecutivoPage() {
  // Cargar datos iniciales del dashboard
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
            <p className="text-sm text-muted-foreground">Cargando dashboard ejecutivo...</p>
          </div>
        </div>
      }
    >
      <EjecutivoContent initialData={dashboardData} clientes={clientes} />
    </Suspense>
  )
}
