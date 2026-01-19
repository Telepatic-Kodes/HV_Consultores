// SII RPA Types
// HV Consultores - Sistema de automatización para portal SII

// ============================================================================
// ENUMS
// ============================================================================

export type SiiTaskType =
  | 'login_test'
  | 'f29_submit'
  | 'f29_download'
  | 'libro_compras'
  | 'libro_ventas'
  | 'situacion_tributaria'
  | 'certificate_download'

export type SiiAuthMethod =
  | 'rut_clave'
  | 'clave_unica'
  | 'certificado_digital'

export type SiiJobStatus =
  | 'pendiente'
  | 'ejecutando'
  | 'completado'
  | 'fallido'
  | 'cancelado'

export type SiiStepStatus =
  | 'pending'
  | 'running'
  | 'success'
  | 'failed'
  | 'skipped'

// ============================================================================
// CREDENTIALS
// ============================================================================

export interface SiiCredentials {
  id: string
  cliente_id: string
  portal: 'sii'
  metodo_autenticacion: SiiAuthMethod
  rut: string
  rut_representante?: string
  // Encrypted fields (never exposed to frontend)
  usuario_encriptado?: string
  password_encriptado?: string
  certificado_archivo?: string
  certificado_password_enc?: string
  // Status
  activo: boolean
  validacion_exitosa: boolean
  ultimo_login_exitoso?: string
  intentos_fallidos: number
  bloqueado_hasta?: string
  ultima_validacion?: string
  created_at: string
}

export interface SiiCredentialsInput {
  rut: string
  password: string
  metodo_autenticacion: SiiAuthMethod
  rut_representante?: string
  certificado_base64?: string
  certificado_password?: string
}

export interface CredentialValidationResult {
  valid: boolean
  auth_method: SiiAuthMethod
  rut: string
  razon_social?: string
  error?: string
  error_code?: string
}

// ============================================================================
// JOBS
// ============================================================================

export interface SiiJob {
  id: string
  bot_job_id?: string
  cliente_id: string
  task_type: SiiTaskType
  periodo?: string
  parametros: Record<string, unknown>
  f29_calculo_id?: string
  codigos_f29?: Record<string, number>
  status: SiiJobStatus
  execution_server?: string
  browser_session_id?: string
  started_at?: string
  completed_at?: string
  archivos_descargados: string[]
  datos_extraidos?: Record<string, unknown>
  error_message?: string
  screenshots: SiiScreenshot[]
  retry_count: number
  max_retries: number
  created_at: string
  updated_at: string
}

export interface SiiJobCreateInput {
  cliente_id: string
  task_type: SiiTaskType
  periodo?: string
  parametros?: Record<string, unknown>
  f29_calculo_id?: string
  codigos_f29?: Record<string, number>
}

export interface SiiScreenshot {
  step: string
  path: string
  timestamp: string
}

// ============================================================================
// EXECUTION STEPS
// ============================================================================

export interface SiiExecutionStep {
  id: string
  sii_job_id: string
  step_number: number
  step_name: string
  step_description?: string
  status: SiiStepStatus
  started_at?: string
  completed_at?: string
  duration_ms?: number
  input_data?: Record<string, unknown>
  output_data?: Record<string, unknown>
  screenshot_path?: string
  error_code?: string
  error_message?: string
  retry_count: number
  created_at: string
}

// ============================================================================
// SITUACION TRIBUTARIA
// ============================================================================

export interface SiiSituacionTributaria {
  id: string
  cliente_id: string
  rut: string
  razon_social?: string
  nombre_fantasia?: string
  inicio_actividades?: string
  termino_giro?: string
  actividades_economicas?: ActividadEconomica[]
  facturador_electronico: boolean
  fecha_certificacion_dte?: string
  contribuyente_iva: boolean
  tasa_ppm_vigente?: number
  declaraciones_pendientes?: DeclaracionPendiente[]
  mora_tributaria: boolean
  monto_deuda?: number
  html_raw?: string
  consultado_at: string
  valido_hasta?: string
  created_at: string
  updated_at: string
}

export interface ActividadEconomica {
  codigo: string
  descripcion: string
  afecta_iva: boolean
  fecha_inicio?: string
}

export interface DeclaracionPendiente {
  tipo: string
  periodo: string
  fecha_vencimiento: string
}

// ============================================================================
// F29 SUBMISSIONS
// ============================================================================

