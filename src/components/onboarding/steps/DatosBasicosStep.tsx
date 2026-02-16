'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'

interface DatosBasicosData {
  razon_social: string
  rut: string
  nombre_fantasia: string
  giro: string
  direccion: string
  comuna: string
  region: string
  tasa_ppm: string
}

interface DatosBasicosStepProps {
  data: DatosBasicosData | null
  onNext: (data: DatosBasicosData) => void
}

function formatRut(value: string): string {
  const clean = value.replace(/[^0-9kK]/g, '')
  if (clean.length <= 1) return clean
  const body = clean.slice(0, -1)
  const dv = clean.slice(-1)
  const formatted = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return `${formatted}-${dv}`
}

function validateRut(rut: string): boolean {
  const clean = rut.replace(/[.\-]/g, '').toUpperCase()
  if (clean.length < 8 || clean.length > 9) return false
  const body = clean.slice(0, -1)
  const dv = clean.slice(-1)
  let sum = 0
  let mul = 2
  for (let i = body.length - 1; i >= 0; i--) {
    sum += parseInt(body[i]) * mul
    mul = mul === 7 ? 2 : mul + 1
  }
  const expected = 11 - (sum % 11)
  const dvExpected = expected === 11 ? '0' : expected === 10 ? 'K' : expected.toString()
  return dv === dvExpected
}

export function DatosBasicosStep({ data, onNext }: DatosBasicosStepProps) {
  const [form, setForm] = useState<DatosBasicosData>(
    data ?? {
      razon_social: '',
      rut: '',
      nombre_fantasia: '',
      giro: '',
      direccion: '',
      comuna: '',
      region: '',
      tasa_ppm: '',
    }
  )
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!form.razon_social.trim()) {
      setError('La razón social es obligatoria')
      return
    }
    if (!form.rut.trim()) {
      setError('El RUT es obligatorio')
      return
    }
    if (!validateRut(form.rut)) {
      setError('El RUT ingresado no es válido')
      return
    }

    onNext(form)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Datos Básicos de la Empresa</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Información principal de identificación del cliente
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-destructive/5 border border-destructive/20 text-destructive text-sm">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-border/30">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Identificación
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Razón Social <span className="text-destructive">*</span>
            </label>
            <Input
              value={form.razon_social}
              onChange={(e) => setForm((p) => ({ ...p, razon_social: e.target.value }))}
              placeholder="Distribuidora Los Andes SpA"
              className="h-11"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              RUT <span className="text-destructive">*</span>
            </label>
            <Input
              value={form.rut}
              onChange={(e) => setForm((p) => ({ ...p, rut: formatRut(e.target.value) }))}
              placeholder="76.543.210-K"
              className="h-11 font-mono"
              maxLength={12}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Nombre Fantasía
            </label>
            <Input
              value={form.nombre_fantasia}
              onChange={(e) => setForm((p) => ({ ...p, nombre_fantasia: e.target.value }))}
              placeholder="Nombre comercial"
              className="h-11"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Giro
            </label>
            <Input
              value={form.giro}
              onChange={(e) => setForm((p) => ({ ...p, giro: e.target.value }))}
              placeholder="Distribución de alimentos y bebidas"
              className="h-11"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Tasa PPM (%)
            </label>
            <Input
              type="number"
              step="0.01"
              value={form.tasa_ppm}
              onChange={(e) => setForm((p) => ({ ...p, tasa_ppm: e.target.value }))}
              placeholder="1.0"
              className="h-11 font-mono"
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-border/30">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Ubicación
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Dirección
            </label>
            <Input
              value={form.direccion}
              onChange={(e) => setForm((p) => ({ ...p, direccion: e.target.value }))}
              placeholder="Av. Providencia 1234, Oficina 501"
              className="h-11"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Comuna
            </label>
            <Input
              value={form.comuna}
              onChange={(e) => setForm((p) => ({ ...p, comuna: e.target.value }))}
              placeholder="Providencia"
              className="h-11"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Región
            </label>
            <Input
              value={form.region}
              onChange={(e) => setForm((p) => ({ ...p, region: e.target.value }))}
              placeholder="Metropolitana"
              className="h-11"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <Button type="submit" className="shadow-executive">
          Siguiente
        </Button>
      </div>
    </form>
  )
}
