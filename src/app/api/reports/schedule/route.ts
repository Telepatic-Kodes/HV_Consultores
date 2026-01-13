/**
 * Report Scheduler API
 * Phase 7: Advanced Analytics & Business Intelligence
 * Created: 2026-01-11
 *
 * Endpoints:
 *   GET /api/reports/schedule - List all report schedules
 *   POST /api/reports/schedule - Create new report schedule
 *   PUT /api/reports/schedule/{id} - Update report schedule
 *   DELETE /api/reports/schedule/{id} - Delete report schedule
 *   POST /api/reports/schedule/{id}/send - Send report immediately
 */

import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { NextRequest, NextResponse } from 'next/server'

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

function validateReportSchedule(schedule: any): { valid: boolean; error?: string } {
  if (!schedule.name || !schedule.name.trim()) {
    return { valid: false, error: 'Schedule name is required' }
  }

  if (!schedule.type || !['daily', 'weekly', 'monthly'].includes(schedule.type)) {
    return { valid: false, error: 'Valid schedule type is required (daily, weekly, monthly)' }
  }

  if (!schedule.schedule || !schedule.schedule.time) {
    return { valid: false, error: 'Schedule time is required' }
  }

  if (!schedule.recipients) {
    return { valid: false, error: 'At least one recipient is required' }
  }

  if (
    !schedule.recipients.email?.length &&
    !schedule.recipients.slack &&
    !schedule.recipients.webhook
  ) {
    return { valid: false, error: 'At least one recipient method is required' }
  }

  if (!schedule.dashboards || schedule.dashboards.length === 0) {
    return { valid: false, error: 'At least one dashboard must be selected' }
  }

  if (!schedule.format || !['pdf', 'excel', 'html'].includes(schedule.format)) {
    return { valid: false, error: 'Valid format is required (pdf, excel, html)' }
  }

  return { valid: true }
}

/**
 * GET /api/reports/schedule
 * List all report schedules for organization
 */
export async function GET(request: NextRequest) {
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

    // Mock response - in production, would query database
    const mockSchedules = [
      {
        id: 'report-1',
        name: 'Daily Operations Summary',
        enabled: true,
        type: 'daily',
        schedule: {
          time: '08:00',
        },
        recipients: {
          email: ['ops@example.com', 'manager@example.com'],
        },
        dashboards: ['documents', 'queue'],
        format: 'pdf',
        includeCharts: true,
        createdAt: new Date('2026-01-01'),
        lastSent: new Date('2026-01-11'),
      },
      {
        id: 'report-2',
        name: 'Weekly Analytics Report',
        enabled: true,
        type: 'weekly',
        schedule: {
          time: '09:00',
          dayOfWeek: 1,
        },
        recipients: {
          email: ['analytics@example.com'],
          slack: 'https://hooks.slack.com/services/...',
        },
        dashboards: ['documents', 'automation', 'team', 'queue'],
        format: 'excel',
        includeCharts: true,
        createdAt: new Date('2025-12-15'),
        lastSent: new Date('2026-01-06'),
      },
    ]

    return NextResponse.json(
      {
        success: true,
        data: mockSchedules,
        timestamp: new Date(),
      },
      {
        headers: {
          'Cache-Control': 'private, max-age=60',
        },
      }
    )
  } catch (error) {
    console.error('Error in GET /api/reports/schedule:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch report schedules',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/reports/schedule
 * Create new report schedule
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

    // Validate schedule
    const validation = validateReportSchedule(body)
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    // Create schedule (mock)
    const newSchedule = {
      id: `report-${Date.now()}`,
      ...body,
      createdAt: new Date(),
      organizationId: session.user.id,
    }

    return NextResponse.json(
      {
        success: true,
        data: newSchedule,
        timestamp: new Date(),
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error in POST /api/reports/schedule:', error)
    return NextResponse.json(
      {
        error: 'Failed to create report schedule',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * OPTIONS /api/reports/schedule
 * Handle CORS preflight
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}
