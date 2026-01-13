'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  BookOpen,
  ChevronRight,
  Play,
  LogIn,
  Users,
  LayoutDashboard,
  Brain,
  FileSpreadsheet,
  Bot,
  MessageSquare,
  Zap,
  BarChart3,
  Settings,
  Bell,
  Webhook,
  FolderArchive,
  Search,
  Upload,
  CheckCircle2,
  ArrowRight,
  ExternalLink,
  Clock,
  Shield,
} from 'lucide-react'

// Table of contents items
const tocItems = [
  { id: 'primeros-pasos', title: 'Primeros Pasos', icon: Play },
  { id: 'dashboard', title: 'Dashboard', icon: LayoutDashboard },
  { id: 'hv-class', title: 'HV-Class', icon: Brain },
  { id: 'hv-f29', title: 'HV-F29', icon: FileSpreadsheet },
  { id: 'hv-bot', title: 'HV-Bot', icon: Bot },
  { id: 'hv-chat', title: 'HV-Chat', icon: MessageSquare },
  { id: 'automatizacion', title: 'Automatización', icon: Zap },
  { id: 'reportes', title: 'Reportes', icon: BarChart3 },
]

// Guide section component
function GuideSection({
  id,
  title,
  description,
  icon: Icon,
  children,
}: {
  id: string
  title: string
  description: string
  icon: React.ElementType
  children: React.ReactNode
}) {
  return (
    <section id={id} className="scroll-mt-24 py-12 border-b last:border-b-0">
      <div className="flex items-start gap-4 mb-8">
        <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <Icon className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-foreground">{title}</h2>
          <p className="mt-1 text-muted-foreground">{description}</p>
        </div>
      </div>
      {children}
    </section>
  )
}

