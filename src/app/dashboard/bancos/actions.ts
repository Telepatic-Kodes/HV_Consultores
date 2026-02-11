// @ts-nocheck — temporary: remove after full migration
'use server'

// =============================================================================
// HV Consultores - Bank Module Server Actions
// Acciones del lado del servidor para gestión de cartolas bancarias
// =============================================================================

import { createClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'
import type {
  BankCode,
  BankAccount,
  CartolaJob,
  CartolaFile,
  BankTransaction,
  TransactionCategory,
  CategorizationRule,
  TransactionFilters,
  BankModuleStats,
  AccountType,
  Currency,
} from '@/lib/bank-rpa'
import {
  parseCartola,
  normalizeTransactions,
  detectDuplicates,
  createRulesEngine,
  createSIIMatcher,
} from '@/lib/bank-rpa'

// ============================================================================
// TIPOS DE RESPUESTA
// ============================================================================

type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string }

// ============================================================================
// ESTADÍSTICAS DEL MÓDULO
// ============================================================================

export async function getBankModuleStats(): Promise<ActionResult<BankModuleStats>> {
  try {
    const supabase = await createClient()

    // Cuentas activas
    const { count: cuentasActivas } = await (supabase as any)
      .from('cartolas_cuentas_bancarias')
      .select('*', { count: 'exact', head: true })
      .eq('activa', true)

    // Transacciones del mes actual
    const inicioMes = new Date()
    inicioMes.setDate(1)
    inicioMes.setHours(0, 0, 0, 0)

    const { count: transaccionesMes } = await (supabase as any)
      .from('cartolas_transacciones')
      .select('*', { count: 'exact', head: true })
      .gte('fecha', inicioMes.toISOString())

    // Pendientes de categorizar
    const { count: pendientesCategorizar } = await (supabase as any)
      .from('cartolas_transacciones')
      .select('*', { count: 'exact', head: true })
      .is('categoria_id', null)

    // Pendientes de conciliar
    const { count: pendientesConciliar } = await (supabase as any)
      .from('cartolas_transacciones')
      .select('*', { count: 'exact', head: true })
      .eq('estado_conciliacion', 'pending')

    // Jobs en progreso
    const { count: jobsEnProgreso } = await (supabase as any)
      .from('cartolas_jobs')
      .select('*', { count: 'exact', head: true })
      .in('estado', ['pending', 'running', 'downloading', 'parsing'])

    // Último sync
    const { data: ultimoJobData } = await (supabase as any)
      .from('cartolas_jobs')
      .select('fecha_fin')
      .eq('estado', 'completed')
      .order('fecha_fin', { ascending: false })
      .limit(1)
      .single()

    const ultimoJob = ultimoJobData as { fecha_fin?: string } | null

    return {
      success: true,
      data: {
        cuentas_activas: cuentasActivas || 0,
        transacciones_mes: transaccionesMes || 0,
        pendientes_categorizar: pendientesCategorizar || 0,
        pendientes_conciliar: pendientesConciliar || 0,
        jobs_en_progreso: jobsEnProgreso || 0,
        ultimo_sync: ultimoJob?.fecha_fin,
      },
    }
  } catch (error) {
    console.error('Error getting bank module stats:', error)
    return { success: false, error: 'Error al obtener estadísticas' }
  }
}

// ============================================================================
// CUENTAS BANCARIAS
// ============================================================================

export async function getBankAccounts(clienteId?: string): Promise<ActionResult<BankAccount[]>> {
  try {
    const supabase = await createClient()

    let query = supabase
      .from('cartolas_cuentas_bancarias')
      .select('*')
      .order('created_at', { ascending: false })

    if (clienteId) {
      query = query.eq('cliente_id', clienteId)
    }

    const { data, error } = await query

    if (error) throw error

    return { success: true, data: data || [] }
  } catch (error) {
    console.error('Error getting bank accounts:', error)
    return { success: false, error: 'Error al obtener cuentas bancarias' }
  }
}

export async function createBankAccount(input: {
  cliente_id: string
  banco: BankCode
  numero_cuenta: string
  tipo_cuenta: AccountType
  moneda?: Currency
  alias?: string
  credencial_id?: string
}): Promise<ActionResult<BankAccount>> {
  try {
    const supabase = await createClient()

    const { data, error } = await (supabase as any)
      .from('cartolas_cuentas_bancarias')
      .insert({
        cliente_id: input.cliente_id,
        banco: input.banco,
        numero_cuenta: input.numero_cuenta,
        tipo_cuenta: input.tipo_cuenta,
        moneda: input.moneda || 'CLP',
        alias: input.alias,
        credencial_id: input.credencial_id,
        activa: true,
      })
      .select()
      .single()

    if (error) throw error

    revalidatePath('/dashboard/bancos')
    return { success: true, data }
  } catch (error) {
    console.error('Error creating bank account:', error)
    return { success: false, error: 'Error al crear cuenta bancaria' }
  }
}

