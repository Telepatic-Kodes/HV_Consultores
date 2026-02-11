import type jsPDF from 'jspdf'
import type {
  ExecutiveDashboardData,
  ExecutiveKPI,
  WaterfallDataPoint,
  Insight,
  InformeEjecutivoData,
} from '@/types/reportes-ejecutivo.types'

// ============================================
// COLORES EJECUTIVOS McKINSEY/DELOITTE STYLE
// ============================================

const EXECUTIVE_PDF_COLORS = {
  navy: [15, 52, 96] as [number, number, number],           // #0f3460
  blue: [26, 80, 145] as [number, number, number],          // #1a5091
  gold: [212, 164, 24] as [number, number, number],         // #d4a418
  success: [5, 150, 105] as [number, number, number],       // #059669
  warning: [217, 119, 6] as [number, number, number],       // #d97706
  danger: [220, 38, 38] as [number, number, number],        // #dc2626
  neutral: [107, 114, 128] as [number, number, number],     // #6b7280
  dark: [15, 23, 42] as [number, number, number],           // #0f172a
  light: [248, 250, 252] as [number, number, number],       // #f8fafc
  white: [255, 255, 255] as [number, number, number],
  border: [226, 232, 240] as [number, number, number],      // #e2e8f0
}

// ============================================
// INFORME EJECUTIVO MENSUAL - PDF PROFESIONAL
// ============================================

export interface InformeEjecutivoPDFData {
  cliente?: {
    rut: string
    razon_social: string
  }
  periodo: string
  kpis: ExecutiveKPI[]
  waterfall: WaterfallDataPoint[]
  insights: Insight[]
  generadoEn: string
}

export async function generarInformeEjecutivoPDF(data: InformeEjecutivoPDFData): Promise<void> {
  const { default: jsPDF } = await import('jspdf')
  await import('jspdf-autotable')

  const doc = new jsPDF('p', 'mm', 'a4')
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 20
  const contentWidth = pageWidth - margin * 2

  // ============================
  // PÁGINA 1: PORTADA
  // ============================
  generarPortada(doc, data, pageWidth, pageHeight)

  // ============================
  // PÁGINA 2: RESUMEN EJECUTIVO
  // ============================
  doc.addPage()
  generarResumenEjecutivo(doc, data, pageWidth, margin, contentWidth)

  // ============================
  // PÁGINA 3: ANÁLISIS DETALLADO
  // ============================
  doc.addPage()
  generarAnalisisDetallado(doc, data, pageWidth, margin, contentWidth)

  // ============================
  // PÁGINA 4: INSIGHTS Y RECOMENDACIONES
  // ============================
  doc.addPage()
  generarInsightsRecomendaciones(doc, data, pageWidth, margin, contentWidth)

  // Agregar footer a todas las páginas excepto portada
  const totalPages = doc.getNumberOfPages()
  for (let i = 2; i <= totalPages; i++) {
    doc.setPage(i)
    agregarFooter(doc, pageWidth, pageHeight, i - 1, totalPages - 1)
  }

  // Guardar
  const nombreArchivo = data.cliente
    ? `Informe_Ejecutivo_${data.cliente.rut}_${data.periodo}.pdf`
    : `Informe_Ejecutivo_${data.periodo}.pdf`

  doc.save(nombreArchivo)
}

// ============================
// PORTADA
// ============================

