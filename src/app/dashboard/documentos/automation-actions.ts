// @ts-nocheck — temporary: remove after full migration
'use server'

import { createClient } from '@/lib/supabase-server'
import type { Database } from '@/types/database.types'

async function getCurrentUser() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

function getSupabase() {
  return createClient()
}

// =============================================================================
// AUTOMATION RULES - CRUD Operations
// =============================================================================

export async function obtenerReglas(clienteId: string) {
  const user = await getCurrentUser()
  if (!user) throw new Error('No authenticated user')

  const { data, error } = await getSupabase()
    .from('automation_rules')
    .select('*')
    .eq('cliente_id', clienteId)
    .order('nombre')

  if (error) throw error
  return data
}

export async function crearRegla(
  clienteId: string,
  datos: {
    nombre: string
    descripcion?: string
    tipo_trigger: string
    condicion_dias_antes?: number
    acciones: string[]
    frecuencia?: string
    dia_semana?: number
    dia_mes?: number
    hora?: string
  }
) {
  const user = await getCurrentUser()
  if (!user) throw new Error('No authenticated user')

  const { data, error } = await getSupabase()
    .from('automation_rules')
    .insert([
      {
        cliente_id: clienteId,
        creada_por: user.id,
        ...datos,
      },
    ])
    .select()

  if (error) throw error
  return { id: data?.[0]?.id }
}

export async function actualizarRegla(
  reglaId: string,
  datos: Partial<{
    nombre: string
    descripcion: string
    tipo_trigger: string
    condicion_dias_antes: number
    acciones: string[]
    frecuencia: string
    dia_semana: number
    dia_mes: number
    hora: string
    activa: boolean
  }>
) {
  const user = await getCurrentUser()
  if (!user) throw new Error('No authenticated user')

  const { error } = await getSupabase()
    .from('automation_rules')
    .update(datos)
    .eq('id', reglaId)

  if (error) throw error
}

export async function eliminarRegla(reglaId: string) {
  const user = await getCurrentUser()
  if (!user) throw new Error('No authenticated user')

  const { error } = await getSupabase()
    .from('automation_rules')
    .delete()
    .eq('id', reglaId)

  if (error) throw error
}

export async function alternarRegla(reglaId: string, activa: boolean) {
  const user = await getCurrentUser()
  if (!user) throw new Error('No authenticated user')

  const { error } = await getSupabase()
    .from('automation_rules')
    .update({ activa })
    .eq('id', reglaId)

  if (error) throw error
}

export async function toggleRegla(reglaId: string) {
  const user = await getCurrentUser()
  if (!user) throw new Error('No authenticated user')

  // Obtener el estado actual
  const { data: regla, error: fetchError } = await getSupabase()
    .from('automation_rules')
    .select('activa')
    .eq('id', reglaId)
    .single()

  if (fetchError) throw fetchError

  // Alternar el estado
  const { error } = await getSupabase()
    .from('automation_rules')
    .update({ activa: !regla.activa })
    .eq('id', reglaId)

  if (error) throw error
}

// =============================================================================
// AUTOMATION EXECUTION - Trigger & History
// =============================================================================

