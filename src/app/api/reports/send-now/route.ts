/**
 * Report Send Now API
 * Phase 7 Week 3: Manually trigger immediate report generation and delivery
 * Created: 2026-01-11
 */

import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { NextRequest, NextResponse } from 'next/server'
import { ReportGenerator } from '@/lib/services/reportGenerator'

const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

function checkRateLimit(userId: string): boolean {
  const now = Date.now()
  const record = rateLimitMap.get(userId)

  if (!record || record.resetTime < now) {
    rateLimitMap.set(userId, { count: 1, resetTime: now + 60000 })
    return true
  }

  if (record.count >= 30) {
    return false
  }

  record.count += 1
  return true
}

/**
 * POST /api/reports/send-now
 * Manually trigger immediate report generation and delivery
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const supabase = createRouteHandlerClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check rate limit
    if (!checkRateLimit(session.user.id)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Maximum 30 requests per minute.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { scheduleId } = body

    // Validate input
    if (!scheduleId || typeof scheduleId !== 'string') {
      return NextResponse.json(
        { error: 'scheduleId is required and must be a string' },
        { status: 400 }
      )
    }

    // Generate report immediately
    const result = await ReportGenerator.generateNow(scheduleId, session.user.id)

    if (!result) {
      return NextResponse.json(
        { error: 'Failed to generate report. Schedule not found or generation failed.' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        data: result,
        message: 'Report generated and delivered successfully',
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
