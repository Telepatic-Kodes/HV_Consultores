'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

const REGIMENES = [
  {
    value: '14A' as const,
    nombre: 'Régimen General (14A)',
    descripcion: 'Para empresas con ingresos anuales sobre 75.000 UF. Tributación sobre renta efectiva con contabilidad completa.',
    ideal: 'Grandes empresas y sociedades anónimas',
  },
  {
    value: '14D' as const,
    nombre: 'Pro PyME Simplificado (14D)',
    descripcion: 'Régimen simplificado para PyMEs con ingresos hasta 75.000 UF. Base imponible: ingresos percibidos menos gastos pagados.',
    ideal: 'PyMEs que buscan simplicidad contable',
  },
  {
    value: '14D_N3' as const,
    nombre: 'Pro PyME Transparente (14D N°3)',
    descripcion: 'Los socios tributan directamente. La empresa no paga impuesto de primera categoría. Ingresos hasta 75.000 UF.',
    ideal: 'PyMEs con socios personas naturales',
  },
  {
    value: '14D_N8' as const,
    nombre: 'Pro PyME General (14D N°8)',
    descripcion: 'Similar al 14D pero con opción de reinversión y tasa del 25%. Permite deducción del 50% de la renta.',
    ideal: 'PyMEs que reinvierten utilidades',
  },
]

interface RegimenStepProps {
  data: string | null
  onNext: (regimen: string) => void
  onBack: () => void
}

export function RegimenStep({ data, onNext, onBack }: RegimenStepProps) {
  const [selected, setSelected] = useState(data ?? '')

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Régimen Tributario</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Selecciona el régimen tributario del cliente. Esto determinará el plan de cuentas sugerido.
        </p>
      </div>

      <div className="grid gap-3">
        {REGIMENES.map((regimen) => (
          <Card
            key={regimen.value}
            className={cn(
              'cursor-pointer transition-all duration-200 hover:shadow-md',
              selected === regimen.value
                ? 'ring-2 ring-primary border-primary bg-primary/5'
                : 'hover:border-primary/30'
            )}
            onClick={() => setSelected(regimen.value)}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div
                  className={cn(
                    'h-8 w-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 transition-all',
                    selected === regimen.value
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  {selected === regimen.value ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <span className="text-xs font-bold">{regimen.value.replace('14D_', '')}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm">{regimen.nombre}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{regimen.descripcion}</p>
                  <p className="text-xs text-primary/80 font-medium mt-2">
                    Ideal para: {regimen.ideal}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={onBack}>
          Anterior
        </Button>
        <Button
          onClick={() => selected && onNext(selected)}
          disabled={!selected}
          className="shadow-executive"
        >
          Siguiente
        </Button>
      </div>
    </div>
  )
}
