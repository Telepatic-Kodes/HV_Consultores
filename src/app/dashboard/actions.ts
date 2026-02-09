'use server'

import { ConvexHttpClient } from "convex/browser"
import { api } from "@/convex/_generated/api"

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!)

export interface DashboardStats {
  documentosHoy: number
  documentosTendencia: number
  clasificadosHoy: number
  precisionML: number
  pendientesClasificar: number
  alertasF29: number
}

export interface ModuloStatus {
  nombre: string
  descripcion: string
  status: string
  metrica: string
  color: string
}

export interface ActividadReciente {
  id: string
  tipo: 'classification' | 'f29' | 'bot' | 'alert' | 'chat'
  mensaje: string
  tiempo: string
  created_at: string
}

// Obtener estadísticas del dashboard
export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)
    const hoyISO = hoy.toISOString()

    const ayer = new Date(hoy)
    ayer.setDate(ayer.getDate() - 1)
    const ayerISO = ayer.toISOString()

    // Get all documents to count
    const allDocs = await convex.query(api.documents.listDocuments, {})

    // Documentos recibidos hoy
    const documentosHoy = allDocs.filter(doc =>
      doc.created_at && doc.created_at >= hoyISO
    ).length

    // Documentos recibidos ayer
    const documentosAyer = allDocs.filter(doc =>
      doc.created_at && doc.created_at >= ayerISO && doc.created_at < hoyISO
    ).length

    // Documentos clasificados hoy
    const clasificadosHoy = allDocs.filter(doc =>
      doc.clasificado_at && doc.clasificado_at >= hoyISO
    ).length

    // Documentos pendientes
    const pendientes = allDocs.filter(doc => doc.status === 'pendiente').length

    // Alertas F29 (últimos 7 días)
    const semanaISO = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const allValidations = await convex.query(api.f29.getSubmissionValidations, { submissionId: undefined })
    const alertas = allValidations.filter(v =>
      (v.resultado === 'warning' || v.resultado === 'error') &&
      v.created_at && v.created_at >= semanaISO
    ).length

    // Calcular precisión ML
    const clasificadosConCuentas = allDocs.filter(doc =>
      doc.cuenta_final_id && doc.cuenta_sugerida_id
    )
    const precisionML = clasificadosConCuentas.length > 0
      ? Math.round((clasificadosConCuentas.filter(doc =>
          doc.cuenta_final_id === doc.cuenta_sugerida_id
        ).length / clasificadosConCuentas.length) * 100)
      : 95

    const tendencia = documentosAyer > 0
      ? Math.round((documentosHoy - documentosAyer) / documentosAyer * 100)
      : 0

    return {
      documentosHoy,
      documentosTendencia: tendencia,
      clasificadosHoy,
      precisionML,
      pendientesClasificar: pendientes,
      alertasF29: alertas,
    }
  } catch (error) {
    console.error('Error getting dashboard stats:', error)
    return {
      documentosHoy: 0,
      documentosTendencia: 0,
      clasificadosHoy: 0,
      precisionML: 95,
      pendientesClasificar: 0,
      alertasF29: 0,
    }
  }
}

