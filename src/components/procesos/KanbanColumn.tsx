'use client'

import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { KanbanTaskCard, type TareaItem } from './KanbanTaskCard'

interface KanbanColumnProps {
  id: string
  title: string
  color: string
  tareas: TareaItem[]
  onTaskClick: (tarea: TareaItem) => void
}

const colorMap: Record<string, string> = {
  gray: 'bg-slate-100 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700',
  blue: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
  amber: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800',
  green: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
}

const dotColorMap: Record<string, string> = {
  gray: 'bg-slate-400',
  blue: 'bg-blue-500',
  amber: 'bg-amber-500',
  green: 'bg-green-500',
}

export function KanbanColumn({ id, title, color, tareas, onTaskClick }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id })

  return (
    <div className="flex flex-col min-w-[280px] max-w-[320px] shrink-0">
      {/* Column header */}
      <div className={`flex items-center gap-2 rounded-t-lg px-3 py-2 border ${colorMap[color] || colorMap.gray}`}>
        <div className={`h-2.5 w-2.5 rounded-full ${dotColorMap[color] || dotColorMap.gray}`} />
        <span className="text-sm font-semibold">{title}</span>
        <span className="ml-auto text-xs text-muted-foreground font-mono bg-white/60 dark:bg-black/20 px-1.5 py-0.5 rounded">
          {tareas.length}
        </span>
      </div>

      {/* Column body */}
      <div
        ref={setNodeRef}
        className={`flex-1 rounded-b-lg border border-t-0 p-2 space-y-2 min-h-[200px] transition-colors ${
          isOver ? 'bg-primary/5 border-primary/30' : 'bg-muted/30 border-border'
        }`}
      >
        <SortableContext items={tareas.map((t) => t._id)} strategy={verticalListSortingStrategy}>
          {tareas.map((tarea) => (
            <KanbanTaskCard key={tarea._id} tarea={tarea} onClick={onTaskClick} />
          ))}
        </SortableContext>

        {tareas.length === 0 && (
          <div className="flex items-center justify-center h-24 text-xs text-muted-foreground">
            Arrastra tareas aquí
          </div>
        )}
      </div>
    </div>
  )
}
