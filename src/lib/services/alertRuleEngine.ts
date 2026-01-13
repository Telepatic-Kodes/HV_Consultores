/**
 * Alert Rule Engine
 * Phase 7 Week 3: Real-time alert condition evaluation and notification dispatch
 * Created: 2026-01-11
 */

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export interface AlertCondition {
  metric: 'queueDepth' | 'errorRate' | 'latency' | 'cpuUsage' | 'complianceScore'
  operator: '>' | '<' | '=' | '>=' | '<='
  threshold: number
  duration?: number // Minutes the condition must be met
}

export interface AlertActions {
  email?: string[]
  slack?: string
  inApp?: boolean
  webhook?: string
}

export interface AlertRule {
  id: string
  organization_id: string
  name: string
  description?: string
  enabled: boolean
  condition: AlertCondition
  actions: AlertActions
  notify_frequency: 'immediate' | 'once_per_hour' | 'once_per_day'
  last_triggered_at?: Date
  last_notified_at?: Date
  created_at: Date
  updated_at: Date
}

export interface MetricReading {
  timestamp: number
  value: number
}

export interface AlertTriggerResult {
  ruleName: string
  ruleId: string
  triggered: boolean
  metric: string
  currentValue: number
  threshold: number
  durationMet?: boolean
  notifications: NotificationResult[]
}

export interface NotificationResult {
  channel: 'email' | 'slack' | 'inApp' | 'webhook'
  status: 'pending' | 'sent' | 'failed'
  error?: string
}

// =============================================================================
// METRICS COLLECTION SERVICE
// =============================================================================

class MetricsCollector {
  /**
   * Get current metric value from the system
   */
  static async getMetricValue(
    metric: AlertCondition['metric'],
    organizationId: string
  ): Promise<number> {
    // In production, this would query real-time data from:
    // - Queue depth from job queue system
    // - Error rate from error tracking
    // - Latency from monitoring system
    // - CPU/Memory from system metrics
    // - Compliance score from compliance database

    const mockMetrics: Record<string, number> = {
      queueDepth: Math.random() * 1000,
      errorRate: Math.random() * 10,
      latency: Math.random() * 500,
      cpuUsage: Math.random() * 100,
      complianceScore: 75 + Math.random() * 25,
    }

    return mockMetrics[metric] || 0
  }

  /**
   * Get historical metric readings for duration validation
   */
  static async getMetricHistory(
    metric: AlertCondition['metric'],
    organizationId: string,
    durationMinutes: number
  ): Promise<MetricReading[]> {
    // In production, query time-series database
    // For now, return mock data
    const now = Date.now()
    const readings: MetricReading[] = []

    for (let i = 0; i < durationMinutes; i++) {
      readings.push({
        timestamp: now - (durationMinutes - i) * 60 * 1000,
        value: Math.random() * 1000,
      })
    }

    return readings
  }
}

// =============================================================================
// CONDITION EVALUATION ENGINE
// =============================================================================

class ConditionEvaluator {
  /**
   * Evaluate if a single reading meets the condition threshold
   */
  static evaluateThreshold(
    value: number,
    operator: AlertCondition['operator'],
    threshold: number
  ): boolean {
    switch (operator) {
      case '>':
        return value > threshold
      case '<':
        return value < threshold
      case '=':
        return Math.abs(value - threshold) < 0.001 // Allow small float variance
      case '>=':
        return value >= threshold
      case '<=':
        return value <= threshold
      default:
        return false
    }
  }

  /**
   * Evaluate if condition is sustained for required duration
   */
  static evaluateDuration(
    readings: MetricReading[],
    operator: AlertCondition['operator'],
    threshold: number,
    durationMinutes: number
  ): boolean {
    if (!durationMinutes || durationMinutes === 0) {
      // No duration requirement
      return true
    }

    // Filter readings within the duration window (oldest to newest)
    const recentReadings = readings.slice(-durationMinutes)

    // Check if all readings in the window exceed threshold
    const allExceed = recentReadings.every((reading) =>
      this.evaluateThreshold(reading.value, operator, threshold)
    )

    // Must have enough readings to cover the duration
    const durationCovered = recentReadings.length >= durationMinutes

    return allExceed && durationCovered
  }

