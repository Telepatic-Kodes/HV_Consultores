// @ts-nocheck — temporary: types need update after Convex migration
/**
 * Report Generator Service
 * Phase 7 Week 3: Real-time report generation and multi-channel delivery
 * Created: 2026-01-11
 */

import { createClient } from '@/lib/supabase-server'
// cookies import removed — using Convex backend (demo mode)

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export interface ReportSchedule {
  id: string
  organization_id: string
  name: string
  description?: string
  enabled: boolean
  schedule_type: 'daily' | 'weekly' | 'monthly'
  schedule_config: {
    time: string
    dayOfWeek?: number
    dayOfMonth?: number
  }
  dashboards: string[]
  format: 'pdf' | 'excel' | 'html'
  include_charts: boolean
  include_data_table: boolean
  recipients: {
    email?: string[]
    slack?: string
    webhook?: string
  }
  last_generated_at?: Date
  last_sent_at?: Date
  next_scheduled_at?: Date
  created_at: Date
  updated_at: Date
}

export interface ReportData {
  title: string
  generatedAt: Date
  dashboards: {
    documents?: Record<string, unknown>
    automation?: Record<string, unknown>
    team?: Record<string, unknown>
    queue?: Record<string, unknown>
    compliance?: Record<string, unknown>
  }
}

export interface ReportDeliveryResult {
  scheduleId: string
  reportId: string
  status: 'delivered' | 'partial' | 'failed'
  generatedAt: Date
  deliveryDetails: {
    email?: { status: 'sent' | 'failed'; recipients?: number }
    slack?: { status: 'sent' | 'failed' }
    webhook?: { status: 'sent' | 'failed' }
  }
  generationTimeMs: number
  fileSizeBytes: number
}

// =============================================================================
// METRICS AGGREGATION SERVICE
// =============================================================================

class MetricsAggregator {
  /**
   * Get document analytics data
   */
  static async getDocumentMetrics(organizationId: string): Promise<Record<string, unknown>> {
    // In production, query analytics_document_daily table
    return {
      totalDocuments: 2450,
      activeDocuments: 2100,
      archivedDocuments: 320,
      avgDocumentAge: 145,
      storageUsedGb: 125.5,
      uploadCountToday: 42,
      documentTypes: {
        pdf: 1200,
        docx: 800,
        xlsx: 300,
        other: 150,
      },
    }
  }

  /**
   * Get automation analytics data
   */
  static async getAutomationMetrics(organizationId: string): Promise<Record<string, unknown>> {
    return {
      activeRules: 45,
      successRate: 98.5,
      totalExecutions: 12450,
      failedExecutions: 187,
      avgExecutionTime: 2.3,
      hoursPerMonthSaved: 156,
      topRules: [
        { name: 'Archive Old Documents', successRate: 99.8, executions: 4200 },
        { name: 'Email Notifications', successRate: 98.2, executions: 3800 },
      ],
    }
  }

  /**
   * Get team analytics data
   */
  static async getTeamMetrics(organizationId: string): Promise<Record<string, unknown>> {
    return {
      totalUsers: 24,
      activeUsers: 20,
      peakActivityHour: 10,
      avgSessionDuration: 45,
      collaborationScore: 78,
      topPerformers: [
        { name: 'Alice Johnson', actions: 450 },
        { name: 'Bob Smith', actions: 380 },
      ],
      departmentBreakdown: {
        operations: { users: 12, activityScore: 85 },
        management: { users: 8, activityScore: 72 },
        support: { users: 4, activityScore: 68 },
      },
    }
  }

  /**
   * Get queue analytics data
   */
  static async getQueueMetrics(organizationId: string): Promise<Record<string, unknown>> {
    return {
      currentQueueDepth: 42,
      successRate: 99.2,
      avgLatency: 245,
      throughput: 1250,
      p95Latency: 450,
      p99Latency: 850,
      jobsByType: {
        email: { count: 450, successRate: 98.5 },
        webhook: { count: 380, successRate: 99.2 },
        archive: { count: 250, successRate: 99.8 },
        notification: { count: 170, successRate: 97.5 },
      },
      systemHealth: {
        cpuUsage: 35,
        memoryUsage: 48,
        databaseConnections: 12,
      },
    }
  }

