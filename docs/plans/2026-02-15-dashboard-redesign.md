# Dashboard Bento Grid Redesign — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Redesign the dashboard page from flat grid layout to an asymmetric Bento Grid with clear visual hierarchy, modern SaaS aesthetic (Linear/Vercel style), and actionable context.

**Architecture:** Rewrite `src/app/dashboard/page.tsx` using CSS Grid with named grid areas for the bento layout. Create new `BentoCard` wrapper component. Refactor existing `KPICard` into primary (large) and secondary (stat-bar) variants. Keep all server actions unchanged — this is purely a UI/layout refactor.

**Tech Stack:** Next.js Server Components, Tailwind CSS Grid, Recharts (existing), Lucide icons (existing)

---

### Task 1: Create BentoCard wrapper component

**Files:**
- Create: `src/components/dashboard/BentoCard.tsx`
- Modify: `src/components/dashboard/index.ts`

**Step 1: Create BentoCard component**

Create `src/components/dashboard/BentoCard.tsx`:

```tsx
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
```

**Step 2: Export from barrel**

Add to `src/components/dashboard/index.ts`:
```ts
export { BentoCard } from './BentoCard'
```

**Step 3: Commit**

```bash
git add src/components/dashboard/BentoCard.tsx src/components/dashboard/index.ts
git commit -m "feat(dashboard): add BentoCard wrapper component"
```

---

### Task 2: Create HeroCard component with contextual summary

**Files:**
- Create: `src/components/dashboard/HeroCard.tsx`
- Modify: `src/components/dashboard/index.ts`
- Modify: `src/app/dashboard/actions.ts` (add contextual summary to stats)

**Step 1: Add summary field to DashboardStats**

In `src/app/dashboard/actions.ts`, add `resumen: string` to the `DashboardStats` interface and compute it at the end of `getDashboardStats()`:

```ts
// Add to DashboardStats interface:
resumen: string

// At the end of getDashboardStats, before return:
const partes: string[] = []
if (pendientes > 0) partes.push(`${pendientes} documentos pendientes`)
if (alertas > 0) partes.push(`${alertas} alertas F29`)
const resumen = partes.length > 0
  ? `Tienes ${partes.join(' y ')}`
  : 'Todo al día, sin pendientes'

// Add resumen to returned object
```

Also add `resumen: 'Sin datos disponibles'` to the fallback return in the catch block.

**Step 2: Create HeroCard component**

Create `src/components/dashboard/HeroCard.tsx`:

```tsx
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
```

**Step 3: Export from barrel**

Add to `src/components/dashboard/index.ts`:
```ts
export { HeroCard } from './HeroCard'
```

**Step 4: Commit**

```bash
git add src/components/dashboard/HeroCard.tsx src/components/dashboard/index.ts src/app/dashboard/actions.ts
git commit -m "feat(dashboard): add HeroCard with contextual summary"
```

---

### Task 3: Create compact StatBar component for secondary KPIs

**Files:**
- Create: `src/components/dashboard/StatBar.tsx`
- Modify: `src/components/dashboard/index.ts`

**Step 1: Create StatBar component**

Create `src/components/dashboard/StatBar.tsx`:

```tsx
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
```

**Step 2: Export from barrel**

Add to `src/components/dashboard/index.ts`:
```ts
export { StatBar } from './StatBar'
```

**Step 3: Commit**

```bash
git add src/components/dashboard/StatBar.tsx src/components/dashboard/index.ts
git commit -m "feat(dashboard): add StatBar for secondary KPIs"
```

---

### Task 4: Refactor KPICard to be more compact (primary variant)

**Files:**
- Modify: `src/components/dashboard/KPICard.tsx`

**Step 1: Simplify KPICard — remove hover gradient, make compact**

Rewrite `src/components/dashboard/KPICard.tsx`:

