'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuthActions } from '@convex-dev/auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Mail, Lock, AlertCircle, Loader2, Building2, ArrowRight, Wand2 } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const { signIn } = useAuthActions()

  const [tab, setTab] = useState<'password' | 'magic'>('password')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [magicLinkSent, setMagicLinkSent] = useState(false)

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      await signIn("password", { email, password, flow: "signIn" })
      router.push('/dashboard')
    } catch (err) {
      setError('Credenciales invalidas. Verifica tu email y contrasena.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setError(null)
    try {
      await signIn("google")
    } catch (err) {
      setError('Error al iniciar sesion con Google.')
    }
  }

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      await signIn("resend", { email })
      setMagicLinkSent(true)
    } catch (err) {
      setError('Error al enviar el enlace. Verifica tu email.')
    } finally {
      setLoading(false)
    }
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

          {/* Google OAuth */}
          <Button
            type="button"
            variant="outline"
            className="w-full h-12 text-base mb-6"
            onClick={handleGoogleLogin}
          >
            <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continuar con Google
          </Button>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">o continuar con</span>
            </div>
          </div>

          {/* Tab switcher */}
          <div className="flex gap-1 p-1 bg-muted/50 rounded-lg mb-6">
            <button
              type="button"
              onClick={() => { setTab('password'); setError(null); setMagicLinkSent(false) }}
              className={`flex-1 text-sm font-medium py-2 rounded-md transition-all ${
                tab === 'password'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Email y Contrasena
            </button>
            <button
              type="button"
              onClick={() => { setTab('magic'); setError(null) }}
              className={`flex-1 text-sm font-medium py-2 rounded-md transition-all ${
                tab === 'magic'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Magic Link
            </button>
          </div>

          {/* Error message */}
          {error && (
            <div className="flex items-center gap-3 p-4 rounded-lg bg-destructive/5 border border-destructive/20 text-destructive text-sm animate-in mb-5">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Password Login Form */}
          {tab === 'password' && (
            <form onSubmit={handlePasswordLogin} className="space-y-5">
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
          )}

          {/* Magic Link Form */}
          {tab === 'magic' && !magicLinkSent && (
            <form onSubmit={handleMagicLink} className="space-y-5">
              <div className="space-y-2">
                <label htmlFor="magic-email" className="text-sm font-medium text-foreground">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="magic-email"
                    type="email"
                    placeholder="tu@email.com"
                    className="pl-11 h-12"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
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
                    Enviando enlace...
                  </>
                ) : (
                  <>
                    <Wand2 className="mr-2 h-4 w-4" />
                    Enviar Magic Link
                  </>
                )}
              </Button>
            </form>
          )}

          {/* Magic Link Sent confirmation */}
          {tab === 'magic' && magicLinkSent && (
            <div className="text-center py-8">
              <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Mail className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Revisa tu correo</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Enviamos un enlace de acceso a <strong>{email}</strong>. Haz click en el enlace para iniciar sesion.
              </p>
              <Button
                variant="ghost"
                className="mt-4"
                onClick={() => setMagicLinkSent(false)}
              >
                Enviar de nuevo
              </Button>
            </div>
          )}

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
