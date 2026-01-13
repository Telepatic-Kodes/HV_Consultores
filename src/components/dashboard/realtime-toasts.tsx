'use client'

import { useEffect, useState } from 'react'
import { useRealtimeContext, type RealtimeNotificacion } from '@/providers/realtime-provider'
import { X, Bell, CheckCircle, AlertTriangle, AlertCircle, Info, Wifi, WifiOff } from 'lucide-react'
import Link from 'next/link'

// Componente individual de Toast
function Toast({
  notificacion,
  onClose,
}: {
  notificacion: RealtimeNotificacion
  onClose: () => void
}) {
  const [isVisible, setIsVisible] = useState(false)
  const [isLeaving, setIsLeaving] = useState(false)

  useEffect(() => {
    // Animación de entrada
    requestAnimationFrame(() => setIsVisible(true))

    // Auto-cerrar después de 5 segundos
    const timer = setTimeout(() => {
      handleClose()
    }, 5000)

    return () => clearTimeout(timer)
  }, [])

  const handleClose = () => {
    setIsLeaving(true)
    setTimeout(onClose, 300)
  }

  const icons = {
    success: <CheckCircle className="h-5 w-5 text-green-500" />,
    warning: <AlertTriangle className="h-5 w-5 text-yellow-500" />,
    error: <AlertCircle className="h-5 w-5 text-red-500" />,
    info: <Info className="h-5 w-5 text-blue-500" />,
  }

  const bgColors = {
    success: 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800',
    warning: 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800',
    error: 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800',
    info: 'bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800',
  }

  const content = (
    <div
      className={`
        flex items-start gap-3 p-4 rounded-lg border shadow-lg max-w-sm
        transition-all duration-300 ease-out
        ${bgColors[notificacion.tipo]}
        ${isVisible && !isLeaving ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
      `}
    >
      <div className="shrink-0 mt-0.5">{icons[notificacion.tipo]}</div>

      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm text-foreground">{notificacion.titulo}</p>
        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{notificacion.mensaje}</p>
      </div>

      <button
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          handleClose()
        }}
        className="shrink-0 p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
      >
        <X className="h-4 w-4 text-muted-foreground" />
      </button>
    </div>
  )

  if (notificacion.enlace) {
    return (
      <Link href={notificacion.enlace} onClick={handleClose}>
        {content}
      </Link>
    )
  }

  return content
}

// Indicador de conexión Realtime
function ConnectionIndicator({ isConnected }: { isConnected: boolean }) {
  return (
    <div
      className={`
        fixed bottom-4 left-4 flex items-center gap-2 px-3 py-2 rounded-full text-xs font-medium
        transition-all duration-300 z-50
        ${
          isConnected
            ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
            : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
        }
      `}
    >
      {isConnected ? (
        <>
          <Wifi className="h-3 w-3" />
          <span>Conectado</span>
        </>
      ) : (
        <>
          <WifiOff className="h-3 w-3" />
          <span>Desconectado</span>
        </>
      )}
    </div>
  )
}

// Contenedor principal de Toasts
export function RealtimeToasts() {
  const { notificaciones, clearNotificacion, isConnected, botsEnEjecucion } = useRealtimeContext()
  const [showIndicator, setShowIndicator] = useState(false)

  // Mostrar indicador solo brevemente cuando cambia el estado
  useEffect(() => {
    setShowIndicator(true)
    const timer = setTimeout(() => setShowIndicator(false), 3000)
    return () => clearTimeout(timer)
  }, [isConnected])

  return (
    <>
      {/* Toasts de notificaciones */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
        {notificaciones.map((notif) => (
          <Toast key={notif.id} notificacion={notif} onClose={() => clearNotificacion(notif.id)} />
        ))}
      </div>

      {/* Indicador de bots en ejecución */}
      {botsEnEjecucion > 0 && (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 px-3 py-2 rounded-full bg-primary text-primary-foreground text-xs font-medium animate-pulse">
          <div className="h-2 w-2 rounded-full bg-current animate-ping" />
          <span>
            {botsEnEjecucion} bot{botsEnEjecucion > 1 ? 's' : ''} en ejecución
          </span>
        </div>
      )}

      {/* Indicador de conexión (temporal) */}
      {showIndicator && <ConnectionIndicator isConnected={isConnected} />}
    </>
  )
}

// Badge de notificaciones para el header
export function NotificationBadge() {
  const { notificacionesNoLeidas } = useRealtimeContext()

  if (notificacionesNoLeidas === 0) {
    return (
      <button className="p-2 rounded-lg hover:bg-muted transition-colors relative">
        <Bell className="h-5 w-5 text-muted-foreground" />
      </button>
    )
  }

  return (
    <button className="p-2 rounded-lg hover:bg-muted transition-colors relative">
      <Bell className="h-5 w-5 text-foreground" />
      <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center font-medium">
        {notificacionesNoLeidas > 9 ? '9+' : notificacionesNoLeidas}
      </span>
    </button>
  )
}
