'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
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
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { useSearchParams } from 'next/navigation'
import {
  Copy,
  Trash2,
  Edit2,
  Plus,
  Loader2,
  BarChart3,
  Clock,
  FileText,
} from 'lucide-react'
import {
  obtenerPlantillasCliente,
  crearPlantilla,
  actualizarPlantilla,
  eliminarPlantilla,
  duplicarPlantilla,
  type DocumentoPlantilla,
} from '../template-actions'

const TIPOS_DOCUMENTO = ['factura', 'boleta', 'nota_credito', 'nota_debito', 'otro']

export default function TemplatesPage() {
  const searchParams = useSearchParams()
  const clienteId = searchParams.get('cliente_id')

  const [plantillas, setPlantillas] = useState<DocumentoPlantilla[]>([])
  const [loading, setLoading] = useState(true)
  const [creando, setCreando] = useState(false)
  const [editando, setEditando] = useState<string | null>(null)
  const [eliminando, setEliminando] = useState<string | null>(null)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    tipo_documento: '',
    folio_documento_prefijo: '',
    fecha_documento_default: '',
    monto_total_default: '',
  })

  const cargarPlantillas = async () => {
    if (!clienteId) return

    setLoading(true)
    try {
      const resultado = await obtenerPlantillasCliente(clienteId)
      if (resultado.success && resultado.plantillas) {
        setPlantillas(resultado.plantillas)
      } else {
        toast.error(resultado.error || 'Error al cargar plantillas')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarPlantillas()
  }, [clienteId])

  const resetForm = () => {
    setFormData({
      nombre: '',
      descripcion: '',
      tipo_documento: '',
      folio_documento_prefijo: '',
      fecha_documento_default: '',
      monto_total_default: '',
    })
    setEditando(null)
  }

  const handleCrear = async () => {
    if (!clienteId) {
      toast.error('Cliente no seleccionado')
      return
    }

    if (!formData.nombre.trim()) {
      toast.error('El nombre de la plantilla es obligatorio')
      return
    }

    if (!formData.tipo_documento) {
      toast.error('Selecciona un tipo de documento')
      return
    }

    setCreando(true)
    try {
      const resultado = await crearPlantilla(clienteId, {
        nombre: formData.nombre.trim(),
        descripcion: formData.descripcion.trim() || undefined,
        tipo_documento: formData.tipo_documento,
        folio_documento_prefijo: formData.folio_documento_prefijo.trim() || undefined,
        fecha_documento_default: formData.fecha_documento_default || undefined,
        monto_total_default: formData.monto_total_default
          ? parseFloat(formData.monto_total_default)
          : undefined,
      })

      if (resultado.success) {
        toast.success('Plantilla creada exitosamente')
        setDialogOpen(false)
        resetForm()
        cargarPlantillas()
      } else {
        toast.error(resultado.error || 'Error al crear plantilla')
      }
    } finally {
      setCreando(false)
    }
  }

  const handleActualizar = async () => {
    if (!editando) return

    setCreando(true)
    try {
      const resultado = await actualizarPlantilla(editando, {
        nombre: formData.nombre.trim(),
        descripcion: formData.descripcion.trim() || null,
        tipo_documento: formData.tipo_documento,
        folio_documento_prefijo: formData.folio_documento_prefijo.trim() || null,
        fecha_documento_default: formData.fecha_documento_default || null,
        monto_total_default: formData.monto_total_default
          ? parseFloat(formData.monto_total_default)
          : null,
      })

      if (resultado.success) {
        toast.success('Plantilla actualizada exitosamente')
        setDialogOpen(false)
        resetForm()
        cargarPlantillas()
      } else {
        toast.error(resultado.error || 'Error al actualizar plantilla')
      }
    } finally {
      setCreando(false)
    }
  }

  const handleEliminar = async () => {
    if (!eliminando) return

    try {
      const resultado = await eliminarPlantilla(eliminando)
      if (resultado.success) {
        toast.success('Plantilla eliminada exitosamente')
        setEliminando(null)
        cargarPlantillas()
      } else {
        toast.error(resultado.error || 'Error al eliminar plantilla')
      }
    } finally {
      setEliminando(null)
    }
  }

  const handleDuplicar = async (plantilla: DocumentoPlantilla) => {
    const nuevoNombre = `${plantilla.nombre} (Copia)`
    try {
      const resultado = await duplicarPlantilla(plantilla.id, nuevoNombre)
      if (resultado.success) {
        toast.success('Plantilla duplicada exitosamente')
        cargarPlantillas()
      } else {
        toast.error(resultado.error || 'Error al duplicar plantilla')
      }
    } catch (error) {
      toast.error('Error al duplicar plantilla')
    }
  }

  const handleEditar = (plantilla: DocumentoPlantilla) => {
    setFormData({
      nombre: plantilla.nombre,
      descripcion: plantilla.descripcion || '',
      tipo_documento: plantilla.tipo_documento,
      folio_documento_prefijo: plantilla.folio_documento_prefijo || '',
      fecha_documento_default: plantilla.fecha_documento_default || '',
      monto_total_default: plantilla.monto_total_default?.toString() || '',
    })
    setEditando(plantilla.id)
    setDialogOpen(true)
  }

  if (!clienteId) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Selecciona un cliente para ver sus plantillas</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Plantillas de Documentos</h1>
          <p className="text-muted-foreground mt-1">
            Crea y gestiona plantillas para cargar documentos más rápido
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => resetForm()}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Nueva Plantilla
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editando ? 'Editar Plantilla' : 'Crear Nueva Plantilla'}
              </DialogTitle>
              <DialogDescription>
                {editando
                  ? 'Modifica los datos de la plantilla'
                  : 'Define valores predeterminados para cargar documentos rápidamente'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Nombre de la Plantilla *</label>
                <Input
                  placeholder="Ej: Facturas Mensuales"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Descripción</label>
                <Textarea
                  placeholder="Descripción opcional de la plantilla"
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  rows={2}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Tipo de Documento *</label>
                <Select
                  value={formData.tipo_documento}
                  onValueChange={(value) =>
                    setFormData({ ...formData, tipo_documento: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOS_DOCUMENTO.map((tipo) => (
                      <SelectItem key={tipo} value={tipo}>
                        {tipo.replace(/_/g, ' ').toUpperCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Prefijo de Folio</label>
                <Input
                  placeholder="Ej: FAC-"
                  value={formData.folio_documento_prefijo}
                  onChange={(e) =>
                    setFormData({ ...formData, folio_documento_prefijo: e.target.value })
                  }
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Ej: FAC- resultará en FAC-1, FAC-2, etc.
                </p>
              </div>

              <div>
                <label className="text-sm font-medium">Monto Predeterminado</label>
                <Input
                  type="number"
                  placeholder="0.00"
                  step="0.01"
                  value={formData.monto_total_default}
                  onChange={(e) =>
                    setFormData({ ...formData, monto_total_default: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="text-sm font-medium">Fecha Predeterminada</label>
                <Input
                  type="date"
                  value={formData.fecha_documento_default}
                  onChange={(e) =>
                    setFormData({ ...formData, fecha_documento_default: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={editando ? handleActualizar : handleCrear}
                disabled={creando}
              >
                {creando && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editando ? 'Actualizar' : 'Crear'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : plantillas.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No hay plantillas creadas</h3>
            <p className="text-muted-foreground text-sm">
              Crea tu primera plantilla para empezar a usar valores predeterminados
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {plantillas.map((plantilla) => (
            <Card key={plantilla.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{plantilla.nombre}</CardTitle>
                      <Badge variant={plantilla.activa ? 'default' : 'secondary'}>
                        {plantilla.activa ? 'Activa' : 'Inactiva'}
                      </Badge>
                    </div>
                    {plantilla.descripcion && (
                      <CardDescription className="mt-1">{plantilla.descripcion}</CardDescription>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEditar(plantilla)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDuplicar(plantilla)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEliminando(plantilla.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Tipo</p>
                    <p className="font-medium">{plantilla.tipo_documento.toUpperCase()}</p>
                  </div>
                  {plantilla.folio_documento_prefijo && (
                    <div>
                      <p className="text-xs text-muted-foreground">Prefijo Folio</p>
                      <p className="font-medium">{plantilla.folio_documento_prefijo}</p>
                    </div>
                  )}
                  {plantilla.monto_total_default && (
                    <div>
                      <p className="text-xs text-muted-foreground">Monto Default</p>
                      <p className="font-medium">
                        ${plantilla.monto_total_default.toLocaleString('es-CL')}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-muted-foreground">Uso</p>
                    <div className="flex items-center gap-1">
                      <BarChart3 className="h-4 w-4" />
                      <p className="font-medium">{plantilla.uso_count}</p>
                    </div>
                  </div>
                </div>
                {plantilla.ultima_usada_en && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    Última usada: {new Date(plantilla.ultima_usada_en).toLocaleDateString('es-CL')}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!eliminando} onOpenChange={(open) => !open && setEliminando(null)}>
        <AlertDialogContent>
          <AlertDialogTitle>Eliminar Plantilla</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción no se puede deshacer. La plantilla será eliminada permanentemente.
          </AlertDialogDescription>
          <div className="flex gap-2 justify-end">
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleEliminar} className="bg-destructive">
              Eliminar
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
