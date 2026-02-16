'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { BookOpen, Check } from 'lucide-react'

const PLAN_PREVIEW: Record<string, string[]> = {
  '14A': [
    '1.0.0.0 — Activos',
    '1.1.0.0 — Activos Corrientes',
    '1.1.1.0 — Efectivo y Equivalentes',
    '2.0.0.0 — Pasivos',
    '3.0.0.0 — Patrimonio',
    '4.0.0.0 — Ingresos',
    '5.0.0.0 — Costos y Gastos',
  ],
  '14D': [
    '1.0.0.0 — Activos',
    '1.1.0.0 — Caja y Bancos',
    '2.0.0.0 — Pasivos',
    '3.0.0.0 — Capital',
    '4.0.0.0 — Ingresos Percibidos',
    '5.0.0.0 — Gastos Pagados',
  ],
  '14D_N3': [
    '1.0.0.0 — Activos',
    '1.1.0.0 — Caja y Bancos',
    '2.0.0.0 — Pasivos',
    '3.0.0.0 — Capital',
    '4.0.0.0 — Ingresos',
    '5.0.0.0 — Gastos',
  ],
  '14D_N8': [
    '1.0.0.0 — Activos',
    '1.1.0.0 — Caja y Bancos',
    '2.0.0.0 — Pasivos',
    '3.0.0.0 — Capital y Reservas',
    '4.0.0.0 — Ingresos Percibidos',
    '5.0.0.0 — Gastos Pagados',
  ],
}

interface PlanCuentasStepProps {
  regimen: string
  onNext: (accepted: boolean) => void
  onBack: () => void
}

export function PlanCuentasStep({ regimen, onNext, onBack }: PlanCuentasStepProps) {
  const preview = PLAN_PREVIEW[regimen] ?? PLAN_PREVIEW['14D']

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Plan de Cuentas</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Se creará automáticamente un plan de cuentas basado en el régimen seleccionado ({regimen}).
          Podrás personalizarlo después.
        </p>
      </div>

      <Card>
        <CardContent className="p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Plan de Cuentas — Régimen {regimen}</h3>
              <p className="text-xs text-muted-foreground">Vista previa de las cuentas principales</p>
            </div>
          </div>

          <div className="space-y-2">
            {preview.map((cuenta, i) => (
              <div
                key={i}
                className="flex items-center gap-3 py-2 px-3 rounded-lg bg-muted/30"
              >
                <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                <span className="text-sm font-mono">{cuenta}</span>
              </div>
            ))}
            <div className="py-2 px-3 text-center">
              <span className="text-xs text-muted-foreground">
                + más cuentas detalladas se crearán automáticamente
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={onBack}>
          Anterior
        </Button>
        <div className="flex gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onNext(false)}
            className="text-muted-foreground"
          >
            Personalizar después
          </Button>
          <Button onClick={() => onNext(true)} className="shadow-executive">
            Crear plan de cuentas
          </Button>
        </div>
      </div>
    </div>
  )
}
