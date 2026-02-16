import { cn } from '@/lib/utils'

interface BentoCardProps {
  children: React.ReactNode
  className?: string
  noPadding?: boolean
}

export function BentoCard({ children, className, noPadding }: BentoCardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-border/40 bg-card/50 backdrop-blur-sm',
        'hover:border-border/60 transition-colors duration-200',
        !noPadding && 'p-5',
        className
      )}
    >
      {children}
    </div>
  )
}
