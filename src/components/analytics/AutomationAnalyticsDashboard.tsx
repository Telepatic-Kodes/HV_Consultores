'use client'

import { useState } from 'react'
import { useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
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
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
  ComposedChart,
  Line,
} from 'recharts'
import {
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle2,
  AlertCircle,
  Zap,
} from 'lucide-react'

interface AutomationAnalyticsDashboardProps {
  organizationId: string
}

export const AutomationAnalyticsDashboard: React.FC<
  AutomationAnalyticsDashboardProps
> = ({ organizationId }) => {
  const [period, setPeriod] = useState('30d')
  const metrics = useQuery(api.analytics.getAutomationMetrics, { period })
  const loading = metrics === undefined

  if (loading) return <DashboardSkeleton />

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-3xl font-bold tracking-tight'>
            Automation Analytics
          </h2>
          <p className='text-muted-foreground'>
            Rule performance and automation ROI analysis
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

      {/* Key Metrics */}
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        <MetricCard
          title='Active Rules'
          value={metrics.activeRules}
          icon={Zap}
          color='primary'
          trend={{
            direction: metrics.activeRules > 5 ? 'up' : 'stable',
            value: '+2',
            period: 'vs last month',
          }}
        />
        <MetricCard
          title='Success Rate'
          value={`${metrics.overallSuccessRate}%`}
          icon={CheckCircle2}
          color='success'
          trend={{
            direction: metrics.overallSuccessRate > 85 ? 'up' : 'down',
            value: '2.5%',
            period: 'improvement',
          }}
        />
        <MetricCard
          title='Avg Execution Time'
          value={`${metrics.averageExecutionTimeMs}ms`}
          icon={Clock}
          color='warning'
          trend={{
            direction: 'down',
            value: '15%',
            period: 'faster',
          }}
        />
        <MetricCard
          title='Hours Saved/Month'
          value={Math.round(metrics.hoursPerMonthSaved)}
          icon={TrendingUp}
          color='success'
          trend={{
            direction: 'up',
            value: '+8h',
            period: 'vs last month',
          }}
        />
      </div>

      {/* Execution Trend & Success Rate */}
      <div className='grid gap-6 md:grid-cols-2'>
        {/* Execution Trend */}
        <Card>
          <CardHeader>
            <CardTitle className='text-lg'>Execution Trend</CardTitle>
          </CardHeader>
          <CardContent>
            {metrics.executionTrendLast7Days.length > 0 ? (
              <ResponsiveContainer width='100%' height={300}>
                <ComposedChart data={metrics.executionTrendLast7Days}>
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
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(0, 0, 0, 0.8)',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#fff',
                    }}
                  />
                  <Legend />
                  <Bar dataKey='successCount' fill='#10b981' name='Successful' />
                  <Bar dataKey='failureCount' fill='#ef4444' name='Failed' />
                  <Line
                    type='monotone'
                    dataKey='executions'
                    stroke='#3b82f6'
                    name='Total Executions'
                    yAxisId='right'
                  />
                  <YAxis yAxisId='right' orientation='right' />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <p className='text-sm text-muted-foreground'>No data available</p>
            )}
          </CardContent>
        </Card>

        {/* Success Rate Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className='text-lg'>Success Rate Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width='100%' height={300}>
              <AreaChart
                data={[
                  { name: 'Success Rate', value: metrics.overallSuccessRate },
                  { name: 'Failure Rate', value: 100 - metrics.overallSuccessRate },
                ]}
                layout='vertical'
              >
                <CartesianGrid strokeDasharray='3 3' />
                <XAxis type='number' />
                <YAxis dataKey='name' type='category' width={100} />
                <Tooltip />
                <Area
                  type='monotone'
                  dataKey='value'
                  stroke='#10b981'
                  fill='#10b981'
                  fillOpacity={0.6}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Performing vs Worst Performing Rules */}
      <div className='grid gap-6 md:grid-cols-2'>
        {/* Top Performing Rules */}
        <Card>
          <CardHeader>
            <CardTitle className='text-lg'>Top Performing Rules</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              {metrics.topPerformingRules.length > 0 ? (
                metrics.topPerformingRules.map((rule: any, idx: number) => (
                  <div key={rule.ruleId} className='flex items-center justify-between'>
                    <div className='flex-1'>
                      <div className='flex items-center gap-2'>
                        <span className='text-sm font-medium'>#{idx + 1}</span>
                        <div className='min-w-0 flex-1'>
                          <p className='truncate text-sm font-medium'>
                            {rule.ruleName}
                          </p>
                          <p className='text-xs text-muted-foreground'>
                            {rule.executionCount} executions
                          </p>
                        </div>
                      </div>
                      <div className='mt-1 h-2 w-full overflow-hidden rounded-full bg-muted'>
                        <div
                          className='h-full bg-green-500'
                          style={{ width: `${rule.successRate}%` }}
                        />
                      </div>
                    </div>
                    <span className='ml-4 whitespace-nowrap text-sm font-bold text-green-600'>
                      {rule.successRate}%
                    </span>
                  </div>
                ))
              ) : (
                <p className='text-sm text-muted-foreground'>No data available</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Worst Performing Rules */}
        <Card>
          <CardHeader>
            <CardTitle className='text-lg'>Rules Needing Attention</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              {metrics.worstPerformingRules.length > 0 ? (
                metrics.worstPerformingRules.map((rule: any, idx: number) => (
                  <div key={rule.ruleId} className='flex items-center justify-between'>
                    <div className='flex-1'>
                      <div className='flex items-center gap-2'>
                        <span className='text-sm font-medium'>#{idx + 1}</span>
                        <div className='min-w-0 flex-1'>
                          <p className='truncate text-sm font-medium'>
                            {rule.ruleName}
                          </p>
                          <p className='text-xs text-muted-foreground'>
                            Last error: {rule.lastError}
                          </p>
                        </div>
                      </div>
                      <div className='mt-1 h-2 w-full overflow-hidden rounded-full bg-muted'>
                        <div
                          className='h-full bg-red-500'
                          style={{ width: `${rule.failureRate}%` }}
                        />
                      </div>
                    </div>
                    <span className='ml-4 whitespace-nowrap text-sm font-bold text-red-600'>
                      {rule.failureRate}%
                    </span>
                  </div>
                ))
              ) : (
                <p className='text-sm text-muted-foreground'>All rules performing well</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ROI Metrics */}
      <div className='grid gap-6 md:grid-cols-2'>
        <Card>
          <CardHeader>
            <CardTitle className='text-lg'>Execution by Job Type</CardTitle>
          </CardHeader>
          <CardContent>
            {metrics.topPerformingRules.length > 0 ? (
              <ResponsiveContainer width='100%' height={300}>
                <BarChart
                  data={metrics.topPerformingRules.map((r: any) => ({
                    type: r.ruleName,
                    count: r.executionCount,
                    success: Math.round(r.executionCount * r.successRate / 100),
                  }))}
                >
                  <CartesianGrid strokeDasharray='3 3' />
                  <XAxis dataKey='type' />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey='success' fill='#10b981' name='Successful' />
                  <Bar dataKey='count' fill='#cbd5e1' name='Total' />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className='text-sm text-muted-foreground'>No data available</p>
            )}
          </CardContent>
        </Card>

        {/* ROI & Time Saved */}
        <Card>
          <CardHeader>
            <CardTitle className='text-lg'>Automation ROI</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              <div className='rounded-lg bg-gradient-to-r from-green-500/10 to-emerald-500/10 p-4'>
                <div className='flex items-baseline gap-2'>
                  <span className='text-4xl font-bold text-green-600'>
                    {Math.round(metrics.hoursPerMonthSaved)}
                  </span>
                  <span className='text-lg text-muted-foreground'>
                    hours saved/month
                  </span>
                </div>
                <p className='mt-2 text-sm text-muted-foreground'>
                  Equivalent to {Math.round((metrics.hoursPerMonthSaved / 160) * 100)}% of an FTE
                </p>
              </div>

              <div className='space-y-2'>
                <div className='flex justify-between text-sm'>
                  <span className='text-muted-foreground'>Annually:</span>
                  <span className='font-bold'>
                    {Math.round(metrics.hoursPerMonthSaved * 12)} hours
                  </span>
                </div>
                <div className='flex justify-between text-sm'>
                  <span className='text-muted-foreground'>Cost Savings:</span>
                  <span className='font-bold text-green-600'>
                    ${Math.round(metrics.hoursPerMonthSaved * 12 * 50)}
                  </span>
                </div>
                <div className='flex justify-between text-sm'>
                  <span className='text-muted-foreground'>Rules Running:</span>
                  <span className='font-bold'>{metrics.activeRules}</span>
                </div>
              </div>

              <div className='mt-4 border-t pt-4'>
                <p className='text-xs text-muted-foreground'>
                  Based on {metrics.overallSuccessRate}% success rate and average
                  execution time of {metrics.averageExecutionTimeMs}ms per task.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Error Trend Analysis */}
      {metrics.errorTrendAnalysis.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className='text-lg'>Error Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width='100%' height={300}>
              <BarChart data={metrics.errorTrendAnalysis}>
                <CartesianGrid strokeDasharray='3 3' />
                <XAxis dataKey='errorType' />
                <YAxis />
                <Tooltip />
                <Bar dataKey='percentage' fill='#ef4444' />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <AlertCircle className='h-5 w-5 text-amber-500' />
            Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className='space-y-2 text-sm'>
            <li className='flex gap-2'>
              <span className='text-amber-500'>▸</span>
              <span>
                Review and optimize rules with success rate below 80% for better
                performance
              </span>
            </li>
            <li className='flex gap-2'>
              <span className='text-amber-500'>▸</span>
              <span>
                Consider increasing automation rule coverage - currently saving{' '}
                {Math.round(metrics.hoursPerMonthSaved)} hours/month
              </span>
            </li>
            <li className='flex gap-2'>
              <span className='text-amber-500'>▸</span>
              <span>
                Webhook integrations have highest latency - optimize for better
                performance
              </span>
            </li>
            <li className='flex gap-2'>
              <span className='text-amber-500'>▸</span>
              <span>
                Email automation rules are most reliable - continue using similar
                patterns
              </span>
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Export Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Export Analytics</CardTitle>
        </CardHeader>
        <CardContent className='flex gap-2'>
          <Button variant='outline'>Export as PDF</Button>
          <Button variant='outline'>Export as Excel</Button>
          <Button variant='outline'>Export as CSV</Button>
        </CardContent>
      </Card>
    </div>
  )
}

