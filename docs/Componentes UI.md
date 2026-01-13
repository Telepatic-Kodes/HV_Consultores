# Componentes UI

> Documentación de los componentes de interfaz disponibles en el proyecto.

## Librería Base: shadcn/ui

Los componentes UI están basados en [shadcn/ui](https://ui.shadcn.com/), una colección de componentes reutilizables construidos con Radix UI y Tailwind CSS.

## Ubicación

```
src/components/
├── ui/              # Componentes shadcn/ui
├── dashboard/       # Componentes del dashboard
└── landing/         # Componentes del landing
```

## Componentes UI Base (`/ui`)

### Button

```tsx
import { Button } from '@/components/ui/button'

<Button>Default</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="destructive">Destructive</Button>
<Button size="sm">Small</Button>
<Button size="lg">Large</Button>
<Button disabled>Disabled</Button>
```

### Card

```tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

<Card>
  <CardHeader>
    <CardTitle>Título</CardTitle>
    <CardDescription>Descripción opcional</CardDescription>
  </CardHeader>
  <CardContent>
    Contenido de la card
  </CardContent>
</Card>
```

### Input

```tsx
import { Input } from '@/components/ui/input'

<Input placeholder="Escribe aquí..." />
<Input type="password" />
<Input type="email" />
<Input disabled />
```

### DropdownMenu

```tsx
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost">Abrir</Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end">
    <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
    <DropdownMenuSeparator />
    <DropdownMenuItem>Perfil</DropdownMenuItem>
    <DropdownMenuItem>Configuración</DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem className="text-destructive">
      Cerrar Sesión
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

### ScrollArea

```tsx
import { ScrollArea } from '@/components/ui/scroll-area'

<ScrollArea className="h-[300px]">
  {/* Contenido largo */}
</ScrollArea>
```

### Skeleton

```tsx
import { Skeleton } from '@/components/ui/skeleton'

<Skeleton className="h-4 w-[200px]" />
<Skeleton className="h-10 w-full" />
<Skeleton className="h-20 w-20 rounded-full" />
```

### Select

```tsx
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

<Select value={value} onValueChange={setValue}>
  <SelectTrigger className="w-[200px]">
    <SelectValue placeholder="Seleccionar..." />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="option1">Opcion 1</SelectItem>
    <SelectItem value="option2">Opcion 2</SelectItem>
  </SelectContent>
</Select>
```

### Tabs

```tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

<Tabs defaultValue="tab1">
  <TabsList>
    <TabsTrigger value="tab1">Tab 1</TabsTrigger>
    <TabsTrigger value="tab2">Tab 2</TabsTrigger>
  </TabsList>
  <TabsContent value="tab1">Contenido tab 1</TabsContent>
  <TabsContent value="tab2">Contenido tab 2</TabsContent>
</Tabs>
```

### Switch

```tsx
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

<div className="flex items-center space-x-2">
  <Switch
    id="airplane-mode"
    checked={checked}
    onCheckedChange={(checked: boolean) => setChecked(checked)}
  />
  <Label htmlFor="airplane-mode">Modo avion</Label>
</div>
```

### Label

```tsx
import { Label } from '@/components/ui/label'

<Label htmlFor="email">Email</Label>
<Input id="email" type="email" />
```

## Componentes Dashboard (`/dashboard`)

### Executive Charts (Graficos Ejecutivos)

Graficos profesionales estilo McKinsey/Deloitte.

```tsx
import {
  Sparkline,
  MiniSparkline,
  SparklineBar,
  WaterfallChart,
  BulletChart,
  CompactBullet,
  BulletGroup,
  GaugeChart,
  MiniGauge,
} from '@/components/dashboard/executive-charts'

// Sparkline - Mini grafico de tendencia
<Sparkline
  data={[10, 15, 8, 22, 18, 25]}
  width={120}
  height={40}
  color="#059669"
  showArea={true}
/>

// Waterfall - Analisis flujo de caja
<WaterfallChart
  data={[
    { label: 'Inicio', value: 100000, type: 'start' },
    { label: 'Ventas', value: 50000, type: 'positive' },
    { label: 'Gastos', value: -20000, type: 'negative' },
    { label: 'Final', value: 130000, type: 'end' },
  ]}
  title="Flujo de Caja"
/>

// Bullet Chart - KPI vs Meta
<BulletChart
  value={85}
  target={100}
  ranges={[60, 80, 100]}
  title="Cumplimiento"
/>

// Gauge - Medidor circular
<GaugeChart
  value={75}
  min={0}
  max={100}
  title="Progreso"
/>
```

### Executive KPIs (KPIs Premium)

Cards de KPI con sparklines y comparativas.

```tsx
import {
  KPISparklineCard,
  CompactKPI,
  HeroKPI,
  KPIComparisonCard,
  InlineComparison,
  KPITargetCard,
  MultiTargetKPI,
  KPIGrid,
} from '@/components/dashboard/executive-kpis'

// KPI con sparkline
<KPISparklineCard
  label="Ventas Totales"
  value={124500000}
  change={12.5}
  sparklineData={[100, 120, 115, 140, 125, 160]}
  format="currency"
  trend="up"
  status="success"
/>

// KPI con comparativa
<KPIComparisonCard
  label="Documentos"
  currentValue={1250}
  previousValue={1100}
  currentPeriod="Enero 2024"
  previousPeriod="Diciembre 2023"
/>

// KPI con meta
<KPITargetCard
  label="Objetivo Mensual"
  value={85000}
  target={100000}
  format="currency"
/>

// Grid de KPIs
<KPIGrid columns={4}>
  <KPISparklineCard {...kpi1} />
  <KPISparklineCard {...kpi2} />
</KPIGrid>
```

### Executive Tables (Tablas Profesionales)

```tsx
import {
  HeatmapTable,
  ComparisonTable,
  RankingTable,
  GroupedSummaryTable,
  SimpleSummaryTable,
} from '@/components/dashboard/executive-tables'

// Tabla con heatmap
<HeatmapTable
  title="Ventas por Region"
  columns={['Ene', 'Feb', 'Mar']}
  rows={[
    { label: 'Norte', values: [100, 120, 90] },
    { label: 'Sur', values: [80, 95, 110] },
  ]}
/>

// Tabla comparativa
<ComparisonTable
  title="Comparativa"
  columns={columns}
  currentPeriod={{ label: '2024', data: current }}
  previousPeriod={{ label: '2023', data: previous }}
/>

// Ranking
<RankingTable
  title="Top Clientes"
  columns={['Cliente', 'Ventas']}
  rows={[
    { position: 1, data: ['Acme Corp', 150000], movement: 'up' },
    { position: 2, data: ['Beta Inc', 120000], movement: 'same' },
  ]}
/>
```

### Slides (Sistema de Presentacion)

```tsx
import {
  SlideContainer,
  TitleSlide,
  KPISlide,
  ChartSlide,
  ComparisonSlide,
  InsightSlide,
  SummarySlide,
  buildExecutiveDeck,
} from '@/components/dashboard/slides'

// Container con navegacion
<SlideContainer
  slides={slides}
  title="Presentacion Ejecutiva"
  autoPlayInterval={15000}
  onExportPDF={handleExport}
/>

// Generar deck automaticamente
const slides = buildExecutiveDeck(dashboardData, cliente)
```

### TopNav

Barra superior de navegación.

```tsx
import { TopNav } from '@/components/dashboard'

<TopNav
  title="Clientes"
  subtitle="Gestión de clientes y su estado"
/>
```

### Sidebar

Navegación lateral del dashboard.

```tsx
import { Sidebar } from '@/components/dashboard'

// Rutas configuradas internamente:
// - /dashboard (Home)
// - /dashboard/clasificador (HV-Class)
// - /dashboard/f29 (HV-F29)
// - /dashboard/bots (HV-Bot)
// - /dashboard/chat (HV-Chat)
// - /dashboard/clientes
// - /dashboard/reportes
// - /dashboard/configuracion
```

### MobileNav

Navegación móvil (hamburger menu).

```tsx
import { MobileNav } from '@/components/dashboard'

<MobileNav />
```

### NotificationsDropdown

Componente de notificaciones con dropdown en el header.

```tsx
import { NotificationsDropdown } from '@/components/dashboard'

// Características:
// - Muestra contador de no leídas
// - Dropdown con lista de notificaciones
// - Acciones: marcar como leída, eliminar
// - Tiempo relativo (hace 5 min, ayer, etc.)
// - Tipos: info, success, warning, error
// - Modo demo sin autenticación

<NotificationsDropdown />
```

### Skeleton Components

Componentes de carga para mejor UX durante loading states.

```tsx
import {
  StatsCardSkeleton,
  StatsGridSkeleton,
  ModuleCardSkeleton,
  ModulesGridSkeleton,
  TableSkeleton,
  ActivityListSkeleton,
  QuickActionsSkeletons,
  DashboardSkeleton,
  FormSkeleton,
  ChartSkeleton,
  MetricsGridSkeleton,
  ClientesListSkeleton,
  ConfiguracionSkeleton,
  ChatSkeleton,
} from '@/components/dashboard'

// Uso con Suspense
<Suspense fallback={<StatsGridSkeleton />}>
  <StatsContent />
</Suspense>

<Suspense fallback={<TableSkeleton rows={5} columns={6} />}>
  <DataTable />
</Suspense>

<Suspense fallback={<DashboardSkeleton />}>
  <DashboardContent />
</Suspense>
```

## Iconos: Lucide React

Usamos [Lucide](https://lucide.dev/) para iconos.

```tsx
import {
  User,
  Settings,
  FileText,
  Bot,
  MessageSquare,
  ChevronRight,
  Loader2,
  Check,
  X,
} from 'lucide-react'

<User className="h-5 w-5" />
<Loader2 className="h-4 w-4 animate-spin" />
```

### Iconos Comunes por Módulo

| Módulo | Icono Principal |
|--------|-----------------|
| Dashboard | `LayoutDashboard` |
| Clasificador | `Brain` |
| F29 | `FileSpreadsheet` |
| Bots | `Bot` |
| Chat | `MessageSquare` |
| Clientes | `Building2` |
| Reportes | `BarChart3` |
| Configuración | `Settings` |

## Patrones de UI

### Modal/Dialog

```tsx
{showModal && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div className="bg-background rounded-lg shadow-lg w-full max-w-lg m-4">
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-semibold">Título</h2>
        <button onClick={() => setShowModal(false)}>
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="p-4">
        {/* Contenido */}
      </div>
      <div className="p-4 border-t flex justify-end gap-2">
        <Button variant="outline" onClick={() => setShowModal(false)}>
          Cancelar
        </Button>
        <Button onClick={handleSubmit}>
          Guardar
        </Button>
      </div>
    </div>
  </div>
)}
```

### Estado de Carga

```tsx
const [isPending, startTransition] = useTransition()

