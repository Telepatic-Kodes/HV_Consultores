'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import {
  X,
  Save,
  Trash2,
  Loader2,
  MessageSquare,
  Send,
} from 'lucide-react'
import type { TareaItem } from './KanbanTaskCard'

interface Comment {
  _id: string
  contenido: string
  tipo: string
  created_at?: string
  autor_id?: string
}

interface TaskDetailPanelProps {
  tarea: TareaItem
  comentarios: Comment[]
  onClose: () => void
  onUpdate: (id: string, data: Partial<TareaItem>) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onToggleChecklist: (tareaId: string, index: number) => Promise<void>
  onAddComment: (tareaId: string, contenido: string) => Promise<void>
}

const estadoOptions = [
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'en_progreso', label: 'En Progreso' },
  { value: 'en_revision', label: 'En Revisión' },
  { value: 'completada', label: 'Completada' },
  { value: 'bloqueada', label: 'Bloqueada' },
]

const prioridadOptions = [
  { value: 'urgente', label: 'Urgente' },
  { value: 'alta', label: 'Alta' },
  { value: 'media', label: 'Media' },
  { value: 'baja', label: 'Baja' },
]

export function TaskDetailPanel({
  tarea,
  comentarios,
  onClose,
  onUpdate,
  onDelete,
  onToggleChecklist,
  onAddComment,
}: TaskDetailPanelProps) {
  const [titulo, setTitulo] = useState(tarea.titulo)
  const [descripcion, setDescripcion] = useState(tarea.descripcion || '')
  const [estado, setEstado] = useState(tarea.estado)
  const [prioridad, setPrioridad] = useState(tarea.prioridad)
  const [fechaInicio, setFechaInicio] = useState(tarea.fecha_inicio || '')
  const [fechaLimite, setFechaLimite] = useState(tarea.fecha_limite || '')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [sendingComment, setSendingComment] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    await onUpdate(tarea._id, {
      titulo,
      descripcion: descripcion || undefined,
      estado: estado as any,
      prioridad: prioridad as any,
      fecha_inicio: fechaInicio || undefined,
      fecha_limite: fechaLimite || undefined,
    })
    setSaving(false)
  }

  const handleDelete = async () => {
    setDeleting(true)
    await onDelete(tarea._id)
    onClose()
  }

  const handleSendComment = async () => {
    if (!newComment.trim()) return
    setSendingComment(true)
    await onAddComment(tarea._id, newComment.trim())
    setNewComment('')
    setSendingComment(false)
  }

  return (
    <div className="fixed right-0 top-0 z-50 h-screen w-full max-w-md bg-background border-l shadow-xl flex flex-col animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <h3 className="text-sm font-semibold">Detalle de Tarea</h3>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={handleDelete} disabled={deleting}>
            {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* Title */}
        <div>
          <Label className="text-xs">Título</Label>
          <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} />
        </div>

        {/* Description */}
        <div>
          <Label className="text-xs">Descripción</Label>
          <Textarea
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            rows={3}
            placeholder="Descripción de la tarea..."
          />
        </div>

        {/* Estado + Prioridad */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Estado</Label>
            <Select value={estado} onValueChange={setEstado}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {estadoOptions.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Prioridad</Label>
            <Select value={prioridad} onValueChange={setPrioridad}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {prioridadOptions.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Fecha inicio</Label>
            <Input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Fecha límite</Label>
            <Input type="date" value={fechaLimite} onChange={(e) => setFechaLimite(e.target.value)} />
          </div>
        </div>

        {/* Tags */}
        {tarea.etiquetas && tarea.etiquetas.length > 0 && (
          <div>
            <Label className="text-xs">Etiquetas</Label>
            <div className="flex flex-wrap gap-1 mt-1">
              {tarea.etiquetas.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-[10px]">{tag}</Badge>
              ))}
            </div>
          </div>
        )}

        {/* Save button */}
        <Button onClick={handleSave} disabled={saving} className="w-full" size="sm">
          {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
          Guardar Cambios
        </Button>

        <Separator />

        {/* Checklist */}
        {tarea.checklist && tarea.checklist.length > 0 && (
          <div>
            <Label className="text-xs mb-2 block">Checklist ({tarea.checklist.filter(c => c.completado).length}/{tarea.checklist.length})</Label>
            <div className="space-y-2">
              {tarea.checklist.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Checkbox
                    checked={item.completado}
                    onCheckedChange={() => onToggleChecklist(tarea._id, index)}
                  />
                  <span className={`text-sm ${item.completado ? 'line-through text-muted-foreground' : ''}`}>
                    {item.texto}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <Separator />

        {/* Comments */}
        <div>
          <Label className="text-xs mb-2 flex items-center gap-1">
            <MessageSquare className="h-3 w-3" />
            Actividad ({comentarios.length})
          </Label>

          <div className="space-y-3 mb-3 max-h-60 overflow-y-auto">
            {comentarios.map((c) => (
              <div key={c._id} className="text-xs border rounded-md p-2">
                <div className="flex items-center justify-between mb-1">
                  <Badge variant="outline" className="text-[9px]">{c.tipo}</Badge>
                  {c.created_at && (
                    <span className="text-[9px] text-muted-foreground">
                      {new Date(c.created_at).toLocaleDateString('es-CL')}
                    </span>
                  )}
                </div>
                <p className="text-muted-foreground">{c.contenido}</p>
              </div>
            ))}
            {comentarios.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">Sin actividad</p>
            )}
          </div>

          {/* Add comment */}
          <div className="flex gap-2">
            <Input
              placeholder="Escribe un comentario..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendComment()}
              className="text-xs"
            />
            <Button size="icon" className="h-9 w-9 shrink-0" onClick={handleSendComment} disabled={sendingComment || !newComment.trim()}>
              {sendingComment ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