export async function ejecutarReglaManualmente(reglaId: string) {
  const user = await getCurrentUser()
  if (!user) throw new Error('No authenticated user')

  const inicio = new Date()

  try {
    // Get rule details
    const { data: rule, error: ruleError } = await getSupabase()
      .from('automation_rules')
      .select('*')
      .eq('id', reglaId)
      .single()

    if (ruleError) throw ruleError
    if (!rule) throw new Error('Rule not found')

    // Get documents to process
    const { data: documentos, error: docError } = await getSupabase()
      .rpc('obtener_acciones_automatizacion', {
        p_cliente_id: rule.cliente_id,
      })

    if (docError) throw docError

    // Execute actions
    let exitosos = 0
    let fallidos = 0
    const errores: string[] = []

    for (const accion of rule.acciones) {
      try {
        if (accion === 'ARCHIVE') {
          // Archive documents
          for (const doc of documentos || []) {
            try {
              await getSupabase()
                .from('document_lifecycle')
                .update({
                  estado_actual: 'ARCHIVADO',
                  fecha_archivado: new Date(),
                })
                .eq('documento_carga_id', doc.documento_id)
              exitosos++
            } catch (e) {
              fallidos++
              errores.push(`Error archiving ${doc.documento_id}: ${String(e)}`)
            }
          }
        } else if (accion === 'DELETE') {
          // Delete documents
          for (const doc of documentos || []) {
            try {
              await getSupabase()
                .from('document_lifecycle')
                .update({
                  estado_actual: 'ELIMINADO',
                  fecha_destruido: new Date(),
                })
                .eq('documento_carga_id', doc.documento_id)
              exitosos++
            } catch (e) {
              fallidos++
              errores.push(`Error deleting ${doc.documento_id}: ${String(e)}`)
            }
          }
        } else if (accion === 'NOTIFY') {
          // Send notifications
          const usuarios = await getSupabase()
            .from('auth.users')
            .select('id, email')
            .eq('cliente_id', rule.cliente_id)

          for (const usuario of usuarios.data || []) {
            try {
              await getSupabase()
                .from('notifications')
                .insert([
                  {
                    cliente_id: rule.cliente_id,
                    usuario_id: usuario.id,
                    tipo: 'EXPIRATION',
                    titulo: 'Document Expiration Notice',
                    mensaje: `${documentos?.length || 0} documents are due for retention action`,
                    referencia_tipo: 'politica',
                    estado: 'PENDING',
                  },
                ])
              exitosos++
            } catch (e) {
              fallidos++
              errores.push(`Error notifying ${usuario.id}: ${String(e)}`)
            }
          }
        }
      } catch (e) {
        errores.push(`Error executing ${accion}: ${String(e)}`)
      }
    }

    const fin = new Date()
    const duracion = Math.round((fin.getTime() - inicio.getTime()) / 1000)

    // Log execution
    const { data: execution, error: execError } = await getSupabase()
      .from('automation_executions')
      .insert([
        {
          cliente_id: rule.cliente_id,
          tipo_accion: rule.acciones.join(','),
          cantidad_documentos: documentos?.length || 0,
          documentos_id: documentos?.map((d) => d.documento_id),
          estado: fallidos === 0 ? 'SUCCESS' : 'FAILED',
          inicio,
          fin,
          duracion_segundos: duracion,
          exitosos,
          fallidos,
          errores: errores.length > 0 ? errores.join('\n') : undefined,
          activado_por: user.id,
        },
      ])
      .select()

    if (execError) throw execError

    // Update rule last execution
    await getSupabase()
      .from('automation_rules')
      .update({
        ultima_ejecucion: inicio,
        proxima_ejecucion: calculateNextExecution(rule),
      })
      .eq('id', reglaId)

    return {
      success: fallidos === 0,
      exitosos,
      fallidos,
      duracion_segundos: duracion,
      errores,
    }
  } catch (error) {
    console.error('Error executing rule:', error)
    throw error
  }
}

export async function obtenerEjecuciones(clienteId: string) {
  const user = await getCurrentUser()
  if (!user) throw new Error('No authenticated user')

  const { data, error } = await getSupabase()
    .from('automation_executions')
    .select('*')
    .eq('cliente_id', clienteId)
    .order('creado_en', { ascending: false })

  if (error) throw error
  return data
}

export async function obtenerDetalleEjecucion(ejecucionId: string) {
  const user = await getCurrentUser()
  if (!user) throw new Error('No authenticated user')

  const { data, error } = await getSupabase()
    .from('automation_executions')
    .select('*')
    .eq('id', ejecucionId)
    .single()

  if (error) throw error
  return data
}

// =============================================================================
// NOTIFICATIONS - Management & Reading
// =============================================================================