export async function updateBankAccount(
  id: string,
  updates: {
    alias?: string
    credencial_id?: string
    activa?: boolean
  }
): Promise<ActionResult<BankAccount>> {
  try {
    const supabase = await createClient()

    const { data, error } = await (supabase as any)
      .from('cartolas_cuentas_bancarias')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    revalidatePath('/dashboard/bancos')
    return { success: true, data }
  } catch (error) {
    console.error('Error updating bank account:', error)
    return { success: false, error: 'Error al actualizar cuenta bancaria' }
  }
}

export async function deleteBankAccount(id: string): Promise<ActionResult> {
  try {
    const supabase = await createClient()

    const { error } = await (supabase as any)
      .from('cartolas_cuentas_bancarias')
      .delete()
      .eq('id', id)

    if (error) throw error

    revalidatePath('/dashboard/bancos')
    return { success: true, data: undefined }
  } catch (error) {
    console.error('Error deleting bank account:', error)
    return { success: false, error: 'Error al eliminar cuenta bancaria' }
  }
}

// ============================================================================
// CARGA DE CARTOLAS
// ============================================================================

export async function uploadCartola(
  formData: FormData
): Promise<ActionResult<{ archivo_id: string; transacciones_count: number }>> {
  try {
    const supabase = await createClient()

    const file = formData.get('file') as File
    const cuentaId = formData.get('cuenta_id') as string
    const mes = parseInt(formData.get('mes') as string)
    const año = parseInt(formData.get('año') as string)

    if (!file || !cuentaId || !mes || !año) {
      return { success: false, error: 'Faltan parámetros requeridos' }
    }

    // Obtener información de la cuenta
    const { data: cuenta, error: cuentaError } = await (supabase as any)
      .from('cartolas_cuentas_bancarias')
      .select('*')
      .eq('id', cuentaId)
      .single()

    if (cuentaError || !cuenta) {
      return { success: false, error: 'Cuenta no encontrada' }
    }

    // Leer el archivo
    const buffer = Buffer.from(await file.arrayBuffer())

    // Parsear la cartola
    const parsed = await parseCartola(buffer, cuenta.banco as BankCode)

    // Subir archivo a storage
    const fileName = `${cuenta.cliente_id}/${cuenta.banco}/${año}/${mes.toString().padStart(2, '0')}/${file.name}`

    const { error: uploadError } = await (supabase as any).storage
      .from('cartolas')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: true,
      })

    if (uploadError) {
      console.error('Error uploading file:', uploadError)
      // Continue anyway, the parsing was successful
    }

    // Crear registro de archivo
    const { data: archivo, error: archivoError } = await (supabase as any)
      .from('cartolas_archivos')
      .insert({
        cuenta_id: cuentaId,
        nombre_archivo: file.name,
        formato: parsed.metadata?.formato_detectado || 'pdf',
        origen: 'manual',
        storage_path: fileName,
        tamaño_bytes: buffer.length,
        mes,
        año,
        fecha_desde: parsed.periodo.fecha_desde,
        fecha_hasta: parsed.periodo.fecha_hasta,
        procesado: true,
        fecha_procesamiento: new Date().toISOString(),
        total_transacciones: parsed.transacciones.length,
        saldo_inicial: parsed.saldo_inicial,
        saldo_final: parsed.saldo_final,
        total_cargos: parsed.total_cargos,
        total_abonos: parsed.total_abonos,
      })
      .select()
      .single()

    if (archivoError) throw archivoError

    // Normalizar transacciones
    const normalizedTx = normalizeTransactions(
      parsed.transacciones,
      cuenta.banco as BankCode,
      cuentaId,
      archivo.id
    )

    // Obtener hashes existentes para detectar duplicados
    const { data: existingHashes } = await (supabase as any)
      .from('cartolas_transacciones')
      .select('hash_transaccion')
      .eq('cuenta_id', cuentaId)

    const hashSet = new Set<string>(existingHashes?.map((h: { hash_transaccion: string }) => h.hash_transaccion) || [])
    const { unique, duplicates } = detectDuplicates(normalizedTx, hashSet)

    // Insertar transacciones únicas
    if (unique.length > 0) {
      const { error: txError } = await (supabase as any)
        .from('cartolas_transacciones')
        .insert(unique)

      if (txError) {
        console.error('Error inserting transactions:', txError)
      }
    }

    // Actualizar última descarga de la cuenta
    await (supabase as any)
      .from('cartolas_cuentas_bancarias')
      .update({ ultima_descarga: new Date().toISOString() })
      .eq('id', cuentaId)

    revalidatePath('/dashboard/bancos')

    return {
      success: true,
      data: {
        archivo_id: archivo.id,
        transacciones_count: unique.length,
      },
    }
  } catch (error) {
    console.error('Error uploading cartola:', error)
    return { success: false, error: 'Error al procesar la cartola' }
  }
}

