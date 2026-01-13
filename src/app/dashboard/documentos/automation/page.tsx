'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useSearchParams } from 'next/navigation'
import {
  Loader2,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Bell,
  Mail,
  MessageSquare,
  Zap,
  RefreshCw,
  MoreVertical,
  PlayCircle,
  Edit,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Settings,
} from 'lucide-react'
import {
  obtenerReglas,
  obtenerEjecuciones,
  obtenerNotificaciones,
  obtenerIntegracionesSlack,
  obtenerWebhooks,
  obtenerBatchJobs,
  ejecutarReglaManualmente,
  toggleRegla,
  eliminarRegla,
  marcarComoLeido,
  marcarTodosComoLeidos,
} from '@/app/dashboard/documentos/automation-actions'
import {
  CreateRuleDialog,
  SlackIntegrationDialog,
  WebhookDialog,
  EmailTemplatesManager,
  NotificationPreferences,
  BatchOperationsDialog,
  WebhookDeliveries,
} from './components'

export default function AutomationPage() {
  const searchParams = useSearchParams()
  const clienteId = searchParams.get('cliente_id') || ''
  const usuarioId = searchParams.get('usuario_id') || 'user-id' // TODO: Get from auth context

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [reglas, setReglas] = useState<any[]>([])
  const [ejecuciones, setEjecuciones] = useState<any[]>([])
  const [notificaciones, setNotificaciones] = useState<any[]>([])
  const [integracionesSlack, setIntegracionesSlack] = useState<any[]>([])
  const [webhooks, setWebhooks] = useState<any[]>([])
  const [batchJobs, setBatchJobs] = useState<any[]>([])
  const [editingRule, setEditingRule] = useState<any>(null)

  const cargarDatos = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }

    try {
      const [r, e, n, s, w, b] = await Promise.all([
        obtenerReglas(clienteId),
        obtenerEjecuciones(clienteId),
        obtenerNotificaciones(usuarioId),
        obtenerIntegracionesSlack(clienteId),
        obtenerWebhooks(clienteId),
        obtenerBatchJobs(clienteId),
      ])

      setReglas(r || [])
      setEjecuciones(e || [])
      setNotificaciones(n || [])
      setIntegracionesSlack(s || [])
      setWebhooks(w || [])
      setBatchJobs(b || [])
    } catch (error) {
      console.error('Error loading automation data:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [clienteId, usuarioId])

  useEffect(() => {
    cargarDatos()
  }, [cargarDatos])

  const handleExecuteRule = async (reglaId: string) => {
    try {
      await ejecutarReglaManualmente(reglaId)
      cargarDatos(true)
    } catch (error) {
      console.error('Error executing rule:', error)
    }
  }

  const handleToggleRule = async (reglaId: string) => {
    try {
      await toggleRegla(reglaId)
      cargarDatos(true)
    } catch (error) {
      console.error('Error toggling rule:', error)
    }
  }

  const handleDeleteRule = async (reglaId: string) => {
    if (!confirm('¿Está seguro de eliminar esta regla?')) return
    try {
      await eliminarRegla(reglaId)
      cargarDatos(true)
    } catch (error) {
      console.error('Error deleting rule:', error)
    }
  }

  const handleMarkRead = async (notifId: string) => {
    try {
      await marcarComoLeido(notifId)
      setNotificaciones((prev) =>
        prev.map((n) => (n.id === notifId ? { ...n, leido: true } : n))
      )
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const handleMarkAllRead = async () => {
    try {
      await marcarTodosComoLeidos(usuarioId)
      setNotificaciones((prev) => prev.map((n) => ({ ...n, leido: true })))
    } catch (error) {
      console.error('Error marking all as read:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const reglasActivas = reglas.filter((r) => r.activa).length
  const ultimasEjecuciones = ejecuciones.slice(0, 10)
  const notificacionesNoLeidas = notificaciones.filter((n) => !n.leido).length
  const jobsPendientes = batchJobs.filter((j) => j.estado === 'PENDING').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Automatización e Integraciones</h1>
          <p className="text-muted-foreground mt-1">
            Gestione flujos de trabajo automatizados, notificaciones e integraciones externas
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => cargarDatos(true)}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Zap className="h-4 w-4 text-blue-500" />
              Reglas Activas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reglasActivas}</div>
            <p className="text-xs text-muted-foreground mt-1">
              De {reglas.length} totales
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Bell className="h-4 w-4 text-amber-500" />
              Notificaciones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{notificacionesNoLeidas}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Sin leer de {notificaciones.length}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-purple-500" />
              Integraciones Slack
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {integracionesSlack.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Workspaces conectados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-orange-500" />
              Jobs Pendientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{jobsPendientes}</div>
            <p className="text-xs text-muted-foreground mt-1">
              En cola
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="rules" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="rules">Reglas</TabsTrigger>
          <TabsTrigger value="executions">Historial</TabsTrigger>
          <TabsTrigger value="notifications">
            Notificaciones
            {notificacionesNoLeidas > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 text-xs flex items-center justify-center">
                {notificacionesNoLeidas}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="integrations">Integraciones</TabsTrigger>
          <TabsTrigger value="jobs">Batch Jobs</TabsTrigger>
        </TabsList>

        {/* Rules Tab */}
        <TabsContent value="rules" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Reglas de Automatización</CardTitle>
                <CardDescription>
                  Configure acciones automáticas para el ciclo de vida de documentos
                </CardDescription>
              </div>
              <CreateRuleDialog
                clienteId={clienteId}
                onSuccess={() => cargarDatos(true)}
              />
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Disparador</TableHead>
                    <TableHead>Acciones</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Última Ejecución</TableHead>
                    <TableHead className="w-[80px]">Opciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reglas.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No hay reglas de automatización configuradas
                      </TableCell>
                    </TableRow>
                  ) : (
                    reglas.map((regla) => (
                      <TableRow key={regla.id}>
                        <TableCell className="font-medium">{regla.nombre}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{regla.tipo_trigger}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1 flex-wrap">
                            {regla.acciones?.map((accion: string) => (
                              <Badge key={accion} variant="secondary" className="text-xs">
                                {accion}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          {regla.activa ? (
                            <Badge className="bg-green-500">Activa</Badge>
                          ) : (
                            <Badge variant="outline">Inactiva</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {regla.ultima_ejecucion
                            ? new Date(regla.ultima_ejecucion).toLocaleDateString('es-CL')
                            : 'Nunca'}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleExecuteRule(regla.id)}>
                                <PlayCircle className="h-4 w-4 mr-2" />
                                Ejecutar ahora
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleToggleRule(regla.id)}>
                                {regla.activa ? (
                                  <>
                                    <ToggleLeft className="h-4 w-4 mr-2" />
                                    Desactivar
                                  </>
                                ) : (
                                  <>
                                    <ToggleRight className="h-4 w-4 mr-2" />
                                    Activar
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <CreateRuleDialog
                                clienteId={clienteId}
                                regla={regla}
                                onSuccess={() => cargarDatos(true)}
                                trigger={
                                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Editar
                                  </DropdownMenuItem>
                                }
                              />
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => handleDeleteRule(regla.id)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Eliminar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Executions Tab */}
        <TabsContent value="executions" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Historial de Ejecuciones</CardTitle>
              <CardDescription>
                Ejecuciones recientes de reglas de automatización
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Tipo de Acción</TableHead>
                    <TableHead>Documentos</TableHead>
                    <TableHead>Exitosos</TableHead>
                    <TableHead>Fallidos</TableHead>
                    <TableHead>Duración</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ultimasEjecuciones.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        Sin ejecuciones registradas
                      </TableCell>
                    </TableRow>
                  ) : (
                    ultimasEjecuciones.map((ejecucion) => (
                      <TableRow key={ejecucion.id}>
                        <TableCell>
                          {new Date(ejecucion.creado_en).toLocaleString('es-CL')}
                        </TableCell>
                        <TableCell>{ejecucion.tipo_accion}</TableCell>
                        <TableCell>{ejecucion.cantidad_documentos}</TableCell>
                        <TableCell className="text-green-600 font-medium">
                          {ejecucion.exitosos}
                        </TableCell>
                        <TableCell className="text-red-600 font-medium">
                          {ejecucion.fallidos}
                        </TableCell>
                        <TableCell>{ejecucion.duracion_segundos}s</TableCell>
                        <TableCell>
                          {ejecucion.estado === 'SUCCESS' ? (
                            <Badge className="bg-green-500 flex w-fit gap-1">
                              <CheckCircle className="h-3 w-3" />
                              Éxito
                            </Badge>
                          ) : (
                            <Badge variant="destructive" className="flex w-fit gap-1">
                              <XCircle className="h-3 w-3" />
                              Error
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="mt-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Centro de Notificaciones</CardTitle>
                    <CardDescription>
                      Sus notificaciones del sistema y alertas
                    </CardDescription>
                  </div>
                  {notificacionesNoLeidas > 0 && (
                    <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
                      Marcar todas como leídas
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  {notificaciones.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No hay notificaciones</p>
                    </div>
                  ) : (
                    notificaciones.slice(0, 10).map((notif) => (
                      <div
                        key={notif.id}
                        className={`p-4 border rounded-lg flex items-start gap-4 cursor-pointer transition-colors ${
                          notif.leido
                            ? 'bg-muted/30 hover:bg-muted/50'
                            : 'bg-blue-50 border-blue-200 hover:bg-blue-100'
                        }`}
                        onClick={() => !notif.leido && handleMarkRead(notif.id)}
                      >
                        <div className="mt-1">
                          {notif.tipo === 'EXPIRATION' ? (
                            <AlertCircle className="h-5 w-5 text-amber-500" />
                          ) : notif.tipo === 'COMPLIANCE' ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : notif.tipo === 'ERROR' ? (
                            <XCircle className="h-5 w-5 text-red-500" />
                          ) : (
                            <Bell className="h-5 w-5 text-blue-500" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{notif.titulo}</span>
                            {!notif.leido && (
                              <Badge variant="secondary" className="text-xs">Nuevo</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{notif.mensaje}</p>
                          <div className="text-xs text-muted-foreground mt-2">
                            {new Date(notif.creado_en).toLocaleString('es-CL')}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>

            <div>
              <NotificationPreferences
                usuarioId={usuarioId}
                clienteId={clienteId}
              />
            </div>
          </div>
        </TabsContent>

        {/* Email Tab */}
        <TabsContent value="email" className="mt-6">
          <EmailTemplatesManager clienteId={clienteId} />
        </TabsContent>

        {/* Integrations Tab */}
        <TabsContent value="integrations" className="mt-6">
          <div className="space-y-6">
            {/* Slack Integration */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <MessageSquare className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <CardTitle>Integración Slack</CardTitle>
                    <CardDescription>Envíe alertas a canales de Slack</CardDescription>
                  </div>
                </div>
                <SlackIntegrationDialog
                  clienteId={clienteId}
                  onSuccess={() => cargarDatos(true)}
                />
              </CardHeader>
              <CardContent>
                {integracionesSlack.length === 0 ? (
                  <div className="text-center text-muted-foreground py-6">
                    <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-50" />
                    <p>No hay workspaces de Slack conectados</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {integracionesSlack.map((integ) => (
                      <div
                        key={integ.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <MessageSquare className="h-5 w-5 text-purple-500" />
                          <div>
                            <div className="font-medium">{integ.nombre}</div>
                            <div className="text-sm text-muted-foreground">
                              #{integ.canal} · {integ.workspace_nombre}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-green-500">Conectado</Badge>
                          <SlackIntegrationDialog
                            clienteId={clienteId}
                            integracion={integ}
                            onSuccess={() => cargarDatos(true)}
                            trigger={
                              <Button variant="ghost" size="sm">
                                <Settings className="h-4 w-4" />
                              </Button>
                            }
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Webhooks */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Zap className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <CardTitle>Webhooks</CardTitle>
                    <CardDescription>Envíe eventos a sistemas externos</CardDescription>
                  </div>
                </div>
                <WebhookDialog
                  clienteId={clienteId}
                  onSuccess={() => cargarDatos(true)}
                />
              </CardHeader>
              <CardContent>
                {webhooks.length === 0 ? (
                  <div className="text-center text-muted-foreground py-6">
                    <Zap className="h-10 w-10 mx-auto mb-3 opacity-50" />
                    <p>No hay webhooks configurados</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {webhooks.map((webhook) => (
                      <div
                        key={webhook.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Zap className="h-5 w-5 text-orange-500" />
                          <div>
                            <div className="font-medium">{webhook.nombre}</div>
                            <div className="text-sm text-muted-foreground font-mono text-xs truncate max-w-md">
                              {webhook.url}
                            </div>
                            <Badge variant="outline" className="mt-1 text-xs">
                              {webhook.evento_tipo}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {webhook.activo ? (
                            <Badge className="bg-green-500">Activo</Badge>
                          ) : (
                            <Badge variant="outline">Inactivo</Badge>
                          )}
                          <WebhookDeliveries
                            webhookId={webhook.id}
                            webhookNombre={webhook.nombre}
                          />
                          <WebhookDialog
                            clienteId={clienteId}
                            webhook={webhook}
                            onSuccess={() => cargarDatos(true)}
                            trigger={
                              <Button variant="ghost" size="sm">
                                <Settings className="h-4 w-4" />
                              </Button>
                            }
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Batch Jobs Tab */}
        <TabsContent value="jobs" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Trabajos por Lotes</CardTitle>
                <CardDescription>
                  Seguimiento del progreso de operaciones masivas
                </CardDescription>
              </div>
              <BatchOperationsDialog
                clienteId={clienteId}
                onSuccess={() => cargarDatos(true)}
              />
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Procesados</TableHead>
                    <TableHead>Progreso</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Iniciado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {batchJobs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No hay trabajos por lotes
                      </TableCell>
                    </TableRow>
                  ) : (
                    batchJobs.map((job) => (
                      <TableRow key={job.id}>
                        <TableCell className="font-medium">{job.tipo_operacion}</TableCell>
                        <TableCell>{job.cantidad_total}</TableCell>
                        <TableCell>{job.cantidad_procesados}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-24 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full transition-all"
                                style={{
                                  width: `${job.porcentaje_completado}%`,
                                }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {job.porcentaje_completado}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {job.estado === 'COMPLETED' ? (
                            <Badge className="bg-green-500">Completado</Badge>
                          ) : job.estado === 'RUNNING' ? (
                            <Badge className="bg-blue-500">
                              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                              En ejecución
                            </Badge>
                          ) : job.estado === 'FAILED' ? (
                            <Badge variant="destructive">Error</Badge>
                          ) : (
                            <Badge variant="outline">Pendiente</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {new Date(job.creado_en).toLocaleString('es-CL')}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
