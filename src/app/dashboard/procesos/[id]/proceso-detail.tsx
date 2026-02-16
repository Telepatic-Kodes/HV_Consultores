'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Calendar,
  Plus,
  LayoutGrid,
  GanttChartSquare,
  List,
  MessageSquare,
  ArrowLeft,
} from 'lucide-react'
import Link from 'next/link'

import { KanbanBoard } from '@/components/procesos/KanbanBoard'
import { GanttChart } from '@/components/procesos/GanttChart'
import { TaskDetailPanel } from '@/components/procesos/TaskDetailPanel'
import { CreateTareaDialog } from '@/components/procesos/CreateTareaDialog'
import type { TareaItem } from '@/components/procesos/KanbanTaskCard'

import {
  moverTarea,
  updateTarea,
  createTarea,
  deleteTarea,
  toggleChecklistItem,
  addComentario,
  getComentarios,
  updateProceso,
} from './actions'

interface ProcesoDetailContentProps {
  proceso: {
    _id: string
    nombre: string
    descripcion?: string
    tipo: string
    estado: string
    periodo?: string
    fecha_inicio?: string
    fecha_limite?: string
    tareas: TareaItem[]
  }
  clienteNombre: string
}

const estadoConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  activo: { label: 'Activo', variant: 'default' },
  pausado: { label: 'Pausado', variant: 'secondary' },
  completado: { label: 'Completado', variant: 'outline' },
  cancelado: { label: 'Cancelado', variant: 'destructive' },
}

const prioridadDot: Record<string, string> = {
  urgente: 'bg-red-500',
  alta: 'bg-amber-500',
  media: 'bg-blue-500',
  baja: 'bg-slate-400',
}

