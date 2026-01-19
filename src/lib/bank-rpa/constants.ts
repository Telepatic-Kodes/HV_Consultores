// =============================================================================
// HV Consultores - Bank RPA Constants
// URLs, Selectores y Configuración por Banco
// =============================================================================

import type { BankCode, AccountType, Currency, FileFormat } from './types'

// =============================================================================
// INFORMACIÓN DE BANCOS
// =============================================================================

export interface BankInfo {
  code: BankCode
  name: string
  shortName: string
  color: string
  logo?: string
  requiresToken: boolean
  otpMethods: ('sms' | 'email' | 'token' | 'app')[]
  sessionTimeout: number // segundos
  maxConcurrentSessions: number
  supportsMultipleAccounts: boolean
  downloadFormats: FileFormat[]
}

export const BANKS: Record<BankCode, BankInfo> = {
  bancochile: {
    code: 'bancochile',
    name: 'Banco de Chile',
    shortName: 'Chile',
    color: '#004B93',
    requiresToken: true,
    otpMethods: ['token', 'app', 'sms'],
    sessionTimeout: 300, // 5 minutos
    maxConcurrentSessions: 1,
    supportsMultipleAccounts: true,
    downloadFormats: ['pdf', 'excel'],
  },
  bancoestado: {
    code: 'bancoestado',
    name: 'Banco Estado',
    shortName: 'Estado',
    color: '#00843D',
    requiresToken: false,
    otpMethods: ['sms', 'email'],
    sessionTimeout: 600, // 10 minutos
    maxConcurrentSessions: 1,
    supportsMultipleAccounts: true,
    downloadFormats: ['pdf', 'csv'],
  },
  santander: {
    code: 'santander',
    name: 'Banco Santander',
    shortName: 'Santander',
    color: '#EC0000',
    requiresToken: true,
    otpMethods: ['token', 'sms', 'app'],
    sessionTimeout: 300,
    maxConcurrentSessions: 1,
    supportsMultipleAccounts: true,
    downloadFormats: ['pdf', 'excel', 'ofx'],
  },
  bci: {
    code: 'bci',
    name: 'Banco de Crédito e Inversiones',
    shortName: 'BCI',
    color: '#003366',
    requiresToken: true,
    otpMethods: ['token', 'app'],
    sessionTimeout: 300,
    maxConcurrentSessions: 1,
    supportsMultipleAccounts: true,
    downloadFormats: ['pdf', 'excel'],
  },
}

// =============================================================================
// URLS POR BANCO
// =============================================================================

export interface BankUrls {
  base: string
  login: string
  loginEmpresas: string
  cartolas: string
  saldos: string
  comprobantes?: string
  transferencias?: string
}

export const BANK_URLS: Record<BankCode, BankUrls> = {
  bancochile: {
    base: 'https://www.bancochile.cl',
    login: 'https://portalpersonas.bancochile.cl/mibancochile/login',
    loginEmpresas: 'https://portalemp.bancochile.cl/empresas',
    cartolas: 'https://portalemp.bancochile.cl/empresas/cartola',
    saldos: 'https://portalemp.bancochile.cl/empresas/saldos',
    comprobantes: 'https://portalemp.bancochile.cl/empresas/comprobantes',
  },
  bancoestado: {
    base: 'https://www.bancoestado.cl',
    login: 'https://www.bancoestado.cl/imagenes/_personas/login/index.asp',
    loginEmpresas: 'https://empresas.bancoestado.cl/login',
    cartolas: 'https://empresas.bancoestado.cl/cartolas',
    saldos: 'https://empresas.bancoestado.cl/saldos',
  },
  santander: {
    base: 'https://www.santander.cl',
    login: 'https://www.santander.cl/personas/acceso-clientes',
    loginEmpresas: 'https://empresas.santander.cl/login',
    cartolas: 'https://empresas.santander.cl/cartolas',
    saldos: 'https://empresas.santander.cl/cuentas/saldos',
    comprobantes: 'https://empresas.santander.cl/comprobantes',
  },
  bci: {
    base: 'https://www.bci.cl',
    login: 'https://www.bci.cl/personas/ingresar',
    loginEmpresas: 'https://empresas.bci.cl/login',
    cartolas: 'https://empresas.bci.cl/cuentas/cartolas',
    saldos: 'https://empresas.bci.cl/cuentas/saldos',
  },
}

