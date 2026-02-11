// @ts-nocheck
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase-browser'
import { aprobarDocumento, rechazarDocumento } from '../actions'
import type { Database } from '@/types/database.types'

type DocumentoCarga = Database['public']['Tables']['documento_cargas']['Row']
type DocumentoAprobacion = Database['public']['Tables']['documento_aprobaciones']['Row']

interface AprobacionConDocumento extends DocumentoAprobacion {
  documento?: DocumentoCarga
}

export default function AprobacionesPage() {
  const [aprobaciones, setAprobaciones] = useState<AprobacionConDocumento[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const cargarAprobaciones = async () => {
    setLoading(true)
    try {
      const supabase = createClient()

      const { data, error } = await supabase
        .from('documento_aprobaciones')
        .select(
          `
          *,
          documento:documento_cargas(*)
        `
        )
        .eq('estado', 'pendiente')
        .order('creado_en', { ascending: false })

      if (error) {
        console.error('Error cargando aprobaciones:', error)
      } else {
        setAprobaciones(data || [])
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarAprobaciones()
  }, [])

  const handleApprove = async (aprobacionId: string) => {
    setActionLoading(aprobacionId)
    try {
      const result = await aprobarDocumento(aprobacionId)
      if (result.success) {
        await cargarAprobaciones()
      } else {
        alert(`Error: ${result.error}`)
      }
    } finally {
      setActionLoading(null)
    }
  }

  const handleRejectClick = (aprobacionId: string) => {
    setSelectedId(aprobacionId)
    setRejectReason('')
    setDialogOpen(true)
  }

  const handleRejectConfirm = async () => {
    if (!selectedId || !rejectReason.trim()) return

    setActionLoading(selectedId)
    try {
      const result = await rechazarDocumento(selectedId, rejectReason)
      if (result.success) {
        setDialogOpen(false)
        await cargarAprobaciones()
      } else {
        alert(`Error: ${result.error}`)
      }
    } finally {
      setActionLoading(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Aprobaciones Pendientes</h1>
        <p className="text-muted-foreground mt-1">
          Revisa y aprueba documentos antes de enviarlos a Nubox
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Documentos Pendientes de Aprobación</CardTitle>
          <CardDescription>
            Total: {aprobaciones.length} documento{aprobaciones.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {aprobaciones.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay documentos pendientes de aprobación
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Archivo</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Folio</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead>Cargado</TableHead>
                    <TableHead className="w-24">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {aprobaciones.map((aprobacion) => (
                    <TableRow key={aprobacion.id}>
                      <TableCell className="font-medium text-sm max-w-xs truncate">
                        {aprobacion.documento?.nombre_archivo}
                      </TableCell>
                      <TableCell className="text-sm">{aprobacion.documento?.tipo_documento}</TableCell>
                      <TableCell className="text-sm">{aprobacion.documento?.folio_documento || '-'}</TableCell>
                      <TableCell className="text-sm text-right">
                        {aprobacion.documento?.monto_total
                          ? `$${aprobacion.documento.monto_total.toLocaleString('es-CL')}`
                          : '-'}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {aprobacion.creado_en
                          ? new Date(aprobacion.creado_en).toLocaleDateString('es-CL')
                          : '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleApprove(aprobacion.id)}
                            disabled={actionLoading === aprobacion.id}
                            className="text-green-600 hover:text-green-700"
                          >
                            {actionLoading === aprobacion.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <CheckCircle2 className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRejectClick(aprobacion.id)}
                            disabled={actionLoading === aprobacion.id}
                            className="text-red-600 hover:text-red-700"
                          >
                            {actionLoading === aprobacion.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <XCircle className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rechazar Documento</DialogTitle>
            <DialogDescription>
              Por favor proporciona una razón para rechazar este documento
            </DialogDescription>
          </DialogHeader>

          <Textarea
            placeholder="Razón del rechazo..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            rows={4}
          />

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleRejectConfirm}
              disabled={!rejectReason.trim() || actionLoading !== null}
              variant="destructive"
            >
              {actionLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Procesando...
                </>
              ) : (
                'Rechazar'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
