// =============================================================================
// HV Consultores - Bank RPA Types
// Sistema de Cartolas Bancarias y Parametrización
// =============================================================================

// =============================================================================
// ENUMS Y CONSTANTES
// =============================================================================

export type BankCode = 'bancochile' | 'bancoestado' | 'santander' | 'bci'

export type AccountType = 'corriente' | 'vista' | 'ahorro' | 'credito'

export type Currency = 'CLP' | 'USD' | 'EUR' | 'UF'

export type TransactionType = 'cargo' | 'abono'

export type JobStatus =
  | 'pending'
  | 'queued'
  | 'running'
  | 'downloading'
  | 'parsing'
  | 'categorizing'
  | 'completed'
  | 'failed'
  | 'cancelled'

export type FileFormat = 'pdf' | 'excel' | 'csv' | 'ofx' | 'unknown'

export type FileSource = 'rpa' | 'manual' | 'api'

export type ReconciliationStatus =
  | 'pending'
  | 'matched'
  | 'partial'
  | 'unmatched'
  | 'manual'

// =============================================================================
// CUENTAS BANCARIAS
// =============================================================================

export interface BankAccount {
  id: string
  cliente_id: string
  banco: BankCode
  numero_cuenta: string
  tipo_cuenta: AccountType
  moneda: Currency
  alias?: string
  credencial_id?: string
  activa: boolean
  ultima_descarga?: string
  saldo_actual?: number
  created_at: string
  updated_at: string
}

export interface BankAccountWithClient extends BankAccount {
  cliente?: {
    id: string
    rut: string
    razon_social: string
  }
}

export interface CreateBankAccountInput {
  cliente_id: string
  banco: BankCode
  numero_cuenta: string
  tipo_cuenta: AccountType
  moneda?: Currency
  alias?: string
  credencial_id?: string
}

export interface UpdateBankAccountInput {
  alias?: string
  credencial_id?: string
  activa?: boolean
}

// =============================================================================
// JOBS DE DESCARGA/PROCESAMIENTO
// =============================================================================

export interface CartolaJob {
  id: string
  cuenta_id: string
  tipo: 'descarga' | 'procesamiento' | 'recategorizacion'
  estado: JobStatus
  fecha_inicio: string
  fecha_fin?: string
  mes_objetivo?: number // 1-12
  año_objetivo?: number
  fecha_desde?: string
  fecha_hasta?: string
  archivo_id?: string
  transacciones_procesadas: number
  transacciones_categorizadas: number
  error_mensaje?: string
  error_detalle?: Record<string, unknown>
  intentos: number
  proximo_reintento?: string
  created_at: string
  updated_at: string
}

export interface CreateJobInput {
  cuenta_id: string
  tipo: 'descarga' | 'procesamiento' | 'recategorizacion'
  mes_objetivo?: number
  año_objetivo?: number
  fecha_desde?: string
  fecha_hasta?: string
}

// =============================================================================
// ARCHIVOS DE CARTOLA
// =============================================================================

export interface CartolaFile {
  id: string
  cuenta_id: string
  job_id?: string
  nombre_archivo: string
  formato: FileFormat
  origen: FileSource
  storage_path: string
  tamaño_bytes: number
  hash_contenido: string
  mes: number
  año: number
  fecha_desde?: string
  fecha_hasta?: string
  procesado: boolean
  error_procesamiento?: string
  metadata?: Record<string, unknown>
  created_at: string
}

export interface UploadFileInput {
  cuenta_id: string
  file: File | Buffer
  filename: string
  mes: number
  año: number
}

// =============================================================================
// TRANSACCIONES
// =============================================================================

export interface BankTransaction {
  id: string
  cuenta_id: string
  cartola_archivo_id?: string
  fecha: string
  fecha_valor?: string
  descripcion: string
  descripcion_normalizada?: string
  referencia?: string
  monto: number
  tipo: TransactionType
  saldo?: number
  // Parametrización
  categoria_id?: string
  categoria_confianza?: number
  cuenta_contable?: string
  centro_costo?: string
  // Conciliación SII
  conciliado_sii: boolean
  documento_sii_id?: string
  estado_conciliacion: ReconciliationStatus
  // Metadata
  hash_transaccion: string
  metadata?: Record<string, unknown>
  created_at: string
}

export interface TransactionWithCategory extends BankTransaction {
  categoria?: TransactionCategory
}

export interface TransactionWithDetails extends TransactionWithCategory {
  cuenta?: BankAccount
  archivo?: CartolaFile
  documento_sii?: {
    id: string
    tipo: string
    folio: string
    rut_emisor: string
    razon_social_emisor: string
    monto_total: number
  }
}