// ============================================================================
// TRANSACCIONES
// ============================================================================

export async function getTransactions(
  filters: TransactionFilters & { page?: number; pageSize?: number }
): Promise<
  ActionResult<{
    transacciones: BankTransaction[]
    total: number
    page: number
    pageSize: number
  }>
> {
  try {
    const supabase = await createClient()

    const page = filters.page || 1
    const pageSize = filters.pageSize || 50
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    let query = supabase
      .from('cartolas_transacciones')
      .select('*', { count: 'exact' })

    // Aplicar filtros
    if (filters.cuenta_id) {
      query = query.eq('cuenta_id', filters.cuenta_id)
    }
    if (filters.fecha_desde) {
      query = query.gte('fecha', filters.fecha_desde)
    }
    if (filters.fecha_hasta) {
      query = query.lte('fecha', filters.fecha_hasta)
    }
    if (filters.tipo) {
      query = query.eq('tipo', filters.tipo)
    }
    if (filters.categoria_id) {
      query = query.eq('categoria_id', filters.categoria_id)
    }
    if (filters.estado_conciliacion) {
      query = query.eq('estado_conciliacion', filters.estado_conciliacion)
    }
    if (filters.solo_sin_categorizar) {
      query = query.is('categoria_id', null)
    }
    if (filters.solo_sin_conciliar) {
      query = query.eq('conciliado_sii', false)
    }
    if (filters.monto_min) {
      query = query.gte('monto', filters.monto_min)
    }
    if (filters.monto_max) {
      query = query.lte('monto', filters.monto_max)
    }
    if (filters.busqueda) {
      query = query.ilike('descripcion', `%${filters.busqueda}%`)
    }

    // Ordenar y paginar
    query = query.order('fecha', { ascending: false }).range(from, to)

    const { data, error, count } = await query

    if (error) throw error

    return {
      success: true,
      data: {
        transacciones: data || [],
        total: count || 0,
        page,
        pageSize,
      },
    }
  } catch (error) {
    console.error('Error getting transactions:', error)
    return { success: false, error: 'Error al obtener transacciones' }
  }
}

export async function updateTransaction(
  id: string,
  updates: {
    categoria_id?: string
    cuenta_contable?: string
    centro_costo?: string
    categorizado_manual?: boolean
  }
): Promise<ActionResult<BankTransaction>> {
  try {
    const supabase = await createClient()

    const { data, error } = await (supabase as any)
      .from('cartolas_transacciones')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    revalidatePath('/dashboard/bancos')
    return { success: true, data }
  } catch (error) {
    console.error('Error updating transaction:', error)
    return { success: false, error: 'Error al actualizar transacción' }
  }
}

// ============================================================================
// CATEGORIZACIÓN
// ============================================================================

export async function getCategories(): Promise<ActionResult<TransactionCategory[]>> {
  try {
    const supabase = await createClient()

    const { data, error } = await (supabase as any)
      .from('cartolas_categorias')
      .select('*')
      .eq('activa', true)
      .order('orden')

    if (error) throw error

    return { success: true, data: data || [] }
  } catch (error) {
    console.error('Error getting categories:', error)
    return { success: false, error: 'Error al obtener categorías' }
  }
}

export async function categorizeTransactions(
  transactionIds: string[],
  clienteId?: string
): Promise<ActionResult<{ categorized: number; failed: number }>> {
  try {
    const supabase = await createClient()

    // Obtener transacciones
    const { data: transactions, error: txError } = await (supabase as any)
      .from('cartolas_transacciones')
      .select('*')
      .in('id', transactionIds)
      .is('categoria_id', null)

    if (txError) throw txError
    if (!transactions || transactions.length === 0) {
      return { success: true, data: { categorized: 0, failed: 0 } }
    }

    // Obtener categorías
    const { data: categories } = await (supabase as any)
      .from('cartolas_categorias')
      .select('*')
      .eq('activa', true)

    // Obtener reglas
    let rulesQuery = supabase
      .from('cartolas_reglas_categorizacion')
      .select('*')
      .eq('activa', true)

    if (clienteId) {
      rulesQuery = rulesQuery.or(`cliente_id.is.null,cliente_id.eq.${clienteId}`)
    } else {
      rulesQuery = rulesQuery.is('cliente_id', null)
    }

    const { data: rules } = await rulesQuery

    // Crear motor de reglas
    const engine = createRulesEngine()
    engine.loadCategories(categories || [])
    engine.loadRules(rules || [])

    // Categorizar
    let categorized = 0
    let failed = 0

    for (const tx of transactions) {
      const result = engine.categorize(tx as BankTransaction, clienteId)

      if (result) {
        const { error: updateError } = await (supabase as any)
          .from('cartolas_transacciones')
          .update({
            categoria_id: result.categoria_id,
            categoria_confianza: result.confianza,
            cuenta_contable: result.cuenta_contable,
            categorizado_manual: false,
          })
          .eq('id', tx.id)

        if (updateError) {
          failed++
        } else {
          categorized++
        }
      } else {
        failed++
      }
    }

    revalidatePath('/dashboard/bancos')

    return {
      success: true,
      data: { categorized, failed },
    }
  } catch (error) {
    console.error('Error categorizing transactions:', error)
    return { success: false, error: 'Error al categorizar transacciones' }
  }
}

