'use client'

import { AlertTriangle } from 'lucide-react'
import { AlertsCenter } from '@/components/alertas'

export default function AlertasPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <AlertTriangle className="h-5 w-5 text-primary" />
          </div>
          Centro de Alertas
        </h1>
        <p className="text-muted-foreground mt-1">
          Monitorea anomalías, duplicados y transacciones inusuales
        </p>
      </div>

      <AlertsCenter />
    </div>
  )
}
