'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Switch } from '@/components/ui/switch'
import {
  Calendar,
  Clock,
  Plus,
  Play,
  Pause,
  Trash2,
  Edit,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from 'lucide-react'
import type { SiiScheduledTask, SiiTaskType } from '@/lib/sii-rpa/types'
import { CRON_PRESETS, describeCron, validateCronExpression } from '@/lib/sii-rpa/scheduler'
import {
  createScheduledTask,
  toggleScheduledTask,
  deleteScheduledTask,
} from '../actions'
import { toast } from 'sonner'

// ============================================================================
// TYPES
// ============================================================================

interface ScheduledTasksManagerProps {
  tasks: SiiScheduledTask[]
  clientes: Array<{ id: string; nombre: string; rut: string }>
}

interface TaskFormData {
  cliente_id: string
  task_type: SiiTaskType
  cron_expression: string
  descripcion: string
}

// ============================================================================
// CONSTANTS
// ============================================================================

const TASK_TYPE_OPTIONS: { value: SiiTaskType; label: string; description: string }[] = [
  { value: 'f29_submit', label: 'Enviar F29', description: 'Envía declaración F29 al SII' },
  { value: 'f29_download', label: 'Descargar F29', description: 'Descarga F29 presentados' },
  { value: 'libro_compras', label: 'Libro de Compras', description: 'Descarga libro de compras' },
  { value: 'libro_ventas', label: 'Libro de Ventas', description: 'Descarga libro de ventas' },
  { value: 'situacion_tributaria', label: 'Situación Tributaria', description: 'Consulta estado tributario' },
  { value: 'login_test', label: 'Validar Credenciales', description: 'Verifica acceso al SII' },
]

const CRON_PRESET_OPTIONS = [
  { value: 'custom', label: 'Personalizado', cron: '' },
  { value: 'f29_monthly', label: 'F29 Mensual (día 12, 10:00)', cron: CRON_PRESETS.sii.f29Mensual },
  { value: 'books_monthly', label: 'Libros Mensual (día 15, 9:00)', cron: CRON_PRESETS.sii.librosMensual },
  { value: 'validation_weekly', label: 'Validación Semanal (lunes 8:00)', cron: CRON_PRESETS.sii.validacionSemanal },
  { value: 'status_monthly', label: 'Situación Mensual (día 1, 8:00)', cron: CRON_PRESETS.sii.situacionMensual },
  { value: 'daily_9am', label: 'Diario 9:00', cron: CRON_PRESETS.dailyAt(9, 0) },
  { value: 'weekdays_8am', label: 'Días laborales 8:00', cron: CRON_PRESETS.weekdaysAt(8, 0) },
]

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ScheduledTasksManager({ tasks, clientes }: ScheduledTasksManagerProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const activeTasks = tasks.filter((t) => t.activo)
  const inactiveTasks = tasks.filter((t) => !t.activo)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Tareas Programadas
          </h3>
          <p className="text-sm text-muted-foreground">
            Automatiza tareas con expresiones cron
          </p>
        </div>
        <CreateTaskDialog
          clientes={clientes}
          isOpen={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          isSubmitting={isSubmitting}
          setIsSubmitting={setIsSubmitting}
        />
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Play className="h-4 w-4 text-green-500" />
              <span className="text-2xl font-bold">{activeTasks.length}</span>
              <span className="text-muted-foreground">Activas</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Pause className="h-4 w-4 text-yellow-500" />
              <span className="text-2xl font-bold">{inactiveTasks.length}</span>
              <span className="text-muted-foreground">Pausadas</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-500" />
              <span className="text-2xl font-bold">{tasks.length}</span>
              <span className="text-muted-foreground">Total</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Task List */}
      <Card>
        <CardHeader>
          <CardTitle>Tareas Configuradas</CardTitle>
          <CardDescription>
            Gestiona las tareas programadas para cada cliente
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {tasks.map((task) => (
              <TaskRow key={task.id} task={task} />
            ))}
            {tasks.length === 0 && (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  No hay tareas programadas.
                  <br />
                  Crea una nueva tarea para automatizar procesos.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ============================================================================
// TASK ROW
// ============================================================================

function TaskRow({ task }: { task: SiiScheduledTask }) {
  const [isToggling, setIsToggling] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleToggle = async (newValue: boolean) => {
    setIsToggling(true)
    const result = await toggleScheduledTask(task.id, newValue)
    setIsToggling(false)

    if (result.success) {
      toast.success(newValue ? 'Tarea activada' : 'Tarea pausada')
    } else {
      toast.error(result.error || 'Error al actualizar tarea')
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    const result = await deleteScheduledTask(task.id)
    setIsDeleting(false)

    if (result.success) {
      toast.success('Tarea eliminada')
    } else {
      toast.error(result.error || 'Error al eliminar tarea')
    }
  }

  const taskTypeLabel = TASK_TYPE_OPTIONS.find((t) => t.value === task.task_type)?.label || task.task_type

  return (
    <div
      className={`flex items-center justify-between rounded-lg border p-4 ${
        !task.activo ? 'opacity-60' : ''
      }`}
    >
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Switch
            checked={task.activo}
            onCheckedChange={handleToggle}
            disabled={isToggling}
          />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="font-medium">{taskTypeLabel}</p>
            <Badge variant={task.activo ? 'default' : 'secondary'}>
              {task.activo ? 'Activa' : 'Pausada'}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {task.descripcion || describeCron(task.cron_expression)}
          </p>
          <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {task.cron_expression}
            </span>
            {task.proxima_ejecucion && (
              <span>
                Próxima: {new Date(task.proxima_ejecucion).toLocaleString('es-CL')}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {task.ultimo_resultado && (
          <LastResultBadge result={task.ultimo_resultado} />
        )}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon" disabled={isDeleting}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Eliminar Tarea</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer. La tarea programada será
                eliminada permanentemente.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground"
              >
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}

function LastResultBadge({ result }: { result: string }) {
  const config = {
    success: { icon: CheckCircle2, class: 'bg-green-100 text-green-700' },
    failed: { icon: XCircle, class: 'bg-red-100 text-red-700' },
    pending: { icon: Clock, class: 'bg-yellow-100 text-yellow-700' },
  }

  const cfg = config[result as keyof typeof config] || config.pending
  const Icon = cfg.icon

  return (
    <Badge variant="outline" className={cfg.class}>
      <Icon className="h-3 w-3 mr-1" />
      {result}
    </Badge>
  )
}

// ============================================================================
// CREATE TASK DIALOG
// ============================================================================

function CreateTaskDialog({
  clientes,
  isOpen,
  onOpenChange,
  isSubmitting,
  setIsSubmitting,
}: {
  clientes: Array<{ id: string; nombre: string; rut: string }>
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  isSubmitting: boolean
  setIsSubmitting: (value: boolean) => void
}) {
  const [formData, setFormData] = useState<TaskFormData>({
    cliente_id: '',
    task_type: 'f29_submit',
    cron_expression: CRON_PRESETS.sii.f29Mensual,
    descripcion: '',
  })
  const [selectedPreset, setSelectedPreset] = useState('f29_monthly')
  const [cronError, setCronError] = useState<string | null>(null)

  const handlePresetChange = (preset: string) => {
    setSelectedPreset(preset)
    const presetOption = CRON_PRESET_OPTIONS.find((p) => p.value === preset)
    if (presetOption && presetOption.cron) {
      setFormData((prev) => ({ ...prev, cron_expression: presetOption.cron }))
      setCronError(null)
    }
  }

  const handleCronChange = (value: string) => {
    setFormData((prev) => ({ ...prev, cron_expression: value }))
    setSelectedPreset('custom')

    const validation = validateCronExpression(value)
    setCronError(validation.valid ? null : validation.error || 'Expresión inválida')
  }

  const handleSubmit = async () => {
    if (!formData.cliente_id || !formData.task_type || !formData.cron_expression) {
      toast.error('Complete todos los campos requeridos')
      return
    }

    if (cronError) {
      toast.error('Corrija la expresión cron antes de continuar')
      return
    }

    setIsSubmitting(true)

    const result = await createScheduledTask({
      cliente_id: formData.cliente_id,
      task_type: formData.task_type,
      cron_expression: formData.cron_expression,
      descripcion: formData.descripcion || undefined,
    })

    setIsSubmitting(false)

    if (result.success) {
      toast.success('Tarea programada creada')
      onOpenChange(false)
      // Reset form
      setFormData({
        cliente_id: '',
        task_type: 'f29_submit',
        cron_expression: CRON_PRESETS.sii.f29Mensual,
        descripcion: '',
      })
      setSelectedPreset('f29_monthly')
    } else {
      toast.error(result.error || 'Error al crear tarea')
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Tarea
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Crear Tarea Programada</DialogTitle>
          <DialogDescription>
            Configure una tarea para ejecutarse automáticamente según un horario.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Cliente Select */}
          <div className="space-y-2">
            <Label htmlFor="cliente">Cliente</Label>
            <Select
              value={formData.cliente_id}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, cliente_id: value }))
              }
            >
              <SelectTrigger id="cliente">
                <SelectValue placeholder="Seleccione un cliente" />
              </SelectTrigger>
              <SelectContent>
                {clientes.map((cliente) => (
                  <SelectItem key={cliente.id} value={cliente.id}>
                    {cliente.nombre} - {cliente.rut}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Task Type Select */}
          <div className="space-y-2">
            <Label htmlFor="task_type">Tipo de Tarea</Label>
            <Select
              value={formData.task_type}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, task_type: value as SiiTaskType }))
              }
            >
              <SelectTrigger id="task_type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TASK_TYPE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div>
                      <span>{option.label}</span>
                      <span className="text-xs text-muted-foreground ml-2">
                        {option.description}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Cron Preset */}
          <div className="space-y-2">
            <Label htmlFor="preset">Frecuencia</Label>
            <Select value={selectedPreset} onValueChange={handlePresetChange}>
              <SelectTrigger id="preset">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CRON_PRESET_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Cron Expression */}
          <div className="space-y-2">
            <Label htmlFor="cron">Expresión Cron</Label>
            <Input
              id="cron"
              value={formData.cron_expression}
              onChange={(e) => handleCronChange(e.target.value)}
              placeholder="0 9 * * 1-5"
              className={cronError ? 'border-red-500' : ''}
            />
            {cronError ? (
              <p className="text-xs text-red-500">{cronError}</p>
            ) : (
              <p className="text-xs text-muted-foreground">
                {describeCron(formData.cron_expression)}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripción (opcional)</Label>
            <Input
              id="descripcion"
              value={formData.descripcion}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, descripcion: e.target.value }))
              }
              placeholder="Ej: F29 mensual empresa ABC"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !!cronError}>
            {isSubmitting ? 'Creando...' : 'Crear Tarea'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
