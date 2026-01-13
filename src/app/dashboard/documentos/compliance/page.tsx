'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'
import { useSearchParams } from 'next/navigation'
import { Loader2, Shield, AlertCircle, CheckCircle2, Clock } from 'lucide-react'
import {
  obtenerResumenComplianza,
  obtenerDocumentosVencidos,
  obtenerRegistrosAuditoria,
  obtenerResumenAuditoria,
  obtenerPoliticasRetencion,
  obtenerReportesComplianza,
  obtenerProgramasReportes,
  obtenerListasVerificacion,
  type RetentionPolicy,
  type ComplianceReport,
  type ReportSchedule,
} from '../compliance-actions'

export default function CompliancePage() {
  const searchParams = useSearchParams()
  const clienteId = searchParams.get('cliente_id')

  const [loading, setLoading] = useState(true)
  const [resumen, setResumen] = useState<any>(null)
  const [documentosVencidos, setDocumentosVencidos] = useState<any[]>([])
  const [registrosAuditoria, setRegistrosAuditoria] = useState<any[]>([])
  const [resumenAuditoria, setResumenAuditoria] = useState<any>(null)
  const [politicasRetencion, setPoliticasRetencion] = useState<RetentionPolicy[]>([])
  const [reportes, setReportes] = useState<ComplianceReport[]>([])
  const [programas, setProgramas] = useState<ReportSchedule[]>([])
  const [listas, setListas] = useState<any[]>([])

  useEffect(() => {
    if (clienteId) {
      cargarDatos()
    }
  }, [clienteId])

  const cargarDatos = async () => {
    if (!clienteId) return

    setLoading(true)
    try {
      const hoy = new Date()
      const hace30Dias = new Date(hoy.getTime() - 30 * 24 * 60 * 60 * 1000)

      const [resumenRes, vencidosRes, auditRes, auditSummaryRes, politicasRes, reportesRes, programasRes, listasRes] =
        await Promise.all([
          obtenerResumenComplianza(
            clienteId,
            hace30Dias.toISOString().split('T')[0],
            hoy.toISOString().split('T')[0]
          ),
          obtenerDocumentosVencidos(clienteId),
          obtenerRegistrosAuditoria(clienteId, { fecha_desde: hace30Dias.toISOString() }),
          obtenerResumenAuditoria(clienteId, hace30Dias.toISOString().split('T')[0], hoy.toISOString().split('T')[0]),
          obtenerPoliticasRetencion(clienteId),
          obtenerReportesComplianza(clienteId),
          obtenerProgramasReportes(clienteId),
          obtenerListasVerificacion(clienteId),
        ])

      if (resumenRes.success && resumenRes.resumen) {
        setResumen(resumenRes.resumen)
      }
      if (vencidosRes.success && vencidosRes.documentos) {
        setDocumentosVencidos(vencidosRes.documentos)
      }
      if (auditRes.success && auditRes.registros) {
        setRegistrosAuditoria(auditRes.registros.slice(0, 50))
      }
      if (auditSummaryRes.success && auditSummaryRes.resumen) {
        setResumenAuditoria(auditSummaryRes.resumen)
      }
      if (politicasRes.success && politicasRes.politicas) {
        setPoliticasRetencion(politicasRes.politicas)
      }
      if (reportesRes.success && reportesRes.reportes) {
        setReportes(reportesRes.reportes)
      }
      if (programasRes.success && programasRes.programas) {
        setProgramas(programasRes.programas)
      }
      if (listasRes.success && listasRes.listas) {
        setListas(listasRes.listas)
      }
    } catch (error) {
      toast.error('Error al cargar datos de cumplimiento')
    } finally {
      setLoading(false)
    }
  }

  if (!clienteId) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Selecciona un cliente para ver cumplimiento</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8 text-blue-600" />
            Cumplimiento & Auditoría
          </h1>
          <p className="text-muted-foreground mt-1">
            Gestión de cumplimiento normativo y auditoría de documentos
          </p>
        </div>
        <Button onClick={cargarDatos} variant="outline">
          Actualizar datos
        </Button>
      </div>

      {/* Summary Cards */}
      {resumen && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                Tasa de Cumplimiento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{resumen.tasa_cumplimiento.toFixed(1)}%</div>
              <Progress value={resumen.tasa_cumplimiento} className="mt-2 h-2" />
              <p className="text-xs text-muted-foreground mt-2">
                {resumen.documentos_aprobados} de {resumen.total_documentos}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-4 w-4 text-orange-600" />
                Documentos Vencidos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {resumen.documentos_vencidos}
              </div>
              <p className="text-xs text-muted-foreground mt-2">Requieren acción</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-600" />
                Hallazgos Críticos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {resumen.hallazgos_criticos}
              </div>
              <p className="text-xs text-muted-foreground mt-2">Últimos 30 días</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Acciones Requeridas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{resumen.acciones_requeridas}</div>
              <p className="text-xs text-muted-foreground mt-2">Pendientes</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="retention">Retención</TabsTrigger>
          <TabsTrigger value="audit">Auditoría</TabsTrigger>
          <TabsTrigger value="reports">Reportes</TabsTrigger>
          <TabsTrigger value="checklists">Listas</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {documentosVencidos.length > 0 && (
            <Card className="border-orange-200 bg-orange-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-900">
                  <AlertCircle className="h-5 w-5" />
                  Documentos Vencidos
                </CardTitle>
                <CardDescription className="text-orange-700">
                  {documentosVencidos.length} documentos requieren acción
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {documentosVencidos.slice(0, 5).map((doc, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-white rounded border border-orange-200">
                      <div>
                        <p className="font-medium text-sm">{doc.tipo_documento}</p>
                        <p className="text-xs text-muted-foreground">
                          {doc.dias_restantes > 0 ? `${doc.dias_restantes} días restantes` : 'Vencido'}
                        </p>
                      </div>
                      <Badge variant="destructive">{doc.accion_pendiente}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Listas de Verificación Pendientes</CardTitle>
              <CardDescription>Tareas de cumplimiento por completar</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {listas
                  .filter((l) => !l.completada)
                  .slice(0, 5)
                  .map((lista) => (
                    <div key={lista.id} className="p-3 border rounded">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-sm">{lista.nombre}</h4>
                        <Badge variant="outline">{lista.tipo}</Badge>
                      </div>
                      <Progress value={lista.porcentaje_completado || 0} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-2">
                        {Math.round(lista.porcentaje_completado || 0)}% completado
                      </p>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Retention Tab */}
        <TabsContent value="retention">
          <Card>
            <CardHeader>
              <CardTitle>Políticas de Retención</CardTitle>
              <CardDescription>
                {politicasRetencion.length} políticas activas
              </CardDescription>
            </CardHeader>
            <CardContent>
              {politicasRetencion.length > 0 ? (
                <div className="space-y-3">
                  {politicasRetencion.map((politica) => (
                    <div key={politica.id} className="p-4 border rounded-lg hover:bg-muted/50 transition">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-medium">{politica.nombre}</h4>
                          {politica.descripcion && (
                            <p className="text-sm text-muted-foreground">{politica.descripcion}</p>
                          )}
                        </div>
                        <Badge variant={politica.activa ? 'default' : 'secondary'}>
                          {politica.activa ? 'Activa' : 'Inactiva'}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div className="bg-blue-50 p-2 rounded">
                          <p className="text-muted-foreground text-xs">Tipo</p>
                          <p className="font-medium capitalize">{politica.tipo_documento || 'Todos'}</p>
                        </div>
                        <div className="bg-green-50 p-2 rounded">
                          <p className="text-muted-foreground text-xs">Retención</p>
                          <p className="font-medium">{politica.anos_retener} años</p>
                        </div>
                        <div className="bg-purple-50 p-2 rounded">
                          <p className="text-muted-foreground text-xs">Acción</p>
                          <p className="font-medium capitalize">{politica.accion_vencimiento}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-4">
                  No hay políticas de retención configuradas
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audit Tab */}
        <TabsContent value="audit" className="space-y-6">
          {resumenAuditoria && (
            <Card>
              <CardHeader>
                <CardTitle>Resumen de Auditoría</CardTitle>
                <CardDescription>Últimos 30 días</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Total de Acciones</p>
                    <p className="text-3xl font-bold">{resumenAuditoria.total_acciones}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Acciones Críticas</p>
                    <p className="text-3xl font-bold text-red-600">
                      {resumenAuditoria.acciones_criticas}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Usuarios Activos</p>
                    <p className="text-3xl font-bold">
                      {Object.keys(resumenAuditoria.acciones_por_usuario || {}).length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Registros de Auditoría Recientes</CardTitle>
              <CardDescription>Últimas 50 acciones</CardDescription>
            </CardHeader>
            <CardContent>
              {registrosAuditoria.length > 0 ? (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {registrosAuditoria.map((reg) => (
                    <div key={reg.id} className="text-sm p-2 border rounded hover:bg-muted/50">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{reg.tabla}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(reg.creado_en).toLocaleString('es-CL')}
                          </p>
                        </div>
                        <Badge variant={['DELETE', 'REJECT'].includes(reg.accion) ? 'destructive' : 'secondary'}>
                          {reg.accion}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-4">Sin registros de auditoría</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle>Reportes de Cumplimiento</CardTitle>
              <CardDescription>{reportes.length} reportes generados</CardDescription>
            </CardHeader>
            <CardContent>
              {reportes.length > 0 ? (
                <div className="space-y-3">
                  {reportes.map((reporte) => (
                    <div key={reporte.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-medium">{reporte.nombre}</h4>
                          <p className="text-sm text-muted-foreground">
                            {reporte.periodo_inicio} a {reporte.periodo_fin}
                          </p>
                        </div>
                        <Badge variant="outline">{reporte.tipo_reporte}</Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          {new Date(reporte.creado_en).toLocaleDateString('es-CL')}
                        </span>
                        <Badge
                          variant={reporte.estado === 'APPROVED' ? 'default' : 'secondary'}
                        >
                          {reporte.estado}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-4">
                  No hay reportes de cumplimiento generados
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Reportes Programados</CardTitle>
              <CardDescription>{programas.length} programas activos</CardDescription>
            </CardHeader>
            <CardContent>
              {programas.length > 0 ? (
                <div className="space-y-3">
                  {programas.map((programa) => (
                    <div key={programa.id} className="p-3 border rounded">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">{programa.nombre}</p>
                          <p className="text-xs text-muted-foreground capitalize">
                            {programa.frecuencia} - {programa.tipo_reporte}
                          </p>
                        </div>
                        <Badge variant={programa.activa ? 'default' : 'secondary'}>
                          {programa.activa ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </div>
                      {programa.proxima_ejecucion && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Próxima: {new Date(programa.proxima_ejecucion).toLocaleDateString('es-CL')}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-4">
                  No hay reportes programados
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Checklists Tab */}
        <TabsContent value="checklists">
          <Card>
            <CardHeader>
              <CardTitle>Listas de Verificación de Cumplimiento</CardTitle>
              <CardDescription>{listas.length} listas creadas</CardDescription>
            </CardHeader>
            <CardContent>
              {listas.length > 0 ? (
                <div className="space-y-4">
                  {listas.map((lista) => (
                    <div key={lista.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-medium">{lista.nombre}</h4>
                          {lista.descripcion && (
                            <p className="text-sm text-muted-foreground">{lista.descripcion}</p>
                          )}
                        </div>
                        <Badge variant="outline">{lista.tipo}</Badge>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Progreso</span>
                          <span className="font-medium">
                            {Math.round(lista.porcentaje_completado || 0)}%
                          </span>
                        </div>
                        <Progress value={lista.porcentaje_completado || 0} className="h-2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-4">
                  No hay listas de verificación creadas
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
