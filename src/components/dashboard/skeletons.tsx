import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

// Executive Skeleton - with gradient animation
function ExecutiveSkeleton({ className }: { className?: string }) {
  return (
    <div className={`bg-gradient-to-r from-muted via-muted/50 to-muted animate-pulse rounded ${className}`} />
  )
}

// Skeleton para tarjetas de estadísticas - Executive Style
export function StatsCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-3 flex-1">
            <ExecutiveSkeleton className="h-3 w-20" />
            <ExecutiveSkeleton className="h-8 w-24" />
            <ExecutiveSkeleton className="h-3 w-32" />
          </div>
          <ExecutiveSkeleton className="h-12 w-12 rounded-xl" />
        </div>
      </div>
    </Card>
  )
}

// Grid de stats skeletons
export function StatsGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <StatsCardSkeleton key={i} />
      ))}
    </div>
  )
}

// Skeleton para tarjetas de módulos
export function ModuleCardSkeleton() {
  return (
    <Card className="relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-1 bg-muted" />
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <Skeleton className="h-5 w-16 rounded" />
        </div>
      </CardHeader>
      <CardContent>
        <Skeleton className="h-5 w-24 mb-2" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-20" />
      </CardContent>
    </Card>
  )
}

// Grid de módulos skeletons
export function ModulesGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <ModuleCardSkeleton key={i} />
      ))}
    </div>
  )
}

// Skeleton para filas de tabla
export function TableRowSkeleton({ columns = 5 }: { columns?: number }) {
  return (
    <tr>
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="py-3 px-4">
          <Skeleton className="h-4 w-full" />
        </td>
      ))}
    </tr>
  )
}

// Skeleton para tabla completa
export function TableSkeleton({ rows = 5, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <div className="w-full">
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              {Array.from({ length: columns }).map((_, i) => (
                <th key={i} className="py-3 px-4 text-left">
                  <Skeleton className="h-4 w-20" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {Array.from({ length: rows }).map((_, i) => (
              <TableRowSkeleton key={i} columns={columns} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// Skeleton para actividad reciente
export function ActivityItemSkeleton() {
  return (
    <div className="flex items-start gap-4">
      <Skeleton className="h-8 w-8 rounded-lg" />
      <div className="flex-1 min-w-0">
        <Skeleton className="h-4 w-3/4 mb-1" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
  )
}

export function ActivityListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-32 mb-1" />
        <Skeleton className="h-4 w-48" />
      </CardHeader>
      <CardContent className="space-y-4">
        {Array.from({ length: count }).map((_, i) => (
          <ActivityItemSkeleton key={i} />
        ))}
      </CardContent>
    </Card>
  )
}

// Skeleton para acciones rápidas
export function QuickActionsSkeletons() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-32 mb-1" />
        <Skeleton className="h-4 w-28" />
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center justify-center gap-2 rounded-lg border p-4">
              <Skeleton className="h-6 w-6" />
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// Skeleton para el dashboard completo
export function DashboardSkeleton() {
  return (
    <div className="p-6 space-y-6">
      <StatsGridSkeleton />
      <ModulesGridSkeleton />
      <div className="grid gap-6 lg:grid-cols-2">
        <ActivityListSkeleton />
        <QuickActionsSkeletons />
      </div>
    </div>
  )
}

// Skeleton para formulario
export function FormSkeleton({ fields = 4 }: { fields?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
      <Skeleton className="h-10 w-full mt-6" />
    </div>
  )
}

// Skeleton para gráficos
export function ChartSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-40 mb-1" />
        <Skeleton className="h-4 w-56" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-64 w-full rounded-lg" />
      </CardContent>
    </Card>
  )
}

// Skeleton para métricas de reportes
export function MetricsGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-16" />
              </div>
              <Skeleton className="h-12 w-12 rounded-full" />
            </div>
            <Skeleton className="h-3 w-20 mt-2" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// Skeleton para lista de clientes
export function ClientesListSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-64" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
      <TableSkeleton rows={8} columns={6} />
    </div>
  )
}

// Skeleton para configuración
export function ConfiguracionSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex gap-4 border-b">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-24" />
        ))}
      </div>
      <Card>
        <CardContent className="pt-6">
          <FormSkeleton fields={5} />
        </CardContent>
      </Card>
    </div>
  )
}

// Skeleton para chat
export function ChatSkeleton() {
  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 p-4 space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
            <div className={`max-w-[70%] ${i % 2 === 0 ? '' : 'bg-primary/10 rounded-lg p-3'}`}>
              <Skeleton className={`h-4 ${i % 2 === 0 ? 'w-64' : 'w-48'} mb-1`} />
              <Skeleton className={`h-4 ${i % 2 === 0 ? 'w-48' : 'w-32'}`} />
            </div>
          </div>
        ))}
      </div>
      <div className="border-t p-4">
        <Skeleton className="h-12 w-full rounded-lg" />
      </div>
    </div>
  )
}