```tsx
'use client'

import { cn } from '@/lib/utils'
import { BentoCard } from './BentoCard'

interface KPICardProps {
  title: string
  value: string | number
  description: string
  icon: React.ReactNode
  trend?: {
    value: number
    isPositive: boolean
  }
  color?: 'blue' | 'green' | 'amber' | 'violet' | 'red'
}

const dotColors = {
  blue: 'bg-primary',
  green: 'bg-success',
  amber: 'bg-warning',
  violet: 'bg-violet-600',
  red: 'bg-destructive',
}

export function KPICard({ title, value, description, trend, color = 'blue' }: KPICardProps) {
  return (
    <BentoCard>
      <div className="flex items-center gap-2 mb-3">
        <div className={cn('h-2 w-2 rounded-full', dotColors[color])} />
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {title}
        </p>
      </div>
      <p className="text-2xl font-semibold tabular-nums tracking-tight">{value}</p>
      <div className="flex items-center gap-2 mt-1">
        <p className="text-xs text-muted-foreground">{description}</p>
        {trend && (
          <span
            className={cn(
              'text-[10px] font-bold px-1.5 py-0.5 rounded-full',
              trend.isPositive
                ? 'bg-success/10 text-success'
                : 'bg-destructive/10 text-destructive'
            )}
          >
            {trend.isPositive ? '+' : ''}{trend.value}%
          </span>
        )}
      </div>
    </BentoCard>
  )
}
```

**Step 2: Commit**

```bash
git add src/components/dashboard/KPICard.tsx
git commit -m "refactor(dashboard): simplify KPICard to minimal bento style"
```

---

### Task 5: Redesign ActivityFeed as timeline component

**Files:**
- Create: `src/components/dashboard/ActivityFeed.tsx`
- Modify: `src/components/dashboard/index.ts`

**Step 1: Create ActivityFeed component**

Create `src/components/dashboard/ActivityFeed.tsx`:

```tsx
import { BentoCard } from './BentoCard'
import {
  Brain,
  FileSpreadsheet,
  Bot,
  AlertTriangle,
  MessageSquare,
  FileText,
  Clock,
} from 'lucide-react'
import type { ActividadReciente } from '@/app/dashboard/actions'

const iconMap = {
  classification: Brain,
  f29: FileSpreadsheet,
  bot: Bot,
  alert: AlertTriangle,
  chat: MessageSquare,
}

const dotColorMap = {
  classification: 'bg-primary',
  f29: 'bg-success',
  bot: 'bg-violet-600',
  alert: 'bg-destructive',
  chat: 'bg-warning',
}

interface ActivityFeedProps {
  actividad: ActividadReciente[]
}

export function ActivityFeed({ actividad }: ActivityFeedProps) {
  return (
    <BentoCard className="flex flex-col h-full" noPadding>
      <div className="px-5 pt-5 pb-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Actividad Reciente
        </p>
      </div>

      {actividad.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center pb-5 text-center">
          <Clock className="h-5 w-5 text-muted-foreground/40 mb-2" />
          <p className="text-sm text-muted-foreground">Sin actividad reciente</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto px-5 pb-3 space-y-1">
          {actividad.map((item) => {
            const Icon = iconMap[item.tipo] || FileText
            const dotColor = dotColorMap[item.tipo] || 'bg-muted-foreground'
            return (
              <div
                key={item.id}
                className="flex items-start gap-3 py-2.5 border-b border-border/30 last:border-0"
              >
                <div className="relative mt-1.5">
                  <div className={`h-2 w-2 rounded-full ${dotColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground line-clamp-1">{item.mensaje}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{item.tiempo}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </BentoCard>
  )
}
```

**Step 2: Export from barrel**

Add to `src/components/dashboard/index.ts`:
```ts
export { ActivityFeed } from './ActivityFeed'
```

**Step 3: Commit**

```bash
git add src/components/dashboard/ActivityFeed.tsx src/components/dashboard/index.ts
git commit -m "feat(dashboard): add ActivityFeed timeline component"
```

---

### Task 6: Redesign ModulesGrid as compact 2x2 component

**Files:**
- Create: `src/components/dashboard/ModulesGrid.tsx`
- Modify: `src/components/dashboard/index.ts`

**Step 1: Create ModulesGrid component**

Create `src/components/dashboard/ModulesGrid.tsx`:

```tsx
import Link from 'next/link'
import { BentoCard } from './BentoCard'
import { Brain, FileSpreadsheet, Bot, MessageSquare, FileText } from 'lucide-react'
import type { ModuloStatus } from '@/app/dashboard/actions'

const iconMap: Record<string, any> = {
  'HV-Class': Brain,
  'HV-F29': FileSpreadsheet,
  'HV-Bot': Bot,
  'HV-Chat': MessageSquare,
}

