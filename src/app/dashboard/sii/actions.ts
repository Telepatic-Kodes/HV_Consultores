'use server'

import { createClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'
import type {
  SiiJob,
  SiiJobCreateInput,
  SiiDashboardStats,
  SiiScheduledTask,
  SiiCredentialsInput,
  SiiTaskType,
} from '@/lib/sii-rpa/types'
import { encryptCredentials } from '@/lib/sii-rpa/encryption'
import { validarRut, formatRut } from '@/lib/sii-rpa/constants'

// ============================================================================
// HELPER: Get Current User
// ============================================================================

async function getCurrentUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}

// ============================================================================
// ESTADÍSTICAS
// ============================================================================

export async function getSiiStats(): Promise<SiiDashboardStats> {
  const supabase = await createClient()
  const user = await getCurrentUser()

  if (!user) {
    return {
      total_clientes_con_credenciales: 0,
      jobs_hoy: 0,
      jobs_exitosos_hoy: 0,
      jobs_fallidos_hoy: 0,
      jobs_pendientes: 0,
    }
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Obtener clientes con credenciales SII
  const { count: clientesCount } = await supabase
    .from('credenciales_portales')
    .select('*', { count: 'exact', head: true })
    .eq('portal', 'sii')
    .eq('activo', true)

  // Obtener jobs de hoy
  const { data: jobsHoy } = await supabase
    .from('sii_jobs')
    .select('status')
    .gte('created_at', today.toISOString())

  const stats: SiiDashboardStats = {
    total_clientes_con_credenciales: clientesCount || 0,
    jobs_hoy: jobsHoy?.length || 0,
    jobs_exitosos_hoy: jobsHoy?.filter((j) => j.status === 'completado').length || 0,
    jobs_fallidos_hoy: jobsHoy?.filter((j) => j.status === 'fallido').length || 0,
    jobs_pendientes: jobsHoy?.filter((j) => j.status === 'pendiente').length || 0,
  }

  // Obtener próxima tarea programada
  const { data: proximaTarea } = await supabase
    .from('sii_scheduled_tasks')
    .select(
      `
      *,
      cliente:clientes(nombre_razon_social)
    `
    )
    .eq('activo', true)
    .order('proxima_ejecucion', { ascending: true })
    .limit(1)
    .single()

  if (proximaTarea) {
    stats.proxima_tarea_programada = {
      cliente_nombre: (proximaTarea.cliente as { nombre_razon_social?: string })?.nombre_razon_social || 'N/A',
      task_type: proximaTarea.task_type as SiiTaskType,
      proxima_ejecucion: proximaTarea.proxima_ejecucion,
    }
  }

  return stats
}

// ============================================================================
// JOBS
// ============================================================================

export async function getJobsRecientes(limit: number = 15): Promise<SiiJob[]> {
  const supabase = await createClient()
  const user = await getCurrentUser()

  if (!user) return []

  const { data, error } = await supabase
    .from('sii_jobs')
    .select(
      `
      *,
      cliente:clientes(nombre_razon_social, rut)
    `
    )
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('[getJobsRecientes] Error:', error)
    return []
  }

  return data as SiiJob[]
}

export async function getJobById(jobId: string): Promise<SiiJob | null> {
  const supabase = await createClient()
  const user = await getCurrentUser()

  if (!user) return null

  const { data, error } = await supabase
    .from('sii_jobs')
    .select(
      `
      *,
      cliente:clientes(nombre_razon_social, rut),
      steps:sii_execution_steps(*)
    `
    )
    .eq('id', jobId)
    .single()

  if (error) {
    console.error('[getJobById] Error:', error)
    return null
  }

  return data as SiiJob
}

