// @ts-nocheck — temporary: types need update after Convex migration
'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Play,
  FileText,
  Download,
  BarChart3,
  ShoppingCart,
  Receipt,
  Shield,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'
import { ejecutarTareaRapida } from '../actions'
import type { SiiTaskType } from '@/lib/sii-rpa/types'

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

interface TaskSelectorProps {
  clientes: ClienteConCredenciales[]
  selectedCliente: string | null
  onClienteChange: (id: string | null) => void
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

const TASKS: Array<{
  type: SiiTaskType
  label: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  requiresPeriodo?: boolean
}> = [
  {
    type: 'login_test',
    label: 'Validar Login',
    description: 'Verifica las credenciales del cliente',
    icon: Shield,
    color: 'bg-blue-500',
  },
  {
    type: 'situacion_tributaria',
    label: 'Situación Tributaria',
    description: 'Consulta el estado tributario actual',
    icon: BarChart3,
    color: 'bg-green-500',
  },
  {
    type: 'libro_compras',
    label: 'Libro Compras',
    description: 'Descarga el libro de compras del período',
    icon: ShoppingCart,
    color: 'bg-purple-500',
    requiresPeriodo: true,
  },
  {
    type: 'libro_ventas',
    label: 'Libro Ventas',
    description: 'Descarga el libro de ventas del período',
    icon: Receipt,
    color: 'bg-orange-500',
    requiresPeriodo: true,
  },
  {
    type: 'f29_submit',
    label: 'Enviar F29',
    description: 'Envía declaración F29 al SII',
    icon: FileText,
    color: 'bg-red-500',
    requiresPeriodo: true,
  },
  {
    type: 'f29_download',
    label: 'Descargar F29',
    description: 'Descarga formulario F29 presentado',
    icon: Download,
    color: 'bg-cyan-500',
    requiresPeriodo: true,
  },
  {
    type: 'certificate_download',
    label: 'Certificado',
    description: 'Genera certificado de situación tributaria',
    icon: FileText,
    color: 'bg-pink-500',
  },
]

// ============================================================================
// COMPONENT
// ============================================================================

export function TaskSelector({
  clientes,
  selectedCliente,
  onClienteChange,
}: TaskSelectorProps) {
  const [isPending, startTransition] = useTransition()
  const [selectedTask, setSelectedTask] = useState<SiiTaskType | null>(null)
  const [periodo, setPeriodo] = useState('')
  const [result, setResult] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)

  const cliente = clientes.find((c) => c.id === selectedCliente)
  const task = TASKS.find((t) => t.type === selectedTask)

  const handleExecute = () => {
    if (!selectedCliente || !selectedTask) return

    setResult(null)
    startTransition(async () => {
      try {
        const parametros: Record<string, unknown> = {}
        if (periodo) {
          parametros.periodo = periodo
        }

        const res = await ejecutarTareaRapida(selectedCliente, selectedTask, parametros)

        if (res.success) {
          setResult({
            type: 'success',
            message: `Job creado exitosamente (ID: ${res.jobId?.slice(0, 8)}...)`,
          })
          setSelectedTask(null)
          setPeriodo('')
        } else {
          setResult({
            type: 'error',
            message: res.error || 'Error al crear el job',
          })
        }
      } catch (error) {
        setResult({
          type: 'error',
          message: 'Error inesperado al ejecutar la tarea',
        })
      }
    })
  }

  // Generar opciones de período (últimos 12 meses)
  const periodoOptions = generatePeriodoOptions()

  return (
    <div className="space-y-4">
      {/* Selector de Cliente */}
      <Card>
        <CardHeader>
          <CardTitle>Seleccionar Cliente</CardTitle>
          <CardDescription>Elige el cliente para ejecutar tareas SII</CardDescription>
        </CardHeader>
        <CardContent>
          <Select
            value={selectedCliente || ''}
            onValueChange={(v) => {
              onClienteChange(v || null)
              setSelectedTask(null)
              setResult(null)
            }}
          >
            <SelectTrigger className="w-full md:w-[400px]">
              <SelectValue placeholder="Selecciona un cliente..." />
            </SelectTrigger>
            <SelectContent>
              {clientes.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  <div className="flex items-center gap-2">
                    <span>{c.nombre}</span>
                    <span className="text-muted-foreground">({c.rut})</span>
                    {c.validacion_exitosa && (
                      <CheckCircle2 className="h-3 w-3 text-green-500" />
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {cliente && !cliente.validacion_exitosa && (
            <div className="mt-4 flex items-center gap-2 text-yellow-600">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">
                Las credenciales de este cliente no han sido validadas
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Grid de Tareas */}
      {selectedCliente && (
        <Card>
          <CardHeader>
            <CardTitle>Tareas Disponibles</CardTitle>
            <CardDescription>Selecciona la tarea a ejecutar para {cliente?.nombre}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {TASKS.map((t) => {
                const Icon = t.icon
                const isSelected = selectedTask === t.type

                return (
                  <button
                    key={t.type}
                    onClick={() => {
                      setSelectedTask(t.type)
                      setResult(null)
                    }}
                    className={`flex flex-col items-start gap-2 rounded-lg border p-4 text-left transition-all hover:bg-accent ${
                      isSelected ? 'border-primary bg-primary/5 ring-2 ring-primary' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`rounded-md p-2 ${t.color}`}>
                        <Icon className="h-4 w-4 text-white" />
                      </div>
                      <span className="font-medium">{t.label}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{t.description}</p>
                    {t.requiresPeriodo && (
                      <Badge variant="outline" className="mt-1">
                        Requiere período
                      </Badge>
                    )}
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Parámetros y Ejecución */}
      {selectedTask && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {task && <task.icon className="h-5 w-5" />}
              {task?.label}
            </CardTitle>
            <CardDescription>Configura los parámetros y ejecuta la tarea</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {task?.requiresPeriodo && (
              <div className="space-y-2">
                <Label htmlFor="periodo">Período (YYYYMM)</Label>
                <Select value={periodo} onValueChange={setPeriodo}>
                  <SelectTrigger id="periodo" className="w-full md:w-[200px]">
                    <SelectValue placeholder="Selecciona período..." />
                  </SelectTrigger>
                  <SelectContent>
                    {periodoOptions.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Resultado */}
            {result && (
              <div
                className={`flex items-center gap-2 rounded-lg p-3 ${
                  result.type === 'success'
                    ? 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300'
                    : 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300'
                }`}
              >
                {result.type === 'success' ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <span className="text-sm">{result.message}</span>
              </div>
            )}

            {/* Botón de Ejecución */}
            <div className="flex gap-2">
              <Button
                onClick={handleExecute}
                disabled={isPending || (task?.requiresPeriodo && !periodo)}
                className="gap-2"
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Ejecutando...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    Ejecutar Tarea
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedTask(null)
                  setPeriodo('')
                  setResult(null)
                }}
              >
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Estado vacío */}
      {!selectedCliente && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Shield className="h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-medium">Selecciona un Cliente</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Elige un cliente para ver las tareas disponibles
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// ============================================================================
// HELPERS
// ============================================================================

function generatePeriodoOptions(): Array<{ value: string; label: string }> {
  const options: Array<{ value: string; label: string }> = []
  const now = new Date()

  for (let i = 0; i < 12; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const year = date.getFullYear()
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const value = `${year}${month}`
    const label = date.toLocaleDateString('es-CL', { month: 'long', year: 'numeric' })

    options.push({ value, label: label.charAt(0).toUpperCase() + label.slice(1) })
  }

  return options
}
