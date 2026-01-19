'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Shield,
  Plus,
  CheckCircle2,
  AlertCircle,
  Trash2,
  RefreshCw,
  Loader2,
  Key,
  FileKey,
  User,
} from 'lucide-react'
import {
  saveCredenciales,
  deleteCredenciales,
  validarCredenciales,
  getClientesSinCredenciales,
} from '../actions'
import type { SiiAuthMethod } from '@/lib/sii-rpa/types'

// ============================================================================
// TYPES
// ============================================================================

interface ClienteConCredenciales {
  id: string
  nombre: string
  rut: string
  credencial_id: string
  ultimo_login?: string
  validacion_exitosa: boolean
}

interface CredentialsManagerProps {
  clientes: ClienteConCredenciales[]
}

// ============================================================================
// CONSTANTS
// ============================================================================

const AUTH_METHODS: Array<{
  value: SiiAuthMethod
  label: string
  description: string
  icon: React.ComponentType<{ className?: string }>
}> = [
  {
    value: 'rut_clave',
    label: 'RUT + Clave',
    description: 'Acceso con RUT y clave del SII',
    icon: Key,
  },
  {
    value: 'clave_unica',
    label: 'Clave Única',
    description: 'Acceso con Clave Única del Estado',
    icon: User,
  },
  {
    value: 'certificado_digital',
    label: 'Certificado Digital',
    description: 'Acceso con certificado digital (.pfx)',
    icon: FileKey,
  },
]

// ============================================================================
// COMPONENT
// ============================================================================

