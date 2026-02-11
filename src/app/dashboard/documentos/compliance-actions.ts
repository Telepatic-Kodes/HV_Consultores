// @ts-nocheck — temporary: remove after full migration
'use server'

import { createClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

// ============================================================================
// TYPES
// ============================================================================

export interface RetentionPolicy {
  id: string
  cliente_id: string
  nombre: string
  descripcion?: string
  tipo_documento: string
  anos_retener: number
  accion_vencimiento: 'ARCHIVE' | 'DELETE' | 'NOTIFY'
  activa: boolean
  creada_en: string
}

export interface ComplianceReport {
  id: string
  cliente_id: string
  tipo_reporte: string
  nombre: string
  periodo_inicio: string
  periodo_fin: string
  estado: string
  archivo_url?: string
  creado_en: string
}

export interface ReportSchedule {
  id: string
  cliente_id: string
  nombre: string
  tipo_reporte: string
  frecuencia: string
  destinatarios: string[]
  activa: boolean
  proxima_ejecucion?: string
}

export interface AuditLog {
  id: string
  usuario_id: string
  tabla: string
  accion: string
  registro_id?: string
  creado_en: string
  ip_address?: string
  user_agent?: string
}

// ============================================================================
// RETENTION POLICIES
// ============================================================================

/**
 * Get all retention policies for a client
 */
export async function obtenerPoliticasRetencion(
  clienteId: string
): Promise<{ success: boolean; politicas?: RetentionPolicy[]; error?: string }> {
  const supabase = createClient()

  try {
    const { data: politicas, error } = await supabase
      .from('document_retention_policies')
      .select('*')
      .eq('cliente_id', clienteId)
      .order('creada_en', { ascending: false })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, politicas: (politicas || []) as RetentionPolicy[] }
  } catch (error) {
    return { success: false, error: 'Error al obtener políticas de retención' }
  }
}

/**
 * Create new retention policy
 */
export async function crearPoliticaRetencion(
  clienteId: string,
  datos: {
    nombre: string
    descripcion?: string
    tipo_documento?: string
    anos_retener: number
    accion_vencimiento: 'ARCHIVE' | 'DELETE' | 'NOTIFY'
    requiere_sii_confirmacion?: boolean
  }
): Promise<{ success: boolean; politicaId?: string; error?: string }> {
  const supabase = createClient()

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'No autenticado' }
    }

    const { data: politica, error } = await supabase
      .from('document_retention_policies')
      .insert({
        cliente_id: clienteId,
        nombre: datos.nombre,
        descripcion: datos.descripcion,
        tipo_documento: datos.tipo_documento,
        anos_retener: datos.anos_retener,
        accion_vencimiento: datos.accion_vencimiento,
        requiere_sii_confirmacion: datos.requiere_sii_confirmacion,
        creada_por: user.id,
      })
      .select('id')
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, politicaId: politica.id }
  } catch (error) {
    return { success: false, error: 'Error al crear política de retención' }
  }
}

/**
 * Update retention policy
 */
export async function actualizarPoliticaRetencion(
  politicaId: string,
  datos: Partial<{
    nombre: string
    descripcion: string
    anos_retener: number
    accion_vencimiento: string
    activa: boolean
  }>
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()

  try {
    const { error } = await supabase
      .from('document_retention_policies')
      .update(datos)
      .eq('id', politicaId)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    return { success: false, error: 'Error al actualizar política' }
  }
}

// ============================================================================
// COMPLIANCE REPORTS
// ============================================================================

/**
 * Get compliance reports for a client
 */
export async function obtenerReportesComplianza(
  clienteId: string,
  tipo?: string
): Promise<{ success: boolean; reportes?: ComplianceReport[]; error?: string }> {
  const supabase = createClient()

  try {
    let query = supabase
      .from('compliance_reports')
      .select('*')
      .eq('cliente_id', clienteId)

    if (tipo) {
      query = query.eq('tipo_reporte', tipo)
    }

    const { data: reportes, error } = await query.order('creado_en', { ascending: false })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, reportes: (reportes || []) as ComplianceReport[] }
  } catch (error) {
    return { success: false, error: 'Error al obtener reportes de cumplimiento' }
  }
}

