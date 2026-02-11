'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Loader2, ArrowRight, LayoutTemplate } from 'lucide-react'
import {
  obtenerPlantillasCliente,
  obtenerPlantilla,
  type DocumentoPlantilla,
} from '@/app/dashboard/documentos/template-actions'

interface DocumentoTemplate {
  nombre?: string
  tipo_documento?: string
  folio_documento?: string
  fecha_documento?: string
  monto_total?: number
}

interface DocumentTemplateSelectorProps {
  clienteId: string
  onTemplateSelected?: (datos: DocumentoTemplate) => void
  disabled?: boolean
}

export function DocumentTemplateSelector({
  clienteId,
  onTemplateSelected,
  disabled = false,
}: DocumentTemplateSelectorProps) {
  const [plantillas, setPlantillas] = useState<DocumentoPlantilla[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string>('')
  const [selectedPlantilla, setSelectedPlantilla] = useState<DocumentoPlantilla | null>(null)

  useEffect(() => {
    cargarPlantillas()
  }, [clienteId])

  const cargarPlantillas = async () => {
    setLoading(true)
    try {
      const resultado = await obtenerPlantillasCliente(clienteId)
      if (resultado.success && resultado.plantillas) {
        const activas = resultado.plantillas.filter((p) => p.activa)
        setPlantillas(activas)
      }
    } catch (error) {
      toast.error('Error al cargar plantillas')
    } finally {
      setLoading(false)
    }
  }

  const handleSelectTemplate = async (id: string) => {
    setSelectedId(id)
    const plantilla = plantillas.find((p) => p.id === id)
    if (plantilla) {
      setSelectedPlantilla(plantilla)
    }
  }

  const handleApplyTemplate = () => {
    if (!selectedPlantilla) return

    const datos: DocumentoTemplate = {
      tipo_documento: selectedPlantilla.tipo_documento,
    }

    if (selectedPlantilla.folio_documento_prefijo) {
      datos.folio_documento = `${selectedPlantilla.folio_documento_prefijo}${selectedPlantilla.folio_documento_siguiente}`
    }

    if (selectedPlantilla.fecha_documento_default) {
      datos.fecha_documento = selectedPlantilla.fecha_documento_default
    }

    if (selectedPlantilla.monto_total_default) {
      datos.monto_total = selectedPlantilla.monto_total_default
    }

    if (onTemplateSelected) {
      onTemplateSelected(datos)
    }

    toast.success('Plantilla aplicada')
    setSelectedId('')
    setSelectedPlantilla(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (plantillas.length === 0) {
    return null
  }

  return (
    <Card className="bg-blue-50 border-blue-200">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <LayoutTemplate className="h-4 w-4 text-blue-600" />
          <CardTitle className="text-base text-blue-900">Usar Plantilla</CardTitle>
        </div>
        <CardDescription>Carga rápida con valores predeterminados</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Select value={selectedId} onValueChange={handleSelectTemplate} disabled={disabled}>
          <SelectTrigger>
            <SelectValue placeholder="Selecciona una plantilla..." />
          </SelectTrigger>
          <SelectContent>
            {plantillas.map((plantilla) => (
              <SelectItem key={plantilla.id} value={plantilla.id}>
                <div className="flex items-center gap-2">
                  <span>{plantilla.nombre}</span>
                  <Badge variant="outline" className="ml-2">
                    {plantilla.uso_count} usos
                  </Badge>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selectedPlantilla && (
          <div className="bg-white rounded border p-3 space-y-2">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Tipo</p>
                <p className="font-medium">{selectedPlantilla.tipo_documento.toUpperCase()}</p>
              </div>
              {selectedPlantilla.folio_documento_prefijo && (
                <div>
                  <p className="text-xs text-muted-foreground">Folio</p>
                  <p className="font-medium">
                    {selectedPlantilla.folio_documento_prefijo}
                    {selectedPlantilla.folio_documento_siguiente}
                  </p>
                </div>
              )}
              {selectedPlantilla.fecha_documento_default && (
                <div>
                  <p className="text-xs text-muted-foreground">Fecha</p>
                  <p className="font-medium">
                    {new Date(selectedPlantilla.fecha_documento_default).toLocaleDateString(
                      'es-CL'
                    )}
                  </p>
                </div>
              )}
              {selectedPlantilla.monto_total_default && (
                <div>
                  <p className="text-xs text-muted-foreground">Monto</p>
                  <p className="font-medium">
                    ${selectedPlantilla.monto_total_default.toLocaleString('es-CL')}
                  </p>
                </div>
              )}
            </div>
            <Button
              type="button"
              onClick={handleApplyTemplate}
              className="w-full"
              size="sm"
            >
              Aplicar Plantilla
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