export async function obtenerNotificaciones(usuarioId: string) {
  const user = await getCurrentUser()
  if (!user) throw new Error('No authenticated user')

  const { data, error } = await getSupabase()
    .from('notifications')
    .select('*')
    .eq('usuario_id', usuarioId)
    .order('creado_en', { ascending: false })
    .limit(50)

  if (error) throw error
  return data
}

export async function marcarComoLeido(notificacionId: string) {
  const user = await getCurrentUser()
  if (!user) throw new Error('No authenticated user')

  const { error } = await getSupabase()
    .from('notifications')
    .update({
      leido: true,
      leido_en: new Date(),
    })
    .eq('id', notificacionId)

  if (error) throw error
}

export async function marcarTodosComoLeidos(usuarioId: string) {
  const user = await getCurrentUser()
  if (!user) throw new Error('No authenticated user')

  const { error } = await getSupabase()
    .from('notifications')
    .update({
      leido: true,
      leido_en: new Date(),
    })
    .eq('usuario_id', usuarioId)
    .eq('leido', false)

  if (error) throw error
}

export async function eliminarNotificacion(notificacionId: string) {
  const user = await getCurrentUser()
  if (!user) throw new Error('No authenticated user')

  const { error } = await getSupabase()
    .from('notifications')
    .delete()
    .eq('id', notificacionId)

  if (error) throw error
}

export async function obtenerResumenNotificaciones(
  usuarioId: string,
  clienteId: string
) {
  const user = await getCurrentUser()
  if (!user) throw new Error('No authenticated user')

  const { data, error } = await getSupabase()
    .rpc('obtener_resumen_notificaciones', {
      p_usuario_id: usuarioId,
      p_cliente_id: clienteId,
    })

  if (error) throw error
  return data?.[0]
}

// =============================================================================
// NOTIFICATION PREFERENCES
// =============================================================================

export async function obtenerPreferencias(usuarioId: string) {
  const user = await getCurrentUser()
  if (!user) throw new Error('No authenticated user')

  const { data, error } = await getSupabase()
    .from('notification_preferences')
    .select('*')
    .eq('usuario_id', usuarioId)
    .single()

  if (error && error.code !== 'PGRST116') throw error
  return data
}

export async function actualizarPreferencias(
  usuarioId: string,
  clienteId: string,
  datos: Partial<{
    email_habilitado: boolean
    email_direccion: string
    slack_habilitado: boolean
    slack_webhook_url: string
    slack_canal: string
    inapp_habilitado: boolean
    resumen_frecuencia: string
    alertas_vencimiento: boolean
    alertas_aprobacion: boolean
    alertas_sistema: boolean
    alertas_cumplimiento: boolean
  }>
) {
  const user = await getCurrentUser()
  if (!user) throw new Error('No authenticated user')

  const { error } = await getSupabase()
    .from('notification_preferences')
    .upsert([
      {
        usuario_id: usuarioId,
        cliente_id: clienteId,
        ...datos,
      },
    ])

  if (error) throw error
}

// =============================================================================
// EMAIL TEMPLATES
// =============================================================================

export async function obtenerTemplatesEmail(clienteId: string) {
  const user = await getCurrentUser()
  if (!user) throw new Error('No authenticated user')

  const { data, error } = await getSupabase()
    .from('email_templates')
    .select('*')
    .eq('cliente_id', clienteId)
    .order('nombre')

  if (error) throw error
  return data
}

export async function crearTemplateEmail(
  clienteId: string,
  datos: {
    nombre: string
    tipo: string
    asunto: string
    cuerpo: string
    es_default?: boolean
  }
) {
  const user = await getCurrentUser()
  if (!user) throw new Error('No authenticated user')

  const { data, error } = await getSupabase()
    .from('email_templates')
    .insert([
      {
        cliente_id: clienteId,
        ...datos,
      },
    ])
    .select()

  if (error) throw error
  return { id: data?.[0]?.id }
}

