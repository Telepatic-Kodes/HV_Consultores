import { BentoCard } from './BentoCard'

interface HeroCardProps {
  resumen: string
}

export function HeroCard({ resumen }: HeroCardProps) {
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
      <p className="text-sm text-foreground/80 mt-4 leading-relaxed">
        {resumen}
      </p>
    </BentoCard>
  )
}