<Button disabled={isPending}>
  {isPending ? (
    <>
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      Guardando...
    </>
  ) : (
    'Guardar'
  )}
</Button>
```

### Badges/Pills

```tsx
<span className="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
  Activo
</span>

<span className="inline-flex items-center rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-700">
  Error
</span>
```

### Tabla

```tsx
<table className="w-full">
  <thead>
    <tr className="border-b">
      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
        Columna
      </th>
    </tr>
  </thead>
  <tbody>
    {items.map((item) => (
      <tr key={item.id} className="border-b hover:bg-muted/50">
        <td className="py-3 px-4">{item.value}</td>
      </tr>
    ))}
  </tbody>
</table>
```

### Empty State

```tsx
<div className="py-12 text-center">
  <Building2 className="h-12 w-12 text-muted-foreground mx-auto" />
  <p className="mt-4 text-muted-foreground">
    No hay datos disponibles
  </p>
  <Button className="mt-4">
    <Plus className="mr-2 h-4 w-4" />
    Agregar primero
  </Button>
</div>
```

## Clases Tailwind Comunes

### Colores

```css
/* Primario */
bg-primary text-primary-foreground
bg-primary/10 text-primary

/* Secundario */
bg-secondary text-secondary-foreground

/* Muted */
bg-muted text-muted-foreground

/* Destructivo */
bg-destructive text-destructive-foreground

/* Estados */
bg-green-100 text-green-700
bg-yellow-100 text-yellow-700
bg-red-100 text-red-700
bg-blue-100 text-blue-700
```

### Espaciado

```css
p-4 p-6    /* padding */
m-4 mx-auto /* margin */
gap-4 gap-6 /* grid/flex gap */
space-y-4   /* vertical spacing */
```

### Grid

```css
grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4
```

## Ver también

- [[Estructura de Carpetas]]
- [[Stack Tecnológico]]
