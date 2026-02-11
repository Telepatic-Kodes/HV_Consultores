// SII RPA Status API Route
// GET - Check job status

import { NextRequest, NextResponse } from 'next/server'
// TODO: Phase 2 - Implement via Convex bots module (getJob, getJobSteps)

export async function GET(request: NextRequest) {
  try {
    const jobId = request.nextUrl.searchParams.get('jobId')

    if (!jobId) {
      return NextResponse.json(
        { success: false, error: 'jobId es requerido' },
        { status: 400 }
      )
    }

    // TODO: Phase 2 - Query job status from Convex using api.bots.getJob
    return NextResponse.json({
      success: true,
      job_id: jobId,
      status: 'pendiente',
      progress: 0,
      current_step: 'Pending Convex migration',
      steps: [],
      results: {
        files: null,
        data: null,
      },
      error: null,
      message: 'Pending Convex migration',
    })
  } catch (error) {
    console.error('[SII RPA Status] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