  /**
   * Get compliance analytics data
   */
  static async getComplianceMetrics(organizationId: string): Promise<Record<string, unknown>> {
    return {
      overallScore: 84,
      gdrpScore: 85,
      hipaaScore: 88,
      soc2Score: 80,
      iso27001Score: 82,
      frameworks: [
        { name: 'GDPR', score: 85, status: 'compliant', issuesCount: 2 },
        { name: 'HIPAA', score: 88, status: 'compliant', issuesCount: 1 },
        { name: 'SOC2', score: 80, status: 'in-progress', issuesCount: 4 },
        { name: 'ISO27001', score: 82, status: 'compliant', issuesCount: 3 },
      ],
      recentViolations: 2,
      violationTrend: 'stable',
    }
  }

  /**
   * Aggregate all requested dashboard metrics
   */
  static async aggregateMetrics(
    organizationId: string,
    dashboards: string[]
  ): Promise<ReportData['dashboards']> {
    const data: ReportData['dashboards'] = {}

    for (const dashboard of dashboards) {
      switch (dashboard) {
        case 'documents':
          data.documents = await this.getDocumentMetrics(organizationId)
          break
        case 'automation':
          data.automation = await this.getAutomationMetrics(organizationId)
          break
        case 'team':
          data.team = await this.getTeamMetrics(organizationId)
          break
        case 'queue':
          data.queue = await this.getQueueMetrics(organizationId)
          break
        case 'compliance':
          data.compliance = await this.getComplianceMetrics(organizationId)
          break
      }
    }

    return data
  }
}

// =============================================================================
// REPORT FORMATTER SERVICE
// =============================================================================

class ReportFormatter {
  /**
   * Generate HTML report
   */
  static generateHtmlReport(data: ReportData, includeCharts: boolean): string {
    const sections = Object.entries(data.dashboards)
      .map(([dashboard, metrics]) => {
        const title = dashboard.charAt(0).toUpperCase() + dashboard.slice(1)
        const metricsHtml = Object.entries(metrics || {})
          .map(([key, value]) => {
            const displayKey = key.replace(/([A-Z])/g, ' $1').trim()
            const displayValue =
              typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)
            return `<tr><td>${displayKey}</td><td>${displayValue}</td></tr>`
          })
          .join('')

        return `
          <section class="dashboard-section">
            <h2>${title}</h2>
            <table class="metrics-table">
              <thead><tr><th>Metric</th><th>Value</th></tr></thead>
              <tbody>${metricsHtml}</tbody>
            </table>
          </section>
        `
      })
      .join('')

    return `
<!DOCTYPE html>
<html>
<head>
  <title>${data.title}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
    h1 { color: #2c3e50; border-bottom: 3px solid #3498db; padding-bottom: 10px; }
    h2 { color: #34495e; margin-top: 30px; }
    .dashboard-section { margin-bottom: 40px; page-break-inside: avoid; }
    .metrics-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    .metrics-table th { background-color: #3498db; color: white; padding: 10px; text-align: left; }
    .metrics-table td { padding: 8px; border-bottom: 1px solid #ecf0f1; }
    .metrics-table tr:hover { background-color: #f8f9fa; }
    .report-header { background-color: #ecf0f1; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
    .timestamp { color: #7f8c8d; font-size: 12px; }
  </style>
</head>
<body>
  <h1>${data.title}</h1>
  <div class="report-header">
    <p><strong>Generated:</strong> ${data.generatedAt.toLocaleString()}</p>
    <p class="timestamp">This report contains analytics data from your organization's dashboards.</p>
  </div>
  ${sections}
</body>
</html>
    `
  }

  /**
   * Generate CSV/Excel report data
   */
  static generateExcelData(data: ReportData): string {
    let csv = `Report: ${data.title}\nGenerated: ${data.generatedAt.toLocaleString()}\n\n`

    Object.entries(data.dashboards).forEach(([dashboard, metrics]) => {
      csv += `\n${dashboard.toUpperCase()}\n`
      csv += 'Metric,Value\n'

      Object.entries(metrics || {}).forEach(([key, value]) => {
        const displayValue =
          typeof value === 'object' ? JSON.stringify(value) : String(value)
        csv += `"${key}","${displayValue}"\n`
      })
    })

    return csv
  }

  /**
   * Generate PDF report (requires html2pdf library)
   */
  static async generatePdfReport(htmlContent: string): Promise<Buffer> {
    // In production, use html2pdf or similar library
    // For now, return HTML as a placeholder
    return Buffer.from(htmlContent, 'utf-8')
  }
}

// =============================================================================
// NOTIFICATION DELIVERY SERVICE
// =============================================================================