// =============================================================================
// SELECTORES DOM POR BANCO
// =============================================================================

export interface BankSelectors {
  // Login
  rutInput: string
  passwordInput: string
  loginButton: string
  otpInput?: string
  otpSubmit?: string
  tokenInput?: string

  // Post-login
  loadingIndicator?: string
  errorMessage?: string
  sessionExpiredModal?: string

  // Navegación
  menuCuentas?: string
  menuCartolas?: string
  menuComprobantes?: string

  // Cartolas
  accountSelector?: string
  periodSelector?: string
  monthSelector?: string
  yearSelector?: string
  dateFromInput?: string
  dateToInput?: string
  searchButton?: string
  downloadButton?: string
  downloadPdfButton?: string
  downloadExcelButton?: string

  // Tabla de movimientos
  transactionsTable?: string
  transactionRow?: string
  noDataMessage?: string

  // Logout
  userMenu?: string
  logoutButton?: string
}

export const BANK_SELECTORS: Record<BankCode, BankSelectors> = {
  bancochile: {
    // Login
    rutInput: '#rut',
    passwordInput: '#pass',
    loginButton: '#btnIngresar',
    otpInput: '#otp',
    otpSubmit: '#btnValidarOtp',
    tokenInput: '#token',

    // Post-login
    loadingIndicator: '.loading-spinner, .loader',
    errorMessage: '.alert-danger, .error-message',
    sessionExpiredModal: '#sessionExpiredModal',

    // Navegación
    menuCuentas: '[data-menu="cuentas"]',
    menuCartolas: 'a[href*="cartola"], [data-menu="cartolas"]',

    // Cartolas
    accountSelector: '#selectCuenta, select[name="cuenta"]',
    monthSelector: '#selectMes, select[name="mes"]',
    yearSelector: '#selectAnio, select[name="anio"]',
    searchButton: '#btnBuscar, button[type="submit"]',
    downloadButton: '#btnDescargar',
    downloadPdfButton: '#btnDescargaPdf, a[href*="pdf"]',
    downloadExcelButton: '#btnDescargaExcel, a[href*="excel"]',

    // Tabla
    transactionsTable: '.table-movimientos, #tablaMovimientos',
    transactionRow: 'tbody tr',

    // Logout
    userMenu: '#menuUsuario, .user-dropdown',
    logoutButton: '#btnSalir, a[href*="logout"]',
  },

  bancoestado: {
    // Login
    rutInput: '#txtRut, input[name="rut"]',
    passwordInput: '#txtClave, input[name="password"]',
    loginButton: '#btnIngresar, button.btn-login',
    otpInput: '#txtCodigoSMS',
    otpSubmit: '#btnValidar',

    // Post-login
    loadingIndicator: '.cargando, .spinner',
    errorMessage: '.mensaje-error, .alerta',

    // Navegación
    menuCuentas: 'a[href*="cuentas"]',
    menuCartolas: 'a[href*="cartola"]',

    // Cartolas
    accountSelector: '#cmbCuenta, select[name="numeroCuenta"]',
    dateFromInput: '#txtFechaDesde, input[name="fechaDesde"]',
    dateToInput: '#txtFechaHasta, input[name="fechaHasta"]',
    searchButton: '#btnConsultar',
    downloadButton: '#btnExportar',
    downloadPdfButton: '#btnPdf',

    // Tabla
    transactionsTable: '#grillaMovimientos, .tabla-cartola',
    transactionRow: 'tr.movimiento',
    noDataMessage: '.sin-movimientos',

    // Logout
    logoutButton: '#lnkSalir, a.cerrar-sesion',
  },

  santander: {
    // Login
    rutInput: '#rut, input[placeholder*="RUT"]',
    passwordInput: '#clave, input[type="password"]',
    loginButton: '.btn-ingresar, button[type="submit"]',
    tokenInput: '#token, input[name="coordenadas"]',
    otpInput: '#otp',

    // Post-login
    loadingIndicator: '.loading, .sk-spinner',
    errorMessage: '.error, .mensaje-alerta',
    sessionExpiredModal: '.modal-sesion-expirada',

    // Navegación
    menuCuentas: '.menu-cuentas a',
    menuCartolas: 'a[href*="cartola"], .menu-cartolas',

    // Cartolas
    accountSelector: '#selectAccount, .selector-cuenta select',
    monthSelector: '#mes',
    yearSelector: '#anio',
    dateFromInput: '#fechaInicio',
    dateToInput: '#fechaFin',
    searchButton: '#btnBuscar',
    downloadPdfButton: '.btn-pdf, a[title*="PDF"]',
    downloadExcelButton: '.btn-excel, a[title*="Excel"]',

    // Tabla
    transactionsTable: '.tabla-movimientos',
    transactionRow: 'tbody tr',

    // Logout
    userMenu: '.usuario-menu',
    logoutButton: '.btn-logout, a[href*="logout"]',
  },

  bci: {
    // Login
    rutInput: '#rut, input[id*="rut"]',
    passwordInput: '#password, input[id*="password"]',
    loginButton: '#loginButton, button.login-btn',
    tokenInput: '#tokenInput, input[name="token"]',

    // Post-login
    loadingIndicator: '.loading-overlay, .spinner-border',
    errorMessage: '.alert-error, .error-login',

    // Navegación
    menuCuentas: '[data-nav="cuentas"]',
    menuCartolas: '[data-nav="cartolas"], a[href*="cartola"]',

    // Cartolas
    accountSelector: '#cuenta, select.cuenta-selector',
    monthSelector: '#periodo-mes',
    yearSelector: '#periodo-anio',
    searchButton: '#buscar, .btn-buscar',
    downloadButton: '.btn-descarga',
    downloadPdfButton: '.descarga-pdf',
    downloadExcelButton: '.descarga-excel',

    // Tabla
    transactionsTable: '.movements-table, #movimientos',
    transactionRow: 'tr.movement-row',

    // Logout
    userMenu: '.user-profile',
    logoutButton: '.logout-link, #cerrarSesion',
  },
}

