'use client'

import Link from 'next/link'
import {
  FileText,
  Calculator,
  Landmark,
  AlertTriangle,
  Activity,
  Building2,
  MapPin,
  Briefcase,
  Upload,
  Play,
  ArrowRight,
  CheckCircle,
  Clock,
  AlertCircle,
  ChevronRight,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { KPICard } from '@/components/dashboard'
import type { ClienteOverview } from './actions'

interface Props {
  overview: ClienteOverview
  clienteId: string
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(amount)
}

function StatusBadge({ status, type }: { status: string; type: 'doc' | 'f29' | 'alert' }) {
  const config: Record<string, { class: string; label: string }> = {
    // Documents
    pendiente: { class: 'bg-warning/10 text-warning ring-warning/20', label: 'Pendiente' },
    clasificado: { class: 'bg-blue-500/10 text-blue-500 ring-blue-500/20', label: 'Clasificado' },
    revisado: { class: 'bg-violet-500/10 text-violet-500 ring-violet-500/20', label: 'Revisado' },
    aprobado: { class: 'bg-success/10 text-success ring-success/20', label: 'Aprobado' },
    exportado: { class: 'bg-primary/10 text-primary ring-primary/20', label: 'Exportado' },
    // F29
    borrador: { class: 'bg-muted text-muted-foreground ring-border', label: 'Borrador' },
    calculado: { class: 'bg-blue-500/10 text-blue-500 ring-blue-500/20', label: 'Calculado' },
    validado: { class: 'bg-violet-500/10 text-violet-500 ring-violet-500/20', label: 'Validado' },
    enviado: { class: 'bg-success/10 text-success ring-success/20', label: 'Enviado' },
    // Alerts
    abierta: { class: 'bg-destructive/10 text-destructive ring-destructive/20', label: 'Abierta' },
    revisada: { class: 'bg-warning/10 text-warning ring-warning/20', label: 'Revisada' },
    resuelta: { class: 'bg-success/10 text-success ring-success/20', label: 'Resuelta' },
    descartada: { class: 'bg-muted text-muted-foreground ring-border', label: 'Descartada' },
    // Pipeline
    completed: { class: 'bg-success/10 text-success ring-success/20', label: 'Completado' },
    failed: { class: 'bg-destructive/10 text-destructive ring-destructive/20', label: 'Fallido' },
    running: { class: 'bg-blue-500/10 text-blue-500 ring-blue-500/20', label: 'Ejecutando' },
  }

  const c = config[status] ?? { class: 'bg-muted text-muted-foreground ring-border', label: status }

  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${c.class}`}>
      {c.label}
    </span>
  )
}

function SeverityBadge({ severity }: { severity: string }) {
  const config: Record<string, string> = {
    alta: 'bg-destructive/10 text-destructive ring-destructive/20',
    media: 'bg-warning/10 text-warning ring-warning/20',
    baja: 'bg-blue-500/10 text-blue-500 ring-blue-500/20',
  }
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${config[severity] ?? 'bg-muted text-muted-foreground ring-border'}`}>
      {severity.charAt(0).toUpperCase() + severity.slice(1)}
    </span>
  )
}