  /**
   * Fully evaluate a condition
   */
  static async evaluateCondition(
    condition: AlertCondition,
    organizationId: string
  ): Promise<{
    thresholdMet: boolean
    durationMet: boolean
    currentValue: number
  }> {
    // Get current metric value
    const currentValue = await MetricsCollector.getMetricValue(condition.metric, organizationId)

    // Check if threshold is met
    const thresholdMet = this.evaluateThreshold(currentValue, condition.operator, condition.threshold)

    if (!thresholdMet || !condition.duration) {
      // If threshold not met or no duration requirement, return early
      return {
        thresholdMet,
        durationMet: !condition.duration,
        currentValue,
      }
    }

    // Get historical data for duration validation
    const history = await MetricsCollector.getMetricHistory(
      condition.metric,
      organizationId,
      condition.duration
    )

    // Check if condition is sustained for duration
    const durationMet = this.evaluateDuration(
      history,
      condition.operator,
      condition.threshold,
      condition.duration
    )

    return {
      thresholdMet,
      durationMet,
      currentValue,
    }
  }
}

// =============================================================================
// NOTIFICATION DISPATCHER
// =============================================================================

class NotificationDispatcher {
  /**
   * Send email notification
   */
  static async sendEmailNotification(
    recipients: string[],
    alertName: string,
    metric: string,
    value: number,
    threshold: number
  ): Promise<NotificationResult> {
    try {
      // In production, use SendGrid/SMTP
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/notifications/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipients,
          subject: `🚨 Alert: ${alertName}`,
          message: `
            <h2>${alertName}</h2>
            <p><strong>Metric:</strong> ${metric}</p>
            <p><strong>Current Value:</strong> ${value.toFixed(2)}</p>
            <p><strong>Threshold:</strong> ${threshold}</p>
            <p><strong>Time:</strong> ${new Date().toISOString()}</p>
          `,
        }),
      })

      if (!response.ok) {
        return { channel: 'email', status: 'failed', error: `HTTP ${response.status}` }
      }

      return { channel: 'email', status: 'sent' }
    } catch (error) {
      return {
        channel: 'email',
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Send Slack notification
   */
  static async sendSlackNotification(
    webhookUrl: string,
    alertName: string,
    metric: string,
    value: number,
    threshold: number
  ): Promise<NotificationResult> {
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `🚨 *${alertName}*`,
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `*Alert:* ${alertName}\n*Metric:* ${metric}\n*Value:* ${value.toFixed(2)}\n*Threshold:* ${threshold}`,
              },
            },
            {
              type: 'context',
              elements: [
                {
                  type: 'mrkdwn',
                  text: `_${new Date().toISOString()}_`,
                },
              ],
            },
          ],
        }),
      })

      if (!response.ok) {
        return { channel: 'slack', status: 'failed', error: `HTTP ${response.status}` }
      }

      return { channel: 'slack', status: 'sent' }
    } catch (error) {
      return {
        channel: 'slack',
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Create in-app notification
   */
  static async createInAppNotification(
    organizationId: string,
    alertName: string,
    metric: string,
    value: number,
    threshold: number
  ): Promise<NotificationResult> {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/notifications/inapp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId,
          type: 'alert',
          title: alertName,
          message: `${metric} exceeded threshold: ${value.toFixed(2)} > ${threshold}`,
          severity: 'high',
          timestamp: new Date().toISOString(),
        }),
      })

      if (!response.ok) {
        return { channel: 'inApp', status: 'failed', error: `HTTP ${response.status}` }
      }

      return { channel: 'inApp', status: 'sent' }
    } catch (error) {
      return {
        channel: 'inApp',
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Send webhook notification
   */
  static async sendWebhookNotification(
    webhookUrl: string,
    alertName: string,
    metric: string,
    value: number,
    threshold: number
  ): Promise<NotificationResult> {
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'alert',
          alertName,
          metric,
          currentValue: value,
          threshold,
          timestamp: new Date().toISOString(),
        }),
      })

      if (!response.ok) {
        return { channel: 'webhook', status: 'failed', error: `HTTP ${response.status}` }
      }

      return { channel: 'webhook', status: 'sent' }
    } catch (error) {
      return {
        channel: 'webhook',
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Dispatch notifications through configured channels
   */
  static async dispatchNotifications(
    actions: AlertActions,
    alertName: string,
    metric: string,
    value: number,
    threshold: number,
    organizationId: string
  ): Promise<NotificationResult[]> {
    const results: NotificationResult[] = []

    // Email notifications
    if (actions.email && actions.email.length > 0) {
      const result = await this.sendEmailNotification(actions.email, alertName, metric, value, threshold)
      results.push(result)
    }

    // Slack notification
    if (actions.slack) {
      const result = await this.sendSlackNotification(actions.slack, alertName, metric, value, threshold)
      results.push(result)
    }

    // In-app notification
    if (actions.inApp) {
      const result = await this.createInAppNotification(organizationId, alertName, metric, value, threshold)
      results.push(result)
    }

    // Webhook notification
    if (actions.webhook) {
      const result = await this.sendWebhookNotification(actions.webhook, alertName, metric, value, threshold)
      results.push(result)
    }

    return results
  }
}

// =============================================================================
// ALERT RULE ENGINE (MAIN)
// =============================================================================

export class AlertRuleEngine {
  /**
   * Check if enough time has passed since last notification
   */
  private static shouldNotify(
    lastNotifiedAt: Date | null,
    frequency: 'immediate' | 'once_per_hour' | 'once_per_day'
  ): boolean {
    if (!lastNotifiedAt) {
      return true // First time
    }

    const now = new Date()
    const timeSinceLastNotification = now.getTime() - lastNotifiedAt.getTime()

    switch (frequency) {
      case 'immediate':
        return true // Always notify
      case 'once_per_hour':
        return timeSinceLastNotification >= 60 * 60 * 1000 // 1 hour
      case 'once_per_day':
        return timeSinceLastNotification >= 24 * 60 * 60 * 1000 // 24 hours
      default:
        return true
    }
  }

  /**
   * Evaluate a single alert rule and trigger if conditions are met
   */
  static async evaluateRule(rule: AlertRule): Promise<AlertTriggerResult> {
    // Evaluate condition
    const evaluation = await ConditionEvaluator.evaluateCondition(rule.condition, rule.organization_id)

    const shouldTrigger = evaluation.thresholdMet && evaluation.durationMet

    const result: AlertTriggerResult = {
      ruleName: rule.name,
      ruleId: rule.id,
      triggered: shouldTrigger,
      metric: rule.condition.metric,
      currentValue: evaluation.currentValue,
      threshold: rule.condition.threshold,
      durationMet: evaluation.durationMet,
      notifications: [],
    }

    // If condition not met, return early
    if (!shouldTrigger) {
      return result
    }

    // Check notification frequency
    const lastNotifiedAt = rule.last_notified_at ? new Date(rule.last_notified_at) : null
    if (!this.shouldNotify(lastNotifiedAt, rule.notify_frequency)) {
      // Condition met but notification frequency not satisfied
      return {
        ...result,
        triggered: false, // Don't consider it a "new" trigger for notification purposes
      }
    }

    // Dispatch notifications
    const notifications = await NotificationDispatcher.dispatchNotifications(
      rule.actions,
      rule.name,
      rule.condition.metric,
      evaluation.currentValue,
      rule.condition.threshold,
      rule.organization_id
    )

    result.notifications = notifications

    // Store execution history
    await this.storeExecutionHistory(rule, evaluation, notifications)

    return result
  }

  /**
   * Evaluate all active alert rules for an organization
   */
  static async evaluateOrganizationRules(organizationId: string): Promise<AlertTriggerResult[]> {
    const supabase = createServerComponentClient({
      cookies,
    })

    try {
      // Fetch all active rules for organization
      const { data: rules, error } = await supabase
        .from('alert_rules')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('enabled', true)

      if (error) {
        console.error('Error fetching alert rules:', error)
        return []
      }

      // Evaluate each rule
      const results = await Promise.all(
        (rules || []).map((rule) => this.evaluateRule(rule as AlertRule))
      )

      return results
    } catch (error) {
      console.error('Error evaluating organization rules:', error)
      return []
    }
  }

  /**
   * Store alert execution history
   */
  private static async storeExecutionHistory(
    rule: AlertRule,
    evaluation: {
      thresholdMet: boolean
      durationMet: boolean
      currentValue: number
    },
    notifications: NotificationResult[]
  ): Promise<void> {
    const supabase = createServerComponentClient({
      cookies,
    })

    const successfulNotifications = notifications.filter((n) => n.status === 'sent').length

    try {
      await supabase.from('alert_execution_history').insert({
        organization_id: rule.organization_id,
        alert_rule_id: rule.id,
        triggered_at: new Date(),
        metric_name: rule.condition.metric,
        metric_value: evaluation.currentValue,
        threshold_value: rule.condition.threshold,
        condition_met: evaluation.thresholdMet,
        duration_met: evaluation.durationMet,
        status: successfulNotifications > 0 ? 'notified' : 'failed',
        notifications_sent: successfulNotifications,
        notification_details: notifications,
      })

      // Update rule's last_triggered_at and last_notified_at
      if (evaluation.thresholdMet) {
        await supabase
          .from('alert_rules')
          .update({
            last_triggered_at: new Date(),
            last_notified_at: successfulNotifications > 0 ? new Date() : rule.last_notified_at,
          })
          .eq('id', rule.id)
      }
    } catch (error) {
      console.error('Error storing execution history:', error)
    }
  }

  /**
   * Manually test an alert rule
   */
  static async testRule(rule: AlertRule): Promise<AlertTriggerResult> {
    return this.evaluateRule(rule)
  }
}

// =============================================================================
// EXPORT
// =============================================================================

export default AlertRuleEngine
