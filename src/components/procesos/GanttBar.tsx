'use client'

import { differenceInDays } from 'date-fns'
import type { TareaItem } from './KanbanTaskCard'

interface GanttBarProps {
  tarea: TareaItem
  viewStart: Date
  dayWidth: number
  onClick: (tarea: TareaItem) => void
}

const prioridadColors: Record<string, string> = {
  urgente: 'bg-red-500/80 hover:bg-red-500',
  alta: 'bg-amber-500/80 hover:bg-amber-500',
  media: 'bg-blue-500/80 hover:bg-blue-500',
  baja: 'bg-slate-400/80 hover:bg-slate-400',
}

const estadoPatterns: Record<string, string> = {
  completada: 'opacity-60',
  bloqueada: 'opacity-40 bg-stripes',
}

export function GanttBar({ tarea, viewStart, dayWidth, onClick }: GanttBarProps) {
  if (!tarea.fecha_inicio && !tarea.fecha_limite) return null

  const start = tarea.fecha_inicio ? new Date(tarea.fecha_inicio) : new Date(tarea.fecha_limite!)
  const end = tarea.fecha_limite ? new Date(tarea.fecha_limite) : new Date(tarea.fecha_inicio!)

  const offsetDays = differenceInDays(start, viewStart)
  const durationDays = Math.max(differenceInDays(end, start), 1)

  const left = offsetDays * dayWidth
  const width = durationDays * dayWidth

  const colorClass = prioridadColors[tarea.prioridad] || prioridadColors.media
  const estadoClass = estadoPatterns[tarea.estado] || ''
  const isOverdue = tarea.fecha_limite && new Date(tarea.fecha_limite) < new Date() && tarea.estado !== 'completada'

  return (
    <div
      className={`absolute top-1 h-6 rounded cursor-pointer transition-all group ${colorClass} ${estadoClass} ${isOverdue ? 'ring-1 ring-red-600' : ''}`}
      style={{ left: `${left}px`, width: `${Math.max(width, dayWidth)}px` }}
      onClick={() => onClick(tarea)}
      title={`${tarea.titulo}\n${tarea.fecha_inicio || ''} → ${tarea.fecha_limite || ''}`}
    >
      <span className="text-[9px] text-white font-medium px-1.5 truncate block leading-6">
        {tarea.titulo}
      </span>

      {/* Tooltip on hover */}
      <div className="absolute bottom-full left-0 mb-1 hidden group-hover:block z-20 pointer-events-none">
        <div className="bg-popover text-popover-foreground rounded-md shadow-lg border p-2 text-xs whitespace-nowrap">
          <p className="font-semibold">{tarea.titulo}</p>
          <p className="text-muted-foreground">
            {tarea.fecha_inicio || '—'} → {tarea.fecha_limite || '—'}
          </p>
          <p className="text-muted-foreground capitalize">{tarea.prioridad} · {tarea.estado.replace('_', ' ')}</p>
        </div>
      </div>
    </div>
  )
}