export async function createJob(input: SiiJobCreateInput): Promise<{
  success: boolean
  job?: SiiJob
  error?: string
}> {
  const supabase = await createClient()
  const user = await getCurrentUser()

  if (!user) {
    return { success: false, error: 'No autorizado' }
  }

  // Verificar que el cliente tiene credenciales activas
  const { data: credencial } = await supabase
    .from('credenciales_portales')
    .select('id')
    .eq('cliente_id', input.cliente_id)
    .eq('portal', 'sii')
    .eq('activo', true)
    .single()

  if (!credencial) {
    return { success: false, error: 'El cliente no tiene credenciales SII activas' }
  }

  const { data, error } = await supabase
    .from('sii_jobs')
    .insert({
      ...input,
      status: 'pendiente',
      archivos_descargados: [],
      screenshots: [],
      retry_count: 0,
      max_retries: 3,
    })
    .select()
    .single()

  if (error) {
    console.error('[createJob] Error:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard/sii')
  return { success: true, job: data as SiiJob }
}

export async function cancelJob(jobId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const user = await getCurrentUser()

  if (!user) {
    return { success: false, error: 'No autorizado' }
  }

  const { error } = await supabase
    .from('sii_jobs')
    .update({
      status: 'cancelado',
      completed_at: new Date().toISOString(),
    })
    .eq('id', jobId)
    .in('status', ['pendiente', 'ejecutando'])

  if (error) {
    console.error('[cancelJob] Error:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard/sii')
  return { success: true }
}

// ============================================================================
// CLIENTES
// ============================================================================

export async function getClientesConCredenciales(): Promise<
  Array<{
    id: string
    nombre: string
    rut: string
    credencial_id: string
    ultimo_login?: string
    validacion_exitosa: boolean
  }>
> {
  const supabase = await createClient()
  const user = await getCurrentUser()

  if (!user) return []

  const { data, error } = await supabase
    .from('credenciales_portales')
    .select(
      `
      id,
      cliente_id,
      ultimo_login_exitoso,
      validacion_exitosa,
      cliente:clientes(id, nombre_razon_social, rut)
    `
    )
    .eq('portal', 'sii')
    .eq('activo', true)

  if (error) {
    console.error('[getClientesConCredenciales] Error:', error)
    return []
  }

  return (data || []).map((item) => {
    const cliente = item.cliente as { id: string; nombre_razon_social: string; rut: string } | null
    return {
      id: cliente?.id || '',
      nombre: cliente?.nombre_razon_social || 'Sin nombre',
      rut: cliente?.rut || '',
      credencial_id: item.id,
      ultimo_login: item.ultimo_login_exitoso,
      validacion_exitosa: item.validacion_exitosa,
    }
  })
}

export async function getClientesSinCredenciales(): Promise<
  Array<{ id: string; nombre: string; rut: string }>
> {
  const supabase = await createClient()
  const user = await getCurrentUser()

  if (!user) return []

  // Obtener todos los clientes
  const { data: clientes } = await supabase
    .from('clientes')
    .select('id, nombre_razon_social, rut')

  // Obtener clientes con credenciales SII
  const { data: conCredenciales } = await supabase
    .from('credenciales_portales')
    .select('cliente_id')
    .eq('portal', 'sii')

  const clientesConCred = new Set(conCredenciales?.map((c) => c.cliente_id) || [])

  return (clientes || [])
    .filter((c) => !clientesConCred.has(c.id))
    .map((c) => ({
      id: c.id,
      nombre: c.nombre_razon_social,
      rut: c.rut,
    }))
}

// ============================================================================
// CREDENCIALES
// ============================================================================

export async function saveCredenciales(
  clienteId: string,
  credentials: SiiCredentialsInput
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const user = await getCurrentUser()

  if (!user) {
    return { success: false, error: 'No autorizado' }
  }

  // Validar RUT
  if (!validarRut(credentials.rut)) {
    return { success: false, error: 'RUT inválido' }
  }

  // Encriptar credenciales
  const encryptResult = encryptCredentials({
    password: credentials.password,
    certificadoBase64: credentials.certificado_base64,
    certificadoPassword: credentials.certificado_password,
  })

  if (!encryptResult.success || !encryptResult.encrypted) {
    return { success: false, error: encryptResult.error || 'Error al encriptar' }
  }

  // Verificar si ya existe una credencial para este cliente
  const { data: existente } = await supabase
    .from('credenciales_portales')
    .select('id')
    .eq('cliente_id', clienteId)
    .eq('portal', 'sii')
    .single()

  const credData = {
    cliente_id: clienteId,
    portal: 'sii',
    rut: formatRut(credentials.rut),
    rut_representante: credentials.rut_representante
      ? formatRut(credentials.rut_representante)
      : null,
    metodo_autenticacion: credentials.metodo_autenticacion,
    password_encriptado: encryptResult.encrypted.password_encriptado,
    certificado_archivo: encryptResult.encrypted.certificado_archivo_enc,
    certificado_password_enc: encryptResult.encrypted.certificado_password_enc,
    activo: true,
    validacion_exitosa: false,
    intentos_fallidos: 0,
  }

  let error
  if (existente) {
    const result = await supabase
      .from('credenciales_portales')
      .update(credData)
      .eq('id', existente.id)
    error = result.error
  } else {
    const result = await supabase.from('credenciales_portales').insert(credData)
    error = result.error
  }

  if (error) {
    console.error('[saveCredenciales] Error:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard/sii')
  return { success: true }
}

export async function deleteCredenciales(
  clienteId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const user = await getCurrentUser()

  if (!user) {
    return { success: false, error: 'No autorizado' }
  }

  const { error } = await supabase
    .from('credenciales_portales')
    .delete()
    .eq('cliente_id', clienteId)
    .eq('portal', 'sii')

  if (error) {
    console.error('[deleteCredenciales] Error:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard/sii')
  return { success: true }
}

export async function validarCredenciales(clienteId: string): Promise<{
  success: boolean
  error?: string
}> {
  const supabase = await createClient()
  const user = await getCurrentUser()

  if (!user) {
    return { success: false, error: 'No autorizado' }
  }

  // Crear job de validación
  const { data: job, error } = await supabase
    .from('sii_jobs')
    .insert({
      cliente_id: clienteId,
      task_type: 'login_test',
      status: 'pendiente',
      parametros: { validate_only: true },
      archivos_descargados: [],
      screenshots: [],
      retry_count: 0,
      max_retries: 1,
    })
    .select()
    .single()

  if (error) {
    console.error('[validarCredenciales] Error:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard/sii')
  return { success: true }
}

// ============================================================================
// TAREAS PROGRAMADAS
// ============================================================================

export async function getScheduledTasks(): Promise<SiiScheduledTask[]> {
  const supabase = await createClient()
  const user = await getCurrentUser()

  if (!user) return []

  const { data, error } = await supabase
    .from('sii_scheduled_tasks')
    .select(
      `
      *,
      cliente:clientes(nombre_razon_social, rut)
    `
    )
    .order('proxima_ejecucion', { ascending: true })

  if (error) {
    console.error('[getScheduledTasks] Error:', error)
    return []
  }

  return data as SiiScheduledTask[]
}

export async function createScheduledTask(input: {
  cliente_id: string
  task_type: SiiTaskType
  cron_expression: string
  descripcion?: string
  parametros?: Record<string, unknown>
}): Promise<{ success: boolean; task?: SiiScheduledTask; error?: string }> {
  const supabase = await createClient()
  const user = await getCurrentUser()

  if (!user) {
    return { success: false, error: 'No autorizado' }
  }

  // Calcular próxima ejecución (simplificado)
  const proxima = calcularProximaEjecucion(input.cron_expression)

  const { data, error } = await supabase
    .from('sii_scheduled_tasks')
    .insert({
      ...input,
      activo: true,
      proxima_ejecucion: proxima,
    })
    .select()
    .single()

  if (error) {
    console.error('[createScheduledTask] Error:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard/sii')
  return { success: true, task: data as SiiScheduledTask }
}

export async function toggleScheduledTask(
  taskId: string,
  activo: boolean
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const user = await getCurrentUser()

  if (!user) {
    return { success: false, error: 'No autorizado' }
  }

  const { error } = await supabase
    .from('sii_scheduled_tasks')
    .update({ activo })
    .eq('id', taskId)

  if (error) {
    console.error('[toggleScheduledTask] Error:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard/sii')
  return { success: true }
}

export async function deleteScheduledTask(
  taskId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const user = await getCurrentUser()

  if (!user) {
    return { success: false, error: 'No autorizado' }
  }

  const { error } = await supabase.from('sii_scheduled_tasks').delete().eq('id', taskId)

  if (error) {
    console.error('[deleteScheduledTask] Error:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard/sii')
  return { success: true }
}

// ============================================================================
// HELPERS
// ============================================================================

function calcularProximaEjecucion(cronExpression: string): string {
  // Parser simplificado de cron (minuto hora dia_mes mes dia_semana)
  const parts = cronExpression.split(' ')
  if (parts.length < 3) {
    return new Date(Date.now() + 86400000).toISOString() // Mañana por defecto
  }

  const [minuto, hora] = parts.map((p) => (p === '*' ? null : parseInt(p)))

  const ahora = new Date()
  const proxima = new Date(ahora)

  if (hora !== null) {
    proxima.setHours(hora)
  }
  if (minuto !== null) {
    proxima.setMinutes(minuto)
  }
  proxima.setSeconds(0)
  proxima.setMilliseconds(0)

  // Si ya pasó la hora hoy, programar para mañana
  if (proxima <= ahora) {
    proxima.setDate(proxima.getDate() + 1)
  }

  return proxima.toISOString()
}

// ============================================================================
// TAREAS RÁPIDAS
// ============================================================================

export async function ejecutarTareaRapida(
  clienteId: string,
  taskType: SiiTaskType,
  parametros?: Record<string, unknown>
): Promise<{ success: boolean; jobId?: string; error?: string }> {
  const result = await createJob({
    cliente_id: clienteId,
    task_type: taskType,
    parametros,
  })

  if (!result.success || !result.job) {
    return { success: false, error: result.error }
  }

  return { success: true, jobId: result.job.id }
}

// ============================================================================
// INTEGRACIÓN F29
// ============================================================================

export async function getF29CalculosAprobados(clienteId?: string): Promise<
  Array<{
    id: string
    cliente_id: string
    cliente_nombre: string
    cliente_rut: string
    periodo: string
    status: string
    total_debito_fiscal: number
    total_credito_fiscal: number
    ppm_determinado: number
    total_a_pagar: number
    remanente_actualizado: number
    aprobado_at: string | null
    enviado_sii_at: string | null
    folio_sii: string | null
  }>
> {
  const supabase = await createClient()
  const user = await getCurrentUser()

  if (!user) return []

  let query = supabase
    .from('f29_calculos')
    .select(
      `
      id,
      cliente_id,
      periodo,
      status,
      total_debito_fiscal,
      total_credito_fiscal,
      ppm_determinado,
      total_a_pagar,
      remanente_actualizado,
      aprobado_at,
      enviado_sii_at,
      folio_sii,
      cliente:clientes(nombre_razon_social, rut)
    `
    )
    .in('status', ['aprobado', 'validado'])
    .order('periodo', { ascending: false })

  if (clienteId) {
    query = query.eq('cliente_id', clienteId)
  }

  const { data, error } = await query

  if (error) {
    console.error('[getF29CalculosAprobados] Error:', error)
    return []
  }

  return (data || []).map((item) => {
    const cliente = item.cliente as { nombre_razon_social: string; rut: string } | null
    return {
      id: item.id,
      cliente_id: item.cliente_id,
      cliente_nombre: cliente?.nombre_razon_social || 'Sin nombre',
      cliente_rut: cliente?.rut || '',
      periodo: item.periodo,
      status: item.status,
      total_debito_fiscal: item.total_debito_fiscal || 0,
      total_credito_fiscal: item.total_credito_fiscal || 0,
      ppm_determinado: item.ppm_determinado || 0,
      total_a_pagar: item.total_a_pagar || 0,
      remanente_actualizado: item.remanente_actualizado || 0,
      aprobado_at: item.aprobado_at,
      enviado_sii_at: item.enviado_sii_at,
      folio_sii: item.folio_sii,
    }
  })
}

// ============================================================================
// SERVIDORES RPA
// ============================================================================

export async function getRpaServers(): Promise<
  Array<{
    id: string
    server_name: string
    server_url: string
    max_concurrent_jobs: number
    supported_tasks: string[]
    is_active: boolean
    last_heartbeat: string | null
    current_jobs: number
    total_jobs_executed: number
    success_rate: number
    avg_execution_time_ms: number | null
  }>
> {
  const supabase = await createClient()
  const user = await getCurrentUser()

  if (!user) return []

  const { data, error } = await supabase
    .from('sii_rpa_servers')
    .select('*')
    .order('server_name')

  if (error) {
    console.error('[getRpaServers] Error:', error)
    return []
  }

  return data || []
}

export async function updateServerHeartbeat(
  serverName: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('sii_rpa_servers')
    .update({
      last_heartbeat: new Date().toISOString(),
    })
    .eq('server_name', serverName)

  if (error) {
    console.error('[updateServerHeartbeat] Error:', error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

// ============================================================================
// SCHEDULER SERVICE
// ============================================================================

export async function processScheduledTasks(): Promise<{
  processed: number
  created: number
  errors: string[]
}> {
  const supabase = await createClient()
  const now = new Date()
  const errors: string[] = []
  let created = 0

  // Get tasks that are due
  const { data: dueTasks, error } = await supabase
    .from('sii_scheduled_tasks')
    .select('*')
    .eq('activo', true)
    .lte('proxima_ejecucion', now.toISOString())

  if (error) {
    console.error('[processScheduledTasks] Error fetching tasks:', error)
    return { processed: 0, created: 0, errors: [error.message] }
  }

  for (const task of dueTasks || []) {
    try {
      // Create job for this scheduled task
      const { data: job, error: jobError } = await supabase
        .from('sii_jobs')
        .insert({
          cliente_id: task.cliente_id,
          task_type: task.task_type,
          parametros: task.parametros || {},
          status: 'pendiente',
          archivos_descargados: [],
          screenshots: [],
          retry_count: 0,
          max_retries: 3,
        })
        .select()
        .single()

      if (jobError) {
        errors.push(`Task ${task.id}: ${jobError.message}`)
        continue
      }

      created++

      // Calculate next execution
      const { getNextExecution } = await import('@/lib/sii-rpa/scheduler')
      const nextExec = getNextExecution(task.cron_expression, now)

      // Update scheduled task
      await supabase
        .from('sii_scheduled_tasks')
        .update({
          ultima_ejecucion: now.toISOString(),
          proxima_ejecucion: nextExec?.toISOString() || null,
          ultimo_resultado: 'pending',
        })
        .eq('id', task.id)
    } catch (err) {
      errors.push(`Task ${task.id}: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  return {
    processed: dueTasks?.length || 0,
    created,
    errors,
  }
}

// ============================================================================
// RETRY FAILED JOBS
// ============================================================================

export async function retryFailedJobs(): Promise<{
  retried: number
  errors: string[]
}> {
  const supabase = await createClient()
  const errors: string[] = []
  let retried = 0

  // Get failed jobs that can be retried
  const { data: failedJobs, error } = await supabase
    .from('sii_jobs')
    .select('*')
    .eq('status', 'fallido')
    .lt('retry_count', 3) // Less than max retries
    .order('created_at', { ascending: true })
    .limit(10)

  if (error) {
    console.error('[retryFailedJobs] Error:', error)
    return { retried: 0, errors: [error.message] }
  }

  for (const job of failedJobs || []) {
    try {
      // Reset job status
      const { error: updateError } = await supabase
        .from('sii_jobs')
        .update({
          status: 'pendiente',
          retry_count: job.retry_count + 1,
          error_message: null,
        })
        .eq('id', job.id)

      if (updateError) {
        errors.push(`Job ${job.id}: ${updateError.message}`)
        continue
      }

      retried++
    } catch (err) {
      errors.push(`Job ${job.id}: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  return { retried, errors }
}

export async function createF29SubmitJob(f29CalculoId: string): Promise<{
  success: boolean
  jobId?: string
  error?: string
}> {
  const supabase = await createClient()
  const user = await getCurrentUser()

  if (!user) {
    return { success: false, error: 'No autorizado' }
  }

  // Obtener el F29 calculo con sus códigos
  const { data: f29Calculo, error: f29Error } = await supabase
    .from('f29_calculos')
    .select(
      `
      *,
      codigos:f29_codigos(codigo, monto_neto, monto_iva)
    `
    )
    .eq('id', f29CalculoId)
    .single()

  if (f29Error || !f29Calculo) {
    console.error('[createF29SubmitJob] Error fetching F29:', f29Error)
    return { success: false, error: 'F29 no encontrado' }
  }

  // Verificar que el F29 está aprobado
  if (f29Calculo.status !== 'aprobado' && f29Calculo.status !== 'validado') {
    return { success: false, error: 'El F29 debe estar aprobado para poder enviarlo al SII' }
  }

  // Verificar que no haya sido enviado ya
  if (f29Calculo.enviado_sii_at) {
    return { success: false, error: 'Este F29 ya fue enviado al SII' }
  }

  // Verificar credenciales del cliente
  const { data: credencial } = await supabase
    .from('credenciales_portales')
    .select('id')
    .eq('cliente_id', f29Calculo.cliente_id)
    .eq('portal', 'sii')
    .eq('activo', true)
    .single()

  if (!credencial) {
    return { success: false, error: 'El cliente no tiene credenciales SII activas' }
  }

  // Construir los códigos F29 para el job
  const codigosF29: Record<string, number> = {}
  const codigosArray = f29Calculo.codigos as Array<{ codigo: number; monto_neto: number; monto_iva: number }>

  for (const cod of codigosArray || []) {
    // Usar monto_iva si existe, si no monto_neto
    const monto = cod.monto_iva || cod.monto_neto || 0
    if (monto !== 0) {
      codigosF29[cod.codigo.toString()] = monto
    }
  }

  // Agregar los totales del cálculo principal
  if (f29Calculo.total_debito_fiscal) {
    codigosF29['89'] = f29Calculo.total_debito_fiscal
  }
  if (f29Calculo.total_credito_fiscal) {
    codigosF29['538'] = f29Calculo.total_credito_fiscal
  }
  if (f29Calculo.ppm_determinado) {
    codigosF29['30'] = f29Calculo.ppm_determinado
  }
  if (f29Calculo.remanente_anterior) {
    codigosF29['92'] = f29Calculo.remanente_anterior
  }

  // Crear el job de envío F29
  const { data: job, error: jobError } = await supabase
    .from('sii_jobs')
    .insert({
      cliente_id: f29Calculo.cliente_id,
      task_type: 'f29_submit',
      periodo: f29Calculo.periodo?.replace('-', '') || '',
      f29_calculo_id: f29CalculoId,
      codigos_f29: codigosF29,
      parametros: {
        tipo_declaracion: 'original',
        total_a_pagar: f29Calculo.total_a_pagar,
      },
      status: 'pendiente',
      archivos_descargados: [],
      screenshots: [],
      retry_count: 0,
      max_retries: 3,
    })
    .select()
    .single()

  if (jobError) {
    console.error('[createF29SubmitJob] Error creating job:', jobError)
    return { success: false, error: jobError.message }
  }

  // Crear registro en sii_f29_submissions
  await supabase.from('sii_f29_submissions').insert({
    f29_calculo_id: f29CalculoId,
    sii_job_id: job.id,
    periodo: f29Calculo.periodo?.replace('-', '') || '',
    tipo_declaracion: 'original',
    total_declarado: f29Calculo.total_a_pagar,
    total_a_pagar: f29Calculo.total_a_pagar,
    estado: 'pendiente',
  })

  revalidatePath('/dashboard/sii')
  revalidatePath('/dashboard/f29')
  return { success: true, jobId: job.id }
}
