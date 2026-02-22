'use client'

import { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { MoreVertical, Send, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { enviarDocumentoANubox, obtenerEstadoNubox } from '@/app/dashboard/documentos/nubox-actions'
import { cambiarEstadoDocumento } from '@/app/dashboard/documentos/actions'

const DOC_TYPE_LABELS: Record<string, string> = {
  '33': 'Factura Electrónica',
  '34': 'Factura Exenta',
  '39': 'Boleta Electrónica',
  '41': 'Boleta Exenta',
  '43': 'Liquidación Factura',
  '46': 'Factura Compra',
  '52': 'Guía de Despacho',
  '56': 'Nota de Débito',
  '61': 'Nota de Crédito',
  '110': 'Factura Exportación',
  '112': 'Nota Crédito Exp.',
}

function formatDocLabel(doc: DocumentoCarga): string {
  const tipo = DOC_TYPE_LABELS[doc.tipo_documento] ?? `Doc. Tipo ${doc.tipo_documento}`
  if (doc.nombre_archivo) return doc.nombre_archivo
  const folio = doc.folio_documento ? ` #${doc.folio_documento}` : ''
  const emisor = doc.razon_social_emisor ? ` — ${doc.razon_social_emisor}` : ''
  return `${tipo}${folio}${emisor}`
}

interface DocumentoCarga {
  id: string
  nombre_archivo?: string
  tipo_documento: string
  folio_documento?: string | null
  fecha_documento?: string | null
  monto_total?: number | null
  estado: string
  nubox_documento_id?: string | null
  nubox_estado?: string | null
  rut_emisor?: string | null
  razon_social_emisor?: string | null
}

interface DocumentListViewProps {
  documentos: DocumentoCarga[]
  onRefresh?: () => void
}

const estadoColors: Record<string, string> = {
  pendiente: 'bg-yellow-100 text-yellow-800',
  clasificado: 'bg-blue-100 text-blue-800',
  revisado: 'bg-indigo-100 text-indigo-800',
  aprobado: 'bg-green-100 text-green-800',
  exportado: 'bg-purple-100 text-purple-800',
  rechazado: 'bg-red-100 text-red-800',
  subido: 'bg-sky-100 text-sky-800',
  validado: 'bg-emerald-100 text-emerald-800',
  enviado_nubox: 'bg-violet-100 text-violet-800',
}

const estadoLabels: Record<string, string> = {
  pendiente: 'Pendiente',
  clasificado: 'Clasificado',
  revisado: 'Revisado',
  aprobado: 'Aprobado',
  exportado: 'Exportado',
  rechazado: 'Rechazado',
  subido: 'Subido',
  validado: 'Validado',
  enviado_nubox: 'Enviado a Nubox',
}

export function DocumentListView({ documentos, onRefresh }: DocumentListViewProps) {
  const [loading, setLoading] = useState<string | null>(null)
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null)
  const [showDialog, setShowDialog] = useState(false)
  const [action, setAction] = useState<'approve' | 'reject' | 'send_nubox' | 'check_status'>('approve')

  const handleSendToNubox = async (doc: DocumentoCarga) => {
    setLoading(doc.id)
    try {
      const result = await enviarDocumentoANubox(doc.id, {
        folio: doc.folio_documento || '',
        fechaEmision: doc.fecha_documento || new Date().toISOString().split('T')[0],
        montoTotal: doc.monto_total || 0,
        rutEmisor: doc.rut_emisor || '',
        razonSocialEmisor: doc.razon_social_emisor || '',
      })

      if (result.success) {
        onRefresh?.()
      } else {
        alert(`Error: ${result.error}`)
      }
    } finally {
      setLoading(null)
    }
  }

  const handleCheckStatus = async (doc: DocumentoCarga) => {
    if (!doc.nubox_documento_id) {
      alert('Este documento no está en Nubox')
      return
    }

    setLoading(doc.id)
    try {
      const result = await obtenerEstadoNubox(doc.id)
      if (result.success) {
        alert(`Estado en Nubox: ${result.estado}`)
        onRefresh?.()
      } else {
        alert(`Error: ${result.error}`)
      }
    } finally {
      setLoading(null)
    }
  }

  const handleApprove = async (doc: DocumentoCarga) => {
    setLoading(doc.id)
    try {
      const result = await cambiarEstadoDocumento(doc.id, 'validado', 'Aprobado por usuario')
      if (result.success) {
        onRefresh?.()
      } else {
        alert(`Error: ${result.error}`)
      }
    } finally {
      setLoading(null)
    }
  }

  const handleReject = async (doc: DocumentoCarga) => {
    setLoading(doc.id)
    try {
      const result = await cambiarEstadoDocumento(doc.id, 'rechazado', 'Rechazado por usuario')
      if (result.success) {
        onRefresh?.()
      } else {
        alert(`Error: ${result.error}`)
      }
    } finally {
      setLoading(null)
    }
  }

  if (!documentos.length) {
    return (
      <div className="text-center p-8 border rounded-lg bg-muted/30">
        <p className="text-muted-foreground">No hay documentos cargados</p>
      </div>
    )
  }

  return (
    <>
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Documento</TableHead>
              <TableHead>Monto</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Nubox</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {documentos.map((doc) => (
              <TableRow key={doc.id}>
                <TableCell>
                  <div className="font-medium text-sm">{formatDocLabel(doc)}</div>
                  <div className="text-xs text-muted-foreground">
                    {doc.folio_documento ? `Folio ${doc.folio_documento}` : ''}{doc.folio_documento && doc.fecha_documento ? ' · ' : ''}{doc.fecha_documento ? new Date(doc.fecha_documento).toLocaleDateString('es-CL') : ''}
                  </div>
                </TableCell>
                <TableCell className="text-sm text-right font-mono">
                  {doc.monto_total ? `$${doc.monto_total.toLocaleString('es-CL')}` : '-'}
                </TableCell>
                <TableCell>
                  <Badge className={estadoColors[doc.estado] || 'bg-gray-100 text-gray-800'}>
                    {estadoLabels[doc.estado] || doc.estado}
                  </Badge>
                </TableCell>
                <TableCell>
                  {doc.nubox_documento_id ? (
                    <Badge variant="outline" className="text-xs">
                      {doc.nubox_estado || 'Enviado'}
                    </Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={loading === doc.id}
                        className="h-8 w-8 p-0"
                      >
                        {loading === doc.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <MoreVertical className="h-4 w-4" />
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {doc.estado === 'pendiente' && (
                        <>
                          <DropdownMenuItem onClick={() => handleApprove(doc)}>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Aprobar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleReject(doc)}>
                            <XCircle className="h-4 w-4 mr-2" />
                            Rechazar
                          </DropdownMenuItem>
                        </>
                      )}
                      {doc.estado === 'validado' && !doc.nubox_documento_id && (
                        <DropdownMenuItem onClick={() => handleSendToNubox(doc)}>
                          <Send className="h-4 w-4 mr-2" />
                          Enviar a Nubox
                        </DropdownMenuItem>
                      )}
                      {doc.nubox_documento_id && (
                        <DropdownMenuItem onClick={() => handleCheckStatus(doc)}>
                          <Loader2 className="h-4 w-4 mr-2" />
                          Actualizar Estado
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
        <AlertDialogContent>
          <AlertDialogTitle>Confirmar acción</AlertDialogTitle>
          <AlertDialogDescription>
            ¿Estás seguro que deseas {action === 'approve' ? 'aprobar' : 'rechazar'} este documento?
          </AlertDialogDescription>
          <div className="flex gap-2 justify-end">
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction>Confirmar</AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
