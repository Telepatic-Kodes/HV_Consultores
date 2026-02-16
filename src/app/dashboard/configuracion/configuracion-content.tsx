'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  User,
  Bell,
  Shield,
  Key,
  Database,
  CreditCard,
  Save,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle,
  XCircle,
} from 'lucide-react'
import { SubscriptionManager } from '@/components/billing/SubscriptionManager'
import {
  actualizarPerfil,
  actualizarNotificaciones,
  guardarIntegracion,
  verificarIntegracion,
  cambiarPassword,
} from './actions'
import type { UserProfile, NotificacionConfig, IntegracionConfig } from './actions'

interface SubscriptionData {
  plan: 'free' | 'pro' | 'enterprise'
  status: string
  maxClients: number
  maxBotRuns: number
  cancelAtPeriodEnd?: boolean
  currentPeriodEnd?: string | null
  stripeCustomerId?: string | null
  stripeSubscriptionId?: string | null
}

interface UsageData {
  plan: string
  clients: { used: number; limit: number }
  botRuns: { used: number; limit: number }
}

interface ConfiguracionContentProps {
  profile: UserProfile | null
  notificaciones: NotificacionConfig
  integraciones: IntegracionConfig
  subscription?: SubscriptionData | null
  usage?: UsageData | null
  userId?: string
  email?: string
}

type TabType = 'perfil' | 'facturacion' | 'notificaciones' | 'seguridad' | 'api' | 'integraciones'

const tabs: { id: TabType; icon: typeof User; label: string }[] = [
  { id: 'perfil', icon: User, label: 'Perfil' },
  { id: 'facturacion', icon: CreditCard, label: 'Facturación' },
  { id: 'notificaciones', icon: Bell, label: 'Notificaciones' },
  { id: 'seguridad', icon: Shield, label: 'Seguridad' },
  { id: 'api', icon: Key, label: 'API Keys' },
  { id: 'integraciones', icon: Database, label: 'Integraciones' },
]

