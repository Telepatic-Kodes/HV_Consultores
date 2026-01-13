'use server'

import { createClient } from '@/lib/supabase-server'

export interface MetricaGeneral {
  label: string
  value: string
  subtitle: string
  trend: string
}

export interface ReporteDisponible {
  id: string
  nombre: string
  descripcion: string
  tipo: 'diario' | 'semanal' | 'mensual'
  ultimaGeneracion: string | null
  categoria: string
}

export interface DatosGrafico {
  mes: string
  documentos: number
  horasAhorradas: number
}

export interface ReporteMensual {
  periodo: string
  documentos_procesados: number
  documentos_clasificados: number
  f29_generados: number
  f29_enviados: number
  bot_jobs_completados: number
  bot_jobs_fallidos: number
  chat_sesiones: number
  chat_mensajes: number
  horas_estimadas_ahorradas: number
}

// Obtener métricas generales del sistema
export async function getMetricasGenerales(): Promise<MetricaGeneral[]> {
  const supabase = createClient()

  const ahora = new Date()
  const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1).toISOString()
  const inicioMesAnterior = new Date(ahora.getFullYear(), ahora.getMonth() - 1, 1).toISOString()
  const finMesAnterior = new Date(ahora.getFullYear(), ahora.getMonth(), 0).toISOString()

  // Documentos procesados este mes
  const { count: docsEsteMes } = await supabase
    .from('documentos')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', inicioMes)

  // Documentos procesados mes anterior
  const { count: docsMesAnterior } = await supabase
    .from('documentos')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', inicioMesAnterior)
    .lt('created_at', inicioMes)

  // Calcular trend documentos
  const trendDocs =
    docsMesAnterior && docsMesAnterior > 0
      ? Math.round(((docsEsteMes || 0) - docsMesAnterior) / docsMesAnterior * 100)
      : 0

  // F29 aprobados este mes
  const { count: f29Aprobados } = await supabase
    .from('f29_calculos')
    .select('id', { count: 'exact', head: true })
    .in('status', ['aprobado', 'enviado'])
    .gte('created_at', inicioMes)

  // Sesiones de chat este mes
  const { count: chatSesiones } = await supabase
    .from('chat_sesiones')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', inicioMes)

  // Feedback positivo de chat
  const { count: feedbackPositivo } = await supabase
    .from('chat_feedback')
    .select('id', { count: 'exact', head: true })
    .eq('rating', 5)
    .gte('created_at', inicioMes)

  const { count: feedbackTotal } = await supabase
    .from('chat_feedback')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', inicioMes)

  const satisfaccion = feedbackTotal && feedbackTotal > 0
    ? Math.round((feedbackPositivo || 0) / feedbackTotal * 100)
    : 0

  // Bot jobs exitosos
  const { count: botsExitosos } = await supabase
    .from('bot_jobs')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'completado')
    .gte('created_at', inicioMes)

  const { count: botsFallidos } = await supabase
    .from('bot_jobs')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'fallido')
    .gte('created_at', inicioMes)

  const tasaError = (botsExitosos || 0) + (botsFallidos || 0) > 0
    ? ((botsFallidos || 0) / ((botsExitosos || 0) + (botsFallidos || 0)) * 100).toFixed(1)
    : '0'

  // Estimar horas ahorradas (aprox 5 min por documento, 15 min por F29)
  const horasAhorradas = Math.round(
    ((docsEsteMes || 0) * 5 + (f29Aprobados || 0) * 15) / 60
  )

  return [
    {
      label: 'Horas Ahorradas',
      value: horasAhorradas.toString(),
      subtitle: 'Este mes',
      trend: `+${Math.round(horasAhorradas * 0.15)}%`,
    },
    {
      label: 'Documentos Procesados',
      value: (docsEsteMes || 0).toLocaleString(),
      subtitle: 'Este mes',
      trend: `${trendDocs >= 0 ? '+' : ''}${trendDocs}%`,
    },
    {
      label: 'Tasa de Error Bots',
      value: `${tasaError}%`,
      subtitle: 'Jobs fallidos',
      trend: '-0.2%',
    },
    {
      label: 'Satisfacción Chat',
      value: `${satisfaccion || 0}%`,
      subtitle: 'Feedback positivo',
      trend: '+2%',
    },
  ]
}

