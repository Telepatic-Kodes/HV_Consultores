'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, AlertTriangle } from 'lucide-react'

interface MatchConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  transactionDescription: string
  documentFolio: string
  documentType: string
  score: number
  onConfirm: (notas: string) => void
  onCancel: () => void
}

function getScoreClass(score: number) {
  if (score >= 90) return 'bg-emerald-100 text-emerald-700 border-emerald-200'
  if (score >= 70) return 'bg-amber-100 text-amber-700 border-amber-200'
  return 'bg-red-100 text-red-700 border-red-200'
}

function getScoreIcon(score: number) {
  if (score >= 70) {
    return <CheckCircle className="h-4 w-4" />
  }
  return <AlertTriangle className="h-4 w-4" />
}

export function MatchConfirmDialog({
  open,
  onOpenChange,
  transactionDescription,
  documentFolio,
  documentType,
  score,
  onConfirm,
  onCancel,
}: MatchConfirmDialogProps) {
  const [notas, setNotas] = useState('')

  const handleConfirm = () => {
    onConfirm(notas)
    setNotas('')
  }

  const handleCancel = () => {
    onCancel()
    setNotas('')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirmar Conciliacion</DialogTitle>
          <DialogDescription>
            Conciliar transaccion &ldquo;{transactionDescription}&rdquo; con el
            documento {documentType} folio {documentFolio}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">
              Puntaje de coincidencia:
            </span>
            <Badge className={`flex items-center gap-1 ${getScoreClass(Math.round(score * 100))}`}>
              {getScoreIcon(Math.round(score * 100))}
              {Math.round(score * 100)}%
            </Badge>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notas-conciliacion">Notas (opcional)</Label>
            <Textarea
              id="notas-conciliacion"
              placeholder="Agregar notas o comentarios sobre esta conciliación..."
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancelar
          </Button>
          <Button variant="default" onClick={handleConfirm}>
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
