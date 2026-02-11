// @ts-nocheck — temporary: remove after full migration
'use server'

import { createClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

// ============================================================================
// TYPES
// ============================================================================

export interface TemplateAnalytics {
  id: string
  plantilla_id: string
  cliente_id: string
  uso_total: number
  uso_mes_actual: number
  uso_mes_anterior: number
  tasa_exito: number
  monto_total_procesado: number
  monto_promedio: number
  documentos_exitosos: number
  documentos_rechazados: number
  dias_sin_usar: number
  primera_usada_en: string | null
  ultima_usada_en: string | null
}

export interface SmartSuggestion {
  id: string
  cliente_id: string
  tipo_sugerencia: string
  sugerencia_id: string
  sugerencia_texto: string
  confianza: number
  razon: string
  basado_en: string
  aceptada: boolean | null
  sugerida_en: string
  aceptada_en: string | null
}

export interface DocumentInsight {
  fecha: string
  mes: string
  ano: number
  documentos_cargados: number
  documentos_aprobados: number
  documentos_rechazados: number
  monto_total: number
  tasa_aprobacion: number
  indice_crecimiento: number | null
}

export interface DocumentClassification {
  id: string
  documento_carga_id: string
  tipo_predicho: string
  tipo_real: string
  confianza: number
  folio_sugerido: string
  plantilla_sugerida_id: string
  monto_sugerido: number
  modelo_version: string
}

// ============================================================================
// TEMPLATE ANALYTICS
// ============================================================================

/**
 * Get analytics for a specific template
 */
export async function obtenerAnalisisPlantilla(
  plantillaId: string
): Promise<{ success: boolean; analytics?: TemplateAnalytics; error?: string }> {
  const supabase = createClient()

  try {
    const { data: analytics, error } = await supabase
      .from('template_analytics')
      .select('*')
      .eq('plantilla_id', plantillaId)
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, analytics: analytics as TemplateAnalytics }
  } catch (error) {
    return { success: false, error: 'Error al obtener análisis de plantilla' }
  }
}

/**
 * Get analytics for all templates of a client
 */
export async function obtenerAnalisisPlantillasCliente(
  clienteId: string
): Promise<{ success: boolean; analytics?: TemplateAnalytics[]; error?: string }> {
  const supabase = createClient()

  try {
    const { data: analytics, error } = await supabase
      .from('template_analytics')
      .select('*')
      .eq('cliente_id', clienteId)
      .order('uso_total', { ascending: false })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, analytics: (analytics || []) as TemplateAnalytics[] }
  } catch (error) {
    return { success: false, error: 'Error al obtener análisis' }
  }
}

/**
 * Recalculate template analytics
 */
export async function recalcularAnalisisPlantilla(
  plantillaId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()

  try {
    const { data, error } = await supabase.rpc('calcular_analisis_plantilla', {
      p_plantilla_id: plantillaId,
    })

    if (error) {
      return { success: false, error: error.message }
    }

    // Update the analytics record
    if (data && data.length > 0) {
      const result = data[0]
      await supabase
        .from('template_analytics')
        .update({
          uso_total: result.uso_total,
          uso_mes_actual: result.uso_mes_actual,
          tasa_exito: result.tasa_exito,
          monto_promedio: result.monto_promedio,
          dias_sin_usar: result.dias_sin_usar,
        })
        .eq('plantilla_id', plantillaId)
    }

    return { success: true }
  } catch (error) {
    return { success: false, error: 'Error al recalcular análisis' }
  }
}

// ============================================================================
// SMART SUGGESTIONS
// ============================================================================

/**
 * Get recommended templates for a client
 */
export async function obtenerPlantillasRecomendadas(
  clienteId: string,
  limite: number = 5
): Promise<{ success: boolean; recomendaciones?: any[]; error?: string }> {
  const supabase = createClient()

  try {
    const { data, error } = await supabase.rpc('obtener_plantillas_recomendadas', {
      p_cliente_id: clienteId,
      p_limite: limite,
    })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, recomendaciones: data || [] }
  } catch (error) {
    return { success: false, error: 'Error al obtener recomendaciones' }
  }
}

/**
 * Get smart suggestions for a client
 */
export async function obtenerSugerenciasInteligentes(
  clienteId: string,
  tipoSugerencia?: string
): Promise<{ success: boolean; sugerencias?: SmartSuggestion[]; error?: string }> {
  const supabase = createClient()

  try {
    let query = supabase
      .from('smart_suggestions')
      .select('*')
      .eq('cliente_id', clienteId)
      .is('aceptada', null)
      .order('confianza', { ascending: false })

    if (tipoSugerencia) {
      query = query.eq('tipo_sugerencia', tipoSugerencia)
    }

    const { data: sugerencias, error } = await query

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, sugerencias: (sugerencias || []) as SmartSuggestion[] }
  } catch (error) {
    return { success: false, error: 'Error al obtener sugerencias' }
  }
}

