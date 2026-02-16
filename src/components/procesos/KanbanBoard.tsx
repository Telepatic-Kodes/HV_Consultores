'use client'

import { useState, useCallback } from 'react'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { KanbanColumn } from './KanbanColumn'
import { KanbanTaskCard, type TareaItem } from './KanbanTaskCard'

interface KanbanBoardProps {
  tareas: TareaItem[]
  onMoverTarea: (tareaId: string, nuevoEstado: string, nuevoOrden: number) => Promise<void>
  onTaskClick: (tarea: TareaItem) => void
}

const columns = [
  { id: 'pendiente', title: 'Pendiente', color: 'gray' },
  { id: 'en_progreso', title: 'En Progreso', color: 'blue' },
  { id: 'en_revision', title: 'En Revisión', color: 'amber' },
  { id: 'completada', title: 'Completada', color: 'green' },
] as const

export function KanbanBoard({ tareas: initialTareas, onMoverTarea, onTaskClick }: KanbanBoardProps) {
  const [tareas, setTareas] = useState<TareaItem[]>(initialTareas)
  const [activeTask, setActiveTask] = useState<TareaItem | null>(null)

  // Update local state when props change
  if (initialTareas !== tareas && initialTareas.length !== tareas.length) {
    setTareas(initialTareas)
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const getColumnTareas = useCallback((estado: string) => {
    return tareas
      .filter((t) => t.estado === estado)
      .sort((a, b) => a.orden - b.orden)
  }, [tareas])

  const handleDragStart = (event: DragStartEvent) => {
    const task = tareas.find((t) => t._id === event.active.id)
    setActiveTask(task || null)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveTask(null)
    const { active, over } = event
    if (!over) return

    const taskId = active.id as string
    const task = tareas.find((t) => t._id === taskId)
    if (!task) return

    // Determine target column: over could be a column id or another task id
    let targetColumn: string
    const overTask = tareas.find((t) => t._id === over.id)
    if (overTask) {
      targetColumn = overTask.estado
    } else {
      // It's a column id
      targetColumn = over.id as string
    }

    // Skip if no change
    if (task.estado === targetColumn && !overTask) return

    // Calculate new order
    const targetTareas = tareas
      .filter((t) => t.estado === targetColumn && t._id !== taskId)
      .sort((a, b) => a.orden - b.orden)

    let newOrden: number
    if (overTask && overTask._id !== taskId) {
      const overIndex = targetTareas.findIndex((t) => t._id === overTask._id)
      if (overIndex === 0) {
        newOrden = overTask.orden - 500
      } else if (overIndex >= 0) {
        newOrden = (targetTareas[overIndex - 1].orden + overTask.orden) / 2
      } else {
        newOrden = targetTareas.length > 0 ? targetTareas[targetTareas.length - 1].orden + 1000 : 0
      }
    } else {
      newOrden = targetTareas.length > 0 ? targetTareas[targetTareas.length - 1].orden + 1000 : 0
    }

    // Optimistic update
    setTareas((prev) =>
      prev.map((t) =>
        t._id === taskId ? { ...t, estado: targetColumn, orden: newOrden } : t
      )
    )

    // Persist
    await onMoverTarea(taskId, targetColumn, newOrden)
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4 pt-1">
        {columns.map((col) => (
          <KanbanColumn
            key={col.id}
            id={col.id}
            title={col.title}
            color={col.color}
            tareas={getColumnTareas(col.id)}
            onTaskClick={onTaskClick}
          />
        ))}
      </div>

      <DragOverlay>
        {activeTask && (
          <div className="rotate-2 opacity-90">
            <KanbanTaskCard tarea={activeTask} onClick={() => {}} />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}