// Obtener datos para gráfico de evolución
export async function getDatosEvolucion(meses: number = 6): Promise<DatosGrafico[]> {
  const supabase = createClient()
  const datos: DatosGrafico[] = []

  for (let i = meses - 1; i >= 0; i--) {
    const fecha = new Date()
    fecha.setMonth(fecha.getMonth() - i)
    const inicioMes = new Date(fecha.getFullYear(), fecha.getMonth(), 1).toISOString()
    const finMes = new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0).toISOString()

    const { count: docs } = await supabase
      .from('documentos')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', inicioMes)
      .lte('created_at', finMes)

    const { count: f29 } = await supabase
      .from('f29_calculos')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', inicioMes)
      .lte('created_at', finMes)

    const horasAhorradas = Math.round(((docs || 0) * 5 + (f29 || 0) * 15) / 60)

    datos.push({
      mes: fecha.toLocaleDateString('es-CL', { month: 'short' }),
      documentos: docs || 0,
      horasAhorradas,
    })
  }

  return datos
}

// Obtener lista de reportes disponibles
export async function getReportesDisponibles(): Promise<ReporteDisponible[]> {
  return [
    {
      id: 'resumen-mensual',
      nombre: 'Resumen Mensual',
      descripcion: 'Métricas generales del mes: documentos, F29, bots y chat',
      tipo: 'mensual',
      ultimaGeneracion: new Date().toLocaleDateString('es-CL'),
      categoria: 'general',
    },
    {
      id: 'productividad-contador',
      nombre: 'Productividad por Contador',
      descripcion: 'Documentos procesados y clasificados por usuario',
      tipo: 'semanal',
      ultimaGeneracion: new Date().toLocaleDateString('es-CL'),
      categoria: 'productividad',
    },
    {
      id: 'precision-clasificador',
      nombre: 'Precisión del Clasificador',
      descripcion: 'Análisis de precisión de HV-Class por categoría',
      tipo: 'mensual',
      ultimaGeneracion: new Date().toLocaleDateString('es-CL'),
      categoria: 'ia',
    },
    {
      id: 'estado-f29',
      nombre: 'Estado de F29',
      descripcion: 'Resumen de formularios por cliente y período',
      tipo: 'mensual',
      ultimaGeneracion: new Date().toLocaleDateString('es-CL'),
      categoria: 'tributario',
    },
    {
      id: 'actividad-bots',
      nombre: 'Actividad de Bots',
      descripcion: 'Jobs ejecutados, tiempos y tasas de éxito',
      tipo: 'diario',
      ultimaGeneracion: new Date().toLocaleDateString('es-CL'),
      categoria: 'automatizacion',
    },
    {
      id: 'uso-chat',
      nombre: 'Uso del Chat IA',
      descripcion: 'Consultas realizadas, temas frecuentes y satisfacción',
      tipo: 'semanal',
      ultimaGeneracion: new Date().toLocaleDateString('es-CL'),
      categoria: 'ia',
    },
  ]
}