export interface CreateTransactionInput {
  cuenta_id: string
  cartola_archivo_id?: string
  fecha: string
  fecha_valor?: string
  descripcion: string
  referencia?: string
  monto: number
  tipo: TransactionType
  saldo?: number
}

export interface UpdateTransactionInput {
  categoria_id?: string
  cuenta_contable?: string
  centro_costo?: string
  conciliado_sii?: boolean
  documento_sii_id?: string
  estado_conciliacion?: ReconciliationStatus
}

// =============================================================================
// CATEGORÍAS
// =============================================================================

export interface TransactionCategory {
  id: string
  codigo: string
  nombre: string
  descripcion?: string
  tipo_default?: TransactionType
  cuenta_contable_default?: string
  color?: string
  icono?: string
  orden: number
  activa: boolean
  created_at: string
}

export const DEFAULT_CATEGORIES: Omit<TransactionCategory, 'id' | 'created_at'>[] = [
  { codigo: 'VEN', nombre: 'Ventas/Ingresos', tipo_default: 'abono', color: '#22c55e', icono: 'TrendingUp', orden: 1, activa: true },
  { codigo: 'COM', nombre: 'Compras/Proveedores', tipo_default: 'cargo', color: '#ef4444', icono: 'ShoppingCart', orden: 2, activa: true },
  { codigo: 'REM', nombre: 'Sueldos/Remuneraciones', tipo_default: 'cargo', color: '#f59e0b', icono: 'Users', orden: 3, activa: true },
  { codigo: 'IMP', nombre: 'Impuestos', tipo_default: 'cargo', color: '#8b5cf6', icono: 'FileText', orden: 4, activa: true },
  { codigo: 'SER', nombre: 'Servicios Básicos', tipo_default: 'cargo', color: '#3b82f6', icono: 'Zap', orden: 5, activa: true },
  { codigo: 'FIN', nombre: 'Gastos Financieros', tipo_default: 'cargo', color: '#ec4899', icono: 'CreditCard', orden: 6, activa: true },
  { codigo: 'TRF', nombre: 'Transferencias Internas', tipo_default: undefined, color: '#6b7280', icono: 'ArrowLeftRight', orden: 7, activa: true },
  { codigo: 'OTR', nombre: 'Otros', tipo_default: undefined, color: '#a1a1aa', icono: 'MoreHorizontal', orden: 99, activa: true },
]

// =============================================================================
// REGLAS DE CATEGORIZACIÓN
// =============================================================================

export interface CategorizationRule {
  id: string
  cliente_id?: string // NULL = regla global
  nombre: string
  descripcion?: string
  categoria_id: string
  cuenta_contable?: string
  centro_costo?: string
  // Condiciones
  patron_descripcion?: string[] // Patrones regex
  palabras_clave?: string[] // Palabras exactas
  monto_min?: number
  monto_max?: number
  tipo_transaccion?: TransactionType
  banco?: BankCode
  // Configuración
  prioridad: number
  activa: boolean
  // Stats
  veces_aplicada: number
  ultima_aplicacion?: string
  created_at: string
  updated_at: string
}

export interface CreateRuleInput {
  cliente_id?: string
  nombre: string
  descripcion?: string
  categoria_id: string
  cuenta_contable?: string
  centro_costo?: string
  patron_descripcion?: string[]
  palabras_clave?: string[]
  monto_min?: number
  monto_max?: number
  tipo_transaccion?: TransactionType
  banco?: BankCode
  prioridad?: number
}

export interface RuleMatchResult {
  rule_id: string
  rule_name: string
  categoria_id: string
  cuenta_contable?: string
  confianza: number
  match_reason: string
}

// =============================================================================
// PLAN DE CUENTAS
// =============================================================================

export interface ChartOfAccountsMapping {
  id: string
  cliente_id?: string
  categoria_id: string
  cuenta_contable: string
  nombre_cuenta: string
  tipo_cuenta: 'activo' | 'pasivo' | 'patrimonio' | 'ingreso' | 'gasto'
  centro_costo_default?: string
  activa: boolean
  created_at: string
}

export interface CreateAccountMappingInput {
  cliente_id?: string
  categoria_id: string
  cuenta_contable: string
  nombre_cuenta: string
  tipo_cuenta: 'activo' | 'pasivo' | 'patrimonio' | 'ingreso' | 'gasto'
  centro_costo_default?: string
}

// =============================================================================
// CONCILIACIÓN SII
// =============================================================================

