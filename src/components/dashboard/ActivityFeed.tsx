import { BentoCard } from './BentoCard'
import {
  Brain,
  FileSpreadsheet,
  Bot,
  AlertTriangle,
  MessageSquare,
  FileText,
  Clock,
} from 'lucide-react'
import type { ActividadReciente } from '@/app/dashboard/actions'

const dotColorMap: Record<string, string> = {
  classification: 'bg-primary',
  f29: 'bg-success',
  bot: 'bg-violet-600',
  alert: 'bg-destructive',
  chat: 'bg-warning',
}

interface ActivityFeedProps {
  actividad: ActividadReciente[]
}

export function ActivityFeed({ actividad }: ActivityFeedProps) {
  return (
    <BentoCard className="flex flex-col h-full" noPadding>
      <div className="px-5 pt-5 pb-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Actividad Reciente
        </p>
      </div>

      {actividad.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center pb-5 text-center">
          <Clock className="h-5 w-5 text-muted-foreground/40 mb-2" />
          <p className="text-sm text-muted-foreground">Sin actividad reciente</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto px-5 pb-3 space-y-1">
          {actividad.map((item) => {
            const dotColor = dotColorMap[item.tipo] || 'bg-muted-foreground'
            return (
              <div
                key={item.id}
                className="flex items-start gap-3 py-2.5 border-b border-border/30 last:border-0"
              >
                <div className="relative mt-1.5">
                  <div className={`h-2 w-2 rounded-full ${dotColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground line-clamp-1">{item.mensaje}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{item.tiempo}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </BentoCard>
  )
}
