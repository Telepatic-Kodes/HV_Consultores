'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Badge } from '@/components/ui/badge'
import { Calendar, GripVertical, User } from 'lucide-react'

export interface TareaItem {
  _id: string
  titulo: string
  descripcion?: string
  estado: string
  prioridad: string
  orden: number
  asignado_a?: string
  fecha_inicio?: string
  fecha_limite?: string
  etiquetas?: string[]
  checklist?: { texto: string; completado: boolean }[]
}

interface KanbanTaskCardProps {
  tarea: TareaItem
  onClick: (tarea: TareaItem) => void
}

const prioridadConfig: Record<string, { dot: string; label: string }> = {
  urgente: { dot: 'bg-red-500', label: 'Urgente' },
  alta: { dot: 'bg-amber-500', label: 'Alta' },
  media: { dot: 'bg-blue-500', label: 'Media' },
  baja: { dot: 'bg-slate-400', label: 'Baja' },
}

export function KanbanTaskCard({ tarea, onClick }: KanbanTaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: tarea._id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const prioCfg = prioridadConfig[tarea.prioridad] || prioridadConfig.media
  const isOverdue = tarea.fecha_limite && new Date(tarea.fecha_limite) < new Date() && tarea.estado !== 'completada'
  const isBlocked = tarea.estado === 'bloqueada'
  const checkDone = tarea.checklist?.filter((c) => c.completado).length ?? 0
  const checkTotal = tarea.checklist?.length ?? 0

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group rounded-lg border bg-card p-3 shadow-sm transition-all cursor-pointer
        ${isDragging ? 'opacity-50 shadow-lg ring-2 ring-primary/30' : 'hover:shadow-md'}
        ${isBlocked ? 'ring-1 ring-red-500/40 bg-red-50/5' : ''}
        ${isOverdue ? 'border-destructive/30' : 'border-border'}
      `}
      onClick={() => onClick(tarea)}
    >
      <div className="flex items-start gap-2">
        <button
          className="mt-0.5 opacity-0 group-hover:opacity-60 cursor-grab active:cursor-grabbing shrink-0"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <div className={`h-2 w-2 rounded-full shrink-0 ${prioCfg.dot}`} />
            <span className="text-sm font-medium truncate">{tarea.titulo}</span>
          </div>

          {/* Tags */}
          {tarea.etiquetas && tarea.etiquetas.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {tarea.etiquetas.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="secondary" className="text-[9px] px-1.5 py-0">
                  {tag}
                </Badge>
              ))}
              {tarea.etiquetas.length > 3 && (
                <span className="text-[9px] text-muted-foreground">+{tarea.etiquetas.length - 3}</span>
              )}
            </div>
          )}

          {/* Bottom row: assignee, checklist, date */}
          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
            <div className="flex items-center gap-2">
              {tarea.asignado_a && (
                <div className="flex items-center gap-0.5">
                  <User className="h-3 w-3" />
                </div>
              )}
              {checkTotal > 0 && (
                <span className={checkDone === checkTotal ? 'text-green-600' : ''}>
                  {checkDone}/{checkTotal}
                </span>
              )}
            </div>
            {tarea.fecha_limite && (
              <div className={`flex items-center gap-0.5 ${isOverdue ? 'text-destructive font-medium' : ''}`}>
                <Calendar className="h-3 w-3" />
                {tarea.fecha_limite}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
