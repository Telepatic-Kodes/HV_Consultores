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

interface Plantilla {
  _id: string
  nombre: string
  tipo: string
  descripcion?: string
  tareas_template: any[]
}

interface Cliente {
  _id: string
  razon_social: string
  rut: string
  activo?: boolean
}

interface CreateProcesoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  plantillas: Plantilla[]
  clientes: Cliente[]
  onCreateFromScratch: (data: {
    nombre: string
    descripcion?: string
    tipo: string
    cliente_id: string
    periodo?: string
    fecha_inicio?: string
    fecha_limite?: string
  }) => Promise<void>
  onCreateFromTemplate: (data: {
    plantillaId: string
    clienteId: string
    periodo?: string
    fechaInicio?: string
  }) => Promise<void>
}

const tipoOptions = [
  { value: 'contabilidad_mensual', label: 'Contabilidad Mensual' },
  { value: 'declaracion_f29', label: 'Declaración F29' },
  { value: 'declaracion_renta', label: 'Declaración Renta' },
  { value: 'cierre_anual', label: 'Cierre Anual' },
  { value: 'onboarding_cliente', label: 'Onboarding Cliente' },
  { value: 'otro', label: 'Otro' },
]

export function CreateProcesoDialog({
  open,
  onOpenChange,
  plantillas,
  clientes,
  onCreateFromScratch,
  onCreateFromTemplate,
}: CreateProcesoDialogProps) {
  const [mode, setMode] = useState<'select' | 'scratch' | 'template'>('select')
  const [loading, setLoading] = useState(false)

  // Scratch form
  const [nombre, setNombre] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [tipo, setTipo] = useState('contabilidad_mensual')
  const [clienteId, setClienteId] = useState('')
  const [periodo, setPeriodo] = useState('')
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaLimite, setFechaLimite] = useState('')

  // Template form
  const [plantillaId, setPlantillaId] = useState('')

  const resetForm = () => {
    setMode('select')
    setNombre('')
    setDescripcion('')
    setTipo('contabilidad_mensual')
    setClienteId('')
    setPeriodo('')
    setFechaInicio('')
    setFechaLimite('')
    setPlantillaId('')
    setLoading(false)
  }

  const handleClose = () => {
    resetForm()
    onOpenChange(false)
  }

  const handleCreateScratch = async () => {
    if (!nombre || !clienteId) return
    setLoading(true)
    await onCreateFromScratch({
      nombre,
      descripcion: descripcion || undefined,
      tipo,
      cliente_id: clienteId,
      periodo: periodo || undefined,
      fecha_inicio: fechaInicio || undefined,
      fecha_limite: fechaLimite || undefined,
    })
    handleClose()
  }

  const handleCreateTemplate = async () => {
    if (!plantillaId || !clienteId) return
    setLoading(true)
    await onCreateFromTemplate({
      plantillaId,
      clienteId,
      periodo: periodo || undefined,
      fechaInicio: fechaInicio || undefined,
    })
    handleClose()
  }

  const selectedPlantilla = plantillas.find((p) => p._id === plantillaId)

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Nuevo Proceso</DialogTitle>
          <DialogDescription>
            {mode === 'select' && 'Elige cómo crear el proceso'}
            {mode === 'scratch' && 'Crear proceso desde cero'}
            {mode === 'template' && 'Crear desde plantilla predefinida'}
          </DialogDescription>
        </DialogHeader>

        {mode === 'select' && (
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={() => setMode('template')}
              className="flex flex-col items-center gap-2 rounded-lg border-2 border-dashed p-6 hover:border-primary hover:bg-primary/5 transition-all"
            >
              <span className="text-2xl">📋</span>
              <span className="text-sm font-medium">Desde Plantilla</span>
              <span className="text-[10px] text-muted-foreground text-center">
                Usar flujo predefinido con tareas automáticas
              </span>
            </button>
            <button
              onClick={() => setMode('scratch')}
              className="flex flex-col items-center gap-2 rounded-lg border-2 border-dashed p-6 hover:border-primary hover:bg-primary/5 transition-all"
            >
              <span className="text-2xl">✏️</span>
              <span className="text-sm font-medium">Desde Cero</span>
              <span className="text-[10px] text-muted-foreground text-center">
                Proceso vacío, agregar tareas manualmente
              </span>
            </button>
          </div>
        )}

        {mode === 'template' && (
          <div className="space-y-4 pt-2">
            <div>
              <Label>Plantilla</Label>
              <Select value={plantillaId} onValueChange={setPlantillaId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar plantilla..." />
                </SelectTrigger>
                <SelectContent>
                  {plantillas.map((p) => (
                    <SelectItem key={p._id} value={p._id}>
                      {p.nombre} ({p.tareas_template.length} tareas)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedPlantilla?.descripcion && (
                <p className="text-xs text-muted-foreground mt-1">{selectedPlantilla.descripcion}</p>
              )}
            </div>

            <div>
              <Label>Cliente</Label>
              <Select value={clienteId} onValueChange={setClienteId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar cliente..." />
                </SelectTrigger>
                <SelectContent>
                  {clientes.filter(c => c.activo !== false).map((c) => (
                    <SelectItem key={c._id} value={c._id}>
                      {c.razon_social} ({c.rut})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Período</Label>
                <Input
                  placeholder="2026-03"
                  value={periodo}
                  onChange={(e) => setPeriodo(e.target.value)}
                />
              </div>
              <div>
                <Label>Fecha inicio</Label>
                <Input
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" onClick={() => setMode('select')}>Atrás</Button>
              <Button onClick={handleCreateTemplate} disabled={loading || !plantillaId || !clienteId}>
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Crear Proceso
              </Button>
            </div>
          </div>
        )}

        {mode === 'scratch' && (
          <div className="space-y-4 pt-2">
            <div>
              <Label>Nombre del proceso</Label>
              <Input
                placeholder="Ej: Contabilidad Marzo 2026"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
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

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Tipo</Label>
                <Select value={tipo} onValueChange={setTipo}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {tipoOptions.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Cliente</Label>
                <Select value={clienteId} onValueChange={setClienteId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    {clientes.filter(c => c.activo !== false).map((c) => (
                      <SelectItem key={c._id} value={c._id}>{c.razon_social}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Período</Label>
                <Input placeholder="2026-03" value={periodo} onChange={(e) => setPeriodo(e.target.value)} />
              </div>
              <div>
                <Label>Fecha inicio</Label>
                <Input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} />
              </div>
              <div>
                <Label>Fecha límite</Label>
                <Input type="date" value={fechaLimite} onChange={(e) => setFechaLimite(e.target.value)} />
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" onClick={() => setMode('select')}>Atrás</Button>
              <Button onClick={handleCreateScratch} disabled={loading || !nombre || !clienteId}>
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Crear Proceso
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
