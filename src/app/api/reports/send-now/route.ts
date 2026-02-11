/**
 * Report Send Now API
 * Phase 7 Week 3: Manually trigger immediate report generation and delivery
 * Created: 2026-01-11
 */

import { NextRequest, NextResponse } from 'next/server'
// TODO: Phase 2 - Implement via Convex (replace ReportGenerator)

/**
 * POST /api/reports/send-now
 * Manually trigger immediate report generation and delivery
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { scheduleId } = body

    if (!scheduleId || typeof scheduleId !== 'string') {
      return NextResponse.json(
        { error: 'scheduleId is required and must be a string' },
        { status: 400 }
      )
    }

    // TODO: Phase 2 - Trigger report generation via Convex action
    return NextResponse.json(
      {
        success: true,
        data: { scheduleId, status: 'queued' },
        message: 'Pending Convex migration - report not generated',
        timestamp: new Date(),
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in POST /api/reports/send-now:', error)
    return NextResponse.json(
      {
        error: 'Failed to send report',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * OPTIONS /api/reports/send-now
 * Handle CORS preflight
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}