export interface SiiF29Submission {
  id: string
  f29_calculo_id: string
  sii_job_id?: string
  periodo: string
  tipo_declaracion: 'original' | 'rectificatoria'
  numero_rectificatoria?: number
  folio_sii?: string
  fecha_presentacion?: string
  numero_comprobante?: string
  comprobante_pdf_path?: string
  xml_path?: string
  total_declarado?: number
  total_a_pagar?: number
  remanente_periodo_siguiente?: number
  estado: 'pendiente' | 'enviado' | 'aceptado' | 'rechazado'
  observaciones_sii?: string
  created_at: string
  updated_at: string
}

// ============================================================================
// LIBROS
// ============================================================================

export interface SiiLibroDownload {
  id: string
  cliente_id: string
  sii_job_id?: string
  tipo_libro: 'compras' | 'ventas'
  periodo: string
  archivo_csv_path?: string
  archivo_xml_path?: string
  archivo_pdf_path?: string
  total_documentos?: number
  monto_neto_total?: number
  monto_iva_total?: number
  monto_total?: number
  fecha_descarga: string
  hash_archivo?: string
  created_at: string
}

// ============================================================================
// RPA SERVER
// ============================================================================

export interface SiiRpaServer {
  id: string
  server_name: string
  server_url: string
  api_key_hash: string
  max_concurrent_jobs: number
  supported_tasks: SiiTaskType[]
  is_active: boolean
  last_heartbeat?: string
  current_jobs: number
  total_jobs_executed: number
  success_rate: number
  avg_execution_time_ms?: number
  created_at: string
  updated_at: string
}

// ============================================================================
// SCHEDULED TASKS
// ============================================================================

export interface SiiScheduledTask {
  id: string
  cliente_id: string
  task_type: SiiTaskType
  cron_expression: string
  descripcion?: string
  parametros: Record<string, unknown>
  activo: boolean
  ultima_ejecucion?: string
  proxima_ejecucion?: string
  ultimo_resultado?: string
  ultimo_error?: string
  created_at: string
  updated_at: string
}

export interface SiiScheduledTaskInput {
  cliente_id: string
  task_type: SiiTaskType
  cron_expression: string
  descripcion?: string
  parametros?: Record<string, unknown>
}

// ============================================================================
// STATISTICS
// ============================================================================

export interface SiiJobStats {
  total_jobs: number
  successful_jobs: number
  failed_jobs: number
  pending_jobs: number
  success_rate: number
  avg_duration_seconds: number
}

export interface SiiDashboardStats {
  total_clientes_con_credenciales: number
  jobs_hoy: number
  jobs_exitosos_hoy: number
  jobs_fallidos_hoy: number
  jobs_pendientes: number
  proxima_tarea_programada?: {
    cliente_nombre: string
    task_type: SiiTaskType
    proxima_ejecucion: string
  }
}

// ============================================================================
// API RESPONSES
// ============================================================================

export interface SiiExecuteResponse {
  success: boolean
  job_id?: string
  error?: string
  error_code?: string
}

export interface SiiStatusResponse {
  job_id: string
  status: SiiJobStatus
  progress: number
  current_step?: string
  steps?: SiiExecutionStep[]
  results?: {
    files?: string[]
    data?: Record<string, unknown>
  }
  error?: string
}

export interface SiiWebhookPayload {
  job_id: string
  event: 'started' | 'step_completed' | 'completed' | 'failed'
  data?: Record<string, unknown>
  screenshot_base64?: string
  timestamp: string
  server_name: string
}

// ============================================================================
// RPA TASK CONTEXT
// ============================================================================

export interface RpaTaskContext {
  jobId: string
  clienteId: string
  credentials: {
    rut: string
    password: string
    authMethod: SiiAuthMethod
    rutRepresentante?: string
    certificatePath?: string
    certificatePassword?: string
  }
  params: Record<string, unknown>
}

export interface RpaTaskResult {
  success: boolean
  data?: Record<string, unknown>
  files?: Array<{
    type: string
    path: string
    size: number
  }>
  error?: {
    code: string
    message: string
    step?: string
  }
  screenshots: SiiScreenshot[]
  duration_ms: number
}

// ============================================================================
// TASK-SPECIFIC PARAMS
// ============================================================================

export interface F29SubmitParams {
  f29_calculo_id: string
  codigos: Record<string, number>
  tipo_declaracion: 'original' | 'rectificatoria'
}

export interface LibroDownloadParams {
  periodo: string
  formato: 'csv' | 'xml' | 'pdf'
}

export interface SituacionTributariaParams {
  rut: string
  force_refresh?: boolean
}

export interface CertificateDownloadParams {
  tipo_certificado: 'situacion_tributaria' | 'deuda' | 'iva' | 'renta'
}