const hrefMap: Record<string, string> = {
  'HV-Class': '/dashboard/clasificador',
  'HV-F29': '/dashboard/f29',
  'HV-Bot': '/dashboard/bots',
  'HV-Chat': '/dashboard/chat',
}

interface ModulesGridProps {
  modulos: ModuloStatus[]
}

export function ModulesGrid({ modulos }: ModulesGridProps) {
  return (
    <BentoCard noPadding>
      <div className="px-5 pt-5 pb-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Módulos del Sistema
        </p>
      </div>
      <div className="grid grid-cols-2 gap-px bg-border/30 border-t border-border/30">
        {modulos.map((mod) => {
          const Icon = iconMap[mod.nombre] || FileText
          const href = hrefMap[mod.nombre] || '/dashboard'
          return (
            <Link
              key={mod.nombre}
              href={href}
              className="flex items-center gap-3 p-4 bg-card/50 hover:bg-muted/30 transition-colors"
            >
              <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium truncate">{mod.nombre}</p>
                  <span className="h-1.5 w-1.5 rounded-full bg-success shrink-0" />
                </div>
                <p className="text-xs text-muted-foreground truncate">{mod.metrica}</p>
              </div>
            </Link>
          )
        })}
      </div>
    </BentoCard>
  )
}
```

**Step 2: Export from barrel**

Add to `src/components/dashboard/index.ts`:
```ts
export { ModulesGrid } from './ModulesGrid'
```

**Step 3: Commit**

```bash
git add src/components/dashboard/ModulesGrid.tsx src/components/dashboard/index.ts
git commit -m "feat(dashboard): add ModulesGrid compact 2x2 component"
```

---

### Task 7: Redesign QuickActions as compact vertical buttons

**Files:**
- Create: `src/components/dashboard/QuickActions.tsx`
- Modify: `src/components/dashboard/index.ts`

**Step 1: Create QuickActions component**

Create `src/components/dashboard/QuickActions.tsx`:

```tsx
import Link from 'next/link'
import { BentoCard } from './BentoCard'
import { Brain, FileSpreadsheet, Bot, MessageSquare } from 'lucide-react'

const actions = [
  { label: 'Clasificar', icon: Brain, href: '/dashboard/clasificador' },
  { label: 'Generar F29', icon: FileSpreadsheet, href: '/dashboard/f29' },
  { label: 'Ejecutar Bot', icon: Bot, href: '/dashboard/bots' },
  { label: 'Chat IA', icon: MessageSquare, href: '/dashboard/chat' },
]

export function QuickActions() {
  return (
    <BentoCard className="flex flex-col h-full" noPadding>
      <div className="px-5 pt-5 pb-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Acciones Rápidas
        </p>
      </div>
      <div className="flex-1 flex flex-col px-3 pb-3">
        {actions.map((action) => (
          <Link
            key={action.label}
            href={action.href}
            className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-muted/40 transition-colors"
          >
            <action.icon className="h-4 w-4 text-muted-foreground" />
            {action.label}
          </Link>
        ))}
      </div>
    </BentoCard>
  )
}
```

**Step 2: Export from barrel**

Add to `src/components/dashboard/index.ts`:
```ts
export { QuickActions } from './QuickActions'
```

**Step 3: Commit**

```bash
git add src/components/dashboard/QuickActions.tsx src/components/dashboard/index.ts
git commit -m "feat(dashboard): add QuickActions compact component"
```

---

### Task 8: Update chart components for bento style

**Files:**
- Modify: `src/components/dashboard/charts.tsx`

**Step 1: Replace Card wrappers with BentoCard in all 4 chart components**

In `src/components/dashboard/charts.tsx`:
- Replace `import { Card, CardContent, CardDescription, CardHeader, CardTitle }` with `import { BentoCard }` from `./BentoCard`
- For each chart component, replace the `<Card>` / `<CardHeader>` / `<CardContent>` structure with `<BentoCard noPadding>` and use simple divs with padding for headers
- Keep all Recharts internals exactly the same
- Update header style: use `text-xs font-semibold uppercase tracking-widest text-muted-foreground` for titles (consistent with other bento cards)
- Remove `shadow-executive` class references

Specific pattern for each chart:
```tsx
// Before:
<Card className="border-border/50 shadow-executive">
  <CardHeader className="pb-2">
    <CardTitle className="text-base">Title</CardTitle>
    <CardDescription className="text-xs mt-0.5">Desc</CardDescription>
  </CardHeader>
  <CardContent>
    <div className="h-[200px]">...</div>
  </CardContent>
