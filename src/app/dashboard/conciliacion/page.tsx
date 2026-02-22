'use client'

// =============================================================================
// Conciliación - Client Selection Page
// Shows all clients with their reconciliation status
// =============================================================================

import { useQuery } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import Link from 'next/link'
import {
  ArrowLeftRight,
  Users,
  CheckCircle,
  Clock,
  TrendingUp,
  ChevronRight,
  Loader2,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { TopNav } from '@/components/dashboard'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'

export default function ConciliacionPage() {
  const clientStats = useQuery(api.matching.getClientsWithMatchingStats)

  return (
    <>
      <TopNav title="Conciliación Bancaria" subtitle="Concilia automáticamente transacciones bancarias con documentos SII" />
      <main className="p-4 md:p-6 lg:p-8 space-y-6">

      {/* Global Stats */}
      {clientStats && clientStats.length > 0 && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Clientes con Transacciones</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{clientStats.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Conciliadas</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {clientStats.reduce((sum, c) => sum + c.matched, 0)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
              <Clock className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">
                {clientStats.reduce((sum, c) => sum + c.pending, 0)}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Client List */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Clientes</CardTitle>
          <CardDescription>
            Selecciona un cliente para iniciar la conciliación
          </CardDescription>
        </CardHeader>
        <CardContent>
          {clientStats === undefined ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : clientStats.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ArrowLeftRight className="h-12 w-12 text-muted-foreground/30 mb-3" />
              <p className="text-sm font-medium">Sin transacciones</p>
              <p className="text-xs text-muted-foreground mt-1">
                Importa cartolas bancarias desde el módulo de Bancos para comenzar
              </p>
              <Link href="/dashboard/bancos">
                <Button variant="outline" className="mt-4">
                  Ir a Bancos
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {clientStats.map((item) => {
                const tasa = item.tasaConciliacion
                const progressColor = tasa >= 80
                  ? '[&>div]:bg-green-500'
                  : tasa >= 50
                  ? '[&>div]:bg-amber-500'
                  : '[&>div]:bg-red-500'

                return (
                  <Link
                    key={item.cliente._id}
                    href={`/dashboard/conciliacion/${item.cliente._id}`}
                  >
                    <div className="flex items-center gap-4 p-4 rounded-lg border hover:bg-muted/50 hover:border-primary/20 transition-all cursor-pointer group">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-sm">
                            {item.cliente.razon_social}
                          </p>
                          <Badge variant="outline" className="text-[10px]">
                            {item.cliente.rut}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 mt-2">
                          <Progress
                            value={tasa}
                            className={`h-1.5 flex-1 max-w-[200px] ${progressColor}`}
                          />
                          <span className="text-xs text-muted-foreground">
                            {tasa}% conciliado
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-6 text-xs shrink-0">
                        <div className="text-center">
                          <p className="text-muted-foreground">Total</p>
                          <p className="font-semibold">{item.totalTransacciones}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-green-600">Conciliado</p>
                          <p className="font-semibold text-green-600">{item.matched}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-amber-600">Pendiente</p>
                          <p className="font-semibold text-amber-600">{item.pending}</p>
                        </div>
                      </div>

                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
      </main>
    </>
  )
}
