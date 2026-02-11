// @ts-nocheck — temporary: remove after full migration
'use server'

import { ConvexHttpClient } from "convex/browser"
import { api } from "../../../../convex/_generated/api"
import { revalidatePath } from 'next/cache'
import OpenAI from 'openai'

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!)
const DEMO_USER_ID = 'demo-user'

// Cliente OpenAI
const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null

type CuentaContable = {
  id: string
  codigo: string
  nombre: string
  tipo: string | null
  activa: boolean | null
  cuenta_padre_id: string | null
  es_cuenta_mayor: boolean | null
  nivel: number | null
  plan_cuenta_id: string
}

type ClasificacionML = {
  id: string
  documento_id: string
  modelo_version: string
  cuenta_predicha_id: string
  confidence: number
  ranking: number
  features_input?: any
  cuenta?: CuentaContable | null
}

type Documento = {
  id: string
  cliente_id?: string
  tipo_documento?: string
  folio?: number
  fecha_emision?: string
  razon_social_emisor?: string
  rut_emisor?: string
  giro_emisor?: string
  glosa?: string
  monto_neto?: number
  monto_iva?: number
  monto_total?: number
  es_compra?: boolean
  es_activo_fijo?: boolean
  status?: string
  cuenta_sugerida_id?: string
  cuenta_final_id?: string
  confidence_score?: number
  clasificado_por?: string
  clasificado_at?: string
  created_at?: string
  updated_at?: string
}

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

// Obtener documentos pendientes de clasificacion
export async function getDocumentosPendientes(clienteId?: string): Promise<DocumentoConClasificacion[]> {
  try {
    const data = await convex.query(api.documents.listDocuments, {
      clienteId: clienteId as any,
      status: 'pendiente',
      limit: 50,
    })

    if (!data || data.length === 0) return []

    // Map Convex documents to the expected format
    return (data || []).map((doc: any) => ({
      id: doc._id ?? doc.id,
      cliente_id: doc.clienteId ?? doc.cliente_id,
      tipo_documento: doc.tipo_documento,
      folio: doc.folio,
      fecha_emision: doc.fecha_emision,
      razon_social_emisor: doc.razon_social_emisor,
      rut_emisor: doc.rut_emisor,
      giro_emisor: doc.giro_emisor,
      glosa: doc.glosa,
      monto_neto: doc.monto_neto,
      monto_iva: doc.monto_iva,
      monto_total: doc.monto_total,
      es_compra: doc.es_compra,
      es_activo_fijo: doc.es_activo_fijo,
      status: doc.status,
      cuenta_sugerida_id: doc.cuenta_sugerida_id,
      cuenta_final_id: doc.cuenta_final_id,
      confidence_score: doc.confidence_score,
      clasificado_por: doc.clasificado_por,
      clasificado_at: doc.clasificado_at,
      created_at: doc._creationTime ? new Date(doc._creationTime).toISOString() : doc.created_at,
      updated_at: doc.updated_at,
      cliente: doc.cliente ?? null,
      cuenta_sugerida: doc.cuenta_sugerida ?? null,
      cuenta_final: doc.cuenta_final ?? null,
      // TODO: clasificaciones_ml not available in Convex yet
      clasificaciones_ml: [],
    })) as DocumentoConClasificacion[]
  } catch (error) {
    console.error('Error fetching documentos:', error)
    return []
  }
}

// Obtener estadisticas del clasificador
export async function getClasificadorStats(clienteId?: string): Promise<ClasificadorStats> {
  try {
    const stats = await convex.query(api.documents.getDocumentStats, {
      clienteId: clienteId as any,
    })

    return {
      totalHoy: stats?.totalHoy ?? 0,
      clasificados: stats?.clasificados ?? 0,
      pendientes: stats?.pendientes ?? 0,
      precision: stats?.precision ?? 95.0,
    }
  } catch (error) {
    console.error('Error fetching clasificador stats:', error)
    return {
      totalHoy: 0,
      clasificados: 0,
      pendientes: 0,
      precision: 95.0,
    }
  }
}

