import { Suspense } from 'react'
import dynamic from 'next/dynamic'
import {
  TopNav,
  KPICard,
  HeroCard,
  StatBar,
  ActivityFeed,
  ModulesGrid,
  QuickActions,
} from '@/components/dashboard'

const DocumentosPorDiaChart = dynamic(
  () => import('@/components/dashboard/charts').then(m => m.DocumentosPorDiaChart),
  { ssr: true }
)
const DocumentosPorTipoChart = dynamic(
  () => import('@/components/dashboard/charts').then(m => m.DocumentosPorTipoChart),
  { ssr: true }
)
const F29PorMesChart = dynamic(
  () => import('@/components/dashboard/charts').then(m => m.F29PorMesChart),
  { ssr: true }
)
const BotsActividadChart = dynamic(
  () => import('@/components/dashboard/charts').then(m => m.BotsActividadChart),
  { ssr: true }
)
import {
  FileText,
  Users,
  FileSpreadsheet,
  TrendingUp,
} from 'lucide-react'
import {
  getDashboardStats,
  getModulosStatus,
  getActividadReciente,
  getDocumentosPorDia,
  getDocumentosPorTipo,
  getF29PorMes,
  getBotsActividad,
  getKPIs,
} from './actions'

function BentoSkeleton({ className }: { className?: string }) {
  return (
    <div className={`rounded-xl border border-border/40 bg-card/50 animate-pulse ${className || ''}`}>
      <div className="p-5">
        <div className="h-3 bg-muted rounded w-1/3 mb-3" />
        <div className="h-6 bg-muted rounded w-1/2" />
      </div>
    </div>
  )
}

export default async function DashboardPage() {
  const [
    stats,
    modulos,
    actividad,
    documentosPorDia,
    documentosPorTipo,
    f29PorMes,
    botsActividad,
    kpis,
  ] = await Promise.all([
    getDashboardStats(),
    getModulosStatus(),
    getActividadReciente(5),
    getDocumentosPorDia(),
    getDocumentosPorTipo(),
    getF29PorMes(),
    getBotsActividad(),
    getKPIs(),
  ])

  const secondaryKPIs = [
    { label: 'Consultas Chat', value: kpis.chatConsultasMes },
    { label: 'Bots Ejecutados', value: kpis.botsEjecutadosMes },
    { label: 'Por Conciliar', value: kpis.porConciliar ?? 0 },
    { label: 'Tasa Conciliación', value: `${kpis.tasaConciliacion ?? 0}%` },
  ]

  return (
    <>
      <TopNav title="Dashboard" />

      <main className="p-4 md:p-6 lg:p-8">
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">

          {/* Row 1: Hero + 3 Primary KPIs */}
          <HeroCard resumen={stats.resumen} />
          <KPICard
            title="Clientes Activos"
            value={kpis.clientesActivos}
            description="Empresas gestionadas"
            icon={<Users className="h-5 w-5" />}
            color="blue"
          />
          <KPICard
            title="Docs del Mes"
            value={kpis.documentosMes}
            description="Procesados este mes"
            icon={<FileText className="h-5 w-5" />}
            color="green"
          />
          <KPICard
            title="F29 Pendientes"
            value={kpis.f29Pendientes}
            description="Por enviar al SII"
            icon={<FileSpreadsheet className="h-5 w-5" />}
            color="amber"
          />

          {/* Row 2: Precision IA + Secondary stat bar */}
          <KPICard
            title="Precisión IA"
            value={`${kpis.precisionIA}%`}
            description="Clasificación automática"
            icon={<TrendingUp className="h-5 w-5" />}
            color="violet"
          />
          <div className="md:col-span-1 lg:col-span-3">
            <StatBar items={secondaryKPIs} />
          </div>

          {/* Row 3: Main chart (3 cols) + Activity (1 col, spans 2 rows) */}
          <div className="lg:col-span-3">
            <Suspense fallback={<BentoSkeleton className="h-[280px]" />}>
              <DocumentosPorDiaChart data={documentosPorDia} />
            </Suspense>
          </div>
          <div className="lg:col-span-1 lg:row-span-2">
            <ActivityFeed actividad={actividad} />
          </div>

          {/* Row 4: Two secondary charts (fit in 3 cols since Activity spans) */}
          <div className="lg:col-span-1">
            <Suspense fallback={<BentoSkeleton className="h-[260px]" />}>
              <DocumentosPorTipoChart data={documentosPorTipo} />
            </Suspense>
          </div>
          <div className="lg:col-span-2">
            <Suspense fallback={<BentoSkeleton className="h-[260px]" />}>
              <F29PorMesChart data={f29PorMes} />
            </Suspense>
          </div>

          {/* Row 5: Modules + Bots + Quick Actions */}
          <div className="lg:col-span-2">
            <ModulesGrid modulos={modulos} />
          </div>
          <div className="lg:col-span-1">
            <Suspense fallback={<BentoSkeleton className="h-[240px]" />}>
              <BotsActividadChart data={botsActividad} />
            </Suspense>
          </div>
          <div className="lg:col-span-1">
            <QuickActions />
          </div>
        </div>
      </main>
    </>
  )
}
