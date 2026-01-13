/**
 * Queue Analytics API
 * Phase 7: Advanced Analytics & Business Intelligence
 * Created: 2026-01-11
 *
 * Endpoint: POST /api/analytics/queue
 * Returns: Queue performance metrics and system health
 */

import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { NextRequest, NextResponse } from 'next/server'
import { aggregateQueueMetrics } from '@/lib/analytics/aggregation'
import { AnalyticsFilter, AnalyticsApiResponse } from '@/types/analytics'

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

function validateAnalyticsFilter(
  filter: any
): { valid: boolean; error?: string } {
  if (!filter.organizationId) {
    return { valid: false, error: 'organizationId is required' }
  }

  if (!filter.dateRange) {
    return { valid: false, error: 'dateRange is required' }
  }

  if (!filter.dateRange.startDate || !filter.dateRange.endDate) {
    return { valid: false, error: 'startDate and endDate are required' }
  }

  const startDate = new Date(filter.dateRange.startDate)
  const endDate = new Date(filter.dateRange.endDate)

  if (startDate > endDate) {
    return { valid: false, error: 'startDate cannot be after endDate' }
  }

  const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  if (daysDiff > 730) {
    return { valid: false, error: 'Date range cannot exceed 2 years' }
  }

  return { valid: true }
}

/**
 * POST /api/analytics/queue
 * Get queue analytics metrics
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const supabase = createRouteHandlerClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check rate limit
    if (!checkRateLimit(session.user.id)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Maximum 30 requests per minute.' },
        { status: 429 }
      )
    }

    // Parse request body
    const body = await request.json()

    // Validate filter
    const validation = validateAnalyticsFilter(body)
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }

    // Ensure user can only access their own organization metrics
    if (body.organizationId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden: Cannot access other organizations metrics' },
        { status: 403 }
      )
    }

    // Prepare filter
    const filter: AnalyticsFilter = {
      organizationId: body.organizationId,
      dateRange: {
        startDate: new Date(body.dateRange.startDate),
        endDate: new Date(body.dateRange.endDate),
      },
      groupBy: body.groupBy || 'day',
      limit: Math.min(body.limit || 100, 1000),
      offset: body.offset || 0,
    }

    // Aggregate metrics
    const metrics = await aggregateQueueMetrics(filter)

    // Prepare response
    const response: AnalyticsApiResponse<any> = {
      success: true,
      data: metrics,
      timestamp: new Date(),
    }

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'private, max-age=300',
      },
    })
  } catch (error) {
    console.error('Error in queue analytics endpoint:', error)

    return NextResponse.json(
      {
        error: 'Failed to fetch queue analytics',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * OPTIONS /api/analytics/queue
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
