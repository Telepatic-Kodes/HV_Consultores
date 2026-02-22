'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  CreditCard,
  Check,
  Zap,
  Building2,
  Rocket,
  ArrowUpRight,
  Loader2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react'

interface SubscriptionData {
  plan: 'free' | 'pro' | 'enterprise'
  status: string
  maxClients: number
  maxBotRuns: number
  cancelAtPeriodEnd?: boolean
  currentPeriodEnd?: string | null
  stripeCustomerId?: string | null
  stripeSubscriptionId?: string | null
}

interface UsageData {
  plan: string
  clients: { used: number; limit: number }
  botRuns: { used: number; limit: number }
}

interface SubscriptionManagerProps {
  subscription: SubscriptionData | null
  usage: UsageData | null
  userId: string
  email: string
}

const planDetails = {
  free: {
    name: 'Gratis',
    icon: Rocket,
    color: 'from-slate-500 to-slate-600',
    price: '$0',
  },
  pro: {
    name: 'Pro',
    icon: Zap,
    color: 'from-blue-500 to-blue-600',
    price: '$50 USD/mes',
  },
  enterprise: {
    name: 'Enterprise',
    icon: Building2,
    color: 'from-violet-500 to-violet-600',
    price: '$150 USD/mes',
  },
}

export function SubscriptionManager({
  subscription,
  usage,
  userId,
  email,
}: SubscriptionManagerProps) {
  const [loading, setLoading] = useState<string | null>(null)

  const plan = subscription?.plan || 'free'
  const details = planDetails[plan]
  const Icon = details.icon

  const handleCheckout = async (targetPlan: 'pro' | 'enterprise') => {
    setLoading(targetPlan)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: targetPlan, userId, email }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        console.error('Checkout error:', data.error)
      }
    } catch (err) {
      console.error('Checkout failed:', err)
    } finally {
      setLoading(null)
    }
  }

  const handlePortal = async () => {
    if (!subscription?.stripeCustomerId) return
    setLoading('portal')
    try {
      const res = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stripeCustomerId: subscription.stripeCustomerId,
        }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      }
    } catch (err) {
      console.error('Portal error:', err)
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Current Plan */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <CreditCard className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">Plan Actual</CardTitle>
              <CardDescription className="text-xs">
                Tu suscripción y facturación
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Plan badge */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-br from-muted/30 to-muted/10 border border-border/30">
            <div className="flex items-center gap-4">
              <div
                className={`h-12 w-12 rounded-lg bg-gradient-to-br ${details.color} flex items-center justify-center shadow-lg`}
              >
                <Icon className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="font-semibold text-lg">{details.name}</p>
                <p className="text-sm text-muted-foreground">{details.price}</p>
              </div>
            </div>
            <div className="text-right">
              <span
                className={`inline-block text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                  subscription?.status === 'active'
                    ? 'bg-green-100 text-green-700'
                    : subscription?.status === 'past_due'
                      ? 'bg-yellow-100 text-yellow-700'
                      : subscription?.status === 'canceled'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-blue-100 text-blue-700'
                }`}
              >
                {subscription?.status === 'active'
                  ? 'Activo'
                  : subscription?.status === 'past_due'
                    ? 'Pago pendiente'
                    : subscription?.status === 'canceled'
                      ? 'Cancelado'
                      : 'Activo'}
              </span>
            </div>
          </div>

          {/* Cancellation warning */}
          {subscription?.cancelAtPeriodEnd && subscription.currentPeriodEnd && (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-yellow-50 border border-yellow-200 text-yellow-800">
              <AlertCircle className="h-5 w-5 mt-0.5 shrink-0" />
              <div className="text-sm">
                <p className="font-medium">Cancelacion programada</p>
                <p>
                  Tu plan se cancelara el{' '}
                  {new Date(subscription.currentPeriodEnd).toLocaleDateString(
                    'es-CL'
                  )}
                  . Puedes reactivarlo antes de esa fecha.
                </p>
              </div>
            </div>
          )}

          {/* Period info */}
          {subscription?.currentPeriodEnd && plan !== 'free' && (
            <p className="text-sm text-muted-foreground">
              Proximo cobro:{' '}
              {new Date(subscription.currentPeriodEnd).toLocaleDateString(
                'es-CL',
                { year: 'numeric', month: 'long', day: 'numeric' }
              )}
            </p>
          )}

          {/* Manage button */}
          {subscription?.stripeCustomerId && (
            <Button
              variant="outline"
              onClick={handlePortal}
              disabled={loading === 'portal'}
            >
              {loading === 'portal' ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <ExternalLink className="mr-2 h-4 w-4" />
              )}
              Gestionar Facturacion
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Usage */}
      {usage && (
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Uso del Plan</CardTitle>
            <CardDescription className="text-xs">
              Consumo actual de tu suscripcion
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Clients usage */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Clientes</span>
                <span className="text-muted-foreground">
                  {usage.clients.used} / {usage.clients.limit === 999999 ? 'Ilimitados' : usage.clients.limit}
                </span>
              </div>
              {usage.clients.limit !== 999999 && (
                <Progress
                  value={(usage.clients.used / usage.clients.limit) * 100}
                  className="h-2"
                />
              )}
            </div>

            {/* Bot runs usage */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Ejecuciones de Bots (este mes)</span>
                <span className="text-muted-foreground">
                  {usage.botRuns.used} / {usage.botRuns.limit === 999999 ? 'Ilimitadas' : usage.botRuns.limit}
                </span>
              </div>
              {usage.botRuns.limit !== 999999 && (
                <Progress
                  value={(usage.botRuns.used / usage.botRuns.limit) * 100}
                  className="h-2"
                />
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upgrade options */}
      {plan !== 'enterprise' && (
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Mejorar Plan</CardTitle>
            <CardDescription className="text-xs">
              Desbloquea mas funcionalidades
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              {plan === 'free' && (
                <div className="p-4 rounded-lg border-2 border-blue-200 bg-blue-50/50 space-y-3">
                  <div className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-blue-600" />
                    <span className="font-semibold">Pro</span>
                    <span className="text-sm text-muted-foreground">
                      $50 USD/mes
                    </span>
                  </div>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li className="flex items-center gap-1.5">
                      <Check className="h-3.5 w-3.5 text-green-500" />
                      20 clientes
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="h-3.5 w-3.5 text-green-500" />
                      Bots RPA
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="h-3.5 w-3.5 text-green-500" />
                      F29 automatizado
                    </li>
                  </ul>
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={() => handleCheckout('pro')}
                    disabled={loading === 'pro'}
                  >
                    {loading === 'pro' ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <ArrowUpRight className="mr-2 h-4 w-4" />
                    )}
                    Actualizar a Pro
                  </Button>
                </div>
              )}

              <div className="p-4 rounded-lg border-2 border-violet-200 bg-violet-50/50 space-y-3">
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-violet-600" />
                  <span className="font-semibold">Enterprise</span>
                  <span className="text-sm text-muted-foreground">
                    $150 USD/mes
                  </span>
                </div>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li className="flex items-center gap-1.5">
                    <Check className="h-3.5 w-3.5 text-green-500" />
                    Clientes ilimitados
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Check className="h-3.5 w-3.5 text-green-500" />
                    Bots personalizados
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Check className="h-3.5 w-3.5 text-green-500" />
                    Soporte dedicado
                  </li>
                </ul>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full"
                  onClick={() => handleCheckout('enterprise')}
                  disabled={loading === 'enterprise'}
                >
                  {loading === 'enterprise' ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <ArrowUpRight className="mr-2 h-4 w-4" />
                  )}
                  Actualizar a Enterprise
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
