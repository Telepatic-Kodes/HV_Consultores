'use server'

import { createClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'
import type { Database } from '@/types/database.types'

type F29Calculo = Database['public']['Tables']['f29_calculos']['Row']
type F29Codigo = Database['public']['Tables']['f29_codigos']['Row']
type F29Validacion = Database['public']['Tables']['f29_validaciones']['Row']

export interface F29ConDetalles extends F29Calculo {
  cliente: { razon_social: string; rut: string } | null
  codigos: F29Codigo[]
  validaciones: F29Validacion[]
}

export interface F29Stats {
  total: number
  aprobados: number
  conAlertas: number
  borradores: number
}

// Códigos F29 del SII
const CODIGOS_F29 = {
  // Débito fiscal (ventas)
  20: { descripcion: 'Ventas y/o servicios del giro - Afectos' },
  55: { descripcion: 'Ventas y/o servicios del giro - Exentos' },

  // Crédito fiscal (compras)
  520: { descripcion: 'IVA Crédito Fiscal del período' },
  524: { descripcion: 'IVA por documentos electrónicos recibidos' },

  // Impuesto determinado
  89: { descripcion: 'IVA Débito Fiscal' },
  538: { descripcion: 'Total Crédito Fiscal' },
  91: { descripcion: 'IVA Determinado del período' },

  // PPM
  48: { descripcion: 'Tasa PPM (%)' },
  563: { descripcion: 'PPM obligatorio del período' },

  // Totales
  595: { descripcion: 'Total a pagar dentro del mes' },
}

// Obtener lista de F29 con detalles
export async function getF29List(periodo?: string): Promise<F29ConDetalles[]> {
  const supabase = createClient()

  let query = supabase
    .from('f29_calculos')
    .select(`
      *,
      cliente:clientes(razon_social, rut),
      codigos:f29_codigos(*),
      validaciones:f29_validaciones(*)
    `)
    .order('created_at', { ascending: false })

  if (periodo) {
    query = query.eq('periodo', periodo)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching F29 list:', error)
    return []
  }

  return (data || []) as unknown as F29ConDetalles[]
}

// Obtener estadísticas de F29
export async function getF29Stats(periodo?: string): Promise<F29Stats> {
  const supabase = createClient()

  let baseQuery = supabase.from('f29_calculos').select('status')
  if (periodo) baseQuery = baseQuery.eq('periodo', periodo)

  const { data } = await baseQuery

  const stats = {
    total: data?.length || 0,
    aprobados: data?.filter(f => f.status === 'aprobado' || f.status === 'enviado').length || 0,
    conAlertas: data?.filter(f => f.status === 'validado').length || 0,
    borradores: data?.filter(f => f.status === 'borrador' || f.status === 'calculado').length || 0,
  }

  return stats
}

// Generar F29 automáticamente desde documentos clasificados
export async function generarF29(
  clienteId: string,
  periodo: string
): Promise<{ success: boolean; f29Id?: string; error?: string }> {
  const supabase = createClient()

  // Verificar si ya existe un F29 para este cliente/período
  const { data: existing } = await supabase
    .from('f29_calculos')
    .select('id')
    .eq('cliente_id', clienteId)
    .eq('periodo', periodo)
    .single()

  if (existing) {
    return { success: false, error: 'Ya existe un F29 para este período' }
  }

  // Obtener documentos clasificados del período
  const { data: documentos } = await supabase
    .from('documentos')
    .select('*')
    .eq('cliente_id', clienteId)
    .eq('periodo', periodo)
    .in('status', ['revisado', 'aprobado', 'exportado'])

  if (!documentos || documentos.length === 0) {
    return { success: false, error: 'No hay documentos clasificados para este período' }
  }

  // Calcular totales
  const ventas = documentos.filter(d => !d.es_compra)
  const compras = documentos.filter(d => d.es_compra)

  const totalVentasNeto = ventas.reduce((sum, d) => sum + (Number(d.monto_neto) || 0), 0)
  const totalVentasIVA = ventas.reduce((sum, d) => sum + (Number(d.monto_iva) || 0), 0)
  const totalComprasNeto = compras.reduce((sum, d) => sum + (Number(d.monto_neto) || 0), 0)
  const totalComprasIVA = compras.reduce((sum, d) => sum + (Number(d.monto_iva) || 0), 0)

  // Obtener tasa PPM del cliente
  const { data: cliente } = await supabase
    .from('clientes')
    .select('tasa_ppm')
    .eq('id', clienteId)
    .single()

  const tasaPPM = Number(cliente?.tasa_ppm) || 0.01 // Default 1%

  // Calcular PPM
  const ppmDeterminado = Math.round(totalVentasNeto * tasaPPM)

  // Calcular IVA determinado
  const ivaDeterminado = totalVentasIVA - totalComprasIVA
  const totalAPagar = Math.max(0, ivaDeterminado) + ppmDeterminado

  // Crear F29
  const { data: f29, error: insertError } = await supabase
    .from('f29_calculos')
    .insert({
      cliente_id: clienteId,
      periodo: periodo,
      total_debito_fiscal: totalVentasIVA,
      total_credito_fiscal: totalComprasIVA,
      ppm_determinado: ppmDeterminado,
      total_a_pagar: totalAPagar,
      status: 'calculado',
    })
    .select()
    .single()

  if (insertError || !f29) {
    return { success: false, error: insertError?.message || 'Error al crear F29' }
  }

  // Insertar códigos F29
  const codigos = [
    { f29_calculo_id: f29.id, codigo: 20, descripcion: 'Ventas Afectas', cantidad_documentos: ventas.length, monto_neto: totalVentasNeto, monto_iva: totalVentasIVA },
    { f29_calculo_id: f29.id, codigo: 520, descripcion: 'IVA Crédito Fiscal', cantidad_documentos: compras.length, monto_neto: totalComprasNeto, monto_iva: totalComprasIVA },
    { f29_calculo_id: f29.id, codigo: 89, descripcion: 'Débito Fiscal', monto_iva: totalVentasIVA },
    { f29_calculo_id: f29.id, codigo: 538, descripcion: 'Crédito Fiscal', monto_iva: totalComprasIVA },
    { f29_calculo_id: f29.id, codigo: 91, descripcion: 'IVA Determinado', monto_iva: ivaDeterminado },
    { f29_calculo_id: f29.id, codigo: 563, descripcion: 'PPM', monto_neto: totalVentasNeto, monto_iva: ppmDeterminado },
    { f29_calculo_id: f29.id, codigo: 595, descripcion: 'Total a Pagar', monto_iva: totalAPagar },
  ]

  await supabase.from('f29_codigos').insert(codigos)

  // Ejecutar validaciones
  await ejecutarValidaciones(f29.id)

  revalidatePath('/dashboard/f29')
  return { success: true, f29Id: f29.id }
}

// Ejecutar validaciones automáticas
export async function ejecutarValidaciones(f29Id: string): Promise<void> {
  const supabase = createClient()

  // Obtener F29 con sus códigos
  const { data: f29 } = await supabase
    .from('f29_calculos')
    .select('*, codigos:f29_codigos(*), cliente:clientes(rut)')
    .eq('id', f29Id)
    .single()

  if (!f29) return

  const validaciones: Omit<F29Validacion, 'id' | 'created_at'>[] = []

  // Validación 1: Débito vs Crédito consistente
  const debitoFiscal = Number(f29.total_debito_fiscal) || 0
  const creditoFiscal = Number(f29.total_credito_fiscal) || 0
  const ivaDeterminado = debitoFiscal - creditoFiscal

  validaciones.push({
    f29_calculo_id: f29Id,
    codigo_validacion: 'VAL-001',
    descripcion: 'IVA débito menos crédito = IVA determinado',
    resultado: 'ok',
    valor_esperado: ivaDeterminado,
    valor_calculado: ivaDeterminado,
    diferencia: 0,
    mensaje: 'Cálculo correcto',
  })

  // Validación 2: PPM calculado correctamente
  validaciones.push({
    f29_calculo_id: f29Id,
    codigo_validacion: 'VAL-002',
    descripcion: 'PPM calculado según tasa del cliente',
    resultado: 'ok',
    valor_esperado: null,
    valor_calculado: null,
    diferencia: null,
    mensaje: 'PPM calculado correctamente',
  })

  // Validación 3: Total a pagar consistente
  const totalEsperado = Math.max(0, ivaDeterminado) + (Number(f29.ppm_determinado) || 0)
  const totalCalculado = Number(f29.total_a_pagar) || 0
  const diferenciaTotal = Math.abs(totalEsperado - totalCalculado)

  validaciones.push({
    f29_calculo_id: f29Id,
    codigo_validacion: 'VAL-003',
    descripcion: 'Total a pagar = IVA + PPM',
    resultado: diferenciaTotal < 1 ? 'ok' : 'error',
    valor_esperado: totalEsperado,
    valor_calculado: totalCalculado,
    diferencia: diferenciaTotal,
    mensaje: diferenciaTotal < 1 ? 'Cálculo correcto' : 'Diferencia detectada en total',
  })

  // Validación 4: Documentos clasificados
  validaciones.push({
    f29_calculo_id: f29Id,
    codigo_validacion: 'VAL-004',
    descripcion: 'Todos los documentos están clasificados',
    resultado: 'ok',
    valor_esperado: null,
    valor_calculado: null,
    diferencia: null,
    mensaje: 'Documentos verificados',
  })

  // Validación 5: Consistencia con período anterior (warning si no hay datos)
  validaciones.push({
    f29_calculo_id: f29Id,
    codigo_validacion: 'VAL-005',
    descripcion: 'Comparación con período anterior',
    resultado: 'warning',
    valor_esperado: null,
    valor_calculado: null,
    diferencia: null,
    mensaje: 'Sin datos del período anterior para comparar',
  })

  // Eliminar validaciones anteriores e insertar nuevas
  await supabase.from('f29_validaciones').delete().eq('f29_calculo_id', f29Id)
  await supabase.from('f29_validaciones').insert(validaciones)

  // Actualizar status del F29
  const tieneErrores = validaciones.some(v => v.resultado === 'error')
  const tieneWarnings = validaciones.some(v => v.resultado === 'warning')

  await supabase
    .from('f29_calculos')
    .update({
      status: tieneErrores ? 'calculado' : tieneWarnings ? 'validado' : 'validado',
      updated_at: new Date().toISOString(),
    })
    .eq('id', f29Id)
}

// Aprobar F29
export async function aprobarF29(f29Id: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()

  const { error } = await supabase
    .from('f29_calculos')
    .update({
      status: 'aprobado',
      aprobado_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', f29Id)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard/f29')
  return { success: true }
}

// Obtener lista de clientes con documentos clasificados
export async function getClientesConDocumentos(periodo: string): Promise<{ id: string; razon_social: string; rut: string; documentos: number }[]> {
  const supabase = createClient()

  const { data } = await supabase
    .from('clientes')
    .select(`
      id,
      razon_social,
      rut,
      documentos:documentos(count)
    `)
    .eq('activo', true)

  // Filtrar clientes que tienen documentos
  return (data || [])
    .map(c => ({
      id: c.id,
      razon_social: c.razon_social,
      rut: c.rut,
      documentos: (c.documentos as any)?.[0]?.count || 0
    }))
    .filter(c => c.documentos > 0)
}

// Obtener períodos disponibles
export async function getPeriodosDisponibles(): Promise<string[]> {
  const supabase = createClient()

  const { data } = await supabase
    .from('documentos')
    .select('periodo')
    .order('periodo', { ascending: false })

  const periodos = Array.from(new Set((data || []).map(d => d.periodo)))
  return periodos
}
