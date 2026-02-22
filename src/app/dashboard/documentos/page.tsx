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
import { useClientContext } from '@/components/dashboard'
import { obtenerDocumentosCargados, obtenerEstadisticasDocumentos } from './actions'
import { useSearchParams } from 'next/navigation'
import { Loader2, BarChart3, LayoutTemplate, Brain, Shield, Building2 } from 'lucide-react'
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
  const { activeClientId, clients, setActiveClientId } = useClientContext()
  const clienteId = searchParams.get('cliente_id') || activeClientId

  const [documentos, setDocumentos] = useState<DocumentoCarga[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<{
    total: number
    pendiente: number
    clasificado: number
    revisado: number
    aprobado: number
    exportado: number
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
    const searchTerm = filters.searchTerm.toLowerCase()
    const matchSearch =
      (doc.nombre_archivo ?? '').toLowerCase().includes(searchTerm) ||
      (doc.folio_documento ?? '').toLowerCase().includes(searchTerm)

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
          <h1 className="text-3xl font-bold">Documentos Tributarios</h1>
          <p className="text-muted-foreground mt-1">
            Gestiona facturas, boletas y documentos con integración Nubox
          </p>
        </div>
        {clienteId && (
          <div className="flex gap-2">
            <Link href={`/dashboard/documentos/compliance?cliente_id=${clienteId}`}>
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Cumplimiento
              </Button>
            </Link>
            <Link href={`/dashboard/documentos/intelligence?cliente_id=${clienteId}`}>
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <Brain className="h-4 w-4" />
                Inteligencia
              </Button>
            </Link>
            <Link href={`/dashboard/documentos/templates?cliente_id=${clienteId}`}>
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <LayoutTemplate className="h-4 w-4" />
                Plantillas
              </Button>
            </Link>
          </div>
        )}
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
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
              <CardTitle className="text-sm font-medium">Clasificado</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.clasificado}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Aprobado</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.aprobado}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Exportado</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{stats.exportado}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Client picker when no client is selected */}
      {!clienteId && clients.length > 0 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="py-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Selecciona un cliente para cargar documentos:</span>
              </div>
              <Select onValueChange={(val) => setActiveClientId(val)}>
                <SelectTrigger className="w-full sm:w-[300px] bg-background">
                  <SelectValue placeholder="Elegir cliente..." />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c._id} value={c._id}>
                      {c.razon_social} — {c.rut}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="list" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="list">Documentos ({stats?.total || 0})</TabsTrigger>
          <TabsTrigger value="upload">Cargar Documento</TabsTrigger>
          <TabsTrigger value="batch">Carga en Lote</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Historial de Documentos</CardTitle>
                <CardDescription>
                  {documentosFiltrados.length} de {documentos.length} documentos
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Link href="/dashboard/documentos/analytics">
                  <Button size="sm" variant="outline">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Estadísticas
                  </Button>
                </Link>
                <DocumentExportMenu documentos={documentosFiltrados} disabled={documentos.length === 0} />
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
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
      </Tabs>
    </div>
  )
}
