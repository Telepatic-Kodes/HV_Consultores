'use client'

import { useState, useTransition, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  BarChart3,
  Download,
  Calendar,
  TrendingUp,
  TrendingDown,
  FileText,
  Users,
  Clock,
  Target,
  Bot,
  MessageSquare,
  Loader2,
  X,
  FileSpreadsheet,
  Building2,
  RefreshCw,
  Presentation,
  LineChart,
  ArrowRight,
} from 'lucide-react'
import {
  generarReporte,
  getClientesParaReportes,
  getDatosF29ParaReporte,
  getDocumentosParaReporte,
  getResumenMensualParaReporte,
  getPeriodosDisponibles,
} from './actions'
import type { MetricaGeneral, ReporteDisponible, DatosGrafico } from './actions'
import {
  generarPDFF29,
  generarPDFResumenMensual,
  generarExcelDocumentos,
  generarExcelF29
} from '@/lib/reportes'

interface ReportesContentProps {
  metricas: MetricaGeneral[]
  reportes: ReporteDisponible[]
  datosEvolucion: DatosGrafico[]
  productividad: { contador: string; documentos: number; clasificados: number }[]
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  'resumen-mensual': BarChart3,
  'productividad-contador': Users,
  'precision-clasificador': Target,
  'estado-f29': FileText,
  'actividad-bots': Bot,
  'uso-chat': MessageSquare,
}

