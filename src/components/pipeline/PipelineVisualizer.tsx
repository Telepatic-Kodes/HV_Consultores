'use client'

import { cn } from '@/lib/utils'
import {
  Download,
  Sparkles,
  Tags,
  ArrowLeftRight,
  ShieldCheck,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Pause,
  XCircle,
} from 'lucide-react'

const STEPS = [
  { key: 'import', label: 'Importar', icon: Download },
  { key: 'normalize', label: 'Normalizar', icon: Sparkles },
  { key: 'categorize', label: 'Categorizar', icon: Tags },
  { key: 'match', label: 'Conciliar', icon: ArrowLeftRight },
  { key: 'validate', label: 'Validar', icon: ShieldCheck },
  { key: 'alert', label: 'Alertar', icon: AlertTriangle },
  { key: 'approve', label: 'Aprobar', icon: CheckCircle },
]

interface PipelineVisualizerProps {
  estado: string
  pasoActual?: number
  className?: string
}

export function PipelineVisualizer({
  estado,
  pasoActual,
  className,
}: PipelineVisualizerProps) {
  const isCompleted = estado === 'completed'
  const isFailed = estado === 'failed'
  const isPaused = estado === 'paused'

  const activeStepIndex = STEPS.findIndex((s) => s.key === estado)
  const currentStep = pasoActual ? pasoActual - 1 : activeStepIndex

  return (
    <div className={cn('flex items-center gap-1', className)}>
      {STEPS.map((step, index) => {
        const isActive = index === currentStep && !isCompleted && !isFailed
        const isDone = isCompleted || index < currentStep
        const isPending = !isDone && !isActive

        const StepIcon = step.icon

        return (
          <div key={step.key} className="flex items-center gap-1">
            {/* Step node */}
            <div
              className={cn(
                'flex flex-col items-center gap-1.5 transition-all',
              )}
            >
              <div
                className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-full border-2 transition-all',
                  isDone &&
                    'border-emerald-500 bg-emerald-500 text-white',
                  isActive &&
                    'border-primary bg-primary/10 text-primary',
                  isPending &&
                    'border-muted-foreground/20 bg-muted text-muted-foreground/40',
                  isFailed &&
                    index === currentStep &&
                    'border-red-500 bg-red-500/10 text-red-500',
                  isPaused &&
                    index === currentStep &&
                    'border-amber-500 bg-amber-500/10 text-amber-500'
                )}
              >
                {isActive && !isPaused && !isFailed ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : isDone ? (
                  <CheckCircle className="h-4 w-4" />
                ) : isFailed && index === currentStep ? (
                  <XCircle className="h-4 w-4" />
                ) : isPaused && index === currentStep ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <StepIcon className="h-4 w-4" />
                )}
              </div>
              <span
                className={cn(
                  'text-[10px] font-medium',
                  isDone && 'text-emerald-600',
                  isActive && 'text-primary',
                  isPending && 'text-muted-foreground/50'
                )}
              >
                {step.label}
              </span>
            </div>

            {/* Connector line */}
            {index < STEPS.length - 1 && (
              <div
                className={cn(
                  'h-0.5 w-4 mb-5 transition-colors',
                  isDone ? 'bg-emerald-500' : 'bg-muted-foreground/15'
                )}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