/**
 * Create compliance report
 */
export async function crearReporteComplianza(
  clienteId: string,
  datos: {
    tipo_reporte: string
    nombre: string
    periodo_inicio: string
    periodo_fin: string
    descripcion?: string
  }
): Promise<{ success: boolean; reporteId?: string; error?: string }> {
  const supabase = createClient()

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'No autenticado' }
    }

    const { data: reporte, error } = await supabase
      .from('compliance_reports')
      .insert({
        cliente_id: clienteId,
        tipo_reporte: datos.tipo_reporte,
        nombre: datos.nombre,
        descripcion: datos.descripcion,
        periodo_inicio: datos.periodo_inicio,
        periodo_fin: datos.periodo_fin,
        estado: 'DRAFT',
        creado_por: user.id,
      })
      .select('id')
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, reporteId: reporte.id }
  } catch (error) {
    return { success: false, error: 'Error al crear reporte' }
  }
}

/**
 * Approve compliance report
 */
export async function aprobarReporteComplianza(
  reporteId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'No autenticado' }
    }

    const { error } = await supabase
      .from('compliance_reports')
      .update({
        estado: 'APPROVED',
        aprobado_por: user.id,
        aprobado_en: new Date().toISOString(),
      })
      .eq('id', reporteId)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    return { success: false, error: 'Error al aprobar reporte' }
  }
}

/**
 * Distribute compliance report
 */
export async function distribuirReporteComplianza(
  reporteId: string,
  destinatarios: string[]
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()

  try {
    const { error } = await supabase
      .from('compliance_reports')
      .update({
        estado: 'DISTRIBUTED',
        distribuido_a: destinatarios,
        distribuido_en: new Date().toISOString(),
      })
      .eq('id', reporteId)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    return { success: false, error: 'Error al distribuir reporte' }
  }
}

// ============================================================================
// REPORT SCHEDULES
// ============================================================================

/**
 * Get report schedules for a client
 */
export async function obtenerProgramasReportes(
  clienteId: string
): Promise<{ success: boolean; programas?: ReportSchedule[]; error?: string }> {
  const supabase = createClient()

  try {
    const { data: programas, error } = await supabase
      .from('report_schedules')
      .select('*')
      .eq('cliente_id', clienteId)
      .order('proxima_ejecucion')

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, programas: (programas || []) as ReportSchedule[] }
  } catch (error) {
    return { success: false, error: 'Error al obtener programas de reporte' }
  }
}

/**
 * Create report schedule
 */
export async function crearProgramaReporte(
  clienteId: string,
  datos: {
    nombre: string
    tipo_reporte: string
    frecuencia: 'DIARIA' | 'SEMANAL' | 'MENSUAL' | 'TRIMESTRAL' | 'ANUAL'
    hora_generacion: string
    destinatarios: string[]
    descripcion?: string
    formato?: string
  }
): Promise<{ success: boolean; programaId?: string; error?: string }> {
  const supabase = createClient()

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'No autenticado' }
    }

    const { data: programa, error } = await supabase
      .from('report_schedules')
      .insert({
        cliente_id: clienteId,
        nombre: datos.nombre,
        tipo_reporte: datos.tipo_reporte,
        frecuencia: datos.frecuencia,
        hora_generacion: datos.hora_generacion,
        destinatarios: datos.destinatarios,
        descripcion: datos.descripcion,
        formato: datos.formato || 'PDF',
        creado_por: user.id,
      })
      .select('id')
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, programaId: programa.id }
  } catch (error) {
    return { success: false, error: 'Error al crear programa de reporte' }
  }
}

/**
 * Toggle report schedule
 */
export async function alternarProgramaReporte(
  programaId: string,
  activa: boolean
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()

  try {
    const { error } = await supabase
      .from('report_schedules')
      .update({ activa })
      .eq('id', programaId)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    return { success: false, error: 'Error al actualizar programa' }
  }
}

// ============================================================================
// COMPLIANCE CHECKLISTS
// ============================================================================

/**
 * Get compliance checklists for a client
 */