/**
 * Create smart suggestion
 */
export async function crearSugerenciaInteligente(
  clienteId: string,
  datos: {
    tipo_sugerencia: string
    sugerencia_id?: string
    sugerencia_texto: string
    confianza: number
    razon: string
    basado_en: string
    contexto?: Record<string, any>
  }
): Promise<{ success: boolean; sugerenciaId?: string; error?: string }> {
  const supabase = createClient()

  try {
    const { data: sugerencia, error } = await supabase
      .from('smart_suggestions')
      .insert({
        cliente_id: clienteId,
        tipo_sugerencia: datos.tipo_sugerencia,
        sugerencia_id: datos.sugerencia_id,
        sugerencia_texto: datos.sugerencia_texto,
        confianza: datos.confianza,
        razon: datos.razon,
        basado_en: datos.basado_en,
        contexto: datos.contexto,
      })
      .select('id')
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, sugerenciaId: sugerencia.id }
  } catch (error) {
    return { success: false, error: 'Error al crear sugerencia' }
  }
}

/**
 * Accept/reject smart suggestion
 */
export async function responderSugerencia(
  sugerenciaId: string,
  aceptada: boolean,
  retroalimentacion?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()

  try {
    const { error } = await supabase
      .from('smart_suggestions')
      .update({
        aceptada,
        retroalimentacion_usuario: retroalimentacion,
        aceptada_en: aceptada ? new Date().toISOString() : null,
      })
      .eq('id', sugerenciaId)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    return { success: false, error: 'Error al responder sugerencia' }
  }
}

// ============================================================================
// DOCUMENT INSIGHTS
// ============================================================================

/**
 * Get insights for a date range
 */
export async function obtenerInsightsRango(
  clienteId: string,
  fechaInicio: string,
  fechaFin: string
): Promise<{ success: boolean; insights?: DocumentInsight[]; error?: string }> {
  const supabase = createClient()

  try {
    const { data, error } = await supabase.rpc('obtener_insights_rango', {
      p_cliente_id: clienteId,
      p_fecha_inicio: fechaInicio,
      p_fecha_fin: fechaFin,
    })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, insights: data || [] }
  } catch (error) {
    return { success: false, error: 'Error al obtener insights' }
  }
}

/**
 * Get insights for current month
 */