export async function actualizarTemplateEmail(
  templateId: string,
  datos: Partial<{
    nombre: string
    tipo: string
    asunto: string
    cuerpo: string
    activo: boolean
    es_default: boolean
  }>
) {
  const user = await getCurrentUser()
  if (!user) throw new Error('No authenticated user')

  const { error } = await getSupabase()
    .from('email_templates')
    .update(datos)
    .eq('id', templateId)

  if (error) throw error
}

// =============================================================================
// EMAIL SENDING
// =============================================================================

export async function enviarEmail(
  clienteId: string,
  datos: {
    para: string
    cc?: string[]
    bcc?: string[]
    asunto: string
    cuerpo: string
    templateId?: string
    variables?: Record<string, string>
  }
) {
  const user = await getCurrentUser()
  if (!user) throw new Error('No authenticated user')

  // Log email in database
  const { data, error } = await getSupabase()
    .from('email_logs')
    .insert([
      {
        cliente_id: clienteId,
        para: datos.para,
        cc: datos.cc,
        bcc: datos.bcc,
        asunto: datos.asunto,
        template_id: datos.templateId,
        variables: datos.variables,
        estado: 'PENDING',
      },
    ])
    .select()

  if (error) throw error

  // TODO: Integrate with actual SMTP service
  // For now, just log it as pending

  return { id: data?.[0]?.id, estado: 'PENDING' }
}

export async function enviarEmailBatch(
  clienteId: string,
  emails: Array<{
    para: string
    cc?: string[]
    asunto: string
    cuerpo: string
  }>
) {
  const user = await getCurrentUser()
  if (!user) throw new Error('No authenticated user')

  const registros = emails.map((email) => ({
    cliente_id: clienteId,
    para: email.para,
    cc: email.cc,
    asunto: email.asunto,
    estado: 'PENDING',
  }))

  const { data, error } = await getSupabase()
    .from('email_logs')
    .insert(registros)
    .select()

  if (error) throw error

  return {
    enviados: data?.length || 0,
    estado: 'PENDING',
  }
}

export async function obtenerEmailLogs(clienteId: string) {
  const user = await getCurrentUser()
  if (!user) throw new Error('No authenticated user')

  const { data, error } = await getSupabase()
    .from('email_logs')
    .select('*')
    .eq('cliente_id', clienteId)
    .order('creado_en', { ascending: false })
    .limit(100)

  if (error) throw error
  return data
}

// =============================================================================
// SLACK INTEGRATION
// =============================================================================

export async function obtenerIntegracionesSlack(clienteId: string) {
  const user = await getCurrentUser()
  if (!user) throw new Error('No authenticated user')

  const { data, error } = await getSupabase()
    .from('slack_integrations')
    .select('*')
    .eq('cliente_id', clienteId)
    .order('nombre')

  if (error) throw error
  return data
}

export async function crearIntegracionSlack(
  clienteId: string,
  datos: {
    nombre: string
    workspace_nombre: string
    webhook_url: string
    canal: string
    eventos_habilitados?: string[]
  }
) {
  const user = await getCurrentUser()
  if (!user) throw new Error('No authenticated user')

  const { data, error } = await getSupabase()
    .from('slack_integrations')
    .insert([
      {
        cliente_id: clienteId,
        creado_por: user.id,
        ...datos,
      },
    ])
    .select()

  if (error) throw error
  return { id: data?.[0]?.id }
}

export async function actualizarIntegracionSlack(
  integracionId: string,
  datos: Partial<{
    nombre: string
    workspace_nombre: string
    canal: string
    eventos_habilitados: string[]
    activo: boolean
  }>
) {
  const user = await getCurrentUser()
  if (!user) throw new Error('No authenticated user')

  const { error } = await getSupabase()
    .from('slack_integrations')
    .update(datos)
    .eq('id', integracionId)

  if (error) throw error
}

export async function pruebaIntegracionSlack(integracionId: string) {
  const user = await getCurrentUser()
  if (!user) throw new Error('No authenticated user')

  try {
    const { data: integracion, error: getError } = await getSupabase()
      .from('slack_integrations')
      .select('*')
      .eq('id', integracionId)
      .single()

    if (getError) throw getError

    // TODO: Test webhook by sending sample message
    // For now, just return success

    return { success: true, message: 'Webhook test message would be sent' }
  } catch (error) {
    console.error('Error testing Slack integration:', error)
    throw error
  }
}

