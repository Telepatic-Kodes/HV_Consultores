'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DocumentUploadForm } from '@/components/dashboard/DocumentUploadForm'
import { DocumentBatchUpload } from '@/components/dashboard/DocumentBatchUpload'
import { DocumentListView } from '@/components/dashboard/DocumentListView'
import { DocumentExportMenu } from '@/components/dashboard/DocumentExportMenu'
import { DocumentAdvancedFilters } from '@/components/dashboard/DocumentAdvancedFilters'
import { obtenerDocumentosCargados, obtenerEstadisticasDocumentos } from './actions'
import { useSearchParams } from 'next/navigation'
import { Loader2, BarChart3, LayoutTemplate, Brain, Shield } from 'lucide-react'
import Link from 'next/link'

interface DocumentoCarga {
  id: string
  cliente_id: string
  nombre_archivo: string
  tipo_documento: string
  folio_documento: string | null
  fecha_documento: string | null
  monto_total: number | null
  estado: string
  nubox_documento_id: string | null
  nubox_estado: string | null
  cargado_por: string
  cargado_en: string | null
  validado_en: string | null
  enviado_en: string | null
}

interface FilterCriteria {
  searchTerm: string
  estado: string
  tipo: string
  fechaInicio?: Date
  fechaFin?: Date
  montoMin?: number
  montoMax?: number
  nuboxOnly: boolean
}

export default function DocumentosPage() {
  const searchParams = useSearchParams()
  const clienteId = searchParams.get('cliente_id')

  const [documentos, setDocumentos] = useState<DocumentoCarga[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<{
    total: number
    pendiente: number
    subido: number
    validado: number
    enviado: number
    rechazado: number
  } | null>(null)

  // Advanced filters
  const [filters, setFilters] = useState<FilterCriteria>({
    searchTerm: '',
    estado: 'all',
    tipo: 'all',
    nuboxOnly: false,
  })

  const cargarDatos = async () => {
    setLoading(true)
    try {
      const [docs, estadisticas] = await Promise.all([
        obtenerDocumentosCargados(clienteId || undefined),
        obtenerEstadisticasDocumentos(clienteId || undefined),
      ])
      setDocumentos(docs)
      setStats(estadisticas)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarDatos()
  }, [clienteId])

  // Filter documents
  const documentosFiltrados = documentos.filter((doc) => {
    // Search filter
    const matchSearch =
      doc.nombre_archivo.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
      doc.folio_documento?.toLowerCase().includes(filters.searchTerm.toLowerCase())

    // Status filter
    const matchEstado = filters.estado === 'all' || doc.estado === filters.estado

    // Type filter
    const matchTipo = filters.tipo === 'all' || doc.tipo_documento === filters.tipo

    // Date range filter
    const matchFecha =
      (!filters.fechaInicio || (doc.cargado_en && new Date(doc.cargado_en) >= filters.fechaInicio)) &&
      (!filters.fechaFin || (doc.cargado_en && new Date(doc.cargado_en) <= filters.fechaFin))

    // Amount range filter
    const matchMonto =
      (!filters.montoMin || (doc.monto_total && doc.monto_total >= filters.montoMin)) &&
      (!filters.montoMax || (doc.monto_total && doc.monto_total <= filters.montoMax))

    // Nubox filter
    const matchNubox = !filters.nuboxOnly || !!doc.nubox_documento_id

    return matchSearch && matchEstado && matchTipo && matchFecha && matchMonto && matchNubox
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Carga de Documentos</h1>
          <p className="text-muted-foreground mt-1">
            Carga y gestiona tus documentos tributarios con integración Nubox
          </p>
        </div>
        {clienteId && (
          <div className="flex gap-2">
            <Link href={`/dashboard/documentos/compliance?cliente_id=${clienteId}`}>
              <Button variant="outline" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Compliance
              </Button>
            </Link>
            <Link href={`/dashboard/documentos/intelligence?cliente_id=${clienteId}`}>
              <Button variant="outline" className="flex items-center gap-2">
                <Brain className="h-4 w-4" />
                Intelligence
              </Button>
            </Link>
            <Link href={`/dashboard/documentos/templates?cliente_id=${clienteId}`}>
              <Button variant="outline" className="flex items-center gap-2">
                <LayoutTemplate className="h-4 w-4" />
                Plantillas
              </Button>
            </Link>
          </div>
        )}
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Pendiente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.pendiente}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Validado</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.validado}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Enviado</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{stats.enviado}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Rechazado</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.rechazado}</div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upload">Cargar Documento</TabsTrigger>
          <TabsTrigger value="batch">Carga en Lote</TabsTrigger>
          <TabsTrigger value="list">Documentos ({stats?.total || 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="mt-6">
          <DocumentUploadForm clienteId={clienteId || ''} onSuccess={cargarDatos} />
        </TabsContent>

        <TabsContent value="batch" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Carga en Lote</CardTitle>
              <CardDescription>
                Carga múltiples documentos a la vez
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DocumentBatchUpload clienteId={clienteId || ''} onSuccess={cargarDatos} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="list" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Historial de Documentos</CardTitle>
                <CardDescription>
                  Gestiona y monitorea tus documentos cargados ({documentosFiltrados.length} de {documentos.length})
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Link href="/dashboard/documentos/analytics">
                  <Button size="sm" variant="outline">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Analytics
                  </Button>
                </Link>
                <DocumentExportMenu documentos={documentosFiltrados} disabled={documentos.length === 0} />
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Advanced Filters */}
              <DocumentAdvancedFilters
                onFiltersChange={setFilters}
                onReset={() => setFilters({
                  searchTerm: '',
                  estado: 'all',
                  tipo: 'all',
                  nuboxOnly: false,
                })}
              />

              <DocumentListView documentos={documentosFiltrados} onRefresh={cargarDatos} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