export function ClienteDetailContent({ overview, clienteId }: Props) {
  const { cliente, documentStats, recentDocs, f29Stats, f29Submissions, bankStats, recentTransactions, alertStats, recentAlerts, pipelineRuns } = overview

  if (!cliente) {
    return (
      <main className="p-8">
        <div className="text-center py-16">
          <div className="h-14 w-14 mx-auto rounded-xl bg-muted/50 flex items-center justify-center mb-4">
            <Building2 className="h-7 w-7 text-muted-foreground/50" />
          </div>
          <p className="text-muted-foreground font-medium">Cliente no encontrado</p>
          <Link href="/dashboard/clientes">
            <Button variant="outline" className="mt-4">Volver a Clientes</Button>
          </Link>
        </div>
      </main>
    )
  }

  const reconciliacionRate = bankStats.total > 0
    ? Math.round((bankStats.reconciliadas / bankStats.total) * 100)
    : 0

  return (
    <main className="p-4 md:p-8 space-y-6">
      {/* Section Header */}
      <div className="flex items-center gap-3">
        <div className="h-1 w-8 bg-gradient-to-r from-primary to-secondary rounded-full" />
        <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Detalle del Cliente
        </span>
      </div>

      {/* Client Header Card */}
      <Card className="border-border/50 shadow-executive">
        <CardContent className="pt-6 pb-6">
          <div className="flex flex-col md:flex-row md:items-start gap-6">
            {/* Avatar */}
            <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center ring-1 ring-primary/20 shrink-0">
              <span className="text-lg font-bold text-primary">
                {cliente.razon_social?.charAt(0) ?? '?'}
              </span>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 space-y-3">
              <div>
                <h2 className="text-xl font-semibold text-foreground">{cliente.razon_social}</h2>
                {cliente.nombre_fantasia && (
                  <p className="text-sm text-muted-foreground mt-0.5">{cliente.nombre_fantasia}</p>
                )}
              </div>

              <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5 font-mono">
                  <Building2 className="h-3.5 w-3.5" />
                  {cliente.rut}
                </span>
                {cliente.regimen_tributario && (
                  <span className="inline-flex items-center rounded-md bg-primary/8 px-2.5 py-0.5 text-xs font-semibold text-primary ring-1 ring-inset ring-primary/20">
                    {cliente.regimen_tributario}
                  </span>
                )}
                {cliente.giro && (
                  <span className="flex items-center gap-1.5">
                    <Briefcase className="h-3.5 w-3.5" />
                    {cliente.giro}
                  </span>
                )}
                {cliente.direccion && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" />
                    {[cliente.direccion, cliente.comuna, cliente.region].filter(Boolean).join(', ')}
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI Row */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
        <KPICard
          title="Documentos"
          value={documentStats.total}
          description={`${documentStats.pendiente} pendientes`}
          icon={<FileText className="h-5 w-5" />}
          color="blue"
        />
        <KPICard
          title="F29"
          value={`${f29Stats.enviado}/${f29Stats.total}`}
          description={`${f29Stats.total - f29Stats.enviado - f29Stats.aprobado} por enviar`}
          icon={<Calculator className="h-5 w-5" />}
          color="green"
        />
        <KPICard
          title="Transacciones"
          value={bankStats.total}
          description={`Balance: ${formatCurrency(bankStats.balance)}`}
          icon={<Landmark className="h-5 w-5" />}
          color="violet"
        />
        <KPICard
          title="Alertas"
          value={alertStats.abiertas}
          description={`${alertStats.alta} alta severidad`}
          icon={<AlertTriangle className="h-5 w-5" />}
          color={alertStats.alta > 0 ? 'red' : 'amber'}
        />
        <KPICard
          title="Conciliacion"
          value={`${reconciliacionRate}%`}
          description={`${bankStats.reconciliadas} de ${bankStats.total}`}
          icon={<CheckCircle className="h-5 w-5" />}
          color={reconciliacionRate >= 80 ? 'green' : reconciliacionRate >= 50 ? 'amber' : 'red'}
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="documentos" className="space-y-4">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="documentos" className="gap-1.5">
            <FileText className="h-3.5 w-3.5" />
            Documentos
          </TabsTrigger>
          <TabsTrigger value="f29" className="gap-1.5">
            <Calculator className="h-3.5 w-3.5" />
            F29
          </TabsTrigger>
          <TabsTrigger value="bancos" className="gap-1.5">
            <Landmark className="h-3.5 w-3.5" />
            Bancos
          </TabsTrigger>
          <TabsTrigger value="alertas" className="gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5" />
            Alertas
          </TabsTrigger>
          <TabsTrigger value="actividad" className="gap-1.5">
            <Activity className="h-3.5 w-3.5" />
            Actividad
          </TabsTrigger>
        </TabsList>

        {/* Documentos Tab */}
        <TabsContent value="documentos">
          <Card className="border-border/50 shadow-executive">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Documentos Recientes</CardTitle>
                  <CardDescription>{documentStats.total} documentos en total</CardDescription>
                </div>
                <Link href={`/dashboard/documentos?cliente_id=${clienteId}`}>
                  <Button variant="outline" size="sm" className="gap-1.5">
                    Ver todos <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {recentDocs.length === 0 ? (
                <div className="py-10 text-center text-sm text-muted-foreground">
                  Sin documentos registrados
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Nombre</TableHead>
                      <TableHead>Periodo</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentDocs.map((doc: any) => (
                      <TableRow key={doc._id}>
                        <TableCell className="font-medium">{doc.nombre || doc.nombre_archivo || 'Sin nombre'}</TableCell>
                        <TableCell className="text-muted-foreground font-mono text-xs">{doc.periodo || '-'}</TableCell>
                        <TableCell className="text-muted-foreground text-xs">{doc.tipo_documento || '-'}</TableCell>
                        <TableCell><StatusBadge status={doc.status} type="doc" /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* F29 Tab */}
        <TabsContent value="f29">
          <Card className="border-border/50 shadow-executive">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Declaraciones F29</CardTitle>
                  <CardDescription>
                    {f29Stats.total} declaraciones — Total a pagar: {formatCurrency(f29Stats.totalPagar)}
                  </CardDescription>
                </div>
                <Link href={`/dashboard/f29?cliente_id=${clienteId}`}>
                  <Button variant="outline" size="sm" className="gap-1.5">
                    Ver todos <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {f29Submissions.length === 0 ? (
                <div className="py-10 text-center text-sm text-muted-foreground">
                  Sin declaraciones F29
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Periodo</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Total a Pagar</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {f29Submissions.slice(0, 10).map((f29: any) => (
                      <TableRow key={f29._id}>
                        <TableCell className="font-mono font-medium">{f29.periodo || '-'}</TableCell>
                        <TableCell><StatusBadge status={f29.status} type="f29" /></TableCell>
                        <TableCell className="text-right font-mono">
                          {formatCurrency(f29.total_a_pagar || 0)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bancos Tab */}
        <TabsContent value="bancos">
          <Card className="border-border/50 shadow-executive">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Transacciones Bancarias</CardTitle>
                  <CardDescription>
                    Ingresos: {formatCurrency(bankStats.ingresos)} — Egresos: {formatCurrency(bankStats.egresos)}
                  </CardDescription>
                </div>
                <Link href={`/dashboard/bancos?cliente_id=${clienteId}`}>
                  <Button variant="outline" size="sm" className="gap-1.5">
                    Ver todos <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {recentTransactions.length === 0 ? (
                <div className="py-10 text-center text-sm text-muted-foreground">
                  Sin transacciones registradas
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Fecha</TableHead>
                      <TableHead>Descripcion</TableHead>
                      <TableHead>Banco</TableHead>
                      <TableHead className="text-right">Monto</TableHead>
                      <TableHead className="text-center">Conciliado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentTransactions.map((tx: any) => (
                      <TableRow key={tx._id}>
                        <TableCell className="font-mono text-xs text-muted-foreground">{tx.fecha}</TableCell>
                        <TableCell className="font-medium max-w-[200px] truncate">{tx.descripcion || '-'}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{tx.banco || '-'}</TableCell>
                        <TableCell className={`text-right font-mono ${tx.monto >= 0 ? 'text-success' : 'text-destructive'}`}>
                          {formatCurrency(tx.monto)}
                        </TableCell>
                        <TableCell className="text-center">
                          {tx.reconciliado ? (
                            <CheckCircle className="h-4 w-4 text-success mx-auto" />
                          ) : (
                            <Clock className="h-4 w-4 text-muted-foreground/50 mx-auto" />
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Alertas Tab */}
        <TabsContent value="alertas">
          <Card className="border-border/50 shadow-executive">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Alertas y Anomalias</CardTitle>
                  <CardDescription>
                    {alertStats.abiertas} abiertas — {alertStats.alta} alta, {alertStats.media} media, {alertStats.baja} baja
                  </CardDescription>
                </div>
                <Link href={`/dashboard/alertas?cliente_id=${clienteId}`}>
                  <Button variant="outline" size="sm" className="gap-1.5">
                    Ver todos <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {recentAlerts.length === 0 ? (
                <div className="py-10 text-center text-sm text-muted-foreground">
                  Sin alertas registradas
                </div>
              ) : (
                <div className="space-y-3">
                  {recentAlerts.map((alert: any) => (
                    <div
                      key={alert._id}
                      className="flex items-start gap-3 p-3 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors"
                    >
                      <div className={`mt-0.5 h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                        alert.severidad === 'alta'
                          ? 'bg-destructive/10'
                          : alert.severidad === 'media'
                          ? 'bg-warning/10'
                          : 'bg-blue-500/10'
                      }`}>
                        <AlertCircle className={`h-4 w-4 ${
                          alert.severidad === 'alta'
                            ? 'text-destructive'
                            : alert.severidad === 'media'
                            ? 'text-warning'
                            : 'text-blue-500'
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-medium">{alert.descripcion || alert.tipo || 'Alerta'}</p>
                          <SeverityBadge severity={alert.severidad} />
                          <StatusBadge status={alert.estado} type="alert" />
                        </div>
                        {alert.detalle && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{alert.detalle}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Actividad Tab */}
        <TabsContent value="actividad">
          <Card className="border-border/50 shadow-executive">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Pipeline de Actividad</CardTitle>
              <CardDescription>Ejecuciones recientes del pipeline automatizado</CardDescription>
            </CardHeader>
            <CardContent>
              {pipelineRuns.length === 0 ? (
                <div className="py-10 text-center text-sm text-muted-foreground">
                  Sin ejecuciones de pipeline
                </div>
              ) : (
                <div className="space-y-3">
                  {pipelineRuns.map((run: any) => (
                    <div
                      key={run._id}
                      className="flex items-center gap-3 p-3 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors"
                    >
                      <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                        run.estado === 'completed'
                          ? 'bg-success/10'
                          : run.estado === 'failed'
                          ? 'bg-destructive/10'
                          : 'bg-blue-500/10'
                      }`}>
                        <Activity className={`h-4 w-4 ${
                          run.estado === 'completed'
                            ? 'text-success'
                            : run.estado === 'failed'
                            ? 'text-destructive'
                            : 'text-blue-500'
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">Pipeline #{run._id.slice(-6)}</p>
                          <StatusBadge status={run.estado} type="doc" />
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Paso actual: {run.paso_actual || run.estado}
                          {run.created_at && ` — ${new Date(run.created_at).toLocaleDateString('es-CL')}`}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground/50 shrink-0" />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      <Card className="border-border/50 shadow-executive">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Acciones Rapidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Link href={`/dashboard/documentos?cliente_id=${clienteId}`}>
              <Button variant="outline" className="gap-2 shadow-sm">
                <Upload className="h-4 w-4" />
                Subir Documentos
              </Button>
            </Link>
            <Link href={`/dashboard/f29?cliente_id=${clienteId}`}>
              <Button variant="outline" className="gap-2 shadow-sm">
                <Calculator className="h-4 w-4" />
                Generar F29
              </Button>
            </Link>
            <Link href={`/dashboard/bots?cliente_id=${clienteId}`}>
              <Button variant="outline" className="gap-2 shadow-sm">
                <Play className="h-4 w-4" />
                Ejecutar Bot
              </Button>
            </Link>
            <Link href={`/dashboard/conciliacion?cliente_id=${clienteId}`}>
              <Button variant="outline" className="gap-2 shadow-sm">
                <CheckCircle className="h-4 w-4" />
                Conciliar
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
