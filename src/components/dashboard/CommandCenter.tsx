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
  subtitle: string
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
      label: 'HV-Class',
      subtitle: 'Documentos',
      description: 'Clasifica y organiza documentos tributarios automáticamente',
      icon: Upload,
      href: '/dashboard/documentos',
      gradient: 'from-blue-500 to-blue-600',
      tint: 'bg-blue-500/5 hover:bg-blue-500/10',
      kpiLabel: 'documentos este mes',
      kpiValue: kpis.documentosMes,
    },
    {
      label: 'HV-F29',
      subtitle: 'Tributario',
      description: 'Cálculo, validación y envío del F29 mensual al SII',
      icon: FileSpreadsheet,
      href: '/dashboard/f29',
      gradient: 'from-emerald-500 to-emerald-600',
      tint: 'bg-emerald-500/5 hover:bg-emerald-500/10',
      kpiLabel: 'pendientes de envío',
      kpiValue: kpis.f29Pendientes,
    },
    {
      label: 'HV-Bot',
      subtitle: 'Automatización',
      description: 'Descarga automática de certificados y documentos del SII',
      icon: Bot,
      href: '/dashboard/bots',
      gradient: 'from-violet-500 to-violet-600',
      tint: 'bg-violet-500/5 hover:bg-violet-500/10',
      kpiLabel: 'ejecuciones este mes',
      kpiValue: kpis.botsEjecutadosMes,
    },
    {
      label: 'HV-Bancos',
      subtitle: 'Conciliación',
      description: 'Importa cartolas y concilia transacciones con documentos SII',
      icon: CreditCard,
      href: '/dashboard/bancos',
      gradient: 'from-teal-500 to-teal-600',
      tint: 'bg-teal-500/5 hover:bg-teal-500/10',
      kpiLabel: 'conciliado',
      kpiValue: `${kpis.tasaConciliacion}%`,
    },
    {
      label: 'HV-Chat',
      subtitle: 'Inteligencia',
      description: 'Consulta normativa tributaria y el estado de tus documentos',
      icon: TrendingUp,
      href: '/dashboard/chat',
      gradient: 'from-amber-500 to-amber-600',
      tint: 'bg-amber-500/5 hover:bg-amber-500/10',
      kpiLabel: 'consultas IA',
      kpiValue: kpis.chatConsultasMes,
    },
    {
      label: 'Clientes',
      subtitle: 'Gestión',
      description: 'Registro, configuración y seguimiento de tus empresas',
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

              <div className="flex items-baseline gap-2">
                <h3 className="text-[15px] font-bold tracking-tight">{section.label}</h3>
                <span className="text-[11px] font-medium text-muted-foreground/70 uppercase tracking-wider">{section.subtitle}</span>
              </div>
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
