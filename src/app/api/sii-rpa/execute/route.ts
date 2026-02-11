// SII RPA Execute API Route
// POST - Trigger task execution on RPA server

import { NextRequest, NextResponse } from 'next/server'
// TODO: Phase 2 - Implement via Convex bots module (createJob, updateJobStatus)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { jobId } = body

    if (!jobId) {
      return NextResponse.json(
        { success: false, error: 'jobId es requerido' },
        { status: 400 }
      )
    }

    // TODO: Phase 2 - Look up job in Convex bot_jobs, get credentials from Convex,
    // decrypt and send to RPA server. Use ConvexHttpClient with api.bots.updateJobStatus
    return NextResponse.json({
      success: true,
      message: 'Pending Convex migration - RPA execution not triggered',
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
