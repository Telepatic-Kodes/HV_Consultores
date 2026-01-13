'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Loader2, Bell, Mail, MessageSquare, Save, CheckCircle } from 'lucide-react'
import {
  obtenerPreferencias,
  actualizarPreferencias,
} from '@/app/dashboard/documentos/automation-actions'

interface NotificationPreferencesProps {
  usuarioId: string
  clienteId: string
}

const FREQUENCIES = [
  { value: 'INMEDIATA', label: 'Inmediata (en tiempo real)' },
  { value: 'DIARIA', label: 'Resumen diario' },
  { value: 'SEMANAL', label: 'Resumen semanal' },
]

export function NotificationPreferences({
  usuarioId,
  clienteId,
}: NotificationPreferencesProps) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [preferences, setPreferences] = useState({
    // Email
    email_habilitado: true,
    email_direccion: '',
    // Slack
    slack_habilitado: false,
    slack_webhook_url: '',
    slack_canal: '',
    // In-App
    inapp_habilitado: true,
    // Frequency
    resumen_frecuencia: 'INMEDIATA',
    // Alert types
    alertas_vencimiento: true,
    alertas_aprobacion: true,
    alertas_sistema: false,
    alertas_cumplimiento: true,
  })

  useEffect(() => {
    loadPreferences()
  }, [usuarioId])

  const loadPreferences = async () => {
    setLoading(true)
    try {
      const data = await obtenerPreferencias(usuarioId)
      if (data) {
        setPreferences((prev) => ({
          ...prev,
          ...data,
        }))
      }
    } catch (err) {
      console.error('Error loading preferences:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    setSaved(false)

    try {
      await actualizarPreferencias(usuarioId, clienteId, preferences)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar preferencias')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-amber-500" />
          Preferencias de Notificaciones
        </CardTitle>
        <CardDescription>
          Configure cómo y cuándo desea recibir notificaciones del sistema.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Canales de notificación */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold">Canales de Notificación</h3>

          {/* Email */}
          <div className="flex items-start justify-between p-4 border rounded-lg">
            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 mt-0.5 text-blue-500" />
              <div>
                <Label className="text-base">Notificaciones por Email</Label>
                <p className="text-sm text-muted-foreground">
                  Reciba alertas y resúmenes en su correo electrónico
                </p>
                {preferences.email_habilitado && (
                  <div className="mt-2">
                    <Input
                      type="email"
                      placeholder="correo@ejemplo.com"
                      value={preferences.email_direccion}
                      onChange={(e) =>
                        setPreferences((prev) => ({
                          ...prev,
                          email_direccion: e.target.value,
                        }))
                      }
                      className="max-w-xs"
                    />
                  </div>
                )}
              </div>
            </div>
            <Switch
              checked={preferences.email_habilitado}
              onCheckedChange={(checked) =>
                setPreferences((prev) => ({ ...prev, email_habilitado: checked }))
              }
            />
          </div>

          {/* Slack */}
          <div className="flex items-start justify-between p-4 border rounded-lg">
            <div className="flex items-start gap-3">
              <MessageSquare className="h-5 w-5 mt-0.5 text-purple-500" />
              <div>
                <Label className="text-base">Notificaciones en Slack</Label>
                <p className="text-sm text-muted-foreground">
                  Reciba alertas en su canal de Slack personal
                </p>
                {preferences.slack_habilitado && (
                  <div className="mt-2 space-y-2">
                    <Input
                      placeholder="https://hooks.slack.com/services/..."
                      value={preferences.slack_webhook_url}
                      onChange={(e) =>
                        setPreferences((prev) => ({
                          ...prev,
                          slack_webhook_url: e.target.value,
                        }))
                      }
                      className="max-w-md"
                    />
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">#</span>
                      <Input
                        placeholder="mi-canal"
                        value={preferences.slack_canal}
                        onChange={(e) =>
                          setPreferences((prev) => ({
                            ...prev,
                            slack_canal: e.target.value.replace('#', ''),
                          }))
                        }
                        className="max-w-[200px]"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
            <Switch
              checked={preferences.slack_habilitado}
              onCheckedChange={(checked) =>
                setPreferences((prev) => ({ ...prev, slack_habilitado: checked }))
              }
            />
          </div>

          {/* In-App */}
          <div className="flex items-start justify-between p-4 border rounded-lg">
            <div className="flex items-start gap-3">
              <Bell className="h-5 w-5 mt-0.5 text-amber-500" />
              <div>
                <Label className="text-base">Notificaciones en la Aplicación</Label>
                <p className="text-sm text-muted-foreground">
                  Ver alertas en el centro de notificaciones del sistema
                </p>
              </div>
            </div>
            <Switch
              checked={preferences.inapp_habilitado}
              onCheckedChange={(checked) =>
                setPreferences((prev) => ({ ...prev, inapp_habilitado: checked }))
              }
            />
          </div>
        </div>

        <Separator />

        {/* Frecuencia */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold">Frecuencia de Resúmenes</h3>
          <div className="max-w-xs">
            <Select
              value={preferences.resumen_frecuencia}
              onValueChange={(value) =>
                setPreferences((prev) => ({ ...prev, resumen_frecuencia: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccione frecuencia" />
              </SelectTrigger>
              <SelectContent>
                {FREQUENCIES.map((freq) => (
                  <SelectItem key={freq.value} value={freq.value}>
                    {freq.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              Define con qué frecuencia recibe resúmenes de actividad
            </p>
          </div>
        </div>

        <Separator />

        {/* Tipos de alertas */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold">Tipos de Alertas</h3>
          <p className="text-sm text-muted-foreground">
            Seleccione qué tipos de alertas desea recibir
          </p>

          <div className="grid gap-3">
            <div className="flex items-center justify-between">
              <div>
                <Label>Alertas de Vencimiento</Label>
                <p className="text-xs text-muted-foreground">
                  Documentos próximos a vencer o vencidos
                </p>
              </div>
              <Switch
                checked={preferences.alertas_vencimiento}
                onCheckedChange={(checked) =>
                  setPreferences((prev) => ({
                    ...prev,
                    alertas_vencimiento: checked,
                  }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Alertas de Aprobación</Label>
                <p className="text-xs text-muted-foreground">
                  Documentos pendientes de aprobación
                </p>
              </div>
              <Switch
                checked={preferences.alertas_aprobacion}
                onCheckedChange={(checked) =>
                  setPreferences((prev) => ({
                    ...prev,
                    alertas_aprobacion: checked,
                  }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Alertas de Cumplimiento</Label>
                <p className="text-xs text-muted-foreground">
                  Cambios en el estado de cumplimiento
                </p>
              </div>
              <Switch
                checked={preferences.alertas_cumplimiento}
                onCheckedChange={(checked) =>
                  setPreferences((prev) => ({
                    ...prev,
                    alertas_cumplimiento: checked,
                  }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Alertas del Sistema</Label>
                <p className="text-xs text-muted-foreground">
                  Errores, mantenimiento y actualizaciones
                </p>
              </div>
              <Switch
                checked={preferences.alertas_sistema}
                onCheckedChange={(checked) =>
                  setPreferences((prev) => ({
                    ...prev,
                    alertas_sistema: checked,
                  }))
                }
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="text-sm text-red-500 bg-red-50 p-2 rounded">
            {error}
          </div>
        )}

        <div className="flex items-center gap-2 pt-4">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Guardar Preferencias
          </Button>
          {saved && (
            <span className="flex items-center gap-1 text-sm text-green-600">
              <CheckCircle className="h-4 w-4" />
              Guardado
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
