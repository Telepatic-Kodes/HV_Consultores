// @ts-nocheck
'use client'

import { useState } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  CheckCircle,
  ChevronRight,
  ChevronLeft,
  Loader2,
  BookOpen,
  Building2,
  CreditCard,
  Sparkles,
} from 'lucide-react'

type Regimen = '14A' | '14D' | '14D_N3' | '14D_N8'

const REGIMEN_LABELS: Record<Regimen, { label: string; desc: string }> = {
  '14A': { label: 'Régimen General (14A)', desc: 'Contabilidad completa, para empresas grandes' },
  '14D': { label: 'Régimen Pro Pyme (14D)', desc: 'Simplificado para Pymes' },
  '14D_N3': {
    label: '14D N°3 - Transparencia',
    desc: 'Tributación en base a retiros',
  },
  '14D_N8': {
    label: '14D N°8 - ProPyme General',
    desc: 'Pyme con contabilidad simplificada',
  },
}

const BANCOS = [
  { code: 'bancochile', label: 'Banco de Chile' },
  { code: 'bancoestado', label: 'BancoEstado' },
  { code: 'santander', label: 'Santander' },
  { code: 'bci', label: 'BCI' },
]

interface ClientOnboardingWizardProps {
  clienteId: string
  clienteName: string
  onComplete: () => void
}

