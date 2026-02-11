/**
 * Alert Test API
 * Phase 7 Week 3: Test alert rules with real evaluation engine
 * Created: 2026-01-11
 */

import { NextRequest, NextResponse } from 'next/server'
// TODO: Phase 2 - Implement via Convex (replace AlertRuleEngine and Supabase queries)

/**
 * POST /api/alerts/test
 * Test a single alert rule with real condition evaluation
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { ruleId } = body

    if (!ruleId || typeof ruleId !== 'string') {
      return NextResponse.json(
        { error: 'ruleId is required and must be a string' },
        { status: 400 }
      )
    }

    // TODO: Phase 2 - Fetch rule from Convex and run AlertRuleEngine.testRule
    return NextResponse.json(
      {
        success: true,
        data: {
          triggered: false,
          ruleId,
          conditionMet: false,
          durationMet: false,
        },
        message: 'Pending Convex migration - test not executed',
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
    // TODO: Phase 2 - Query alert execution history from Convex
    return NextResponse.json(
      {
        success: true,
        data: [],
        count: 0,
        message: 'Pending Convex migration',
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
