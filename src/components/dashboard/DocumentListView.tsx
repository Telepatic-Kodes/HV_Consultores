// @ts-nocheck
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
import type { Database } from '@/types/database.types'

type DocumentoCarga = Database['public']['Tables']['documento_cargas']['Row']

interface DocumentListViewProps {
  documentos: DocumentoCarga[]
  onRefresh?: () => void
}

const estadoColors: Record<string, string> = {
  pendiente: 'bg-yellow-100 text-yellow-800',
  subido: 'bg-blue-100 text-blue-800',
  validado: 'bg-green-100 text-green-800',
  enviado_nubox: 'bg-purple-100 text-purple-800',
  rechazado: 'bg-red-100 text-red-800',
}

const estadoLabels: Record<string, string> = {
  pendiente: 'Pendiente',
  subido: 'Subido',
  validado: 'Validado',
  enviado_nubox: 'Enviado a Nubox',
  rechazado: 'Rechazado',
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
              <TableHead>Archivo</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Folio</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Monto</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Nubox</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {documentos.map((doc) => (
              <TableRow key={doc.id}>
                <TableCell className="font-medium text-sm">{doc.nombre_archivo}</TableCell>
                <TableCell className="text-sm">{doc.tipo_documento}</TableCell>
                <TableCell className="text-sm">{doc.folio_documento || '-'}</TableCell>
                <TableCell className="text-sm">
                  {doc.fecha_documento
                    ? new Date(doc.fecha_documento).toLocaleDateString('es-CL')
                    : '-'}
                </TableCell>
                <TableCell className="text-sm text-right">
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
