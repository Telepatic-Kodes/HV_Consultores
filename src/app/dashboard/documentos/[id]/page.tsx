'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DocumentWorkflowTimeline } from '@/components/dashboard/DocumentWorkflowTimeline'
import { obtenerDocumentosCargados } from '../actions'
import { obtenerEstadoNubox } from '../nubox-actions'
import { Loader2, ArrowLeft, Send, CheckCircle, Download } from 'lucide-react'
import Link from 'next/link'
import type { Database } from '@/types/database.types'

type DocumentoCarga = Database['public']['Tables']['documento_cargas']['Row']
type DocumentoWorkflow = Database['public']['Tables']['documento_workflow']['Row']

interface DocumentoConWorkflow extends DocumentoCarga {
  workflow?: DocumentoWorkflow[]
}

export default function DocumentDetailPage() {
  const params = useParams()
  const documentoId = params.id as string

  const [documento, setDocumento] = useState<DocumentoConWorkflow | null>(null)
  const [loading, setLoading] = useState(true)
  const [checkingStatus, setCheckingStatus] = useState(false)

  useEffect(() => {
    const cargarDocumento = async () => {
      setLoading(true)
      try {
        const documentos = await obtenerDocumentosCargados()
        const doc = documentos.find((d) => d.id === documentoId)
        if (doc) {
          setDocumento(doc)
        }
      } finally {
        setLoading(false)
      }
    }

    cargarDocumento()
  }, [documentoId])

  const handleCheckStatus = async () => {
    if (!documento?.nubox_documento_id) return

    setCheckingStatus(true)
    try {
      const result = await obtenerEstadoNubox(documento.id)
      if (result.success) {
        // Reload documento
        const documentos = await obtenerDocumentosCargados()
        const updated = documentos.find((d) => d.id === documentoId)
        if (updated) {
          setDocumento(updated)
        }
      }
    } finally {
      setCheckingStatus(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!documento) {
    return (
      <div className="space-y-4">
        <Link href="/dashboard/documentos">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </Link>
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            Documento no encontrado
          </CardContent>
        </Card>
      </div>
    )
  }

  const estadoColors: Record<string, string> = {
    pendiente: 'bg-yellow-100 text-yellow-800',
    subido: 'bg-blue-100 text-blue-800',
    validado: 'bg-green-100 text-green-800',
    enviado_nubox: 'bg-purple-100 text-purple-800',
    rechazado: 'bg-red-100 text-red-800',
  }

  return (
    <div className="space-y-6">
      <Link href="/dashboard/documentos">
        <Button variant="outline" size="sm">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
      </Link>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Info */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl">{documento.nombre_archivo}</CardTitle>
                  <CardDescription className="mt-2">
                    Cargado el{' '}
                    {documento.cargado_en
                      ? new Date(documento.cargado_en).toLocaleDateString('es-CL', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : 'N/A'}
                  </CardDescription>
                </div>
                <Badge className={estadoColors[documento.estado] || 'bg-gray-100 text-gray-800'}>
                  {documento.estado}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Tipo</p>
                  <p className="font-medium">{documento.tipo_documento}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tamaño</p>
                  <p className="font-medium">
                    {(documento.tamaño_bytes / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Folio</p>
                  <p className="font-medium">{documento.folio_documento || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Fecha</p>
                  <p className="font-medium">
                    {documento.fecha_documento
                      ? new Date(documento.fecha_documento).toLocaleDateString('es-CL')
                      : 'N/A'}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground">Monto</p>
                  <p className="font-medium text-lg">
                    {documento.monto_total
                      ? `$${documento.monto_total.toLocaleString('es-CL')}`
                      : 'N/A'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Workflow Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Historial de Actividad</CardTitle>
            </CardHeader>
            <CardContent>
              {documento.workflow && documento.workflow.length > 0 ? (
                <DocumentWorkflowTimeline workflow={documento.workflow} />
              ) : (
                <p className="text-muted-foreground text-sm">Sin actividad registrada</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-4">
          {/* Nubox Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Estado Nubox</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {documento.nubox_documento_id ? (
                <>
                  <div>
                    <p className="text-sm text-muted-foreground">ID en Nubox</p>
                    <p className="font-mono text-sm break-all">{documento.nubox_documento_id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Estado</p>
                    <p className="font-medium">{documento.nubox_estado || 'Procesando'}</p>
                  </div>
                  <Button
                    onClick={handleCheckStatus}
                    disabled={checkingStatus}
                    className="w-full"
                    size="sm"
                    variant="outline"
                  >
                    {checkingStatus ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Verificando...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Actualizar Estado
                      </>
                    )}
                  </Button>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No enviado a Nubox
                </p>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Acciones</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full" size="sm" variant="outline" disabled>
                <Download className="h-4 w-4 mr-2" />
                Descargar
              </Button>
              <Button className="w-full" size="sm" variant="outline" disabled>
                <CheckCircle className="h-4 w-4 mr-2" />
                Ver Validación
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
