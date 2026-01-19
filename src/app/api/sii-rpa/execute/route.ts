// SII RPA Execute API Route
// POST - Trigger task execution on RPA server

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { decryptCredentials } from '@/lib/sii-rpa/encryption'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verify authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { jobId } = body

    if (!jobId) {
      return NextResponse.json(
        { success: false, error: 'jobId es requerido' },
        { status: 400 }
      )
    }

    // Get job details
    const { data: jobData, error: jobError } = await (supabase as any)
      .from('sii_jobs')
      .select('*, cliente:clientes(id, rut)')
      .eq('id', jobId)
      .single()

    if (jobError || !jobData) {
      return NextResponse.json({ success: false, error: 'Job no encontrado' }, { status: 404 })
    }

    const job = jobData as { id: string; cliente_id: string; task_type: string; parametros: Record<string, unknown> }

    // Get credentials for the client
    const { data: credential, error: credError } = await (supabase as any)
      .from('credenciales_portales')
      .select('*')
      .eq('cliente_id', job.cliente_id)
      .eq('portal', 'sii')
      .eq('activo', true)
      .single()

    if (credError || !credential) {
      return NextResponse.json(
        { success: false, error: 'Credenciales no encontradas' },
        { status: 404 }
      )
    }

    const cred = credential as unknown as {
      rut: string
      password_encriptado: string
      certificado_archivo: string
      certificado_password_enc: string
      metodo_autenticacion: string
      rut_representante?: string
    }

    // Decrypt credentials
    const decryptResult = decryptCredentials({
      password_encriptado: cred.password_encriptado,
      certificado_archivo_enc: cred.certificado_archivo,
      certificado_password_enc: cred.certificado_password_enc,
    })

    if (!decryptResult.success || !decryptResult.decrypted) {
      return NextResponse.json(
        { success: false, error: 'Error desencriptando credenciales' },
        { status: 500 }
      )
    }

    // Get RPA server URL
    const rpaServerUrl = process.env.RPA_SERVER_URL || 'http://localhost:3001'
    const rpaApiKey = process.env.RPA_SERVER_API_KEY || ''

    // Send to RPA server
    const rpaResponse = await fetch(`${rpaServerUrl}/api/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': rpaApiKey,
      },
      body: JSON.stringify({
        jobId: job.id,
        taskType: job.task_type,
        credentials: {
          rut: cred.rut,
          password: decryptResult.decrypted.password,
          authMethod: cred.metodo_autenticacion,
          rutRepresentante: cred.rut_representante,
        },
        params: job.parametros,
      }),
    })

    if (!rpaResponse.ok) {
      const errorText = await rpaResponse.text()
      console.error('[SII RPA Execute] RPA server error:', errorText)

      return NextResponse.json(
        { success: false, error: 'Error comunicando con servidor RPA' },
        { status: 502 }
      )
    }

    const rpaResult = await rpaResponse.json()

    // Update job status
    await (supabase as any)
      .from('sii_jobs')
      .update({
        status: 'ejecutando',
        started_at: new Date().toISOString(),
      })
      .eq('id', jobId)

    return NextResponse.json({
      success: true,
      message: 'Tarea iniciada',
      jobId,
    })
  } catch (error) {
    console.error('[SII RPA Execute] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
