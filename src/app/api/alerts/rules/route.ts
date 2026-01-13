/**
 * Alert Rules API
 * Phase 7: Advanced Analytics & Business Intelligence
 * Created: 2026-01-11
 *
 * Endpoints:
 *   GET /api/alerts/rules - List all alert rules
 *   POST /api/alerts/rules - Create new alert rule
 *   PUT /api/alerts/rules/{id} - Update alert rule
 *   DELETE /api/alerts/rules/{id} - Delete alert rule
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

function validateAlertRule(rule: any): { valid: boolean; error?: string } {
  if (!rule.name || !rule.name.trim()) {
    return { valid: false, error: 'Rule name is required' }
  }

  if (!rule.condition) {
    return { valid: false, error: 'Condition is required' }
  }

  if (!rule.condition.metric) {
    return { valid: false, error: 'Metric is required' }
  }

  if (!rule.condition.operator) {
    return { valid: false, error: 'Operator is required' }
  }

  if (rule.condition.threshold === undefined || rule.condition.threshold === null) {
    return { valid: false, error: 'Threshold is required' }
  }

  const validOperators = ['>', '<', '=', '>=', '<=']
  if (!validOperators.includes(rule.condition.operator)) {
    return { valid: false, error: 'Invalid operator' }
  }

  if (!rule.actions) {
    return { valid: false, error: 'At least one action is required' }
  }

  return { valid: true }
}

/**
 * GET /api/alerts/rules
 * List all alert rules for organization
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
    const mockRules = [
      {
        id: 'rule-1',
        name: 'High Queue Depth Alert',
        enabled: true,
        condition: {
          metric: 'queueDepth',
          operator: '>',
          threshold: 500,
          duration: 5,
        },
        actions: {
          email: ['admin@example.com'],
          slack: 'https://hooks.slack.com/services/...',
          inApp: true,
        },
        createdAt: new Date('2026-01-05'),
        lastTriggered: new Date('2026-01-10'),
      },
      {
        id: 'rule-2',
        name: 'High Error Rate',
        enabled: true,
        condition: {
          metric: 'errorRate',
          operator: '>',
          threshold: 5,
          duration: 10,
        },
        actions: {
          email: ['admin@example.com', 'ops@example.com'],
          inApp: true,
        },
        createdAt: new Date('2026-01-03'),
        lastTriggered: new Date('2026-01-08'),
      },
    ]

    return NextResponse.json(
      {
        success: true,
        data: mockRules,
        timestamp: new Date(),
      },
      {
        headers: {
          'Cache-Control': 'private, max-age=60',
        },
      }
    )
  } catch (error) {
    console.error('Error in GET /api/alerts/rules:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch alert rules',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/alerts/rules
 * Create new alert rule
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

    // Validate rule
    const validation = validateAlertRule(body)
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    // Create rule (mock)
    const newRule = {
      id: `rule-${Date.now()}`,
      ...body,
      createdAt: new Date(),
      organizationId: session.user.id,
    }

    return NextResponse.json(
      {
        success: true,
        data: newRule,
        timestamp: new Date(),
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error in POST /api/alerts/rules:', error)
    return NextResponse.json(
      {
        error: 'Failed to create alert rule',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * OPTIONS /api/alerts/rules
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