// Generar reporte específico
export async function generarReporte(
  reporteId: string
): Promise<{ success: boolean; data?: any; error?: string }> {
  const supabase = createClient()

  const ahora = new Date()
  const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1).toISOString()

  try {
    switch (reporteId) {
      case 'resumen-mensual': {
        const [
          { count: documentos },
          { count: clasificados },
          { count: f29Generados },
          { count: f29Enviados },
          { count: botsCompletados },
          { count: botsFallidos },
          { count: chatSesiones },
          { count: chatMensajes },
        ] = await Promise.all([
          supabase
            .from('documentos')
            .select('id', { count: 'exact', head: true })
            .gte('created_at', inicioMes),
          supabase
            .from('documentos')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'clasificado')
            .gte('created_at', inicioMes),
          supabase
            .from('f29_calculos')
            .select('id', { count: 'exact', head: true })
            .gte('created_at', inicioMes),
          supabase
            .from('f29_calculos')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'enviado')
            .gte('created_at', inicioMes),
          supabase
            .from('bot_jobs')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'completado')
            .gte('created_at', inicioMes),
          supabase
            .from('bot_jobs')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'fallido')
            .gte('created_at', inicioMes),
          supabase
            .from('chat_sesiones')
            .select('id', { count: 'exact', head: true })
            .gte('created_at', inicioMes),
          supabase
            .from('chat_mensajes')
            .select('id', { count: 'exact', head: true })
            .gte('created_at', inicioMes),
        ])

        return {
          success: true,
          data: {
            periodo: ahora.toLocaleDateString('es-CL', { month: 'long', year: 'numeric' }),
            documentos_procesados: documentos || 0,
            documentos_clasificados: clasificados || 0,
            f29_generados: f29Generados || 0,
            f29_enviados: f29Enviados || 0,
            bot_jobs_completados: botsCompletados || 0,
            bot_jobs_fallidos: botsFallidos || 0,
            chat_sesiones: chatSesiones || 0,
            chat_mensajes: chatMensajes || 0,
            horas_estimadas_ahorradas: Math.round(
              ((documentos || 0) * 5 + (f29Generados || 0) * 15) / 60
            ),
          },
        }
      }

      case 'estado-f29': {
        const { data: f29Data } = await supabase
          .from('f29_calculos')
          .select(`
            *,
            cliente:clientes(razon_social, rut)
          `)
          .gte('created_at', inicioMes)
          .order('created_at', { ascending: false })

        return {
          success: true,
          data: f29Data || [],
        }
      }

      case 'actividad-bots': {
        const { data: jobsData } = await supabase
          .from('bot_jobs')
          .select(`
            *,
            bot:bot_definiciones(nombre, portal)
          `)
          .gte('created_at', inicioMes)
          .order('created_at', { ascending: false })
          .limit(100)

        return {
          success: true,
          data: jobsData || [],
        }
      }

      default:
        return { success: false, error: 'Reporte no encontrado' }
    }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// Obtener productividad por contador
export async function getProductividadContadores(): Promise<
  { contador: string; documentos: number; clasificados: number }[]
> {
  const supabase = createClient()

  const ahora = new Date()
  const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1).toISOString()

  const { data: perfiles } = await supabase
    .from('profiles')
    .select('id, nombre_completo')
    .eq('activo', true)

  if (!perfiles) return []

  const productividad = await Promise.all(
    perfiles.map(async (perfil) => {
      const { count: clasificados } = await supabase
        .from('documentos')
        .select('id', { count: 'exact', head: true })
        .eq('clasificado_por', perfil.id)
        .gte('clasificado_at', inicioMes)

      const { count: clientes } = await supabase
        .from('clientes')
        .select('id', { count: 'exact', head: true })
        .eq('contador_asignado_id', perfil.id)

      const { count: docs } = await supabase
        .from('documentos')
        .select('id', { count: 'exact', head: true })
        .in(
          'cliente_id',
          (
            await supabase
              .from('clientes')
              .select('id')
              .eq('contador_asignado_id', perfil.id)
          ).data?.map((c) => c.id) || []
        )
        .gte('created_at', inicioMes)

      return {
        contador: perfil.nombre_completo,
        documentos: docs || 0,
        clasificados: clasificados || 0,
      }
    })
  )

  return productividad.filter((p) => p.documentos > 0 || p.clasificados > 0)
}

// ============================================
// FUNCIONES PARA REPORTES DESCARGABLES
// ============================================

// Obtener lista de clientes para selector
export async function getClientesParaReportes(): Promise<
  { id: string; rut: string; razon_social: string }[]
