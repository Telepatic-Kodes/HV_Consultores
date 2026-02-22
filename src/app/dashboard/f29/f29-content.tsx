'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  FileSpreadsheet,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Download,
  Eye,
  Calendar,
  Building2,
  Search,
  Plus,
  RefreshCw,
} from 'lucide-react'
import { generarF29, aprobarF29 } from './actions'
import type { F29ConDetalles, F29Stats } from './actions'

interface F29ContentProps {
  f29List: F29ConDetalles[]
  stats: F29Stats
  clientes: { id: string; razon_social: string; rut: string; documentos: number }[]
  periodos: string[]
  periodoActual: string
}

const statusLabels: Record<string, { label: string; color: string }> = {
  borrador: { label: 'Borrador', color: 'bg-muted text-muted-foreground' },
  calculado: { label: 'Calculado', color: 'bg-secondary/10 text-secondary' },
  validado: { label: 'Validado', color: 'bg-warning/10 text-warning' },
  aprobado: { label: 'Aprobado', color: 'bg-success/10 text-success' },
  enviado: { label: 'Enviado SII', color: 'bg-primary/10 text-primary' },
}

export function F29Content({
  f29List,
  stats,
  clientes,
  periodos,
  periodoActual,
}: F29ContentProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [selectedF29, setSelectedF29] = useState<string | null>(null)
  const [showGenerarModal, setShowGenerarModal] = useState(false)
  const [selectedCliente, setSelectedCliente] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')

  const selectedF29Data = f29List.find(f => f._id === selectedF29)

  const formatCurrency = (amount: number | null) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
    }).format(amount || 0)
  }

  const formatPeriodo = (periodo: string) => {
    const [year, month] = periodo.split('-')
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
    return `${meses[parseInt(month) - 1]} ${year}`
  }

  const handlePeriodoChange = (periodo: string) => {
    startTransition(() => {
      router.push(`/dashboard/f29?periodo=${periodo}`)
    })
  }

  const handleGenerarF29 = async () => {
    if (!selectedCliente) return

    startTransition(async () => {
      const result = await generarF29(selectedCliente, periodoActual)
      if (result.success) {
        setShowGenerarModal(false)
        setSelectedCliente('')
      } else {
        alert(result.error)
      }
    })
  }

  const handleAprobar = async () => {
    if (!selectedF29) return

    startTransition(async () => {
      await aprobarF29(selectedF29)
    })
  }

  const filteredF29 = f29List.filter(f29 =>
    f29.cliente?.razon_social.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f29.cliente?.rut.includes(searchTerm)
  )

  // Clientes que aún no tienen F29 generado
  const clientesSinF29 = clientes.filter(
    c => !f29List.some(f => f.cliente_id === c.id)
  )

  return (
    <main className="p-8 space-y-6">
      {/* Section Header */}
      <div className="flex items-center gap-3">
        <div className="h-1 w-8 bg-gradient-to-r from-primary to-secondary rounded-full" />
        <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Declaraciones Tributarias
        </span>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="group hover:shadow-executive-md transition-all duration-200">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center gap-4">
              <div className="h-11 w-11 rounded-lg bg-primary/10 flex items-center justify-center ring-1 ring-primary/20 group-hover:scale-105 transition-transform">
                <FileSpreadsheet className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold font-mono">{stats.total}</p>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">F29 del Periodo</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="group hover:shadow-executive-md transition-all duration-200">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center gap-4">
              <div className="h-11 w-11 rounded-lg bg-success/10 flex items-center justify-center ring-1 ring-success/20 group-hover:scale-105 transition-transform">
                <CheckCircle className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold font-mono">{stats.aprobados}</p>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Aprobados</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="group hover:shadow-executive-md transition-all duration-200">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center gap-4">
              <div className="h-11 w-11 rounded-lg bg-warning/10 flex items-center justify-center ring-1 ring-warning/20 group-hover:scale-105 transition-transform">
                <AlertTriangle className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold font-mono">{stats.conAlertas}</p>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Con Alertas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="group hover:shadow-executive-md transition-all duration-200">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center gap-4">
              <div className="h-11 w-11 rounded-lg bg-muted flex items-center justify-center ring-1 ring-border/50 group-hover:scale-105 transition-transform">
                <FileSpreadsheet className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold font-mono">{stats.borradores}</p>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">En Proceso</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
          <Input
            type="search"
            placeholder="Buscar cliente..."
            className="pl-10 h-11 bg-muted/30 border-transparent focus:border-primary/30 focus:bg-background"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-lg bg-muted/50 flex items-center justify-center">
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </div>
          <select
            className="h-11 rounded-lg border border-border/50 bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            value={periodoActual}
            onChange={(e) => handlePeriodoChange(e.target.value)}
            disabled={isPending}
          >
            {periodos.length > 0 ? (
              periodos.map(p => (
                <option key={p} value={p}>{formatPeriodo(p)}</option>
              ))
            ) : (
              <option value="2026-01">Enero 2026</option>
            )}
          </select>
        </div>
        <Button
          onClick={() => setShowGenerarModal(true)}
          disabled={clientesSinF29.length === 0}
          className="shadow-executive"
        >
          <Plus className="mr-2 h-4 w-4" />
          Generar F29
        </Button>
      </div>

      {/* Modal Generar F29 */}
      {showGenerarModal && (
        <Card className="border-primary/30 shadow-executive-md">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Plus className="h-4 w-4 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">Generar Nuevo F29</CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Selecciona un cliente para generar el F29 de {formatPeriodo(periodoActual)}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <select
                className="w-full h-11 rounded-lg border border-border/50 bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                value={selectedCliente}
                onChange={(e) => setSelectedCliente(e.target.value)}
              >
                <option value="">Seleccionar cliente...</option>
                {clientesSinF29.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.razon_social} ({c.rut}) - {c.documentos} docs
                  </option>
                ))}
              </select>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setShowGenerarModal(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleGenerarF29} disabled={!selectedCliente || isPending} className="shadow-executive">
                  {isPending ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Generando...
                    </>
                  ) : (
                    <>
                      <FileSpreadsheet className="mr-2 h-4 w-4" />
                      Generar F29
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* F29 List */}
        <div className="lg:col-span-2">
          <Card className="border-border/50 shadow-executive">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold">Formularios F29</CardTitle>
                  <CardDescription className="mt-1">
                    {filteredF29.length > 0
                      ? `${filteredF29.length} F29 para ${formatPeriodo(periodoActual)}`
                      : 'No hay F29 generados para este periodo'}
                  </CardDescription>
                </div>
                <span className="text-xs text-muted-foreground">Periodo activo</span>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {filteredF29.length === 0 ? (
                <div className="py-16 text-center">
                  <div className="h-14 w-14 mx-auto rounded-xl bg-muted/50 flex items-center justify-center mb-4">
                    <FileSpreadsheet className="h-7 w-7 text-muted-foreground/50" />
                  </div>
                  <p className="text-muted-foreground font-medium">No hay F29 para este periodo</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">Genera uno nuevo para comenzar</p>
                </div>
              ) : (
                <div className="divide-y divide-border/40">
                  {filteredF29.map((f29) => {
                    const validacionesOk = f29.validaciones?.filter(v => v.resultado === 'ok').length || 0
                    const validacionesWarning = f29.validaciones?.filter(v => v.resultado === 'warning').length || 0
                    const validacionesError = f29.validaciones?.filter(v => v.resultado === 'error').length || 0
                    const totalValidaciones = f29.validaciones?.length || 0

                    return (
                      <div
                        key={f29.id}
                        className={`p-5 cursor-pointer transition-all duration-200 ${
                          selectedF29 === f29.id
                            ? 'bg-primary/5 border-l-2 border-l-primary'
                            : 'hover:bg-muted/30 border-l-2 border-l-transparent'
                        }`}
                        onClick={() => setSelectedF29(f29.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <div className="h-10 w-10 rounded-lg bg-muted/60 flex items-center justify-center ring-1 ring-border/30">
                              <Building2 className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <div>
                              <p className="font-semibold text-foreground">{f29.cliente?.razon_social}</p>
                              <p className="text-xs font-mono text-muted-foreground mt-0.5">{f29.cliente?.rut}</p>
                            </div>
                          </div>
                          <span className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${
                            statusLabels[f29.status || 'borrador'].color
                          } ${f29.status === 'aprobado' ? 'ring-success/20' : f29.status === 'enviado' ? 'ring-primary/20' : f29.status === 'validado' ? 'ring-warning/20' : 'ring-border/30'}`}>
                            {f29.status === 'aprobado' && <CheckCircle className="h-3 w-3" />}
                            {f29.status === 'validado' && <AlertTriangle className="h-3 w-3" />}
                            {statusLabels[f29.status || 'borrador'].label}
                          </span>
                        </div>

                        <div className="mt-4 grid grid-cols-3 gap-4">
                          <div className="bg-muted/30 rounded-lg p-3">
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">IVA Determinado</p>
                            <p className="text-sm font-bold font-mono mt-1">
                              {formatCurrency((Number(f29.total_debito_fiscal) || 0) - (Number(f29.total_credito_fiscal) || 0))}
                            </p>
                          </div>
                          <div className="bg-muted/30 rounded-lg p-3">
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">PPM</p>
                            <p className="text-sm font-bold font-mono mt-1">{formatCurrency(Number(f29.ppm_determinado))}</p>
                          </div>
                          <div className="bg-muted/30 rounded-lg p-3">
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">Validaciones</p>
                            <p className="text-sm font-bold font-mono mt-1">
                              <span className="text-success">{validacionesOk}</span>
                              <span className="text-muted-foreground/50">/{totalValidaciones}</span>
                              {validacionesWarning > 0 && (
                                <span className="text-warning ml-1 text-xs">+{validacionesWarning}</span>
                              )}
                              {validacionesError > 0 && (
                                <span className="text-destructive ml-1 text-xs">+{validacionesError}</span>
                              )}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-border/30 flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">Total a Pagar</span>
                          <p className="text-lg font-bold font-mono text-primary">
                            {formatCurrency(Number(f29.total_a_pagar))}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Validations Panel */}
        <Card className="border-border/50 shadow-executive h-fit sticky top-8">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-secondary/10 flex items-center justify-center">
                <CheckCircle className="h-4 w-4 text-secondary" />
              </div>
              <div>
                <CardTitle className="text-base">Validaciones</CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  {selectedF29Data ? 'Resultado automático' : 'Selecciona un F29'}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {selectedF29Data ? (
              <div className="space-y-4">
                {selectedF29Data.validaciones?.map((val) => (
                  <div
                    key={val.id}
                    className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                      val.resultado === 'ok'
                        ? 'bg-success/5 border-success/20'
                        : val.resultado === 'warning'
                        ? 'bg-warning/5 border-warning/20'
                        : 'bg-destructive/5 border-destructive/20'
                    }`}
                  >
                    {val.resultado === 'ok' ? (
                      <CheckCircle className="h-4 w-4 text-success shrink-0 mt-0.5" />
                    ) : val.resultado === 'warning' ? (
                      <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">{val.descripcion}</p>
                      <p className="text-[10px] font-mono text-muted-foreground mt-1">{val.codigo_validacion}</p>
                      {val.mensaje && (
                        <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{val.mensaje}</p>
                      )}
                    </div>
                  </div>
                ))}

                {/* Codigos F29 */}
                {selectedF29Data.codigos && selectedF29Data.codigos.length > 0 && (
                  <div className="pt-4 border-t border-border/30">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Codigos F29</p>
                    <div className="space-y-2">
                      {selectedF29Data.codigos.map((codigo) => (
                        <div key={codigo.id} className="flex justify-between items-center py-1.5 px-2 rounded bg-muted/30">
                          <span className="text-xs text-muted-foreground">
                            <span className="font-mono text-foreground">[{codigo.codigo}]</span> {codigo.descripcion}
                          </span>
                          <span className="text-xs font-bold font-mono">{formatCurrency(Number(codigo.monto_iva))}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-4 flex gap-3">
                  <Button variant="outline" className="flex-1 h-10">
                    <Eye className="mr-2 h-4 w-4" />
                    Vista Previa
                  </Button>
                  {selectedF29Data.status !== 'aprobado' && selectedF29Data.status !== 'enviado' && (
                    <Button className="flex-1 h-10 shadow-executive" onClick={handleAprobar} disabled={isPending}>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Aprobar
                    </Button>
                  )}
                  {(selectedF29Data.status === 'aprobado' || selectedF29Data.status === 'enviado') && (
                    <Button className="flex-1 h-10 shadow-executive">
                      <Download className="mr-2 h-4 w-4" />
                      Exportar
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-10 text-center">
                <div className="h-12 w-12 mx-auto rounded-xl bg-muted/50 flex items-center justify-center mb-3">
                  <FileSpreadsheet className="h-6 w-6 text-muted-foreground/50" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Selecciona un F29 para ver sus validaciones
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
