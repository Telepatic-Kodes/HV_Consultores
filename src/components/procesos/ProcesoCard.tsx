'use client'

import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Calendar, CheckCircle, Clock, User } from 'lucide-react'

interface ProcesoCardProps {
  proceso: {
    _id: string
    nombre: string
    tipo: string
    estado: string
    periodo?: string
    fecha_limite?: string
    created_at?: string
  }
  clienteNombre?: string
  tareaStats?: {
    total: number
    completada: number
  }
}

const tipoLabels: Record<string, string> = {
  contabilidad_mensual: 'Contabilidad',
  declaracion_f29: 'F29',
  declaracion_renta: 'Renta',
  cierre_anual: 'Cierre',
  onboarding_cliente: 'Onboarding',
  otro: 'Otro',
}

const estadoConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  activo: { label: 'Activo', variant: 'default' },
  pausado: { label: 'Pausado', variant: 'secondary' },
  completado: { label: 'Completado', variant: 'outline' },
  cancelado: { label: 'Cancelado', variant: 'destructive' },
}

export function ProcesoCard({ proceso, clienteNombre, tareaStats }: ProcesoCardProps) {
  const progress = tareaStats && tareaStats.total > 0
    ? Math.round((tareaStats.completada / tareaStats.total) * 100)
    : 0

  const estadoCfg = estadoConfig[proceso.estado] || estadoConfig.activo
  const isOverdue = proceso.fecha_limite && new Date(proceso.fecha_limite) < new Date() && proceso.estado === 'activo'

  return (
    <Link href={`/dashboard/procesos/${proceso._id}`}>
      <Card className={`group hover:shadow-executive-md transition-all duration-200 cursor-pointer ${isOverdue ? 'ring-1 ring-destructive/30' : ''}`}>
        <CardContent className="pt-5 pb-5">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
                {proceso.nombre}
              </h3>
              {clienteNombre && (
                <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {clienteNombre}
                </p>
              )}
            </div>
            <Badge variant={estadoCfg.variant} className="ml-2 text-[10px] shrink-0">
              {estadoCfg.label}
            </Badge>
          </div>

          <div className="flex items-center gap-2 mb-3">
            <Badge variant="outline" className="text-[10px]">
              {tipoLabels[proceso.tipo] || proceso.tipo}
            </Badge>
            {proceso.periodo && (
              <span className="text-[10px] text-muted-foreground">{proceso.periodo}</span>
            )}
          </div>

          {tareaStats && tareaStats.total > 0 && (
            <div className="mb-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-muted-foreground">Progreso</span>
                <span className="text-[10px] font-mono font-medium">{progress}%</span>
              </div>
              <Progress value={progress} className="h-1.5" />
            </div>
          )}

          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
            <div className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              {tareaStats ? `${tareaStats.completada}/${tareaStats.total} tareas` : '0 tareas'}
            </div>
            {proceso.fecha_limite && (
              <div className={`flex items-center gap-1 ${isOverdue ? 'text-destructive font-medium' : ''}`}>
                {isOverdue ? <Clock className="h-3 w-3" /> : <Calendar className="h-3 w-3" />}
                {proceso.fecha_limite}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