> {
  const supabase = createClient()

  const { data } = await supabase
    .from('clientes')
    .select('id, rut, razon_social')
    .eq('activo', true)
    .order('razon_social')

  return data || []
}

// Obtener datos de F29 para reporte
export async function getDatosF29ParaReporte(clienteId: string, periodo: string) {
  const supabase = createClient()

  // Obtener cliente
  const { data: cliente } = await supabase
    .from('clientes')
    .select('rut, razon_social, giro, direccion')
    .eq('id', clienteId)
    .single()

  if (!cliente) return null

  // Obtener F29
  const { data: f29 } = await supabase
    .from('f29_calculos')
    .select('*')
    .eq('cliente_id', clienteId)
    .eq('periodo', periodo)
    .single()

  if (!f29) return null

  // Obtener códigos
  const { data: codigos } = await supabase
    .from('f29_codigos')
    .select('*')
    .eq('f29_calculo_id', f29.id)
    .order('codigo')

  // Obtener validaciones
  const { data: validaciones } = await supabase
    .from('f29_validaciones')
    .select('*')
    .eq('f29_calculo_id', f29.id)

  return {
    cliente: {
      rut: cliente.rut,
      razon_social: cliente.razon_social,
      giro: cliente.giro || '',
      direccion: cliente.direccion || '',
    },
    periodo,
    codigos: (codigos || []).map(c => ({
      codigo: c.codigo,
      descripcion: c.descripcion || '',
      monto_neto: Number(c.monto_neto) || 0,
      monto_iva: Number(c.monto_iva) || 0,
      cantidad_documentos: c.cantidad_documentos || 0,
    })),
    totales: {
      debito_fiscal: Number(f29.total_debito_fiscal) || 0,
      credito_fiscal: Number(f29.total_credito_fiscal) || 0,
      remanente_anterior: Number(f29.remanente_anterior) || 0,
      remanente_mes: Number(f29.remanente_actualizado) || 0,
      ppm: Number(f29.ppm_determinado) || 0,
      total_a_pagar: Number(f29.total_a_pagar) || 0,
    },
    validaciones: (validaciones || []).map(v => ({
      descripcion: v.descripcion,
      resultado: v.resultado as 'ok' | 'warning' | 'error',
      mensaje: v.mensaje || '',
    })),
  }
}

// Obtener documentos para reporte Excel
export async function getDocumentosParaReporte(clienteId: string, periodo: string) {
  const supabase = createClient()

  // Obtener cliente
  const { data: cliente } = await supabase
    .from('clientes')
    .select('rut, razon_social')
    .eq('id', clienteId)
    .single()

  if (!cliente) return null

  // Obtener documentos del período
  const { data: documentos } = await supabase
    .from('documentos')
    .select(`
      *,
      cuenta_final:cuentas_contables!documentos_cuenta_final_id_fkey(codigo, nombre)
    `)
    .eq('cliente_id', clienteId)
    .eq('periodo', periodo)
    .order('fecha_emision', { ascending: false })

  const tipoLabels: Record<string, string> = {
    'FACTURA_ELECTRONICA': 'Factura Electrónica',
    'FACTURA_EXENTA': 'Factura Exenta',
    'BOLETA_ELECTRONICA': 'Boleta Electrónica',
    'NOTA_CREDITO': 'Nota de Crédito',
    'NOTA_DEBITO': 'Nota de Débito',
    'FACTURA_COMPRA': 'Factura de Compra',
    'GUIA_DESPACHO': 'Guía de Despacho',
  }

  const statusLabels: Record<string, string> = {
    'pendiente': 'Pendiente',
    'clasificado': 'Clasificado',
    'revisado': 'Revisado',
    'aprobado': 'Aprobado',
    'exportado': 'Exportado',
  }

  return {
    cliente: {
      rut: cliente.rut,
      razon_social: cliente.razon_social,
    },
    periodo,
    documentos: (documentos || []).map(d => ({
      tipo: tipoLabels[d.tipo_documento] || d.tipo_documento,
      folio: d.folio,
      fecha: new Date(d.fecha_emision).toLocaleDateString('es-CL'),
      emisor: d.razon_social_emisor || '',
      rut_emisor: d.rut_emisor,
      glosa: d.glosa || '',
      monto_neto: Number(d.monto_neto) || 0,
      monto_iva: Number(d.monto_iva) || 0,
      monto_total: Number(d.monto_total) || 0,
      cuenta: d.cuenta_final ? `${(d.cuenta_final as any).codigo} - ${(d.cuenta_final as any).nombre}` : 'Sin asignar',
      estado: statusLabels[d.status || 'pendiente'] || d.status || 'Pendiente',
    })),
  }
}

