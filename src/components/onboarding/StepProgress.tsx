'use client'

import { Check } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StepProgressProps {
  steps: { label: string; icon: LucideIcon }[]
  currentStep: number
}

export function StepProgress({ steps, currentStep }: StepProgressProps) {
  return (
    <div className="w-full">
      {/* Desktop: horizontal */}
      <div className="hidden md:flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep
          const isCurrent = index === currentStep
          const Icon = step.icon

          return (
            <div key={index} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-2">
                <div
                  className={cn(
                    'h-10 w-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ring-2',
                    isCompleted && 'bg-emerald-500 text-white ring-emerald-500/30',
                    isCurrent && 'bg-primary text-primary-foreground ring-primary/30 shadow-lg shadow-primary/20',
                    !isCompleted && !isCurrent && 'bg-muted text-muted-foreground ring-border/50'
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <Icon className="h-5 w-5" />
                  )}
                </div>
                <span
                  className={cn(
                    'text-xs font-medium text-center max-w-[80px] leading-tight',
                    isCurrent && 'text-primary font-semibold',
                    isCompleted && 'text-emerald-600',
                    !isCompleted && !isCurrent && 'text-muted-foreground'
                  )}
                >
                  {step.label}
                </span>
              </div>

              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="flex-1 mx-3 mt-[-24px]">
                  <div
                    className={cn(
                      'h-0.5 w-full rounded-full transition-all duration-300',
                      index < currentStep ? 'bg-emerald-500' : 'bg-border'
                    )}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Mobile: compact */}
      <div className="md:hidden">
        <div className="flex items-center gap-3 mb-2">
          {steps.map((_, index) => (
            <div
              key={index}
              className={cn(
                'h-1.5 flex-1 rounded-full transition-all duration-300',
                index < currentStep && 'bg-emerald-500',
                index === currentStep && 'bg-primary',
                index > currentStep && 'bg-border'
              )}
            />
          ))}
        </div>
        <p className="text-sm text-muted-foreground">
          Paso {currentStep + 1} de {steps.length}:{' '}
          <span className="font-medium text-foreground">{steps[currentStep]?.label}</span>
        </p>
      </div>
    </div>
  )
}