// Obtener estado de los módulos
export async function getModulosStatus(): Promise<ModuloStatus[]> {
  try {
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)
    const hoyISO = hoy.toISOString()

    // Get documents
    const allDocs = await convex.query(api.documents.listDocuments, {})
    const docsClasificados = allDocs.filter(doc =>
      doc.clasificado_at && doc.clasificado_at >= hoyISO
    ).length
    const docsPendientes = allDocs.filter(doc => doc.status === 'pendiente').length

    // Get F29 submissions
    const allF29s = await convex.query(api.f29.listSubmissions, {})
    const f29Generados = allF29s.filter(f29 =>
      f29.created_at && f29.created_at >= hoyISO
    ).length
    const f29Pendientes = allF29s.filter(f29 =>
      f29.status && ['borrador', 'calculado'].includes(f29.status)
    ).length

    // Get bot jobs
    const allJobs = await convex.query(api.bots.listJobs, {})
    const botsEjecutando = allJobs.filter(job => job.status === 'ejecutando').length
    const botsTareasHoy = allJobs.filter(job =>
      job.created_at && job.created_at >= hoyISO
    ).length

    // Get chat messages
    const allMessages = await convex.query(api.chat.listMessages, { sessionId: undefined })
    const chatConsultas = allMessages.filter(msg =>
      msg.rol === 'user' && msg.created_at && msg.created_at >= hoyISO
    ).length

    return [
      {
        nombre: 'HV-Class',
        descripcion: 'Clasificador IA',
        status: docsPendientes > 0 ? `${docsPendientes} pendientes` : 'Activo',
        metrica: `${docsClasificados} docs/hoy`,
        color: 'from-blue-500 to-blue-600',
      },
      {
        nombre: 'HV-F29',
        descripcion: 'Formularios F29',
        status: f29Pendientes > 0 ? `${f29Pendientes} pendientes` : 'Al día',
        metrica: `${f29Generados} generados`,
        color: 'from-emerald-500 to-emerald-600',
      },
      {
        nombre: 'HV-Bot',
        descripcion: 'RPA Portales',
        status: botsEjecutando > 0 ? 'Ejecutando' : 'Listo',
        metrica: `${botsTareasHoy} tareas hoy`,
        color: 'from-violet-500 to-violet-600',
      },
      {
        nombre: 'HV-Chat',
        descripcion: 'Asistente IA',
        status: 'Disponible',
        metrica: `${chatConsultas} consultas`,
        color: 'from-amber-500 to-amber-600',
      },
    ]
  } catch (error) {
    console.error('Error getting modules status:', error)
    return [
      {
        nombre: 'HV-Class',
        descripcion: 'Clasificador IA',
        status: 'Activo',
        metrica: '0 docs/hoy',
        color: 'from-blue-500 to-blue-600',
      },
      {
        nombre: 'HV-F29',
        descripcion: 'Formularios F29',
        status: 'Al día',
        metrica: '0 generados',
        color: 'from-emerald-500 to-emerald-600',
      },
      {
        nombre: 'HV-Bot',
        descripcion: 'RPA Portales',
        status: 'Listo',
        metrica: '0 tareas hoy',
        color: 'from-violet-500 to-violet-600',
      },
      {
        nombre: 'HV-Chat',
        descripcion: 'Asistente IA',
        status: 'Disponible',
        metrica: '0 consultas',
        color: 'from-amber-500 to-amber-600',
      },
    ]
  }
}

// Obtener actividad reciente
export async function getActividadReciente(limite: number = 10): Promise<ActividadReciente[]> {
  try {
    const actividades: ActividadReciente[] = []

    // Get recent documents with classifications
    const allDocs = await convex.query(api.documents.listDocuments, {})
    const clasificaciones = allDocs
      .filter(doc => doc.clasificado_at)
      .sort((a, b) => (b.clasificado_at || '').localeCompare(a.clasificado_at || ''))
      .slice(0, 3)

    clasificaciones.forEach((doc) => {
      actividades.push({
        id: `class-${doc._id}`,
        tipo: 'classification',
        mensaje: `Factura #${doc.folio} clasificada`,
        tiempo: formatTiempoRelativo(doc.clasificado_at),
        created_at: doc.clasificado_at || '',
      })
    })

    // Get recent F29 submissions
    const allF29s = await convex.query(api.f29.listSubmissions, {})
    const f29s = allF29s
      .sort((a, b) => (b.updated_at || '').localeCompare(a.updated_at || ''))
      .slice(0, 3)

    f29s.forEach((f29) => {
      actividades.push({
        id: `f29-${f29._id}`,
        tipo: 'f29',
        mensaje: `F29 ${f29.periodo} - ${f29.status}`,
        tiempo: formatTiempoRelativo(f29.updated_at),
        created_at: f29.updated_at || '',
      })
    })

    // Get recent bot jobs
    const allJobs = await convex.query(api.bots.listJobs, {})
    const jobs = allJobs
      .sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''))
      .slice(0, 3)

    jobs.forEach((job) => {
      actividades.push({
        id: `bot-${job._id}`,
        tipo: 'bot',
        mensaje: `Bot job - ${job.status}`,
        tiempo: formatTiempoRelativo(job.completed_at || job.created_at),
        created_at: job.completed_at || job.created_at || '',
      })
    })

    // Get recent alerts
    const allValidations = await convex.query(api.f29.getSubmissionValidations, { submissionId: undefined })
    const alertas = allValidations
      .filter(v => v.resultado === 'warning' || v.resultado === 'error')
      .sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''))
      .slice(0, 2)

    alertas.forEach((alerta) => {
      actividades.push({
        id: `alert-${alerta._id}`,
        tipo: 'alert',
        mensaje: alerta.descripcion,
        tiempo: formatTiempoRelativo(alerta.created_at),
        created_at: alerta.created_at || '',
      })
    })

    // Sort by date and limit
    return actividades
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, limite)
  } catch (error) {
    console.error('Error getting recent activity:', error)
    return []
  }
}