class ReportDeliveryService {
  /**
   * Send report via email
   */
  static async sendEmailReport(
    recipients: string[],
    reportName: string,
    fileBuffer: Buffer,
    fileName: string
  ): Promise<{ status: 'sent' | 'failed'; error?: string }> {
    try {
      const formData = new FormData()
      formData.append('recipients', JSON.stringify(recipients))
      formData.append('subject', `Report: ${reportName}`)
      formData.append('message', `Please find attached your requested report.`)
      formData.append('file', new Blob([fileBuffer]), fileName)

      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/notifications/email`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        return { status: 'failed', error: `HTTP ${response.status}` }
      }

      return { status: 'sent' }
    } catch (error) {
      return {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Send report via Slack
   */
  static async sendSlackReport(
    webhookUrl: string,
    reportName: string,
    downloadUrl: string
  ): Promise<{ status: 'sent' | 'failed'; error?: string }> {
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `📊 ${reportName} Report`,
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `*${reportName} Report*\n_Generated: ${new Date().toLocaleString()}_`,
              },
            },
            {
              type: 'actions',
              elements: [
                {
                  type: 'button',
                  text: { type: 'plain_text', text: 'View Report' },
                  url: downloadUrl,
                },
              ],
            },
          ],
        }),
      })

      if (!response.ok) {
        return { status: 'failed', error: `HTTP ${response.status}` }
      }

      return { status: 'sent' }
    } catch (error) {
      return {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Send report via webhook
   */
  static async sendWebhookReport(
    webhookUrl: string,
    reportName: string,
    data: ReportData
  ): Promise<{ status: 'sent' | 'failed'; error?: string }> {
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'report',
          reportName,
          generatedAt: data.generatedAt,
          data: data.dashboards,
        }),
      })

      if (!response.ok) {
        return { status: 'failed', error: `HTTP ${response.status}` }
      }

      return { status: 'sent' }
    } catch (error) {
      return {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }
}

// =============================================================================
// REPORT GENERATOR ENGINE (MAIN)
// =============================================================================

export class ReportGenerator {
  /**
   * Check if a schedule is due to run
   */
  private static isScheduleDue(schedule: ReportSchedule): boolean {
    const now = new Date()
    const scheduleTime = schedule.schedule_config.time.split(':')
    const scheduleHour = parseInt(scheduleTime[0])
    const scheduleMinute = parseInt(scheduleTime[1])

    const nextScheduled = new Date(now)
    nextScheduled.setHours(scheduleHour, scheduleMinute, 0, 0)

    // If time has passed today, schedule is due
    if (now >= nextScheduled && (!schedule.last_sent_at || new Date(schedule.last_sent_at) < nextScheduled)) {
      // Check frequency requirements
      switch (schedule.schedule_type) {
        case 'daily':
          return true
        case 'weekly':
          const dayOfWeek = schedule.schedule_config.dayOfWeek || 0
          return now.getDay() === dayOfWeek
        case 'monthly':
          const dayOfMonth = schedule.schedule_config.dayOfMonth || 1
          return now.getDate() === dayOfMonth
      }
    }

    return false
  }

  /**
   * Generate a single report
   */
  static async generateReport(schedule: ReportSchedule): Promise<ReportDeliveryResult | null> {
    const startTime = Date.now()

    try {
      // Aggregate metrics from requested dashboards
      const dashboardData = await MetricsAggregator.aggregateMetrics(
        schedule.organization_id,
        schedule.dashboards
      )

      const reportData: ReportData = {
        title: schedule.name,
        generatedAt: new Date(),
        dashboards: dashboardData,
      }

      // Generate report in requested format
      let fileBuffer: Buffer
      let mimeType: string
      let fileName: string

      switch (schedule.format) {
        case 'html': {
          const htmlContent = ReportFormatter.generateHtmlReport(reportData, schedule.include_charts)
          fileBuffer = Buffer.from(htmlContent, 'utf-8')
          mimeType = 'text/html'
          fileName = `${schedule.name}-${Date.now()}.html`
          break
        }
        case 'excel': {
          const csvData = ReportFormatter.generateExcelData(reportData)
          fileBuffer = Buffer.from(csvData, 'utf-8')
          mimeType = 'text/csv'
          fileName = `${schedule.name}-${Date.now()}.csv`
          break
        }
        case 'pdf': {
          const htmlContent = ReportFormatter.generateHtmlReport(reportData, schedule.include_charts)
          fileBuffer = await ReportFormatter.generatePdfReport(htmlContent)
          mimeType = 'application/pdf'
          fileName = `${schedule.name}-${Date.now()}.pdf`
          break
        }
      }

      const generationTimeMs = Date.now() - startTime

      // Deliver report
      const deliveryDetails: ReportDeliveryResult['deliveryDetails'] = {}

      if (schedule.recipients.email && schedule.recipients.email.length > 0) {
        const emailResult = await ReportDeliveryService.sendEmailReport(
          schedule.recipients.email,
          schedule.name,
          fileBuffer,
          fileName
        )
        deliveryDetails.email = {
          status: emailResult.status === 'sent' ? 'sent' : 'failed',
          recipients: schedule.recipients.email.length,
        }
      }

      if (schedule.recipients.slack) {
        const slackResult = await ReportDeliveryService.sendSlackReport(
          schedule.recipients.slack,
          schedule.name,
          `${process.env.NEXT_PUBLIC_APP_URL}/reports/${schedule.id}`
        )
        deliveryDetails.slack = {
          status: slackResult.status === 'sent' ? 'sent' : 'failed',
        }
      }

      if (schedule.recipients.webhook) {
        const webhookResult = await ReportDeliveryService.sendWebhookReport(
          schedule.recipients.webhook,
          schedule.name,
          reportData
        )
        deliveryDetails.webhook = {
          status: webhookResult.status === 'sent' ? 'sent' : 'failed',
        }
      }

      // Store delivery history
      await this.storeDeliveryHistory(schedule, reportData, deliveryDetails, generationTimeMs, fileBuffer.length)

      return {
        scheduleId: schedule.id,
        reportId: `report-${Date.now()}`,
        status: 'delivered',
        generatedAt: reportData.generatedAt,
        deliveryDetails,
        generationTimeMs,
        fileSizeBytes: fileBuffer.length,
      }
    } catch (error) {
      console.error(`Error generating report ${schedule.name}:`, error)
      return null
    }
  }

  /**
   * Generate all due reports for an organization
   */
  static async generateDueReports(organizationId: string): Promise<ReportDeliveryResult[]> {
    const supabase = createClient()

    try {
      // Fetch all enabled schedules
      const { data: schedules, error } = await supabase
        .from('report_schedules')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('enabled', true)

      if (error) {
        console.error('Error fetching report schedules:', error)
        return []
      }

      // Filter schedules that are due
      const dueSchedules = (schedules || []).filter((schedule) => this.isScheduleDue(schedule as ReportSchedule))

      // Generate reports
      const results: ReportDeliveryResult[] = []
      for (const schedule of dueSchedules) {
        const result = await this.generateReport(schedule as ReportSchedule)
        if (result) {
          results.push(result)
        }
      }

      return results
    } catch (error) {
      console.error('Error generating due reports:', error)
      return []
    }
  }

  /**
   * Store delivery history in database
   */
  private static async storeDeliveryHistory(
    schedule: ReportSchedule,
    reportData: ReportData,
    deliveryDetails: ReportDeliveryResult['deliveryDetails'],
    generationTimeMs: number,
    fileSizeBytes: number
  ): Promise<void> {
    const supabase = createClient()

    try {
      await supabase.from('report_delivery_history').insert({
        organization_id: schedule.organization_id,
        report_schedule_id: schedule.id,
        generated_at: reportData.generatedAt,
        generation_time_ms: generationTimeMs,
        file_size_bytes: fileSizeBytes,
        metrics: reportData.dashboards,
        status: 'delivered',
        delivery_details: deliveryDetails,
        successful_deliveries: Object.values(deliveryDetails).filter((d) => d?.status === 'sent').length,
        failed_deliveries: Object.values(deliveryDetails).filter((d) => d?.status === 'failed').length,
        total_recipients: (schedule.recipients.email?.length || 0) + (schedule.recipients.slack ? 1 : 0),
      })

      // Update schedule's last_sent_at
      await supabase
        .from('report_schedules')
        .update({
          last_generated_at: reportData.generatedAt,
          last_sent_at: new Date(),
        })
        .eq('id', schedule.id)
    } catch (error) {
      console.error('Error storing delivery history:', error)
    }
  }

  /**
   * Manually generate a report immediately
   */
  static async generateNow(scheduleId: string, organizationId: string): Promise<ReportDeliveryResult | null> {
    const supabase = createClient()

    try {
      const { data: schedule, error } = await supabase
        .from('report_schedules')
        .select('*')
        .eq('id', scheduleId)
        .eq('organization_id', organizationId)
        .single()

      if (error || !schedule) {
        console.error('Schedule not found:', error)
        return null
      }

      return this.generateReport(schedule as ReportSchedule)
    } catch (error) {
      console.error('Error generating report:', error)
      return null
    }
  }
}

// =============================================================================
// EXPORT
// =============================================================================

export default ReportGenerator
