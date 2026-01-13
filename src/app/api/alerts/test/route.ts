/**
 * Alert Test API
 * Phase 7 Week 3: Test alert rules with real evaluation engine
 * Created: 2026-01-11
 */

import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { NextRequest, NextResponse } from 'next/server'
import { AlertRuleEngine } from '@/lib/services/alertRuleEngine'

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
 * POST /api/alerts/test
 * Test a single alert rule with real condition evaluation
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
    const { ruleId } = body

    // Validate input
    if (!ruleId || typeof ruleId !== 'string') {
      return NextResponse.json(
        { error: 'ruleId is required and must be a string' },
        { status: 400 }
      )
    }

    // Fetch the rule
    const { data: rule, error: fetchError } = await supabase
      .from('alert_rules')
      .select('*')
      .eq('id', ruleId)
      .eq('organization_id', session.user.id)
      .single()

    if (fetchError || !rule) {
      return NextResponse.json(
        { error: 'Alert rule not found' },
        { status: 404 }
      )
    }

    // Test the alert rule
    const result = await AlertRuleEngine.testRule(rule)

    return NextResponse.json(
      {
        success: true,
        data: result,
        message: result.triggered
          ? 'Alert condition met and notifications sent'
          : 'Alert condition not met',
        timestamp: new Date(),
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in POST /api/alerts/test:', error)
    return NextResponse.json(
      {
        error: 'Failed to test alert',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/alerts/test
 * Get test results for all alert rules in organization (last 24 hours)
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

    // Fetch recent alert executions
    const { data: executions, error } = await supabase
      .from('alert_execution_history')
      .select(`
        id,
        alert_rule_id,
        triggered_at,
        metric_name,
        metric_value,
        threshold_value,
        condition_met,
        duration_met,
        status,
        notifications_sent
      `)
      .eq('organization_id', session.user.id)
      .gte('triggered_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('triggered_at', { ascending: false })
      .limit(100)

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch test results', message: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        data: executions,
        count: executions?.length || 0,
        timestamp: new Date(),
      },
      {
        headers: {
          'Cache-Control': 'private, max-age=60',
        },
      }
    )
  } catch (error) {
    console.error('Error in GET /api/alerts/test:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch test results',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * OPTIONS /api/alerts/test
 * Handle CORS preflight
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}
