import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Brain, FileSpreadsheet, Bot, MessageSquare, ArrowRight } from 'lucide-react'
import Link from 'next/link'

const services = [
  {
    title: 'HV-Class',
    description: 'Clasificación Inteligente de Documentos',
    longDescription: 'Motor de IA basado en XGBoost que clasifica automáticamente documentos tributarios con 95% de precisión. Aprende de cada corrección para mejorar continuamente.',
    icon: Brain,
    features: [
      '95% de precisión en clasificación',
      'Top-3 sugerencias con confianza',
      'Aprendizaje continuo con feedback',
      'Integración con Nubox',
    ],
    color: 'from-blue-500 to-blue-600',
    savings: '80 hrs/mes',
  },
  {
    title: 'HV-F29',
    description: 'Automatización de Formulario F29',
    longDescription: 'Sistema que automatiza el llenado y validación del formulario F29 mensual, reduciendo errores y tiempo de procesamiento de 5 días a solo 1.',
    icon: FileSpreadsheet,
    features: [
      'Cálculo automático de códigos',
      'Validaciones en tiempo real',
      '<0.5% tasa de error',
      'Exportación lista para SII',
    ],
    color: 'from-emerald-500 to-emerald-600',
    savings: '50 hrs/mes',
  },
  {
    title: 'HV-Bot',
    description: 'RPA para Portales Gubernamentales',
    longDescription: 'Robots de automatización (Playwright) que interactúan con SII, Previred, AFC y otros portales para descargar documentos y realizar consultas automáticas.',
    icon: Bot,
    features: [
      'Automatización SII, Previred, AFC',
      'Descarga automática de certificados',
      'Ejecución 24/7 programada',
      'Logs detallados y screenshots',
    ],
    color: 'from-violet-500 to-violet-600',
    savings: '30 hrs/mes',
  },
  {
    title: 'HV-Chat',
    description: 'Asistente IA para Consultas',
    longDescription: 'Chatbot inteligente basado en LLM con RAG que responde consultas sobre normativa tributaria, procedimientos y el estado de tus documentos.',
    icon: MessageSquare,
    features: [
      'Respuestas basadas en documentación',
      'Consulta normativa SII actualizada',
      'Estado de documentos en tiempo real',
      'Historial de conversaciones',
    ],
    color: 'from-amber-500 to-amber-600',
    savings: '10 hrs/mes',
  },
]

export function Services() {
  return (
    <section id="servicios" className="py-16 lg:py-24 bg-muted/30">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Section header */}
        <div className="text-center max-w-3xl mx-auto mb-12 lg:mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Suite Completa de Automatización
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Cuatro módulos diseñados específicamente para estudios contables chilenos,
            integrando IA, RPA y automatización para transformar tu operación.
          </p>
        </div>

        {/* Services grid */}
        <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
          {services.map((service, index) => (
            <Card
              key={service.title}
              className="group relative overflow-hidden transition-all hover:shadow-lg"
            >
              {/* Gradient accent */}
              <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${service.color}`} />

              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className={`h-12 w-12 rounded-lg bg-gradient-to-br ${service.color} flex items-center justify-center shadow-lg`}>
                    <service.icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-medium text-muted-foreground">Ahorro estimado</span>
                    <p className="text-lg font-bold text-secondary">{service.savings}</p>
                  </div>
                </div>
                <CardTitle className="mt-4 text-xl">{service.title}</CardTitle>
                <CardDescription className="text-base font-medium text-foreground/80">
                  {service.description}
                </CardDescription>
              </CardHeader>

              <CardContent>
                <p className="text-muted-foreground mb-4">
                  {service.longDescription}
                </p>

                <ul className="space-y-2">
                  {service.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm">
                      <div className={`h-1.5 w-1.5 rounded-full bg-gradient-to-r ${service.color}`} />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Link
                  href="#contacto"
                  className="mt-6 inline-flex items-center text-sm font-medium text-primary hover:text-primary/80 transition-colors group/link"
                >
                  Más información
                  <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover/link:translate-x-1" />
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Bottom summary */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-secondary/10 px-6 py-3 text-secondary font-medium">
            <span>Total: 170+ horas ahorradas por mes</span>
          </div>
        </div>
      </div>
    </section>
  )
}
