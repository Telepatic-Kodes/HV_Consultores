'use client'

import { ReactNode } from 'react'
import {
  TitleSlide,
  KPISlide,
  ChartSlide,
  InsightSlide,
  SummarySlide,
  ComparisonSlide,
} from './slide-templates'
import { WaterfallChart } from '../executive-charts/waterfall-chart'
import type {
  ExecutiveDashboardData,
  ExecutiveKPI,
  WaterfallDataPoint,
  Insight,
} from '@/types/reportes-ejecutivo.types'

// ============================
// SLIDE BUILDER
// ============================

interface SlideBuilderConfig {
  includeTitle?: boolean
  includeKPIs?: boolean
  includeWaterfall?: boolean
  includeComparison?: boolean
  includeInsights?: boolean
  includeSummary?: boolean
  cliente?: {
    rut: string
    razon_social: string
  }
}

export function SlideBuilder(
  data: ExecutiveDashboardData,
  config: SlideBuilderConfig = {}
): ReactNode[] {
  const {
    includeTitle = true,
    includeKPIs = true,
    includeWaterfall = true,
    includeComparison = true,
    includeInsights = true,
    includeSummary = true,
    cliente,
  } = config

  const slides: ReactNode[] = []

  // 1. Title Slide
  if (includeTitle) {
    slides.push(
      <TitleSlide
        key="title"
        title="Informe Ejecutivo"
        subtitle={formatPeriodo(data.periodo)}
        company={cliente?.razon_social || 'HV Consultores'}
        date={new Date().toLocaleDateString('es-CL', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })}
      />
    )
  }

  // 2. KPIs Slide
  if (includeKPIs && data.kpis.length > 0) {
    slides.push(
      <KPISlide
        key="kpis"
        title="Métricas Clave"
        subtitle={`Período ${formatPeriodo(data.periodo)}`}
        kpis={data.kpis.slice(0, 6).map((kpi) => ({
          title: kpi.title,
          value: kpi.formattedValue,
          change: kpi.changePercent,
          trend: kpi.trend,
          description: kpi.description,
        }))}
        columns={3}
      />
    )
  }

  // 3. Waterfall Chart Slide
  if (includeWaterfall && data.waterfall.length > 0) {
    slides.push(
      <ChartSlide
        key="waterfall"
        title="Flujo de Caja"
        subtitle="Análisis de ingresos y egresos del período"
        chart={
          <div className="w-full h-[400px]">
            <WaterfallChart
              data={data.waterfall}
              height={380}
              currency
            />
          </div>
        }
        notes={[
          'Los valores positivos representan ingresos',
          'Los valores negativos representan egresos',
          'El total muestra el flujo neto del período',
        ]}
      />
    )
  }

  // 4. Comparison Slide
  if (includeComparison && data.kpis.length >= 2) {
    const beforeItems = data.kpis.slice(0, 4).map((kpi) => ({
      title: kpi.title,
      value: formatValueWithChange(kpi.value - (kpi.change || 0), kpi),
    }))

    const afterItems = data.kpis.slice(0, 4).map((kpi) => ({
      title: kpi.title,
      value: kpi.formattedValue,
    }))

    slides.push(
      <ComparisonSlide
        key="comparison"
        title="Comparativa Mensual"
        subtitle="Evolución respecto al período anterior"
        before={{
          label: 'Período Anterior',
          items: beforeItems,
        }}
        after={{
          label: 'Período Actual',
          items: afterItems,
        }}
      />
    )
  }

  // 5. Insights Slide
  if (includeInsights && data.insights.length > 0) {
    slides.push(
      <InsightSlide
        key="insights"
        title="Insights del Período"
        subtitle="Análisis y observaciones clave"
        insights={data.insights.slice(0, 4).map((insight) => ({
          type: insight.type,
          title: insight.title,
          description: insight.description,
          metric: insight.metric?.value
            ? `${insight.metric.value.toLocaleString('es-CL')} ${insight.metric.unit}`
            : undefined,
        }))}
      />
    )
  }

  // 6. Summary Slide
  if (includeSummary) {
    const keyPoints = generateKeyPoints(data)
    const nextSteps = generateNextSteps(data)

    slides.push(
      <SummarySlide
        key="summary"
        title="Resumen y Próximos Pasos"
        keyPoints={keyPoints}
        nextSteps={nextSteps}
        contactInfo={{
          name: 'HV Consultores',
          email: 'contacto@hvconsultores.cl',
        }}
      />
    )
  }

  return slides
}

// ============================
// HELPER FUNCTIONS
// ============================

function formatPeriodo(periodo: string): string {
  const [year, month] = periodo.split('-')
  const fecha = new Date(parseInt(year), parseInt(month) - 1)
  return fecha.toLocaleDateString('es-CL', { month: 'long', year: 'numeric' })
}

function formatValueWithChange(value: number, kpi: ExecutiveKPI): string {
  if (kpi.id.includes('tasa') || kpi.id.includes('exito')) {
    return `${value.toFixed(1)}%`
  }
  if (kpi.id.includes('horas')) {
    return `${Math.round(value)}h`
  }
  return value.toLocaleString('es-CL')
}

function generateKeyPoints(data: ExecutiveDashboardData): string[] {
  const points: string[] = []

  // Documentos procesados
  const docsKPI = data.kpis.find((k) => k.id.includes('documento'))
  if (docsKPI) {
    points.push(`Se procesaron ${docsKPI.formattedValue} documentos en el período`)
  }

  // Tendencias positivas
  const positiveKPIs = data.kpis.filter(
    (k) => k.trend === 'up' && (k.changePercent || 0) > 5
  )
  if (positiveKPIs.length > 0) {
    points.push(
      `Mejora significativa en ${positiveKPIs.map((k) => k.title.toLowerCase()).join(', ')}`
    )
  }

  // Insights positivos
  const positiveInsights = data.insights.filter((i) => i.type === 'positive')
  positiveInsights.slice(0, 2).forEach((insight) => {
    points.push(insight.title)
  })

  // Si no hay suficientes puntos, agregar genéricos
  if (points.length < 3) {
    points.push('Operaciones dentro de parámetros normales')
    points.push('Sistema de automatización funcionando correctamente')
  }

  return points.slice(0, 5)
}

function generateNextSteps(data: ExecutiveDashboardData): string[] {
  const steps: string[] = []

  // Basado en insights de tipo alert o recommendation
  const actionableInsights = data.insights.filter(
    (i) => i.type === 'alert' || i.category === 'recommendation'
  )

  actionableInsights.slice(0, 3).forEach((insight) => {
    steps.push(insight.description)
  })

  // Agregar pasos genéricos si no hay suficientes
  if (steps.length < 3) {
    steps.push('Revisar y aprobar F29 pendientes')
    steps.push('Mantener monitoreo de métricas clave')
    steps.push('Programar revisión de fin de mes')
  }

  return steps.slice(0, 4)
}

// ============================
// QUICK BUILD FUNCTION
// ============================

export function buildExecutiveDeck(
  data: ExecutiveDashboardData,
  cliente?: { rut: string; razon_social: string }
): ReactNode[] {
  return SlideBuilder(data, {
    includeTitle: true,
    includeKPIs: true,
    includeWaterfall: true,
    includeComparison: true,
    includeInsights: true,
    includeSummary: true,
    cliente,
  })
}

export default SlideBuilder