function generarPortada(
  doc: jsPDF,
  data: InformeEjecutivoPDFData,
  pageWidth: number,
  pageHeight: number
): void {
  // Fondo superior navy
  doc.setFillColor(...EXECUTIVE_PDF_COLORS.navy)
  doc.rect(0, 0, pageWidth, pageHeight * 0.55, 'F')

  // Acento dorado
  doc.setFillColor(...EXECUTIVE_PDF_COLORS.gold)
  doc.rect(0, pageHeight * 0.55, pageWidth, 3, 'F')

  // Logo HV (simulado con texto estilizado)
  doc.setTextColor(...EXECUTIVE_PDF_COLORS.white)
  doc.setFontSize(48)
  doc.setFont('helvetica', 'bold')
  doc.text('HV', 25, 50)

  doc.setFontSize(14)
  doc.setFont('helvetica', 'normal')
  doc.text('CONSULTORES', 25, 62)

  // Línea decorativa
  doc.setDrawColor(...EXECUTIVE_PDF_COLORS.gold)
  doc.setLineWidth(0.5)
  doc.line(25, 70, 70, 70)

  // Título principal
  doc.setFontSize(32)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...EXECUTIVE_PDF_COLORS.white)
  doc.text('INFORME', 25, 100)
  doc.text('EJECUTIVO', 25, 115)
  doc.text('MENSUAL', 25, 130)

  // Período
  const periodoFormateado = formatearPeriodo(data.periodo)
  doc.setFontSize(18)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...EXECUTIVE_PDF_COLORS.gold)
  doc.text(periodoFormateado.toUpperCase(), 25, 150)

  // Sección inferior (blanca)
  doc.setTextColor(...EXECUTIVE_PDF_COLORS.dark)

  // Cliente info
  if (data.cliente) {
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('PREPARADO PARA', 25, pageHeight * 0.65)

    doc.setFontSize(16)
    doc.text(data.cliente.razon_social, 25, pageHeight * 0.65 + 10)

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...EXECUTIVE_PDF_COLORS.neutral)
    doc.text(`RUT: ${data.cliente.rut}`, 25, pageHeight * 0.65 + 18)
  } else {
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('REPORTE CONSOLIDADO', 25, pageHeight * 0.65)

    doc.setFontSize(14)
    doc.setFont('helvetica', 'normal')
    doc.text('Todos los clientes', 25, pageHeight * 0.65 + 10)
  }

  // Fecha de generación
  doc.setFontSize(10)
  doc.setTextColor(...EXECUTIVE_PDF_COLORS.neutral)
  doc.text('Fecha de generación:', 25, pageHeight - 40)

  doc.setFont('helvetica', 'bold')
  doc.text(
    new Date(data.generadoEn).toLocaleDateString('es-CL', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }),
    25,
    pageHeight - 33
  )

  // Disclaimer
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...EXECUTIVE_PDF_COLORS.neutral)
  doc.text(
    'Documento generado automáticamente. La información contenida es confidencial.',
    25,
    pageHeight - 15
  )
}

// ============================
// RESUMEN EJECUTIVO (Página 2)
// ============================

function generarResumenEjecutivo(
  doc: jsPDF,
  data: InformeEjecutivoPDFData,
  pageWidth: number,
  margin: number,
  contentWidth: number
): void {
  let y = 20

  // Header de sección
  y = agregarHeaderSeccion(doc, 'RESUMEN EJECUTIVO', margin, y, contentWidth)
  y += 5

  // Subtítulo
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...EXECUTIVE_PDF_COLORS.neutral)
  doc.text('Métricas clave del período ' + formatearPeriodo(data.periodo), margin, y)
  y += 15

  // Grid de KPIs (2x3)
  const kpiWidth = (contentWidth - 10) / 3
  const kpiHeight = 40
  let kpiX = margin
  let kpiY = y

  data.kpis.slice(0, 6).forEach((kpi, index) => {
    dibujarKPICard(doc, kpi, kpiX, kpiY, kpiWidth - 5, kpiHeight)

    if ((index + 1) % 3 === 0) {
      kpiX = margin
      kpiY += kpiHeight + 8
    } else {
      kpiX += kpiWidth + 2.5
    }
  })

  y = kpiY + kpiHeight + 15

  // Highlights del período
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...EXECUTIVE_PDF_COLORS.navy)
  doc.text('Highlights del Período', margin, y)
  y += 8

  // 3 principales highlights basados en insights
  const highlights = data.insights
    .filter(i => i.type === 'positive' || i.priority === 1)
    .slice(0, 3)

  if (highlights.length > 0) {
    highlights.forEach((insight, index) => {
      const bulletColor = insight.type === 'positive'
        ? EXECUTIVE_PDF_COLORS.success
        : insight.type === 'alert'
          ? EXECUTIVE_PDF_COLORS.warning
          : EXECUTIVE_PDF_COLORS.navy

      // Bullet
      doc.setFillColor(...bulletColor)
      doc.circle(margin + 3, y + 2, 2, 'F')

      // Texto
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...EXECUTIVE_PDF_COLORS.dark)
      doc.text(insight.title, margin + 10, y + 3)

      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...EXECUTIVE_PDF_COLORS.neutral)
      const descripcionLines = doc.splitTextToSize(insight.description, contentWidth - 15)
      doc.text(descripcionLines, margin + 10, y + 10)

      y += 8 + descripcionLines.length * 5 + 5
    })
  } else {
    doc.setFontSize(10)
    doc.setTextColor(...EXECUTIVE_PDF_COLORS.neutral)
    doc.text('No hay highlights significativos para este período.', margin, y)
  }

  // Tabla comparativa
  y += 10
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...EXECUTIVE_PDF_COLORS.navy)
  doc.text('Comparativa vs Período Anterior', margin, y)
  y += 5

  const tableData = data.kpis.slice(0, 6).map(kpi => {
    const anterior = kpi.value - (kpi.change || 0)
    const variacion = kpi.changePercent || 0
    return [
      kpi.title,
      formatearValorKPI(anterior, kpi),
      kpi.formattedValue,
      `${variacion >= 0 ? '+' : ''}${variacion.toFixed(1)}%`,
    ]
  })

  ;(doc as any).autoTable({
    startY: y,
    head: [['Métrica', 'Anterior', 'Actual', 'Variación']],
    body: tableData,
    theme: 'plain',
    headStyles: {
      fillColor: EXECUTIVE_PDF_COLORS.navy,
      textColor: EXECUTIVE_PDF_COLORS.white,
      fontStyle: 'bold',
      fontSize: 9,
      cellPadding: 4,
    },
    bodyStyles: {
      fontSize: 9,
      cellPadding: 4,
    },
    alternateRowStyles: {
      fillColor: EXECUTIVE_PDF_COLORS.light,
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 60 },
      1: { halign: 'right' },
      2: { halign: 'right', fontStyle: 'bold' },
      3: { halign: 'right' },
    },
    didParseCell: (data: any) => {
      if (data.column.index === 3 && data.section === 'body') {
        const value = parseFloat(data.cell.raw as string)
        if (value > 0) {
          data.cell.styles.textColor = EXECUTIVE_PDF_COLORS.success
        } else if (value < 0) {
          data.cell.styles.textColor = EXECUTIVE_PDF_COLORS.danger
        }
      }
    },
    margin: { left: margin, right: margin },
  })
}