</Card>

// After:
<BentoCard noPadding>
  <div className="px-5 pt-5 pb-2">
    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Title</p>
    <p className="text-[10px] text-muted-foreground/70 mt-0.5">Desc</p>
  </div>
  <div className="px-3 pb-4">
    <div className="h-[200px]">...</div>
  </div>
</BentoCard>
```

Apply this to: `DocumentosPorDiaChart`, `DocumentosPorTipoChart`, `F29PorMesChart`, `BotsActividadChart`.

Keep the legend indicators (colored dots) in the headers as they are.

**Step 2: Convert DocumentosPorTipoChart from PieChart to horizontal BarChart**

Replace the PieChart with a horizontal BarChart for better readability:
```tsx
export function DocumentosPorTipoChart({ data }: { data: DocumentosPorTipo[] }) {
  return (
    <BentoCard noPadding>
      <div className="px-5 pt-5 pb-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Distribución por Tipo
        </p>
      </div>
      <div className="px-3 pb-4">
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ top: 5, right: 15, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis
                type="category"
                dataKey="tipo"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                width={90}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                formatter={(value: any) => [`${value} docs`]}
              />
              <Bar dataKey="cantidad" fill={COLORS.primary} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </BentoCard>
  )
}
```

**Step 3: Commit**

```bash
git add src/components/dashboard/charts.tsx
git commit -m "refactor(dashboard): update charts to bento style, pie→bar"
```

---

### Task 9: Rewrite dashboard page with Bento Grid layout

**Files:**
- Modify: `src/app/dashboard/page.tsx`

**Step 1: Rewrite page.tsx with CSS Grid bento layout**

Replace the entire content of `src/app/dashboard/page.tsx` with the new bento layout. Key structure:

```tsx
import { Suspense } from 'react'
import dynamic from 'next/dynamic'
import {
  TopNav,
  KPICard,
  HeroCard,
  StatBar,
  ActivityFeed,
  ModulesGrid,
  QuickActions,
} from '@/components/dashboard'

const DocumentosPorDiaChart = dynamic(
  () => import('@/components/dashboard/charts').then(m => m.DocumentosPorDiaChart),
  { ssr: true }
)
const DocumentosPorTipoChart = dynamic(
  () => import('@/components/dashboard/charts').then(m => m.DocumentosPorTipoChart),
  { ssr: true }
)
const F29PorMesChart = dynamic(
  () => import('@/components/dashboard/charts').then(m => m.F29PorMesChart),
  { ssr: true }
)
const BotsActividadChart = dynamic(
  () => import('@/components/dashboard/charts').then(m => m.BotsActividadChart),
  { ssr: true }
)
import {
  FileText,
  Users,
  FileSpreadsheet,
  TrendingUp,
  MessageSquare,
  Zap,
  ArrowLeftRight,
  CheckCircle,
} from 'lucide-react'
import {
  getDashboardStats,
  getModulosStatus,
  getActividadReciente,
  getDocumentosPorDia,
  getDocumentosPorTipo,
  getF29PorMes,
  getBotsActividad,
  getKPIs,
} from './actions'

function BentoSkeleton({ className }: { className?: string }) {
  return (
    <div className={`rounded-xl border border-border/40 bg-card/50 animate-pulse ${className || ''}`}>
      <div className="p-5">
        <div className="h-3 bg-muted rounded w-1/3 mb-3" />
        <div className="h-6 bg-muted rounded w-1/2" />
      </div>
    </div>
  )
}