export async function obtenerListasVerificacion(
  clienteId: string,
  tipo?: string
): Promise<{ success: boolean; listas?: any[]; error?: string }> {
  const supabase = createClient()

  try {
    let query = supabase
      .from('compliance_checklists')
      .select('*')
      .eq('cliente_id', clienteId)

    if (tipo) {
      query = query.eq('tipo', tipo)
    }

    const { data: listas, error } = await query.order('creada_en', { ascending: false })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, listas: listas || [] }
  } catch (error) {
    return { success: false, error: 'Error al obtener listas de verificación' }
  }
}

/**
 * Create compliance checklist
 */
export async function crearListaVerificacion(
  clienteId: string,
  datos: {
    nombre: string
    tipo: 'LEGAL' | 'TAX' | 'OPERATIONAL' | 'SECURITY'
    descripcion?: string
    items: Array<{
      titulo: string
      descripcion: string
      obligatorio: boolean
    }>
  }
): Promise<{ success: boolean; listaId?: string; error?: string }> {
  const supabase = createClient()

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'No autenticado' }
    }

    // Format items
    const items = datos.items.map((item, idx) => ({
      id: `item_${idx}`,
      titulo: item.titulo,
      descripcion: item.descripcion,
      obligatorio: item.obligatorio,
      completado: false,
      fecha_completado: null,
    }))

    const { data: lista, error } = await supabase
      .from('compliance_checklists')
      .insert({
        cliente_id: clienteId,
        nombre: datos.nombre,
        tipo: datos.tipo,
        descripcion: datos.descripcion,
        items,
        creado_por: user.id,
      })
      .select('id')
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, listaId: lista.id }
  } catch (error) {
    return { success: false, error: 'Error al crear lista de verificación' }
  }
}

/**
 * Update checklist item
 */
export async function actualizarElementoListaVerificacion(
  listaId: string,
  itemId: string,
  completado: boolean
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()

  try {
    // Get current checklist
    const { data: lista, error: getError } = await supabase
      .from('compliance_checklists')
      .select('items')
      .eq('id', listaId)
      .single()

    if (getError || !lista) {
      return { success: false, error: 'Lista no encontrada' }
    }

    // Update the specific item
    const items = (lista.items || []).map((item: any) => {
      if (item.id === itemId) {
        return {
          ...item,
          completado,
          fecha_completado: completado ? new Date().toISOString() : null,
        }
      }
      return item
    })

    // Calculate completion percentage
    const completados = items.filter((i: any) => i.completado).length
    const porcentaje = (completados / items.length) * 100

    const { error: updateError } = await supabase
      .from('compliance_checklists')
      .update({
        items,
        porcentaje_completado: porcentaje,
        completada: completados === items.length,
        completado_en: completados === items.length ? new Date().toISOString() : null,
      })
      .eq('id', listaId)

    if (updateError) {
      return { success: false, error: updateError.message }
    }

    return { success: true }
  } catch (error) {
    return { success: false, error: 'Error al actualizar elemento' }
  }
}

// ============================================================================
// AUDIT LOGS
// ============================================================================

/**
 * Get audit logs for a client
 */
export async function obtenerRegistrosAuditoria(
  clienteId: string,
  filtros?: {
    tabla?: string
    accion?: string
    usuario_id?: string
    fecha_desde?: string
    fecha_hasta?: string
  }
): Promise<{ success: boolean; registros?: AuditLog[]; error?: string }> {
  const supabase = createClient()

  try {
    let query = supabase
      .from('audit_logs_extended')
      .select('*')
      .eq('cliente_id', clienteId)

    if (filtros?.tabla) {
      query = query.eq('tabla', filtros.tabla)
    }
    if (filtros?.accion) {
      query = query.eq('accion', filtros.accion)
    }
    if (filtros?.usuario_id) {
      query = query.eq('usuario_id', filtros.usuario_id)
    }
    if (filtros?.fecha_desde) {
      query = query.gte('creado_en', filtros.fecha_desde)
    }
    if (filtros?.fecha_hasta) {
      query = query.lte('creado_en', filtros.fecha_hasta)
    }

    const { data: registros, error } = await query
      .order('creado_en', { ascending: false })
      .limit(1000)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, registros: (registros || []) as AuditLog[] }
  } catch (error) {
    return { success: false, error: 'Error al obtener registros de auditoría' }
  }
}

