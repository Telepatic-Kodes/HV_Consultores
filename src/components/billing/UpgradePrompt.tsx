'use client'

import { Button } from '@/components/ui/button'
import { Lock, ArrowUpRight } from 'lucide-react'
import Link from 'next/link'

interface UpgradePromptProps {
  feature: string
  requiredPlan?: 'pro' | 'enterprise'
  message?: string
}

export function UpgradePrompt({
  feature,
  requiredPlan = 'pro',
  message,
}: UpgradePromptProps) {
  const planName = requiredPlan === 'enterprise' ? 'Enterprise' : 'Pro'

  return (
    <div className="flex flex-col items-center justify-center p-8 rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/20 text-center space-y-4">
      <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
        <Lock className="h-6 w-6 text-muted-foreground" />
      </div>
      <div className="space-y-2 max-w-md">
        <h3 className="font-semibold text-lg">
          {feature} requiere plan {planName}
        </h3>
        <p className="text-sm text-muted-foreground">
          {message ||
            `Actualiza tu plan a ${planName} para desbloquear ${feature.toLowerCase()} y otras funcionalidades avanzadas.`}
        </p>
      </div>
      <Link href="/dashboard/configuracion?tab=facturacion">
        <Button>
          <ArrowUpRight className="mr-2 h-4 w-4" />
          Ver Planes
        </Button>
      </Link>
    </div>
  )
}
