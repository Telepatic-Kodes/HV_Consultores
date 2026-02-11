'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, BarChart3, Bot, Clock, FileCheck, Play, CheckCircle2, Building2 } from 'lucide-react'
import { useEffect, useState } from 'react'

// Animated counter hook
function useAnimatedCounter(target: number, duration: number = 2000) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    let start = 0
    const increment = target / (duration / 16)
    const timer = setInterval(() => {
      start += increment
      if (start >= target) {
        setCount(target)
        clearInterval(timer)
      } else {
        setCount(Math.floor(start))
      }
    }, 16)
    return () => clearInterval(timer)
  }, [target, duration])

  return count
}

// Client logos for social proof
const clientLogos = [
  { name: 'Contadores Asociados', initials: 'CA' },
  { name: 'BDO Chile', initials: 'BDO' },
  { name: 'PKF Chile', initials: 'PKF' },
  { name: 'Moore Chile', initials: 'MC' },
  { name: 'Grant Thornton', initials: 'GT' },
]

export function Hero() {
  const hoursCount = useAnimatedCounter(170)
  const accuracyCount = useAnimatedCounter(95)
  const clientsCount = useAnimatedCounter(50)

  return (
    <section className="relative overflow-hidden pt-24 pb-16 lg:pt-32 lg:pb-24">
      {/* Background gradient */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-[40%] top-0 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-primary/5 blur-3xl animate-pulse" />
        <div className="absolute right-[20%] top-1/2 h-[400px] w-[400px] rounded-full bg-secondary/5 blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="container mx-auto px-4 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="text-center lg:text-left">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <Clock className="h-4 w-4" />
              <span>Ahorra <strong>{hoursCount}+</strong> horas mensuales</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
              Transformación Digital para{' '}
              <span className="text-primary relative">
                Contabilidad
                <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 8" fill="none">
                  <path d="M1 5.5C47.6667 2.16667 141.4 -2.2 199 5.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-secondary/40"/>
                </svg>
              </span>
            </h1>

            {/* Subheadline */}
            <p className="mt-6 text-lg leading-8 text-muted-foreground max-w-xl mx-auto lg:mx-0 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
              Reduce de <strong className="text-foreground">225 a 55 horas manuales</strong> al mes con nuestra suite de
              herramientas de IA. Automatiza clasificación de documentos, formularios F29,
              y consultas con portales gubernamentales.
            </p>

            {/* CTA Buttons */}
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
              <Button size="xl" asChild className="shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5">
                <Link href="#contacto">
                  Solicitar Demo Gratuita
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="xl" variant="outline" asChild className="group">
                <Link href="/como-usar">
                  <Play className="mr-2 h-5 w-5 group-hover:text-primary transition-colors" />
                  Ver Cómo Funciona
                </Link>
              </Button>
            </div>

            {/* Trust indicators with animated counters */}
            <div className="mt-10 flex flex-wrap gap-8 justify-center lg:justify-start text-sm animate-in fade-in slide-in-from-bottom-4 duration-500 delay-400">
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="h-10 w-10 rounded-full bg-secondary/10 flex items-center justify-center">
                  <FileCheck className="h-5 w-5 text-secondary" />
                </div>
                <div>
                  <span className="text-lg font-bold text-foreground">{accuracyCount}%</span>
                  <p className="text-xs">precisión IA</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="h-10 w-10 rounded-full bg-secondary/10 flex items-center justify-center">
                  <Bot className="h-5 w-5 text-secondary" />
                </div>
                <div>
                  <span className="text-lg font-bold text-foreground">24/7</span>
                  <p className="text-xs">automatización</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="h-10 w-10 rounded-full bg-secondary/10 flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 text-secondary" />
                </div>
                <div>
                  <span className="text-lg font-bold text-foreground">&lt;0.5%</span>
                  <p className="text-xs">errores</p>
                </div>
              </div>
            </div>

            {/* Client logos - Social proof */}
            <div className="mt-12 pt-8 border-t animate-in fade-in slide-in-from-bottom-4 duration-500 delay-500">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2 justify-center lg:justify-start">
                <Building2 className="h-4 w-4" />
                Confían en nosotros {clientsCount}+ estudios contables
              </p>
              <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
                {clientLogos.map((client) => (
                  <div
                    key={client.name}
                    className="h-10 px-4 rounded-lg bg-muted/50 flex items-center justify-center text-sm font-semibold text-muted-foreground hover:bg-muted transition-colors"
                    title={client.name}
                  >
                    {client.initials}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Mobile Dashboard Preview (visible below lg) */}
          <div className="lg:hidden mt-10 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-400">
            <div className="rounded-xl border bg-white shadow-lg overflow-hidden">
              <div className="border-b bg-muted/50 px-3 py-2 flex items-center gap-2">
                <div className="flex gap-1">
                  <div className="h-2 w-2 rounded-full bg-red-400" />
                  <div className="h-2 w-2 rounded-full bg-yellow-400" />
                  <div className="h-2 w-2 rounded-full bg-green-400" />
                </div>
                <div className="flex-1 text-center text-xs text-muted-foreground">
                  dashboard.hv-consultores.cl
                </div>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Docs Hoy', value: '47', color: 'bg-primary', change: '+12%' },
                    { label: 'Clasificados', value: '45', color: 'bg-secondary', change: '+8%' },
                    { label: 'Pendientes', value: '2', color: 'bg-accent', change: '-23%' },
                  ].map((stat) => (
                    <div key={stat.label} className="rounded-lg border p-2.5 text-center">
                      <div className={`h-1.5 w-6 rounded mx-auto mb-1.5 ${stat.color}`} />
                      <p className="text-xl font-bold">{stat.value}</p>
                      <p className="text-[10px] text-muted-foreground">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Desktop Dashboard Preview (visible lg+) */}
          <div className="relative hidden lg:block animate-in fade-in slide-in-from-right-8 duration-700 delay-200">
            <div className="relative rounded-xl border bg-white shadow-2xl overflow-hidden">
              {/* Mock dashboard header */}
              <div className="border-b bg-muted/50 px-4 py-3 flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-red-400" />
                  <div className="h-3 w-3 rounded-full bg-yellow-400" />
                  <div className="h-3 w-3 rounded-full bg-green-400" />
                </div>
                <div className="flex-1 text-center text-xs text-muted-foreground">
                  dashboard.hv-consultores.cl
                </div>
              </div>

              {/* Mock dashboard content */}
              <div className="p-6">
                <div className="grid grid-cols-3 gap-4 mb-6">
                  {[
                    { label: 'Documentos Hoy', value: '47', color: 'bg-primary', change: '+12%' },
                    { label: 'Clasificados', value: '45', color: 'bg-secondary', change: '+8%' },
                    { label: 'Pendientes', value: '2', color: 'bg-accent', change: '-23%' },
                  ].map((stat) => (
                    <div key={stat.label} className="rounded-lg border p-3 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-2">
                        <div className={`h-2 w-8 rounded ${stat.color}`} />
                        <span className={`text-xs ${stat.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                          {stat.change}
                        </span>
                      </div>
                      <p className="text-2xl font-bold">{stat.value}</p>
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
                    </div>
                  ))}
                </div>

                {/* Mock chart */}
                <div className="rounded-lg border p-4">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-medium">Documentos procesados</span>
                    <span className="text-xs text-muted-foreground">Última semana</span>
                  </div>
                  <div className="flex items-end justify-between h-32 gap-2">
                    {[40, 65, 45, 80, 55, 90, 75].map((height, i) => (
                      <div
                        key={i}
                        className="flex-1 bg-primary/20 rounded-t transition-all hover:bg-primary/40 cursor-pointer"
                        style={{ height: `${height}%` }}
                      />
                    ))}
                  </div>
                  <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                    <span>Lun</span>
                    <span>Mar</span>
                    <span>Mié</span>
                    <span>Jue</span>
                    <span>Vie</span>
                    <span>Sáb</span>
                    <span>Dom</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating elements — contained within parent overflow */}
            <div className="absolute left-0 top-1/4 rounded-lg border bg-white p-3 shadow-lg animate-in fade-in slide-in-from-left-4 duration-500 delay-500 -translate-x-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">F29 Generado</p>
                  <p className="text-xs text-muted-foreground">Cliente: ABC Ltda</p>
                </div>
              </div>
            </div>

            <div className="absolute right-0 bottom-1/4 rounded-lg border bg-white p-3 shadow-lg animate-in fade-in slide-in-from-right-4 duration-500 delay-700 translate-x-2">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">Bot SII Activo</p>
                  <p className="text-xs text-muted-foreground">12 consultas hoy</p>
                </div>
              </div>
            </div>

            <div className="absolute left-0 bottom-8 rounded-lg border bg-white p-3 shadow-lg animate-in fade-in slide-in-from-left-4 duration-500 delay-900 -translate-x-2">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-secondary/10 flex items-center justify-center">
                  <FileCheck className="h-4 w-4 text-secondary" />
                </div>
                <div>
                  <p className="text-sm font-medium">95% Clasificado</p>
                  <p className="text-xs text-muted-foreground">Alta precisión</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
