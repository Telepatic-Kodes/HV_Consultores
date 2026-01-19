// =============================================================================
// HV Consultores - Bank RPA Module
// Exportaciones centralizadas
// =============================================================================

// Types
export * from './types'

// Constants
export * from './constants'

// Parsers
export * from './parsers'

// Normalizer
export * from './normalizer'

// Re-export principales para uso rápido
export {
  type BankCode,
  type AccountType,
  type Currency,
  type TransactionType,
  type JobStatus,
  type FileFormat,
  type FileSource,
  type ReconciliationStatus,
  type BankAccount,
  type CartolaJob,
  type CartolaFile,
  type BankTransaction,
  type TransactionCategory,
  type CategorizationRule,
  type ParsedCartola,
  type RawTransaction,
  DEFAULT_CATEGORIES,
} from './types'

export {
  BANKS,
  BANK_URLS,
  BANK_SELECTORS,
  BANK_DATE_FORMATS,
  TRANSACTION_PATTERNS,
  DEFAULT_CATEGORY_KEYWORDS,
  RPA_TIMEOUTS,
  RETRY_CONFIG,
  STORAGE_BUCKETS,
  MONTHS_ES,
  MONTHS_ES_SHORT,
  ALL_BANK_CODES,
  getBankInfo,
  getBankUrls,
  getBankSelectors,
  getDateFormat,
  getCartolaPath,
} from './constants'

// Parsers
export {
  parseCartola,
  parseBankPDF,
  parseBankExcel,
  parseBankCSV,
  detectFormat,
  isFormatSupported,
  SUPPORTED_FORMATS,
} from './parsers'

// Normalizer
export {
  normalizeTransactions,
  normalizeDescription,
  createNormalizer,
  detectDuplicates,
} from './normalizer'

// Categorization
export * from './categorization'
export {
  CategorizationRulesEngine,
  createRulesEngine,
  createRuleFromTransaction,
  suggestRules,
} from './categorization'

// Reconciliation
export * from './reconciliation'
export {
  SIIMatcher,
  createSIIMatcher,
  filterDocumentsByPeriod,
  groupDocumentsByRut,
  createReconciliationRecord,
} from './reconciliation'