export default async function DashboardPage() {
  const [
    stats,
    modulos,
    actividad,
    documentosPorDia,
    documentosPorTipo,
    f29PorMes,
    botsActividad,
    kpis,
  ] = await Promise.all([
    getDashboardStats(),
    getModulosStatus(),
    getActividadReciente(5),
    getDocumentosPorDia(),
    getDocumentosPorTipo(),
    getF29PorMes(),
    getBotsActividad(),
    getKPIs(),
  ])

  const secondaryKPIs = [
    { label: 'Consultas Chat', value: kpis.chatConsultasMes },
    { label: 'Bots Ejecutados', value: kpis.botsEjecutadosMes },
    { label: 'Por Conciliar', value: kpis.porConciliar ?? 0 },
    { label: 'Tasa Conciliación', value: `${kpis.tasaConciliacion ?? 0}%` },
  ]

  return (
    <>
      <TopNav title="Dashboard" />

      <main className="p-4 md:p-6 lg:p-8">
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">

          {/* Row 1: Hero + 3 Primary KPIs */}
          <HeroCard resumen={stats.resumen} />
          <KPICard
            title="Clientes Activos"
            value={kpis.clientesActivos}
            description="Empresas gestionadas"
            icon={<Users className="h-5 w-5" />}
            color="blue"
          />
          <KPICard
            title="Docs del Mes"
            value={kpis.documentosMes}
            description="Procesados este mes"
            icon={<FileText className="h-5 w-5" />}
            color="green"
          />
          <KPICard
            title="F29 Pendientes"
            value={kpis.f29Pendientes}
            description="Por enviar al SII"
            icon={<FileSpreadsheet className="h-5 w-5" />}
            color="amber"
          />

          {/* Row 2: Precision IA + Secondary stat bar */}
          <KPICard
            title="Precisión IA"
            value={`${kpis.precisionIA}%`}
            description="Clasificación automática"
            icon={<TrendingUp className="h-5 w-5" />}
            color="violet"
          />
          <div className="md:col-span-1 lg:col-span-3">
            <StatBar items={secondaryKPIs} />
          </div>

          {/* Row 3: Main chart (3 cols) + Activity (1 col) */}
          <div className="lg:col-span-3">
            <Suspense fallback={<BentoSkeleton className="h-[280px]" />}>
              <DocumentosPorDiaChart data={documentosPorDia} />
            </Suspense>
          </div>
          <div className="lg:col-span-1 lg:row-span-2">
            <ActivityFeed actividad={actividad} />
          </div>

          {/* Row 4: Two secondary charts */}
          <div className="lg:col-span-1 md:col-span-1">
            <Suspense fallback={<BentoSkeleton className="h-[260px]" />}>
              <DocumentosPorTipoChart data={documentosPorTipo} />
            </Suspense>
          </div>
          <div className="lg:col-span-2 md:col-span-1">
            <Suspense fallback={<BentoSkeleton className="h-[260px]" />}>
              <F29PorMesChart data={f29PorMes} />
            </Suspense>
          </div>

          {/* Row 5: Modules + Bots + Quick Actions */}
          <div className="lg:col-span-2">
            <ModulesGrid modulos={modulos} />
          </div>
          <div className="lg:col-span-1">
            <Suspense fallback={<BentoSkeleton className="h-[240px]" />}>
              <BotsActividadChart data={botsActividad} />
            </Suspense>
          </div>
          <div className="lg:col-span-1">
            <QuickActions />
          </div>
        </div>
      </main>
    </>
  )
}
```

**Step 2: Verify it builds without errors**

Run: `cd ~/Escritorio/HV_Consultores && npx next build 2>&1 | tail -20`
Expected: Build succeeds (or only existing warnings, no new errors)

**Step 3: Commit**

```bash
git add src/app/dashboard/page.tsx
git commit -m "feat(dashboard): rewrite page with bento grid layout"
```

---

### Task 10: Visual polish and cleanup

**Files:**
- Modify: `src/app/dashboard/page.tsx` (if needed for spacing fixes)
- Modify: `src/components/dashboard/charts.tsx` (ensure ChartSkeleton removed if unused)

**Step 1: Remove unused imports and old components**

Check `page.tsx` for any remaining imports of old components (`StatsCard`, `StatsGridSkeleton`, `Card`, `CardContent`, etc.) and remove them. The old `ChartSkeleton` function in page.tsx should be replaced by `BentoSkeleton`.

**Step 2: Run the dev server and verify visually**

Run: `cd ~/Escritorio/HV_Consultores && npm run dev`
Open: `http://localhost:3000/dashboard`
Verify: Bento grid renders correctly, all data loads, responsive at md/lg breakpoints

**Step 3: Final commit**

```bash
git add -A
git commit -m "chore(dashboard): cleanup unused imports after bento redesign"
```
