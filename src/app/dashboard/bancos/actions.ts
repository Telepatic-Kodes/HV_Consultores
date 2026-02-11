'use server'

// =============================================================================
// HV Consultores - Bank Module Server Actions
// Acciones del lado del servidor para gestion de cartolas bancarias
// Migrated from Supabase to Convex
// =============================================================================

import { ConvexHttpClient } from "convex/browser"
import { api } from "../../../../convex/_generated/api"
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

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!)
const DEMO_USER_ID = 'demo-user'

// ============================================================================
// TIPOS DE RESPUESTA
// ============================================================================

type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string }

// ============================================================================
// ESTADISTICAS DEL MODULO
// ============================================================================

export async function getBankModuleStats(): Promise<ActionResult<BankModuleStats>> {
  try {
    // TODO: cartolas_cuentas_bancarias, cartolas_transacciones, cartolas_jobs
    // are not yet fully migrated to Convex. Using Convex banks API where available.
    const stats = await convex.query(api.banks.getTransactionStats, {})

    return {
      success: true,
      data: {
        cuentas_activas: 0, // TODO: cartolas_cuentas_bancarias not in Convex yet
        transacciones_mes: stats?.total ?? 0,
        pendientes_categorizar: stats?.pendientes ?? 0,
        pendientes_conciliar: stats?.pendientes ?? 0,
        jobs_en_progreso: 0, // TODO: cartolas_jobs not in Convex yet
        ultimo_sync: undefined, // not available from getTransactionStats
      },
    }
  } catch (error) {
    console.error('Error getting bank module stats:', error)
    // Return mock data as fallback
    return {
      success: true,
      data: {
        cuentas_activas: 0,
        transacciones_mes: 0,
        pendientes_categorizar: 0,
        pendientes_conciliar: 0,
        jobs_en_progreso: 0,
        ultimo_sync: undefined,
      },
    }
  }
}

// ============================================================================
// CUENTAS BANCARIAS
// ============================================================================

// TODO: cartolas_cuentas_bancarias table not yet in Convex
export async function getBankAccounts(clienteId?: string): Promise<ActionResult<BankAccount[]>> {
  try {
    // Stub - cartolas_cuentas_bancarias not in Convex yet
    console.log('getBankAccounts (stub) for client:', clienteId)
    return { success: true, data: [] }
  } catch (error) {
    console.error('Error getting bank accounts:', error)
    return { success: false, error: 'Error al obtener cuentas bancarias' }
  }
}

// TODO: cartolas_cuentas_bancarias table not yet in Convex
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
    // Stub - cartolas_cuentas_bancarias not in Convex yet
    console.log('createBankAccount (stub):', input)
    return { success: false, error: 'Cuentas bancarias pendiente de migracion a Convex' }
  } catch (error) {
    console.error('Error creating bank account:', error)
    return { success: false, error: 'Error al crear cuenta bancaria' }
  }
}

// TODO: cartolas_cuentas_bancarias table not yet in Convex
export async function updateBankAccount(
  id: string,
  updates: {
    alias?: string
    credencial_id?: string
    activa?: boolean
  }
): Promise<ActionResult<BankAccount>> {
  try {
    // Stub - cartolas_cuentas_bancarias not in Convex yet
    console.log('updateBankAccount (stub):', id, updates)
    return { success: false, error: 'Cuentas bancarias pendiente de migracion a Convex' }
  } catch (error) {
    console.error('Error updating bank account:', error)
    return { success: false, error: 'Error al actualizar cuenta bancaria' }
  }
}

// TODO: cartolas_cuentas_bancarias table not yet in Convex
export async function deleteBankAccount(id: string): Promise<ActionResult> {
  try {
    // Stub - cartolas_cuentas_bancarias not in Convex yet
    console.log('deleteBankAccount (stub):', id)
    return { success: false, error: 'Cuentas bancarias pendiente de migracion a Convex' }
  } catch (error) {
    console.error('Error deleting bank account:', error)
    return { success: false, error: 'Error al eliminar cuenta bancaria' }
  }
}

// ============================================================================
// CARGA DE CARTOLAS
// ============================================================================

