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
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Loader2, Plus, Archive, Trash2, Mail, AlertTriangle } from 'lucide-react'
import {
  iniciarBatchArchivo,
  iniciarBatchEliminacion,
} from '@/app/dashboard/documentos/automation-actions'

interface BatchOperationsDialogProps {
  clienteId: string
  onSuccess: () => void
  trigger?: React.ReactNode
}

const OPERATION_TYPES = [
  {
    value: 'ARCHIVE',
    label: 'Archivar Documentos',
    icon: Archive,
    description: 'Mueve documentos seleccionados al archivo',
    color: 'text-blue-500',
  },
  {
    value: 'DELETE',
    label: 'Eliminar Documentos',
    icon: Trash2,
    description: 'Elimina permanentemente los documentos seleccionados',
    color: 'text-red-500',
    warning: true,
  },
]

export function BatchOperationsDialog({
  clienteId,
  onSuccess,
  trigger,
}: BatchOperationsDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [operationType, setOperationType] = useState<string>('ARCHIVE')
  const [documentIds, setDocumentIds] = useState('')

  const parseDocumentIds = (): string[] => {
    return documentIds
      .split(/[\n,;]+/)
      .map((id) => id.trim())
      .filter((id) => id.length > 0)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const ids = parseDocumentIds()

    if (ids.length === 0) {
      setError('Debe ingresar al menos un ID de documento')
      setLoading(false)
      return
    }

    try {
      if (operationType === 'ARCHIVE') {
        await iniciarBatchArchivo(clienteId, ids)
      } else if (operationType === 'DELETE') {
        if (!confirm(`¿Está seguro de eliminar ${ids.length} documentos? Esta acción no se puede deshacer.`)) {
          setLoading(false)
          return
        }
        await iniciarBatchEliminacion(clienteId, ids)
      }

      setOpen(false)
      setDocumentIds('')
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar la operación')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setOperationType('ARCHIVE')
    setDocumentIds('')
    setError(null)
  }

  const parsedIds = parseDocumentIds()
  const selectedOperation = OPERATION_TYPES.find((op) => op.value === operationType)
  const OperationIcon = selectedOperation?.icon || Archive

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
            Nueva Operación
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <OperationIcon className={`h-5 w-5 ${selectedOperation?.color}`} />
              Nueva Operación por Lotes
            </DialogTitle>
            <DialogDescription>
              Ejecute operaciones masivas sobre múltiples documentos.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Tipo de operación */}
            <div className="grid gap-2">
              <Label>Tipo de Operación *</Label>
              <Select
                value={operationType}
                onValueChange={setOperationType}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione operación" />
                </SelectTrigger>
                <SelectContent>
                  {OPERATION_TYPES.map((op) => (
                    <SelectItem key={op.value} value={op.value}>
                      <div className="flex items-center gap-2">
                        <op.icon className={`h-4 w-4 ${op.color}`} />
                        {op.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedOperation && (
                <p className="text-xs text-muted-foreground">
                  {selectedOperation.description}
                </p>
              )}
            </div>

            {/* Warning for delete */}
            {selectedOperation?.warning && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-800">
                    Operación Irreversible
                  </p>
                  <p className="text-xs text-red-600">
                    Los documentos eliminados no se pueden recuperar. Asegúrese de tener respaldos antes de continuar.
                  </p>
                </div>
              </div>
            )}

            {/* IDs de documentos */}
            <div className="grid gap-2">
              <Label htmlFor="documentIds">IDs de Documentos *</Label>
              <Textarea
                id="documentIds"
                value={documentIds}
                onChange={(e) => setDocumentIds(e.target.value)}
                placeholder="Ingrese los IDs de documentos (uno por línea o separados por coma)"
                rows={6}
                className="font-mono text-sm"
              />
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Formato: UUID, uno por línea o separados por coma
                </p>
                {parsedIds.length > 0 && (
                  <Badge variant="secondary">
                    {parsedIds.length} documento{parsedIds.length !== 1 ? 's' : ''}
                  </Badge>
                )}
              </div>
            </div>

            {/* Preview */}
            {parsedIds.length > 0 && (
              <div className="grid gap-2">
                <Label>Vista Previa</Label>
                <div className="max-h-32 overflow-auto border rounded-md p-2 bg-muted/50">
                  <div className="flex flex-wrap gap-1">
                    {parsedIds.slice(0, 10).map((id, index) => (
                      <Badge key={index} variant="outline" className="font-mono text-xs">
                        {id.length > 12 ? `${id.slice(0, 8)}...${id.slice(-4)}` : id}
                      </Badge>
                    ))}
                    {parsedIds.length > 10 && (
                      <Badge variant="secondary">
                        +{parsedIds.length - 10} más
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            )}

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
            <Button
              type="submit"
              disabled={loading || parsedIds.length === 0}
              variant={selectedOperation?.warning ? 'destructive' : 'default'}
            >
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <OperationIcon className="h-4 w-4 mr-2" />
              {operationType === 'DELETE' ? 'Eliminar' : 'Archivar'} {parsedIds.length} Documento{parsedIds.length !== 1 ? 's' : ''}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
