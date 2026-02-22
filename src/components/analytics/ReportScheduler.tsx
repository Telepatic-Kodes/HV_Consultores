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
  Calendar,
  Trash2,
  Edit2,
  Plus,
  Send,
  Clock,
  FileText,
} from 'lucide-react'

interface ReportSchedule {
  id: string
  name: string
  enabled: boolean
  type: 'daily' | 'weekly' | 'monthly'
  schedule: {
    time: string
    dayOfWeek?: number
    dayOfMonth?: number
  }
  recipients: {
    email: string[]
    slack?: string
    webhook?: string
  }
  dashboards: string[]
  format: 'pdf' | 'excel' | 'html'
  includeCharts: boolean
  createdAt: Date
  lastSent?: Date
}

interface ReportSchedulerProps {
  organizationId: string
}

export const ReportScheduler: React.FC<ReportSchedulerProps> = ({
  organizationId,
}) => {
  const [schedules, setSchedules] = useState<ReportSchedule[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState<ReportSchedule | null>(null)

  useEffect(() => {
    const fetchSchedules = async () => {
      try {
        setLoading(true)
        setError(null)
        // TODO: Fetch real schedules from Convex
        setSchedules([])
      } catch (err) {
        console.error('Error fetching schedules:', err)
        setError('Error al cargar programaciones de reportes')
      } finally {
        setLoading(false)
      }
    }

    fetchSchedules()
  }, [organizationId])

  const handleDelete = (id: string) => {
    setSchedules(schedules.filter((schedule) => schedule.id !== id))
  }

  const handleToggle = (id: string) => {
    setSchedules(
      schedules.map((schedule) =>
        schedule.id === id ? { ...schedule, enabled: !schedule.enabled } : schedule
      )
    )
  }

  const handleEdit = (schedule: ReportSchedule) => {
    setEditingSchedule(schedule)
    setShowForm(true)
  }

  const handleSave = (schedule: ReportSchedule) => {
    if (editingSchedule) {
      setSchedules(
        schedules.map((s) => (s.id === schedule.id ? schedule : s))
      )
      setEditingSchedule(null)
    } else {
      setSchedules([...schedules, { ...schedule, id: `report-${Date.now()}` }])
    }
    setShowForm(false)
  }

  const handleSendNow = (id: string) => {
    alert('Reporte enviado exitosamente!')
    const updated = schedules.map((s) =>
      s.id === id ? { ...s, lastSent: new Date() } : s
    )
    setSchedules(updated)
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
            Programación de Reportes
          </h2>
          <p className='text-muted-foreground'>
            Automatice el envío de reportes analíticos
          </p>
        </div>
        <Button onClick={() => setShowForm(true)} className='gap-2'>
          <Plus className='h-4 w-4' />
          Nueva Programación
        </Button>
      </div>

      {/* Stats */}
      <div className='grid gap-4 md:grid-cols-3'>
        <StatCard
          title='Total Programaciones'
          value={schedules.length}
          icon={Calendar}
          color='primary'
        />
        <StatCard
          title='Habilitadas'
          value={schedules.filter((s) => s.enabled).length}
          icon={Clock}
          color='success'
        />
        <StatCard
          title='Enviados Recientemente'
          value={schedules.filter((s) => s.lastSent).length}
          icon={Send}
          color='info'
        />
      </div>

      {/* Schedules List */}
      <Card>
        <CardHeader>
          <CardTitle>Programaciones de Reportes</CardTitle>
        </CardHeader>
        <CardContent>
          {schedules.length > 0 ? (
            <div className='space-y-4'>
              {schedules.map((schedule) => (
                <ScheduleCard
                  key={schedule.id}
                  schedule={schedule}
                  onToggle={handleToggle}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onSendNow={handleSendNow}
                />
              ))}
            </div>
          ) : (
            <div className='flex items-center justify-center py-12'>
              <div className='text-center'>
                <FileText className='h-12 w-12 text-muted-foreground mx-auto mb-2' />
                <p className='text-sm font-medium'>No hay programaciones de reportes configuradas</p>
                <p className='text-xs text-muted-foreground'>
                  Cree su primera programación de reporte para automatizar el envío
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Form Modal (simplified) */}
      {showForm && (
        <Card className='border-blue-200 bg-blue-50'>
          <CardHeader>
            <CardTitle>
              {editingSchedule ? 'Editar Programación de Reporte' : 'Crear Programación de Reporte'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ReportScheduleForm
              schedule={editingSchedule || undefined}
              onSave={handleSave}
              onCancel={() => {
                setShowForm(false)
                setEditingSchedule(null)
              }}
            />
          </CardContent>
        </Card>
      )}

      {/* Delivery Channels Info */}
      <Card>
        <CardHeader>
          <CardTitle className='text-lg'>Canales de Entrega Soportados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='grid gap-4 md:grid-cols-3'>
            <div className='border rounded-lg p-3'>
              <p className='font-semibold text-sm mb-1'>📧 Email</p>
              <p className='text-xs text-muted-foreground'>
                Envíe reportes directamente a direcciones de email. Soporta múltiples destinatarios.
              </p>
            </div>
            <div className='border rounded-lg p-3'>
              <p className='font-semibold text-sm mb-1'>💬 Slack</p>
              <p className='text-xs text-muted-foreground'>
                Publique reportes en canales de Slack con webhooks. Notificaciones incluidas.
              </p>
            </div>
            <div className='border rounded-lg p-3'>
              <p className='font-semibold text-sm mb-1'>🔗 Webhook</p>
              <p className='text-xs text-muted-foreground'>
                Envíe reportes mediante webhooks personalizados para integraciones de terceros.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export Formats */}
      <Card>
        <CardHeader>
          <CardTitle className='text-lg'>Formatos de Exportación Disponibles</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='grid gap-4 md:grid-cols-3'>
            <FormatCard
              format='PDF'
              description='PDF profesional con gráficos y tablas formateadas'
              bestFor='Reportes ejecutivos, archivos'
            />
            <FormatCard
              format='Excel'
              description='Formato de hoja de cálculo con múltiples hojas por dashboard'
              bestFor='Análisis de datos, procesamiento adicional'
            />
            <FormatCard
              format='HTML'
              description='HTML interactivo que se puede ver en el navegador'
              bestFor='Envío por email, compartir en web'
            />
          </div>
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
  color: 'primary' | 'success' | 'info'
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
    info: 'bg-cyan-100 text-cyan-600',
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

// Schedule Card Component
interface ScheduleCardProps {
  schedule: ReportSchedule
  onToggle: (id: string) => void
  onEdit: (schedule: ReportSchedule) => void
  onDelete: (id: string) => void
  onSendNow: (id: string) => void
}

const ScheduleCard: React.FC<ScheduleCardProps> = ({
  schedule,
  onToggle,
  onEdit,
  onDelete,
  onSendNow,
}) => {
  const getFrequencyLabel = () => {
    if (schedule.type === 'daily') {
      return `Diario a las ${schedule.schedule.time}`
    } else if (schedule.type === 'weekly') {
      const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
      return `Cada ${days[schedule.schedule.dayOfWeek || 0]} a las ${schedule.schedule.time}`
    } else {
      return `Mensual el día ${schedule.schedule.dayOfMonth} a las ${schedule.schedule.time}`
    }
  }

  return (
    <div className={`border rounded-lg p-4 ${schedule.enabled ? 'bg-white' : 'bg-gray-50'}`}>
      <div className='flex items-start justify-between gap-4'>
        <div className='flex-1'>
          <div className='flex items-center gap-2'>
            <h3 className='font-semibold'>{schedule.name}</h3>
            <div
              className={`px-2 py-1 rounded text-xs font-medium ${
                schedule.enabled
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {schedule.type === 'daily' ? 'Diario' : schedule.type === 'weekly' ? 'Semanal' : 'Mensual'}
            </div>
          </div>

          <p className='mt-1 text-sm text-muted-foreground'>
            {getFrequencyLabel()}
          </p>

          <div className='mt-3 flex flex-wrap gap-2'>
            <span className='inline-flex items-center gap-1 text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded'>
              {schedule.format.toUpperCase()}
            </span>
            {schedule.recipients.email?.length > 0 && (
              <span className='inline-flex items-center gap-1 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded'>
                📧 {schedule.recipients.email.length} email
              </span>
            )}
            {schedule.recipients.slack && (
              <span className='inline-flex items-center gap-1 text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded'>
                💬 Slack
              </span>
            )}
            {schedule.recipients.webhook && (
              <span className='inline-flex items-center gap-1 text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded'>
                🔗 Webhook
              </span>
            )}
          </div>

          <p className='mt-2 text-xs text-muted-foreground'>
            Dashboards: {schedule.dashboards.join(', ')} {schedule.includeCharts && '(con gráficos)'}
          </p>

          {schedule.lastSent && (
            <p className='mt-1 text-xs text-muted-foreground'>
              Último envío: {new Date(schedule.lastSent).toLocaleString()}
            </p>
          )}
        </div>

        <div className='flex gap-2'>
          <Button
            variant='outline'
            size='sm'
            onClick={() => onSendNow(schedule.id)}
            title='Enviar reporte ahora'
          >
            <Send className='h-4 w-4' />
          </Button>
          <Button
            variant='outline'
            size='sm'
            onClick={() => onToggle(schedule.id)}
          >
            {schedule.enabled ? 'Deshabilitar' : 'Habilitar'}
          </Button>
          <Button
            variant='outline'
            size='sm'
            onClick={() => onEdit(schedule)}
          >
            <Edit2 className='h-4 w-4' />
          </Button>
          <Button
            variant='outline'
            size='sm'
            onClick={() => onDelete(schedule.id)}
            className='text-destructive'
          >
            <Trash2 className='h-4 w-4' />
          </Button>
        </div>
      </div>
    </div>
  )
}

// Report Schedule Form Component
interface ReportScheduleFormProps {
  schedule?: ReportSchedule
  onSave: (schedule: ReportSchedule) => void
  onCancel: () => void
}

const ReportScheduleForm: React.FC<ReportScheduleFormProps> = ({
  schedule,
  onSave,
  onCancel,
}) => {
  const [formData, setFormData] = useState<ReportSchedule>(
    schedule || {
      id: '',
      name: '',
      enabled: true,
      type: 'weekly',
      schedule: {
        time: '09:00',
        dayOfWeek: 1,
      },
      recipients: {
        email: [],
      },
      dashboards: ['documents'],
      format: 'pdf',
      includeCharts: true,
      createdAt: new Date(),
    }
  )

  const handleSave = () => {
    if (!formData.name.trim()) {
      alert('El nombre de la programación es requerido')
      return
    }
    if (formData.recipients.email?.length === 0 && !formData.recipients.slack && !formData.recipients.webhook) {
      alert('Se requiere al menos un destinatario')
      return
    }
    onSave(formData)
  }

  return (
    <div className='space-y-4'>
      <div>
        <label className='text-sm font-medium'>Nombre del Reporte</label>
        <input
          type='text'
          className='w-full mt-1 px-3 py-2 border rounded-md text-sm'
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder='ej., Resumen Diario de Operaciones'
        />
      </div>

      <div className='grid gap-4 md:grid-cols-2'>
        <div>
          <label className='text-sm font-medium'>Frecuencia</label>
          <select
            className='w-full mt-1 px-3 py-2 border rounded-md text-sm'
            value={formData.type}
            onChange={(e) =>
              setFormData({
                ...formData,
                type: e.target.value as any,
              })
            }
          >
            <option value='daily'>Diario</option>
            <option value='weekly'>Semanal</option>
            <option value='monthly'>Mensual</option>
          </select>
        </div>

        <div>
          <label className='text-sm font-medium'>Hora</label>
          <input
            type='time'
            className='w-full mt-1 px-3 py-2 border rounded-md text-sm'
            value={formData.schedule.time}
            onChange={(e) =>
              setFormData({
                ...formData,
                schedule: { ...formData.schedule, time: e.target.value },
              })
            }
          />
        </div>
      </div>

      <div className='grid gap-4 md:grid-cols-2'>
        <div>
          <label className='text-sm font-medium'>Formato</label>
          <select
            className='w-full mt-1 px-3 py-2 border rounded-md text-sm'
            value={formData.format}
            onChange={(e) =>
              setFormData({
                ...formData,
                format: e.target.value as any,
              })
            }
          >
            <option value='pdf'>PDF</option>
            <option value='excel'>Excel</option>
            <option value='html'>HTML</option>
          </select>
        </div>

        <div>
          <label className='text-sm font-medium'>Incluir Gráficos</label>
          <select
            className='w-full mt-1 px-3 py-2 border rounded-md text-sm'
            value={formData.includeCharts ? 'yes' : 'no'}
            onChange={(e) =>
              setFormData({
                ...formData,
                includeCharts: e.target.value === 'yes',
              })
            }
          >
            <option value='yes'>Sí</option>
            <option value='no'>No</option>
          </select>
        </div>
      </div>

      <div className='border-t pt-4'>
        <p className='text-sm font-medium mb-3'>Destinatarios</p>
        <div className='space-y-3'>
          <div>
            <label className='text-xs text-muted-foreground'>Email (separados por coma)</label>
            <input
              type='text'
              className='w-full mt-1 px-3 py-2 border rounded-md text-sm'
              value={formData.recipients.email?.join(', ') || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  recipients: {
                    ...formData.recipients,
                    email: e.target.value
                      .split(',')
                      .map((e) => e.trim())
                      .filter((e) => e),
                  },
                })
              }
              placeholder='user1@example.com, user2@example.com'
            />
          </div>
          <label className='flex items-center gap-2 text-sm'>
            <input
              type='checkbox'
              checked={!!formData.recipients.slack}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  recipients: {
                    ...formData.recipients,
                    slack: e.target.checked ? 'https://hooks.slack.com/...' : undefined,
                  },
                })
              }
            />
            Enviar a canal de Slack
          </label>
        </div>
      </div>

      <div className='flex gap-2 justify-end pt-4 border-t'>
        <Button variant='outline' onClick={onCancel}>
          Cancelar
        </Button>
        <Button onClick={handleSave}>
          {schedule ? 'Actualizar Programación' : 'Crear Programación'}
        </Button>
      </div>
    </div>
  )
}

// Format Card Component
interface FormatCardProps {
  format: string
  description: string
  bestFor: string
}

const FormatCard: React.FC<FormatCardProps> = ({
  format,
  description,
  bestFor,
}) => {
  return (
    <div className='border rounded-lg p-3'>
      <p className='font-semibold text-sm mb-1'>{format}</p>
      <p className='text-xs text-muted-foreground mb-2'>{description}</p>
      <p className='text-xs'>
        <span className='font-medium'>Ideal para:</span> {bestFor}
      </p>
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