// ============================
// ANÁLISIS DETALLADO (Página 3)
// ============================

function generarAnalisisDetallado(
  doc: jsPDF,
  data: InformeEjecutivoPDFData,
  pageWidth: number,
  margin: number,
  contentWidth: number
): void {
  let y = 20

  // Header de sección
  y = agregarHeaderSeccion(doc, 'ANÁLISIS DETALLADO', margin, y, contentWidth)
  y += 10

  // Waterfall Chart (representación simplificada en tabla)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...EXECUTIVE_PDF_COLORS.navy)
  doc.text('Flujo de Caja del Período', margin, y)
  y += 8

  // Representar waterfall como barras horizontales
  const maxWaterfall = Math.max(...data.waterfall.map(w => Math.abs(w.value)))

  data.waterfall.forEach((item, index) => {
    const barWidth = maxWaterfall > 0 ? (Math.abs(item.value) / maxWaterfall) * (contentWidth * 0.5) : 0
    const isPositive = item.value >= 0
    const isTotal = item.type === 'total'

    // Label
    doc.setFontSize(9)
    doc.setFont('helvetica', isTotal ? 'bold' : 'normal')
    doc.setTextColor(...EXECUTIVE_PDF_COLORS.dark)
    doc.text(item.name, margin, y + 4)

    // Barra
    const barX = margin + 55
    const barColor = isTotal
      ? EXECUTIVE_PDF_COLORS.navy
      : isPositive
        ? EXECUTIVE_PDF_COLORS.success
        : EXECUTIVE_PDF_COLORS.danger

    doc.setFillColor(...barColor)
    doc.rect(barX, y, barWidth, 6, 'F')

    // Valor
    doc.setFontSize(9)
    doc.setFont('helvetica', isTotal ? 'bold' : 'normal')
    doc.text(formatearMoneda(item.value), barX + barWidth + 5, y + 4)

    y += 12
  })

  y += 10

  // Desglose por categoría
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...EXECUTIVE_PDF_COLORS.navy)
  doc.text('Métricas de Rendimiento', margin, y)
  y += 8

  // Tabla de métricas
  const metricasRendimiento = data.kpis
    .filter(kpi => kpi.target)
    .map(kpi => {
      const cumplimiento = kpi.target ? ((kpi.value / kpi.target) * 100).toFixed(1) : '-'
      return [
        kpi.title,
        kpi.formattedValue,
        kpi.target ? kpi.target.toString() : '-',
        `${cumplimiento}%`,
        getEstadoKPI(kpi),
      ]
    })

  if (metricasRendimiento.length > 0) {
    ;(doc as any).autoTable({
      startY: y,
      head: [['Indicador', 'Actual', 'Meta', 'Cumplimiento', 'Estado']],
      body: metricasRendimiento,
      theme: 'plain',
      headStyles: {
        fillColor: EXECUTIVE_PDF_COLORS.navy,
        textColor: EXECUTIVE_PDF_COLORS.white,
        fontStyle: 'bold',
        fontSize: 9,
        cellPadding: 4,
      },
      bodyStyles: {
        fontSize: 9,
        cellPadding: 4,
      },
      columnStyles: {
        0: { fontStyle: 'bold' },
        1: { halign: 'right' },
        2: { halign: 'right' },
        3: { halign: 'right' },
        4: { halign: 'center' },
      },
      didParseCell: (data: any) => {
        if (data.column.index === 4 && data.section === 'body') {
          const estado = data.cell.raw as string
          if (estado === 'Excelente' || estado === 'En meta') {
            data.cell.styles.textColor = EXECUTIVE_PDF_COLORS.success
          } else if (estado === 'En riesgo') {
            data.cell.styles.textColor = EXECUTIVE_PDF_COLORS.warning
          } else if (estado === 'Crítico') {
            data.cell.styles.textColor = EXECUTIVE_PDF_COLORS.danger
          }
        }
      },
      margin: { left: margin, right: margin },
    })
  }

  // Estadísticas adicionales
  const finalY = (doc as any).lastAutoTable?.finalY || y + 50
  y = finalY + 15

  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...EXECUTIVE_PDF_COLORS.navy)
  doc.text('Estadísticas del Período', margin, y)
  y += 10

  // Grid de estadísticas mini
  const stats = [
    { label: 'Total Documentos', value: data.kpis.find(k => k.id.includes('documento'))?.formattedValue || '0' },
    { label: 'Tasa Clasificación', value: data.kpis.find(k => k.id.includes('clasificacion'))?.formattedValue || '0%' },
    { label: 'F29 Generados', value: data.kpis.find(k => k.id.includes('f29'))?.formattedValue || '0' },
    { label: 'Horas Ahorradas', value: data.kpis.find(k => k.id.includes('horas'))?.formattedValue || '0h' },
  ]

  const statWidth = (contentWidth - 15) / 4
  stats.forEach((stat, index) => {
    const statX = margin + index * (statWidth + 5)

    // Caja
    doc.setFillColor(...EXECUTIVE_PDF_COLORS.light)
    doc.setDrawColor(...EXECUTIVE_PDF_COLORS.border)
    doc.roundedRect(statX, y, statWidth, 25, 2, 2, 'FD')

    // Label
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...EXECUTIVE_PDF_COLORS.neutral)
    doc.text(stat.label, statX + 5, y + 8)

    // Value
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...EXECUTIVE_PDF_COLORS.navy)
    doc.text(stat.value, statX + 5, y + 20)
  })
}

