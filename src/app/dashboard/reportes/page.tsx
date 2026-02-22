import { Suspense } from 'react'
import { TopNav } from '@/components/dashboard'
import { INTELIGENCIA_TABS } from '@/lib/module-tabs'
import { ReportesContent } from './reportes-content'
import {
  getMetricasGenerales,
  getReportesDisponibles,
  getDatosEvolucion,
  getProductividadContadores,
} from './actions'

export default async function ReportesPage() {
  const [metricas, reportes, datosEvolucion, productividad] = await Promise.all([
    getMetricasGenerales(),
    getReportesDisponibles(),
    getDatosEvolucion(6),
    getProductividadContadores(),
  ])

  return (
    <>
      <TopNav
        title="Reportes"
        subtitle="Análisis y métricas del sistema"
        tabs={INTELIGENCIA_TABS}
      />

      <Suspense fallback={<div className="p-6">Cargando...</div>}>
        <ReportesContent
          metricas={metricas}
          reportes={reportes}
          datosEvolucion={datosEvolucion}
          productividad={productividad}
        />
      </Suspense>
    </>
  )
}