export async function enviarAlertaSlack(
  clienteId: string,
  datos: {
    titulo: string
    mensaje: string
    severidad?: 'info' | 'warning' | 'error'
  }
) {
  const user = await getCurrentUser()
  if (!user) throw new Error('No authenticated user')

  // Get Slack integrations for client
  const { data: integraciones, error: intError } = await getSupabase()
    .from('slack_integrations')
    .select('*')
    .eq('cliente_id', clienteId)
    .eq('activo', true)

  if (intError) throw intError

  let enviados = 0
  const errores: string[] = []

  for (const integracion of integraciones || []) {
    try {
      // Log message
      const { error: logError } = await getSupabase()
        .from('slack_messages')
        .insert([
          {
            cliente_id: clienteId,
            slack_integration_id: integracion.id,
            tipo: 'ALERT',
            mensaje: `${datos.titulo}: ${datos.mensaje}`,
            estado: 'PENDING',
          },
        ])

      if (logError) throw logError

      // TODO: Actually send to Slack via webhook
      enviados++
    } catch (e) {
      errores.push(`Error with ${integracion.nombre}: ${String(e)}`)
    }
  }

  return {
    enviados,
    errores: errores.length > 0 ? errores : undefined,
  }
}

// =============================================================================
// WEBHOOKS (OUTBOUND)
// =============================================================================

export async function obtenerWebhooks(clienteId: string) {
  const user = await getCurrentUser()
  if (!user) throw new Error('No authenticated user')

  const { data, error } = await getSupabase()
    .from('webhooks')
    .select('*')
    .eq('cliente_id', clienteId)
    .order('nombre')

  if (error) throw error
  return data
}

export async function crearWebhook(
  clienteId: string,
  datos: {
    nombre: string
    url: string
    evento_tipo: string
    secret: string
    headers?: Record<string, string>
    reintentos?: number
    timeout_segundos?: number
  }
) {
  const user = await getCurrentUser()
  if (!user) throw new Error('No authenticated user')

  const { data, error } = await getSupabase()
    .from('webhooks')
    .insert([
      {
        cliente_id: clienteId,
        creado_por: user.id,
        ...datos,
      },
    ])
    .select()

  if (error) throw error
  return { id: data?.[0]?.id }
}

export async function actualizarWebhook(
  webhookId: string,
  datos: Partial<{
    nombre: string
    url: string
    evento_tipo: string
    activo: boolean
    reintentos: number
    timeout_segundos: number
  }>
) {
  const user = await getCurrentUser()
  if (!user) throw new Error('No authenticated user')

  const { error } = await getSupabase()
    .from('webhooks')
    .update(datos)
    .eq('id', webhookId)

  if (error) throw error
}

export async function obtenerEntregasWebhook(webhookId: string) {
  const user = await getCurrentUser()
  if (!user) throw new Error('No authenticated user')

  const { data, error } = await getSupabase()
    .from('webhook_deliveries')
    .select('*')
    .eq('webhook_id', webhookId)
    .order('creado_en', { ascending: false })
    .limit(50)

  if (error) throw error
  return data
}

export async function reintentarEntrega(entregaId: string) {
  const user = await getCurrentUser()
  if (!user) throw new Error('No authenticated user')

  // Get the delivery to retry
  const { data: entrega, error: fetchError } = await getSupabase()
    .from('webhook_deliveries')
    .select('*, webhooks(*)')
    .eq('id', entregaId)
    .single()

  if (fetchError) throw fetchError
  if (!entrega) throw new Error('Entrega no encontrada')

  // Update status to RETRY
  const { error: updateError } = await getSupabase()
    .from('webhook_deliveries')
    .update({
      estado: 'RETRY',
      intento_numero: entrega.intento_numero + 1,
      proxima_tentativa: new Date().toISOString(),
    })
    .eq('id', entregaId)

  if (updateError) throw updateError

  // In production, this would trigger the actual webhook delivery
  // For now, we just mark it as queued for retry
  return { success: true, message: 'Entrega programada para reintento' }
}