export function CredentialsManager({ clientes }: CredentialsManagerProps) {
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [clienteToDelete, setClienteToDelete] = useState<string | null>(null)
  const [clientesToValidar, setClientesToValidar] = useState<Set<string>>(new Set())

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Gestión de Credenciales SII</CardTitle>
              <CardDescription>
                Administra las credenciales de acceso al portal SII para cada cliente
              </CardDescription>
            </div>
            <Button onClick={() => setShowAddDialog(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Agregar Credenciales
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Lista de Clientes */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {clientes.map((cliente) => (
          <ClienteCredentialCard
            key={cliente.id}
            cliente={cliente}
            isValidating={clientesToValidar.has(cliente.id)}
            onValidate={() => {
              setClientesToValidar((prev) => new Set(prev).add(cliente.id))
              validarCredenciales(cliente.id).finally(() => {
                setClientesToValidar((prev) => {
                  const next = new Set(prev)
                  next.delete(cliente.id)
                  return next
                })
              })
            }}
            onDelete={() => setClienteToDelete(cliente.id)}
          />
        ))}

        {clientes.length === 0 && (
          <Card className="col-span-full border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Shield className="h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-medium">Sin Credenciales Configuradas</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Agrega credenciales SII para comenzar a automatizar
              </p>
              <Button
                variant="outline"
                className="mt-4 gap-2"
                onClick={() => setShowAddDialog(true)}
              >
                <Plus className="h-4 w-4" />
                Agregar Primera Credencial
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Dialog para Agregar Credenciales */}
      <AddCredentialsDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        existingClienteIds={clientes.map((c) => c.id)}
      />

      {/* Dialog de Confirmación para Eliminar */}
      <AlertDialog
        open={!!clienteToDelete}
        onOpenChange={() => setClienteToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar Credenciales</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de eliminar las credenciales de este cliente? Esta acción no se puede
              deshacer y deberás volver a configurarlas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={async () => {
                if (clienteToDelete) {
                  await deleteCredenciales(clienteToDelete)
                }
                setClienteToDelete(null)
              }}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function ClienteCredentialCard({
  cliente,
  isValidating,
  onValidate,
  onDelete,
}: {
  cliente: ClienteConCredenciales
  isValidating: boolean
  onValidate: () => void
  onDelete: () => void
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base">{cliente.nombre}</CardTitle>
            <CardDescription>{cliente.rut}</CardDescription>
          </div>
          {cliente.validacion_exitosa ? (
            <Badge variant="outline" className="bg-green-100 text-green-700 border-0">
              <CheckCircle2 className="mr-1 h-3 w-3" />
              Validado
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-yellow-100 text-yellow-700 border-0">
              <AlertCircle className="mr-1 h-3 w-3" />
              Sin validar
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {cliente.ultimo_login && (
          <p className="text-xs text-muted-foreground mb-4">
            Último login: {new Date(cliente.ultimo_login).toLocaleString('es-CL')}
          </p>
        )}
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="flex-1 gap-1"
            onClick={onValidate}
            disabled={isValidating}
          >
            {isValidating ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <RefreshCw className="h-3 w-3" />
            )}
            Validar
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={onDelete}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function AddCredentialsDialog({
  open,
  onOpenChange,
  existingClienteIds,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  existingClienteIds: string[]
}) {
  const [isPending, startTransition] = useTransition()
  const [clientesSinCred, setClientesSinCred] = useState<
    Array<{ id: string; nombre: string; rut: string }>
  >([])
  const [loadingClientes, setLoadingClientes] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [selectedCliente, setSelectedCliente] = useState('')
  const [authMethod, setAuthMethod] = useState<SiiAuthMethod>('rut_clave')
  const [rut, setRut] = useState('')
  const [password, setPassword] = useState('')
  const [rutRepresentante, setRutRepresentante] = useState('')
  const [certificadoBase64, setCertificadoBase64] = useState('')
  const [certificadoPassword, setCertificadoPassword] = useState('')

  // Cargar clientes sin credenciales
  const loadClientes = async () => {
    setLoadingClientes(true)
    try {
      const clientes = await getClientesSinCredenciales()
      setClientesSinCred(clientes)
    } catch (e) {
      console.error('Error loading clientes:', e)
    }
    setLoadingClientes(false)
  }

  // Reset form
  const resetForm = () => {
    setSelectedCliente('')
    setAuthMethod('rut_clave')
    setRut('')
    setPassword('')
    setRutRepresentante('')
    setCertificadoBase64('')
    setCertificadoPassword('')
    setError(null)
  }

  // Handle file upload for certificate
  const handleCertificateUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1]
        setCertificadoBase64(base64)
      }
      reader.readAsDataURL(file)
    }
  }

  // Submit
  const handleSubmit = () => {
    if (!selectedCliente || !rut || !password) {
      setError('Por favor completa todos los campos requeridos')
      return
    }

    setError(null)
    startTransition(async () => {
      const result = await saveCredenciales(selectedCliente, {
        rut,
        password,
        metodo_autenticacion: authMethod,
        rut_representante: rutRepresentante || undefined,
        certificado_base64: certificadoBase64 || undefined,
        certificado_password: certificadoPassword || undefined,
      })

      if (result.success) {
        onOpenChange(false)
        resetForm()
      } else {
        setError(result.error || 'Error al guardar credenciales')
      }
    })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o)
        if (o) {
          loadClientes()
        } else {
          resetForm()
        }
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Agregar Credenciales SII</DialogTitle>
          <DialogDescription>
            Configura las credenciales de acceso al portal SII para un cliente
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Selector de Cliente */}
          <div className="space-y-2">
            <Label>Cliente</Label>
            {loadingClientes ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Cargando clientes...
              </div>
            ) : clientesSinCred.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Todos los clientes ya tienen credenciales configuradas
              </p>
            ) : (
              <Select value={selectedCliente} onValueChange={setSelectedCliente}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un cliente..." />
                </SelectTrigger>
                <SelectContent>
                  {clientesSinCred.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nombre} ({c.rut})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Método de Autenticación */}
          <div className="space-y-2">
            <Label>Método de Autenticación</Label>
            <div className="grid gap-2">
              {AUTH_METHODS.map((method) => {
                const Icon = method.icon
                return (
                  <button
                    key={method.value}
                    type="button"
                    onClick={() => setAuthMethod(method.value)}
                    className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-all hover:bg-accent ${
                      authMethod === method.value ? 'border-primary ring-2 ring-primary' : ''
                    }`}
                  >
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{method.label}</p>
                      <p className="text-xs text-muted-foreground">{method.description}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* RUT */}
          <div className="space-y-2">
            <Label htmlFor="rut">RUT del Contribuyente</Label>
            <Input
              id="rut"
              placeholder="12.345.678-9"
              value={rut}
              onChange={(e) => setRut(e.target.value)}
            />
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="password">
              {authMethod === 'clave_unica' ? 'Clave Única' : 'Clave SII'}
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {/* RUT Representante (opcional) */}
          <div className="space-y-2">
            <Label htmlFor="rutRepresentante">RUT Representante (opcional)</Label>
            <Input
              id="rutRepresentante"
              placeholder="98.765.432-1"
              value={rutRepresentante}
              onChange={(e) => setRutRepresentante(e.target.value)}
            />
          </div>

          {/* Certificado Digital */}
          {authMethod === 'certificado_digital' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="certificado">Certificado Digital (.pfx)</Label>
                <Input
                  id="certificado"
                  type="file"
                  accept=".pfx,.p12"
                  onChange={handleCertificateUpload}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="certPassword">Contraseña del Certificado</Label>
                <Input
                  id="certPassword"
                  type="password"
                  placeholder="••••••••"
                  value={certificadoPassword}
                  onChange={(e) => setCertificadoPassword(e.target.value)}
                />
              </div>
            </>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-red-700 dark:bg-red-950 dark:text-red-300">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{error}</span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isPending || !selectedCliente}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              'Guardar Credenciales'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
