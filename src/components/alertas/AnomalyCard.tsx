// @ts-nocheck
'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  AlertTriangle,
  TrendingUp,
  Copy,
  UserX,
  Shuffle,
  CheckCircle,
  XCircle,
  Eye,
} from 'lucide-react'

const TIPO_ICONS: Record<string, any> = {
  monto_inusual: TrendingUp,
  proveedor_nuevo: UserX,
  posible_duplicado: Copy,
  patron_diferente: Shuffle,
  conciliacion_fallida: AlertTriangle,
}

const TIPO_LABELS: Record<string, string> = {
  monto_inusual: 'Monto Inusual',
  proveedor_nuevo: 'Proveedor Nuevo',
  posible_duplicado: 'Posible Duplicado',
  patron_diferente: 'Patrón Diferente',
  conciliacion_fallida: 'Conciliación Fallida',
}

const SEVERIDAD_STYLES: Record<string, string> = {
  alta: 'bg-red-100 text-red-700 border-red-200',
  media: 'bg-amber-100 text-amber-700 border-amber-200',
  baja: 'bg-blue-100 text-blue-700 border-blue-200',
}

interface AnomalyCardProps {
  alert: {
    _id: string
    tipo: string
    severidad: string
    titulo: string
    descripcion: string
    monto_referencia?: number
    monto_detectado?: number
    estado: string
    created_at?: string
    cliente?: { razon_social: string; rut: string } | null
  }
  onResolve: (alertId: string) => void
  onDismiss: (alertId: string) => void
  onReview: (alertId: string) => void
}

function formatCLP(amount: number): string {
  return `$${amount.toLocaleString('es-CL')}`
}

export function AnomalyCard({
  alert,
  onResolve,
  onDismiss,
  onReview,
}: AnomalyCardProps) {
  const Icon = TIPO_ICONS[alert.tipo] ?? AlertTriangle
  const isOpen = alert.estado === 'abierta' || alert.estado === 'revisada'

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="py-4">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
              alert.severidad === 'alta'
                ? 'bg-red-100 text-red-600'
                : alert.severidad === 'media'
                ? 'bg-amber-100 text-amber-600'
                : 'bg-blue-100 text-blue-600'
            }`}
          >
            <Icon className="h-5 w-5" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-sm font-semibold">{alert.titulo}</h4>
              <Badge className={SEVERIDAD_STYLES[alert.severidad] ?? ''}>
                {alert.severidad}
              </Badge>
              <Badge variant="outline" className="text-[10px]">
                {TIPO_LABELS[alert.tipo] ?? alert.tipo}
              </Badge>
            </div>

            <p className="text-xs text-muted-foreground mt-1">
              {alert.descripcion}
            </p>

            {/* Amount comparison */}
            {alert.monto_referencia != null &&
              alert.monto_detectado != null && (
                <div className="flex items-center gap-3 mt-2 text-xs">
                  <span className="text-muted-foreground">
                    Referencia:{' '}
                    <span className="font-medium text-foreground">
                      {formatCLP(alert.monto_referencia)}
                    </span>
                  </span>
                  <span className="text-muted-foreground">
                    Detectado:{' '}
                    <span className="font-semibold text-red-600">
                      {formatCLP(alert.monto_detectado)}
                    </span>
                  </span>
                </div>
              )}

            {/* Client */}
            {alert.cliente && (
              <p className="text-[10px] text-muted-foreground mt-1.5">
                {alert.cliente.razon_social} · {alert.cliente.rut}
              </p>
            )}

            {/* Date */}
            {alert.created_at && (
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {new Intl.DateTimeFormat('es-CL', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                }).format(new Date(alert.created_at))}
              </p>
            )}
          </div>

          {/* Actions */}
          {isOpen && (
            <div className="flex items-center gap-1 shrink-0">
              {alert.estado === 'abierta' && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => onReview(alert._id)}
                  title="Marcar como revisada"
                >
                  <Eye className="h-3.5 w-3.5" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-emerald-600 hover:text-emerald-700"
                onClick={() => onResolve(alert._id)}
                title="Resolver"
              >
                <CheckCircle className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-muted-foreground hover:text-red-500"
                onClick={() => onDismiss(alert._id)}
                title="Descartar"
              >
                <XCircle className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}

          {/* Resolved badge */}
          {!isOpen && (
            <Badge
              className={
                alert.estado === 'resuelta'
                  ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                  : 'bg-gray-100 text-gray-700 border-gray-200'
              }
            >
              {alert.estado === 'resuelta' ? 'Resuelta' : 'Descartada'}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
