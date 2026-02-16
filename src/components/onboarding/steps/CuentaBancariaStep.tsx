'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

const BANCOS = [
  { value: 'bancoestado', label: 'Banco Estado' },
  { value: 'bancochile', label: 'Banco Chile' },
  { value: 'santander', label: 'Santander' },
  { value: 'bci', label: 'BCI' },
] as const

const TIPOS_CUENTA = [
  { value: 'corriente', label: 'Cuenta Corriente' },
  { value: 'vista', label: 'Cuenta Vista' },
  { value: 'ahorro', label: 'Cuenta Ahorro' },
] as const

interface CuentaBancariaData {
  banco: string
  tipo_cuenta: string
  numero_cuenta: string
}

interface CuentaBancariaStepProps {
  data: CuentaBancariaData | null
  onNext: (data: CuentaBancariaData | null) => void
  onBack: () => void
}

export function CuentaBancariaStep({ data, onNext, onBack }: CuentaBancariaStepProps) {
  const [form, setForm] = useState<CuentaBancariaData>(
    data ?? { banco: '', tipo_cuenta: '', numero_cuenta: '' }
  )

  const isValid = form.banco && form.tipo_cuenta && form.numero_cuenta.trim()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Cuenta Bancaria</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Agrega la cuenta bancaria principal del cliente para la conciliación automática.
          Este paso es opcional.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Banco
          </label>
          <select
            className="w-full h-11 rounded-lg border border-border/50 bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
            value={form.banco}
            onChange={(e) => setForm((p) => ({ ...p, banco: e.target.value }))}
          >
            <option value="">Seleccionar banco...</option>
            {BANCOS.map((b) => (
              <option key={b.value} value={b.value}>
                {b.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Tipo de Cuenta
          </label>
          <select
            className="w-full h-11 rounded-lg border border-border/50 bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
            value={form.tipo_cuenta}
            onChange={(e) => setForm((p) => ({ ...p, tipo_cuenta: e.target.value }))}
          >
            <option value="">Seleccionar tipo...</option>
            {TIPOS_CUENTA.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Número de Cuenta
          </label>
          <Input
            value={form.numero_cuenta}
            onChange={(e) => setForm((p) => ({ ...p, numero_cuenta: e.target.value }))}
            placeholder="0012345678"
            className="h-11 font-mono"
          />
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={onBack}>
          Anterior
        </Button>
        <div className="flex gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onNext(null)}
            className="text-muted-foreground"
          >
            Omitir
          </Button>
          <Button
            onClick={() => isValid && onNext(form)}
            disabled={!isValid}
            className="shadow-executive"
          >
            Siguiente
          </Button>
        </div>
      </div>
    </div>
  )
}
