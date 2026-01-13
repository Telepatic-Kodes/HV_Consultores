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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2, Plus, Zap, Copy, Eye, EyeOff } from 'lucide-react'
import { crearWebhook, actualizarWebhook } from '@/app/dashboard/documentos/automation-actions'

interface WebhookDialogProps {
  clienteId: string
  webhook?: any
  onSuccess: () => void
  trigger?: React.ReactNode
}

const EVENT_TYPES = [
  { value: 'documento.creado', label: 'Documento creado' },
  { value: 'documento.aprobado', label: 'Documento aprobado' },
  { value: 'documento.rechazado', label: 'Documento rechazado' },
  { value: 'documento.enviado', label: 'Documento enviado a Nubox' },
  { value: 'documento.vencido', label: 'Documento vencido' },
  { value: 'reporte.generado', label: 'Reporte generado' },
  { value: 'politica.ejecutada', label: 'Política de retención ejecutada' },
  { value: 'error.critico', label: 'Error crítico' },
]

function generateSecret(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

export function WebhookDialog({
  clienteId,
  webhook,
  onSuccess,
  trigger,
}: WebhookDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showSecret, setShowSecret] = useState(false)

  const isEditing = !!webhook

  const [formData, setFormData] = useState({
    nombre: webhook?.nombre || '',
    url: webhook?.url || '',
    evento_tipo: webhook?.evento_tipo || 'documento.creado',
    secret: webhook?.secret || generateSecret(),
    reintentos: webhook?.reintentos || 3,
    timeout_segundos: webhook?.timeout_segundos || 30,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (!formData.url.startsWith('https://')) {
        throw new Error('La URL debe usar HTTPS por seguridad')
      }

      if (isEditing) {
        await actualizarWebhook(webhook.id, {
          nombre: formData.nombre,
          url: formData.url,
          evento_tipo: formData.evento_tipo,
          reintentos: formData.reintentos,
          timeout_segundos: formData.timeout_segundos,
        })
      } else {
        await crearWebhook(clienteId, formData)
      }

      setOpen(false)
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar el webhook')
    } finally {
      setLoading(false)
    }
  }

  const copySecret = () => {
    navigator.clipboard.writeText(formData.secret)
  }

  const regenerateSecret = () => {
    setFormData((prev) => ({ ...prev, secret: generateSecret() }))
  }

  const resetForm = () => {
    if (!isEditing) {
      setFormData({
        nombre: '',
        url: '',
        evento_tipo: 'documento.creado',
        secret: generateSecret(),
        reintentos: 3,
        timeout_segundos: 30,
      })
    }
    setError(null)
    setShowSecret(false)
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
            Agregar Webhook
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-orange-500" />
              {isEditing ? 'Editar Webhook' : 'Nuevo Webhook'}
            </DialogTitle>
            <DialogDescription>
              Configure un webhook para enviar eventos a sistemas externos.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Nombre */}
            <div className="grid gap-2">
              <Label htmlFor="nombre">Nombre del Webhook *</Label>
              <Input
                id="nombre"
                value={formData.nombre}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, nombre: e.target.value }))
                }
                placeholder="Ej: Notificar ERP"
                required
              />
            </div>

            {/* URL */}
            <div className="grid gap-2">
              <Label htmlFor="url">URL del Endpoint *</Label>
              <Input
                id="url"
                value={formData.url}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, url: e.target.value }))
                }
                placeholder="https://api.ejemplo.com/webhook"
                required
                type="url"
              />
              <p className="text-xs text-muted-foreground">
                Debe ser una URL HTTPS válida
              </p>
            </div>

            {/* Evento */}
            <div className="grid gap-2">
              <Label>Tipo de Evento *</Label>
              <Select
                value={formData.evento_tipo}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, evento_tipo: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione evento" />
                </SelectTrigger>
                <SelectContent>
                  {EVENT_TYPES.map((event) => (
                    <SelectItem key={event.value} value={event.value}>
                      {event.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Secret */}
            <div className="grid gap-2">
              <Label htmlFor="secret">Secret (para verificación HMAC-SHA256)</Label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Input
                    id="secret"
                    value={formData.secret}
                    readOnly
                    type={showSecret ? 'text' : 'password'}
                    className="pr-20 font-mono text-xs"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => setShowSecret(!showSecret)}
                    >
                      {showSecret ? (
                        <EyeOff className="h-3 w-3" />
                      ) : (
                        <Eye className="h-3 w-3" />
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={copySecret}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                {!isEditing && (
                  <Button type="button" variant="outline" size="sm" onClick={regenerateSecret}>
                    Regenerar
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Use este secret para verificar las firmas de los webhooks (header X-Signature)
              </p>
            </div>

            {/* Configuración avanzada */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="reintentos">Reintentos</Label>
                <Input
                  id="reintentos"
                  type="number"
                  min={0}
                  max={10}
                  value={formData.reintentos}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      reintentos: parseInt(e.target.value) || 0,
                    }))
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="timeout">Timeout (segundos)</Label>
                <Input
                  id="timeout"
                  type="number"
                  min={5}
                  max={120}
                  value={formData.timeout_segundos}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      timeout_segundos: parseInt(e.target.value) || 30,
                    }))
                  }
                />
              </div>
            </div>

            {/* Ejemplo de payload */}
            <div className="grid gap-2">
              <Label>Ejemplo de Payload</Label>
              <div className="bg-muted p-3 rounded-md font-mono text-xs overflow-auto max-h-32">
                <pre>{JSON.stringify({
                  evento: formData.evento_tipo,
                  timestamp: new Date().toISOString(),
                  data: {
                    documento_id: "uuid-ejemplo",
                    cliente_id: clienteId,
                    tipo: "FACTURA",
                    folio: "F-001"
                  }
                }, null, 2)}</pre>
              </div>
            </div>

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
              {isEditing ? 'Guardar Cambios' : 'Crear Webhook'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
