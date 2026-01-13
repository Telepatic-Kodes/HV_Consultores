'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Mail, Phone, MapPin, Send, CheckCircle } from 'lucide-react'

export function CTA() {
  const [formState, setFormState] = useState<'idle' | 'submitting' | 'success'>('idle')
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    message: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormState('submitting')

    // Simulate form submission
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setFormState('success')

    // Reset after 3 seconds
    setTimeout(() => {
      setFormState('idle')
      setFormData({ name: '', email: '', company: '', phone: '', message: '' })
    }, 3000)
  }

  return (
    <section id="contacto" className="py-16 lg:py-24 bg-gradient-to-b from-muted/50 to-background">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Left column - Info */}
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Agenda una Demostración Gratuita
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Descubre cómo HV Consultores puede transformar tu estudio contable.
              Nuestro equipo te mostrará cada módulo en acción con tus propios casos de uso.
            </p>

            <div className="mt-10 space-y-6">
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 shrink-0 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Email</p>
                  <a href="mailto:contacto@hv-consultores.cl" className="text-muted-foreground hover:text-primary transition-colors">
                    contacto@hv-consultores.cl
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="h-10 w-10 shrink-0 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Phone className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Teléfono</p>
                  <a href="tel:+56912345678" className="text-muted-foreground hover:text-primary transition-colors">
                    +56 9 1234 5678
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="h-10 w-10 shrink-0 rounded-lg bg-primary/10 flex items-center justify-center">
                  <MapPin className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Ubicación</p>
                  <p className="text-muted-foreground">
                    Santiago, Chile
                  </p>
                </div>
              </div>
            </div>

            {/* Testimonial placeholder */}
            <div className="mt-10 p-6 rounded-xl bg-card border">
              <p className="text-muted-foreground italic">
                &quot;Desde que implementamos HV Consultores, nuestro equipo puede enfocarse en
                asesorar a los clientes en lugar de procesar documentos manualmente. El ahorro
                de tiempo es real.&quot;
              </p>
              <div className="mt-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-sm font-medium text-primary">JR</span>
                </div>
                <div>
                  <p className="font-medium text-sm">Juan Rodríguez</p>
                  <p className="text-xs text-muted-foreground">Socio, Contadores Asociados</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right column - Form */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Solicita tu Demo</CardTitle>
              <CardDescription>
                Completa el formulario y nos pondremos en contacto en menos de 24 horas.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {formState === 'success' ? (
                <div className="py-8 text-center">
                  <div className="mx-auto h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">¡Mensaje Enviado!</h3>
                  <p className="mt-2 text-muted-foreground">
                    Gracias por tu interés. Te contactaremos pronto.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="name" className="text-sm font-medium">
                        Nombre completo *
                      </label>
                      <Input
                        id="name"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Tu nombre"
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="email" className="text-sm font-medium">
                        Email *
                      </label>
                      <Input
                        id="email"
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="tu@email.com"
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="company" className="text-sm font-medium">
                        Empresa
                      </label>
                      <Input
                        id="company"
                        value={formData.company}
                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                        placeholder="Nombre de tu empresa"
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="phone" className="text-sm font-medium">
                        Teléfono
                      </label>
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+56 9 1234 5678"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="message" className="text-sm font-medium">
                      Mensaje
                    </label>
                    <Textarea
                      id="message"
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Cuéntanos sobre tu estudio contable y qué te gustaría automatizar..."
                      rows={4}
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    size="lg"
                    disabled={formState === 'submitting'}
                  >
                    {formState === 'submitting' ? (
                      <>
                        <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        Enviar Solicitud
                        <Send className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>

                  <p className="text-xs text-center text-muted-foreground">
                    Al enviar este formulario, aceptas nuestra política de privacidad.
                  </p>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
