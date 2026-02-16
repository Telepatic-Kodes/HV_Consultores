import { BentoCard } from './BentoCard'

interface StatBarItem {
  label: string
  value: string | number
}

interface StatBarProps {
  items: StatBarItem[]
}

export function StatBar({ items }: StatBarProps) {
  return (
    <BentoCard className="flex items-center justify-between gap-2 py-3 px-5">
      {items.map((item, i) => (
        <div key={item.label} className="flex items-center gap-2">
          {i > 0 && (
            <div className="h-8 w-px bg-border/50 shrink-0" />
          )}
          <div className="text-center min-w-0">
            <p className="text-lg font-bold tabular-nums tracking-tight">{item.value}</p>
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground truncate">
              {item.label}
            </p>
          </div>
        </div>
      ))}
    </BentoCard>
  )
}
