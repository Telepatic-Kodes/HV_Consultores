'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Loader2, Plus, MessageSquare, TestTube, CheckCircle, XCircle } from 'lucide-react'
import {
  crearIntegracionSlack,
  actualizarIntegracionSlack,
  pruebaIntegracionSlack,
} from '@/app/dashboard/documentos/automation-actions'

interface SlackIntegrationDialogProps {
  clienteId: string
  integracion?: any
  onSuccess: () => void
  trigger?: React.ReactNode
}

const EVENT_TYPES = [
  { value: 'EXPIRATION', label: 'Vencimiento de documentos' },
  { value: 'COMPLIANCE', label: 'Alertas de cumplimiento' },
  { value: 'APPROVAL', label: 'Aprobaciones pendientes' },
  { value: 'ERROR', label: 'Errores del sistema' },
  { value: 'REPORT', label: 'Reportes generados' },
]

export function SlackIntegrationDialog({
  clienteId,
  integracion,
  onSuccess,
  trigger,
}: SlackIntegrationDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const isEditing = !!integracion

  const [formData, setFormData] = useState({
    nombre: integracion?.nombre || '',
    workspace_nombre: integracion?.workspace_nombre || '',
    webhook_url: integracion?.webhook_url || '',
    canal: integracion?.canal || '',
    eventos_habilitados: integracion?.eventos_habilitados || ['EXPIRATION', 'COMPLIANCE'],
  })

  const handleEventToggle = (event: string) => {
    setFormData((prev) => ({
      ...prev,
      eventos_habilitados: prev.eventos_habilitados.includes(event)
        ? prev.eventos_habilitados.filter((e: string) => e !== event)
        : [...prev.eventos_habilitados, event],
    }))
  }

  const handleTest = async () => {
    if (!integracion?.id) return

    setTesting(true)
    setTestResult(null)

    try {
      const result = await pruebaIntegracionSlack(integracion.id)
      setTestResult(result)
    } catch (err) {
      setTestResult({
        success: false,
        message: err instanceof Error ? err.message : 'Error al probar webhook',
      })
    } finally {
      setTesting(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (!formData.webhook_url.startsWith('https://hooks.slack.com/')) {
        throw new Error('La URL del webhook debe ser de Slack (https://hooks.slack.com/...)')
      }

      if (formData.eventos_habilitados.length === 0) {
        throw new Error('Debe seleccionar al menos un tipo de evento')
      }

      if (isEditing) {
        await actualizarIntegracionSlack(integracion.id, formData)
      } else {
        await crearIntegracionSlack(clienteId, formData)
      }

      setOpen(false)
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar la integración')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    if (!isEditing) {
      setFormData({
        nombre: '',
        workspace_nombre: '',
        webhook_url: '',
        canal: '',
        eventos_habilitados: ['EXPIRATION', 'COMPLIANCE'],
      })
    }
    setError(null)
    setTestResult(null)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen)
        if (!isOpen) resetForm()
      }}
    >
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Agregar Workspace
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-purple-500" />
              {isEditing ? 'Editar Integración' : 'Nueva Integración de Slack'}
            </DialogTitle>
            <DialogDescription>
              Conecte un workspace de Slack para recibir notificaciones en tiempo real.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Nombre */}
            <div className="grid gap-2">
              <Label htmlFor="nombre">Nombre de la Integración *</Label>
              <Input
                id="nombre"
                value={formData.nombre}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, nombre: e.target.value }))
                }
                placeholder="Ej: Alertas Contabilidad"
                required
              />
            </div>

            {/* Workspace */}
            <div className="grid gap-2">
              <Label htmlFor="workspace">Nombre del Workspace</Label>
              <Input
                id="workspace"
                value={formData.workspace_nombre}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, workspace_nombre: e.target.value }))
                }
                placeholder="Ej: Mi Empresa"
              />
            </div>

            {/* Webhook URL */}
            <div className="grid gap-2">
              <Label htmlFor="webhook">Webhook URL *</Label>
              <Input
                id="webhook"
                value={formData.webhook_url}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, webhook_url: e.target.value }))
                }
                placeholder="https://hooks.slack.com/services/..."
                required
                type="url"
              />
              <p className="text-xs text-muted-foreground">
                Obtenga el webhook desde{' '}
                <a
                  href="https://api.slack.com/messaging/webhooks"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline"
                >
                  Slack Incoming Webhooks
                </a>
              </p>
            </div>

            {/* Canal */}
            <div className="grid gap-2">
              <Label htmlFor="canal">Canal *</Label>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">#</span>
                <Input
                  id="canal"
                  value={formData.canal}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, canal: e.target.value.replace('#', '') }))
                  }
                  placeholder="alertas"
                  required
                />
              </div>
            </div>

            {/* Eventos */}
            <div className="grid gap-2">
              <Label>Eventos a notificar *</Label>
              <div className="space-y-2 border rounded-md p-3">
                {EVENT_TYPES.map((event) => (
                  <div key={event.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={event.value}
                      checked={formData.eventos_habilitados.includes(event.value)}
                      onCheckedChange={() => handleEventToggle(event.value)}
                    />
                    <label
                      htmlFor={event.value}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {event.label}
                    </label>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-1 mt-1">
                {formData.eventos_habilitados.map((evento: string) => (
                  <Badge key={evento} variant="secondary" className="text-xs">
                    {EVENT_TYPES.find((e) => e.value === evento)?.label}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Test Button (solo cuando está editando) */}
            {isEditing && (
              <div className="grid gap-2">
                <Label>Probar Conexión</Label>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleTest}
                    disabled={testing}
                  >
                    {testing ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <TestTube className="h-4 w-4 mr-2" />
                    )}
                    Enviar mensaje de prueba
                  </Button>
                  {testResult && (
                    <span className={`flex items-center gap-1 text-sm ${testResult.success ? 'text-green-600' : 'text-red-600'}`}>
                      {testResult.success ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <XCircle className="h-4 w-4" />
                      )}
                      {testResult.message}
                    </span>
                  )}
                </div>
              </div>
            )}

            {error && (
              <div className="text-sm text-red-500 bg-red-50 p-2 rounded">
                {error}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isEditing ? 'Guardar Cambios' : 'Conectar Slack'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
