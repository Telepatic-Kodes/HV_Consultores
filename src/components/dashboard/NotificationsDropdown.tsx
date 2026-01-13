'use client'

import { useState, useEffect, useTransition } from 'react'
import Link from 'next/link'
import { Bell, Check, CheckCheck, Trash2, X, Info, CheckCircle, AlertTriangle, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import {
  getNotificaciones,
  getNotificacionStats,
  marcarComoLeida,
  marcarTodasComoLeidas,
  eliminarNotificacion,
  type Notificacion,
  type NotificacionStats
} from '@/lib/notificaciones'

const tipoIconos = {
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  error: AlertCircle
}

const tipoColores = {
  info: 'text-primary bg-primary/10 ring-1 ring-primary/20',
  success: 'text-success bg-success/10 ring-1 ring-success/20',
  warning: 'text-warning bg-warning/10 ring-1 ring-warning/20',
  error: 'text-destructive bg-destructive/10 ring-1 ring-destructive/20'
}

function formatTiempoRelativo(fecha: string): string {
  const ahora = new Date()
  const fechaNotif = new Date(fecha)
  const diffMs = ahora.getTime() - fechaNotif.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHoras = Math.floor(diffMs / 3600000)
  const diffDias = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Ahora'
  if (diffMins < 60) return `Hace ${diffMins} min`
  if (diffHoras < 24) return `Hace ${diffHoras}h`
  if (diffDias === 1) return 'Ayer'
  if (diffDias < 7) return `Hace ${diffDias} días`
  return fechaNotif.toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })
}

export function NotificationsDropdown() {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([])
  const [stats, setStats] = useState<NotificacionStats>({ total: 0, noLeidas: 0 })
  const [isOpen, setIsOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  // Cargar notificaciones al abrir el dropdown
  useEffect(() => {
    if (isOpen) {
      cargarNotificaciones()
    }
  }, [isOpen])

  // Cargar stats inicialmente
  useEffect(() => {
    cargarStats()
    // Actualizar cada 30 segundos
    const interval = setInterval(cargarStats, 30000)
    return () => clearInterval(interval)
  }, [])

  async function cargarNotificaciones() {
    const data = await getNotificaciones(10)
    setNotificaciones(data)
  }

  async function cargarStats() {
    const data = await getNotificacionStats()
    setStats(data)
  }

  function handleMarcarLeida(id: string) {
    startTransition(async () => {
      await marcarComoLeida(id)
      setNotificaciones(prev =>
        prev.map(n => n.id === id ? { ...n, leida: true } : n)
      )
      setStats(prev => ({ ...prev, noLeidas: Math.max(0, prev.noLeidas - 1) }))
    })
  }

  function handleMarcarTodasLeidas() {
    startTransition(async () => {
      await marcarTodasComoLeidas()
      setNotificaciones(prev => prev.map(n => ({ ...n, leida: true })))
      setStats(prev => ({ ...prev, noLeidas: 0 }))
    })
  }

  function handleEliminar(id: string) {
    startTransition(async () => {
      await eliminarNotificacion(id)
      const notif = notificaciones.find(n => n.id === id)
      setNotificaciones(prev => prev.filter(n => n.id !== id))
      if (notif && !notif.leida) {
        setStats(prev => ({
          total: prev.total - 1,
          noLeidas: Math.max(0, prev.noLeidas - 1)
        }))
      } else {
        setStats(prev => ({ ...prev, total: prev.total - 1 }))
      }
    })
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative group">
          <div className="h-9 w-9 rounded-lg bg-muted/50 flex items-center justify-center ring-1 ring-border/50 group-hover:ring-primary/30 group-hover:bg-muted transition-all">
            <Bell className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          </div>
          {stats.noLeidas > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground flex items-center justify-center ring-2 ring-background animate-pulse">
              {stats.noLeidas > 9 ? '9+' : stats.noLeidas}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 shadow-executive-lg border-border/50">
        <DropdownMenuLabel className="flex items-center justify-between py-3">
          <div className="flex items-center gap-2">
            <div className="h-1 w-4 bg-gradient-to-r from-primary to-secondary rounded-full" />
            <span className="font-semibold">Notificaciones</span>
          </div>
          {stats.noLeidas > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-1 text-xs text-muted-foreground hover:text-foreground"
              onClick={handleMarcarTodasLeidas}
              disabled={isPending}
            >
              <CheckCheck className="h-3 w-3 mr-1" />
              Marcar todas
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <ScrollArea className="h-[300px]">
          {notificaciones.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No tienes notificaciones
            </div>
          ) : (
            notificaciones.map((notif) => {
              const Icon = tipoIconos[notif.tipo]
              const colorClass = tipoColores[notif.tipo]

              return (
                <div
                  key={notif.id}
                  className={cn(
                    "relative px-3 py-2 hover:bg-muted/50 transition-colors",
                    !notif.leida && "bg-muted/30"
                  )}
                >
                  <div className="flex gap-3">
                    <div className={cn("rounded-full p-1.5 h-fit", colorClass)}>
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={cn(
                          "text-sm",
                          !notif.leida && "font-medium"
                        )}>
                          {notif.titulo}
                        </p>
                        <div className="flex items-center gap-1 shrink-0">
                          {!notif.leida && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleMarcarLeida(notif.id)
                              }}
                              disabled={isPending}
                            >
                              <Check className="h-3 w-3" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5 text-muted-foreground hover:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEliminar(notif.id)
                            }}
                            disabled={isPending}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                        {notif.mensaje}
                      </p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[10px] text-muted-foreground">
                          {formatTiempoRelativo(notif.created_at)}
                        </span>
                        {notif.enlace && (
                          <Link
                            href={notif.enlace}
                            className="text-[10px] text-primary hover:underline"
                            onClick={() => {
                              if (!notif.leida) handleMarcarLeida(notif.id)
                              setIsOpen(false)
                            }}
                          >
                            Ver detalles
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </ScrollArea>

        <DropdownMenuSeparator />
        <div className="p-2">
          <Link href="/dashboard/configuracion" onClick={() => setIsOpen(false)}>
            <Button variant="ghost" size="sm" className="w-full justify-center text-xs">
              Configurar notificaciones
            </Button>
          </Link>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
