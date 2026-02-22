'use client'

import { useState } from 'react'
import { useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { BentoCard } from './BentoCard'
import { Button } from '@/components/ui/button'
import { Plus, FlaskConical, Loader2 } from 'lucide-react'
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
    <BentoCard className="flex flex-col justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">
          Dashboard
        </p>
        <h1 className="text-xl font-bold tracking-tight">
          Bienvenido de vuelta
        </h1>
        <p className="text-sm text-muted-foreground mt-1 capitalize">{fecha}</p>
      </div>
      {isEmpty ? (
        <EmptyDashboardActions />
      ) : (
        <p className="text-sm text-foreground/80 mt-4 leading-relaxed">
          {resumen}
        </p>
      )}
    </BentoCard>
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
      <p className="text-sm text-muted-foreground">La plataforma esta vacia. Elige como empezar:</p>
      <div className="flex flex-col gap-2">
        <Link href="/dashboard/clientes/nuevo">
          <Button size="sm" className="w-full shadow-executive">
            <Plus className="mr-2 h-3.5 w-3.5" />
            Registrar primer cliente
          </Button>
        </Link>
        <Button size="sm" variant="outline" className="w-full" onClick={handleSeed} disabled={loading}>
          {loading ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <FlaskConical className="mr-2 h-3.5 w-3.5" />}
          Cargar datos de ejemplo
        </Button>
      </div>
    </div>
  )
}
