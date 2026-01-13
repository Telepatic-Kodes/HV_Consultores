import Link from 'next/link'
import { Linkedin, Twitter, Mail } from 'lucide-react'

const navigation = {
  solutions: [
    { name: 'HV-Class', href: '#servicios' },
    { name: 'HV-F29', href: '#servicios' },
    { name: 'HV-Bot', href: '#servicios' },
    { name: 'HV-Chat', href: '#servicios' },
  ],
  company: [
    { name: 'Nosotros', href: '#' },
    { name: 'Blog', href: '#' },
    { name: 'Carreras', href: '#' },
    { name: 'Contacto', href: '#contacto' },
  ],
  legal: [
    { name: 'Privacidad', href: '#' },
    { name: 'Términos', href: '#' },
  ],
  social: [
    { name: 'LinkedIn', href: '#', icon: Linkedin },
    { name: 'Twitter', href: '#', icon: Twitter },
    { name: 'Email', href: 'mailto:contacto@hv-consultores.cl', icon: Mail },
  ],
}

export function Footer() {
  return (
    <footer className="bg-foreground text-background" aria-labelledby="footer-heading">
      <h2 id="footer-heading" className="sr-only">
        Footer
      </h2>
      <div className="container mx-auto px-4 lg:px-8 py-12 lg:py-16">
        <div className="xl:grid xl:grid-cols-3 xl:gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-xl font-bold text-white">HV</span>
              </div>
              <span className="text-xl font-semibold">Consultores</span>
            </Link>
            <p className="text-sm text-background/70 max-w-xs">
              Transformación digital para estudios contables.
              Automatiza con IA y libera el potencial de tu equipo.
            </p>
            <div className="flex space-x-4">
              {navigation.social.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className="text-background/60 hover:text-background transition-colors"
                >
                  <span className="sr-only">{item.name}</span>
                  <item.icon className="h-5 w-5" aria-hidden="true" />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          <div className="mt-16 grid grid-cols-2 gap-8 xl:col-span-2 xl:mt-0">
            <div className="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h3 className="text-sm font-semibold">Soluciones</h3>
                <ul role="list" className="mt-4 space-y-3">
                  {navigation.solutions.map((item) => (
                    <li key={item.name}>
                      <a href={item.href} className="text-sm text-background/70 hover:text-background transition-colors">
                        {item.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-10 md:mt-0">
                <h3 className="text-sm font-semibold">Empresa</h3>
                <ul role="list" className="mt-4 space-y-3">
                  {navigation.company.map((item) => (
                    <li key={item.name}>
                      <a href={item.href} className="text-sm text-background/70 hover:text-background transition-colors">
                        {item.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h3 className="text-sm font-semibold">Legal</h3>
                <ul role="list" className="mt-4 space-y-3">
                  {navigation.legal.map((item) => (
                    <li key={item.name}>
                      <a href={item.href} className="text-sm text-background/70 hover:text-background transition-colors">
                        {item.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-10 md:mt-0">
                <h3 className="text-sm font-semibold">Contacto</h3>
                <ul role="list" className="mt-4 space-y-3">
                  <li className="text-sm text-background/70">
                    contacto@hv-consultores.cl
                  </li>
                  <li className="text-sm text-background/70">
                    +56 9 1234 5678
                  </li>
                  <li className="text-sm text-background/70">
                    Santiago, Chile
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 border-t border-background/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-background/50">
            &copy; {new Date().getFullYear()} HV Consultores. Todos los derechos reservados.
          </p>
          <p className="text-xs text-background/50">
            Hecho con 💙 en Chile
          </p>
        </div>
      </div>
    </footer>
  )
}
