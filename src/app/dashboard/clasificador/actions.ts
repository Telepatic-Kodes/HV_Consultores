// @ts-nocheck — temporary: remove after full migration
'use server'

import { createClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'
import OpenAI from 'openai'
import type { Database } from '@/types/database.types'

type Documento = Database['public']['Tables']['documentos']['Row']

// Cliente OpenAI
const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null
type CuentaContable = Database['public']['Tables']['cuentas_contables']['Row']
type ClasificacionML = Database['public']['Tables']['clasificaciones_ml']['Row']

export interface DocumentoConClasificacion extends Documento {
  cliente: { razon_social: string } | null
  cuenta_sugerida: CuentaContable | null
  cuenta_final: CuentaContable | null
  clasificaciones_ml: (ClasificacionML & { cuenta: CuentaContable | null })[]
}

export interface ClasificadorStats {
  totalHoy: number
  clasificados: number
  pendientes: number
  precision: number
}

// Obtener documentos pendientes de clasificación
export async function getDocumentosPendientes(clienteId?: string): Promise<DocumentoConClasificacion[]> {
  const supabase = createClient()

  let query = supabase
    .from('documentos')
    .select(`
      *,
      cliente:clientes(razon_social),
      cuenta_sugerida:cuentas_contables!documentos_cuenta_sugerida_id_fkey(id, codigo, nombre),
      cuenta_final:cuentas_contables!documentos_cuenta_final_id_fkey(id, codigo, nombre),
      clasificaciones_ml(
        id,
        modelo_version,
        cuenta_predicha_id,
        confidence,
        ranking,
        cuenta:cuentas_contables(id, codigo, nombre)
      )
    `)
    .in('status', ['pendiente', 'clasificado'])
    .order('created_at', { ascending: false })
    .limit(50)

  if (clienteId) {
    query = query.eq('cliente_id', clienteId)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching documentos:', error)
    return []
  }

  return (data || []) as unknown as DocumentoConClasificacion[]
}

// Obtener estadísticas del clasificador
export async function getClasificadorStats(clienteId?: string): Promise<ClasificadorStats> {
  const supabase = createClient()
  const hoy = new Date().toISOString().split('T')[0]

  // Documentos de hoy
  let queryHoy = supabase
    .from('documentos')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', `${hoy}T00:00:00`)

  if (clienteId) queryHoy = queryHoy.eq('cliente_id', clienteId)
  const { count: totalHoy } = await queryHoy

  // Clasificados (revisados o aprobados)
  let queryClasificados = supabase
    .from('documentos')
    .select('id', { count: 'exact', head: true })
    .in('status', ['revisado', 'aprobado', 'exportado'])

  if (clienteId) queryClasificados = queryClasificados.eq('cliente_id', clienteId)
  const { count: clasificados } = await queryClasificados

  // Pendientes
  let queryPendientes = supabase
    .from('documentos')
    .select('id', { count: 'exact', head: true })
    .in('status', ['pendiente', 'clasificado'])

  if (clienteId) queryPendientes = queryPendientes.eq('cliente_id', clienteId)
  const { count: pendientes } = await queryPendientes

  // Calcular precisión (documentos donde cuenta_sugerida == cuenta_final)
  let queryPrecision = supabase
    .from('documentos')
    .select('cuenta_sugerida_id, cuenta_final_id')
    .not('cuenta_final_id', 'is', null)
    .not('cuenta_sugerida_id', 'is', null)

  if (clienteId) queryPrecision = queryPrecision.eq('cliente_id', clienteId)
  const { data: docsConFinal } = await queryPrecision

  let precision = 95.0 // Default
  if (docsConFinal && docsConFinal.length > 0) {
    const correctos = docsConFinal.filter(d => d.cuenta_sugerida_id === d.cuenta_final_id).length
    precision = (correctos / docsConFinal.length) * 100
  }

  return {
    totalHoy: totalHoy || 0,
    clasificados: clasificados || 0,
    pendientes: pendientes || 0,
    precision: Math.round(precision * 10) / 10
  }
}

// Obtener cuentas contables para un cliente
export async function getCuentasContables(clienteId: string): Promise<CuentaContable[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('cuentas_contables')
    .select('*')
    .eq('activa', true)
    .order('codigo')

  if (error) {
    console.error('Error fetching cuentas:', error)
    return []
  }

  return data || []
}

// Confirmar clasificación sugerida
export async function confirmarClasificacion(
  documentoId: string,
  cuentaId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()

  const { error } = await supabase
    .from('documentos')
    .update({
      cuenta_final_id: cuentaId,
      status: 'revisado',
      clasificado_por: 'manual',
      clasificado_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', documentoId)

  if (error) {
    console.error('Error confirmando clasificación:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard/clasificador')
  return { success: true }
}

// Rechazar y reclasificar documento
export async function reclasificarDocumento(
  documentoId: string,
  cuentaCorrectaId: string,
  comentario?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()

  // Obtener documento actual para el feedback
  const { data: doc } = await supabase
    .from('documentos')
    .select('cuenta_sugerida_id')
    .eq('id', documentoId)
    .single()

  // Actualizar documento
  const { error: updateError } = await supabase
    .from('documentos')
    .update({
      cuenta_final_id: cuentaCorrectaId,
      status: 'revisado',
      clasificado_por: 'manual',
      clasificado_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', documentoId)

  if (updateError) {
    return { success: false, error: updateError.message }
  }

  // Registrar feedback si hubo cuenta sugerida diferente
  if (doc?.cuenta_sugerida_id && doc.cuenta_sugerida_id !== cuentaCorrectaId) {
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      await supabase.from('feedback_clasificacion').insert({
        documento_id: documentoId,
        cuenta_predicha_id: doc.cuenta_sugerida_id,
        cuenta_correcta_id: cuentaCorrectaId,
        usuario_id: user.id,
        comentario: comentario || null
      })
    }
  }

  revalidatePath('/dashboard/clasificador')
  return { success: true }
}

// Clasificación por lotes - aprobar todos los documentos con alta confianza
export async function aprobarLoteAltaConfianza(
  clienteId: string,
  umbralConfianza: number = 0.9
): Promise<{ success: boolean; aprobados: number; error?: string }> {
  const supabase = createClient()

  // Obtener documentos pendientes con alta confianza
  const { data: docs, error: fetchError } = await supabase
    .from('documentos')
    .select('id, cuenta_sugerida_id, confidence_score')
    .eq('cliente_id', clienteId)
    .eq('status', 'pendiente')
    .not('cuenta_sugerida_id', 'is', null)
    .gte('confidence_score', umbralConfianza)

  if (fetchError) {
    return { success: false, aprobados: 0, error: fetchError.message }
  }

  if (!docs || docs.length === 0) {
    return { success: true, aprobados: 0 }
  }

  // Actualizar cada documento con su cuenta sugerida
  for (const doc of docs) {
    await supabase
      .from('documentos')
      .update({
        cuenta_final_id: doc.cuenta_sugerida_id,
        status: 'revisado',
        clasificado_por: 'modelo',
        clasificado_at: new Date().toISOString()
      })
      .eq('id', doc.id)
  }

  revalidatePath('/dashboard/clasificador')
  return { success: true, aprobados: docs.length }
}

// Obtener lista de clientes
export async function getClientes(): Promise<{ id: string; razon_social: string; rut: string }[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('clientes')
    .select('id, razon_social, rut')
    .eq('activo', true)
    .order('razon_social')

  if (error) {
    console.error('Error fetching clientes:', error)
    return []
  }

  return data || []
}

// ============================================
// CLASIFICACIÓN CON INTELIGENCIA ARTIFICIAL
// ============================================

export interface ClasificacionIA {
  cuenta_id: string
  cuenta_codigo: string
  cuenta_nombre: string
  confianza: number
  razonamiento: string
}

export interface ResultadoClasificacionIA {
  success: boolean
  clasificaciones: ClasificacionIA[]
  error?: string
}

// System prompt para el clasificador
const CLASIFICADOR_SYSTEM_PROMPT = `Eres un experto contador chileno especializado en clasificación de documentos tributarios según el plan de cuentas.

Tu tarea es analizar documentos (facturas, boletas, notas de crédito) y determinar la cuenta contable más apropiada basándote en:
- Tipo de documento (compra/venta, factura/boleta/nota crédito)
- Glosa o descripción del documento
- Monto y características
- Emisor del documento

IMPORTANTE:
- Para COMPRAS (es_compra = true):
  - Gastos operacionales → cuentas de GASTO (51xxxx - 54xxxx)
  - Compra de activos → cuentas de ACTIVO (11xxxx - 19xxxx)
  - Servicios profesionales → Honorarios (530xxx)

- Para VENTAS (es_compra = false):
  - Ingresos por ventas → cuentas de INGRESO (41xxxx - 44xxxx)

Responde SIEMPRE en formato JSON con este esquema:
{
  "clasificaciones": [
    {
      "cuenta_id": "uuid de la cuenta",
      "cuenta_codigo": "código de la cuenta",
      "cuenta_nombre": "nombre de la cuenta",
      "confianza": 0.95, // entre 0 y 1
      "razonamiento": "explicación breve de por qué esta cuenta"
    }
  ]
}

Proporciona hasta 3 opciones ordenadas por confianza. Si no hay información suficiente, indica confianza baja.`

// Clasificar un documento con IA
export async function clasificarDocumentoConIA(
  documentoId: string
): Promise<ResultadoClasificacionIA> {
  if (!openai) {
    return {
      success: false,
      clasificaciones: [],
      error: 'OpenAI no está configurado'
    }
  }

  const supabase = createClient()

  // Obtener documento
  const { data: documento, error: docError } = await supabase
    .from('documentos')
    .select(`
      *,
      cliente:clientes(id, razon_social, rut)
    `)
    .eq('id', documentoId)
    .single()

  if (docError || !documento) {
    return {
      success: false,
      clasificaciones: [],
      error: 'Documento no encontrado'
    }
  }

  // Obtener cuentas contables del cliente
  const { data: cuentas } = await supabase
    .from('cuentas_contables')
    .select('id, codigo, nombre, tipo')
    .eq('activa', true)
    .order('codigo')

  if (!cuentas || cuentas.length === 0) {
    return {
      success: false,
      clasificaciones: [],
      error: 'No hay cuentas contables disponibles'
    }
  }

  // Preparar prompt con información del documento
  const tipoDocNombre = {
    'FACTURA_ELECTRONICA': 'Factura Electrónica',
    'FACTURA_EXENTA': 'Factura Exenta',
    'BOLETA_ELECTRONICA': 'Boleta Electrónica',
    'NOTA_CREDITO': 'Nota de Crédito',
    'NOTA_DEBITO': 'Nota de Débito',
    'FACTURA_COMPRA': 'Factura de Compra',
    'GUIA_DESPACHO': 'Guía de Despacho',
  }[documento.tipo_documento] || documento.tipo_documento

  const userPrompt = `Clasifica este documento:

DOCUMENTO:
- Tipo: ${tipoDocNombre}
- Folio: ${documento.folio}
- Fecha: ${documento.fecha_emision}
- Emisor: ${documento.razon_social_emisor || 'No especificado'} (RUT: ${documento.rut_emisor})
- Giro: ${documento.giro_emisor || 'No especificado'}
- Glosa: ${documento.glosa || 'Sin glosa'}
- Monto Neto: $${documento.monto_neto?.toLocaleString('es-CL') || 0}
- IVA: $${documento.monto_iva?.toLocaleString('es-CL') || 0}
- Total: $${documento.monto_total?.toLocaleString('es-CL') || 0}
- Es Compra: ${documento.es_compra ? 'Sí' : 'No'}
- Es Activo Fijo: ${documento.es_activo_fijo ? 'Sí' : 'No'}

CUENTAS DISPONIBLES:
${cuentas.map(c => `- ${c.id} | ${c.codigo} | ${c.nombre} (${c.tipo})`).join('\n')}

Analiza el documento y sugiere las cuentas más apropiadas.`

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: CLASIFICADOR_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.3,
      max_tokens: 1000,
      response_format: { type: 'json_object' }
    })

    const respuesta = completion.choices[0]?.message?.content
    if (!respuesta) {
      return {
        success: false,
        clasificaciones: [],
        error: 'No se obtuvo respuesta de la IA'
      }
    }

    const resultado = JSON.parse(respuesta)
    const clasificaciones: ClasificacionIA[] = resultado.clasificaciones || []

    // Validar que las cuentas existan
    const clasificacionesValidas = clasificaciones.filter(c =>
      cuentas.some(cuenta => cuenta.id === c.cuenta_id)
    )

    // Guardar la mejor clasificación en el documento
    if (clasificacionesValidas.length > 0) {
      const mejorClasificacion = clasificacionesValidas[0]

      await supabase
        .from('documentos')
        .update({
          cuenta_sugerida_id: mejorClasificacion.cuenta_id,
          confidence_score: mejorClasificacion.confianza,
          status: 'clasificado',
          updated_at: new Date().toISOString()
        })
        .eq('id', documentoId)

      // Guardar en clasificaciones_ml
      await supabase
        .from('clasificaciones_ml')
        .insert(
          clasificacionesValidas.map((c, index) => ({
            documento_id: documentoId,
            modelo_version: 'gpt-4o-mini-v1',
            cuenta_predicha_id: c.cuenta_id,
            confidence: c.confianza,
            ranking: index + 1,
            features_input: {
              tipo_documento: documento.tipo_documento,
              glosa: documento.glosa,
              monto_total: documento.monto_total,
              es_compra: documento.es_compra,
              emisor: documento.razon_social_emisor
            }
          }))
        )

      revalidatePath('/dashboard/clasificador')
    }

    return {
      success: true,
      clasificaciones: clasificacionesValidas
    }

  } catch (error) {
    console.error('Error en clasificación IA:', error)
    return {
      success: false,
      clasificaciones: [],
      error: error instanceof Error ? error.message : 'Error desconocido'
    }
  }
}

// Clasificar múltiples documentos con IA
export async function clasificarLoteConIA(
  documentoIds: string[]
): Promise<{ success: boolean; procesados: number; errores: number }> {
  let procesados = 0
  let errores = 0

  for (const id of documentoIds) {
    const resultado = await clasificarDocumentoConIA(id)
    if (resultado.success) {
      procesados++
    } else {
      errores++
    }
  }

  revalidatePath('/dashboard/clasificador')
  return { success: true, procesados, errores }
}

// Clasificar todos los documentos pendientes de un cliente
export async function clasificarTodosPendientesConIA(
  clienteId: string
): Promise<{ success: boolean; procesados: number; errores: number; total: number }> {
  const supabase = createClient()

  const { data: documentos } = await supabase
    .from('documentos')
    .select('id')
    .eq('cliente_id', clienteId)
    .eq('status', 'pendiente')
    .limit(50) // Limitar para evitar timeouts

  if (!documentos || documentos.length === 0) {
    return { success: true, procesados: 0, errores: 0, total: 0 }
  }

  const resultado = await clasificarLoteConIA(documentos.map(d => d.id))

  return {
    ...resultado,
    total: documentos.length
  }
}
