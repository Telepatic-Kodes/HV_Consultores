// @ts-nocheck
'use client'

import { useState, useCallback } from 'react'
import { useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { Zap, Loader2, CheckCircle } from 'lucide-react'

interface BatchMatchButtonProps {
  clienteId: string
  periodo?: string
  onBatchComplete: (result: {
    total: number
    matched: number
    partial: number
    unmatched: number
  }) => void
  disabled?: boolean
}

type BatchState = 'idle' | 'running' | 'complete'

export function BatchMatchButton({
  clienteId,
  periodo,
  onBatchComplete,
  disabled = false,
}: BatchMatchButtonProps) {
  const [state, setState] = useState<BatchState>('idle')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<{
    total: number
    matched: number
    partial: number
    unmatched: number
  } | null>(null)

  const runBatchMutation = useMutation(api.matching.runBatchMatching)

  const runBatchMatch = useCallback(async () => {
    setState('running')
    setDialogOpen(true)
    setProgress(0)
    setResult(null)

    // Animate progress while waiting for mutation
    const progressInterval = setInterval(() => {
      setProgress((prev) => Math.min(prev + 5, 90))
    }, 200)

    try {
      const mutationResult = await runBatchMutation({
        clienteId: clienteId as Id<'clientes'>,
        periodo: periodo || undefined,
      })

      clearInterval(progressInterval)
      setProgress(100)

      const batchResult = {
        total: mutationResult.total,
        matched: mutationResult.matched,
        partial: mutationResult.partial,
        unmatched: mutationResult.unmatched,
      }
      setResult(batchResult)
      setState('complete')
      onBatchComplete(batchResult)
    } catch (error) {
      clearInterval(progressInterval)
      setProgress(0)
      setState('idle')
      setDialogOpen(false)
      console.error('Batch matching failed:', error)
    }
  }, [clienteId, periodo, onBatchComplete, runBatchMutation])

  const handleClose = useCallback(() => {
    setDialogOpen(false)
    // Reset state after dialog close animation
    setTimeout(() => {
      setState('idle')
      setProgress(0)
      setResult(null)
    }, 200)
  }, [])

  return (
    <>
      <Button
        onClick={runBatchMatch}
        disabled={disabled || state === 'running'}
        variant="default"
        size="default"
      >
        {state === 'running' ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Zap className="mr-2 h-4 w-4" />
        )}
        Conciliar Todo
      </Button>

      <Dialog open={dialogOpen} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {state === 'running'
                ? 'Conciliando transacciones...'
                : 'Conciliacion completada'}
            </DialogTitle>
            <DialogDescription>
              {state === 'running'
                ? 'Procesando el matching automatico de todas las transacciones pendientes.'
                : 'El proceso de conciliacion automatica ha finalizado.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Progress bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Progreso</span>
                <span className="font-medium">{progress}%</span>
              </div>
              <Progress value={progress} className="h-3" />
            </div>

            {/* Result stats */}
            {state === 'complete' && result && (
              <div className="space-y-4 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
                <div className="flex items-center gap-2 text-emerald-600">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">
                    Proceso finalizado exitosamente
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-border/50 p-3">
                    <p className="text-xs text-muted-foreground">Total procesadas</p>
                    <p className="text-xl font-bold">{result.total}</p>
                  </div>
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-3">
                    <p className="text-xs text-emerald-600">Conciliadas</p>
                    <p className="text-xl font-bold text-emerald-700">
                      {result.matched}
                    </p>
                  </div>
                  <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-3">
                    <p className="text-xs text-blue-600">Parciales</p>
                    <p className="text-xl font-bold text-blue-700">
                      {result.partial}
                    </p>
                  </div>
                  <div className="rounded-lg border border-red-200 bg-red-50/50 p-3">
                    <p className="text-xs text-red-600">Sin match</p>
                    <p className="text-xl font-bold text-red-700">
                      {result.unmatched}
                    </p>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button variant="outline" size="sm" onClick={handleClose}>
                    Cerrar
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