// ============================================================================
// REGLAS DE CATEGORIZACIÓN
// ============================================================================

export async function getCategorizationRules(
  clienteId?: string
): Promise<ActionResult<CategorizationRule[]>> {
  try {
    const supabase = await createClient()

    let query = supabase
      .from('cartolas_reglas_categorizacion')
      .select('*')
      .order('prioridad')

    if (clienteId) {
      query = query.or(`cliente_id.is.null,cliente_id.eq.${clienteId}`)
    }

    const { data, error } = await query

    if (error) throw error

    return { success: true, data: data || [] }
  } catch (error) {
    console.error('Error getting categorization rules:', error)
    return { success: false, error: 'Error al obtener reglas' }
  }
}

export async function createCategorizationRule(
  input: Omit<CategorizationRule, 'id' | 'created_at' | 'updated_at' | 'veces_aplicada' | 'ultima_aplicacion'>
): Promise<ActionResult<CategorizationRule>> {
  try {
    const supabase = await createClient()

    const { data, error } = await (supabase as any)
      .from('cartolas_reglas_categorizacion')
      .insert({
        ...input,
        veces_aplicada: 0,
      })
      .select()
      .single()

    if (error) throw error

    revalidatePath('/dashboard/bancos')
    return { success: true, data }
  } catch (error) {
    console.error('Error creating categorization rule:', error)
    return { success: false, error: 'Error al crear regla' }
  }
}

export async function deleteCategorizationRule(id: string): Promise<ActionResult> {
  try {
    const supabase = await createClient()

    const { error } = await (supabase as any)
      .from('cartolas_reglas_categorizacion')
      .delete()
      .eq('id', id)

    if (error) throw error

    revalidatePath('/dashboard/bancos')
    return { success: true, data: undefined }
  } catch (error) {
    console.error('Error deleting categorization rule:', error)
    return { success: false, error: 'Error al eliminar regla' }
  }
}

// ============================================================================
// JOBS RPA
// ============================================================================

export async function getJobs(
  cuentaId?: string,
  status?: string
): Promise<ActionResult<CartolaJob[]>> {
  try {
    const supabase = await createClient()

    let query = supabase
      .from('cartolas_jobs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)

    if (cuentaId) {
      query = query.eq('cuenta_id', cuentaId)
    }
    if (status) {
      query = query.eq('estado', status)
    }

    const { data, error } = await query

    if (error) throw error

    return { success: true, data: data || [] }
  } catch (error) {
    console.error('Error getting jobs:', error)
    return { success: false, error: 'Error al obtener jobs' }
  }
}

export async function createDownloadJob(input: {
  cuenta_id: string
  mes: number
  año: number
}): Promise<ActionResult<CartolaJob>> {
  try {
    const supabase = await createClient()

    const { data, error } = await (supabase as any)
      .from('cartolas_jobs')
      .insert({
        cuenta_id: input.cuenta_id,
        tipo: 'descarga',
        estado: 'pending',
        mes_objetivo: input.mes,
        año_objetivo: input.año,
        intentos: 0,
      })
      .select()
      .single()

    if (error) throw error

    revalidatePath('/dashboard/bancos')
    return { success: true, data }
  } catch (error) {
    console.error('Error creating download job:', error)
    return { success: false, error: 'Error al crear job de descarga' }
  }
}

// ============================================================================
// ARCHIVOS
// ============================================================================

export async function getCartolaFiles(
  cuentaId: string,
  año?: number
): Promise<ActionResult<CartolaFile[]>> {
  try {
    const supabase = await createClient()

    let query = supabase
      .from('cartolas_archivos')
      .select('*')
      .eq('cuenta_id', cuentaId)
      .order('año', { ascending: false })
      .order('mes', { ascending: false })

    if (año) {
      query = query.eq('año', año)
    }

    const { data, error } = await query

    if (error) throw error

    return { success: true, data: data || [] }
  } catch (error) {
    console.error('Error getting cartola files:', error)
    return { success: false, error: 'Error al obtener archivos' }
  }
}