// TODO: Complex file upload + parsing flow - partially migrated
export async function uploadCartola(
  formData: FormData
): Promise<ActionResult<{ archivo_id: string; transacciones_count: number }>> {
  try {
    const file = formData.get('file') as File
    const cuentaId = formData.get('cuenta_id') as string
    const mes = parseInt(formData.get('mes') as string)
    const año = parseInt(formData.get('año') as string)

    if (!file || !cuentaId || !mes || !año) {
      return { success: false, error: 'Faltan parametros requeridos' }
    }

    // Read the file
    const buffer = Buffer.from(await file.arrayBuffer())

    // TODO: Need bank account info from Convex to determine bank code
    // For now, attempt to parse as generic
    // const parsed = await parseCartola(buffer, 'BANCO_ESTADO' as BankCode)

    // TODO: cartolas_archivos, cartolas_transacciones not yet in Convex
    // The full upload flow requires:
    // 1. Getting account info (cartolas_cuentas_bancarias)
    // 2. Parsing the cartola file
    // 3. Uploading to storage
    // 4. Creating archivo record (cartolas_archivos)
    // 5. Detecting duplicates
    // 6. Inserting transactions (cartolas_transacciones)
    // All these tables need to be migrated to Convex first

    console.log('uploadCartola (stub) - file upload pending Convex migration')
    return {
      success: false,
      error: 'Carga de cartolas pendiente de migracion completa a Convex',
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
    const page = filters.page || 1
    const pageSize = filters.pageSize || 50

    const data = await convex.query(api.banks.listTransactions, {
      clienteId: filters.cuenta_id as any,
      banco: filters.busqueda as any,
      fechaDesde: filters.fecha_desde,
      fechaHasta: filters.fecha_hasta,
      limit: pageSize,
    })

    return {
      success: true,
      data: {
        transacciones: (data || []).map((tx: any) => ({
          ...tx,
          id: tx._id ?? tx.id,
          created_at: tx._creationTime ? new Date(tx._creationTime).toISOString() : tx.created_at,
        })),
        total: data?.length ?? 0,
        page,
        pageSize,
      },
    }
  } catch (error) {
    console.error('Error getting transactions:', error)
    return {
      success: true,
      data: {
        transacciones: [],
        total: 0,
        page: filters.page || 1,
        pageSize: filters.pageSize || 50,
      },
    }
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
    const result = await convex.mutation(api.banks.updateTransaction, {
      id: id as any,
      ...updates,
    } as any)

    revalidatePath('/dashboard/bancos')
    return { success: true, data: result as any }
  } catch (error) {
    console.error('Error updating transaction:', error)
    return { success: false, error: 'Error al actualizar transaccion' }
  }
}

// ============================================================================
// CATEGORIZACION
// ============================================================================

// TODO: cartolas_categorias table not yet in Convex
export async function getCategories(): Promise<ActionResult<TransactionCategory[]>> {
  try {
    // Stub - cartolas_categorias not in Convex yet
    console.log('getCategories (stub)')
    return { success: true, data: [] }
  } catch (error) {
    console.error('Error getting categories:', error)
    return { success: false, error: 'Error al obtener categorias' }
  }
}

// TODO: cartolas_categorias, cartolas_reglas_categorizacion not yet in Convex
export async function categorizeTransactions(
  transactionIds: string[],
  clienteId?: string
): Promise<ActionResult<{ categorized: number; failed: number }>> {
  try {
    // Stub - categorization rules engine requires tables not yet in Convex
    console.log('categorizeTransactions (stub):', transactionIds.length, 'transactions')
    return {
      success: true,
      data: { categorized: 0, failed: transactionIds.length },
    }
  } catch (error) {
    console.error('Error categorizing transactions:', error)
    return { success: false, error: 'Error al categorizar transacciones' }
  }
}

// ============================================================================
// REGLAS DE CATEGORIZACION
// ============================================================================

// TODO: cartolas_reglas_categorizacion table not yet in Convex
export async function getCategorizationRules(
  clienteId?: string
): Promise<ActionResult<CategorizationRule[]>> {
  try {
    // Stub - cartolas_reglas_categorizacion not in Convex yet
    console.log('getCategorizationRules (stub) for client:', clienteId)
    return { success: true, data: [] }
  } catch (error) {
    console.error('Error getting categorization rules:', error)
    return { success: false, error: 'Error al obtener reglas' }
  }
}

// TODO: cartolas_reglas_categorizacion table not yet in Convex
export async function createCategorizationRule(
  input: Omit<CategorizationRule, 'id' | 'created_at' | 'updated_at' | 'veces_aplicada' | 'ultima_aplicacion'>
): Promise<ActionResult<CategorizationRule>> {
  try {
    // Stub - cartolas_reglas_categorizacion not in Convex yet
    console.log('createCategorizationRule (stub):', input)
    return { success: false, error: 'Reglas de categorizacion pendiente de migracion a Convex' }
  } catch (error) {
    console.error('Error creating categorization rule:', error)
    return { success: false, error: 'Error al crear regla' }
  }
}

// TODO: cartolas_reglas_categorizacion table not yet in Convex
export async function deleteCategorizationRule(id: string): Promise<ActionResult> {
  try {
    // Stub - cartolas_reglas_categorizacion not in Convex yet
    console.log('deleteCategorizationRule (stub):', id)
    return { success: false, error: 'Reglas de categorizacion pendiente de migracion a Convex' }
  } catch (error) {
    console.error('Error deleting categorization rule:', error)
    return { success: false, error: 'Error al eliminar regla' }
  }
}

// ============================================================================
// JOBS RPA
// ============================================================================

// TODO: cartolas_jobs table not yet in Convex
export async function getJobs(
  cuentaId?: string,
  status?: string
): Promise<ActionResult<CartolaJob[]>> {
  try {
    // Stub - cartolas_jobs not in Convex yet
    console.log('getJobs (stub) for account:', cuentaId, 'status:', status)
    return { success: true, data: [] }
  } catch (error) {
    console.error('Error getting jobs:', error)
    return { success: false, error: 'Error al obtener jobs' }
  }
}

// TODO: cartolas_jobs table not yet in Convex
export async function createDownloadJob(input: {
  cuenta_id: string
  mes: number
  año: number
}): Promise<ActionResult<CartolaJob>> {
  try {
    // Stub - cartolas_jobs not in Convex yet
    console.log('createDownloadJob (stub):', input)
    return { success: false, error: 'Jobs de descarga pendiente de migracion a Convex' }
  } catch (error) {
    console.error('Error creating download job:', error)
    return { success: false, error: 'Error al crear job de descarga' }
  }
}

// ============================================================================
// ARCHIVOS
// ============================================================================

// TODO: cartolas_archivos table not yet in Convex
export async function getCartolaFiles(
  cuentaId: string,
  año?: number
): Promise<ActionResult<CartolaFile[]>> {
  try {
    // Stub - cartolas_archivos not in Convex yet
    console.log('getCartolaFiles (stub) for account:', cuentaId, 'year:', año)
    return { success: true, data: [] }
  } catch (error) {
    console.error('Error getting cartola files:', error)
    return { success: false, error: 'Error al obtener archivos' }
  }
}
