'use client'

import { useState } from 'react'
import { Clock, TrendingUp, Shield, Zap, Users, LineChart, ChevronDown, Calculator, HelpCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

const stats = [
  {
    value: '170+',
    label: 'Horas Ahorradas/Mes',
    description: 'Tiempo liberado para tareas de alto valor',
    icon: Clock,
  },
  {
    value: '95%',
    label: 'Precisión IA',
    description: 'En clasificación automática de documentos',
    icon: TrendingUp,
  },
  {
    value: '<0.5%',
    label: 'Tasa de Error',
    description: 'En generación de formularios F29',
    icon: Shield,
  },
  {
    value: '24/7',
    label: 'Automatización',
    description: 'Bots trabajando sin intervención manual',
    icon: Zap,
  },
]

const benefits = [
  {
    title: 'Escalabilidad Sin Límites',
    description: 'Procesa más clientes sin aumentar proporcionalmente el personal. Nuestra IA crece contigo.',
    icon: Users,
  },
  {
    title: 'Reducción de Errores Humanos',
    description: 'Validaciones automáticas detectan inconsistencias antes de que lleguen al SII.',
    icon: Shield,
  },
  {
    title: 'Decisiones Basadas en Datos',
    description: 'Dashboard en tiempo real con métricas de rendimiento y alertas proactivas.',
    icon: LineChart,
  },
  {
    title: 'Integración Perfecta',
    description: 'Conecta con Nubox, SII, Previred y AFC sin cambiar tu flujo de trabajo actual.',
    icon: Zap,
  },
]

const faqs = [
  {
    question: '¿Cuánto tiempo toma implementar HV Consultores?',
    answer: 'La implementación básica toma entre 1-2 semanas. Incluye configuración de integraciones con Nubox, SII y entrenamiento del equipo. Nuestro equipo de soporte te acompaña durante todo el proceso.',
  },
  {
    question: '¿Es seguro subir documentos tributarios a la plataforma?',
    answer: 'Sí, utilizamos encriptación AES-256 para datos en reposo y TLS 1.3 para datos en tránsito. Cumplimos con estándares SOC 2 Type II y la normativa chilena de protección de datos. Tus documentos están más seguros que en un servidor local.',
  },
  {
    question: '¿Qué precisión tiene la clasificación automática?',
    answer: 'Nuestro modelo de IA alcanza un 95% de precisión en la clasificación de documentos tributarios chilenos. El sistema mejora continuamente con cada documento procesado y permite correcciones manuales que alimentan el aprendizaje.',
  },
  {
    question: '¿Puedo integrar HV Consultores con mi software actual?',
    answer: 'Sí, ofrecemos integraciones nativas con Nubox, SII, Previred y AFC. También disponemos de una API REST completa para integraciones personalizadas con ERP, CRM u otros sistemas.',
  },
  {
    question: '¿Qué pasa si la IA comete un error?',
    answer: 'Todos los documentos pasan por un proceso de validación antes de ser enviados. El sistema genera alertas de baja confianza para revisión manual. Además, mantenemos un historial completo para auditoría y corrección.',
  },
  {
    question: '¿Ofrecen soporte técnico en español?',
    answer: 'Por supuesto. Nuestro equipo de soporte está en Chile y disponible en horario laboral chileno. Ofrecemos soporte por chat, email y teléfono. Los planes enterprise incluyen soporte prioritario 24/7.',
  },
]

// ROI Calculator component
function ROICalculator() {
  const [clients, setClients] = useState(20)
  const [docsPerClient, setDocsPerClient] = useState(15)
  const [hourlyRate, setHourlyRate] = useState(15000)

  const manualHoursPerDoc = 0.5 // 30 min per document
  const aiHoursPerDoc = 0.08 // 5 min per document

  const totalDocs = clients * docsPerClient
  const manualHours = totalDocs * manualHoursPerDoc
  const aiHours = totalDocs * aiHoursPerDoc
  const hoursSaved = manualHours - aiHours
  const moneySaved = hoursSaved * hourlyRate

  return (
    <div className="bg-gradient-to-br from-primary/5 to-secondary/5 rounded-2xl p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
          <Calculator className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-foreground">Calculadora de ROI</h3>
          <p className="text-sm text-muted-foreground">Estima tu ahorro mensual</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Cantidad de clientes
          </label>
          <input
            type="range"
            min="5"
            max="100"
            value={clients}
            onChange={(e) => setClients(Number(e.target.value))}
            className="w-full accent-primary"
          />
          <div className="flex justify-between text-sm text-muted-foreground mt-1">
            <span>5</span>
            <span className="font-bold text-foreground">{clients}</span>
            <span>100</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Documentos por cliente/mes
          </label>
          <input
            type="range"
            min="5"
            max="50"
            value={docsPerClient}
            onChange={(e) => setDocsPerClient(Number(e.target.value))}
            className="w-full accent-primary"
          />
          <div className="flex justify-between text-sm text-muted-foreground mt-1">
            <span>5</span>
            <span className="font-bold text-foreground">{docsPerClient}</span>
            <span>50</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Costo hora (CLP)
          </label>
          <input
            type="range"
            min="10000"
            max="30000"
            step="1000"
            value={hourlyRate}
            onChange={(e) => setHourlyRate(Number(e.target.value))}
            className="w-full accent-primary"
          />
          <div className="flex justify-between text-sm text-muted-foreground mt-1">
            <span>$10k</span>
            <span className="font-bold text-foreground">${(hourlyRate / 1000).toFixed(0)}k</span>
            <span>$30k</span>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{totalDocs}</p>
          <p className="text-xs text-muted-foreground">Documentos/mes</p>
        </div>
        <div className="bg-white rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{manualHours.toFixed(0)}h</p>
          <p className="text-xs text-muted-foreground">Proceso manual</p>
        </div>
        <div className="bg-white rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-primary">{hoursSaved.toFixed(0)}h</p>
          <p className="text-xs text-muted-foreground">Horas ahorradas</p>
        </div>
        <div className="bg-white rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-secondary">${(moneySaved / 1000000).toFixed(1)}M</p>
          <p className="text-xs text-muted-foreground">Ahorro mensual (CLP)</p>
        </div>
      </div>
    </div>
  )
}

// FAQ Item component
function FAQItem({ question, answer, isOpen, onClick }: {
  question: string
  answer: string
  isOpen: boolean
  onClick: () => void
}) {
  return (
    <div className="border-b last:border-b-0">
      <button
        onClick={onClick}
        className="w-full py-5 flex items-center justify-between text-left hover:text-primary transition-colors"
      >
        <span className="font-medium text-foreground pr-8">{question}</span>
        <ChevronDown
          className={`h-5 w-5 text-muted-foreground shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ${
          isOpen ? 'max-h-96 pb-5' : 'max-h-0'
        }`}
      >
        <p className="text-muted-foreground">{answer}</p>
      </div>
    </div>
  )
}

export function Benefits() {
  const [openFAQ, setOpenFAQ] = useState<number | null>(0)

  return (
    <section id="beneficios" className="py-16 lg:py-24">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Stats section */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Resultados que Hablan por Sí Mismos
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Métricas reales de estudios contables que ya utilizan nuestra plataforma.
          </p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 mb-20">
          {stats.map((stat, index) => (
            <div
              key={stat.label}
              className="relative group animate-in fade-in slide-in-from-bottom-4 duration-500"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 rounded-2xl transform transition-transform group-hover:scale-105" />
              <div className="relative p-6 text-center">
                <div className="mx-auto h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <stat.icon className="h-6 w-6 text-primary" />
                </div>
                <p className="text-3xl lg:text-4xl font-bold text-foreground">{stat.value}</p>
                <p className="text-sm font-medium text-foreground mt-1">{stat.label}</p>
                <p className="text-xs text-muted-foreground mt-2">{stat.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ROI Calculator */}
        <div className="mb-20">
          <ROICalculator />
        </div>

        {/* How it works */}
        <div className="relative mb-20">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h3 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Cómo Funciona
            </h3>
            <p className="mt-4 text-muted-foreground">
              Integración simple en 4 pasos para transformar tu operación contable.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: '01', title: 'Conexión', desc: 'Integra tu cuenta de Nubox y configura credenciales de portales.' },
              { step: '02', title: 'Clasificación', desc: 'La IA procesa y clasifica automáticamente tus documentos.' },
              { step: '03', title: 'Validación', desc: 'El sistema valida datos y genera alertas de inconsistencias.' },
              { step: '04', title: 'Exportación', desc: 'Obtén F29 listos, reportes y documentos actualizados.' },
            ].map((item, index) => (
              <div
                key={item.step}
                className="relative animate-in fade-in slide-in-from-bottom-4 duration-500"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                {/* Connector line */}
                {index < 3 && (
                  <div className="hidden md:block absolute top-8 left-[60%] w-full h-0.5 bg-gradient-to-r from-primary/30 to-transparent" />
                )}

                <div className="text-center group">
                  <div className="mx-auto h-16 w-16 rounded-2xl bg-primary text-white flex items-center justify-center text-xl font-bold mb-4 shadow-lg shadow-primary/25 group-hover:scale-110 transition-transform">
                    {item.step}
                  </div>
                  <h4 className="font-semibold text-foreground">{item.title}</h4>
                  <p className="mt-2 text-sm text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Benefits grid */}
        <div className="grid md:grid-cols-2 gap-8 mb-20">
          {benefits.map((benefit, index) => (
            <div
              key={benefit.title}
              className="flex gap-4 p-6 rounded-xl border bg-card hover:shadow-md transition-all hover:-translate-y-1 animate-in fade-in slide-in-from-bottom-4 duration-500"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="h-12 w-12 shrink-0 rounded-lg bg-secondary/10 flex items-center justify-center">
                <benefit.icon className="h-6 w-6 text-secondary" />
              </div>
              <div>
                <h4 className="font-semibold text-foreground">{benefit.title}</h4>
                <p className="mt-1 text-sm text-muted-foreground">{benefit.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* FAQs Section */}
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-4">
              <HelpCircle className="h-4 w-4" />
              <span>Preguntas Frecuentes</span>
            </div>
            <h3 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              ¿Tienes Dudas?
            </h3>
            <p className="mt-4 text-muted-foreground">
              Respondemos las preguntas más comunes sobre HV Consultores.
            </p>
          </div>

          <div className="bg-card rounded-2xl border p-6 lg:p-8">
            {faqs.map((faq, index) => (
              <FAQItem
                key={index}
                question={faq.question}
                answer={faq.answer}
                isOpen={openFAQ === index}
                onClick={() => setOpenFAQ(openFAQ === index ? null : index)}
              />
            ))}
          </div>

          <div className="text-center mt-8">
            <p className="text-muted-foreground mb-4">¿No encontraste tu respuesta?</p>
            <Button variant="outline" asChild>
              <a href="#contacto">Contáctanos directamente</a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