// Obtener cuentas contables para un cliente
// TODO: Migrate cuentas_contables table to Convex
export async function getCuentasContables(clienteId: string): Promise<CuentaContable[]> {
  // Stub - cuentas_contables table not yet in Convex
  // Return empty array until the table is migrated
  console.log('getCuentasContables (stub) for client:', clienteId)
  return []
}

// Confirmar clasificacion sugerida
export async function confirmarClasificacion(
  documentoId: string,
  cuentaId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await convex.mutation(api.documents.classifyDocument, {
      id: documentoId as any,
      cuenta_final_id: cuentaId,
      confidence_score: 1.0,
      clasificado_por: 'manual',
    })

    revalidatePath('/dashboard/clasificador')
    return { success: true }
  } catch (error) {
    console.error('Error confirmando clasificacion:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Error confirmando clasificacion' }
  }
}

// Rechazar y reclasificar documento
export async function reclasificarDocumento(
  documentoId: string,
  cuentaCorrectaId: string,
  comentario?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await convex.mutation(api.documents.classifyDocument, {
      id: documentoId as any,
      cuenta_final_id: cuentaCorrectaId,
      clasificado_por: 'manual',
    })

    // TODO: Register feedback when feedback_clasificacion table is in Convex
    if (comentario) {
      console.log('Feedback for reclassification (stub):', { documentoId, comentario })
    }

    revalidatePath('/dashboard/clasificador')
    return { success: true }
  } catch (error) {
    console.error('Error reclasificando documento:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Error reclasificando' }
  }
}

// Clasificacion por lotes - aprobar todos los documentos con alta confianza
export async function aprobarLoteAltaConfianza(
  clienteId: string,
  umbralConfianza: number = 0.9
): Promise<{ success: boolean; aprobados: number; error?: string }> {
  try {
    // Get pending documents from Convex
    const docs = await convex.query(api.documents.listDocuments, {
      clienteId: clienteId as any,
      status: 'pendiente',
      limit: 100,
    })

    if (!docs || docs.length === 0) {
      return { success: true, aprobados: 0 }
    }

    // Filter for high confidence docs with suggested accounts
    const highConfidenceDocs = docs.filter((doc: any) =>
      doc.cuenta_sugerida_id &&
      doc.confidence_score &&
      doc.confidence_score >= umbralConfianza
    )

    if (highConfidenceDocs.length === 0) {
      return { success: true, aprobados: 0 }
    }

    // Approve each document
    let aprobados = 0
    for (const doc of highConfidenceDocs) {
      try {
        await convex.mutation(api.documents.classifyDocument, {
          id: (doc._id ?? doc.id) as any,
          cuenta_final_id: doc.cuenta_sugerida_id,
          clasificado_por: 'modelo',
        })
        aprobados++
      } catch (e) {
        console.error('Error approving doc:', doc._id ?? doc.id, e)
      }
    }

    revalidatePath('/dashboard/clasificador')
    return { success: true, aprobados }
  } catch (error) {
    console.error('Error in batch approval:', error)
    return { success: false, aprobados: 0, error: error instanceof Error ? error.message : 'Error en aprobacion por lote' }
  }
}

// Obtener lista de clientes
// TODO: Migrate clientes table to Convex
export async function getClientes(): Promise<{ id: string; razon_social: string; rut: string }[]> {
  // Stub - clientes table not yet directly in Convex for this module
  console.log('getClientes (stub)')
  return []
}

// ============================================
// CLASIFICACION CON INTELIGENCIA ARTIFICIAL
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
const CLASIFICADOR_SYSTEM_PROMPT = `Eres un experto contador chileno especializado en clasificacion de documentos tributarios segun el plan de cuentas.

Tu tarea es analizar documentos (facturas, boletas, notas de credito) y determinar la cuenta contable mas apropiada basandote en:
- Tipo de documento (compra/venta, factura/boleta/nota credito)
- Glosa o descripcion del documento
- Monto y caracteristicas
- Emisor del documento

IMPORTANTE:
- Para COMPRAS (es_compra = true):
  - Gastos operacionales -> cuentas de GASTO (51xxxx - 54xxxx)
  - Compra de activos -> cuentas de ACTIVO (11xxxx - 19xxxx)
  - Servicios profesionales -> Honorarios (530xxx)

- Para VENTAS (es_compra = false):
  - Ingresos por ventas -> cuentas de INGRESO (41xxxx - 44xxxx)

Responde SIEMPRE en formato JSON con este esquema:
{
  "clasificaciones": [
    {
      "cuenta_id": "uuid de la cuenta",
      "cuenta_codigo": "codigo de la cuenta",
      "cuenta_nombre": "nombre de la cuenta",
      "confianza": 0.95, // entre 0 y 1
      "razonamiento": "explicacion breve de por que esta cuenta"
    }
  ]
}

Proporciona hasta 3 opciones ordenadas por confianza. Si no hay informacion suficiente, indica confianza baja.`

