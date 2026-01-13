'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { obtenerEstadisticasDocumentos } from '@/app/dashboard/documentos/actions'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Upload, AlertCircle, CheckCircle2, Send, Clock, TrendingUp } from 'lucide-react'
import { Loader2 } from 'lucide-react'

export function DocumentStatsWidget() {
  const [stats, setStats] = useState<{
    total: number
    pendiente: number
    subido: number
    validado: number
    enviado: number
    rechazado: number
  } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const cargarStats = async () => {
      setLoading(true)
      try {
        const result = await obtenerEstadisticasDocumentos()
        setStats(result)
      } finally {
        setLoading(false)
      }
    }

    cargarStats()
  }, [])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Documentos Cargados</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  if (!stats) {
    return null
  }

  const chartData = [
    { name: 'Pendiente', value: stats.pendiente, fill: '#FBBF24' },
    { name: 'Validado', value: stats.validado, fill: '#34D399' },
    { name: 'Enviado', value: stats.enviado, fill: '#A78BFA' },
    { name: 'Rechazado', value: stats.rechazado, fill: '#F87171' },
  ]

  const successRate =
    stats.total > 0 ? Math.round((stats.validado + stats.enviado) / stats.total * 100) : 0

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Total Documents */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Documentos</CardTitle>
          <Upload className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total}</div>
          <p className="text-xs text-muted-foreground">documentos cargados</p>
        </CardContent>
      </Card>

      {/* Pending */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pendiente</CardTitle>
          <Clock className="h-4 w-4 text-yellow-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-yellow-600">{stats.pendiente}</div>
          <p className="text-xs text-muted-foreground">esperando aprobación</p>
        </CardContent>
      </Card>

      {/* Success Rate */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Procesados</CardTitle>
          <CheckCircle2 className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{successRate}%</div>
          <p className="text-xs text-muted-foreground">{stats.validado + stats.enviado} documentos</p>
        </CardContent>
      </Card>

      {/* Rejected */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Rechazados</CardTitle>
          <AlertCircle className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{stats.rechazado}</div>
          <p className="text-xs text-muted-foreground">requieren acción</p>
        </CardContent>
      </Card>

      {/* Chart */}
      <Card className="md:col-span-2 lg:col-span-4">
        <CardHeader>
          <CardTitle>Distribución de Documentos</CardTitle>
          <CardDescription>Estado actual de todos los documentos cargados</CardDescription>
        </CardHeader>
        <CardContent>
          {stats.total === 0 ? (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              No hay documentos cargados aún
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: '0.5rem',
                  }}
                  labelStyle={{ color: '#f3f4f6' }}
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Action Card */}
      {stats.pendiente > 0 && (
        <Card className="md:col-span-2 lg:col-span-4 bg-blue-50 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-blue-900">Documentos Pendientes</CardTitle>
              <CardDescription className="text-blue-700">
                {stats.pendiente} documento{stats.pendiente !== 1 ? 's' : ''} esperando aprobación
              </CardDescription>
            </div>
            <Link href="/dashboard/documentos/aprobaciones">
              <Button size="sm">
                <Send className="h-4 w-4 mr-2" />
                Revisar
              </Button>
            </Link>
          </CardHeader>
        </Card>
      )}
    </div>
  )
}
