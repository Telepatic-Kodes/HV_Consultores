'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Loader2,
  History,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Eye,
} from 'lucide-react'
import { obtenerEntregasWebhook, reintentarEntrega } from '@/app/dashboard/documentos/automation-actions'

interface WebhookDeliveriesProps {
  webhookId: string
  webhookNombre: string
}

export function WebhookDeliveries({ webhookId, webhookNombre }: WebhookDeliveriesProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [retrying, setRetrying] = useState<string | null>(null)
  const [entregas, setEntregas] = useState<any[]>([])
  const [selectedEntrega, setSelectedEntrega] = useState<any>(null)

  const loadEntregas = async () => {
    setLoading(true)
    try {
      const data = await obtenerEntregasWebhook(webhookId)
      setEntregas(data || [])
    } catch (error) {
      console.error('Error loading deliveries:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open) {
      loadEntregas()
    }
  }, [open, webhookId])

  const handleRetry = async (entregaId: string) => {
    setRetrying(entregaId)
    try {
      await reintentarEntrega(entregaId)
      await loadEntregas()
    } catch (error) {
      console.error('Error retrying delivery:', error)
    } finally {
      setRetrying(null)
    }
  }

  const getStatusBadge = (estado: string) => {
    switch (estado) {
      case 'SUCCESS':
        return (
          <Badge className="bg-green-500 flex items-center gap-1 w-fit">
            <CheckCircle className="h-3 w-3" />
            Exitoso
          </Badge>
        )
      case 'FAILED':
        return (
          <Badge variant="destructive" className="flex items-center gap-1 w-fit">
            <XCircle className="h-3 w-3" />
            Fallido
          </Badge>
        )
      case 'RETRY':
        return (
          <Badge className="bg-amber-500 flex items-center gap-1 w-fit">
            <RefreshCw className="h-3 w-3" />
            Reintentando
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="flex items-center gap-1 w-fit">
            <Clock className="h-3 w-3" />
            Pendiente
          </Badge>
        )
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm" title="Ver historial de entregas">
            <History className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-orange-500" />
              Historial de Entregas
            </DialogTitle>
            <DialogDescription>
              Historial de entregas para el webhook: {webhookNombre}
            </DialogDescription>
          </DialogHeader>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : entregas.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No hay entregas registradas</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>HTTP Status</TableHead>
                  <TableHead>Duración</TableHead>
                  <TableHead>Intentos</TableHead>
                  <TableHead className="w-[100px]">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entregas.map((entrega) => (
                  <TableRow key={entrega.id}>
                    <TableCell>
                      {new Date(entrega.creado_en).toLocaleString('es-CL')}
                    </TableCell>
                    <TableCell>{getStatusBadge(entrega.estado)}</TableCell>
                    <TableCell>
                      {entrega.http_status ? (
                        <Badge
                          variant={entrega.http_status >= 200 && entrega.http_status < 300 ? 'default' : 'destructive'}
                          className="font-mono"
                        >
                          {entrega.http_status}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {entrega.duracion_ms ? `${entrega.duracion_ms}ms` : '-'}
                    </TableCell>
                    <TableCell>{entrega.intento_numero}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedEntrega(entrega)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {entrega.estado === 'FAILED' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRetry(entrega.id)}
                            disabled={retrying === entrega.id}
                          >
                            {retrying === entrega.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <RefreshCw className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
      </Dialog>

      {/* Detail Modal */}
      <Dialog open={!!selectedEntrega} onOpenChange={() => setSelectedEntrega(null)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Detalle de Entrega</DialogTitle>
          </DialogHeader>
          {selectedEntrega && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Estado</p>
                  <div className="mt-1">{getStatusBadge(selectedEntrega.estado)}</div>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">HTTP Status</p>
                  <p className="mt-1 font-mono">{selectedEntrega.http_status || '-'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Duración</p>
                  <p className="mt-1">{selectedEntrega.duracion_ms ? `${selectedEntrega.duracion_ms}ms` : '-'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Intentos</p>
                  <p className="mt-1">{selectedEntrega.intento_numero}</p>
                </div>
              </div>

              {selectedEntrega.evento_datos && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Payload Enviado</p>
                  <pre className="bg-muted p-3 rounded-md text-xs overflow-auto max-h-40 font-mono">
                    {JSON.stringify(selectedEntrega.evento_datos, null, 2)}
                  </pre>
                </div>
              )}

              {selectedEntrega.respuesta && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Respuesta</p>
                  <pre className="bg-muted p-3 rounded-md text-xs overflow-auto max-h-40 font-mono">
                    {selectedEntrega.respuesta}
                  </pre>
                </div>
              )}

              {selectedEntrega.estado === 'FAILED' && (
                <div className="flex justify-end">
                  <Button
                    onClick={() => {
                      handleRetry(selectedEntrega.id)
                      setSelectedEntrega(null)
                    }}
                    disabled={retrying === selectedEntrega.id}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reintentar Entrega
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