// Clasificar un documento con IA
export async function clasificarDocumentoConIA(
  documentoId: string
): Promise<ResultadoClasificacionIA> {
  if (!openai) {
    return {
      success: false,
      clasificaciones: [],
      error: 'OpenAI no esta configurado'
    }
  }

  try {
    // Obtener documento from Convex via search
    const docs = await convex.query(api.documents.searchDocuments, {
      searchTerm: documentoId,
    })

    const documento = docs?.find((d: any) => (d._id ?? d.id) === documentoId)

    if (!documento) {
      return {
        success: false,
        clasificaciones: [],
        error: 'Documento no encontrado'
      }
    }

    // Obtener cuentas contables - stub since not in Convex yet
    // TODO: Replace with Convex query when cuentas_contables is migrated
    const cuentas: CuentaContable[] = []

    if (cuentas.length === 0) {
      return {
        success: false,
        clasificaciones: [],
        error: 'No hay cuentas contables disponibles (pendiente migracion a Convex)'
      }
    }

    // Preparar prompt con informacion del documento
    const tipoDocNombre = {
      'FACTURA_ELECTRONICA': 'Factura Electronica',
      'FACTURA_EXENTA': 'Factura Exenta',
      'BOLETA_ELECTRONICA': 'Boleta Electronica',
      'NOTA_CREDITO': 'Nota de Credito',
      'NOTA_DEBITO': 'Nota de Debito',
      'FACTURA_COMPRA': 'Factura de Compra',
      'GUIA_DESPACHO': 'Guia de Despacho',
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
- Es Compra: ${documento.es_compra ? 'Si' : 'No'}
- Es Activo Fijo: ${documento.es_activo_fijo ? 'Si' : 'No'}

CUENTAS DISPONIBLES:
${cuentas.map(c => `- ${c.id} | ${c.codigo} | ${c.nombre} (${c.tipo})`).join('\n')}

Analiza el documento y sugiere las cuentas mas apropiadas.`

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

    // Guardar la mejor clasificacion en el documento via Convex
    if (clasificacionesValidas.length > 0) {
      const mejorClasificacion = clasificacionesValidas[0]

      await convex.mutation(api.documents.classifyDocument, {
        id: documentoId as any,
        cuenta_final_id: mejorClasificacion.cuenta_id,
        confidence_score: mejorClasificacion.confianza,
        clasificado_por: 'gpt-4o-mini-v1',
      })

      // TODO: Save to clasificaciones_ml table when migrated to Convex
      console.log('ML classifications (stub - not saved to Convex):', clasificacionesValidas.length)

      revalidatePath('/dashboard/clasificador')
    }

    return {
      success: true,
      clasificaciones: clasificacionesValidas
    }

  } catch (error) {
    console.error('Error en clasificacion IA:', error)
    return {
      success: false,
      clasificaciones: [],
      error: error instanceof Error ? error.message : 'Error desconocido'
    }
  }
}

// Clasificar multiples documentos con IA
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
  try {
    const documentos = await convex.query(api.documents.listDocuments, {
      clienteId: clienteId as any,
      status: 'pendiente',
      limit: 50, // Limitar para evitar timeouts
    })

    if (!documentos || documentos.length === 0) {
      return { success: true, procesados: 0, errores: 0, total: 0 }
    }

    const ids = documentos.map((d: any) => d._id ?? d.id)
    const resultado = await clasificarLoteConIA(ids)

    return {
      ...resultado,
      total: documentos.length
    }
  } catch (error) {
    console.error('Error in clasificarTodosPendientesConIA:', error)
    return { success: false, procesados: 0, errores: 0, total: 0 }
  }
}