export function ProcesoDetailContent({ proceso, clienteNombre }: ProcesoDetailContentProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [selectedTask, setSelectedTask] = useState<TareaItem | null>(null)
  const [comentarios, setComentarios] = useState<any[]>([])
  const [showCreateTarea, setShowCreateTarea] = useState(false)

  const tareas = proceso.tareas || []
  const completadas = tareas.filter((t) => t.estado === 'completada').length
  const progress = tareas.length > 0 ? Math.round((completadas / tareas.length) * 100) : 0
  const estadoCfg = estadoConfig[proceso.estado] || estadoConfig.activo

  const handleTaskClick = async (tarea: TareaItem) => {
    setSelectedTask(tarea)
    const comments = await getComentarios(tarea._id)
    setComentarios(comments)
  }

  const handleMoverTarea = async (tareaId: string, nuevoEstado: string, nuevoOrden: number) => {
    await moverTarea(tareaId, nuevoEstado, nuevoOrden)
    startTransition(() => router.refresh())
  }

  const handleUpdateTarea = async (id: string, data: Partial<TareaItem>) => {
    await updateTarea(id, data)
    setSelectedTask(null)
    startTransition(() => router.refresh())
  }

  const handleDeleteTarea = async (id: string) => {
    await deleteTarea(id)
    setSelectedTask(null)
    startTransition(() => router.refresh())
  }

  const handleToggleChecklist = async (tareaId: string, index: number) => {
    await toggleChecklistItem(tareaId, index)
    startTransition(() => router.refresh())
  }

  const handleAddComment = async (tareaId: string, contenido: string) => {
    await addComentario(tareaId, contenido)
    const comments = await getComentarios(tareaId)
    setComentarios(comments)
  }

  const handleCreateTarea = async (data: any) => {
    await createTarea(data)
    startTransition(() => router.refresh())
  }

  const handleEstadoChange = async (nuevoEstado: string) => {
    await updateProceso(proceso._id, { estado: nuevoEstado })
    startTransition(() => router.refresh())
  }

  return (
    <div className="p-6 space-y-6">
      {/* Back link + Header */}
      <div className="space-y-4">
        <Link
          href="/dashboard/procesos"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Volver a procesos
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-xl font-bold">{proceso.nombre}</h1>
              <Badge variant={estadoCfg.variant}>{estadoCfg.label}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {clienteNombre}
              {proceso.periodo && ` · ${proceso.periodo}`}
              {proceso.fecha_inicio && ` · Inicio: ${proceso.fecha_inicio}`}
              {proceso.fecha_limite && ` · Límite: ${proceso.fecha_limite}`}
            </p>
            {proceso.descripcion && (
              <p className="text-xs text-muted-foreground mt-1">{proceso.descripcion}</p>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-2xl font-bold font-mono">{progress}%</p>
              <p className="text-[10px] text-muted-foreground">{completadas}/{tareas.length} tareas</p>
            </div>
            <div className="w-24">
              <Progress value={progress} className="h-2" />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Select value={proceso.estado} onValueChange={handleEstadoChange}>
            <SelectTrigger className="w-[150px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="activo">Activo</SelectItem>
              <SelectItem value="pausado">Pausado</SelectItem>
              <SelectItem value="completado">Completado</SelectItem>
              <SelectItem value="cancelado">Cancelado</SelectItem>
            </SelectContent>
          </Select>

          <Button size="sm" onClick={() => setShowCreateTarea(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Nueva Tarea
          </Button>
        </div>
      </div>

      {/* Tabs: Kanban, Cronograma, Lista, Actividad */}
      <Tabs defaultValue="kanban" className="w-full">
        <TabsList>
          <TabsTrigger value="kanban" className="gap-1.5">
            <LayoutGrid className="h-4 w-4" />
            Kanban
          </TabsTrigger>
          <TabsTrigger value="cronograma" className="gap-1.5">
            <GanttChartSquare className="h-4 w-4" />
            Cronograma
          </TabsTrigger>
          <TabsTrigger value="lista" className="gap-1.5">
            <List className="h-4 w-4" />
            Lista
          </TabsTrigger>
          <TabsTrigger value="actividad" className="gap-1.5">
            <MessageSquare className="h-4 w-4" />
            Actividad
          </TabsTrigger>
        </TabsList>

        {/* Kanban Tab */}
        <TabsContent value="kanban" className="mt-4">
          <KanbanBoard
            tareas={tareas}
            onMoverTarea={handleMoverTarea}
            onTaskClick={handleTaskClick}
          />
        </TabsContent>

        {/* Cronograma Tab */}
        <TabsContent value="cronograma" className="mt-4">
          <GanttChart tareas={tareas} onTaskClick={handleTaskClick} />
        </TabsContent>

        {/* Lista Tab */}
        <TabsContent value="lista" className="mt-4">
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8"></TableHead>
                  <TableHead>Tarea</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Prioridad</TableHead>
                  <TableHead>Inicio</TableHead>
                  <TableHead>Límite</TableHead>
                  <TableHead>Etiquetas</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tareas.sort((a, b) => a.orden - b.orden).map((tarea) => (
                  <TableRow
                    key={tarea._id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleTaskClick(tarea)}
                  >
                    <TableCell>
                      <div className={`h-2.5 w-2.5 rounded-full ${prioridadDot[tarea.prioridad] || 'bg-slate-400'}`} />
                    </TableCell>
                    <TableCell className="font-medium text-sm">{tarea.titulo}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px] capitalize">
                        {tarea.estado.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs capitalize">{tarea.prioridad}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{tarea.fecha_inicio || '—'}</TableCell>
                    <TableCell className={`text-xs ${
                      tarea.fecha_limite && new Date(tarea.fecha_limite) < new Date() && tarea.estado !== 'completada'
                        ? 'text-destructive font-medium'
                        : 'text-muted-foreground'
                    }`}>
                      {tarea.fecha_limite || '—'}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {(tarea.etiquetas || []).slice(0, 2).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-[9px]">{tag}</Badge>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {tareas.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-8">
                      No hay tareas. Agrega una nueva tarea para comenzar.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Actividad Tab */}
        <TabsContent value="actividad" className="mt-4">
          <div className="border rounded-lg p-6">
            <div className="text-center text-muted-foreground py-8">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Selecciona una tarea para ver su actividad</p>
              <p className="text-xs mt-1">Los comentarios y cambios de estado se registran por tarea</p>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Task Detail Panel (slide-over) */}
      {selectedTask && (
        <TaskDetailPanel
          tarea={selectedTask}
          comentarios={comentarios}
          onClose={() => setSelectedTask(null)}
          onUpdate={handleUpdateTarea}
          onDelete={handleDeleteTarea}
          onToggleChecklist={handleToggleChecklist}
          onAddComment={handleAddComment}
        />
      )}

      {/* Create Tarea Dialog */}
      <CreateTareaDialog
        open={showCreateTarea}
        onOpenChange={setShowCreateTarea}
        procesoId={proceso._id}
        onCreateTarea={handleCreateTarea}
      />
    </div>
  )
}
