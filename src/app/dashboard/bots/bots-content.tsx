'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Bot,
  Play,
  CheckCircle,
  XCircle,
  Clock,
  Activity,
  RefreshCw,
  ChevronRight,
  Loader2,
} from 'lucide-react'
import { ejecutarBot, cancelarJob } from './actions'
import type { BotConStats, BotJobConDetalles, BotStats } from './actions'

interface BotsContentProps {
  bots: BotConStats[]
  stats: BotStats
  jobsRecientes: BotJobConDetalles[]
  clientes: { id: string; razon_social: string; rut: string }[]
}

const statusColors: Record<string, string> = {
  pendiente: 'bg-muted text-muted-foreground',
  ejecutando: 'bg-secondary/10 text-secondary',
  completado: 'bg-success/10 text-success',
  fallido: 'bg-destructive/10 text-destructive',
  cancelado: 'bg-warning/10 text-warning',
}

export function BotsContent({ bots, stats, jobsRecientes, clientes }: BotsContentProps) {
  const [isPending, startTransition] = useTransition()
  const [selectedBot, setSelectedBot] = useState<string | null>(null)
  const [selectedCliente, setSelectedCliente] = useState<string>('')
  const [showEjecutarModal, setShowEjecutarModal] = useState(false)

  const selectedBotData = bots.find(b => b.id === selectedBot)

  const handleEjecutar = async () => {
    if (!selectedBot) return

    startTransition(async () => {
      await ejecutarBot(selectedBot, selectedCliente || undefined)
      setShowEjecutarModal(false)
      setSelectedCliente('')
    })
  }

  const handleCancelar = async (jobId: string) => {
    startTransition(async () => {
      await cancelarJob(jobId)
    })
  }

  const formatTiempo = (fecha: string | null | undefined) => {
    if (!fecha) return 'Nunca'
    const diff = Date.now() - new Date(fecha).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'Ahora'
    if (mins < 60) return `Hace ${mins} min`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `Hace ${hours}h`
    return new Date(fecha).toLocaleDateString('es-CL')
  }

  return (
    <main className="p-8 space-y-6">
      {/* Section Header */}
      <div className="flex items-center gap-3">
        <div className="h-1 w-8 bg-gradient-to-r from-primary to-secondary rounded-full" />
        <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Automatizacion RPA
        </span>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="group hover:shadow-executive-md transition-all duration-200">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center gap-4">
              <div className="h-11 w-11 rounded-lg bg-primary/10 flex items-center justify-center ring-1 ring-primary/20 group-hover:scale-105 transition-transform">
                <Bot className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold font-mono">{stats.totalBots}</p>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Bots Configurados</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="group hover:shadow-executive-md transition-all duration-200">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center gap-4">
              <div className="h-11 w-11 rounded-lg bg-success/10 flex items-center justify-center ring-1 ring-success/20 group-hover:scale-105 transition-transform">
                <Activity className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold font-mono">{stats.activos}</p>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Ejecutando</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="group hover:shadow-executive-md transition-all duration-200">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center gap-4">
              <div className="h-11 w-11 rounded-lg bg-secondary/10 flex items-center justify-center ring-1 ring-secondary/20 group-hover:scale-105 transition-transform">
                <CheckCircle className="h-5 w-5 text-secondary" />
              </div>
              <div>
                <p className="text-2xl font-bold font-mono">{stats.tareasHoy}</p>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Tareas Hoy</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="group hover:shadow-executive-md transition-all duration-200">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center gap-4">
              <div className="h-11 w-11 rounded-lg bg-destructive/10 flex items-center justify-center ring-1 ring-destructive/20 group-hover:scale-105 transition-transform">
                <XCircle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold font-mono">{stats.erroresHoy}</p>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Errores Hoy</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Bots List */}
        <Card className="border-border/50 shadow-executive">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Bot className="h-4 w-4 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">Bots Disponibles</CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  {bots.length > 0 ? 'Estado y control de los bots' : 'No hay bots configurados'}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {bots.length === 0 ? (
              <div className="py-16 text-center">
                <div className="h-14 w-14 mx-auto rounded-xl bg-muted/50 flex items-center justify-center mb-4">
                  <Bot className="h-7 w-7 text-muted-foreground/50" />
                </div>
                <p className="text-muted-foreground font-medium">No hay bots configurados</p>
                <p className="text-xs text-muted-foreground/70 mt-1">Configura tu primer bot RPA</p>
              </div>
            ) : (
              <div className="divide-y divide-border/40">
                {bots.map((bot) => {
                  const estaEjecutando = bot.ultimo_job?.status === 'ejecutando'

                  return (
                    <div
                      key={bot.id}
                      className={`p-5 cursor-pointer transition-all duration-200 ${
                        selectedBot === bot.id
                          ? 'bg-primary/5 border-l-2 border-l-primary'
                          : 'hover:bg-muted/30 border-l-2 border-l-transparent'
                      }`}
                      onClick={() => setSelectedBot(bot.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className={`h-10 w-10 rounded-lg flex items-center justify-center ring-1 transition-all ${
                            estaEjecutando
                              ? 'bg-secondary/10 ring-secondary/30'
                              : bot.activo
                              ? 'bg-success/10 ring-success/30'
                              : 'bg-muted/50 ring-border/30'
                          }`}>
                            <Bot className={`h-5 w-5 ${
                              estaEjecutando
                                ? 'text-secondary animate-pulse'
                                : bot.activo
                                ? 'text-success'
                                : 'text-muted-foreground'
                            }`} />
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">{bot.nombre}</p>
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{bot.descripcion}</p>
                            <p className="text-[10px] font-mono text-muted-foreground/60 mt-1">Portal: {bot.portal}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${
                            estaEjecutando
                              ? 'bg-secondary/10 text-secondary ring-secondary/20'
                              : bot.activo
                              ? 'bg-success/10 text-success ring-success/20'
                              : 'bg-muted text-muted-foreground ring-border/30'
                          }`}>
                            {estaEjecutando && <RefreshCw className="h-3 w-3 animate-spin" />}
                            {estaEjecutando ? 'Ejecutando' : bot.activo ? 'Activo' : 'Inactivo'}
                          </span>
                          <ChevronRight className={`h-5 w-5 transition-colors ${
                            selectedBot === bot.id ? 'text-primary' : 'text-muted-foreground/40'
                          }`} />
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-3 gap-3">
                        <div className="bg-muted/30 rounded-lg p-2.5">
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">Ultima Ejecucion</p>
                          <p className="text-xs font-medium font-mono flex items-center gap-1 mt-1">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            {formatTiempo(bot.ultimo_job?.completed_at || bot.ultimo_job?.started_at)}
                          </p>
                        </div>
                        <div className="bg-muted/30 rounded-lg p-2.5">
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">Exitos Hoy</p>
                          <p className="text-sm font-bold font-mono text-success mt-1">{bot.exitos_hoy}</p>
                        </div>
                        <div className="bg-muted/30 rounded-lg p-2.5">
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">Fallos</p>
                          <p className={`text-sm font-bold font-mono mt-1 ${bot.fallos_hoy > 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                            {bot.fallos_hoy}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* History / Control */}
        <Card className="border-border/50 shadow-executive">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-secondary/10 flex items-center justify-center">
                <Activity className="h-4 w-4 text-secondary" />
              </div>
              <div>
                <CardTitle className="text-base">Historial de Ejecuciones</CardTitle>
                <CardDescription className="text-xs mt-0.5">Ultimas tareas ejecutadas</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {jobsRecientes.length === 0 ? (
              <div className="py-10 text-center">
                <div className="h-12 w-12 mx-auto rounded-xl bg-muted/50 flex items-center justify-center mb-3">
                  <Clock className="h-6 w-6 text-muted-foreground/50" />
                </div>
                <p className="text-sm text-muted-foreground">No hay ejecuciones registradas</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                {jobsRecientes.map((job) => (
                  <div
                    key={job._id || job.id}
                    className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                      job.status === 'completado'
                        ? 'bg-success/5 border-success/20'
                        : job.status === 'fallido'
                        ? 'bg-destructive/5 border-destructive/20'
                        : job.status === 'ejecutando'
                        ? 'bg-secondary/5 border-secondary/20'
                        : 'bg-muted/30 border-border/30'
                    }`}
                  >
                    {job.status === 'completado' ? (
                      <CheckCircle className="h-4 w-4 text-success shrink-0 mt-0.5" />
                    ) : job.status === 'fallido' ? (
                      <XCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                    ) : job.status === 'ejecutando' ? (
                      <Loader2 className="h-4 w-4 text-secondary shrink-0 mt-0.5 animate-spin" />
                    ) : (
                      <Clock className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-foreground">{job.bot?.nombre}</p>
                          <p className="text-xs text-muted-foreground">
                            {job.cliente?.razon_social || 'Sin cliente'}
                          </p>
                        </div>
                        <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded ${statusColors[job.status || 'pendiente']}`}>
                          {job.status}
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground/70 mt-1.5 font-mono">
                        {formatTiempo(job.created_at)}
                        {job.status === 'ejecutando' && (
                          <button
                            onClick={() => handleCancelar(job.id)}
                            className="ml-2 text-destructive hover:underline font-sans font-medium"
                            disabled={isPending}
                          >
                            Cancelar
                          </button>
                        )}
                      </p>
                      {job.error_message && (
                        <p className="text-xs text-destructive mt-1.5 bg-destructive/5 rounded px-2 py-1">{job.error_message}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {selectedBot && (
              <div className="mt-6 pt-4 border-t border-border/30 space-y-4">
                {showEjecutarModal ? (
                  <div className="space-y-3 p-4 bg-muted/30 rounded-xl border border-border/30">
                    <p className="text-sm font-semibold flex items-center gap-2">
                      <Play className="h-4 w-4 text-primary" />
                      Ejecutar {selectedBotData?.nombre}
                    </p>
                    <select
                      className="w-full h-11 rounded-lg border border-border/50 bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      value={selectedCliente}
                      onChange={(e) => setSelectedCliente(e.target.value)}
                    >
                      <option value="">Todos los clientes</option>
                      {clientes.map(c => (
                        <option key={c.id} value={c.id}>{c.razon_social}</option>
                      ))}
                    </select>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1 h-10"
                        onClick={() => setShowEjecutarModal(false)}
                      >
                        Cancelar
                      </Button>
                      <Button
                        className="flex-1 h-10 shadow-executive"
                        onClick={handleEjecutar}
                        disabled={isPending}
                      >
                        {isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Play className="mr-2 h-4 w-4" />
                            Ejecutar
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button className="w-full h-10 shadow-executive" onClick={() => setShowEjecutarModal(true)}>
                    <Play className="mr-2 h-4 w-4" />
                    Ejecutar Bot
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
