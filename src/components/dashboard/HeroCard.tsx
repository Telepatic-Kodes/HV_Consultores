'use client'

import { useState } from 'react'
import { useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus, FlaskConical, Loader2, Sparkles } from 'lucide-react'
import { toast } from 'sonner'

interface HeroCardProps {
  resumen: string
  isEmpty?: boolean
}

export function HeroCard({ resumen, isEmpty }: HeroCardProps) {
  const fecha = new Date().toLocaleDateString('es-CL', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="relative overflow-hidden rounded-xl border border-border/40 bg-gradient-to-br from-primary/5 via-card to-secondary/5">
      {/* Subtle decorative circles */}
      <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-primary/5 blur-2xl" />
      <div className="absolute -left-8 -bottom-8 h-32 w-32 rounded-full bg-secondary/5 blur-2xl" />

      <div className="relative p-6 md:p-8">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <p className="text-sm text-muted-foreground capitalize">{fecha}</p>
            <h1 className="text-2xl font-bold tracking-tight mt-1">
              Bienvenido de vuelta
            </h1>
            {isEmpty ? (
              <EmptyDashboardActions />
            ) : (
              <div className="flex items-start gap-2 mt-3 max-w-xl">
                <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <p className="text-sm text-foreground/70 leading-relaxed">
                  {resumen}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function EmptyDashboardActions() {
  const seedDemoData = useMutation(api.seed.seedDemoData)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSeed = async () => {
    setLoading(true)
    try {
      await seedDemoData()
      toast.success('Datos de ejemplo cargados')
      router.refresh()
    } catch {
      toast.error('Error al cargar datos')
    }
    setLoading(false)
  }

  return (
    <div className="mt-4 space-y-3">
      <p className="text-sm text-muted-foreground">La plataforma está vacía. Elige cómo empezar:</p>
      <div className="flex flex-wrap gap-2">
        <Link href="/dashboard/clientes/nuevo">
          <Button size="sm" className="shadow-executive">
            <Plus className="mr-2 h-3.5 w-3.5" />
            Registrar primer cliente
          </Button>
        </Link>
        <Button size="sm" variant="outline" onClick={handleSeed} disabled={loading}>
          {loading ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <FlaskConical className="mr-2 h-3.5 w-3.5" />}
          Cargar datos de ejemplo
        </Button>
      </div>
    </div>
  )
}