export async function obtenerInsightsMes(
  clienteId: string
): Promise<{ success: boolean; insight?: DocumentInsight; error?: string }> {
  const supabase = createClient()

  try {
    const today = new Date()
    const mesActual = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`

    const { data: insight, error } = await supabase
      .from('document_insights')
      .select('*')
      .eq('cliente_id', clienteId)
      .eq('mes', mesActual)
      .single()

    if (error && error.code !== 'PGRST116') {
      return { success: false, error: error.message }
    }

    return { success: true, insight: insight as DocumentInsight }
  } catch (error) {
    return { success: false, error: 'Error al obtener insights del mes' }
  }
}

/**
 * Get insights for last 30 days
 */
export async function obtenerInsights30Dias(
  clienteId: string
): Promise<{ success: boolean; insights?: DocumentInsight[]; error?: string }> {
  const supabase = createClient()

  try {
    const hoy = new Date()
    const hace30Dias = new Date(hoy.getTime() - 30 * 24 * 60 * 60 * 1000)

    const { data: insights, error } = await supabase
      .from('document_insights')
      .select('*')
      .eq('cliente_id', clienteId)
      .gte('fecha', hace30Dias.toISOString().split('T')[0])
      .order('fecha', { ascending: true })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, insights: (insights || []) as DocumentInsight[] }
  } catch (error) {
    return { success: false, error: 'Error al obtener insights' }
  }
}

// ============================================================================
// DOCUMENT CLASSIFICATION
// ============================================================================

/**
 * Get classification for a document
 */
export async function obtenerClasificacionDocumento(
  documentoId: string
): Promise<{ success: boolean; clasificacion?: DocumentClassification; error?: string }> {
  const supabase = createClient()

  try {
    const { data: clasificacion, error } = await supabase
      .from('document_classifications')
      .select('*')
      .eq('documento_carga_id', documentoId)
      .single()

    if (error && error.code !== 'PGRST116') {
      return { success: false, error: error.message }
    }

    return { success: true, clasificacion: clasificacion as DocumentClassification }
  } catch (error) {
    return { success: false, error: 'Error al obtener clasificación' }
  }
}

/**
 * Create document classification
 */
export async function crearClasificacionDocumento(
  documentoId: string,
  clienteId: string,
  datos: {
    tipo_predicho: string
    tipo_real?: string
    confianza: number
    folio_sugerido?: string
    plantilla_sugerida_id?: string
    monto_sugerido?: number
    modelo_version: string
    features_usados?: Record<string, any>
    probabilidades?: Record<string, any>
  }
): Promise<{ success: boolean; clasificacionId?: string; error?: string }> {
  const supabase = createClient()

  try {
    const { data: clasificacion, error } = await supabase
      .from('document_classifications')
      .insert({
        documento_carga_id: documentoId,
        cliente_id: clienteId,
        tipo_predicho: datos.tipo_predicho,
        tipo_real: datos.tipo_real,
        confianza: datos.confianza,
        folio_sugerido: datos.folio_sugerido,
        plantilla_sugerida_id: datos.plantilla_sugerida_id,
        monto_sugerido: datos.monto_sugerido,
        modelo_version: datos.modelo_version,
        features_usados: datos.features_usados,
        probabilidades: datos.probabilidades,
      })
      .select('id')
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, clasificacionId: clasificacion.id }
  } catch (error) {
    return { success: false, error: 'Error al crear clasificación' }
  }
}

/**
 * Update classification with user feedback
 */
export async function actualizarClasificacionConFeedback(
  clasificacionId: string,
  tipo_real: string,
  retroalimentacion?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()

  try {
    const { error } = await supabase
      .from('document_classifications')
      .update({
        tipo_real,
        retroalimentacion_usada: true,
        feedback_usuario: retroalimentacion,
      })
      .eq('id', clasificacionId)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    return { success: false, error: 'Error al actualizar clasificación' }
  }
}

// ============================================================================
// STATISTICS & TRENDS
// ============================================================================

/**
 * Get document statistics summary
 */
export async function obtenerResumenEstadisticas(
  clienteId: string
): Promise<{
  success: boolean
  estadisticas?: {
    total_documentos: number
    documentos_mes: number
    tasa_aprobacion: number
    plantilla_mas_usada: string | null
    monto_promedio: number
    tasa_crecimiento: number
  }
  error?: string
}> {
  const supabase = createClient()

  try {
    const { data: stats } = await supabase
      .from('document_insights')
      .select('*')
      .eq('cliente_id', clienteId)
      .order('fecha', { ascending: false })
      .limit(1)
      .single()

    if (!stats) {
      return {
        success: true,
        estadisticas: {
          total_documentos: 0,
          documentos_mes: 0,
          tasa_aprobacion: 0,
          plantilla_mas_usada: null,
          monto_promedio: 0,
          tasa_crecimiento: 0,
        },
      }
    }

    return {
      success: true,
      estadisticas: {
        total_documentos: stats.documentos_cargados || 0,
        documentos_mes: stats.documentos_cargados || 0,
        tasa_aprobacion: stats.tasa_aprobacion || 0,
        plantilla_mas_usada: stats.plantilla_mas_usada_id || null,
        monto_promedio: Number(stats.monto_promedio) || 0,
        tasa_crecimiento: Number(stats.indice_crecimiento) || 0,
      },
    }
  } catch (error) {
    return { success: false, error: 'Error al obtener estadísticas' }
  }
}

/**
 * Get trending document types
 */
export async function obtenerTiposDocumentosTendencia(
  clienteId: string,
  dias: number = 30
): Promise<{
  success: boolean
  tendencias?: Array<{ tipo: string; count: number; crecimiento: number }>
  error?: string
}> {
  const supabase = createClient()

  try {
    const hace30Dias = new Date()
    hace30Dias.setDate(hace30Dias.getDate() - dias)

    const { data: insights, error } = await supabase
      .from('document_insights')
      .select('*')
      .eq('cliente_id', clienteId)
      .gte('fecha', hace30Dias.toISOString().split('T')[0])
      .order('fecha')

    if (error) {
      return { success: false, error: error.message }
    }

    if (!insights || insights.length === 0) {
      return { success: true, tendencias: [] }
    }

    // Calculate totals and trends
    const tipos = [
      { tipo: 'facturas', key: 'facturas_count' },
      { tipo: 'boletas', key: 'boletas_count' },
      { tipo: 'notas_credito', key: 'notas_credito_count' },
      { tipo: 'notas_debito', key: 'notas_debito_count' },
    ]

    const tendencias = tipos
      .map((t) => {
        const total = insights.reduce((sum, i) => sum + (Number((i as Record<string, unknown>)[t.key]) || 0), 0)
        const primeroRecord = insights[0] as Record<string, unknown> | undefined
        const ultimoRecord = insights[insights.length - 1] as Record<string, unknown> | undefined
        const primero = Number(primeroRecord?.[t.key]) || 0
        const ultimo = Number(ultimoRecord?.[t.key]) || 0
        const crecimiento = primero > 0 ? ((ultimo - primero) / primero) * 100 : 0

        return { tipo: t.tipo, count: total, crecimiento }
      })
      .filter((t) => t.count > 0)

    return { success: true, tendencias }
  } catch (error) {
    return { success: false, error: 'Error al obtener tendencias' }
  }
}