// Step component for tutorials
function Step({
  number,
  title,
  description,
  image,
}: {
  number: number
  title: string
  description: string
  image?: string
}) {
  return (
    <div className="flex gap-4 mb-6 last:mb-0">
      <div className="h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold shrink-0">
        {number}
      </div>
      <div className="flex-1">
        <h4 className="font-semibold text-foreground mb-1">{title}</h4>
        <p className="text-sm text-muted-foreground mb-3">{description}</p>
        {image && (
          <div className="rounded-lg border bg-muted/50 p-4 text-center text-sm text-muted-foreground">
            <div className="h-48 flex items-center justify-center border-2 border-dashed border-muted-foreground/25 rounded-lg">
              📸 Screenshot: {image}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Feature card component
function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType
  title: string
  description: string
}) {
  return (
    <div className="flex gap-3 p-4 rounded-lg border bg-card hover:shadow-md transition-shadow">
      <div className="h-10 w-10 rounded-lg bg-secondary/10 flex items-center justify-center shrink-0">
        <Icon className="h-5 w-5 text-secondary" />
      </div>
      <div>
        <h4 className="font-medium text-foreground">{title}</h4>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}

// Tip/Note component
function Tip({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-3 p-4 rounded-lg bg-secondary/5 border border-secondary/20 my-4">
      <div className="h-6 w-6 rounded-full bg-secondary/10 flex items-center justify-center shrink-0">
        <CheckCircle2 className="h-4 w-4 text-secondary" />
      </div>
      <p className="text-sm text-muted-foreground">{children}</p>
    </div>
  )
}

export default function ComoUsarPage() {
  const [activeSection, setActiveSection] = useState('primeros-pasos')

  // Scroll spy effect
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id)
          }
        })
      },
      { rootMargin: '-20% 0px -70% 0px' }
    )

    tocItems.forEach((item) => {
      const element = document.getElementById(item.id)
      if (element) observer.observe(element)
    })

    return () => observer.disconnect()
  }, [])

  return (
    <div className="min-h-screen pt-20">
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary/5 to-secondary/5 py-16">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-6">
              <BookOpen className="h-4 w-4" />
              <span>Guía de Usuario</span>
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              Aprende a usar HV Consultores
            </h1>
            <p className="mt-6 text-lg text-muted-foreground">
              Guía completa paso a paso para dominar todas las funcionalidades de la plataforma.
              Desde la configuración inicial hasta las automatizaciones avanzadas.
            </p>
            <div className="mt-8 flex flex-wrap gap-4 justify-center">
              <Button size="lg" asChild>
                <Link href="/login">
                  <LogIn className="mr-2 h-5 w-5" />
                  Acceder al Dashboard
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <a href="#primeros-pasos">
                  Comenzar Tutorial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Main content with sidebar */}
      <div className="container mx-auto px-4 lg:px-8 py-12">
        <div className="flex gap-12">
          {/* Sticky sidebar - Table of contents */}
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="sticky top-24">
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">
                Contenido
              </h3>
              <nav className="space-y-1">
                {tocItems.map((item) => (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                      activeSection === item.id
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.title}
                  </a>
                ))}
              </nav>

              {/* Quick links */}
              <div className="mt-8 pt-8 border-t">
                <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">
                  Enlaces Rápidos
                </h3>
                <div className="space-y-2">
                  <a
                    href="/dashboard"
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Ir al Dashboard
                  </a>
                  <a
                    href="#contacto"
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    <MessageSquare className="h-4 w-4" />
                    Soporte
                  </a>
                </div>
              </div>
            </div>
          </aside>

          {/* Main content */}
          <main className="flex-1 max-w-4xl">
            {/* Primeros Pasos */}
            <GuideSection
              id="primeros-pasos"
              title="Primeros Pasos"
              description="Configura tu cuenta y familiarízate con la plataforma."
              icon={Play}
            >
              <div className="space-y-8">
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-4">1. Crear cuenta o Iniciar sesión</h3>
                  <Step
                    number={1}
                    title="Accede a la página de login"
                    description="Ve a la página de inicio y haz clic en 'Acceder' o directamente a /login"
                    image="Pantalla de login con opciones de email y Google"
                  />
                  <Step
                    number={2}
                    title="Ingresa tus credenciales"
                    description="Usa tu email y contraseña, o inicia sesión con Google para acceso rápido."
                  />
                  <Step
                    number={3}
                    title="Verifica tu email"
                    description="Si es tu primera vez, revisa tu bandeja de entrada para confirmar tu cuenta."
                  />
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-4">2. Configurar tu perfil</h3>
                  <Step
                    number={1}
                    title="Ve a Configuración"
                    description="En el menú lateral, haz clic en 'Configuración' para acceder a tu perfil."
                    image="Menú lateral con opción Configuración resaltada"
                  />
                  <Step
                    number={2}
                    title="Completa tu información"
                    description="Añade tu nombre, empresa, y datos de contacto para personalizar la experiencia."
                  />
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-4">3. Agregar tu primer cliente</h3>
                  <Step
                    number={1}
                    title="Ve a la sección Clientes"
                    description="Haz clic en 'Clientes' en el menú lateral para ver la lista de clientes."
                    image="Vista de lista de clientes vacía"
                  />
                  <Step
                    number={2}
                    title="Crea un nuevo cliente"
                    description="Haz clic en 'Nuevo Cliente' e ingresa: RUT, razón social, giro y datos de contacto."
                  />
                  <Step
                    number={3}
                    title="Configura integraciones"
                    description="Opcionalmente, conecta el cliente con Nubox para sincronización automática."
                  />
                </div>

                <Tip>
                  <strong>Consejo:</strong> Puedes importar múltiples clientes desde un archivo Excel.
                  Ve a Clientes → Importar y sigue las instrucciones.
                </Tip>
              </div>
            </GuideSection>

            {/* Dashboard */}
            <GuideSection
              id="dashboard"
              title="Dashboard Principal"
              description="Vista general de métricas y accesos rápidos."
              icon={LayoutDashboard}
            >
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <FeatureCard
                  icon={BarChart3}
                  title="Métricas en Tiempo Real"
                  description="Visualiza documentos procesados, clasificaciones y F29 generados hoy."
                />
                <FeatureCard
                  icon={Bell}
                  title="Notificaciones"
                  description="Alertas de documentos pendientes, vencimientos y errores del sistema."
                />
                <FeatureCard
                  icon={Clock}
                  title="Actividad Reciente"
                  description="Historial de las últimas acciones realizadas en la plataforma."
                />
                <FeatureCard
                  icon={Users}
                  title="Resumen de Clientes"
                  description="Estado general de tus clientes y documentos pendientes."
                />
              </div>

              <div className="rounded-lg border bg-muted/50 p-4 text-center">
                <div className="h-64 flex items-center justify-center border-2 border-dashed border-muted-foreground/25 rounded-lg">
                  📸 Screenshot: Vista completa del Dashboard con widgets
                </div>
              </div>

              <Tip>
                El dashboard se actualiza automáticamente cada 30 segundos.
                Puedes forzar una actualización haciendo clic en el botón de refrescar.
              </Tip>
            </GuideSection>

            {/* HV-Class */}
            <GuideSection
              id="hv-class"
              title="HV-Class - Clasificador IA"
              description="Clasifica documentos automáticamente con inteligencia artificial."
              icon={Brain}
            >
              <div className="space-y-8">
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-4">Subir Documentos</h3>
                  <Step
                    number={1}
                    title="Selecciona el cliente"
                    description="En el menú de Documentos, primero selecciona el cliente para el cual vas a subir documentos."
                  />
                  <Step
                    number={2}
                    title="Arrastra o selecciona archivos"
                    description="Puedes arrastrar múltiples archivos PDF, JPG o PNG al área de carga, o hacer clic para seleccionar."
                    image="Zona de drag & drop para documentos"
                  />
                  <Step
                    number={3}
                    title="Espera la clasificación"
                    description="El sistema procesará cada documento y mostrará las sugerencias de clasificación con su nivel de confianza."
                  />
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg border text-center">
                    <div className="text-3xl font-bold text-primary">95%</div>
                    <div className="text-sm text-muted-foreground">Precisión promedio</div>
                  </div>
                  <div className="p-4 rounded-lg border text-center">
                    <div className="text-3xl font-bold text-secondary">Top 3</div>
                    <div className="text-sm text-muted-foreground">Sugerencias por doc</div>
                  </div>
                  <div className="p-4 rounded-lg border text-center">
                    <div className="text-3xl font-bold text-accent">&lt;5s</div>
                    <div className="text-sm text-muted-foreground">Tiempo de proceso</div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-4">Validar Clasificación</h3>
                  <Step
                    number={1}
                    title="Revisa las sugerencias"
                    description="El sistema muestra las 3 mejores clasificaciones con porcentaje de confianza."
                  />
                  <Step
                    number={2}
                    title="Acepta o corrige"
                    description="Si la sugerencia es correcta, acéptala. Si no, selecciona la clasificación correcta de la lista."
                  />
                  <Step
                    number={3}
                    title="El sistema aprende"
                    description="Cada corrección mejora el modelo de IA para futuras clasificaciones similares."
                  />
                </div>

                <Tip>
                  <strong>Integración Nubox:</strong> Los documentos clasificados se pueden enviar automáticamente
                  a Nubox. Configura la integración en Configuración → Integraciones.
                </Tip>
              </div>
            </GuideSection>

            {/* HV-F29 */}
            <GuideSection
              id="hv-f29"
              title="HV-F29 - Formularios Tributarios"
              description="Genera y valida formularios F29 automáticamente."
              icon={FileSpreadsheet}
            >
              <div className="space-y-8">
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-4">Crear Nuevo F29</h3>
                  <Step
                    number={1}
                    title="Selecciona cliente y período"
                    description="Elige el cliente y el mes/año para el cual generar el F29."
                    image="Selector de cliente y período tributario"
                  />
                  <Step
                    number={2}
                    title="Revisa datos pre-calculados"
                    description="El sistema calcula automáticamente los códigos basándose en los documentos clasificados."
                  />
                  <Step
                    number={3}
                    title="Ajusta valores si es necesario"
                    description="Puedes modificar manualmente cualquier código antes de generar el formulario final."
                  />
                  <Step
                    number={4}
                    title="Genera y descarga"
                    description="Haz clic en 'Generar F29' para crear el archivo listo para subir al SII."
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <FeatureCard
                    icon={CheckCircle2}
                    title="Validaciones Automáticas"
                    description="Detecta inconsistencias en códigos y totales antes de generar."
                  />
                  <FeatureCard
                    icon={Shield}
                    title="Menos de 0.5% Errores"
                    description="Precisión superior al proceso manual tradicional."
                  />
                </div>

                <Tip>
                  El sistema guarda un historial de todos los F29 generados.
                  Puedes comparar períodos anteriores desde la pestaña "Historial".
                </Tip>
              </div>
            </GuideSection>

            {/* HV-Bot */}
            <GuideSection
              id="hv-bot"
              title="HV-Bot - Automatización RPA"
              description="Automatiza consultas a portales gubernamentales."
              icon={Bot}
            >
              <div className="space-y-8">
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-4">Bots Disponibles</h3>
                  <div className="grid md:grid-cols-2 gap-4 mb-6">
                    <FeatureCard
                      icon={Shield}
                      title="Bot SII"
                      description="Consulta situación tributaria, F29 presentados, y más."
                    />
                    <FeatureCard
                      icon={Users}
                      title="Bot Previred"
                      description="Verifica cotizaciones previsionales de empleados."
                    />
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-4">Configurar y Ejecutar Bots</h3>
                  <Step
                    number={1}
                    title="Configura credenciales"
                    description="En Configuración → Integraciones, ingresa las credenciales del portal correspondiente."
                    image="Formulario de configuración de credenciales SII"
                  />
                  <Step
                    number={2}
                    title="Selecciona clientes"
                    description="Elige para qué clientes ejecutar el bot (individual o masivo)."
                  />
                  <Step
                    number={3}
                    title="Programa o ejecuta"
                    description="Ejecuta inmediatamente o programa para una fecha/hora específica."
                  />
                  <Step
                    number={4}
                    title="Revisa resultados"
                    description="El sistema guarda logs detallados de cada ejecución con capturas de pantalla."
                  />
                </div>

                <Tip>
                  Los bots se pueden programar para ejecutarse automáticamente todos los días a una hora específica.
                  Ideal para monitoreo continuo de situación tributaria.
                </Tip>
              </div>
            </GuideSection>

            {/* HV-Chat */}
            <GuideSection
              id="hv-chat"
              title="HV-Chat - Asistente IA"
              description="Consulta normativa tributaria y estado de documentos."
              icon={MessageSquare}
            >
              <div className="space-y-6">
                <p className="text-muted-foreground">
                  HV-Chat es un asistente de inteligencia artificial especializado en normativa tributaria chilena.
                  Puedes hacer consultas en lenguaje natural y obtener respuestas precisas.
                </p>

                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-4">Ejemplos de Consultas</h3>
                  <div className="space-y-3">
                    {[
                      '¿Cuál es la tasa de IVA para servicios profesionales?',
                      '¿Qué documentos necesito para declarar un F29?',
                      '¿Cuántos documentos tiene pendiente el cliente ABC Ltda?',
                      '¿Cuál es el plazo para presentar el F29 de este mes?',
                    ].map((query, i) => (
                      <div key={i} className="flex gap-2 p-3 rounded-lg bg-muted/50">
                        <Search className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                        <span className="text-sm">{query}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <FeatureCard
                  icon={Clock}
                  title="Historial de Conversaciones"
                  description="Todas tus consultas se guardan y puedes revisarlas en cualquier momento."
                />

                <Tip>
                  El asistente tiene acceso a la normativa tributaria actualizada y puede consultar
                  el estado de tus documentos y clientes en tiempo real.
                </Tip>
              </div>
            </GuideSection>

            {/* Automatización */}
            <GuideSection
              id="automatizacion"
              title="Automatización Avanzada"
              description="Configura reglas, notificaciones y webhooks."
              icon={Zap}
            >
              <div className="space-y-8">
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-4">Reglas de Automatización</h3>
                  <p className="text-muted-foreground mb-4">
                    Crea reglas para automatizar acciones basadas en eventos o programaciones.
                  </p>
                  <div className="grid md:grid-cols-3 gap-4 mb-6">
                    <FeatureCard
                      icon={Clock}
                      title="Por Vencimiento"
                      description="Acciones cuando documentos están por vencer."
                    />
                    <FeatureCard
                      icon={Settings}
                      title="Programadas"
                      description="Ejecución diaria, semanal o mensual."
                    />
                    <FeatureCard
                      icon={Bell}
                      title="Por Evento"
                      description="Reacciona a cambios en el sistema."
                    />
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-4">Notificaciones</h3>
                  <Step
                    number={1}
                    title="Configura canales"
                    description="Elige recibir notificaciones por email, Slack o en la aplicación."
                    image="Panel de preferencias de notificaciones"
                  />
                  <Step
                    number={2}
                    title="Define tipos de alerta"
                    description="Selecciona qué eventos generan notificaciones: vencimientos, errores, etc."
                  />
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-4">Webhooks</h3>
                  <p className="text-muted-foreground mb-4">
                    Integra HV Consultores con sistemas externos mediante webhooks.
                  </p>
                  <FeatureCard
                    icon={Webhook}
                    title="Webhooks Salientes"
                    description="Envía eventos a tu ERP, CRM o cualquier sistema que acepte webhooks HTTPS."
                  />
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-4">Operaciones en Lote</h3>
                  <FeatureCard
                    icon={FolderArchive}
                    title="Batch Operations"
                    description="Archiva o elimina múltiples documentos de una vez con seguimiento de progreso."
                  />
                </div>
              </div>
            </GuideSection>

            {/* Reportes */}
            <GuideSection
              id="reportes"
              title="Reportes y Analytics"
              description="Genera informes y analiza métricas de tu operación."
              icon={BarChart3}
            >
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <FeatureCard
                    icon={BarChart3}
                    title="Dashboard Analytics"
                    description="Métricas de documentos, clasificaciones y tiempos de proceso."
                  />
                  <FeatureCard
                    icon={FileSpreadsheet}
                    title="Exportar Reportes"
                    description="Descarga informes en Excel, CSV o PDF."
                  />
                  <FeatureCard
                    icon={Shield}
                    title="Compliance"
                    description="Reportes de auditoría y cumplimiento normativo."
                  />
                  <FeatureCard
                    icon={Clock}
                    title="Historial"
                    description="Registro completo de todas las operaciones."
                  />
                </div>

                <Tip>
                  Puedes programar reportes para enviarse automáticamente por email
                  cada semana o mes. Configúralo en Reportes → Programar.
                </Tip>
              </div>
            </GuideSection>

            {/* CTA Final */}
            <section className="py-12 mt-8 text-center">
              <div className="bg-gradient-to-br from-primary/5 to-secondary/5 rounded-2xl p-8">
                <h2 className="text-2xl font-bold text-foreground mb-4">
                  ¿Listo para comenzar?
                </h2>
                <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
                  Accede al dashboard y comienza a automatizar tu operación contable hoy mismo.
                </p>
                <div className="flex flex-wrap gap-4 justify-center">
                  <Button size="lg" asChild>
                    <Link href="/dashboard">
                      Ir al Dashboard
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" asChild>
                    <a href="/#contacto">
                      Solicitar Demo
                    </a>
                  </Button>
                </div>
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  )
}
