import Link from 'next/link'
import { BentoCard } from './BentoCard'
import { Brain, FileSpreadsheet, Bot, MessageSquare, FileText } from 'lucide-react'
import type { ModuloStatus } from '@/app/dashboard/actions'

const iconMap: Record<string, any> = {
  'HV-Class': Brain,
  'HV-F29': FileSpreadsheet,
  'HV-Bot': Bot,
  'HV-Chat': MessageSquare,
}

const hrefMap: Record<string, string> = {
  'HV-Class': '/dashboard/clasificador',
  'HV-F29': '/dashboard/f29',
  'HV-Bot': '/dashboard/bots',
  'HV-Chat': '/dashboard/chat',
}

interface ModulesGridProps {
  modulos: ModuloStatus[]
}

export function ModulesGrid({ modulos }: ModulesGridProps) {
  return (
    <BentoCard noPadding>
      <div className="px-5 pt-5 pb-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Módulos del Sistema
        </p>
      </div>
      <div className="grid grid-cols-2 gap-px bg-border/30 border-t border-border/30">
        {modulos.map((mod) => {
          const Icon = iconMap[mod.nombre] || FileText
          const href = hrefMap[mod.nombre] || '/dashboard'
          return (
            <Link
              key={mod.nombre}
              href={href}
              className="flex items-center gap-3 p-4 bg-card/50 hover:bg-muted/30 transition-colors"
            >
              <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium truncate">{mod.nombre}</p>
                  <span className="h-1.5 w-1.5 rounded-full bg-success shrink-0" />
                </div>
                <p className="text-xs text-muted-foreground truncate">{mod.metrica}</p>
              </div>
            </Link>
          )
        })}
      </div>
    </BentoCard>
  )
}
