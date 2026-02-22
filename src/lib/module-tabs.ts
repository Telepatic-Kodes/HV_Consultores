import type { TopNavTab } from '@/components/dashboard/TopNav'

export const DOCUMENTOS_TABS: TopNavTab[] = [
  { label: 'Documentos', href: '/dashboard/documentos' },
  { label: 'Clasificador IA', href: '/dashboard/clasificador' },
]

export const TRIBUTARIO_TABS: TopNavTab[] = [
  { label: 'F29', href: '/dashboard/f29' },
  { label: 'Procesos', href: '/dashboard/procesos' },
  { label: 'Pipeline', href: '/dashboard/pipeline' },
  { label: 'Bots RPA', href: '/dashboard/bots' },
  { label: 'SII RPA', href: '/dashboard/sii' },
]

export const BANCOS_TABS: TopNavTab[] = [
  { label: 'Cartolas', href: '/dashboard/bancos' },
  { label: 'Conciliación', href: '/dashboard/conciliacion' },
  { label: 'Parametrización', href: '/dashboard/parametrizacion' },
  { label: 'Monedas', href: '/dashboard/monedas' },
]

export const INTELIGENCIA_TABS: TopNavTab[] = [
  { label: 'Inteligencia', href: '/dashboard/inteligencia' },
  { label: 'Chat IA', href: '/dashboard/chat' },
  { label: 'Alertas', href: '/dashboard/alertas' },
  { label: 'Analítica', href: '/dashboard/analytics' },
  { label: 'Reportes', href: '/dashboard/reportes' },
]
