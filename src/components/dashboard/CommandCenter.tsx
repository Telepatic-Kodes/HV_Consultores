import Link from 'next/link'
import {
  Upload,
  FileSpreadsheet,
  Bot,
  CreditCard,
  TrendingUp,
  Users,
  ArrowRight,
} from 'lucide-react'
import type { KPIsDashboard } from '@/app/dashboard/actions'

interface Section {
  label: string
  description: string
  icon: typeof Upload
  href: string
  gradient: string
  tint: string
  kpiLabel: string
  kpiValue: string | number
}

function buildSections(kpis: KPIsDashboard): Section[] {
  return [
    {
      label: 'Documentos',
      description: 'Clasificación IA de documentos tributarios',
      icon: Upload,
      href: '/dashboard/documentos',
      gradient: 'from-blue-500 to-blue-600',
      tint: 'bg-blue-500/5 hover:bg-blue-500/10',
      kpiLabel: 'docs este mes',
      kpiValue: kpis.documentosMes,
    },
    {
      label: 'Tributario',
      description: 'F29, procesos y pipeline automatizado',
      icon: FileSpreadsheet,
      href: '/dashboard/f29',
      gradient: 'from-emerald-500 to-emerald-600',
      tint: 'bg-emerald-500/5 hover:bg-emerald-500/10',
      kpiLabel: 'F29 pendientes',
      kpiValue: kpis.f29Pendientes,
    },
    {
      label: 'Automatización',
      description: 'Bots RPA para SII y portales',
      icon: Bot,
      href: '/dashboard/bots',
      gradient: 'from-violet-500 to-violet-600',
      tint: 'bg-violet-500/5 hover:bg-violet-500/10',
      kpiLabel: 'bots ejecutados',
      kpiValue: kpis.botsEjecutadosMes,
    },
    {
      label: 'Bancos',
      description: 'Cartolas, conciliación y monedas',
      icon: CreditCard,
      href: '/dashboard/bancos',
      gradient: 'from-teal-500 to-teal-600',
      tint: 'bg-teal-500/5 hover:bg-teal-500/10',
      kpiLabel: 'conciliación',
      kpiValue: `${kpis.tasaConciliacion}%`,
    },
    {
      label: 'Inteligencia',
      description: 'Chat IA, alertas y reportes',
      icon: TrendingUp,
      href: '/dashboard/chat',
      gradient: 'from-amber-500 to-amber-600',
      tint: 'bg-amber-500/5 hover:bg-amber-500/10',
      kpiLabel: 'consultas este mes',
      kpiValue: kpis.chatConsultasMes,
    },
    {
      label: 'Clientes',
      description: 'Gestión de empresas y onboarding',
      icon: Users,
      href: '/dashboard/clientes',
      gradient: 'from-sky-500 to-sky-600',
      tint: 'bg-sky-500/5 hover:bg-sky-500/10',
      kpiLabel: 'clientes activos',
      kpiValue: kpis.clientesActivos,
    },
  ]
}

interface CommandCenterProps {
  kpis: KPIsDashboard
}

export function CommandCenter({ kpis }: CommandCenterProps) {
  const sections = buildSections(kpis)

  return (
    <div>
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-4">
        Módulos
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sections.map((section) => (
          <Link
            key={section.label}
            href={section.href}
            className={`group relative overflow-hidden rounded-xl border border-border/40 ${section.tint} backdrop-blur-sm hover:border-border/60 hover:shadow-executive-md transition-all duration-300`}
          >
            {/* Gradient accent strip */}
            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${section.gradient}`} />

            {/* Watermark icon */}
            <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity duration-300">
              <section.icon className="h-32 w-32" />
            </div>

            <div className="relative p-5 pt-6">
              <div className="flex items-start justify-between mb-3">
                <div className={`h-11 w-11 rounded-xl bg-gradient-to-br ${section.gradient} flex items-center justify-center shadow-md shadow-black/10`}>
                  <section.icon className="h-5 w-5 text-white" />
                </div>
                <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground opacity-0 translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200">
                  <span>Abrir</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </div>

              <h3 className="text-[15px] font-semibold tracking-tight">{section.label}</h3>
              <p className="text-[13px] text-muted-foreground mt-0.5 leading-relaxed">{section.description}</p>

              <div className="mt-4 pt-3 border-t border-border/30 flex items-baseline gap-2">
                <span className="text-3xl font-bold tracking-tight">{section.kpiValue}</span>
                <span className="text-xs text-muted-foreground font-medium">{section.kpiLabel}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