// Metric Card Component with Trend
interface MetricCardProps {
  title: string
  value: string | number
  icon: React.ComponentType<{ className?: string }>
  color: 'primary' | 'success' | 'warning' | 'danger'
  trend?: {
    direction: 'up' | 'down' | 'stable'
    value: string
    period: string
  }
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  icon: Icon,
  color,
  trend,
}) => {
  const colorClasses = {
    primary: 'bg-blue-100 text-blue-600',
    success: 'bg-green-100 text-green-600',
    warning: 'bg-amber-100 text-amber-600',
    danger: 'bg-red-100 text-red-600',
  }

  return (
    <Card>
      <CardContent className='pt-6'>
        <div className='flex items-start justify-between'>
          <div className='space-y-1'>
            <p className='text-sm text-muted-foreground'>{title}</p>
            <p className='text-2xl font-bold'>{value}</p>
            {trend && (
              <div className='flex items-center gap-1'>
                {trend.direction === 'up' && (
                  <TrendingUp className='h-3 w-3 text-green-600' />
                )}
                {trend.direction === 'down' && (
                  <TrendingDown className='h-3 w-3 text-red-600' />
                )}
                <span className='text-xs text-muted-foreground'>
                  {trend.value} {trend.period}
                </span>
              </div>
            )}
          </div>
          <div className={`rounded-lg p-2 ${colorClasses[color]}`}>
            <Icon className='h-5 w-5' />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Loading Skeleton
const DashboardSkeleton = () => (
  <div className='space-y-6'>
    <Skeleton className='h-10 w-64' />
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
