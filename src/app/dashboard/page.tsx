import { Suspense } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import {
  TopNav,
  StatsCard,
  StatsGridSkeleton,
  KPICard,
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  FileText,
  CheckCircle,
  Clock,
  AlertTriangle,
  Bot,
  Brain,
  FileSpreadsheet,
  MessageSquare,
  Users,
  TrendingUp,
  Zap,
  ArrowLeftRight,
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

const iconMap = {
  'HV-Class': Brain,
  'HV-F29': FileSpreadsheet,
  'HV-Bot': Bot,
  'HV-Chat': MessageSquare,
}

const activityIconMap = {
  classification: Brain,
  f29: FileSpreadsheet,
  bot: Bot,
  alert: AlertTriangle,
  chat: MessageSquare,
}

// Skeleton para gráficos - Executive Style
function ChartSkeleton() {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="h-4 bg-gradient-to-r from-muted to-muted/50 rounded w-1/3 animate-pulse" />
        <div className="h-3 bg-gradient-to-r from-muted to-muted/50 rounded w-1/2 animate-pulse mt-1.5" />
      </CardHeader>
      <CardContent>
        <div className="h-[200px] bg-gradient-to-br from-muted/30 to-muted/10 rounded-lg animate-pulse" />
      </CardContent>
    </Card>
  )
}

