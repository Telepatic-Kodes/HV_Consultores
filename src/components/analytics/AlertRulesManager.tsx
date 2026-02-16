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
  Bell,
  Trash2,
  Edit2,
  Play,
  Plus,
  CheckCircle,
  AlertCircle,
} from 'lucide-react'

interface AlertRule {
  id: string
  name: string
  enabled: boolean
  condition: {
    metric: string
    operator: '>' | '<' | '=' | '>=' | '<='
    threshold: number
    duration?: number
  }
  actions: {
    email?: string[]
    slack?: string
    inApp?: boolean
    webhook?: string
  }
  createdAt: Date
  lastTriggered?: Date
}

interface AlertRulesManagerProps {
  organizationId: string
}

export const AlertRulesManager: React.FC<AlertRulesManagerProps> = ({
  organizationId,
}) => {
  const [rules, setRules] = useState<AlertRule[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingRule, setEditingRule] = useState<AlertRule | null>(null)

  useEffect(() => {
    const fetchRules = async () => {
      try {
        setLoading(true)
        setError(null)
        // TODO: Fetch real alert rules from Convex
        setRules([])
      } catch (err) {
        console.error('Error fetching rules:', err)
        setError('Failed to load alert rules')
      } finally {
        setLoading(false)
      }
    }

    fetchRules()
  }, [organizationId])

  const handleDelete = (id: string) => {
    setRules(rules.filter((rule) => rule.id !== id))
  }

  const handleToggle = (id: string) => {
    setRules(
      rules.map((rule) =>
        rule.id === id ? { ...rule, enabled: !rule.enabled } : rule
      )
    )
  }

  const handleEdit = (rule: AlertRule) => {
    setEditingRule(rule)
    setShowForm(true)
  }

  const handleSave = (rule: AlertRule) => {
    if (editingRule) {
      setRules(
        rules.map((r) => (r.id === rule.id ? rule : r))
      )
      setEditingRule(null)
    } else {
      setRules([...rules, { ...rule, id: `rule-${Date.now()}` }])
    }
    setShowForm(false)
  }

  if (loading) return <DashboardSkeleton />

  if (error) {
    return (
      <Card className='border-destructive'>
        <CardContent className='pt-6'>
          <p className='text-sm text-destructive'>{error}</p>
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
            Alert Rules
          </h2>
          <p className='text-muted-foreground'>
            Configure alerts for metrics and thresholds
          </p>
        </div>
        <Button onClick={() => setShowForm(true)} className='gap-2'>
          <Plus className='h-4 w-4' />
          New Alert Rule
        </Button>
      </div>

      {/* Stats */}
      <div className='grid gap-4 md:grid-cols-3'>
        <StatCard
          title='Total Rules'
          value={rules.length}
          icon={Bell}
          color='primary'
        />
        <StatCard
          title='Enabled'
          value={rules.filter((r) => r.enabled).length}
          icon={CheckCircle}
          color='success'
        />
        <StatCard
          title='Recently Triggered'
          value={rules.filter((r) => r.lastTriggered).length}
          icon={AlertCircle}
          color='warning'
        />
      </div>

      {/* Rules List */}
      <Card>
        <CardHeader>
          <CardTitle>Active Alert Rules</CardTitle>
        </CardHeader>
        <CardContent>
          {rules.length > 0 ? (
            <div className='space-y-4'>
              {rules.map((rule) => (
                <RuleCard
                  key={rule.id}
                  rule={rule}
                  onToggle={handleToggle}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          ) : (
            <div className='flex items-center justify-center py-12'>
              <div className='text-center'>
                <Bell className='h-12 w-12 text-muted-foreground mx-auto mb-2' />
                <p className='text-sm font-medium'>No alert rules configured</p>
                <p className='text-xs text-muted-foreground'>
                  Create your first alert rule to get started
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Form Modal (simplified - would be a full modal in production) */}
      {showForm && (
        <Card className='border-blue-200 bg-blue-50'>
          <CardHeader>
            <CardTitle>
              {editingRule ? 'Edit Alert Rule' : 'Create Alert Rule'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AlertRuleForm
              rule={editingRule || undefined}
              onSave={handleSave}
              onCancel={() => {
                setShowForm(false)
                setEditingRule(null)
              }}
            />
          </CardContent>
        </Card>
      )}

      {/* Best Practices */}
      <Card>
        <CardHeader>
          <CardTitle className='text-lg'>Alert Best Practices</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className='space-y-2 text-sm text-muted-foreground'>
            <li className='flex items-start gap-2'>
              <span className='text-blue-600 mt-1'>✓</span>
              <span>Set duration thresholds to avoid alert fatigue from temporary spikes</span>
            </li>
            <li className='flex items-start gap-2'>
              <span className='text-blue-600 mt-1'>✓</span>
              <span>Use multiple notification channels for critical alerts</span>
            </li>
            <li className='flex items-start gap-2'>
              <span className='text-blue-600 mt-1'>✓</span>
              <span>Test alerts before enabling in production</span>
            </li>
            <li className='flex items-start gap-2'>
              <span className='text-blue-600 mt-1'>✓</span>
              <span>Review and adjust thresholds based on historical data</span>
            </li>
            <li className='flex items-start gap-2'>
              <span className='text-blue-600 mt-1'>✓</span>
              <span>Keep alert descriptions clear and actionable</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}

// Stat Card Component
interface StatCardProps {
  title: string
  value: number
  icon: React.ComponentType<{ className?: string }>
  color: 'primary' | 'success' | 'warning'
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
  color,
}) => {
  const colorClasses = {
    primary: 'bg-blue-100 text-blue-600',
    success: 'bg-green-100 text-green-600',
    warning: 'bg-amber-100 text-amber-600',
  }

  return (
    <Card>
      <CardContent className='pt-6'>
        <div className='flex items-start justify-between'>
          <div className='space-y-1'>
            <p className='text-sm text-muted-foreground'>{title}</p>
            <p className='text-2xl font-bold'>{value}</p>
          </div>
          <div className={`rounded-lg p-2 ${colorClasses[color]}`}>
            <Icon className='h-5 w-5' />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Rule Card Component
interface RuleCardProps {
  rule: AlertRule
  onToggle: (id: string) => void
  onEdit: (rule: AlertRule) => void
  onDelete: (id: string) => void
}

const RuleCard: React.FC<RuleCardProps> = ({
  rule,
  onToggle,
  onEdit,
  onDelete,
}) => {
  const getOperatorLabel = (op: string) => {
    const labels: Record<string, string> = {
      '>': 'Greater than',
      '<': 'Less than',
      '=': 'Equals',
      '>=': 'Greater than or equal',
      '<=': 'Less than or equal',
    }
    return labels[op] || op
  }

  return (
    <div className={`border rounded-lg p-4 ${rule.enabled ? 'bg-white' : 'bg-gray-50'}`}>
      <div className='flex items-start justify-between gap-4'>
        <div className='flex-1'>
          <div className='flex items-center gap-2'>
            <h3 className='font-semibold'>{rule.name}</h3>
            <div
              className={`px-2 py-1 rounded text-xs font-medium ${
                rule.enabled
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {rule.enabled ? 'Enabled' : 'Disabled'}
            </div>
          </div>

          <div className='mt-2 text-sm text-muted-foreground'>
            <p>
              Alert when {rule.condition.metric} is {getOperatorLabel(rule.condition.operator)}{' '}
              <span className='font-semibold'>{rule.condition.threshold}</span>
              {rule.condition.duration && ` for ${rule.condition.duration} minutes`}
            </p>
          </div>

          <div className='mt-3 flex flex-wrap gap-2'>
            {rule.actions.email && (
              <span className='inline-flex items-center gap-1 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded'>
                📧 {rule.actions.email.length} email
              </span>
            )}
            {rule.actions.slack && (
              <span className='inline-flex items-center gap-1 text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded'>
                💬 Slack
              </span>
            )}
            {rule.actions.webhook && (
              <span className='inline-flex items-center gap-1 text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded'>
                🔗 Webhook
              </span>
            )}
            {rule.actions.inApp && (
              <span className='inline-flex items-center gap-1 text-xs bg-cyan-100 text-cyan-800 px-2 py-1 rounded'>
                🔔 In-App
              </span>
            )}
          </div>

          {rule.lastTriggered && (
            <p className='mt-2 text-xs text-muted-foreground'>
              Last triggered: {new Date(rule.lastTriggered).toLocaleString()}
            </p>
          )}
        </div>

        <div className='flex gap-2'>
          <Button
            variant='outline'
            size='sm'
            onClick={() => onToggle(rule.id)}
          >
            {rule.enabled ? 'Disable' : 'Enable'}
          </Button>
          <Button
            variant='outline'
            size='sm'
            onClick={() => onEdit(rule)}
          >
            <Edit2 className='h-4 w-4' />
          </Button>
          <Button
            variant='outline'
            size='sm'
            onClick={() => onDelete(rule.id)}
            className='text-destructive'
          >
            <Trash2 className='h-4 w-4' />
          </Button>
        </div>
      </div>
    </div>
  )
}

// Alert Rule Form Component
interface AlertRuleFormProps {
  rule?: AlertRule
  onSave: (rule: AlertRule) => void
  onCancel: () => void
}

const AlertRuleForm: React.FC<AlertRuleFormProps> = ({
  rule,
  onSave,
  onCancel,
}) => {
  const [formData, setFormData] = useState<AlertRule>(
    rule || {
      id: '',
      name: '',
      enabled: true,
      condition: {
        metric: 'queueDepth',
        operator: '>',
        threshold: 500,
      },
      actions: {
        email: [],
        inApp: true,
      },
      createdAt: new Date(),
    }
  )

  const handleSave = () => {
    if (!formData.name.trim()) {
      alert('Rule name is required')
      return
    }
    onSave(formData)
  }

  return (
    <div className='space-y-4'>
      <div>
        <label className='text-sm font-medium'>Rule Name</label>
        <input
          type='text'
          className='w-full mt-1 px-3 py-2 border rounded-md text-sm'
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder='e.g., High Queue Depth Alert'
        />
      </div>

      <div className='grid gap-4 md:grid-cols-3'>
        <div>
          <label className='text-sm font-medium'>Metric</label>
          <select
            className='w-full mt-1 px-3 py-2 border rounded-md text-sm'
            value={formData.condition.metric}
            onChange={(e) =>
              setFormData({
                ...formData,
                condition: { ...formData.condition, metric: e.target.value },
              })
            }
          >
            <option value='queueDepth'>Queue Depth</option>
            <option value='errorRate'>Error Rate</option>
            <option value='latency'>Latency (p95)</option>
            <option value='cpuUsage'>CPU Usage</option>
            <option value='complianceScore'>Compliance Score</option>
          </select>
        </div>

        <div>
          <label className='text-sm font-medium'>Operator</label>
          <select
            className='w-full mt-1 px-3 py-2 border rounded-md text-sm'
            value={formData.condition.operator}
            onChange={(e) =>
              setFormData({
                ...formData,
                condition: {
                  ...formData.condition,
                  operator: e.target.value as any,
                },
              })
            }
          >
            <option value='>'>&gt; Greater than</option>
            <option value='<'>&lt; Less than</option>
            <option value='='>=  Equals</option>
            <option value='>='>&gt;= Greater than or equal</option>
            <option value='<='>&lt;= Less than or equal</option>
          </select>
        </div>

        <div>
          <label className='text-sm font-medium'>Threshold</label>
          <input
            type='number'
            className='w-full mt-1 px-3 py-2 border rounded-md text-sm'
            value={formData.condition.threshold}
            onChange={(e) =>
              setFormData({
                ...formData,
                condition: {
                  ...formData.condition,
                  threshold: parseFloat(e.target.value),
                },
              })
            }
          />
        </div>
      </div>

      <div>
        <label className='text-sm font-medium'>Duration (minutes, optional)</label>
        <input
          type='number'
          className='w-full mt-1 px-3 py-2 border rounded-md text-sm'
          value={formData.condition.duration || ''}
          onChange={(e) =>
            setFormData({
              ...formData,
              condition: {
                ...formData.condition,
                duration: e.target.value ? parseInt(e.target.value) : undefined,
              },
            })
          }
          placeholder='Alert if threshold exceeded for X minutes'
        />
      </div>

      <div className='border-t pt-4'>
        <p className='text-sm font-medium mb-3'>Notification Channels</p>
        <div className='space-y-2'>
          <label className='flex items-center gap-2 text-sm'>
            <input
              type='checkbox'
              checked={formData.actions.inApp || false}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  actions: { ...formData.actions, inApp: e.target.checked },
                })
              }
            />
            In-App Notification
          </label>
          <label className='flex items-center gap-2 text-sm'>
            <input
              type='checkbox'
              checked={!!formData.actions.email?.length}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  actions: {
                    ...formData.actions,
                    email: e.target.checked ? ['admin@example.com'] : undefined,
                  },
                })
              }
            />
            Email Notification
          </label>
          <label className='flex items-center gap-2 text-sm'>
            <input
              type='checkbox'
              checked={!!formData.actions.slack}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  actions: {
                    ...formData.actions,
                    slack: e.target.checked ? 'https://hooks.slack.com/...' : undefined,
                  },
                })
              }
            />
            Slack Notification
          </label>
        </div>
      </div>

      <div className='flex gap-2 justify-end pt-4 border-t'>
        <Button variant='outline' onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSave}>
          {rule ? 'Update Rule' : 'Create Rule'}
        </Button>
      </div>
    </div>
  )
}

// Loading Skeleton
const DashboardSkeleton = () => (
  <div className='space-y-6'>
    <Skeleton className='h-10 w-64' />
    <div className='grid gap-4 md:grid-cols-3'>
      {[...Array(3)].map((_, i) => (
        <Card key={i}>
          <CardContent className='pt-6'>
            <Skeleton className='h-20 w-full' />
          </CardContent>
        </Card>
      ))}
    </div>
    <Card>
      <CardHeader>
        <Skeleton className='h-6 w-32' />
      </CardHeader>
      <CardContent>
        <div className='space-y-3'>
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className='h-24 w-full' />
          ))}
        </div>
      </CardContent>
    </Card>
  </div>
)
