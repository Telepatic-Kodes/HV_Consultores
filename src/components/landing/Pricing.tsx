import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Check, Zap, Building2, Rocket } from 'lucide-react'
import Link from 'next/link'

const plans = [
  {
    key: 'free',
    name: 'Gratis',
    price: '$0',
    period: '',
    description: 'Para empezar a explorar la plataforma',
    icon: Rocket,
    color: 'from-slate-500 to-slate-600',
    features: [
      '1 cliente',
      'Clasificación básica de documentos',
      'Cálculo F29 manual',
      'Chat IA (10 consultas/mes)',
      'Soporte por email',
    ],
    cta: 'Comenzar Gratis',
    ctaVariant: 'outline' as const,
    popular: false,
  },
  {
    key: 'pro',
    name: 'Pro',
    price: '$50',
    period: 'USD/mes',
    description: 'Para estudios contables en crecimiento',
    icon: Zap,
    color: 'from-blue-500 to-blue-600',
    features: [
      'Hasta 20 clientes',
      'Clasificación IA avanzada (95% precisión)',
      'F29 automatizado + validaciones',
      'Bots RPA (SII, Previred, AFC)',
      'Chat IA ilimitado',
      'Conciliación bancaria',
      'Reportes ejecutivos',
      'Soporte prioritario',
    ],
    cta: 'Comenzar con Pro',
    ctaVariant: 'default' as const,
    popular: true,
  },
  {
    key: 'enterprise',
    name: 'Enterprise',
    price: '$150',
    period: 'USD/mes',
    description: 'Para estudios contables consolidados',
    icon: Building2,
    color: 'from-violet-500 to-violet-600',
    features: [
      'Clientes ilimitados',
      'Todo lo de Pro incluido',
      'Bots RPA personalizados',
      'Pipeline de conciliación automática',
      'Alertas de anomalías con IA',
      'Analytics avanzados',
      'Acceso API',
      'Soporte dedicado 24/7',
      'Onboarding personalizado',
    ],
    cta: 'Contactar Ventas',
    ctaVariant: 'outline' as const,
    popular: false,
  },
]

export function Pricing() {
  return (
    <section id="precios" className="py-16 lg:py-24">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Section header */}
        <div className="text-center max-w-3xl mx-auto mb-12 lg:mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Planes y Precios
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Elige el plan que mejor se adapte al tamaño de tu estudio contable.
            Sin contratos a largo plazo, cancela cuando quieras.
          </p>
        </div>

        {/* Plans grid */}
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <Card
              key={plan.key}
              className={`relative overflow-hidden transition-all hover:shadow-lg ${
                plan.popular
                  ? 'ring-2 ring-primary shadow-lg scale-[1.02]'
                  : ''
              }`}
            >
              {/* Popular badge */}
              {plan.popular && (
                <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-bl-lg">
                  MAS POPULAR
                </div>
              )}

              {/* Gradient accent */}
              <div
                className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${plan.color}`}
              />

              <CardHeader className="pb-4">
                <div
                  className={`h-12 w-12 rounded-lg bg-gradient-to-br ${plan.color} flex items-center justify-center shadow-lg`}
                >
                  <plan.icon className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="mt-4 text-xl">{plan.name}</CardTitle>
                <CardDescription className="text-sm">
                  {plan.description}
                </CardDescription>

                <div className="mt-4">
                  <span className="text-4xl font-bold text-foreground">
                    {plan.price}
                  </span>
                  {plan.period && (
                    <span className="text-muted-foreground ml-1">
                      {plan.period}
                    </span>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link href={plan.key === 'enterprise' ? '#contacto' : '/auth'}>
                  <Button
                    variant={plan.ctaVariant}
                    className={`w-full mt-4 ${
                      plan.popular
                        ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white'
                        : ''
                    }`}
                    size="lg"
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Bottom note */}
        <p className="text-center text-sm text-muted-foreground mt-8">
          Todos los precios en USD. IVA no incluido. Facturación mensual.
          <br />
          Prueba gratuita de 14 días en todos los planes de pago.
        </p>
      </div>
    </section>
  )
}
