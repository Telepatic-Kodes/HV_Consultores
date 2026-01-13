'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Menu, X, ChevronDown, Brain, FileSpreadsheet, Bot, MessageSquare, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'

const services = [
  { name: 'HV-Class', description: 'Clasificador IA de documentos', href: '#servicios', icon: Brain },
  { name: 'HV-F29', description: 'Formularios tributarios', href: '#servicios', icon: FileSpreadsheet },
  { name: 'HV-Bot', description: 'Automatización RPA', href: '#servicios', icon: Bot },
  { name: 'HV-Chat', description: 'Asistente IA', href: '#servicios', icon: MessageSquare },
]

const navigation = [
  { name: 'Inicio', href: '/' },
  { name: 'Servicios', href: '#servicios', hasDropdown: true },
  { name: 'Beneficios', href: '#beneficios' },
  { name: 'Cómo Usar', href: '/como-usar', icon: BookOpen },
  { name: 'Contacto', href: '#contacto' },
]

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [servicesOpen, setServicesOpen] = useState(false)

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-b">
      <nav className="container mx-auto flex items-center justify-between p-4 lg:px-8" aria-label="Global">
        <div className="flex lg:flex-1">
          <Link href="/" className="-m-1.5 p-1.5 flex items-center gap-2 group">
            <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center group-hover:bg-primary/90 transition-colors">
              <span className="text-xl font-bold text-white">HV</span>
            </div>
            <span className="text-xl font-semibold text-foreground">Consultores</span>
          </Link>
        </div>

        <div className="flex lg:hidden">
          <button
            type="button"
            className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-700"
            onClick={() => setMobileMenuOpen(true)}
          >
            <span className="sr-only">Abrir menú</span>
            <Menu className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>

        <div className="hidden lg:flex lg:gap-x-8 lg:items-center">
          {navigation.map((item) => (
            item.hasDropdown ? (
              <div key={item.name} className="relative">
                <button
                  className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                  onClick={() => setServicesOpen(!servicesOpen)}
                  onMouseEnter={() => setServicesOpen(true)}
                >
                  {item.name}
                  <ChevronDown className={`h-4 w-4 transition-transform ${servicesOpen ? 'rotate-180' : ''}`} />
                </button>

                {servicesOpen && (
                  <div
                    className="absolute top-full left-0 mt-2 w-72 bg-white rounded-xl shadow-lg border p-2 animate-in fade-in slide-in-from-top-2 duration-200"
                    onMouseLeave={() => setServicesOpen(false)}
                  >
                    {services.map((service) => (
                      <a
                        key={service.name}
                        href={service.href}
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-primary/5 transition-colors group"
                        onClick={() => setServicesOpen(false)}
                      >
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                          <service.icon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-foreground">{service.name}</div>
                          <div className="text-xs text-muted-foreground">{service.description}</div>
                        </div>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <Link
                key={item.name}
                href={item.href}
                className={`text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  item.name === 'Cómo Usar'
                    ? 'text-primary hover:text-primary/80'
                    : 'text-muted-foreground hover:text-primary'
                }`}
              >
                {item.icon && <item.icon className="h-4 w-4" />}
                {item.name}
              </Link>
            )
          ))}
        </div>

        <div className="hidden lg:flex lg:flex-1 lg:justify-end lg:gap-x-4">
          <Button variant="ghost" asChild>
            <Link href="/login">Acceder</Link>
          </Button>
          <Button asChild className="shadow-md hover:shadow-lg transition-shadow">
            <Link href="#contacto">Solicitar Demo</Link>
          </Button>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden">
          <div className="fixed inset-0 z-50 bg-black/20" onClick={() => setMobileMenuOpen(false)} />
          <div className="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-white px-6 py-6 sm:max-w-sm sm:ring-1 sm:ring-gray-900/10">
            <div className="flex items-center justify-between">
              <Link href="/" className="-m-1.5 p-1.5 flex items-center gap-2">
                <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
                  <span className="text-xl font-bold text-white">HV</span>
                </div>
                <span className="text-xl font-semibold">Consultores</span>
              </Link>
              <button
                type="button"
                className="-m-2.5 rounded-md p-2.5 text-gray-700"
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="sr-only">Cerrar menú</span>
                <X className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>
            <div className="mt-6 flow-root">
              <div className="-my-6 divide-y divide-gray-500/10">
                <div className="space-y-2 py-6">
                  {navigation.filter(item => !item.hasDropdown).map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="-mx-3 flex items-center gap-2 rounded-lg px-3 py-2 text-base font-medium text-gray-900 hover:bg-gray-50"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {item.icon && <item.icon className="h-5 w-5 text-primary" />}
                      {item.name}
                    </Link>
                  ))}

                  {/* Services submenu mobile */}
                  <div className="pt-2">
                    <div className="px-3 py-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                      Servicios
                    </div>
                    {services.map((service) => (
                      <a
                        key={service.name}
                        href={service.href}
                        className="-mx-3 flex items-center gap-3 rounded-lg px-3 py-2 text-base font-medium text-gray-900 hover:bg-gray-50"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <service.icon className="h-5 w-5 text-primary" />
                        {service.name}
                      </a>
                    ))}
                  </div>
                </div>
                <div className="py-6 space-y-3">
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/login">Acceder</Link>
                  </Button>
                  <Button className="w-full" asChild>
                    <Link href="#contacto">Solicitar Demo</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