export function ConfiguracionContent({
  profile,
  notificaciones,
  integraciones,
  subscription,
  usage,
  userId,
  email,
}: ConfiguracionContentProps) {
  const [isPending, startTransition] = useTransition()
  const [activeTab, setActiveTab] = useState<TabType>('perfil')
  const [showApiKey, setShowApiKey] = useState(false)
  const [mensaje, setMensaje] = useState<{ tipo: 'success' | 'error'; texto: string } | null>(null)

  // Estado del formulario de perfil
  const [perfilForm, setPerfilForm] = useState({
    nombre_completo: profile?.nombre_completo || '',
    telefono: profile?.telefono || '',
    cargo: profile?.cargo || '',
  })

  // Estado de notificaciones
  const [notifConfig, setNotifConfig] = useState(notificaciones)

  // Estado de integraciones
  const [integForm, setIntegForm] = useState({
    nubox: '',
    openai: '',
    sii: '',
  })

  // Estado de seguridad
  const [passwordForm, setPasswordForm] = useState({
    actual: '',
    nuevo: '',
    confirmar: '',
  })

  // Estado de verificación
  const [verificando, setVerificando] = useState<string | null>(null)

  const handleGuardarPerfil = async () => {
    startTransition(async () => {
      const result = await actualizarPerfil(perfilForm)
      setMensaje(
        result.success
          ? { tipo: 'success', texto: 'Perfil actualizado correctamente' }
          : { tipo: 'error', texto: result.error || 'Error al actualizar' }
      )
      setTimeout(() => setMensaje(null), 3000)
    })
  }

  const handleGuardarNotificaciones = async () => {
    startTransition(async () => {
      const result = await actualizarNotificaciones(notifConfig)
      setMensaje(
        result.success
          ? { tipo: 'success', texto: 'Notificaciones actualizadas' }
          : { tipo: 'error', texto: 'Error al guardar' }
      )
      setTimeout(() => setMensaje(null), 3000)
    })
  }

  const handleGuardarIntegracion = async (tipo: 'nubox' | 'openai' | 'sii') => {
    const credencial = integForm[tipo]
    if (!credencial) return

    startTransition(async () => {
      const result = await guardarIntegracion(tipo, credencial)
      setMensaje(
        result.success
          ? { tipo: 'success', texto: `Credencial de ${tipo} guardada` }
          : { tipo: 'error', texto: result.error || 'Error al guardar' }
      )
      if (result.success) {
        setIntegForm((prev) => ({ ...prev, [tipo]: '' }))
      }
      setTimeout(() => setMensaje(null), 3000)
    })
  }

  const handleVerificarIntegracion = async (tipo: 'nubox' | 'openai' | 'sii') => {
    setVerificando(tipo)
    const result = await verificarIntegracion(tipo)
    setMensaje({ tipo: result.success ? 'success' : 'error', texto: result.mensaje })
    setVerificando(null)
    setTimeout(() => setMensaje(null), 3000)
  }

  const handleCambiarPassword = async () => {
    if (passwordForm.nuevo !== passwordForm.confirmar) {
      setMensaje({ tipo: 'error', texto: 'Las contraseñas no coinciden' })
      return
    }

    startTransition(async () => {
      const result = await cambiarPassword(passwordForm.actual, passwordForm.nuevo)
      setMensaje(
        result.success
          ? { tipo: 'success', texto: 'Contraseña actualizada' }
          : { tipo: 'error', texto: result.error || 'Error al cambiar contraseña' }
      )
      if (result.success) {
        setPasswordForm({ actual: '', nuevo: '', confirmar: '' })
      }
      setTimeout(() => setMensaje(null), 3000)
    })
  }

  return (
    <main className="p-8 space-y-6">
      {/* Section Header */}
      <div className="flex items-center gap-3">
        <div className="h-1 w-8 bg-gradient-to-r from-primary to-secondary rounded-full" />
        <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Configuracion de Cuenta
        </span>
      </div>

      {mensaje && (
        <div
          className={`fixed top-20 right-8 z-50 p-4 rounded-lg shadow-executive-lg flex items-center gap-3 animate-in slide-in-from-right ${
            mensaje.tipo === 'success'
              ? 'bg-success/10 text-success border border-success/20'
              : 'bg-destructive/10 text-destructive border border-destructive/20'
          }`}
        >
          {mensaje.tipo === 'success' ? (
            <CheckCircle className="h-5 w-5" />
          ) : (
            <XCircle className="h-5 w-5" />
          )}
          <span className="font-medium text-sm">{mensaje.texto}</span>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Sidebar */}
        <Card className="lg:col-span-1 h-fit">
          <CardContent className="p-3">
            <nav className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </CardContent>
        </Card>

        {/* Main content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Perfil */}
          {activeTab === 'perfil' && (
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Perfil de Usuario</CardTitle>
                    <CardDescription className="text-xs">Actualiza tu informacion personal</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-4 p-4 rounded-lg bg-gradient-to-br from-muted/30 to-muted/10 border border-border/30">
                  <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center ring-2 ring-primary/10">
                    <User className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">{profile?.nombre_completo || 'Usuario'}</p>
                    <p className="text-sm text-muted-foreground">{profile?.email}</p>
                    <span className="inline-block mt-1.5 text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary px-2.5 py-1 rounded-full">
                      {profile?.rol}
                    </span>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Nombre Completo</label>
                    <Input
                      value={perfilForm.nombre_completo}
                      onChange={(e) =>
                        setPerfilForm((prev) => ({ ...prev, nombre_completo: e.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Email</label>
                    <Input value={profile?.email || ''} disabled />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Teléfono</label>
                    <Input
                      value={perfilForm.telefono}
                      onChange={(e) =>
                        setPerfilForm((prev) => ({ ...prev, telefono: e.target.value }))
                      }
                      placeholder="+56 9 1234 5678"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Cargo</label>
                    <Input
                      value={perfilForm.cargo}
                      onChange={(e) =>
                        setPerfilForm((prev) => ({ ...prev, cargo: e.target.value }))
                      }
                      placeholder="Contador"
                    />
                  </div>
                </div>

                <Button onClick={handleGuardarPerfil} disabled={isPending}>
                  {isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Guardar Cambios
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Facturación */}
          {activeTab === 'facturacion' && (
            <SubscriptionManager
              subscription={subscription || null}
              usage={usage || null}
              userId={userId || ''}
              email={email || ''}
            />
          )}

          {/* Notificaciones */}
          {activeTab === 'notificaciones' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notificaciones
                </CardTitle>
                <CardDescription>Configura cómo recibes las alertas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    {
                      key: 'documentos_pendientes' as const,
                      label: 'Documentos pendientes de clasificación',
                      desc: 'Recibir alerta cuando hay documentos sin clasificar',
                    },
                    {
                      key: 'errores_bots' as const,
                      label: 'Errores en bots',
                      desc: 'Notificar cuando un bot falla',
                    },
                    {
                      key: 'f29_listos' as const,
                      label: 'F29 listos para revisión',
                      desc: 'Aviso cuando un F29 está listo',
                    },
                    {
                      key: 'resumen_diario' as const,
                      label: 'Resumen diario',
                      desc: 'Email con resumen de actividad',
                    },
                  ].map((item) => (
                    <div
                      key={item.key}
                      className="flex items-start justify-between gap-4 p-3 rounded-lg border"
                    >
                      <div>
                        <p className="font-medium text-sm">{item.label}</p>
                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={notifConfig[item.key]}
                          onChange={(e) =>
                            setNotifConfig((prev) => ({
                              ...prev,
                              [item.key]: e.target.checked,
                            }))
                          }
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                      </label>
                    </div>
                  ))}
                </div>

                <Button className="mt-4" onClick={handleGuardarNotificaciones} disabled={isPending}>
                  {isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Guardar Preferencias
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Seguridad */}
          {activeTab === 'seguridad' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Seguridad
                </CardTitle>
                <CardDescription>Cambia tu contraseña</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Contraseña Actual</label>
                  <Input
                    type="password"
                    value={passwordForm.actual}
                    onChange={(e) =>
                      setPasswordForm((prev) => ({ ...prev, actual: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nueva Contraseña</label>
                  <Input
                    type="password"
                    value={passwordForm.nuevo}
                    onChange={(e) =>
                      setPasswordForm((prev) => ({ ...prev, nuevo: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Confirmar Nueva Contraseña</label>
                  <Input
                    type="password"
                    value={passwordForm.confirmar}
                    onChange={(e) =>
                      setPasswordForm((prev) => ({ ...prev, confirmar: e.target.value }))
                    }
                  />
                </div>

                <Button onClick={handleCambiarPassword} disabled={isPending}>
                  {isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Shield className="mr-2 h-4 w-4" />
                  )}
                  Cambiar Contraseña
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Integraciones */}
          {(activeTab === 'api' || activeTab === 'integraciones') && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Integraciones
                </CardTitle>
                <CardDescription>Credenciales de servicios externos</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Nubox */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Nubox API Key</label>
                    {integraciones.nubox_configured && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                        Configurada
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        type={showApiKey ? 'text' : 'password'}
                        value={integForm.nubox}
                        onChange={(e) =>
                          setIntegForm((prev) => ({ ...prev, nubox: e.target.value }))
                        }
                        placeholder={integraciones.nubox_configured ? '••••••••' : 'nb_live_...'}
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        onClick={() => setShowApiKey(!showApiKey)}
                      >
                        {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => handleVerificarIntegracion('nubox')}
                      disabled={verificando === 'nubox'}
                    >
                      {verificando === 'nubox' ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'Verificar'
                      )}
                    </Button>
                    <Button
                      onClick={() => handleGuardarIntegracion('nubox')}
                      disabled={!integForm.nubox || isPending}
                    >
                      Guardar
                    </Button>
                  </div>
                </div>

                {/* OpenAI */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">OpenAI API Key</label>
                    {integraciones.openai_configured && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                        Configurada
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      type="password"
                      value={integForm.openai}
                      onChange={(e) =>
                        setIntegForm((prev) => ({ ...prev, openai: e.target.value }))
                      }
                      placeholder={integraciones.openai_configured ? '••••••••' : 'sk-...'}
                      className="flex-1"
                    />
                    <Button
                      variant="outline"
                      onClick={() => handleVerificarIntegracion('openai')}
                      disabled={verificando === 'openai'}
                    >
                      {verificando === 'openai' ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'Verificar'
                      )}
                    </Button>
                    <Button
                      onClick={() => handleGuardarIntegracion('openai')}
                      disabled={!integForm.openai || isPending}
                    >
                      Guardar
                    </Button>
                  </div>
                </div>

                {/* SII */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Credenciales SII</label>
                    {integraciones.sii_configured ? (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                        Configurada
                      </span>
                    ) : (
                      <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">
                        No configurada
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Las credenciales del SII se configuran por cliente en el módulo de Clientes
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </main>
  )
}
