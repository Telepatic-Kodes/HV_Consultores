'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
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
import { Loader2 } from 'lucide-react'

interface CreateTareaDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  procesoId: string
  onCreateTarea: (data: {
    titulo: string
    descripcion?: string
    proceso_id: string
    prioridad: string
    fecha_inicio?: string
    fecha_limite?: string
    etiquetas?: string[]
  }) => Promise<void>
}

export function CreateTareaDialog({
  open,
  onOpenChange,
  procesoId,
  onCreateTarea,
}: CreateTareaDialogProps) {
  const [titulo, setTitulo] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [prioridad, setPrioridad] = useState('media')
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaLimite, setFechaLimite] = useState('')
  const [etiquetasStr, setEtiquetasStr] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!titulo) return
    setLoading(true)
    const etiquetas = etiquetasStr ? etiquetasStr.split(',').map((s) => s.trim()).filter(Boolean) : undefined
    await onCreateTarea({
      titulo,
      descripcion: descripcion || undefined,
      proceso_id: procesoId,
      prioridad,
      fecha_inicio: fechaInicio || undefined,
      fecha_limite: fechaLimite || undefined,
      etiquetas,
    })
    // Reset
    setTitulo('')
    setDescripcion('')
    setPrioridad('media')
    setFechaInicio('')
    setFechaLimite('')
    setEtiquetasStr('')
    setLoading(false)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Nueva Tarea</DialogTitle>
          <DialogDescription>Agregar tarea al proceso</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div>
            <Label>Título</Label>
            <Input
              placeholder="Nombre de la tarea..."
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
            />
          </div>

          <div>
            <Label>Descripción</Label>
            <Textarea
              placeholder="Descripción opcional..."
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              rows={2}
            />
          </div>

          <div>
            <Label>Prioridad</Label>
            <Select value={prioridad} onValueChange={setPrioridad}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="urgente">Urgente</SelectItem>
                <SelectItem value="alta">Alta</SelectItem>
                <SelectItem value="media">Media</SelectItem>
                <SelectItem value="baja">Baja</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Fecha inicio</Label>
              <Input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} />
            </div>
            <div>
              <Label>Fecha límite</Label>
              <Input type="date" value={fechaLimite} onChange={(e) => setFechaLimite(e.target.value)} />
            </div>
          </div>

          <div>
            <Label>Etiquetas</Label>
            <Input
              placeholder="sii, f29, impuestos (separadas por coma)"
              value={etiquetasStr}
              onChange={(e) => setEtiquetasStr(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={loading || !titulo}>
              {loading && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              Crear Tarea
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
