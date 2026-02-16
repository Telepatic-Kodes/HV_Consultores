import Link from 'next/link'
import { BentoCard } from './BentoCard'
import { Brain, FileSpreadsheet, Bot, MessageSquare } from 'lucide-react'

const actions = [
  { label: 'Clasificar', icon: Brain, href: '/dashboard/clasificador' },
  { label: 'Generar F29', icon: FileSpreadsheet, href: '/dashboard/f29' },
  { label: 'Ejecutar Bot', icon: Bot, href: '/dashboard/bots' },
  { label: 'Chat IA', icon: MessageSquare, href: '/dashboard/chat' },
]

export function QuickActions() {
  return (
    <BentoCard className="flex flex-col h-full" noPadding>
      <div className="px-5 pt-5 pb-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Acciones Rápidas
        </p>
      </div>
      <div className="flex-1 flex flex-col px-3 pb-3">
        {actions.map((action) => (
          <Link
            key={action.label}
            href={action.href}
            className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-muted/40 transition-colors"
          >
            <action.icon className="h-4 w-4 text-muted-foreground" />
            {action.label}
          </Link>
        ))}
      </div>
    </BentoCard>
  )
}
