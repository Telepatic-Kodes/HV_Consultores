'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { TrendingUp, TrendingDown, Zap, Clock } from 'lucide-react'
import {
  obtenerAnalisisPlantillasCliente,
  type TemplateAnalytics,
} from '@/app/dashboard/documentos/intelligence-actions'

interface TemplateAnalyticsCardProps {
  clienteId: string
  plantillaId?: string
}

export function TemplateAnalyticsCard({
  clienteId,
  plantillaId,
}: TemplateAnalyticsCardProps) {
  const [analytics, setAnalytics] = useState<TemplateAnalytics[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    cargarAnalytics()
  }, [clienteId])

  const cargarAnalytics = async () => {
    setLoading(true)
    try {
      const resultado = await obtenerAnalisisPlantillasCliente(clienteId)
      if (resultado.success && resultado.analytics) {
        const datos = plantillaId
          ? resultado.analytics.filter((a) => a.plantilla_id === plantillaId)
          : resultado.analytics.slice(0, 5) // Top 5 templates
        setAnalytics(datos)
      }
    } catch (error) {
      toast.error('Error al cargar análisis')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Análisis de Plantillas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-muted rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (analytics.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Análisis de Plantillas</CardTitle>
          <CardDescription>Sin datos de análisis disponibles</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Análisis de Plantillas</CardTitle>
        <CardDescription>
          {plantillaId ? 'Análisis de plantilla' : 'Plantillas más usadas'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {analytics.map((a) => (
          <div key={a.id} className="space-y-3 pb-4 border-b last:border-b-0 last:pb-0">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-medium">Usos: {a.uso_total}</h4>
                <p className="text-sm text-muted-foreground">
                  {a.uso_mes_actual} este mes
                </p>
              </div>
              <Badge variant={a.tasa_exito >= 90 ? 'default' : 'secondary'}>
                {a.tasa_exito.toFixed(1)}% éxito
              </Badge>
            </div>

            {/* Success Rate */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Tasa de éxito</span>
                <span className="font-medium">{a.documentos_exitosos} / {a.uso_total}</span>
              </div>
              <Progress value={a.tasa_exito} className="h-2" />
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="bg-blue-50 p-2 rounded">
                <p className="text-muted-foreground text-xs">Monto Promedio</p>
                <p className="font-medium">
                  ${(a.monto_promedio || 0).toLocaleString('es-CL')}
                </p>
              </div>
              <div className="bg-green-50 p-2 rounded">
                <p className="text-muted-foreground text-xs">Total Procesado</p>
                <p className="font-medium">
                  ${(a.monto_total_procesado || 0).toLocaleString('es-CL')}
                </p>
              </div>
            </div>

            {/* Trend & Time */}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                {a.uso_mes_actual >= (a.uso_mes_anterior || 0) ? (
                  <>
                    <TrendingUp className="h-3 w-3 text-green-600" />
                    <span>Tendencia creciente</span>
                  </>
                ) : (
                  <>
                    <TrendingDown className="h-3 w-3 text-red-600" />
                    <span>Tendencia decreciente</span>
                  </>
                )}
              </div>
              {a.dias_sin_usar > 0 && (
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{a.dias_sin_usar}d sin usar</span>
                </div>
              )}
            </div>
          </div>
        ))}

        <Button
          variant="outline"
          className="w-full"
          onClick={cargarAnalytics}
          size="sm"
        >
          <Zap className="h-4 w-4 mr-2" />
          Actualizar análisis
        </Button>
      </CardContent>
    </Card>
  )
}
