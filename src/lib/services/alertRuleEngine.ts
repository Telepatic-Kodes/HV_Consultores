// @ts-nocheck — temporary: types need update after Convex migration
/**
 * Alert Rule Engine
 * Phase 7 Week 3: Real-time alert condition evaluation and notification dispatch
 * Created: 2026-01-11
 */
// TODO: Phase 2 - Implement alert rule engine in Convex
// Tables needed: alert_rules, alert_execution_history

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
    // Stub: returns mock values
    const mockMetrics: Record<string, number> = {
      queueDepth: 0,
      errorRate: 0,
      latency: 0,
      cpuUsage: 0,
      complianceScore: 100,
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
    // Stub: returns empty history
    return []
  }
}

// =============================================================================
// CONDITION EVALUATION ENGINE (pure logic, no Supabase dependency)
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
        return Math.abs(value - threshold) < 0.001
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
      return true
    }

    const recentReadings = readings.slice(-durationMinutes)

    const allExceed = recentReadings.every((reading) =>
      this.evaluateThreshold(reading.value, operator, threshold)
    )

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
    const currentValue = await MetricsCollector.getMetricValue(condition.metric, organizationId)

    const thresholdMet = this.evaluateThreshold(currentValue, condition.operator, condition.threshold)

    if (!thresholdMet || !condition.duration) {
      return {
        thresholdMet,
        durationMet: !condition.duration,
        currentValue,
      }
    }

    const history = await MetricsCollector.getMetricHistory(
      condition.metric,
      organizationId,
      condition.duration
    )

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
// NOTIFICATION DISPATCHER (pure logic, no Supabase dependency)
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
    // Stub: returns pending status
    return { channel: 'email', status: 'pending', error: 'Not configured in demo mode' }
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
    // Stub: returns pending status
    return { channel: 'slack', status: 'pending', error: 'Not configured in demo mode' }
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
    // Stub: returns pending status
    return { channel: 'inApp', status: 'pending', error: 'Not configured in demo mode' }
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
    // Stub: returns pending status
    return { channel: 'webhook', status: 'pending', error: 'Not configured in demo mode' }
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

    if (actions.email && actions.email.length > 0) {
      const result = await this.sendEmailNotification(actions.email, alertName, metric, value, threshold)
      results.push(result)
    }

    if (actions.slack) {
      const result = await this.sendSlackNotification(actions.slack, alertName, metric, value, threshold)
      results.push(result)
    }

    if (actions.inApp) {
      const result = await this.createInAppNotification(organizationId, alertName, metric, value, threshold)
      results.push(result)
    }

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
      return true
    }

    const now = new Date()
    const timeSinceLastNotification = now.getTime() - lastNotifiedAt.getTime()

    switch (frequency) {
      case 'immediate':
        return true
      case 'once_per_hour':
        return timeSinceLastNotification >= 60 * 60 * 1000
      case 'once_per_day':
        return timeSinceLastNotification >= 24 * 60 * 60 * 1000
      default:
        return true
    }
  }

  /**
   * Evaluate a single alert rule and trigger if conditions are met
   */
  static async evaluateRule(rule: AlertRule): Promise<AlertTriggerResult> {
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

    if (!shouldTrigger) {
      return result
    }

    const lastNotifiedAt = rule.last_notified_at ? new Date(rule.last_notified_at) : null
    if (!this.shouldNotify(lastNotifiedAt, rule.notify_frequency)) {
      return {
        ...result,
        triggered: false,
      }
    }

    const notifications = await NotificationDispatcher.dispatchNotifications(
      rule.actions,
      rule.name,
      rule.condition.metric,
      evaluation.currentValue,
      rule.condition.threshold,
      rule.organization_id
    )

    result.notifications = notifications

    return result
  }

  /**
   * Evaluate all active alert rules for an organization
   */
  static async evaluateOrganizationRules(organizationId: string): Promise<AlertTriggerResult[]> {
    // Stub: returns empty results until Convex module is implemented
    return []
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
    // Stub: no-op until Convex module is implemented
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
