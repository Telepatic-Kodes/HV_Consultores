'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ShieldCheck, Loader2 } from 'lucide-react'

interface CredencialesData {
  rut_usuario: string
  clave: string
}

interface CredencialesSIIStepProps {
  data: CredencialesData | null
  onNext: (data: CredencialesData | null) => void
  onBack: () => void
  isSubmitting?: boolean
}

export function CredencialesSIIStep({ data, onNext, onBack, isSubmitting }: CredencialesSIIStepProps) {
  const [form, setForm] = useState<CredencialesData>(
    data ?? { rut_usuario: '', clave: '' }
  )

  const isValid = form.rut_usuario.trim() && form.clave.trim()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Credenciales SII</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Ingresa las credenciales de SII MiPyME para automatizar la descarga de documentos tributarios.
          Este paso es opcional.
        </p>
      </div>

      <div className="flex items-start gap-3 p-4 rounded-lg bg-primary/5 border border-primary/20 text-sm">
        <ShieldCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-primary">Seguridad de tus datos</p>
          <p className="text-muted-foreground mt-1">
            Las credenciales se almacenan encriptadas y solo se usan para la descarga
            automatizada de documentos desde el portal SII. Nunca se comparten con terceros.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            RUT Usuario SII
          </label>
          <Input
            value={form.rut_usuario}
            onChange={(e) => setForm((p) => ({ ...p, rut_usuario: e.target.value }))}
            placeholder="12.345.678-9"
            className="h-11 font-mono"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Clave SII
          </label>
          <Input
            type="password"
            value={form.clave}
            onChange={(e) => setForm((p) => ({ ...p, clave: e.target.value }))}
            placeholder="••••••••"
            className="h-11"
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
            disabled={!isValid || isSubmitting}
            className="shadow-executive"
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Siguiente
          </Button>
        </div>
      </div>
    </div>
  )
}
