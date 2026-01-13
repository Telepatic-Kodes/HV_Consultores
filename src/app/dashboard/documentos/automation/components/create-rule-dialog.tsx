'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Loader2, Plus, Zap } from 'lucide-react'
import { crearRegla, actualizarRegla } from '@/app/dashboard/documentos/automation-actions'

interface CreateRuleDialogProps {
  clienteId: string
  regla?: any
  onSuccess: () => void
  trigger?: React.ReactNode
}

const TRIGGER_TYPES = [
  { value: 'ON_EXPIRATION', label: 'Al vencer documento' },
  { value: 'ON_SCHEDULE', label: 'Programado' },
  { value: 'ON_EVENT', label: 'Por evento' },
]

const ACTIONS = [
  { value: 'ARCHIVE', label: 'Archivar documentos' },
  { value: 'DELETE', label: 'Eliminar documentos' },
  { value: 'NOTIFY', label: 'Enviar notificaciones' },
]

const FREQUENCIES = [
  { value: 'DIARIA', label: 'Diaria' },
  { value: 'SEMANAL', label: 'Semanal' },
  { value: 'MENSUAL', label: 'Mensual' },
]

const DAYS_OF_WEEK = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Lunes' },
  { value: 2, label: 'Martes' },
  { value: 3, label: 'Miércoles' },
  { value: 4, label: 'Jueves' },
  { value: 5, label: 'Viernes' },
  { value: 6, label: 'Sábado' },
]

export function CreateRuleDialog({
  clienteId,
  regla,
  onSuccess,
  trigger,
}: CreateRuleDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isEditing = !!regla

  const [formData, setFormData] = useState({
    nombre: regla?.nombre || '',
    descripcion: regla?.descripcion || '',
    tipo_trigger: regla?.tipo_trigger || 'ON_EXPIRATION',
    condicion_dias_antes: regla?.condicion_dias_antes || 7,
    acciones: regla?.acciones || [],
    frecuencia: regla?.frecuencia || 'DIARIA',
    dia_semana: regla?.dia_semana || 1,
    dia_mes: regla?.dia_mes || 1,
    hora: regla?.hora || '08:00',
  })

  const handleActionToggle = (action: string) => {
    setFormData((prev) => ({
      ...prev,
      acciones: prev.acciones.includes(action)
        ? prev.acciones.filter((a: string) => a !== action)
        : [...prev.acciones, action],
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (formData.acciones.length === 0) {
        throw new Error('Debe seleccionar al menos una acción')
      }

      if (isEditing) {
        await actualizarRegla(regla.id, formData)
      } else {
        await crearRegla(clienteId, formData)
      }

      setOpen(false)
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar la regla')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    if (!isEditing) {
      setFormData({
        nombre: '',
        descripcion: '',
        tipo_trigger: 'ON_EXPIRATION',
        condicion_dias_antes: 7,
        acciones: [],
        frecuencia: 'DIARIA',
        dia_semana: 1,
        dia_mes: 1,
        hora: '08:00',
      })
    }
    setError(null)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen)
        if (!isOpen) resetForm()
      }}
    >
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Crear Regla
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-blue-500" />
              {isEditing ? 'Editar Regla' : 'Nueva Regla de Automatización'}
            </DialogTitle>
            <DialogDescription>
              Configure una regla para ejecutar acciones automáticas sobre documentos.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Nombre */}
            <div className="grid gap-2">
              <Label htmlFor="nombre">Nombre de la Regla *</Label>
              <Input
                id="nombre"
                value={formData.nombre}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, nombre: e.target.value }))
                }
                placeholder="Ej: Archivar documentos vencidos"
                required
              />
            </div>

            {/* Descripción */}
            <div className="grid gap-2">
              <Label htmlFor="descripcion">Descripción</Label>
              <Textarea
                id="descripcion"
                value={formData.descripcion}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, descripcion: e.target.value }))
                }
                placeholder="Describe qué hace esta regla..."
                rows={2}
              />
            </div>

            {/* Tipo de Trigger */}
            <div className="grid gap-2">
              <Label>Tipo de Activación *</Label>
              <Select
                value={formData.tipo_trigger}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, tipo_trigger: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione tipo" />
                </SelectTrigger>
                <SelectContent>
                  {TRIGGER_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Condición días antes (solo para ON_EXPIRATION) */}
            {formData.tipo_trigger === 'ON_EXPIRATION' && (
              <div className="grid gap-2">
                <Label htmlFor="dias">Días antes del vencimiento</Label>
                <Input
                  id="dias"
                  type="number"
                  min={0}
                  max={365}
                  value={formData.condicion_dias_antes}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      condicion_dias_antes: parseInt(e.target.value) || 0,
                    }))
                  }
                />
                <p className="text-xs text-muted-foreground">
                  0 = ejecutar el día del vencimiento
                </p>
              </div>
            )}

            {/* Configuración de programación (solo para ON_SCHEDULE) */}
            {formData.tipo_trigger === 'ON_SCHEDULE' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Frecuencia</Label>
                  <Select
                    value={formData.frecuencia}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, frecuencia: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione frecuencia" />
                    </SelectTrigger>
                    <SelectContent>
                      {FREQUENCIES.map((freq) => (
                        <SelectItem key={freq.value} value={freq.value}>
                          {freq.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {formData.frecuencia === 'SEMANAL' && (
                  <div className="grid gap-2">
                    <Label>Día de la semana</Label>
                    <Select
                      value={String(formData.dia_semana)}
                      onValueChange={(value) =>
                        setFormData((prev) => ({
                          ...prev,
                          dia_semana: parseInt(value),
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione día" />
                      </SelectTrigger>
                      <SelectContent>
                        {DAYS_OF_WEEK.map((day) => (
                          <SelectItem key={day.value} value={String(day.value)}>
                            {day.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {formData.frecuencia === 'MENSUAL' && (
                  <div className="grid gap-2">
                    <Label htmlFor="diaMes">Día del mes</Label>
                    <Input
                      id="diaMes"
                      type="number"
                      min={1}
                      max={31}
                      value={formData.dia_mes}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          dia_mes: parseInt(e.target.value) || 1,
                        }))
                      }
                    />
                  </div>
                )}

                <div className="grid gap-2">
                  <Label htmlFor="hora">Hora de ejecución</Label>
                  <Input
                    id="hora"
                    type="time"
                    value={formData.hora}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, hora: e.target.value }))
                    }
                  />
                </div>
              </div>
            )}

            {/* Acciones */}
            <div className="grid gap-2">
              <Label>Acciones a ejecutar *</Label>
              <div className="space-y-2 border rounded-md p-3">
                {ACTIONS.map((action) => (
                  <div key={action.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={action.value}
                      checked={formData.acciones.includes(action.value)}
                      onCheckedChange={() => handleActionToggle(action.value)}
                    />
                    <label
                      htmlFor={action.value}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {action.label}
                    </label>
                  </div>
                ))}
              </div>
              {formData.acciones.length === 0 && (
                <p className="text-xs text-red-500">
                  Seleccione al menos una acción
                </p>
              )}
            </div>

            {error && (
              <div className="text-sm text-red-500 bg-red-50 p-2 rounded">
                {error}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isEditing ? 'Guardar Cambios' : 'Crear Regla'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