export function ClientOnboardingWizard({
  clienteId,
  clienteName,
  onComplete,
}: ClientOnboardingWizardProps) {
  const [step, setStep] = useState(0)
  const [regimen, setRegimen] = useState<Regimen | ''>('')
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [banco, setBanco] = useState('')
  const [numeroCuenta, setNumeroCuenta] = useState('')
  const [tipoCuenta, setTipoCuenta] = useState('corriente')
  const [loading, setLoading] = useState(false)
  const [cloneResult, setCloneResult] = useState<{
    planId: string
    cuentasCreadas: number
  } | null>(null)

  const plantillas = useQuery(
    api.templates.listPlantillas,
    regimen ? { regimen } : 'skip'
  )
  const cloneTemplate = useMutation(api.templates.cloneTemplateForClient)

  const steps = [
    { label: 'Régimen', icon: Building2 },
    { label: 'Plan de Cuentas', icon: BookOpen },
    { label: 'Cuenta Bancaria', icon: CreditCard },
    { label: 'Listo', icon: Sparkles },
  ]

  const handleCloneTemplate = async () => {
    if (!selectedTemplate) return
    setLoading(true)
    try {
      const result = await cloneTemplate({
        plantillaId: selectedTemplate as Id<'plantillas_plan_cuenta'>,
        clienteId: clienteId as Id<'clientes'>,
      })
      setCloneResult(result)
      setStep(2)
    } catch (err) {
      console.error('Error cloning template:', err)
    }
    setLoading(false)
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-lg">
          Configurar Cliente: {clienteName}
        </CardTitle>
        <CardDescription>
          Configura el régimen tributario, plan de cuentas y cuentas bancarias
        </CardDescription>
        {/* Step indicators */}
        <div className="flex items-center gap-2 pt-4">
          {steps.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <div
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  i < step
                    ? 'bg-emerald-100 text-emerald-700'
                    : i === step
                    ? 'bg-primary/10 text-primary'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {i < step ? (
                  <CheckCircle className="h-3.5 w-3.5" />
                ) : (
                  <s.icon className="h-3.5 w-3.5" />
                )}
                {s.label}
              </div>
              {i < steps.length - 1 && (
                <ChevronRight className="h-3 w-3 text-muted-foreground" />
              )}
            </div>
          ))}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Step 0: Régimen Tributario */}
        {step === 0 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Selecciona el régimen tributario del cliente. Esto determina qué
              plantilla de plan de cuentas se ofrecerá.
            </p>
            <div className="grid grid-cols-1 gap-3">
              {(Object.entries(REGIMEN_LABELS) as [Regimen, any][]).map(
                ([key, val]) => (
                  <button
                    key={key}
                    onClick={() => setRegimen(key)}
                    className={`flex items-start gap-3 rounded-lg border p-4 text-left transition-all hover:border-primary/50 ${
                      regimen === key
                        ? 'border-primary bg-primary/5'
                        : 'border-border'
                    }`}
                  >
                    <div
                      className={`mt-0.5 h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                        regimen === key
                          ? 'border-primary'
                          : 'border-muted-foreground/30'
                      }`}
                    >
                      {regimen === key && (
                        <div className="h-2 w-2 rounded-full bg-primary" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{val.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {val.desc}
                      </p>
                    </div>
                  </button>
                )
              )}
            </div>
            <div className="flex justify-end pt-2">
              <Button
                onClick={() => setStep(1)}
                disabled={!regimen}
              >
                Continuar
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 1: Plan de Cuentas */}
        {step === 1 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Selecciona una plantilla de plan de cuentas para el régimen{' '}
              <Badge variant="outline">{regimen}</Badge>
            </p>
            {plantillas === undefined ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : plantillas.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm font-medium">
                  No hay plantillas para este régimen
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Crea una plantilla primero en la sección de Plantillas
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {plantillas
                  .filter((p) => p.activa !== false)
                  .map((p) => (
                    <button
                      key={p._id}
                      onClick={() => setSelectedTemplate(p._id)}
                      className={`w-full flex items-center justify-between rounded-lg border p-4 text-left transition-all hover:border-primary/50 ${
                        selectedTemplate === p._id
                          ? 'border-primary bg-primary/5'
                          : 'border-border'
                      }`}
                    >
                      <div>
                        <p className="text-sm font-medium">{p.nombre}</p>
                        {p.descripcion && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {p.descripcion}
                          </p>
                        )}
                      </div>
                      <Badge variant="secondary" className="text-[10px]">
                        {p.cuentas.length} cuentas
                      </Badge>
                    </button>
                  ))}
              </div>
            )}

            <div className="flex justify-between pt-2">
              <Button variant="outline" onClick={() => setStep(0)}>
                <ChevronLeft className="mr-1 h-4 w-4" />
                Atrás
              </Button>
              <Button
                onClick={handleCloneTemplate}
                disabled={!selectedTemplate || loading}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Aplicar plantilla
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Cuenta Bancaria */}
        {step === 2 && (
          <div className="space-y-4">
            {cloneResult && (
              <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50/50 p-3">
                <CheckCircle className="h-4 w-4 text-emerald-600" />
                <span className="text-sm text-emerald-700">
                  Plan de cuentas creado con {cloneResult.cuentasCreadas} cuentas
                </span>
              </div>
            )}

            <p className="text-sm text-muted-foreground">
              Configura la cuenta bancaria principal del cliente (opcional)
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Banco</Label>
                <Select value={banco} onValueChange={setBanco}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar banco" />
                  </SelectTrigger>
                  <SelectContent>
                    {BANCOS.map((b) => (
                      <SelectItem key={b.code} value={b.code}>
                        {b.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tipo de cuenta</Label>
                <Select value={tipoCuenta} onValueChange={setTipoCuenta}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="corriente">Corriente</SelectItem>
                    <SelectItem value="vista">Vista</SelectItem>
                    <SelectItem value="ahorro">Ahorro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="num-cuenta">Número de cuenta</Label>
              <Input
                id="num-cuenta"
                placeholder="Ej: 1234567890"
                value={numeroCuenta}
                onChange={(e) => setNumeroCuenta(e.target.value)}
              />
            </div>

            <div className="flex justify-between pt-2">
              <Button variant="outline" onClick={() => setStep(1)}>
                <ChevronLeft className="mr-1 h-4 w-4" />
                Atrás
              </Button>
              <Button onClick={() => setStep(3)}>
                {banco && numeroCuenta ? 'Continuar' : 'Omitir'}
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Complete */}
        {step === 3 && (
          <div className="space-y-4 text-center py-4">
            <div className="flex justify-center">
              <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center">
                <Sparkles className="h-8 w-8 text-emerald-600" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold">
                Configuración completada
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {clienteName} está listo para operar
              </p>
            </div>

            <div className="flex flex-col gap-2 items-center text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-500" />
                Régimen: <Badge variant="outline">{regimen}</Badge>
              </div>
              {cloneResult && (
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                  Plan de cuentas: {cloneResult.cuentasCreadas} cuentas
                </div>
              )}
              {banco && numeroCuenta && (
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                  Cuenta bancaria configurada
                </div>
              )}
            </div>

            <Button className="mt-4" onClick={onComplete}>
              Ir al dashboard del cliente
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