// ============================
// INSIGHTS Y RECOMENDACIONES (Página 4)
// ============================

function generarInsightsRecomendaciones(
  doc: jsPDF,
  data: InformeEjecutivoPDFData,
  pageWidth: number,
  margin: number,
  contentWidth: number
): void {
  let y = 20

  // Header de sección
  y = agregarHeaderSeccion(doc, 'INSIGHTS Y RECOMENDACIONES', margin, y, contentWidth)
  y += 10

  // Insights
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...EXECUTIVE_PDF_COLORS.navy)
  doc.text('Insights del Período', margin, y)
  y += 8

  if (data.insights.length > 0) {
    data.insights.forEach((insight, index) => {
      const insightColor = insight.type === 'positive'
        ? EXECUTIVE_PDF_COLORS.success
        : insight.type === 'negative'
          ? EXECUTIVE_PDF_COLORS.danger
          : insight.type === 'alert'
            ? EXECUTIVE_PDF_COLORS.warning
            : EXECUTIVE_PDF_COLORS.neutral

      // Número de insight
      doc.setFillColor(...insightColor)
      doc.circle(margin + 4, y + 3, 4, 'F')
      doc.setFontSize(8)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...EXECUTIVE_PDF_COLORS.white)
      doc.text((index + 1).toString(), margin + 2.5, y + 5)

      // Contenido
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...EXECUTIVE_PDF_COLORS.dark)
      doc.text(insight.title, margin + 15, y + 4)

      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...EXECUTIVE_PDF_COLORS.neutral)
      const descripcionLines = doc.splitTextToSize(insight.description, contentWidth - 20)
      doc.text(descripcionLines, margin + 15, y + 11)

      // Prioridad badge
      doc.setFontSize(7)
      doc.setFillColor(...(insight.priority === 1 ? EXECUTIVE_PDF_COLORS.danger :
        insight.priority === 2 ? EXECUTIVE_PDF_COLORS.warning : EXECUTIVE_PDF_COLORS.neutral))
      doc.roundedRect(pageWidth - margin - 20, y, 15, 6, 1, 1, 'F')
      doc.setTextColor(...EXECUTIVE_PDF_COLORS.white)
      doc.text(`P${insight.priority}`, pageWidth - margin - 17, y + 4)

      y += 12 + descripcionLines.length * 5 + 3
    })
  } else {
    doc.setFontSize(10)
    doc.setTextColor(...EXECUTIVE_PDF_COLORS.neutral)
    doc.text('No hay insights disponibles para este período.', margin, y)
    y += 15
  }

  // Recomendaciones
  y += 10
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...EXECUTIVE_PDF_COLORS.navy)
  doc.text('Recomendaciones', margin, y)
  y += 8

  const recomendaciones = data.insights
    .filter(i => i.category === 'recommendation' || i.type === 'alert')
    .slice(0, 5)

  if (recomendaciones.length > 0) {
    recomendaciones.forEach((rec, index) => {
      // Checkbox decorativo
      doc.setDrawColor(...EXECUTIVE_PDF_COLORS.navy)
      doc.setLineWidth(0.3)
      doc.rect(margin, y - 1, 4, 4)

      // Texto
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...EXECUTIVE_PDF_COLORS.dark)
      const recLines = doc.splitTextToSize(`${rec.title}: ${rec.description}`, contentWidth - 10)
      doc.text(recLines, margin + 8, y + 2)

      y += recLines.length * 5 + 5
    })
  } else {
    // Recomendaciones por defecto basadas en KPIs
    const defaultRecs = [
      'Mantener el ritmo de procesamiento de documentos para cumplir metas del período.',
      'Revisar periódicamente los F29 pendientes antes de la fecha límite.',
      'Monitorear la tasa de éxito de los bots de automatización.',
    ]

    defaultRecs.forEach((rec, index) => {
      doc.setDrawColor(...EXECUTIVE_PDF_COLORS.navy)
      doc.setLineWidth(0.3)
      doc.rect(margin, y - 1, 4, 4)

      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...EXECUTIVE_PDF_COLORS.dark)
      doc.text(rec, margin + 8, y + 2)

      y += 10
    })
  }

  // Próximos pasos
  y += 15
  doc.setFillColor(...EXECUTIVE_PDF_COLORS.light)
  doc.roundedRect(margin, y, contentWidth, 35, 3, 3, 'F')

  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...EXECUTIVE_PDF_COLORS.navy)
  doc.text('Próximos Pasos', margin + 8, y + 10)

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...EXECUTIVE_PDF_COLORS.dark)
  const proximosPasos = [
    '1. Revisar insights críticos y tomar acciones correctivas',
    '2. Validar F29 pendientes antes de la fecha límite',
    '3. Programar revisión de métricas para el próximo período',
  ]
  doc.text(proximosPasos, margin + 8, y + 18)
}