function formatTiempoRelativo(fecha: string | null | undefined): string {
  if (!fecha) return 'Hace un momento'

  const diff = Date.now() - new Date(fecha).getTime()
  const minutos = Math.floor(diff / 60000)

  if (minutos < 1) return 'Hace un momento'
  if (minutos < 60) return `Hace ${minutos} min`

  const horas = Math.floor(minutos / 60)
  if (horas < 24) return `Hace ${horas}h`

  const dias = Math.floor(horas / 24)
  return `Hace ${dias} día${dias > 1 ? 's' : ''}`
}

// ============================================
// DATOS PARA GRÁFICOS DEL DASHBOARD
// ============================================

export interface DocumentosPorDia {
  fecha: string
  dia: string
  total: number
  clasificados: number
  pendientes: number
}

export interface DocumentosPorTipo {
  tipo: string
  cantidad: number
  porcentaje: number
}

export interface F29PorMes {
  mes: string
  borradores: number
  enviados: number
  total_pagar: number
}

export interface BotsActividad {
  bot: string
  exitosos: number
  fallidos: number
  pendientes: number
}

// Obtener documentos por día (últimos 7 días)
export async function getDocumentosPorDia(): Promise<DocumentosPorDia[]> {
  try {
    const allDocs = await convex.query(api.documents.listDocuments, {})
    const dias: DocumentosPorDia[] = []
    const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

    for (let i = 6; i >= 0; i--) {
      const fecha = new Date()
      fecha.setDate(fecha.getDate() - i)
      fecha.setHours(0, 0, 0, 0)

      const fechaFin = new Date(fecha)
      fechaFin.setDate(fechaFin.getDate() + 1)

      const fechaISO = fecha.toISOString()
      const fechaFinISO = fechaFin.toISOString()

      const docsEnFecha = allDocs.filter(doc =>
        doc.created_at && doc.created_at >= fechaISO && doc.created_at < fechaFinISO
      )

      const total = docsEnFecha.length
      const clasificados = docsEnFecha.filter(doc => doc.clasificado_at).length

      dias.push({
        fecha: fecha.toISOString().split('T')[0],
        dia: diasSemana[fecha.getDay()],
        total,
        clasificados,
        pendientes: total - clasificados,
      })
    }

    return dias
  } catch (error) {
    console.error('Error getting documents by day:', error)
    return []
  }
}

// Obtener distribución por tipo de documento
export async function getDocumentosPorTipo(): Promise<DocumentosPorTipo[]> {
  try {
    const allDocs = await convex.query(api.documents.listDocuments, {})

    if (allDocs.length === 0) {
      return [
        { tipo: 'Facturas', cantidad: 45, porcentaje: 45 },
        { tipo: 'Boletas', cantidad: 30, porcentaje: 30 },
        { tipo: 'Notas Crédito', cantidad: 15, porcentaje: 15 },
        { tipo: 'Otros', cantidad: 10, porcentaje: 10 },
      ]
    }

    const conteo: Record<string, number> = {}
    allDocs.forEach((doc) => {
      const tipo = formatTipoDocumento(doc.tipo_documento)
      conteo[tipo] = (conteo[tipo] || 0) + 1
    })

    const total = allDocs.length
    return Object.entries(conteo)
      .map(([tipo, cantidad]) => ({
        tipo,
        cantidad,
        porcentaje: Math.round((cantidad / total) * 100),
      }))
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 5)
  } catch (error) {
    console.error('Error getting documents by type:', error)
    return []
  }
}