// =============================================================================
// CONFIGURACIÓN DE ANTI-DETECCIÓN
// =============================================================================

export interface AntiDetectionConfig {
  minDelay: number
  maxDelay: number
  mouseMovements: boolean
  randomScrolls: boolean
  randomTypingSpeed: boolean
  userAgentRotation: boolean
}

export const ANTI_DETECTION_CONFIG: AntiDetectionConfig = {
  minDelay: 500,
  maxDelay: 2000,
  mouseMovements: true,
  randomScrolls: true,
  randomTypingSpeed: true,
  userAgentRotation: false, // Los bancos pueden detectar cambios de UA
}

export const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
]

// =============================================================================
// FORMATOS DE FECHA POR BANCO
// =============================================================================

export const BANK_DATE_FORMATS: Record<BankCode, { input: string; output: string }> = {
  bancochile: { input: 'DD/MM/YYYY', output: 'DD/MM/YYYY' },
  bancoestado: { input: 'DD-MM-YYYY', output: 'DD/MM/YYYY' },
  santander: { input: 'DD/MM/YYYY', output: 'DD/MM/YYYY' },
  bci: { input: 'YYYY-MM-DD', output: 'DD/MM/YYYY' },
}

// =============================================================================
// PATRONES REGEX PARA PARSING
// =============================================================================

