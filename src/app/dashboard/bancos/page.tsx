'use client'

// =============================================================================
// HV Consultores - Bank Dashboard Page
// Panel principal para gestión de cartolas bancarias
// =============================================================================

import { useState, useEffect } from 'react'
import {
  Building2,
  CreditCard,
  FileText,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Upload,
  Download,
  AlertCircle,
  CheckCircle,
  Clock,
  ArrowLeftRight,
  BarChart3,
  Settings,
  Filter,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import {
  getBankModuleStats,
  getBankAccounts,
  getTransactions,
  getCategories,
} from './actions'
import type { BankModuleStats, BankAccount, BankTransaction, TransactionCategory } from '@/lib/bank-rpa'
import { BANKS } from '@/lib/bank-rpa'

// ============================================================================
// COMPONENTES DE ESTADÍSTICAS
// ============================================================================

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  color = 'blue',
}: {
  title: string
  value: string | number
  description?: string
  icon: React.ElementType
  trend?: { value: number; label: string }
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple'
}) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400',
    green: 'bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-400',
    red: 'bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400',
    yellow: 'bg-yellow-50 text-yellow-600 dark:bg-yellow-950 dark:text-yellow-400',
    purple: 'bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400',
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
        {trend && (
          <div className="flex items-center mt-2 text-xs">
            {trend.value >= 0 ? (
              <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
            ) : (
              <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
            )}
            <span className={trend.value >= 0 ? 'text-green-500' : 'text-red-500'}>
              {Math.abs(trend.value)}%
            </span>
            <span className="text-muted-foreground ml-1">{trend.label}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ============================================================================
// COMPONENTE DE CUENTAS BANCARIAS
// ============================================================================

function BankAccountsSection({ accounts }: { accounts: BankAccount[] }) {
  if (accounts.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <CreditCard className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No hay cuentas bancarias</h3>
          <p className="text-sm text-muted-foreground mb-4 text-center">
            Agrega una cuenta bancaria para comenzar a gestionar tus cartolas
          </p>
          <Button>
            <CreditCard className="h-4 w-4 mr-2" />
            Agregar Cuenta
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {accounts.map((account) => {
        const bankInfo = BANKS[account.banco]
        return (
          <Card key={account.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: bankInfo?.color || '#6b7280' }}
                  />
                  <CardTitle className="text-sm font-medium">
                    {bankInfo?.shortName || account.banco}
                  </CardTitle>
                </div>
                <Badge variant={account.activa ? 'default' : 'secondary'}>
                  {account.activa ? 'Activa' : 'Inactiva'}
                </Badge>
              </div>
              <CardDescription>
                {account.alias || `Cuenta ${account.tipo_cuenta}`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Número:</span>
                  <span className="font-mono">{account.numero_cuenta}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tipo:</span>
                  <span className="capitalize">{account.tipo_cuenta}</span>
                </div>
                {account.saldo_actual && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Saldo:</span>
                    <span className="font-semibold">
                      ${account.saldo_actual.toLocaleString('es-CL')}
                    </span>
                  </div>
                )}
                {account.ultima_descarga && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Última descarga:</span>
                    <span>
                      {new Date(account.ultima_descarga).toLocaleDateString('es-CL')}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex gap-2 mt-4">
                <Button variant="outline" size="sm" className="flex-1">
                  <Upload className="h-3 w-3 mr-1" />
                  Subir
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  <Download className="h-3 w-3 mr-1" />
                  RPA
                </Button>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

// ============================================================================
// COMPONENTE DE TRANSACCIONES RECIENTES
// ============================================================================

function RecentTransactionsSection({
  transactions,
  categories,
}: {
  transactions: BankTransaction[]
  categories: TransactionCategory[]
}) {
  const getCategoryInfo = (categoryId?: string) => {
    if (!categoryId) return null
    return categories.find((c) => c.id === categoryId)
  }

  if (transactions.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <FileText className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No hay transacciones</h3>
          <p className="text-sm text-muted-foreground text-center">
            Sube una cartola para ver las transacciones
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Transacciones Recientes</CardTitle>
            <CardDescription>Últimas transacciones registradas</CardDescription>
          </div>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filtrar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {transactions.slice(0, 10).map((tx) => {
            const category = getCategoryInfo(tx.categoria_id)
            return (
              <div
                key={tx.id}
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-lg ${
                      tx.tipo === 'cargo'
                        ? 'bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400'
                        : 'bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-400'
                    }`}
                  >
                    {tx.tipo === 'cargo' ? (
                      <TrendingDown className="h-4 w-4" />
                    ) : (
                      <TrendingUp className="h-4 w-4" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium line-clamp-1">
                      {tx.descripcion}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{new Date(tx.fecha).toLocaleDateString('es-CL')}</span>
                      {category && (
                        <>
                          <span>•</span>
                          <Badge
                            variant="outline"
                            style={{
                              borderColor: category.color,
                              color: category.color,
                            }}
                          >
                            {category.nombre}
                          </Badge>
                        </>
                      )}
                      {!tx.categoria_id && (
                        <>
                          <span>•</span>
                          <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                            Sin categorizar
                          </Badge>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p
                    className={`font-semibold ${
                      tx.tipo === 'cargo' ? 'text-red-600' : 'text-green-600'
                    }`}
                  >
                    {tx.tipo === 'cargo' ? '-' : '+'}$
                    {tx.monto.toLocaleString('es-CL')}
                  </p>
                  {tx.estado_conciliacion !== 'pending' && (
                    <div className="flex items-center justify-end gap-1 text-xs">
                      {tx.estado_conciliacion === 'matched' ? (
                        <>
                          <CheckCircle className="h-3 w-3 text-green-500" />
                          <span className="text-green-600">Conciliado</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-3 w-3 text-yellow-500" />
                          <span className="text-yellow-600">Parcial</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
        <div className="mt-4 text-center">
          <Button variant="ghost">Ver todas las transacciones</Button>
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export default function BancosPage() {
  const [stats, setStats] = useState<BankModuleStats | null>(null)
  const [accounts, setAccounts] = useState<BankAccount[]>([])
  const [transactions, setTransactions] = useState<BankTransaction[]>([])
  const [categories, setCategories] = useState<TransactionCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [statsResult, accountsResult, txResult, categoriesResult] = await Promise.all([
        getBankModuleStats(),
        getBankAccounts(),
        getTransactions({ pageSize: 20 }),
        getCategories(),
      ])

      if (statsResult.success) setStats(statsResult.data)
      if (accountsResult.success) setAccounts(accountsResult.data)
      if (txResult.success) setTransactions(txResult.data.transacciones)
      if (categoriesResult.success) setCategories(categoriesResult.data)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cartolas Bancarias</h1>
          <p className="text-muted-foreground">
            Gestiona y parametriza tus cartolas bancarias
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={loadData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
          <Button>
            <Upload className="h-4 w-4 mr-2" />
            Subir Cartola
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <StatCard
          title="Cuentas Activas"
          value={stats?.cuentas_activas || 0}
          icon={CreditCard}
          color="blue"
        />
        <StatCard
          title="Transacciones (Mes)"
          value={stats?.transacciones_mes || 0}
          icon={ArrowLeftRight}
          color="purple"
        />
        <StatCard
          title="Sin Categorizar"
          value={stats?.pendientes_categorizar || 0}
          icon={AlertCircle}
          color="yellow"
        />
        <StatCard
          title="Sin Conciliar"
          value={stats?.pendientes_conciliar || 0}
          icon={Clock}
          color="red"
        />
        <StatCard
          title="Jobs Activos"
          value={stats?.jobs_en_progreso || 0}
          icon={RefreshCw}
          color="green"
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">
            <BarChart3 className="h-4 w-4 mr-2" />
            Resumen
          </TabsTrigger>
          <TabsTrigger value="accounts">
            <CreditCard className="h-4 w-4 mr-2" />
            Cuentas
          </TabsTrigger>
          <TabsTrigger value="transactions">
            <FileText className="h-4 w-4 mr-2" />
            Transacciones
          </TabsTrigger>
          <TabsTrigger value="reconciliation">
            <CheckCircle className="h-4 w-4 mr-2" />
            Conciliación
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4 mr-2" />
            Configuración
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <BankAccountsSection accounts={accounts} />
            <RecentTransactionsSection
              transactions={transactions}
              categories={categories}
            />
          </div>
        </TabsContent>

        <TabsContent value="accounts">
          <BankAccountsSection accounts={accounts} />
        </TabsContent>

        <TabsContent value="transactions">
          <RecentTransactionsSection
            transactions={transactions}
            categories={categories}
          />
        </TabsContent>

        <TabsContent value="reconciliation">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <ArrowLeftRight className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-lg font-medium mb-2">Motor de Conciliación</h3>
              <p className="text-sm text-muted-foreground text-center mb-4">
                Concilia automáticamente transacciones bancarias con documentos SII
              </p>
              <Button onClick={() => window.location.href = '/dashboard/conciliacion'}>
                <ArrowLeftRight className="h-4 w-4 mr-2" />
                Ir a Conciliación
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => window.location.href = '/dashboard/parametrizacion'}>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <Settings className="h-10 w-10 text-primary mb-3" />
                <h3 className="text-base font-semibold mb-1">Parametrización</h3>
                <p className="text-xs text-muted-foreground text-center">
                  Gestiona plantillas de plan de cuentas y reglas de categorización
                </p>
              </CardContent>
            </Card>
            <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => window.location.href = '/dashboard/monedas'}>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <TrendingUp className="h-10 w-10 text-primary mb-3" />
                <h3 className="text-base font-semibold mb-1">Tipos de Cambio</h3>
                <p className="text-xs text-muted-foreground text-center">
                  Monitorea y gestiona UF, USD y EUR para conversión multimoneda
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
