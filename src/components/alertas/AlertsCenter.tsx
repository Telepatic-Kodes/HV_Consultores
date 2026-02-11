'use client'

import { useState } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2, AlertTriangle, Shield, Bell } from 'lucide-react'
import { AnomalyCard } from './AnomalyCard'

interface AlertsCenterProps {
  clienteId?: string
}

export function AlertsCenter({ clienteId }: AlertsCenterProps) {
  const [filterEstado, setFilterEstado] = useState<string>('abierta')
  const [filterSeveridad, setFilterSeveridad] = useState<string>('all')

  const alerts = useQuery(api.anomalies.getAlerts, {
    clienteId: clienteId ? (clienteId as Id<'clientes'>) : undefined,
    estado: filterEstado !== 'all' ? (filterEstado as any) : undefined,
    severidad: filterSeveridad !== 'all' ? (filterSeveridad as any) : undefined,
  })
  const stats = useQuery(api.anomalies.getAlertStats, {
    clienteId: clienteId ? (clienteId as Id<'clientes'>) : undefined,
  })

  const resolveAlert = useMutation(api.anomalies.resolveAlert)
  const dismissAlert = useMutation(api.anomalies.dismissAlert)
  const reviewAlert = useMutation(api.anomalies.reviewAlert)

  const handleResolve = async (alertId: string) => {
    await resolveAlert({ alertId: alertId as Id<'alertas_anomalias'> })
  }

  const handleDismiss = async (alertId: string) => {
    await dismissAlert({ alertId: alertId as Id<'alertas_anomalias'> })
  }

  const handleReview = async (alertId: string) => {
    await reviewAlert({ alertId: alertId as Id<'alertas_anomalias'> })
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Card>
            <CardContent className="py-3 text-center">
              <p className="text-[10px] text-muted-foreground uppercase">Abiertas</p>
              <p className="text-2xl font-bold">{stats.abiertas}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-3 text-center">
              <p className="text-[10px] text-red-600 uppercase">Alta</p>
              <p className="text-2xl font-bold text-red-600">{stats.alta}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-3 text-center">
              <p className="text-[10px] text-amber-600 uppercase">Media</p>
              <p className="text-2xl font-bold text-amber-600">{stats.media}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-3 text-center">
              <p className="text-[10px] text-blue-600 uppercase">Baja</p>
              <p className="text-2xl font-bold text-blue-600">{stats.baja}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-3 text-center">
              <p className="text-[10px] text-emerald-600 uppercase">Resueltas</p>
              <p className="text-2xl font-bold text-emerald-600">{stats.resueltas}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3">
        <Select value={filterEstado} onValueChange={setFilterEstado}>
          <SelectTrigger className="w-[140px] h-8 text-xs">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="abierta">Abiertas</SelectItem>
            <SelectItem value="revisada">Revisadas</SelectItem>
            <SelectItem value="resuelta">Resueltas</SelectItem>
            <SelectItem value="descartada">Descartadas</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterSeveridad} onValueChange={setFilterSeveridad}>
          <SelectTrigger className="w-[120px] h-8 text-xs">
            <SelectValue placeholder="Severidad" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="alta">Alta</SelectItem>
            <SelectItem value="media">Media</SelectItem>
            <SelectItem value="baja">Baja</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Alert list */}
      {alerts === undefined ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : alerts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Shield className="h-12 w-12 text-emerald-500/30 mb-3" />
            <p className="text-sm font-medium">Sin alertas</p>
            <p className="text-xs text-muted-foreground mt-1">
              No se encontraron alertas con los filtros seleccionados
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {alerts.map((alert) => (
            <AnomalyCard
              key={alert._id}
              alert={alert}
              onResolve={handleResolve}
              onDismiss={handleDismiss}
              onReview={handleReview}
            />
          ))}
        </div>
      )}
    </div>
  )
}