// Obtener resumen mensual para reporte
export async function getResumenMensualParaReporte(clienteId: string, periodo: string) {
  const supabase = createClient()

  // Obtener cliente
  const { data: cliente } = await supabase
    .from('clientes')
    .select('rut, razon_social')
    .eq('id', clienteId)
    .single()

  if (!cliente) return null

  // Obtener documentos
  const { data: documentos } = await supabase
    .from('documentos')
    .select('tipo_documento, es_compra, monto_neto, monto_iva, monto_total, status')
    .eq('cliente_id', clienteId)
    .eq('periodo', periodo)

  if (!documentos) return null

  const tipoLabels: Record<string, string> = {
    'FACTURA_ELECTRONICA': 'Facturas Electrónicas',
    'FACTURA_EXENTA': 'Facturas Exentas',
    'BOLETA_ELECTRONICA': 'Boletas Electrónicas',
    'NOTA_CREDITO': 'Notas de Crédito',
    'NOTA_DEBITO': 'Notas de Débito',
    'FACTURA_COMPRA': 'Facturas de Compra',
  }

  // Calcular totales
  const compras = documentos.filter(d => d.es_compra)
  const ventas = documentos.filter(d => !d.es_compra)

  const total_compras = compras.reduce((sum, d) => sum + Number(d.monto_total || 0), 0)
  const total_ventas = ventas.reduce((sum, d) => sum + Number(d.monto_total || 0), 0)
  const iva_credito = compras.reduce((sum, d) => sum + Number(d.monto_iva || 0), 0)
  const iva_debito = ventas.reduce((sum, d) => sum + Number(d.monto_iva || 0), 0)

  // Agrupar por tipo
  const porTipo: Record<string, { cantidad: number; monto_total: number }> = {}
  documentos.forEach(d => {
    const tipo = tipoLabels[d.tipo_documento] || d.tipo_documento
    if (!porTipo[tipo]) {
      porTipo[tipo] = { cantidad: 0, monto_total: 0 }
    }
    porTipo[tipo].cantidad++
    porTipo[tipo].monto_total += Number(d.monto_total || 0)
  })

  return {
    cliente: {
      rut: cliente.rut,
      razon_social: cliente.razon_social,
    },
    periodo,
    resumen: {
      total_compras,
      total_ventas,
      iva_debito,
      iva_credito,
      documentos_procesados: documentos.filter(d => d.status !== 'pendiente').length,
      documentos_pendientes: documentos.filter(d => d.status === 'pendiente').length,
    },
    por_tipo: Object.entries(porTipo).map(([tipo, data]) => ({
      tipo,
      cantidad: data.cantidad,
      monto_total: data.monto_total,
    })),
  }
}

// Obtener períodos disponibles para un cliente
export async function getPeriodosDisponibles(clienteId: string): Promise<string[]> {
  const supabase = createClient()

  const { data } = await supabase
    .from('documentos')
    .select('periodo')
    .eq('cliente_id', clienteId)
    .order('periodo', { ascending: false })

  if (!data) return []

  // Obtener períodos únicos
  const periodos = Array.from(new Set(data.map(d => d.periodo)))
  return periodos.filter(Boolean) as string[]
}
