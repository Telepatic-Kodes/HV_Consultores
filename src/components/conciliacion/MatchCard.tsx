'use client'

import { CheckCircle, XCircle, FileText } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

interface CandidateDocument {
  _id: string
  tipo_documento: string
  folio: string
  fecha_emision: string
  rut_emisor: string
  razon_social_emisor?: string
  monto_total?: number
}

interface Candidate {
  documento: CandidateDocument
  score: number
  reasons: string[]
  diferencia_monto: number
  diferencia_dias: number
}

export interface MatchCardProps {
  candidate: Candidate
  onConfirm: (documentId: string) => void
  onReject: () => void
}

function formatCLP(amount: number): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return new Intl.DateTimeFormat('es-CL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

function getScoreColor(score: number): {
  bar: string
  text: string
  bg: string
} {
  if (score >= 0.7) {
    return {
      bar: '[&>div]:bg-emerald-500',
      text: 'text-emerald-600',
      bg: 'bg-emerald-500/10',
    }
  }
  if (score >= 0.5) {
    return {
      bar: '[&>div]:bg-amber-500',
      text: 'text-amber-600',
      bg: 'bg-amber-500/10',
    }
  }
  return {
    bar: '[&>div]:bg-red-500',
    text: 'text-red-600',
    bg: 'bg-red-500/10',
  }
}

export function MatchCard({ candidate, onConfirm, onReject }: MatchCardProps) {
  const { documento, score, reasons, diferencia_monto, diferencia_dias } =
    candidate
  const percentage = Math.round(score * 100)
  const scoreColor = getScoreColor(score)

  return (
    <Card className="transition-shadow duration-200 hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <Badge variant="secondary">{documento.tipo_documento}</Badge>
          </div>
          <span className="text-sm font-semibold text-foreground">
            Folio {documento.folio}
          </span>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Confidence gauge */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              Confianza
            </span>
            <span
              className={cn('text-xs font-semibold', scoreColor.text)}
            >
              {percentage}%
            </span>
          </div>
          <Progress
            value={percentage}
            className={cn('h-2', scoreColor.bar)}
          />
        </div>

        {/* Document details */}
        <div className="space-y-1.5 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">RUT Emisor</span>
            <span className="font-medium text-foreground">
              {documento.rut_emisor}
            </span>
          </div>
          {documento.razon_social_emisor && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Razon Social</span>
              <span className="font-medium text-foreground truncate ml-2 max-w-[180px]">
                {documento.razon_social_emisor}
              </span>
            </div>
          )}
          {documento.monto_total != null && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Monto</span>
              <span className="font-semibold text-foreground">
                {formatCLP(documento.monto_total)}
              </span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Fecha</span>
            <span className="font-medium text-foreground">
              {formatDate(documento.fecha_emision)}
            </span>
          </div>
        </div>

        {/* Match reasons */}
        {reasons.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {reasons.map((reason, idx) => (
              <span
                key={idx}
                className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
              >
                {reason}
              </span>
            ))}
          </div>
        )}

        {/* Differences */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>
            Dif. monto:{' '}
            <span className="font-medium">{formatCLP(diferencia_monto)}</span>
          </span>
          <span>
            Dif. dias:{' '}
            <span className="font-medium">
              {diferencia_dias} {Math.abs(diferencia_dias) === 1 ? 'dia' : 'dias'}
            </span>
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-1">
          <Button
            size="sm"
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={() => onConfirm(documento._id)}
          >
            <CheckCircle className="mr-1.5 h-4 w-4" />
            Confirmar
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={onReject}
          >
            <XCircle className="mr-1.5 h-4 w-4" />
            Rechazar
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
