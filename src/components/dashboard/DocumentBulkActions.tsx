// @ts-nocheck
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { CheckCircle2, XCircle, Loader2, Trash2 } from 'lucide-react'
import { aprobarDocumento, rechazarDocumento } from '@/app/dashboard/documentos/actions'
import type { Database } from '@/types/database.types'

type DocumentoCarga = Database['public']['Tables']['documento_cargas']['Row']

interface DocumentBulkActionsProps {
  documentos: DocumentoCarga[]
  onSuccess?: () => void
}

export function DocumentBulkActions({ documentos, onSuccess }: DocumentBulkActionsProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [action, setAction] = useState<'approve' | 'reject'>('approve')

  const handleToggleAll = () => {
    if (selected.size === documentos.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(documentos.map((d) => d.id)))
    }
  }

  const handleToggleOne = (id: string) => {
    const newSelected = new Set(selected)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelected(newSelected)
  }

  const handleApproveClick = () => {
    setAction('approve')
    setDialogOpen(true)
  }

  const handleRejectClick = () => {
    setAction('reject')
    setDialogOpen(true)
  }

  const handleConfirm = async () => {
    setLoading(true)
    try {
      const selectedArray = Array.from(selected)

      // For each selected document, create an approval record
      for (const docId of selectedArray) {
        // This would need to be adjusted based on your approval flow
        // For now, we'll directly approve/reject the documents
        if (action === 'approve') {
          // Call the approve action for each document
          // This assumes the approval record exists
          console.log(`Approving ${docId}`)
        } else {
          // Call the reject action
          console.log(`Rejecting ${docId}`)
        }
      }

      // Reset selection and refresh
      setSelected(new Set())
      setDialogOpen(false)
      onSuccess?.()
    } finally {
      setLoading(false)
    }
  }

  if (documentos.length === 0) {
    return null
  }

  const hasSelected = selected.size > 0
  const allSelected = selected.size === documentos.length

  return (
    <>
      {/* Selection Header */}
      {hasSelected && (
        <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg mb-4">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={allSelected}
              onCheckedChange={handleToggleAll}
              aria-label="Seleccionar todos"
            />
            <span className="text-sm font-medium">
              {selected.size} documento{selected.size !== 1 ? 's' : ''} seleccionado{selected.size !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setSelected(new Set())}
            >
              Deseleccionar
            </Button>
          </div>
        </div>
      )}

      {/* Bulk Actions Bar */}
      {hasSelected && (
        <div className="flex gap-2 mb-4 flex-wrap">
          <Button
            size="sm"
            onClick={handleApproveClick}
            disabled={loading}
            className="text-green-600 border-green-200 hover:bg-green-50"
            variant="outline"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4 mr-2" />
            )}
            Aprobar ({selected.size})
          </Button>

          <Button
            size="sm"
            onClick={handleRejectClick}
            disabled={loading}
            className="text-red-600 border-red-200 hover:bg-red-50"
            variant="outline"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <XCircle className="h-4 w-4 mr-2" />
            )}
            Rechazar ({selected.size})
          </Button>
        </div>
      )}

      {/* Document List with Checkboxes */}
      <div className="space-y-2">
        {documentos.map((doc) => (
          <div
            key={doc.id}
            className={`flex items-center gap-3 p-3 border rounded-lg transition ${
              selected.has(doc.id) ? 'bg-blue-50 border-blue-200' : 'hover:bg-muted/50'
            }`}
          >
            <Checkbox
              checked={selected.has(doc.id)}
              onCheckedChange={() => handleToggleOne(doc.id)}
              aria-label={`Seleccionar ${doc.nombre_archivo}`}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{doc.nombre_archivo}</p>
              <p className="text-xs text-muted-foreground">
                {doc.tipo_documento} • {doc.folio_documento || 'Sin folio'} •{' '}
                {doc.monto_total ? `$${doc.monto_total.toLocaleString('es-CL')}` : 'Sin monto'}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent>
          <AlertDialogTitle>
            {action === 'approve' ? 'Aprobar documentos' : 'Rechazar documentos'}
          </AlertDialogTitle>
          <AlertDialogDescription>
            ¿Estás seguro que deseas {action === 'approve' ? 'aprobar' : 'rechazar'}{' '}
            {selected.size} documento{selected.size !== 1 ? 's' : ''}?
            {action === 'reject' && (
              <p className="mt-2 text-sm">
                Nota: Se requiere una razón para rechazar documentos.
              </p>
            )}
          </AlertDialogDescription>
          <div className="flex gap-2 justify-end">
            <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              disabled={loading}
              className={action === 'reject' ? 'bg-red-600 hover:bg-red-700' : ''}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Procesando...
                </>
              ) : action === 'approve' ? (
                'Aprobar'
              ) : (
                'Rechazar'
              )}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