// ============================
// FUNCIONES AUXILIARES
// ============================

function agregarHeaderSeccion(
  doc: jsPDF,
  titulo: string,
  margin: number,
  y: number,
  contentWidth: number
): number {
  // Línea decorativa superior
  doc.setDrawColor(...EXECUTIVE_PDF_COLORS.navy)
  doc.setLineWidth(0.5)
  doc.line(margin, y, margin + contentWidth, y)

  y += 8

  // Título
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...EXECUTIVE_PDF_COLORS.navy)
  doc.text(titulo, margin, y)

  y += 2

  // Línea decorativa inferior (dorada)
  doc.setDrawColor(...EXECUTIVE_PDF_COLORS.gold)
  doc.setLineWidth(1)
  doc.line(margin, y + 3, margin + 40, y + 3)

  return y + 8
}

function dibujarKPICard(
  doc: jsPDF,
  kpi: ExecutiveKPI,
  x: number,
  y: number,
  width: number,
  height: number
): void {
  // Fondo de card
  doc.setFillColor(...EXECUTIVE_PDF_COLORS.white)
  doc.setDrawColor(...EXECUTIVE_PDF_COLORS.border)
  doc.setLineWidth(0.3)
  doc.roundedRect(x, y, width, height, 2, 2, 'FD')

  // Indicador de color según status
  const statusColor = kpi.status === 'positive'
    ? EXECUTIVE_PDF_COLORS.success
    : kpi.status === 'negative'
      ? EXECUTIVE_PDF_COLORS.danger
      : EXECUTIVE_PDF_COLORS.neutral

  doc.setFillColor(...statusColor)
  doc.rect(x, y, 3, height, 'F')

  // Título
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...EXECUTIVE_PDF_COLORS.neutral)
  doc.text(kpi.title.toUpperCase(), x + 6, y + 8)

  // Valor principal
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...EXECUTIVE_PDF_COLORS.dark)
  doc.text(kpi.formattedValue, x + 6, y + 22)

  // Variación
  if (kpi.changePercent !== undefined) {
    const changeColor = kpi.changePercent >= 0
      ? EXECUTIVE_PDF_COLORS.success
      : EXECUTIVE_PDF_COLORS.danger

    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...changeColor)
    const changeText = `${kpi.changePercent >= 0 ? '↑' : '↓'} ${Math.abs(kpi.changePercent).toFixed(1)}%`
    doc.text(changeText, x + 6, y + 32)

    doc.setTextColor(...EXECUTIVE_PDF_COLORS.neutral)
    doc.text('vs anterior', x + 30, y + 32)
  }
}

