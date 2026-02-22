'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
import { TopNav, useClientContext } from '@/components/dashboard'
import { obtenerDocumentosCargados, obtenerEstadisticasDocumentos } from './actions'
import { useSearchParams } from 'next/navigation'
import {
  Loader2,
  BarChart3,
  FileText,
  Clock,
  CheckCircle2,
  PackageCheck,
  FolderOpen,
  Building2,
} from 'lucide-react'
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

const STAT_CARDS = [
  { key: 'total', label: 'Total', icon: FileText, color: 'primary' },
  { key: 'pendiente', label: 'Pendientes', icon: Clock, color: 'amber' },
  { key: 'clasificado', label: 'Clasificados', icon: FolderOpen, color: 'blue' },
  { key: 'aprobado', label: 'Aprobados', icon: CheckCircle2, color: 'emerald' },
  { key: 'exportado', label: 'Exportados', icon: PackageCheck, color: 'violet' },
] as const

const COLOR_MAP: Record<string, string> = {
  primary: 'bg-primary/10 ring-primary/20 text-primary',
  amber: 'bg-amber-500/10 ring-amber-500/20 text-amber-500',
  blue: 'bg-blue-500/10 ring-blue-500/20 text-blue-500',
  emerald: 'bg-emerald-500/10 ring-emerald-500/20 text-emerald-500',
  violet: 'bg-violet-500/10 ring-violet-500/20 text-violet-500',
}

const VALUE_COLOR: Record<string, string> = {
  primary: '',
  amber: 'text-amber-600',
  blue: 'text-blue-600',
  emerald: 'text-emerald-600',
  violet: 'text-violet-600',
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
    const searchTerm = filters.searchTerm.toLowerCase()
    const matchSearch =
      (doc.nombre_archivo ?? '').toLowerCase().includes(searchTerm) ||
      (doc.folio_documento ?? '').toLowerCase().includes(searchTerm)
    const matchEstado = filters.estado === 'all' || doc.estado === filters.estado
    const matchTipo = filters.tipo === 'all' || doc.tipo_documento === filters.tipo
    const matchFecha =
      (!filters.fechaInicio || (doc.cargado_en && new Date(doc.cargado_en) >= filters.fechaInicio)) &&
      (!filters.fechaFin || (doc.cargado_en && new Date(doc.cargado_en) <= filters.fechaFin))
    const matchMonto =
      (!filters.montoMin || (doc.monto_total && doc.monto_total >= filters.montoMin)) &&
      (!filters.montoMax || (doc.monto_total && doc.monto_total <= filters.montoMax))
    const matchNubox = !filters.nuboxOnly || !!doc.nubox_documento_id

    return matchSearch && matchEstado && matchTipo && matchFecha && matchMonto && matchNubox
  })

  if (loading) {
    return (
      <>
        <TopNav title="Documentos Tributarios" subtitle="Gestiona facturas, boletas y documentos con integración Nubox" />
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </>
    )
  }

  return (
    <>
      <TopNav title="Documentos Tributarios" subtitle="Gestiona facturas, boletas y documentos con integración Nubox" />

      <main className="p-4 md:p-6 lg:p-8 space-y-6">
        {/* Stats row */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {STAT_CARDS.map(({ key, label, icon: Icon, color }) => (
              <Card key={key} className="group hover:shadow-executive-md transition-all duration-200">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center ring-1 group-hover:scale-105 transition-transform ${COLOR_MAP[color]}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className={`text-xl font-bold font-mono ${VALUE_COLOR[color]}`}>
                        {stats[key as keyof typeof stats]}
                      </p>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                        {label}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
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

        {/* Main content */}
        <Tabs defaultValue="list" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="list">Documentos ({stats?.total || 0})</TabsTrigger>
            <TabsTrigger value="upload">Cargar Documento</TabsTrigger>
            <TabsTrigger value="batch">Carga en Lote</TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="mt-6">
            <Card className="border-border/50 shadow-executive">
              <CardHeader className="flex flex-row items-center justify-between pb-4">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <FileText className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Historial de Documentos</CardTitle>
                    <CardDescription className="text-xs mt-0.5">
                      {documentosFiltrados.length} de {documentos.length} documentos
                    </CardDescription>
                  </div>
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
            <Card className="border-border/50 shadow-executive">
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
      </main>
    </>
  )
}
