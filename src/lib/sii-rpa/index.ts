// SII RPA Module
// HV Consultores - Automatización del Portal SII
// Entry point para todas las funcionalidades

// ============================================================================
// TYPES
// ============================================================================

export type {
  // Enums como tipos
  SiiTaskType,
  SiiAuthMethod,
  SiiJobStatus,
  SiiStepStatus,
  // Credenciales
  SiiCredentials,
  SiiCredentialsInput,
  CredentialValidationResult,
  // Jobs
  SiiJob,
  SiiJobCreateInput,
  SiiScreenshot,
  // Pasos de ejecución
  SiiExecutionStep,
  // Situación tributaria
  SiiSituacionTributaria,
  ActividadEconomica,
  DeclaracionPendiente,
  // F29
  SiiF29Submission,
  // Libros
  SiiLibroDownload,
  // Servidor RPA
  SiiRpaServer,
  // Tareas programadas
  SiiScheduledTask,
  SiiScheduledTaskInput,
  // Estadísticas
  SiiJobStats,
  SiiDashboardStats,
  // API
  SiiExecuteResponse,
  SiiStatusResponse,
  SiiWebhookPayload,
  // Contexto RPA
  RpaTaskContext,
  RpaTaskResult,
  // Parámetros específicos
  F29SubmitParams,
  LibroDownloadParams,
  SituacionTributariaParams,
  CertificateDownloadParams,
} from './types'

// ============================================================================
// CONSTANTS
// ============================================================================

export {
  SII_URLS,
  SII_SELECTORS,
  SII_CONFIG,
  SII_ERRORS,
  SII_PATTERNS,
  F29_CODIGOS,
  ACTIVIDADES_IVA,
  // Helper functions
  formatRut,
  parseRut,
  validarRut,
  formatPeriodo,
  parsePeriodo,
  formatMonto,
} from './constants'

// ============================================================================
// ENCRYPTION
// ============================================================================

export {
  encrypt,
  decrypt,
  encryptCredentials,
  decryptCredentials,
  generateEncryptionKey,
  isValidEncryptedData,
  secureWipe,
  generateHash,
  encryptInBrowser,
} from './encryption'

export type {
  EncryptedData,
  EncryptionResult,
  DecryptionResult,
  CredentialEncryptionInput,
  EncryptedCredentials,
} from './encryption'

// ============================================================================
// QUEUE HANDLER
// ============================================================================

export {
  SiiQueueHandler,
  createSiiJob,
  updateJobStatus,
  getJobById,
  getJobsForCliente,
  addExecutionStep,
  updateExecutionStep,
} from './queue-handler'

// ============================================================================
// RESULT PARSER
// ============================================================================

export {
  parseSituacionTributaria,
  parseLibroCompras,
  parseLibroVentas,
  parseF29Response,
  parseCertificadoResponse,
  extractErrorFromPage,
} from './result-parser'

// ============================================================================
// F29 MAPPER
// ============================================================================

export {
  F29_CODIGO_MAPPING,
  F29_CODIGOS_ADICIONALES,
  getCodigoMapping,
  getCodigosBySeccion,
  getEditableCodigos,
  getRequiredCodigos,
  mapCodigosToFormFields,
  validateRequiredCodigos,
  calcularIVADeterminado,
  calcularTotalAPagar,
  calcularRemanente,
  generateCodigosResumen,
  parsePeriodo as parseF29Periodo,
  formatPeriodoDisplay,
} from './f29-mapper'

export type {
  F29CodigoMapping,
  F29FormData,
  F29SubmissionResult,
} from './f29-mapper'

// ============================================================================
// SCHEDULER
// ============================================================================

export {
  parseCronExpression,
  getNextExecution,
  matchesCron,
  describeCron,
  validateCronExpression,
  CRON_PRESETS,
} from './scheduler'

export type { CronParts } from './scheduler'

// ============================================================================
// ALERTS
// ============================================================================

export {
  sendAlert,
  loadAlertConfig,
  createJobFailedAlert,
  createServerDownAlert,
  createServerRecoveredAlert,
  createInvalidCredentialsAlert,
  createConsecutiveFailuresAlert,
} from './alerts'

export type {
  AlertSeverity,
  AlertType,
  AlertPayload,
  AlertConfig,
} from './alerts'