export default async function DashboardPage() {
  // Cargar todos los datos en paralelo
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

  const statsCards = [
    {
      title: 'Documentos Hoy',
      value: stats.documentosHoy,
      description: 'Recibidos para clasificación',
      icon: FileText,
      trend: stats.documentosTendencia !== 0 ? { value: stats.documentosTendencia, label: 'vs. ayer' } : undefined,
    },
    {
      title: 'Clasificados',
      value: stats.clasificadosHoy,
      description: `${stats.precisionML}% de precisión`,
      icon: CheckCircle,
    },
    {
      title: 'Pendientes',
      value: stats.pendientesClasificar,
      description: 'Requieren revisión',
      icon: Clock,
    },
    {
      title: 'Alertas',
      value: stats.alertasF29,
      description: 'Validaciones F29',
      icon: AlertTriangle,
    },
  ]

  return (
    <>
      <TopNav
        title="Dashboard"
        subtitle={`Bienvenido de vuelta • ${new Date().toLocaleDateString('es-CL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`}
      />

      <main className="p-4 md:p-8 space-y-6 md:space-y-8">
        {/* Section Header - KPIs */}
        <div className="flex items-center gap-3 mb-2">
          <div className="h-1 w-8 bg-gradient-to-r from-primary to-secondary rounded-full" />
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Metricas Clave
          </span>
        </div>

        {/* KPIs principales */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
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
          <KPICard
            title="Precisión IA"
            value={`${kpis.precisionIA}%`}
            description="Clasificación automática"
            icon={<TrendingUp className="h-5 w-5" />}
            color="violet"
          />
          <KPICard
            title="Consultas Chat"
            value={kpis.chatConsultasMes}
            description="Este mes"
            icon={<MessageSquare className="h-5 w-5" />}
            color="blue"
          />
          <KPICard
            title="Bots Ejecutados"
            value={kpis.botsEjecutadosMes}
            description="Tareas automatizadas"
            icon={<Zap className="h-5 w-5" />}
            color="green"
          />
          <KPICard
            title="Por Conciliar"
            value={kpis.porConciliar ?? 0}
            description="Transacciones pendientes"
            icon={<ArrowLeftRight className="h-5 w-5" />}
            color="amber"
          />
          <KPICard
            title="Tasa Conciliación"
            value={`${kpis.tasaConciliacion ?? 0}%`}
            description="Conciliación automática"
            icon={<CheckCircle className="h-5 w-5" />}
            color="green"
          />
        </div>

        {/* Stats del día */}
        <Suspense fallback={<StatsGridSkeleton />}>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {statsCards.map((stat) => (
              <StatsCard key={stat.title} {...stat} />
            ))}
          </div>
        </Suspense>

        {/* Gráficos principales */}
        <div className="grid gap-6 md:grid-cols-2">
          <Suspense fallback={<ChartSkeleton />}>
            <DocumentosPorDiaChart data={documentosPorDia} />
          </Suspense>
          <Suspense fallback={<ChartSkeleton />}>
            <DocumentosPorTipoChart data={documentosPorTipo} />
          </Suspense>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Suspense fallback={<ChartSkeleton />}>
            <F29PorMesChart data={f29PorMes} />
          </Suspense>
          <Suspense fallback={<ChartSkeleton />}>
            <BotsActividadChart data={botsActividad} />
          </Suspense>
        </div>

        {/* Modulos y Actividad */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Modulos Status - ocupa 2 columnas */}
          <div className="lg:col-span-2">
            <Card className="h-full border-border/50 shadow-executive">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Zap className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">Modulos del Sistema</CardTitle>
                      <CardDescription className="text-xs mt-0.5">Estado actual de las herramientas</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-success/10 text-success text-xs font-semibold ring-1 ring-success/20">
                    <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
                    Operativo
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2">
                  {modulos.map((module) => {
                    const Icon = iconMap[module.nombre as keyof typeof iconMap] || FileText
                    const href = module.nombre === 'HV-Class' ? '/dashboard/clasificador'
                      : module.nombre === 'HV-F29' ? '/dashboard/f29'
                      : module.nombre === 'HV-Bot' ? '/dashboard/bots'
                      : '/dashboard/chat'

                    return (
                      <Link key={module.nombre} href={href}>
                        <div className="group flex items-center gap-4 p-4 rounded-lg border border-border/50 bg-card hover:bg-muted/30 hover:border-primary/20 transition-all duration-200 cursor-pointer">
                          <div className={`h-11 w-11 rounded-lg bg-gradient-to-br ${module.color} flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform duration-200`}>
                            <Icon className="h-5 w-5 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className="font-semibold text-sm">{module.nombre}</p>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-success bg-success/10 px-2 py-0.5 rounded-full shrink-0">
                                {module.status}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground truncate mt-0.5">{module.descripcion}</p>
                            <p className="text-xs font-semibold text-primary mt-1.5 font-mono">{module.metrica}</p>
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Actividad Reciente */}
          <Card className="h-full border-border/50 shadow-executive">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-secondary/10 flex items-center justify-center">
                  <Clock className="h-4 w-4 text-secondary" />
                </div>
                <div>
                  <CardTitle className="text-base">Actividad Reciente</CardTitle>
                  <CardDescription className="text-xs mt-0.5">Ultimas acciones del sistema</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {actividad.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center mb-3">
                    <Clock className="h-5 w-5 text-muted-foreground/50" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    No hay actividad reciente
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {actividad.map((activity, index) => {
                    const Icon = activityIconMap[activity.tipo] || FileText
                    return (
                      <div
                        key={activity.id}
                        className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/30 transition-colors"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <div className={`rounded-lg p-2 shrink-0 ${
                          activity.tipo === 'alert'
                            ? 'bg-destructive/10 ring-1 ring-destructive/20'
                            : 'bg-muted ring-1 ring-border/50'
                        }`}>
                          <Icon className={`h-4 w-4 ${
                            activity.tipo === 'alert' ? 'text-destructive' : 'text-muted-foreground'
                          }`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-foreground line-clamp-2 leading-relaxed">{activity.mensaje}</p>
                          <p className="text-[10px] text-muted-foreground mt-1 font-medium uppercase tracking-wide">{activity.tiempo}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Acciones Rapidas */}
        <Card className="border-border/50 shadow-executive">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                  <Zap className="h-4 w-4 text-white" />
                </div>
                <div>
                  <CardTitle className="text-base">Acciones Rapidas</CardTitle>
                  <CardDescription className="text-xs mt-0.5">Accede rapidamente a las tareas mas frecuentes</CardDescription>
                </div>
              </div>
              <div className="h-1 w-16 bg-gradient-to-r from-primary/50 to-secondary/50 rounded-full" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Clasificar Documentos', icon: Brain, href: '/dashboard/clasificador', color: 'from-primary to-primary/80', description: 'IA Clasificacion' },
                { label: 'Generar F29', icon: FileSpreadsheet, href: '/dashboard/f29', color: 'from-success to-success/80', description: 'Declaraciones' },
                { label: 'Ejecutar Bot', icon: Bot, href: '/dashboard/bots', color: 'from-secondary to-secondary/80', description: 'Automatizacion' },
                { label: 'Nueva Consulta', icon: MessageSquare, href: '/dashboard/chat', color: 'from-warning to-warning/80', description: 'Chat IA' },
              ].map((action) => (
                <Link
                  key={action.label}
                  href={action.href}
                  className="group flex flex-col items-center justify-center gap-4 rounded-xl border border-border/50 bg-gradient-to-b from-card to-muted/20 p-6 text-center hover:shadow-executive-md hover:border-primary/20 transition-all duration-300"
                >
                  <div className={`h-14 w-14 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:shadow-xl transition-all duration-300`}>
                    <action.icon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <span className="text-sm font-semibold block">{action.label}</span>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{action.description}</span>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </>
  )
}
