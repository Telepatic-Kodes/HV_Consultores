'use client'

import { useState } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Check, X, ArrowRight, FlaskConical, Loader2 } from 'lucide-react'
import Link from 'next/link'

interface ResumenStepProps {
  data: {
    datosBasicos: any
    regimen: string | null
    planCuentas: boolean | null
    cuentaBancaria: any | null
    credenciales: any | null
  }
  clienteId: string | null
  onBack: () => void
}

function StatusBadge({ configured }: { configured: boolean }) {
  return configured ? (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600">
      <Check className="h-3.5 w-3.5" /> Configurado
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
      <X className="h-3.5 w-3.5" /> Omitido
    </span>
  )
}

const BANCO_LABELS: Record<string, string> = {
  bancochile: 'Banco Chile',
  bancoestado: 'Banco Estado',
  santander: 'Santander',
  bci: 'BCI',
}

export function ResumenStep({ data, clienteId, onBack }: ResumenStepProps) {
  const db = data.datosBasicos
  const clientes = useQuery(api.clients.listClientes, {})
  const seedDemoData = useMutation(api.seed.seedDemoData)
  const [seedLoading, setSeedLoading] = useState(false)
  const [seedDone, setSeedDone] = useState(false)

  // Show offer only when this is the first/only client
  const isFirstClient = clientes && clientes.length <= 1

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Resumen</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Revisa la configuración del nuevo cliente antes de continuar
        </p>
      </div>

      {/* Client info summary */}
      <Card>
        <CardContent className="p-5 space-y-4">
          <h3 className="font-semibold text-sm border-b border-border/30 pb-2">
            Datos de la Empresa
          </h3>
          <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <div>
              <span className="text-muted-foreground text-xs uppercase tracking-wider">Razón Social</span>
              <p className="font-medium">{db?.razon_social}</p>
            </div>
            <div>
              <span className="text-muted-foreground text-xs uppercase tracking-wider">RUT</span>
              <p className="font-mono">{db?.rut}</p>
            </div>
            {db?.giro && (
              <div className="col-span-2">
                <span className="text-muted-foreground text-xs uppercase tracking-wider">Giro</span>
                <p>{db.giro}</p>
              </div>
            )}
            {db?.comuna && (
              <div>
                <span className="text-muted-foreground text-xs uppercase tracking-wider">Comuna</span>
                <p>{db.comuna}</p>
              </div>
            )}
            {db?.region && (
              <div>
                <span className="text-muted-foreground text-xs uppercase tracking-wider">Región</span>
                <p>{db.region}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Configuration checklist */}
      <Card>
        <CardContent className="p-5 space-y-3">
          <h3 className="font-semibold text-sm border-b border-border/30 pb-2">
            Configuración
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-1">
              <span className="text-sm">Régimen Tributario</span>
              <span className="text-sm font-medium">{data.regimen || 'No seleccionado'}</span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-sm">Plan de Cuentas</span>
              <StatusBadge configured={!!data.planCuentas} />
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-sm">Cuenta Bancaria</span>
              {data.cuentaBancaria ? (
                <span className="text-sm font-medium">
                  {BANCO_LABELS[data.cuentaBancaria.banco] ?? data.cuentaBancaria.banco}
                </span>
              ) : (
                <StatusBadge configured={false} />
              )}
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-sm">Credenciales SII</span>
              <StatusBadge configured={!!data.credenciales} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Seed data offer for first-time users */}
      {isFirstClient && !seedDone && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-5">
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <FlaskConical className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-sm">¿Primera vez? Carga datos de ejemplo</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Agrega 3 empresas chilenas con documentos, F29, transacciones y más para explorar todos los flujos.
                </p>
                <Button
                  size="sm"
                  className="mt-3"
                  disabled={seedLoading}
                  onClick={async () => {
                    setSeedLoading(true)
                    try {
                      await seedDemoData()
                      setSeedDone(true)
                    } catch {
                      // silently handle — data may already exist
                    }
                    setSeedLoading(false)
                  }}
                >
                  {seedLoading ? (
                    <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <FlaskConical className="mr-2 h-3.5 w-3.5" />
                  )}
                  Cargar datos de ejemplo
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {seedDone && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">
          <Check className="h-4 w-4" />
          Datos de ejemplo cargados. ¡Explora el dashboard!
        </div>
      )}

      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={onBack}>
          Anterior
        </Button>
        <div className="flex gap-3">
          <Link href="/dashboard/clientes">
            <Button variant="ghost" className="text-muted-foreground">
              Configurar más tarde
            </Button>
          </Link>
          <Link href={clienteId ? `/dashboard/clientes/${clienteId}` : '/dashboard/clientes'}>
            <Button className="shadow-executive">
              Ir al Dashboard del Cliente
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