export function ReportesContent({
  metricas,
  reportes,
  datosEvolucion,
  productividad,
}: ReportesContentProps) {
  const [isPending, startTransition] = useTransition()
  const [periodoGrafico, setPeriodoGrafico] = useState('6')
  const [reporteModal, setReporteModal] = useState<{ nombre: string; data: any } | null>(null)
  const [generando, setGenerando] = useState<string | null>(null)

  // Estados para descarga de reportes
  const [clientes, setClientes] = useState<{ id: string; rut: string; razon_social: string }[]>([])
  const [clienteSeleccionado, setClienteSeleccionado] = useState<string>('')
  const [periodos, setPeriodos] = useState<string[]>([])
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState<string>('')
  const [cargandoClientes, setCargandoClientes] = useState(true)
  const [cargandoPeriodos, setCargandoPeriodos] = useState(false)
  const [descargando, setDescargando] = useState<string | null>(null)
  const [errorDescarga, setErrorDescarga] = useState<string | null>(null)

  // Cargar clientes al montar
  useEffect(() => {
    const cargarClientes = async () => {
      setCargandoClientes(true)
      const data = await getClientesParaReportes()
      setClientes(data)
      setCargandoClientes(false)
    }
    cargarClientes()
  }, [])

  // Cargar períodos cuando cambia el cliente
  useEffect(() => {
    const cargarPeriodos = async () => {
      if (!clienteSeleccionado) {
        setPeriodos([])
        setPeriodoSeleccionado('')
        return
      }
      setCargandoPeriodos(true)
      const data = await getPeriodosDisponibles(clienteSeleccionado)
      setPeriodos(data)
      if (data.length > 0) {
        setPeriodoSeleccionado(data[0])
      } else {
        setPeriodoSeleccionado('')
      }
      setCargandoPeriodos(false)
    }
    cargarPeriodos()
  }, [clienteSeleccionado])

  // Handlers para descargar reportes
  const handleDescargarF29PDF = async () => {
    if (!clienteSeleccionado || !periodoSeleccionado) return
    setDescargando('f29-pdf')
    setErrorDescarga(null)
    try {
      const datos = await getDatosF29ParaReporte(clienteSeleccionado, periodoSeleccionado)
      if (datos) {
        generarPDFF29(datos)
      } else {
        setErrorDescarga('No hay datos de F29 para este período')
      }
    } catch (error) {
      setErrorDescarga('Error al generar el PDF')
    }
    setDescargando(null)
  }

  const handleDescargarF29Excel = async () => {
    if (!clienteSeleccionado || !periodoSeleccionado) return
    setDescargando('f29-excel')
    setErrorDescarga(null)
    try {
      const datos = await getDatosF29ParaReporte(clienteSeleccionado, periodoSeleccionado)
      if (datos) {
        generarExcelF29(datos)
      } else {
        setErrorDescarga('No hay datos de F29 para este período')
      }
    } catch (error) {
      setErrorDescarga('Error al generar el Excel')
    }
    setDescargando(null)
  }

  const handleDescargarDocumentosExcel = async () => {
    if (!clienteSeleccionado || !periodoSeleccionado) return
    setDescargando('docs-excel')
    setErrorDescarga(null)
    try {
      const datos = await getDocumentosParaReporte(clienteSeleccionado, periodoSeleccionado)
      if (datos && datos.documentos.length > 0) {
        generarExcelDocumentos(datos)
      } else {
        setErrorDescarga('No hay documentos para este período')
      }
    } catch (error) {
      setErrorDescarga('Error al generar el Excel')
    }
    setDescargando(null)
  }

  const handleDescargarResumenPDF = async () => {
    if (!clienteSeleccionado || !periodoSeleccionado) return
    setDescargando('resumen-pdf')
    setErrorDescarga(null)
    try {
      const datos = await getResumenMensualParaReporte(clienteSeleccionado, periodoSeleccionado)
      if (datos) {
        generarPDFResumenMensual(datos)
      } else {
        setErrorDescarga('No hay datos para este período')
      }
    } catch (error) {
      setErrorDescarga('Error al generar el PDF')
    }
    setDescargando(null)
  }

  const maxDocs = Math.max(...datosEvolucion.map((d) => d.documentos || 0), 1)
  const maxHoras = Math.max(...datosEvolucion.map((d) => d.horasAhorradas || 0), 1)

  const handleGenerarReporte = async (reporte: ReporteDisponible) => {
    setGenerando(reporte.id)
    startTransition(async () => {
      const result = await generarReporte(reporte.id)
      if (result.success && result.data) {
        setReporteModal({ nombre: reporte.nombre || reporte.titulo || reporte.id, data: result.data })
      }
      setGenerando(null)
    })
  }

  const handleDescargar = (reporte: ReporteDisponible) => {
    // En producción, esto generaría un PDF o Excel
    const data = JSON.stringify({ reporte: reporte.nombre, fecha: new Date().toISOString() })
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${reporte.id}-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <main className="p-8 space-y-6">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-1 w-8 bg-gradient-to-r from-primary to-secondary rounded-full" />
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Análisis y Reportes
          </span>
        </div>
      </div>

      {/* Executive Modules Navigation */}
      <div className="grid gap-4 md:grid-cols-2">
        <Link href="/dashboard/reportes/ejecutivo">
          <Card className="group cursor-pointer border-executive-navy/20 hover:border-executive-navy/50 hover:shadow-executive-md transition-all duration-300 bg-gradient-to-br from-[#0f3460]/5 to-transparent">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-[#0f3460] to-[#1a5091] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <LineChart className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-foreground group-hover:text-[#0f3460] transition-colors">
                      Dashboard Ejecutivo
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      KPIs premium, waterfall, insights automáticos
                    </p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-[#0f3460] group-hover:translate-x-1 transition-all" />
              </div>
              <div className="mt-4 flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-[#0f3460]/10 text-[#0f3460] text-[10px] font-semibold uppercase tracking-wider">
                  Estilo McKinsey
                </span>
                <span className="px-2 py-0.5 rounded-full bg-[#d4a418]/10 text-[#d4a418] text-[10px] font-semibold uppercase tracking-wider">
                  Premium
                </span>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/reportes/presentacion">
          <Card className="group cursor-pointer border-executive-navy/20 hover:border-executive-navy/50 hover:shadow-executive-md transition-all duration-300 bg-gradient-to-br from-[#1a5091]/5 to-transparent">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-[#1a5091] to-[#0f3460] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <Presentation className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-foreground group-hover:text-[#1a5091] transition-colors">
                      Presentacion Board
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Diapositivas profesionales para directorio
                    </p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-[#1a5091] group-hover:translate-x-1 transition-all" />
              </div>
              <div className="mt-4 flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-[#1a5091]/10 text-[#1a5091] text-[10px] font-semibold uppercase tracking-wider">
                  Pantalla Completa
                </span>
                <span className="px-2 py-0.5 rounded-full bg-[#059669]/10 text-[#059669] text-[10px] font-semibold uppercase tracking-wider">
                  Auto-play
                </span>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Metrics Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        {metricas.map((metrica) => {
          const isPositive = (metrica.trend || '').startsWith('+') || (metrica.trend || '').startsWith('-0')
          return (
            <Card key={metrica.label} className="group hover:shadow-executive-md transition-all duration-200">
              <CardContent className="pt-5 pb-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/70">{metrica.label}</p>
                    <p className="text-3xl font-bold mt-2 font-mono tracking-tight">{metrica.value}</p>
                    <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider">{metrica.subtitle}</p>
                  </div>
                  <span
                    className={`text-xs font-bold flex items-center gap-1 px-2 py-1 rounded-full ${
                      isPositive ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
                    }`}
                  >
                    {isPositive ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    {metrica.trend}
                  </span>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Chart */}
        <Card className="lg:col-span-2 border-border/50 shadow-executive">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <BarChart3 className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">Evolución Mensual</CardTitle>
                  <CardDescription className="text-xs mt-0.5">Documentos procesados vs horas ahorradas</CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <select
                  className="h-9 rounded-lg border border-border/50 bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  value={periodoGrafico}
                  onChange={(e) => setPeriodoGrafico(e.target.value)}
                >
                  <option value="6">Últimos 6 meses</option>
                  <option value="12">Último año</option>
                </select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-end justify-between gap-2 px-2">
              {datosEvolucion.map((dato, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full flex gap-1 justify-center h-48">
                    <div
                      className="flex-1 max-w-8 bg-gradient-to-t from-primary/30 to-primary/10 rounded-t transition-all hover:from-primary/50 hover:to-primary/30 relative group cursor-pointer"
                      style={{ height: `${((dato.documentos || 0) / maxDocs) * 100}%`, minHeight: '4px' }}
                    >
                      <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold font-mono opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-foreground text-background px-1.5 py-0.5 rounded">
                        {dato.documentos || 0}
                      </span>
                    </div>
                    <div
                      className="flex-1 max-w-8 bg-gradient-to-t from-success/30 to-success/10 rounded-t transition-all hover:from-success/50 hover:to-success/30 relative group cursor-pointer"
                      style={{
                        height: `${((dato.horasAhorradas || 0) / maxHoras) * 100}%`,
                        minHeight: '4px',
                      }}
                    >
                      <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold font-mono opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-foreground text-background px-1.5 py-0.5 rounded">
                        {dato.horasAhorradas || 0}h
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">{dato.mes}</span>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-4 border-t border-border/30 flex items-center justify-center gap-8 text-sm">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded bg-gradient-to-t from-primary/50 to-primary/30" />
                <span className="text-xs text-muted-foreground">Documentos</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded bg-gradient-to-t from-success/50 to-success/30" />
                <span className="text-xs text-muted-foreground">Horas Ahorradas</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Productividad */}
        <Card className="border-border/50 shadow-executive">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-secondary/10 flex items-center justify-center">
                <Users className="h-4 w-4 text-secondary" />
              </div>
              <div>
                <CardTitle className="text-base">Productividad</CardTitle>
                <CardDescription className="text-xs mt-0.5">Este mes por contador</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {productividad.length === 0 ? (
              <div className="text-center py-10">
                <div className="h-12 w-12 mx-auto rounded-xl bg-muted/50 flex items-center justify-center mb-3">
                  <Users className="h-6 w-6 text-muted-foreground/50" />
                </div>
                <p className="text-sm text-muted-foreground">Sin datos de productividad</p>
              </div>
            ) : (
              <div className="space-y-4">
                {productividad.map((p, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-semibold truncate text-foreground">{p.contador}</span>
                      <span className="text-xs font-mono text-muted-foreground">
                        <span className="text-foreground font-bold">{p.clasificados}</span>/{p.documentos}
                      </span>
                    </div>
                    <div className="h-2 bg-muted/50 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary to-secondary transition-all rounded-full"
                        style={{
                          width: `${p.documentos > 0 ? (p.clasificados / p.documentos) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Seccion de Descarga de Reportes */}
      <Card className="border-border/50 shadow-executive bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-sm">
              <Download className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Descargar Reportes</CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Genera reportes PDF y Excel para un cliente y periodo especifico
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Selectores */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Building2 className="h-3.5 w-3.5" />
                Cliente
              </label>
              <select
                className="w-full h-11 rounded-lg border border-border/50 bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                value={clienteSeleccionado}
                onChange={(e) => setClienteSeleccionado(e.target.value)}
                disabled={cargandoClientes}
              >
                <option value="">
                  {cargandoClientes ? 'Cargando clientes...' : 'Seleccionar cliente'}
                </option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.razon_social} ({c.rut})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5" />
                Periodo
              </label>
              <select
                className="w-full h-11 rounded-lg border border-border/50 bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                value={periodoSeleccionado}
                onChange={(e) => setPeriodoSeleccionado(e.target.value)}
                disabled={!clienteSeleccionado || cargandoPeriodos}
              >
                <option value="">
                  {cargandoPeriodos
                    ? 'Cargando periodos...'
                    : !clienteSeleccionado
                      ? 'Primero selecciona un cliente'
                      : periodos.length === 0
                        ? 'Sin periodos disponibles'
                        : 'Seleccionar periodo'}
                </option>
                {periodos.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Error message */}
          {errorDescarga && (
            <div className="p-4 rounded-lg bg-destructive/5 border border-destructive/20 text-destructive text-sm flex items-center gap-3">
              <X className="h-4 w-4 shrink-0" />
              {errorDescarga}
            </div>
          )}

          {/* Botones de descarga */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* F29 PDF */}
            <div className="p-4 rounded-xl border border-border/40 bg-card hover:shadow-executive-md transition-all duration-200 group">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center ring-1 ring-destructive/20 group-hover:scale-105 transition-transform">
                  <FileText className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-foreground">F29</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Formulario completo</p>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="w-full h-9"
                onClick={handleDescargarF29PDF}
                disabled={!clienteSeleccionado || !periodoSeleccionado || descargando === 'f29-pdf'}
              >
                {descargando === 'f29-pdf' ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                PDF
              </Button>
            </div>

            {/* F29 Excel */}
            <div className="p-4 rounded-xl border border-border/40 bg-card hover:shadow-executive-md transition-all duration-200 group">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center ring-1 ring-success/20 group-hover:scale-105 transition-transform">
                  <FileSpreadsheet className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-foreground">F29 Excel</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Datos editables</p>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="w-full h-9"
                onClick={handleDescargarF29Excel}
                disabled={!clienteSeleccionado || !periodoSeleccionado || descargando === 'f29-excel'}
              >
                {descargando === 'f29-excel' ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                Excel
              </Button>
            </div>

            {/* Documentos Excel */}
            <div className="p-4 rounded-xl border border-border/40 bg-card hover:shadow-executive-md transition-all duration-200 group">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center ring-1 ring-primary/20 group-hover:scale-105 transition-transform">
                  <FileSpreadsheet className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-foreground">Documentos</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Listado completo</p>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="w-full h-9"
                onClick={handleDescargarDocumentosExcel}
                disabled={!clienteSeleccionado || !periodoSeleccionado || descargando === 'docs-excel'}
              >
                {descargando === 'docs-excel' ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                Excel
              </Button>
            </div>

            {/* Resumen Mensual PDF */}
            <div className="p-4 rounded-xl border border-border/40 bg-card hover:shadow-executive-md transition-all duration-200 group">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-lg bg-secondary/10 flex items-center justify-center ring-1 ring-secondary/20 group-hover:scale-105 transition-transform">
                  <BarChart3 className="h-5 w-5 text-secondary" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-foreground">Resumen</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Mensual completo</p>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="w-full h-9"
                onClick={handleDescargarResumenPDF}
                disabled={!clienteSeleccionado || !periodoSeleccionado || descargando === 'resumen-pdf'}
              >
                {descargando === 'resumen-pdf' ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                PDF
              </Button>
            </div>
          </div>

          {/* Info adicional */}
          {clienteSeleccionado && periodoSeleccionado && (
            <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 text-sm">
              <p className="text-muted-foreground">
                Generando reportes para{' '}
                <span className="font-semibold text-foreground">
                  {clientes.find(c => c.id === clienteSeleccionado)?.razon_social}
                </span>{' '}
                - Periodo{' '}
                <span className="font-semibold text-foreground font-mono">{periodoSeleccionado}</span>
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reports List */}
      <Card>
        <CardHeader>
          <CardTitle>Reportes Disponibles</CardTitle>
          <CardDescription>Genera y descarga reportes detallados</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {reportes.map((reporte) => {
              const Icon = iconMap[reporte.id] || FileText
              return (
                <div
                  key={reporte.id}
                  className="flex items-start gap-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="rounded-lg bg-primary/10 p-3">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{reporte.nombre}</p>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {reporte.descripcion}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {reporte.tipo}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {reporte.ultimaGeneracion}
                      </span>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleGenerarReporte(reporte)}
                        disabled={generando === reporte.id || isPending}
                      >
                        {generando === reporte.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <BarChart3 className="h-4 w-4 mr-1" />
                            Ver
                          </>
                        )}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDescargar(reporte)}>
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Modal de Reporte */}
      {reporteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg shadow-lg w-full max-w-2xl max-h-[80vh] overflow-auto m-4">
            <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-background">
              <h2 className="text-lg font-semibold">{reporteModal.nombre}</h2>
              <button
                onClick={() => setReporteModal(null)}
                className="p-1 rounded hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4">
              {typeof reporteModal.data === 'object' && !Array.isArray(reporteModal.data) ? (
                <div className="space-y-4">
                  {Object.entries(reporteModal.data).map(([key, value]) => (
                    <div key={key} className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground capitalize">
                        {key.replace(/_/g, ' ')}
                      </span>
                      <span className="font-medium">
                        {typeof value === 'number' ? value.toLocaleString() : String(value)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : Array.isArray(reporteModal.data) ? (
                <div className="space-y-3">
                  {reporteModal.data.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">Sin datos</p>
                  ) : (
                    reporteModal.data.slice(0, 20).map((item: any, i: number) => (
                      <div key={i} className="p-3 border rounded-lg text-sm">
                        <pre className="whitespace-pre-wrap text-xs">
                          {JSON.stringify(item, null, 2)}
                        </pre>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                <pre className="whitespace-pre-wrap text-sm">
                  {JSON.stringify(reporteModal.data, null, 2)}
                </pre>
              )}
            </div>
            <div className="p-4 border-t sticky bottom-0 bg-background">
              <Button variant="outline" onClick={() => setReporteModal(null)} className="w-full">
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