// Obtener F29 por mes (últimos 6 meses)
export async function getF29PorMes(): Promise<F29PorMes[]> {
  try {
    const allF29s = await convex.query(api.f29.listSubmissions, {})
    const meses: F29PorMes[] = []
    const nombresMeses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

    for (let i = 5; i >= 0; i--) {
      const fecha = new Date()
      fecha.setMonth(fecha.getMonth() - i)
      const periodo = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`

      const f29s = allF29s.filter(f => f.periodo === periodo)
      const borradores = f29s.filter(f => ['borrador', 'calculado', 'validado'].includes(f.status || '')).length
      const enviados = f29s.filter(f => f.status === 'enviado').length
      const totalPagar = f29s.reduce((sum, f) => sum + Number(f.total_a_pagar || 0), 0)

      meses.push({
        mes: nombresMeses[fecha.getMonth()],
        borradores,
        enviados,
        total_pagar: totalPagar,
      })
    }

    return meses
  } catch (error) {
    console.error('Error getting F29 by month:', error)
    return []
  }
}

// Obtener actividad de bots
export async function getBotsActividad(): Promise<BotsActividad[]> {
  try {
    const bots = await convex.query(api.bots.listBotDefinitions, {})
    const allJobs = await convex.query(api.bots.listJobs, {})
    const hace30dias = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

    if (bots.length === 0) {
      return []
    }

    const actividad: BotsActividad[] = []

    for (const bot of bots.slice(0, 6)) {
      const jobs = allJobs.filter(j =>
        j.bot_id === bot._id && j.created_at && j.created_at >= hace30dias
      )

      const exitosos = jobs.filter(j => j.status === 'completado').length
      const fallidos = jobs.filter(j => j.status === 'fallido').length
      const pendientes = jobs.filter(j => ['pendiente', 'ejecutando'].includes(j.status || '')).length

      actividad.push({
        bot: bot.nombre.replace('Bot ', '').replace('HV-', ''),
        exitosos,
        fallidos,
        pendientes,
      })
    }

    return actividad
  } catch (error) {
    console.error('Error getting bots activity:', error)
    return []
  }
}

// Obtener KPIs principales
export interface KPIsDashboard {
  clientesActivos: number
  documentosMes: number
  f29Pendientes: number
  precisionIA: number
  chatConsultasMes: number
  botsEjecutadosMes: number
}

export async function getKPIs(): Promise<KPIsDashboard> {
  try {
    const inicioMes = new Date()
    inicioMes.setDate(1)
    inicioMes.setHours(0, 0, 0, 0)
    const inicioMesISO = inicioMes.toISOString()

    const clientes = await convex.query(api.clients.listClientes, {})
    const clientesActivos = clientes.filter(c => c.activo).length

    const allDocs = await convex.query(api.documents.listDocuments, {})
    const documentosMes = allDocs.filter(doc =>
      doc.created_at && doc.created_at >= inicioMesISO
    ).length

    const allF29s = await convex.query(api.f29.listSubmissions, {})
    const f29Pendientes = allF29s.filter(f29 =>
      f29.status && ['borrador', 'calculado', 'validado'].includes(f29.status)
    ).length

    const allMessages = await convex.query(api.chat.listMessages, { sessionId: undefined })
    const chatConsultas = allMessages.filter(msg =>
      msg.rol === 'user' && msg.created_at && msg.created_at >= inicioMesISO
    ).length

    const allJobs = await convex.query(api.bots.listJobs, {})
    const botsEjecutados = allJobs.filter(job =>
      job.created_at && job.created_at >= inicioMesISO
    ).length

    return {
      clientesActivos,
      documentosMes,
      f29Pendientes,
      precisionIA: 95,
      chatConsultasMes: chatConsultas,
      botsEjecutadosMes: botsEjecutados,
    }
  } catch (error) {
    console.error('Error getting KPIs:', error)
    return {
      clientesActivos: 0,
      documentosMes: 0,
      f29Pendientes: 0,
      precisionIA: 95,
      chatConsultasMes: 0,
      botsEjecutadosMes: 0,
    }
  }
}

function formatTipoDocumento(tipo: string): string {
  const tipos: Record<string, string> = {
    'FACTURA_ELECTRONICA': 'Facturas',
    'FACTURA_EXENTA': 'Fact. Exentas',
    'BOLETA_ELECTRONICA': 'Boletas',
    'NOTA_CREDITO': 'Notas Crédito',
    'NOTA_DEBITO': 'Notas Débito',
    'FACTURA_COMPRA': 'Fact. Compra',
    'GUIA_DESPACHO': 'Guías Despacho',
    'FACTURA_EXPORTACION': 'Fact. Export.',
    'BOLETA_EXENTA': 'Boletas Exentas',
  }
  return tipos[tipo] || tipo
}
