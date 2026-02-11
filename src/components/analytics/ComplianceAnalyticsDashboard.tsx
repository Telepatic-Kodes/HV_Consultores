// @ts-nocheck — temporary: types need update after Convex migration
'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import {
  ComplianceMetricsSummary,
  AnalyticsFilter,
} from '@/types/analytics'
import {
  CheckCircle,
  AlertCircle,
  Clock,
  Shield,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react'

interface ComplianceAnalyticsDashboardProps {
  organizationId: string
}

const FRAMEWORK_COLORS = {
  GDPR: '#3b82f6',
  HIPAA: '#10b981',
  SOC2: '#f59e0b',
  ISO27001: '#ef4444',
}

const COMPLIANCE_FRAMEWORKS = ['GDPR', 'HIPAA', 'SOC2', 'ISO27001'] as const

export const ComplianceAnalyticsDashboard: React.FC<ComplianceAnalyticsDashboardProps> = ({
  organizationId,
}) => {
  const [metrics, setMetrics] = useState<ComplianceMetricsSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [period, setPeriod] = useState('30d')

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setLoading(true)
        setError(null)

        const endDate = new Date()
        const startDate = new Date()
        switch (period) {
          case '7d':
            startDate.setDate(endDate.getDate() - 7)
            break
          case '30d':
            startDate.setMonth(endDate.getMonth() - 1)
            break
          case '90d':
            startDate.setMonth(endDate.getMonth() - 3)
            break
          case '1y':
            startDate.setFullYear(endDate.getFullYear() - 1)
            break
        }

        const response = await fetch('/api/analytics/compliance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            organizationId,
            dateRange: { startDate, endDate },
            groupBy: 'day',
          } as AnalyticsFilter),
        })

        if (!response.ok) throw new Error('Failed to fetch compliance metrics')

        const data = await response.json()
        setMetrics(data.data)
      } catch (err) {
        console.error('Error fetching metrics:', err)
        setError('Failed to load compliance analytics')
      } finally {
        setLoading(false)
      }
    }

    fetchMetrics()
  }, [organizationId, period])

  if (loading) return <DashboardSkeleton />

  if (error || !metrics) {
    return (
      <Card className='border-destructive'>
        <CardContent className='pt-6'>
          <p className='text-sm text-destructive'>{error || 'No data available'}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-3xl font-bold tracking-tight'>
            Compliance & Audit Reports
          </h2>
          <p className='text-muted-foreground'>
            GDPR, HIPAA, SOC2, and ISO 27001 compliance tracking
          </p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className='w-[180px]'>
            <SelectValue placeholder='Select period' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='7d'>Last 7 days</SelectItem>
            <SelectItem value='30d'>Last 30 days</SelectItem>
            <SelectItem value='90d'>Last 90 days</SelectItem>
            <SelectItem value='1y'>Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Overall Compliance Score */}
      <Card className='bg-gradient-to-br from-blue-50 to-cyan-50'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Shield className='h-5 w-5 text-blue-600' />
            Overall Compliance Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='flex items-baseline gap-4'>
            <span className='text-6xl font-bold text-blue-600'>
              {metrics.overallScore}
            </span>
            <div>
              <span className='text-lg text-muted-foreground'>/100</span>
              <p className='text-sm text-muted-foreground'>
                {metrics.overallScore >= 90
                  ? '✓ Excellent'
                  : metrics.overallScore >= 75
                    ? '⚠ Good'
                    : '✗ Needs Attention'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Framework Compliance Scores */}
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        {COMPLIANCE_FRAMEWORKS.map((framework) => {
          const score = metrics[`${framework.toLowerCase()}Score` as keyof typeof metrics] as number
          const frameworkStatus = metrics.frameworks.find(f => f.framework === framework)

          return (
            <ComplianceScoreCard
              key={framework}
              framework={framework}
              score={score}
              status={frameworkStatus?.status || 'in-progress'}
            />
          )
        })}
      </div>

      {/* Compliance Radar Chart */}
      <Card>
        <CardHeader>
          <CardTitle className='text-lg'>Framework Compliance Radar</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width='100%' height={350}>
            <RadarChart
              data={COMPLIANCE_FRAMEWORKS.map(framework => ({
                name: framework,
                score: metrics[`${framework.toLowerCase()}Score` as keyof typeof metrics],
              }))}
            >
              <PolarGrid strokeDasharray='3 3' />
              <PolarAngleAxis dataKey='name' />
              <PolarRadiusAxis angle={90} domain={[0, 100]} />
              <Radar
                name='Compliance Score'
                dataKey='score'
                stroke='#3b82f6'
                fill='#3b82f6'
                fillOpacity={0.6}
              />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Framework Details Grid */}
      <div className='grid gap-6 md:grid-cols-2'>
        {metrics.frameworks.map((framework) => (
          <Card key={framework.framework}>
            <CardHeader>
              <CardTitle className='text-lg flex items-center justify-between'>
                {framework.framework}
                <StatusBadge status={framework.status} />
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div>
                <div className='flex items-center justify-between mb-2'>
                  <span className='text-sm text-muted-foreground'>Last Audit</span>
                  <span className='text-sm font-medium'>
                    {new Date(framework.lastAudit).toLocaleDateString()}
                  </span>
                </div>
                <div className='flex items-center justify-between'>
                  <span className='text-sm text-muted-foreground'>Next Audit</span>
                  <span className='text-sm font-medium'>
                    {new Date(framework.nextAudit).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className='border-t pt-4'>
                <div className='flex items-center justify-between mb-2'>
                  <span className='text-sm font-medium'>Issues Found</span>
                  <span className='text-lg font-bold text-red-600'>
                    {framework.issues}
                  </span>
                </div>
                <div className='flex items-center justify-between'>
                  <span className='text-sm font-medium'>Resolved</span>
                  <span className='text-lg font-bold text-green-600'>
                    {framework.resolved}
                  </span>
                </div>
              </div>

              <div className='h-2 w-full overflow-hidden rounded-full bg-muted'>
                <div
                  className='h-full bg-gradient-to-r from-green-500 to-emerald-500'
                  style={{
                    width: `${(framework.resolved / Math.max(framework.issues, 1)) * 100}%`,
                  }}
                />
              </div>
              <p className='text-xs text-muted-foreground'>
                {framework.resolved} of {framework.issues} issues resolved
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Violations */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <AlertTriangle className='h-5 w-5 text-amber-600' />
            Recent Violations & Findings
          </CardTitle>
        </CardHeader>
        <CardContent>
          {metrics.recentViolations.length > 0 ? (
            <div className='space-y-3'>
              {metrics.recentViolations.map((violation) => (
                <div key={violation.id} className='border rounded-lg p-3'>
                  <div className='flex items-start justify-between gap-2'>
                    <div className='flex-1'>
                      <div className='flex items-center gap-2'>
                        <span className='text-xs font-semibold text-white bg-gray-700 px-2 py-1 rounded'>
                          {violation.framework}
                        </span>
                        <SeverityBadge severity={violation.severity} />
                      </div>
                      <p className='mt-2 text-sm font-medium'>{violation.description}</p>
                      <p className='mt-1 text-xs text-muted-foreground'>
                        Detected: {new Date(violation.detectedDate).toLocaleDateString()}
                        {violation.resolvedDate && ` • Resolved: ${new Date(violation.resolvedDate).toLocaleDateString()}`}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className='flex items-center justify-center py-8'>
              <div className='text-center'>
                <CheckCircle className='h-12 w-12 text-green-500 mx-auto mb-2' />
                <p className='text-sm font-medium'>No violations found</p>
                <p className='text-xs text-muted-foreground'>Your organization is in good standing</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Violation Timeline */}
      {metrics.violationTrendLast30Days && metrics.violationTrendLast30Days.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className='text-lg'>Violation Trend (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width='100%' height={300}>
              <LineChart data={metrics.violationTrendLast30Days}>
                <CartesianGrid strokeDasharray='3 3' />
                <XAxis
                  dataKey='date'
                  tickFormatter={(date) =>
                    new Date(date).toLocaleDateString('es-ES', {
                      month: 'short',
                      day: 'numeric',
                    })
                  }
                />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type='monotone'
                  dataKey='count'
                  stroke='#ef4444'
                  name='New Violations'
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Control Implementation Status */}
      <Card>
        <CardHeader>
          <CardTitle className='text-lg'>Control Implementation Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            <div>
              <div className='flex items-center justify-between mb-2'>
                <span className='text-sm font-medium'>Total Controls</span>
                <span className='text-sm font-bold'>{metrics.controlStatus.total}</span>
              </div>
              <div className='h-2 w-full overflow-hidden rounded-full bg-muted'>
                <div
                  className='h-full bg-blue-500'
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            <div>
              <div className='flex items-center justify-between mb-2'>
                <span className='text-sm font-medium'>Implemented</span>
                <span className='text-sm font-bold'>{metrics.controlStatus.implemented}</span>
              </div>
              <div className='h-2 w-full overflow-hidden rounded-full bg-muted'>
                <div
                  className='h-full bg-green-500'
                  style={{
                    width: `${(metrics.controlStatus.implemented / metrics.controlStatus.total) * 100}%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className='flex items-center justify-between mb-2'>
                <span className='text-sm font-medium'>Tested</span>
                <span className='text-sm font-bold'>{metrics.controlStatus.tested}</span>
              </div>
              <div className='h-2 w-full overflow-hidden rounded-full bg-muted'>
                <div
                  className='h-full bg-amber-500'
                  style={{
                    width: `${(metrics.controlStatus.tested / metrics.controlStatus.total) * 100}%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className='flex items-center justify-between mb-2'>
                <span className='text-sm font-medium'>Compliant</span>
                <span className='text-sm font-bold'>{metrics.controlStatus.compliant}</span>
              </div>
              <div className='h-2 w-full overflow-hidden rounded-full bg-muted'>
                <div
                  className='h-full bg-emerald-500'
                  style={{
                    width: `${(metrics.controlStatus.compliant / metrics.controlStatus.total) * 100}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Compliance Insights */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <TrendingUp className='h-5 w-5 text-blue-600' />
            Compliance Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='space-y-3'>
            <div className='flex items-start gap-3'>
              <span className='text-green-500 mt-1'>✓</span>
              <div>
                <p className='text-sm font-medium'>Overall Score Status</p>
                <p className='text-xs text-muted-foreground'>
                  {metrics.overallScore >= 90
                    ? 'Your organization maintains excellent compliance across all frameworks.'
                    : metrics.overallScore >= 75
                      ? 'Good compliance status. Focus on addressing remaining findings.'
                      : 'Action required. Multiple frameworks need attention.'}
                </p>
              </div>
            </div>

            <div className='flex items-start gap-3'>
              <span className='text-blue-500 mt-1'>ℹ</span>
              <div>
                <p className='text-sm font-medium'>Upcoming Audits</p>
                <p className='text-xs text-muted-foreground'>
                  {metrics.frameworks.some(f => new Date(f.nextAudit) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))
                    ? 'You have audits scheduled within the next 30 days.'
                    : 'No audits scheduled in the next 30 days.'}
                </p>
              </div>
            </div>

            <div className='flex items-start gap-3'>
              <span className='text-amber-500 mt-1'>⚠</span>
              <div>
                <p className='text-sm font-medium'>Active Violations</p>
                <p className='text-xs text-muted-foreground'>
                  {metrics.recentViolations.some(v => !v.resolvedDate)
                    ? `${metrics.recentViolations.filter(v => !v.resolvedDate).length} unresolved violation(s) require immediate attention.`
                    : 'All violations have been resolved.'}
                </p>
              </div>
            </div>

            <div className='flex items-start gap-3'>
              <span className='text-purple-500 mt-1'>→</span>
              <div>
                <p className='text-sm font-medium'>Control Implementation</p>
                <p className='text-xs text-muted-foreground'>
                  {Math.round((metrics.controlStatus.compliant / metrics.controlStatus.total) * 100)}% of controls are fully compliant.
                  {metrics.controlStatus.compliant < metrics.controlStatus.total && ' Consider prioritizing remaining controls.'}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Export Compliance Report</CardTitle>
        </CardHeader>
        <CardContent className='flex gap-2'>
          <Button variant='outline'>Export as PDF</Button>
          <Button variant='outline'>Export as Excel</Button>
          <Button variant='outline'>Export Audit Trail</Button>
        </CardContent>
      </Card>
    </div>
  )
}

// Metric Card Component
interface ComplianceScoreCardProps {
  framework: string
  score: number
  status: 'compliant' | 'non-compliant' | 'in-progress'
}

const ComplianceScoreCard: React.FC<ComplianceScoreCardProps> = ({
  framework,
  score,
  status,
}) => {
  const statusColor =
    status === 'compliant'
      ? 'text-green-600'
      : status === 'non-compliant'
        ? 'text-red-600'
        : 'text-amber-600'

  const statusIcon =
    status === 'compliant' ? '✓' : status === 'non-compliant' ? '✗' : '⟳'

  return (
    <Card>
      <CardContent className='pt-6'>
        <div className='flex items-start justify-between'>
          <div className='space-y-1'>
            <p className='text-sm text-muted-foreground'>{framework}</p>
            <p className='text-2xl font-bold'>{score}</p>
            <p className={`text-xs font-medium ${statusColor}`}>
              {statusIcon} {status.replace('-', ' ')}
            </p>
          </div>
          <Shield className='h-5 w-5 text-muted-foreground' />
        </div>
      </CardContent>
    </Card>
  )
}

// Status Badge Component
interface StatusBadgeProps {
  status: 'compliant' | 'non-compliant' | 'in-progress'
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const styles = {
    compliant: 'bg-green-100 text-green-800',
    'non-compliant': 'bg-red-100 text-red-800',
    'in-progress': 'bg-amber-100 text-amber-800',
  }

  return (
    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${styles[status]}`}>
      {status.replace('-', ' ')}
    </span>
  )
}

// Severity Badge Component
interface SeverityBadgeProps {
  severity: 'high' | 'medium' | 'low'
}

const SeverityBadge: React.FC<SeverityBadgeProps> = ({ severity }) => {
  const styles = {
    high: 'bg-red-100 text-red-800',
    medium: 'bg-amber-100 text-amber-800',
    low: 'bg-blue-100 text-blue-800',
  }

  return (
    <span className={`text-xs font-semibold px-2 py-1 rounded ${styles[severity]}`}>
      {severity} severity
    </span>
  )
}

// Loading Skeleton
const DashboardSkeleton = () => (
  <div className='space-y-6'>
    <Skeleton className='h-10 w-64' />
    <Skeleton className='h-32 w-full' />
    <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
      {[...Array(4)].map((_, i) => (
        <Card key={i}>
          <CardContent className='pt-6'>
            <Skeleton className='h-20 w-full' />
          </CardContent>
        </Card>
      ))}
    </div>
    <div className='grid gap-6 md:grid-cols-2'>
      {[...Array(2)].map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className='h-6 w-32' />
          </CardHeader>
          <CardContent>
            <Skeleton className='h-64 w-full' />
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
)