export const TRANSACTION_PATTERNS = {
  // Patrones comunes en descripciones
  TRANSFER_OUT: /^(?:TRANSF|TEF|TRANS)\s+(?:A|HACIA)\s+(.+)/i,
  TRANSFER_IN: /^(?:TRANSF|TEF|TRANS)\s+(?:DE|DESDE)\s+(.+)/i,
  PAC: /^PAC\s+(.+)/i, // Pago Automático de Cuentas
  PAT: /^PAT\s+(.+)/i, // Pago Automático de Tarjetas
  CHEQUE: /^(?:CHEQUE|CHQ)\s*[#N°]?\s*(\d+)/i,
  COMISION: /^(?:COMISI[OÓ]N|COM\.?)\s+(.+)/i,
  INTERES: /^(?:INTER[EÉ]S|INT\.?)\s+(.+)/i,
  IMPUESTO: /^(?:IMPUESTO|IMP\.?|IVA)\s+(.+)/i,
  SUELDO: /^(?:SUELDO|REMUNERACI[OÓ]N|REM\.?)\s+(.+)/i,
  DIVIDENDO: /^(?:DIVIDENDO|DIV\.?)\s+(.+)/i,

  // Extracción de RUT
  RUT: /(\d{1,2}\.?\d{3}\.?\d{3}[-]?[0-9Kk])/,

  // Extracción de fechas en descripción
  DATE_DMY: /(\d{2}[\/\-]\d{2}[\/\-]\d{2,4})/,

  // Números de documento
  DOC_NUMBER: /[N°#]?\s*(\d{5,12})/,
}

// =============================================================================
// MAPEO DE TIPOS DE CUENTA
// =============================================================================

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  corriente: 'Cuenta Corriente',
  vista: 'Cuenta Vista',
  ahorro: 'Cuenta de Ahorro',
  credito: 'Línea de Crédito',
}

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  CLP: '$',
  USD: 'US$',
  EUR: '€',
  UF: 'UF',
}

// =============================================================================
// TIMEOUTS Y REINTENTOS
// =============================================================================

export const RPA_TIMEOUTS = {
  pageLoad: 30000, // 30 segundos
  elementWait: 10000, // 10 segundos
  downloadWait: 60000, // 1 minuto
  loginWait: 15000, // 15 segundos
  otpWait: 120000, // 2 minutos para OTP
  sessionCheck: 5000, // 5 segundos
}

export const RETRY_CONFIG = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 30000,
  backoffMultiplier: 2,
  retryableErrors: [
    'ETIMEDOUT',
    'ECONNRESET',
    'ECONNREFUSED',
    'NetworkError',
    'TimeoutError',
  ],
}

// =============================================================================
// CATEGORIZACIÓN POR DEFECTO
// =============================================================================

export const DEFAULT_CATEGORY_KEYWORDS: Record<string, string[]> = {
  VEN: ['venta', 'ingreso', 'deposito cliente', 'pago recibido', 'abono factura'],
  COM: ['compra', 'proveedor', 'pago a', 'transferencia a'],
  REM: ['sueldo', 'remuneracion', 'afp', 'isapre', 'fonasa', 'previred', 'cotizacion'],
  IMP: ['impuesto', 'sii', 'iva', 'ppm', 'f29', 'tesoreria'],
  SER: ['luz', 'agua', 'gas', 'telefono', 'internet', 'enel', 'aguas', 'entel', 'movistar', 'vtr'],
  FIN: ['interes', 'comision', 'mantenc', 'cargo bancario', 'seguros'],
  TRF: ['traspaso', 'entre cuentas', 'transferencia propia'],
}

// =============================================================================
// MESES EN ESPAÑOL
// =============================================================================

export const MONTHS_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

export const MONTHS_ES_SHORT = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
]

// =============================================================================
// STORAGE PATHS
// =============================================================================

export const STORAGE_BUCKETS = {
  cartolas: 'cartolas',
  comprobantes: 'comprobantes-bancarios',
  screenshots: 'rpa-screenshots',
}

export const getCartolaPath = (
  clienteId: string,
  banco: BankCode,
  año: number,
  mes: number,
  filename: string
): string => {
  return `${clienteId}/${banco}/${año}/${String(mes).padStart(2, '0')}/${filename}`
}

// =============================================================================
// EXPORTS
// =============================================================================

export const getBankInfo = (code: BankCode): BankInfo => BANKS[code]
export const getBankUrls = (code: BankCode): BankUrls => BANK_URLS[code]
export const getBankSelectors = (code: BankCode): BankSelectors => BANK_SELECTORS[code]
export const getDateFormat = (code: BankCode) => BANK_DATE_FORMATS[code]

export const ALL_BANK_CODES: BankCode[] = ['bancochile', 'bancoestado', 'santander', 'bci']