export interface SIIReconciliation {
  id: string
  transaccion_id: string
  documento_sii_id?: string
  tipo_documento?: string // factura, boleta, nc, nd
  folio_documento?: string
  rut_contraparte?: string
  nombre_contraparte?: string
  monto_documento?: number
  fecha_documento?: string
  estado: ReconciliationStatus
  confianza_match?: number
  diferencia_monto?: number
  diferencia_dias?: number
  match_manual: boolean
  notas?: string
  created_at: string
  updated_at: string
}

export interface ReconciliationSummary {
  total_transacciones: number
  matched: number
  partial: number
  unmatched: number
  pending: number
  monto_conciliado: number
  monto_pendiente: number
}

// =============================================================================
// PARSING Y NORMALIZACIÓN
// =============================================================================

export interface RawTransaction {
  fecha: string
  fecha_valor?: string
  descripcion: string
  referencia?: string
  cargo?: number
  abono?: number
  saldo?: number
  linea_original?: string
}

export interface ParsedCartola {
  banco: BankCode
  numero_cuenta: string
  tipo_cuenta?: AccountType
  moneda: Currency
  periodo: {
    mes: number
    año: number
    fecha_desde: string
    fecha_hasta: string
  }
  saldo_inicial?: number
  saldo_final?: number
  total_cargos: number
  total_abonos: number
  transacciones: RawTransaction[]
  metadata?: {
    paginas?: number
    formato_detectado?: string
    warnings?: string[]
  }
}

export interface ParserOptions {
  banco?: BankCode
  formato?: FileFormat
  encoding?: string
  skipRows?: number
  dateFormat?: string
}

// =============================================================================
// RPA ESPECÍFICO PARA BANCOS
// =============================================================================

export interface BankCredentials {
  rut: string
  password: string
  token_serial?: string // Para dispositivos de token
  email_otp?: string // Email para recibir OTP
  phone_otp?: string // Teléfono para recibir OTP
}

export interface BankRPATask {
  id: string
  tipo: 'descarga_cartola' | 'consulta_saldo' | 'descarga_comprobantes'
  cuenta_id: string
  credencial_id: string
  estado: JobStatus
  parametros: {
    mes?: number
    año?: number
    fecha_desde?: string
    fecha_hasta?: string
  }
  resultado?: {
    archivos_descargados?: string[]
    saldo_actual?: number
    transacciones_count?: number
  }
  screenshots?: string[]
  logs?: string[]
  created_at: string
  updated_at: string
}

export interface BankLoginResult {
  success: boolean
  requires_otp: boolean
  otp_method?: 'sms' | 'email' | 'token' | 'app'
  session_timeout?: number // segundos
  error?: string
}

export interface BankDownloadResult {
  success: boolean
  files: Array<{
    path: string
    format: FileFormat
    size_bytes: number
    periodo: { mes: number; año: number }
  }>
  error?: string
}

// =============================================================================
// ESTADÍSTICAS Y REPORTES
// =============================================================================

export interface BankAccountStats {
  cuenta_id: string
  mes: number
  año: number
  total_transacciones: number
  total_cargos: number
  total_abonos: number
  monto_cargos: number
  monto_abonos: number
  saldo_inicio: number
  saldo_fin: number
  transacciones_categorizadas: number
  transacciones_conciliadas: number
}

export interface CategoryDistribution {
  categoria_id: string
  categoria_nombre: string
  cantidad: number
  monto_total: number
  porcentaje: number
}

export interface MonthlyTrend {
  mes: number
  año: number
  ingresos: number
  egresos: number
  saldo_final: number
}

// =============================================================================
// API RESPONSES
// =============================================================================

export interface BankModuleStats {
  cuentas_activas: number
  transacciones_mes: number
  pendientes_categorizar: number
  pendientes_conciliar: number
  jobs_en_progreso: number
  ultimo_sync?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

export interface TransactionFilters {
  cuenta_id?: string
  cliente_id?: string
  fecha_desde?: string
  fecha_hasta?: string
  tipo?: TransactionType
  categoria_id?: string
  estado_conciliacion?: ReconciliationStatus
  monto_min?: number
  monto_max?: number
  busqueda?: string
  solo_sin_categorizar?: boolean
  solo_sin_conciliar?: boolean
}

// =============================================================================
// EXPORTS TIPO PARA DB
// =============================================================================

export type DBBankAccount = BankAccount
export type DBCartolaJob = CartolaJob
export type DBCartolaFile = CartolaFile
export type DBTransaction = BankTransaction
export type DBCategory = TransactionCategory
export type DBRule = CategorizationRule
export type DBReconciliation = SIIReconciliation
