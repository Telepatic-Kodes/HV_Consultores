/**
 * Compliance Analytics API
 * Phase 7: Advanced Analytics & Business Intelligence
 * Created: 2026-01-11
 *
 * Endpoint: POST /api/analytics/compliance
 * Returns: Compliance metrics summary with GDPR, HIPAA, SOC2, ISO27001 tracking
 */

import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { NextRequest, NextResponse } from 'next/server'
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
 * POST /api/analytics/compliance
 * Get compliance analytics metrics
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

    // For now, return mock compliance metrics
    // In production, this would query aggregated compliance data
    const metrics = {
      gdrpScore: 85,
      hipaaScore: 88,
      soc2Score: 80,
      iso27001Score: 82,
      overallScore: 84,
      frameworks: [
        {
          framework: 'GDPR',
          status: 'compliant' as const,
          lastAudit: new Date('2025-12-01'),
          nextAudit: new Date('2026-06-01'),
          issues: 2,
          resolved: 2,
        },
        {
          framework: 'HIPAA',
          status: 'compliant' as const,
          lastAudit: new Date('2025-11-15'),
          nextAudit: new Date('2026-05-15'),
          issues: 1,
          resolved: 1,
        },
        {
          framework: 'SOC2',
          status: 'in-progress' as const,
          lastAudit: new Date('2025-10-01'),
          nextAudit: new Date('2026-04-01'),
          issues: 3,
          resolved: 2,
        },
        {
          framework: 'ISO27001',
          status: 'in-progress' as const,
          lastAudit: new Date('2025-09-01'),
          nextAudit: new Date('2026-03-01'),
          issues: 2,
          resolved: 1,
        },
      ],
      recentViolations: [
        {
          id: 'v-001',
          framework: 'GDPR',
          description: 'Data retention policy not enforced on archived documents',
          severity: 'medium' as const,
          detectedDate: new Date('2026-01-05'),
          resolvedDate: new Date('2026-01-08'),
          remediationSteps: [
            'Updated retention policies',
            'Applied policy to all document archives',
            'Verified enforcement',
          ],
        },
      ],
      controlStatus: {
        total: 50,
        implemented: 48,
        tested: 45,
        compliant: 43,
      },
      violationTrendLast30Days: [
        { date: new Date('2026-01-01'), count: 2 },
        { date: new Date('2026-01-02'), count: 2 },
        { date: new Date('2026-01-03'), count: 1 },
        { date: new Date('2026-01-04'), count: 0 },
        { date: new Date('2026-01-05'), count: 1 },
        { date: new Date('2026-01-06'), count: 0 },
        { date: new Date('2026-01-07'), count: 0 },
        { date: new Date('2026-01-08'), count: 0 },
        { date: new Date('2026-01-09'), count: 0 },
        { date: new Date('2026-01-10'), count: 0 },
        { date: new Date('2026-01-11'), count: 0 },
      ],
      nextAuditDate: new Date('2026-03-01'),
      lastAuditDate: new Date('2025-12-01'),
      daysUntilAudit: 49,
    }

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
    console.error('Error in compliance analytics endpoint:', error)

    return NextResponse.json(
      {
        error: 'Failed to fetch compliance analytics',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * OPTIONS /api/analytics/compliance
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