/**
 * Get audit summary
 */
export async function obtenerResumenAuditoria(
  clienteId: string,
  fechaDesde: string,
  fechaHasta: string
): Promise<{
  success: boolean
  resumen?: {
    total_acciones: number
    acciones_por_tabla: Record<string, number>
    acciones_por_usuario: Record<string, number>
    acciones_criticas: number
  }
  error?: string
}> {
  const supabase = createClient()

  try {
    const { data: registros, error } = await supabase
      .from('audit_logs_extended')
      .select('tabla, accion, usuario_id')
      .eq('cliente_id', clienteId)
      .gte('creado_en', fechaDesde)
      .lte('creado_en', fechaHasta)

    if (error) {
      return { success: false, error: error.message }
    }

    const acciones_por_tabla: Record<string, number> = {}
    const acciones_por_usuario: Record<string, number> = {}
    let criticas = 0

    registros?.forEach((reg) => {
      acciones_por_tabla[reg.tabla] = (acciones_por_tabla[reg.tabla] || 0) + 1
      acciones_por_usuario[reg.usuario_id] = (acciones_por_usuario[reg.usuario_id] || 0) + 1

      if (['DELETE', 'REJECT', 'DENY'].includes(reg.accion)) {
        criticas++
      }
    })

    return {
      success: true,
      resumen: {
        total_acciones: registros?.length || 0,
        acciones_por_tabla,
        acciones_por_usuario,
        acciones_criticas: criticas,
      },
    }
  } catch (error) {
    return { success: false, error: 'Error al obtener resumen de auditoría' }
  }
}

// ============================================================================
// COMPLIANCE SUMMARY
// ============================================================================

/**
 * Get compliance summary for a client
 */
export async function obtenerResumenComplianza(
  clienteId: string,
  fechaDesde: string,
  fechaHasta: string
): Promise<{
  success: boolean
  resumen?: {
    total_documentos: number
    documentos_aprobados: number
    documentos_archivados: number
    documentos_vencidos: number
    tasa_cumplimiento: number
    hallazgos_criticos: number
    acciones_requeridas: number
  }
  error?: string
}> {
  const supabase = createClient()

  try {
    const { data, error } = await supabase.rpc('obtener_resumen_cumplimiento', {
      p_cliente_id: clienteId,
      p_fecha_inicio: fechaDesde,
      p_fecha_fin: fechaHasta,
    })

    if (error) {
      return { success: false, error: error.message }
    }

    if (data && data.length > 0) {
      const result = data[0]
      return {
        success: true,
        resumen: {
          total_documentos: result.total_documentos || 0,
          documentos_aprobados: result.documentos_aprobados || 0,
          documentos_archivados: result.documentos_archivados || 0,
          documentos_vencidos: result.documentos_vencidos || 0,
          tasa_cumplimiento: Number(result.tasa_cumplimiento) || 0,
          hallazgos_criticos: result.hallazgos_criticos || 0,
          acciones_requeridas: result.acciones_requeridas || 0,
        },
      }
    }

    return {
      success: true,
      resumen: {
        total_documentos: 0,
        documentos_aprobados: 0,
        documentos_archivados: 0,
        documentos_vencidos: 0,
        tasa_cumplimiento: 0,
        hallazgos_criticos: 0,
        acciones_requeridas: 0,
      },
    }
  } catch (error) {
    return { success: false, error: 'Error al obtener resumen de cumplimiento' }
  }
}

/**
 * Get documents due for retention action
 */
export async function obtenerDocumentosVencidos(
  clienteId: string
): Promise<{
  success: boolean
  documentos?: Array<{
    documento_id: string
    tipo_documento: string
    dias_restantes: number
    accion_pendiente: string
  }>
  error?: string
}> {
  const supabase = createClient()

  try {
    const { data: documentos, error } = await supabase.rpc(
      'verificar_documentos_vencidos',
      {
        p_cliente_id: clienteId,
      }
    )

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, documentos: documentos || [] }
  } catch (error) {
    return { success: false, error: 'Error al obtener documentos vencidos' }
  }
}
