'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Mail, Lock, AlertCircle, Loader2, Building2, ArrowRight } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || '/dashboard'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        if (error.message === 'Invalid login credentials') {
          setError('Email o contrasena incorrectos')
        } else {
          setError(error.message)
        }
        return
      }

      router.push(redirect)
      router.refresh()
    } catch (err) {
      setError('Error al iniciar sesion. Intenta nuevamente.')
    } finally {
      setLoading(false)
    }
  }

  const fillDemoCredentials = () => {
    setEmail('demo@hvconsultores.cl')
    setPassword('demo123456')
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#0a1628] relative overflow-hidden">
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)`,
            backgroundSize: '60px 60px'
          }} />
        </div>

        {/* Diagonal accent */}
        <div className="absolute -right-20 top-0 w-40 h-full bg-gradient-to-b from-secondary/20 to-transparent transform rotate-12" />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm">
              <Building2 className="h-6 w-6 text-white" />
            </div>
            <div>
              <span className="text-xl font-semibold text-white tracking-wide">
                HV Consultores
              </span>
            </div>
          </div>

          {/* Main message */}
          <div className="max-w-md">
            <h1 className="text-4xl font-serif font-semibold text-white leading-tight mb-6">
              Transformacion Digital
              <br />
              <span className="text-secondary">Contable</span>
            </h1>
            <p className="text-slate-400 text-lg leading-relaxed">
              Plataforma integral de automatizacion inteligente para servicios contables y tributarios. Optimice sus procesos con tecnologia de vanguardia.
            </p>

            {/* Stats */}
            <div className="mt-10 grid grid-cols-3 gap-8">
              <div>
                <div className="text-3xl font-semibold text-white">170+</div>
                <div className="text-sm text-slate-500 mt-1">Horas ahorradas/mes</div>
              </div>
              <div>
                <div className="text-3xl font-semibold text-white">98%</div>
                <div className="text-sm text-slate-500 mt-1">Precision IA</div>
              </div>
              <div>
                <div className="text-3xl font-semibold text-white">24/7</div>
                <div className="text-sm text-slate-500 mt-1">Automatizacion</div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-sm text-slate-500">
            2024 HV Consultores. Todos los derechos reservados.
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-10">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary">
              <Building2 className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-semibold text-foreground">
              HV Consultores
            </span>
          </div>

          {/* Form Header */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground">
              Bienvenido
            </h2>
            <p className="mt-2 text-muted-foreground">
              Ingresa tus credenciales para acceder a la plataforma
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <div className="flex items-center gap-3 p-4 rounded-lg bg-destructive/5 border border-destructive/20 text-destructive text-sm animate-in">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-foreground">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  className="pl-11 h-12"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-medium text-foreground">
                  Contrasena
                </label>
                <Link
                  href="/recuperar"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Olvidaste tu contrasena?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Ingresa tu contrasena"
                  className="pl-11 h-12"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-base"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Iniciando sesion...
                </>
              ) : (
                <>
                  Iniciar Sesion
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          {/* Demo credentials */}
          <div className="mt-8 p-4 rounded-lg bg-muted/50 border border-border">
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">Credenciales de prueba</p>
                <p className="text-xs text-muted-foreground mt-1">
                  demo@hvconsultores.cl / demo123456
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={fillDemoCredentials}
              >
                Usar demo
              </Button>
            </div>
          </div>

          {/* Register link */}
          <p className="mt-8 text-center text-sm text-muted-foreground">
            No tienes una cuenta?{' '}
            <Link href="/registro" className="font-medium text-primary hover:underline">
              Registrate
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
