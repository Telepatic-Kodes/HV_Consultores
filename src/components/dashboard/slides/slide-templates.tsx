'use client'

import { ReactNode } from 'react'
import { TrendingUp, TrendingDown, Minus, CheckCircle, AlertCircle, Target, Lightbulb } from 'lucide-react'
import { EXECUTIVE_COLORS } from '../executive-charts/chart-utils'

// ============================
// BASE SLIDE LAYOUT
// ============================

interface SlideLayoutProps {
  children: ReactNode
  className?: string
}

export function SlideLayout({ children, className = '' }: SlideLayoutProps) {
  return (
    <div className={`relative w-full h-full bg-white p-8 flex flex-col ${className}`}>
      {children}
    </div>
  )
}

// ============================
// TITLE SLIDE
// ============================

interface TitleSlideProps {
  title: string
  subtitle?: string
  company?: string
  date?: string
  logo?: ReactNode
}

export function TitleSlide({
  title,
  subtitle,
  company = 'HV Consultores',
  date,
  logo,
}: TitleSlideProps) {
  return (
    <SlideLayout className="justify-center items-center text-center">
      {/* Background pattern */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(135deg, ${EXECUTIVE_COLORS.primary}08 0%, transparent 50%)`,
        }}
      />

      {/* Accent line */}
      <div
        className="absolute top-0 left-0 right-0 h-2"
        style={{ backgroundColor: EXECUTIVE_COLORS.accent }}
      />

      {/* Logo */}
      <div className="absolute top-8 left-8">
        {logo || (
          <div className="flex items-center gap-2">
            <span
              className="text-3xl font-bold"
              style={{ color: EXECUTIVE_COLORS.primary }}
            >
              HV
            </span>
            <span className="text-sm text-muted-foreground">Consultores</span>
          </div>
        )}
      </div>

      {/* Main content */}
      <div className="relative z-10 max-w-3xl">
        <h1
          className="text-5xl font-bold leading-tight"
          style={{ color: EXECUTIVE_COLORS.primary }}
        >
          {title}
        </h1>

        {subtitle && (
          <p className="text-xl text-muted-foreground mt-4">{subtitle}</p>
        )}

        {/* Decorative line */}
        <div
          className="w-24 h-1 mx-auto mt-8"
          style={{ backgroundColor: EXECUTIVE_COLORS.accent }}
        />

        {/* Company and date */}
        <div className="mt-8 space-y-2">
          <p className="text-lg font-semibold" style={{ color: EXECUTIVE_COLORS.primary }}>
            {company}
          </p>
          {date && (
            <p className="text-sm text-muted-foreground">{date}</p>
          )}
        </div>
      </div>
    </SlideLayout>
  )
}

// ============================
// KPI SLIDE
// ============================

interface KPISlideKPI {
  title: string
  value: string
  change?: number
  trend?: 'up' | 'down' | 'stable'
  description?: string
}

interface KPISlideProps {
  title: string
  subtitle?: string
  kpis: KPISlideKPI[]
  columns?: 2 | 3 | 4
}

export function KPISlide({
  title,
  subtitle,
  kpis,
  columns = 3,
}: KPISlideProps) {
  const TrendIcon = (trend?: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-5 w-5" style={{ color: EXECUTIVE_COLORS.success }} />
      case 'down':
        return <TrendingDown className="h-5 w-5" style={{ color: EXECUTIVE_COLORS.danger }} />
      default:
        return <Minus className="h-5 w-5" style={{ color: EXECUTIVE_COLORS.neutral }} />
    }
  }

  const gridCols = {
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
  }

  return (
    <SlideLayout>
      {/* Header */}
      <div className="mb-8">
        <h2
          className="text-3xl font-bold"
          style={{ color: EXECUTIVE_COLORS.primary }}
        >
          {title}
        </h2>
        {subtitle && (
          <p className="text-lg text-muted-foreground mt-2">{subtitle}</p>
        )}
        <div
          className="w-16 h-1 mt-4"
          style={{ backgroundColor: EXECUTIVE_COLORS.accent }}
        />
      </div>

      {/* KPIs Grid */}
      <div className={`flex-1 grid ${gridCols[columns]} gap-6`}>
        {kpis.map((kpi, index) => (
          <div
            key={index}
            className="p-6 rounded-xl border-2 flex flex-col justify-center"
            style={{ borderColor: `${EXECUTIVE_COLORS.primary}20` }}
          >
            <p className="text-sm font-semibold uppercase tracking-widest text-muted-foreground/70">
              {kpi.title}
            </p>

            <div className="flex items-end gap-3 mt-3">
              <span
                className="text-4xl font-bold font-mono"
                style={{ color: EXECUTIVE_COLORS.primary }}
              >
                {kpi.value}
              </span>

              {kpi.change !== undefined && (
                <div className="flex items-center gap-1 mb-1">
                  {TrendIcon(kpi.trend)}
                  <span
                    className="text-sm font-semibold"
                    style={{
                      color: kpi.trend === 'up'
                        ? EXECUTIVE_COLORS.success
                        : kpi.trend === 'down'
                          ? EXECUTIVE_COLORS.danger
                          : EXECUTIVE_COLORS.neutral,
                    }}
                  >
                    {kpi.change > 0 ? '+' : ''}{kpi.change}%
                  </span>
                </div>
              )}
            </div>

            {kpi.description && (
              <p className="text-sm text-muted-foreground mt-2">{kpi.description}</p>
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      <SlideFooter />
    </SlideLayout>
  )
}

// ============================
// CHART SLIDE
// ============================

interface ChartSlideProps {
  title: string
  subtitle?: string
  chart: ReactNode
  notes?: string[]
}

export function ChartSlide({
  title,
  subtitle,
  chart,
  notes,
}: ChartSlideProps) {
  return (
    <SlideLayout>
      {/* Header */}
      <div className="mb-6">
        <h2
          className="text-3xl font-bold"
          style={{ color: EXECUTIVE_COLORS.primary }}
        >
          {title}
        </h2>
        {subtitle && (
          <p className="text-lg text-muted-foreground mt-2">{subtitle}</p>
        )}
        <div
          className="w-16 h-1 mt-4"
          style={{ backgroundColor: EXECUTIVE_COLORS.accent }}
        />
      </div>

      {/* Chart */}
      <div className="flex-1 flex items-center justify-center">
        {chart}
      </div>

      {/* Notes */}
      {notes && notes.length > 0 && (
        <div className="mt-4 p-4 rounded-lg bg-muted/30">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Notas
          </p>
          <ul className="space-y-1">
            {notes.map((note, index) => (
              <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                <span style={{ color: EXECUTIVE_COLORS.accent }}>•</span>
                {note}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Footer */}
      <SlideFooter />
    </SlideLayout>
  )
}

// ============================
// COMPARISON SLIDE
// ============================

interface ComparisonSlideProps {
  title: string
  subtitle?: string
  before: {
    label: string
    items: { title: string; value: string }[]
  }
  after: {
    label: string
    items: { title: string; value: string }[]
  }
}

export function ComparisonSlide({
  title,
  subtitle,
  before,
  after,
}: ComparisonSlideProps) {
  return (
    <SlideLayout>
      {/* Header */}
      <div className="mb-8">
        <h2
          className="text-3xl font-bold"
          style={{ color: EXECUTIVE_COLORS.primary }}
        >
          {title}
        </h2>
        {subtitle && (
          <p className="text-lg text-muted-foreground mt-2">{subtitle}</p>
        )}
        <div
          className="w-16 h-1 mt-4"
          style={{ backgroundColor: EXECUTIVE_COLORS.accent }}
        />
      </div>

      {/* Comparison */}
      <div className="flex-1 grid grid-cols-2 gap-8">
        {/* Before */}
        <div className="p-6 rounded-xl bg-muted/30">
          <h3 className="text-lg font-semibold text-muted-foreground mb-4">
            {before.label}
          </h3>
          <div className="space-y-4">
            {before.items.map((item, index) => (
              <div key={index}>
                <p className="text-sm text-muted-foreground">{item.title}</p>
                <p
                  className="text-2xl font-bold font-mono"
                  style={{ color: EXECUTIVE_COLORS.neutral }}
                >
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* After */}
        <div
          className="p-6 rounded-xl"
          style={{ backgroundColor: `${EXECUTIVE_COLORS.primary}08` }}
        >
          <h3
            className="text-lg font-semibold mb-4"
            style={{ color: EXECUTIVE_COLORS.primary }}
          >
            {after.label}
          </h3>
          <div className="space-y-4">
            {after.items.map((item, index) => (
              <div key={index}>
                <p className="text-sm text-muted-foreground">{item.title}</p>
                <p
                  className="text-2xl font-bold font-mono"
                  style={{ color: EXECUTIVE_COLORS.primary }}
                >
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Arrow indicator */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center"
          style={{ backgroundColor: EXECUTIVE_COLORS.accent }}
        >
          <svg
            className="w-6 h-6 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </div>
      </div>

      {/* Footer */}
      <SlideFooter />
    </SlideLayout>
  )
}

// ============================
// INSIGHT SLIDE
// ============================

interface InsightItem {
  type: 'positive' | 'negative' | 'neutral' | 'alert'
  title: string
  description: string
  metric?: string
}

interface InsightSlideProps {
  title: string
  subtitle?: string
  insights: InsightItem[]
}

export function InsightSlide({
  title,
  subtitle,
  insights,
}: InsightSlideProps) {
  const getInsightIcon = (type: InsightItem['type']) => {
    switch (type) {
      case 'positive':
        return <CheckCircle className="h-5 w-5" />
      case 'negative':
        return <AlertCircle className="h-5 w-5" />
      case 'alert':
        return <Target className="h-5 w-5" />
      default:
        return <Lightbulb className="h-5 w-5" />
    }
  }

  const getInsightColor = (type: InsightItem['type']) => {
    switch (type) {
      case 'positive':
        return EXECUTIVE_COLORS.success
      case 'negative':
        return EXECUTIVE_COLORS.danger
      case 'alert':
        return EXECUTIVE_COLORS.warning
      default:
        return EXECUTIVE_COLORS.neutral
    }
  }

  return (
    <SlideLayout>
      {/* Header */}
      <div className="mb-8">
        <h2
          className="text-3xl font-bold"
          style={{ color: EXECUTIVE_COLORS.primary }}
        >
          {title}
        </h2>
        {subtitle && (
          <p className="text-lg text-muted-foreground mt-2">{subtitle}</p>
        )}
        <div
          className="w-16 h-1 mt-4"
          style={{ backgroundColor: EXECUTIVE_COLORS.accent }}
        />
      </div>

      {/* Insights */}
      <div className="flex-1 space-y-4">
        {insights.map((insight, index) => {
          const color = getInsightColor(insight.type)
          return (
            <div
              key={index}
              className="p-5 rounded-lg border-l-4 flex items-start gap-4"
              style={{
                borderLeftColor: color,
                backgroundColor: `${color}08`,
              }}
            >
              <div
                className="p-2 rounded-lg shrink-0"
                style={{
                  backgroundColor: `${color}20`,
                  color: color,
                }}
              >
                {getInsightIcon(insight.type)}
              </div>

              <div className="flex-1">
                <h3 className="text-lg font-semibold">{insight.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {insight.description}
                </p>
              </div>

              {insight.metric && (
                <div
                  className="text-2xl font-bold font-mono shrink-0"
                  style={{ color }}
                >
                  {insight.metric}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <SlideFooter />
    </SlideLayout>
  )
}

// ============================
// SUMMARY SLIDE
// ============================

interface SummarySlideProps {
  title?: string
  keyPoints: string[]
  nextSteps?: string[]
  contactInfo?: {
    name: string
    email: string
    phone?: string
  }
}

export function SummarySlide({
  title = 'Resumen y Próximos Pasos',
  keyPoints,
  nextSteps,
  contactInfo,
}: SummarySlideProps) {
  return (
    <SlideLayout>
      {/* Header */}
      <div className="mb-8">
        <h2
          className="text-3xl font-bold"
          style={{ color: EXECUTIVE_COLORS.primary }}
        >
          {title}
        </h2>
        <div
          className="w-16 h-1 mt-4"
          style={{ backgroundColor: EXECUTIVE_COLORS.accent }}
        />
      </div>

      <div className="flex-1 grid grid-cols-2 gap-8">
        {/* Key Points */}
        <div>
          <h3
            className="text-lg font-semibold mb-4"
            style={{ color: EXECUTIVE_COLORS.primary }}
          >
            Puntos Clave
          </h3>
          <ul className="space-y-3">
            {keyPoints.map((point, index) => (
              <li key={index} className="flex items-start gap-3">
                <span
                  className="flex items-center justify-center w-6 h-6 rounded-full text-white text-sm font-bold shrink-0"
                  style={{ backgroundColor: EXECUTIVE_COLORS.primary }}
                >
                  {index + 1}
                </span>
                <span className="text-sm">{point}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Next Steps */}
        {nextSteps && nextSteps.length > 0 && (
          <div>
            <h3
              className="text-lg font-semibold mb-4"
              style={{ color: EXECUTIVE_COLORS.accent }}
            >
              Próximos Pasos
            </h3>
            <ul className="space-y-3">
              {nextSteps.map((step, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span
                    className="flex items-center justify-center w-6 h-6 rounded text-white text-sm"
                    style={{ backgroundColor: EXECUTIVE_COLORS.accent }}
                  >
                    →
                  </span>
                  <span className="text-sm">{step}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Contact Info */}
      {contactInfo && (
        <div
          className="mt-8 p-6 rounded-xl text-center"
          style={{ backgroundColor: `${EXECUTIVE_COLORS.primary}08` }}
        >
          <p className="text-sm text-muted-foreground mb-2">Contacto</p>
          <p className="text-lg font-semibold" style={{ color: EXECUTIVE_COLORS.primary }}>
            {contactInfo.name}
          </p>
          <p className="text-sm text-muted-foreground">{contactInfo.email}</p>
          {contactInfo.phone && (
            <p className="text-sm text-muted-foreground">{contactInfo.phone}</p>
          )}
        </div>
      )}

      {/* Footer */}
      <SlideFooter showThankYou />
    </SlideLayout>
  )
}

// ============================
// SLIDE FOOTER
// ============================

interface SlideFooterProps {
  showThankYou?: boolean
}

function SlideFooter({ showThankYou = false }: SlideFooterProps) {
  return (
    <div className="mt-auto pt-4 flex items-center justify-between text-xs text-muted-foreground border-t">
      <div className="flex items-center gap-2">
        <span
          className="text-sm font-bold"
          style={{ color: EXECUTIVE_COLORS.primary }}
        >
          HV
        </span>
        <span>Consultores</span>
      </div>

      {showThankYou && (
        <span className="font-semibold" style={{ color: EXECUTIVE_COLORS.accent }}>
          ¡Gracias!
        </span>
      )}

      <span>Documento Confidencial</span>
    </div>
  )
}

// ============================
// TABLE SLIDE
// ============================

interface TableSlideProps {
  title: string
  subtitle?: string
  headers: string[]
  rows: (string | number)[][]
  highlightColumn?: number
}

export function TableSlide({
  title,
  subtitle,
  headers,
  rows,
  highlightColumn,
}: TableSlideProps) {
  return (
    <SlideLayout>
      {/* Header */}
      <div className="mb-6">
        <h2
          className="text-3xl font-bold"
          style={{ color: EXECUTIVE_COLORS.primary }}
        >
          {title}
        </h2>
        {subtitle && (
          <p className="text-lg text-muted-foreground mt-2">{subtitle}</p>
        )}
        <div
          className="w-16 h-1 mt-4"
          style={{ backgroundColor: EXECUTIVE_COLORS.accent }}
        />
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full">
          <thead>
            <tr style={{ backgroundColor: EXECUTIVE_COLORS.primary }}>
              {headers.map((header, index) => (
                <th
                  key={index}
                  className="px-4 py-3 text-left text-sm font-semibold text-white"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className={rowIndex % 2 === 0 ? 'bg-muted/30' : 'bg-white'}
              >
                {row.map((cell, cellIndex) => (
                  <td
                    key={cellIndex}
                    className={`px-4 py-3 text-sm ${
                      cellIndex === highlightColumn ? 'font-bold' : ''
                    }`}
                    style={{
                      color: cellIndex === highlightColumn
                        ? EXECUTIVE_COLORS.primary
                        : undefined,
                    }}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <SlideFooter />
    </SlideLayout>
  )
}

export default TitleSlide