function agregarFooter(
  doc: jsPDF,
  pageWidth: number,
  pageHeight: number,
  currentPage: number,
  totalPages: number
): void {
  const footerY = pageHeight - 12

  // Línea separadora
  doc.setDrawColor(...EXECUTIVE_PDF_COLORS.border)
  doc.setLineWidth(0.3)
  doc.line(20, footerY - 5, pageWidth - 20, footerY - 5)

  // Logo mini
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...EXECUTIVE_PDF_COLORS.navy)
  doc.text('HV', 20, footerY)

  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...EXECUTIVE_PDF_COLORS.neutral)
  doc.text('Consultores', 28, footerY)

  // Texto central
  doc.setFontSize(8)
  doc.text('Documento Confidencial', pageWidth / 2, footerY, { align: 'center' })

  // Número de página
  doc.text(`Página ${currentPage} de ${totalPages}`, pageWidth - 20, footerY, { align: 'right' })
}

function formatearPeriodo(periodo: string): string {
  const [year, month] = periodo.split('-')
  const fecha = new Date(parseInt(year), parseInt(month) - 1)
  return fecha.toLocaleDateString('es-CL', { month: 'long', year: 'numeric' })
}

function formatearMoneda(valor: number): string {
  const absValor = Math.abs(valor)
  if (absValor >= 1000000) {
    return `${valor < 0 ? '-' : ''}$${(absValor / 1000000).toFixed(1)}M`
  }
  if (absValor >= 1000) {
    return `${valor < 0 ? '-' : ''}$${(absValor / 1000).toFixed(0)}K`
  }
  return `${valor < 0 ? '-' : ''}$${absValor.toLocaleString('es-CL')}`
}

function formatearValorKPI(valor: number, kpi: ExecutiveKPI): string {
  if (kpi.id.includes('tasa') || kpi.id.includes('exito')) {
    return `${valor.toFixed(1)}%`
  }
  if (kpi.id.includes('horas')) {
    return `${Math.round(valor)}h`
  }
  return valor.toLocaleString('es-CL')
}

function getEstadoKPI(kpi: ExecutiveKPI): string {
  if (!kpi.target) return '-'
  const porcentaje = (kpi.value / kpi.target) * 100
  if (porcentaje >= 100) return 'Excelente'
  if (porcentaje >= 90) return 'En meta'
  if (porcentaje >= 70) return 'En riesgo'
  return 'Crítico'
}

// ============================================
// EXPORTAR FUNCIONES ADICIONALES
// ============================================

export { EXECUTIVE_PDF_COLORS }
