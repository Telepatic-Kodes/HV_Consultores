// @ts-nocheck — temporary: types need update after Convex migration
'use client'

import { useState, useEffect, useTransition } from 'react'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  FileText,
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
  DollarSign,
  Calendar,
  ArrowRight,
  RefreshCw,
} from 'lucide-react'
import { createF29SubmitJob, getF29CalculosAprobados } from '../actions'

// ============================================================================
// TYPES
// ============================================================================

interface F29Calculo {
  id: string
  cliente_id: string
  cliente_nombre: string
  cliente_rut: string
  periodo: string
  status: string
  total_debito_fiscal: number
  total_credito_fiscal: number
  ppm_determinado: number
  total_a_pagar: number
  remanente_actualizado: number
  aprobado_at: string | null
  enviado_sii_at: string | null
  folio_sii: string | null
}

interface F29IntegrationProps {
  clienteId?: string
}

// ============================================================================
// COMPONENT
// ============================================================================

export function F29Integration({ clienteId }: F29IntegrationProps) {
  const [isPending, startTransition] = useTransition()
  const [f29Calculos, setF29Calculos] = useState<F29Calculo[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedF29, setSelectedF29] = useState<F29Calculo | null>(null)
  const [result, setResult] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)

  // Cargar F29 aprobados al montar
  useEffect(() => {
    loadF29Calculos()
  }, [clienteId])

  const loadF29Calculos = async () => {
    setLoading(true)
    try {
      const calculos = await getF29CalculosAprobados(clienteId)
      setF29Calculos(calculos)
    } catch (error) {
      console.error('Error loading F29 calculos:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEnviarF29 = (f29: F29Calculo) => {
    setResult(null)
    startTransition(async () => {
      try {
        const res = await createF29SubmitJob(f29.id)

        if (res.success) {
          setResult({
            type: 'success',
            message: `Job de envío F29 creado exitosamente (ID: ${res.jobId?.slice(0, 8)}...)`,
          })
          setSelectedF29(null)
          // Recargar datos
          await loadF29Calculos()
        } else {
          setResult({
            type: 'error',
            message: res.error || 'Error al crear el job de envío',
          })
        }
      } catch (error) {
        setResult({
          type: 'error',
          message: 'Error inesperado al enviar F29',
        })
      }
    })
  }

  const formatMonto = (monto: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(monto)
  }

  const formatPeriodo = (periodo: string) => {
    if (periodo.length !== 6) return periodo
    const year = periodo.slice(0, 4)
    const month = parseInt(periodo.slice(4, 6), 10)
    const meses = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ]
    return `${meses[month - 1]} ${year}`
  }

  const getStatusBadge = (status: string, enviadoAt: string | null) => {
    if (enviadoAt) {
      return <Badge className="bg-green-500">Enviado al SII</Badge>
    }
    switch (status) {
      case 'aprobado':
        return <Badge className="bg-blue-500">Aprobado - Listo</Badge>
      case 'validado':
        return <Badge variant="secondary">Validado</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Envío de F29 al SII
              </CardTitle>
              <CardDescription>
                Selecciona un F29 aprobado para enviarlo automáticamente al SII
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={loadF29Calculos}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Resultado de operación */}
          {result && (
            <div
              className={`mb-4 flex items-center gap-2 rounded-lg p-3 ${
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

          {f29Calculos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-medium">No hay F29 listos para enviar</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Los F29 deben estar en estado &quot;Aprobado&quot; para poder enviarlos al SII.
                <br />
                Ve a la sección de F29 para generar y aprobar declaraciones.
              </p>
              <Button variant="link" className="mt-4" asChild>
                <a href="/dashboard/f29">Ir a F29</a>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead className="text-right">IVA Determinado</TableHead>
                  <TableHead className="text-right">PPM</TableHead>
                  <TableHead className="text-right">Total a Pagar</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {f29Calculos.map((f29) => {
                  const ivaDeterminado = f29.total_debito_fiscal - f29.total_credito_fiscal
                  const yaEnviado = !!f29.enviado_sii_at

                  return (
                    <TableRow key={f29.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{f29.cliente_nombre}</div>
                          <div className="text-xs text-muted-foreground">{f29.cliente_rut}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          {formatPeriodo(f29.periodo)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={ivaDeterminado >= 0 ? 'text-red-600' : 'text-green-600'}>
                          {formatMonto(ivaDeterminado)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        {formatMonto(f29.ppm_determinado)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        <div className="flex items-center justify-end gap-1">
                          <DollarSign className="h-3 w-3" />
                          {formatMonto(f29.total_a_pagar)}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(f29.status, f29.enviado_sii_at)}</TableCell>
                      <TableCell className="text-right">
                        {yaEnviado ? (
                          <div className="flex items-center justify-end gap-1 text-sm text-muted-foreground">
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                            Folio: {f29.folio_sii || 'N/A'}
                          </div>
                        ) : (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                size="sm"
                                className="gap-1"
                                disabled={isPending}
                                onClick={() => setSelectedF29(f29)}
                              >
                                {isPending && selectedF29?.id === f29.id ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Send className="h-3 w-3" />
                                )}
                                Enviar
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>¿Enviar F29 al SII?</AlertDialogTitle>
                                <AlertDialogDescription className="space-y-2">
                                  <p>
                                    Estás a punto de enviar la declaración F29 al Servicio de
                                    Impuestos Internos.
                                  </p>
                                  <div className="mt-4 rounded-lg bg-muted p-4 text-sm">
                                    <div className="grid grid-cols-2 gap-2">
                                      <span className="text-muted-foreground">Cliente:</span>
                                      <span className="font-medium">{f29.cliente_nombre}</span>
                                      <span className="text-muted-foreground">Período:</span>
                                      <span className="font-medium">{formatPeriodo(f29.periodo)}</span>
                                      <span className="text-muted-foreground">Total a Pagar:</span>
                                      <span className="font-medium">{formatMonto(f29.total_a_pagar)}</span>
                                    </div>
                                  </div>
                                  <p className="text-yellow-600">
                                    Esta acción es irreversible. Asegúrate de que los datos son
                                    correctos.
                                  </p>
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleEnviarF29(f29)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  <Send className="h-4 w-4 mr-2" />
                                  Confirmar Envío
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Información adicional */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Información del Proceso</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-blue-500" />
              <span>Aprobado - Listo para enviar</span>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-yellow-500" />
              <span>En proceso de envío</span>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span>Enviado al SII</span>
            </div>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            El proceso de envío se realiza automáticamente mediante RPA. Recibirás el folio del SII
            una vez completado el proceso. Puedes revisar el estado en el historial de jobs.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
