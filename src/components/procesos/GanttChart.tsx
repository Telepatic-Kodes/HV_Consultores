'use client'

import { useMemo } from 'react'
import {
  addDays,
  differenceInDays,
  format,
  isWeekend,
  startOfDay,
  isSameDay,
} from 'date-fns'
import { es } from 'date-fns/locale'
import { GanttBar } from './GanttBar'
import type { TareaItem } from './KanbanTaskCard'

interface GanttChartProps {
  tareas: TareaItem[]
  onTaskClick: (tarea: TareaItem) => void
}

const DAY_WIDTH = 40
const LABEL_WIDTH = 200
const ROW_HEIGHT = 32

export function GanttChart({ tareas, onTaskClick }: GanttChartProps) {
  const sortedTareas = useMemo(
    () => [...tareas].sort((a, b) => {
      const aDate = a.fecha_inicio || a.fecha_limite || '9999'
      const bDate = b.fecha_inicio || b.fecha_limite || '9999'
      return aDate.localeCompare(bDate)
    }),
    [tareas]
  )

  // Calculate view bounds
  const { viewStart, viewEnd, totalDays } = useMemo(() => {
    const now = new Date()
    let earliest = now
    let latest = addDays(now, 30)

    for (const t of sortedTareas) {
      if (t.fecha_inicio) {
        const d = new Date(t.fecha_inicio)
        if (d < earliest) earliest = d
      }
      if (t.fecha_limite) {
        const d = new Date(t.fecha_limite)
        if (d > latest) latest = d
      }
    }

    const viewStart = startOfDay(addDays(earliest, -2))
    const viewEnd = startOfDay(addDays(latest, 5))
    const totalDays = differenceInDays(viewEnd, viewStart) + 1

    return { viewStart, viewEnd, totalDays }
  }, [sortedTareas])

  // Generate day columns
  const days = useMemo(() => {
    return Array.from({ length: totalDays }, (_, i) => addDays(viewStart, i))
  }, [viewStart, totalDays])

  // Group days by month for header
  const months = useMemo(() => {
    const groups: { label: string; days: number; start: number }[] = []
    let currentMonth = ''
    let count = 0
    let start = 0

    days.forEach((day, i) => {
      const monthLabel = format(day, 'MMMM yyyy', { locale: es })
      if (monthLabel !== currentMonth) {
        if (currentMonth) {
          groups.push({ label: currentMonth, days: count, start })
        }
        currentMonth = monthLabel
        count = 1
        start = i
      } else {
        count++
      }
    })
    if (currentMonth) {
      groups.push({ label: currentMonth, days: count, start })
    }
    return groups
  }, [days])

  const today = startOfDay(new Date())
  const todayOffset = differenceInDays(today, viewStart)
  const chartWidth = totalDays * DAY_WIDTH

  if (sortedTareas.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <p className="text-sm">No hay tareas con fechas para mostrar en el cronograma</p>
      </div>
    )
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <div className="flex" style={{ minWidth: `${LABEL_WIDTH + chartWidth}px` }}>
          {/* Sticky labels column */}
          <div className="sticky left-0 z-10 bg-background border-r" style={{ width: `${LABEL_WIDTH}px`, minWidth: `${LABEL_WIDTH}px` }}>
            {/* Month header spacer */}
            <div className="h-6 border-b bg-muted/50" />
            {/* Day header spacer */}
            <div className="h-6 border-b bg-muted/30" />
            {/* Task rows */}
            {sortedTareas.map((tarea) => (
              <div
                key={tarea._id}
                className="flex items-center px-3 border-b hover:bg-muted/30 cursor-pointer truncate"
                style={{ height: `${ROW_HEIGHT}px` }}
                onClick={() => onTaskClick(tarea)}
              >
                <div className={`h-2 w-2 rounded-full shrink-0 mr-2 ${
                  tarea.prioridad === 'urgente' ? 'bg-red-500' :
                  tarea.prioridad === 'alta' ? 'bg-amber-500' :
                  tarea.prioridad === 'media' ? 'bg-blue-500' : 'bg-slate-400'
                }`} />
                <span className="text-xs truncate">{tarea.titulo}</span>
              </div>
            ))}
          </div>

          {/* Chart area */}
          <div className="flex-1" style={{ width: `${chartWidth}px` }}>
            {/* Month header */}
            <div className="flex h-6 border-b bg-muted/50">
              {months.map((month) => (
                <div
                  key={`${month.label}-${month.start}`}
                  className="text-[10px] font-semibold text-muted-foreground px-2 border-r flex items-center capitalize"
                  style={{ width: `${month.days * DAY_WIDTH}px` }}
                >
                  {month.label}
                </div>
              ))}
            </div>

            {/* Day header */}
            <div className="flex h-6 border-b bg-muted/30">
              {days.map((day, i) => (
                <div
                  key={i}
                  className={`text-[9px] text-center border-r flex items-center justify-center ${
                    isWeekend(day) ? 'bg-muted/60 text-muted-foreground/50' :
                    isSameDay(day, today) ? 'bg-primary/10 font-bold text-primary' : 'text-muted-foreground'
                  }`}
                  style={{ width: `${DAY_WIDTH}px`, minWidth: `${DAY_WIDTH}px` }}
                >
                  {format(day, 'd')}
                </div>
              ))}
            </div>

            {/* Task bars */}
            <div className="relative">
              {/* Weekend shading & today marker */}
              <div className="absolute inset-0 flex pointer-events-none" style={{ height: `${sortedTareas.length * ROW_HEIGHT}px` }}>
                {days.map((day, i) => (
                  <div
                    key={i}
                    className={`border-r ${isWeekend(day) ? 'bg-muted/30' : ''}`}
                    style={{ width: `${DAY_WIDTH}px`, minWidth: `${DAY_WIDTH}px` }}
                  />
                ))}
              </div>

              {/* Today marker */}
              {todayOffset >= 0 && todayOffset < totalDays && (
                <div
                  className="absolute top-0 w-0.5 bg-red-500 z-10 pointer-events-none"
                  style={{
                    left: `${todayOffset * DAY_WIDTH + DAY_WIDTH / 2}px`,
                    height: `${sortedTareas.length * ROW_HEIGHT}px`,
                  }}
                />
              )}

              {/* Bars */}
              {sortedTareas.map((tarea) => {
                const rowIndex = sortedTareas.indexOf(tarea)
                return (
                  <div
                    key={tarea._id}
                    className="relative border-b"
                    style={{ height: `${ROW_HEIGHT}px` }}
                  >
                    <GanttBar
                      tarea={tarea}
                      viewStart={viewStart}
                      dayWidth={DAY_WIDTH}
                      onClick={onTaskClick}
                    />
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
