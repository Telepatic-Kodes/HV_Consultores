'use client'

import { useState, useTransition, useMemo } from 'react'
import { RefreshCw, Settings, Download, FileText } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

// Slides system
import { SlideContainer, buildExecutiveDeck } from '@/components/dashboard/slides'

// Actions
import { getExecutiveDashboardData } from '../ejecutivo/actions'

// PDF Export
import { generarInformeEjecutivoPDF } from '@/lib/reportes-ejecutivo'

// Types
import type { ExecutiveDashboardData } from '@/types/reportes-ejecutivo.types'

interface PresentacionContentProps {
  initialData: ExecutiveDashboardData
  clientes: { id: string; rut: string; razon_social: string }[]
}

export function PresentacionContent({
  initialData,
  clientes,
}: PresentacionContentProps) {
  const [data, setData] = useState<ExecutiveDashboardData>(initialData)
  const [selectedCliente, setSelectedCliente] = useState<string>('consolidated')
  const [selectedPeriodo, setSelectedPeriodo] = useState<string>(initialData.periodo)
  const [isPending, startTransition] = useTransition()

  // Slide options
  const [slideOptions, setSlideOptions] = useState({
    includeTitle: true,
    includeKPIs: true,
    includeWaterfall: true,
    includeComparison: true,
    includeInsights: true,
    includeSummary: true,
  })

  // Generate periods (last 12 months)
  const periodos = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const label = date.toLocaleDateString('es-CL', { month: 'long', year: 'numeric' })
      return { value, label }
    })
  }, [])

  // Get selected client info
  const clienteSeleccionado = useMemo(() => {
    if (selectedCliente === 'consolidated') return undefined
    return clientes.find((c) => c.id === selectedCliente)
  }, [selectedCliente, clientes])

  // Build slides based on data and options
  const slides = useMemo(() => {
    return buildExecutiveDeck(data, clienteSeleccionado)
  }, [data, clienteSeleccionado])

  // Refresh data
  const refreshData = () => {
    startTransition(async () => {
      const newData = await getExecutiveDashboardData(
        selectedCliente === 'consolidated' ? undefined : selectedCliente,
        selectedPeriodo || undefined
      )
      setData(newData)
    })
  }

  // Export to PDF
  const handleExportPDF = () => {
    generarInformeEjecutivoPDF({
      cliente: clienteSeleccionado
        ? {
            rut: clienteSeleccionado.rut,
            razon_social: clienteSeleccionado.razon_social,
          }
        : undefined,
      periodo: data.periodo,
      kpis: data.kpis,
      waterfall: data.waterfall,
      insights: data.insights,
      generadoEn: new Date().toISOString(),
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-executive-navy">
            Presentación Board
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Sistema de presentación ejecutiva para directorio
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Cliente filter */}
          <Select value={selectedCliente} onValueChange={setSelectedCliente}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Todos los clientes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="consolidated">Consolidado</SelectItem>
              {clientes.map((cliente) => (
                <SelectItem key={cliente.id} value={cliente.id}>
                  {cliente.razon_social}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Period filter */}
          <Select value={selectedPeriodo} onValueChange={setSelectedPeriodo}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              {periodos.map((periodo) => (
                <SelectItem key={periodo.value} value={periodo.value}>
                  {periodo.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Refresh button */}
          <Button
            variant="outline"
            size="icon"
            onClick={refreshData}
            disabled={isPending}
          >
            <RefreshCw className={`h-4 w-4 ${isPending ? 'animate-spin' : ''}`} />
          </Button>

          {/* Export PDF */}
          <Button variant="outline" className="gap-2" onClick={handleExportPDF}>
            <FileText className="h-4 w-4" />
            Exportar PDF
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Slide container */}
        <div className="lg:col-span-3">
          <Card>
            <SlideContainer
              slides={slides}
              title={
                clienteSeleccionado
                  ? `Presentación - ${clienteSeleccionado.razon_social}`
                  : 'Presentación Ejecutiva Consolidada'
              }
              onExportPDF={handleExportPDF}
              autoPlayInterval={15000}
            />
          </Card>
        </div>

        {/* Settings panel */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Configuración de Slides
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="include-title" className="text-sm">
                  Slide de título
                </Label>
                <Switch
                  id="include-title"
                  checked={slideOptions.includeTitle}
                  onCheckedChange={(checked: boolean) =>
                    setSlideOptions((prev) => ({ ...prev, includeTitle: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="include-kpis" className="text-sm">
                  KPIs principales
                </Label>
                <Switch
                  id="include-kpis"
                  checked={slideOptions.includeKPIs}
                  onCheckedChange={(checked: boolean) =>
                    setSlideOptions((prev) => ({ ...prev, includeKPIs: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="include-waterfall" className="text-sm">
                  Flujo de caja
                </Label>
                <Switch
                  id="include-waterfall"
                  checked={slideOptions.includeWaterfall}
                  onCheckedChange={(checked: boolean) =>
                    setSlideOptions((prev) => ({ ...prev, includeWaterfall: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="include-comparison" className="text-sm">
                  Comparativa
                </Label>
                <Switch
                  id="include-comparison"
                  checked={slideOptions.includeComparison}
                  onCheckedChange={(checked: boolean) =>
                    setSlideOptions((prev) => ({ ...prev, includeComparison: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="include-insights" className="text-sm">
                  Insights
                </Label>
                <Switch
                  id="include-insights"
                  checked={slideOptions.includeInsights}
                  onCheckedChange={(checked: boolean) =>
                    setSlideOptions((prev) => ({ ...prev, includeInsights: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="include-summary" className="text-sm">
                  Resumen
                </Label>
                <Switch
                  id="include-summary"
                  checked={slideOptions.includeSummary}
                  onCheckedChange={(checked: boolean) =>
                    setSlideOptions((prev) => ({ ...prev, includeSummary: checked }))
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Keyboard shortcuts */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Atajos de teclado</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Siguiente</span>
                  <kbd className="px-2 py-1 rounded bg-muted text-xs">→</kbd>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Anterior</span>
                  <kbd className="px-2 py-1 rounded bg-muted text-xs">←</kbd>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pantalla completa</span>
                  <kbd className="px-2 py-1 rounded bg-muted text-xs">F</kbd>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Vista cuadrícula</span>
                  <kbd className="px-2 py-1 rounded bg-muted text-xs">G</kbd>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Salir</span>
                  <kbd className="px-2 py-1 rounded bg-muted text-xs">ESC</kbd>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Data summary */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Datos cargados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">KPIs</span>
                  <span className="font-mono">{data.kpis.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Waterfall items</span>
                  <span className="font-mono">{data.waterfall.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Insights</span>
                  <span className="font-mono">{data.insights.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total slides</span>
                  <span className="font-mono font-bold">{slides.length}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