// =============================================================================
// BATCH OPERATIONS
// =============================================================================

export async function iniciarBatchArchivo(
  clienteId: string,
  documentoIds: string[]
) {
  const user = await getCurrentUser()
  if (!user) throw new Error('No authenticated user')

  const { data, error } = await getSupabase()
    .from('batch_jobs')
    .insert([
      {
        cliente_id: clienteId,
        tipo_operacion: 'ARCHIVE',
        descripcion: `Archive ${documentoIds.length} documents`,
        cantidad_total: documentoIds.length,
        parametros: { documentos_id: documentoIds },
        creado_por: user.id,
        estado: 'PENDING',
      },
    ])
    .select()

  if (error) throw error

  // TODO: Queue for background processing
  return { jobId: data?.[0]?.id, estado: 'PENDING' }
}

export async function iniciarBatchEliminacion(
  clienteId: string,
  documentoIds: string[]
) {
  const user = await getCurrentUser()
  if (!user) throw new Error('No authenticated user')

  const { data, error } = await getSupabase()
    .from('batch_jobs')
    .insert([
      {
        cliente_id: clienteId,
        tipo_operacion: 'DELETE',
        descripcion: `Delete ${documentoIds.length} documents`,
        cantidad_total: documentoIds.length,
        parametros: { documentos_id: documentoIds },
        creado_por: user.id,
        estado: 'PENDING',
      },
    ])
    .select()

  if (error) throw error

  return { jobId: data?.[0]?.id, estado: 'PENDING' }
}

export async function obtenerBatchJob(jobId: string) {
  const user = await getCurrentUser()
  if (!user) throw new Error('No authenticated user')

  const { data, error } = await getSupabase()
    .from('batch_jobs')
    .select('*')
    .eq('id', jobId)
    .single()

  if (error) throw error
  return data
}

export async function obtenerBatchJobs(clienteId: string) {
  const user = await getCurrentUser()
  if (!user) throw new Error('No authenticated user')

  const { data, error } = await getSupabase()
    .from('batch_jobs')
    .select('*')
    .eq('cliente_id', clienteId)
    .order('creado_en', { ascending: false })

  if (error) throw error
  return data
}

export async function cancelarBatchJob(jobId: string) {
  const user = await getCurrentUser()
  if (!user) throw new Error('No authenticated user')

  const { error } = await getSupabase()
    .from('batch_jobs')
    .update({ estado: 'CANCELLED' })
    .eq('id', jobId)

  if (error) throw error
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function calculateNextExecution(rule: any): Date {
  const now = new Date()

  if (rule.frecuencia === 'DIARIA') {
    const next = new Date(now)
    next.setDate(next.getDate() + 1)
    if (rule.hora) {
      const [hours, minutes] = rule.hora.split(':')
      next.setHours(parseInt(hours), parseInt(minutes), 0, 0)
    }
    return next
  }

  if (rule.frecuencia === 'SEMANAL') {
    const next = new Date(now)
    const daysUntil = (rule.dia_semana - next.getDay() + 7) % 7 || 7
    next.setDate(next.getDate() + daysUntil)
    if (rule.hora) {
      const [hours, minutes] = rule.hora.split(':')
      next.setHours(parseInt(hours), parseInt(minutes), 0, 0)
    }
    return next
  }

  if (rule.frecuencia === 'MENSUAL') {
    const next = new Date(now)
    next.setMonth(next.getMonth() + 1)
    next.setDate(rule.dia_mes)
    if (rule.hora) {
      const [hours, minutes] = rule.hora.split(':')
      next.setHours(parseInt(hours), parseInt(minutes), 0, 0)
    }
    return next
  }

  return now
}
