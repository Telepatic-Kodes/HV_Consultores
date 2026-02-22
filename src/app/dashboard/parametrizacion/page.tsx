'use client'

import { useState } from 'react'
import { useQuery } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Settings2,
  BookOpen,
  ListFilter,
  Plus,
  Users,
  Loader2,
} from 'lucide-react'
import { RulesList, RuleEditor } from '@/components/parametrizacion'
import { TopNav } from '@/components/dashboard'

export default function ParametrizacionPage() {
  const [ruleEditorOpen, setRuleEditorOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<any>(null)

  const plantillas = useQuery(api.templates.listPlantillas, {})
  const clientes = useQuery(api.matching.getClientsWithMatchingStats)

  const handleEditRule = (rule: any) => {
    setEditingRule(rule)
    setRuleEditorOpen(true)
  }

  const handleNewRule = () => {
    setEditingRule(null)
    setRuleEditorOpen(true)
  }

  return (
    <>
      <TopNav title="Parametrización" subtitle="Gestiona plantillas de plan de cuentas y reglas de categorización" />

      <main className="p-4 md:p-6 lg:p-8 space-y-6">
      <Tabs defaultValue="plantillas" className="space-y-4">
        <TabsList>
          <TabsTrigger value="plantillas" className="flex items-center gap-1.5">
            <BookOpen className="h-4 w-4" />
            Plantillas
          </TabsTrigger>
          <TabsTrigger value="reglas" className="flex items-center gap-1.5">
            <ListFilter className="h-4 w-4" />
            Reglas de Categorización
          </TabsTrigger>
          <TabsTrigger value="clientes" className="flex items-center gap-1.5">
            <Users className="h-4 w-4" />
            Configurar Cliente
          </TabsTrigger>
        </TabsList>

        {/* Tab: Plantillas */}
        <TabsContent value="plantillas" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Plantillas de plan de cuentas por régimen tributario
            </p>
          </div>

          {plantillas === undefined ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : plantillas.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <BookOpen className="h-12 w-12 text-muted-foreground/30 mb-3" />
                <p className="text-sm font-medium">Sin plantillas</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Las plantillas se pueden crear con cuentas predefinidas por régimen
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {plantillas
                .filter((p) => p.activa !== false)
                .map((plantilla) => (
                  <Card key={plantilla._id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">
                          {plantilla.nombre}
                        </CardTitle>
                        <Badge variant="outline">{plantilla.regimen}</Badge>
                      </div>
                      {plantilla.descripcion && (
                        <CardDescription className="text-xs">
                          {plantilla.descripcion}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          {plantilla.cuentas.length} cuentas
                        </span>
                        <Badge variant="secondary" className="text-[10px]">
                          v{plantilla.version ?? 1}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          )}
        </TabsContent>

        {/* Tab: Reglas */}
        <TabsContent value="reglas" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Reglas globales y por cliente para categorizar transacciones
            </p>
            <Button size="sm" onClick={handleNewRule}>
              <Plus className="h-4 w-4 mr-1" />
              Nueva Regla
            </Button>
          </div>

          <RulesList onEdit={handleEditRule} />
        </TabsContent>

        {/* Tab: Configurar Cliente */}
        <TabsContent value="clientes" className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Selecciona un cliente para configurar su régimen, plan de cuentas y reglas
          </p>

          {clientes === undefined ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : clientes.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Users className="h-12 w-12 text-muted-foreground/30 mb-3" />
                <p className="text-sm font-medium">Sin clientes</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {clientes.map((item) => (
                <Card key={item.cliente._id} className="hover:shadow-sm transition-shadow">
                  <CardContent className="flex items-center justify-between py-4">
                    <div>
                      <p className="text-sm font-medium">
                        {item.cliente.razon_social}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-[10px]">
                          {item.cliente.rut}
                        </Badge>
                        {item.cliente.regimen_tributario && (
                          <Badge variant="secondary" className="text-[10px]">
                            {item.cliente.regimen_tributario}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // Navigate to client onboarding - simplified for now
                        window.location.href = `/dashboard/parametrizacion/${item.cliente._id}`
                      }}
                    >
                      Configurar
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Rule Editor Dialog */}
      <RuleEditor
        open={ruleEditorOpen}
        onOpenChange={setRuleEditorOpen}
        editingRule={editingRule}
        onSaved={() => {
          setEditingRule(null)
        }}
      />
      </main>
    </>
  )
}
