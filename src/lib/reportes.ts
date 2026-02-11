// ============================================
// TIPOS DE DATOS PARA REPORTES
// ============================================

export interface DatosF29 {
  cliente: {
    rut: string
    razon_social: string
    giro: string
    direccion: string
  }
  periodo: string
  codigos: {
    codigo: number
    descripcion: string
    monto_neto: number
    monto_iva: number
    cantidad_documentos: number
  }[]
  totales: {
    debito_fiscal: number
    credito_fiscal: number
    remanente_anterior: number
    remanente_mes: number
    ppm: number
    total_a_pagar: number
  }
  validaciones: {
    descripcion: string
    resultado: 'ok' | 'warning' | 'error'
    mensaje: string
  }[]
}

export interface DatosDocumentos {
  cliente: {
    rut: string
    razon_social: string
  }
  periodo: string
  documentos: {
    tipo: string
    folio: string
    fecha: string
    emisor: string
    rut_emisor: string
    glosa: string
    monto_neto: number
    monto_iva: number
    monto_total: number
    cuenta: string
    estado: string
  }[]
}

export interface DatosResumenMensual {
  cliente: {
    rut: string
    razon_social: string
  }
  periodo: string
  resumen: {
    total_compras: number
    total_ventas: number
    iva_debito: number
    iva_credito: number
    documentos_procesados: number
    documentos_pendientes: number
  }
  por_tipo: {
    tipo: string
    cantidad: number
    monto_total: number
  }[]
}

// ============================================
// GENERACIÓN DE PDF (lazy-loaded)
// ============================================

// Colores del tema
const COLORS = {
  primary: [59, 130, 246] as [number, number, number], // blue-500
  secondary: [107, 114, 128] as [number, number, number], // gray-500
  success: [34, 197, 94] as [number, number, number], // green-500
  warning: [245, 158, 11] as [number, number, number], // amber-500
  danger: [239, 68, 68] as [number, number, number], // red-500
  dark: [31, 41, 55] as [number, number, number], // gray-800
}

// Generar PDF de F29
export async function generarPDFF29(datos: DatosF29): Promise<void> {
  const { default: jsPDF } = await import('jspdf')
  const { default: autoTable } = await import('jspdf-autotable')

  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()

  // Header
  doc.setFillColor(...COLORS.primary)
  doc.rect(0, 0, pageWidth, 35, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text('FORMULARIO 29', 14, 15)

  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.text('Declaración Mensual y Pago Simultáneo de Impuestos', 14, 23)
  doc.text(`Período: ${datos.periodo}`, 14, 30)

  // Logo HV
  doc.setFontSize(24)
  doc.setFont('helvetica', 'bold')
  doc.text('HV', pageWidth - 30, 20)
  doc.setFontSize(10)
  doc.text('Consultores', pageWidth - 38, 28)

  // Datos del contribuyente
  doc.setTextColor(...COLORS.dark)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('Datos del Contribuyente', 14, 50)

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  const datosContribuyente = [
    ['RUT', datos.cliente.rut],
    ['Razón Social', datos.cliente.razon_social],
    ['Giro', datos.cliente.giro || '-'],
    ['Dirección', datos.cliente.direccion || '-'],
  ]

  let y = 55
  datosContribuyente.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold')
    doc.text(`${label}:`, 14, y)
    doc.setFont('helvetica', 'normal')
    doc.text(value, 50, y)
    y += 6
  })

  // Tabla de códigos
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('Detalle por Códigos', 14, y + 10)

  autoTable(doc, {
    startY: y + 15,
    head: [['Código', 'Descripción', 'Docs', 'Monto Neto', 'IVA']],
    body: datos.codigos.map(c => [
      c.codigo.toString(),
      c.descripcion,
      c.cantidad_documentos.toString(),
      `$${c.monto_neto.toLocaleString('es-CL')}`,
      `$${c.monto_iva.toLocaleString('es-CL')}`,
    ]),
    theme: 'striped',
    headStyles: {
      fillColor: COLORS.primary,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 20 },
      1: { cellWidth: 70 },
      2: { halign: 'center', cellWidth: 20 },
      3: { halign: 'right', cellWidth: 35 },
      4: { halign: 'right', cellWidth: 35 },
    },
  })

  // Resumen de totales
  const finalY = (doc as any).lastAutoTable.finalY + 10

  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('Resumen de Impuestos', 14, finalY)

  const totalesData = [
    ['Débito Fiscal (IVA Ventas)', `$${datos.totales.debito_fiscal.toLocaleString('es-CL')}`],
    ['Crédito Fiscal (IVA Compras)', `$${datos.totales.credito_fiscal.toLocaleString('es-CL')}`],
    ['Remanente Mes Anterior', `$${datos.totales.remanente_anterior.toLocaleString('es-CL')}`],
    ['Remanente del Mes', `$${datos.totales.remanente_mes.toLocaleString('es-CL')}`],
    ['PPM Determinado', `$${datos.totales.ppm.toLocaleString('es-CL')}`],
  ]

  autoTable(doc, {
    startY: finalY + 5,
    body: totalesData,
    theme: 'plain',
    styles: {
      fontSize: 10,
      cellPadding: 2,
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 100 },
      1: { halign: 'right' },
    },
  })

  // Total a pagar destacado
  const totalesY = (doc as any).lastAutoTable.finalY + 5
  doc.setFillColor(...COLORS.primary)
  doc.rect(14, totalesY, pageWidth - 28, 12, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('TOTAL A PAGAR:', 20, totalesY + 8)
  doc.text(`$${datos.totales.total_a_pagar.toLocaleString('es-CL')}`, pageWidth - 20, totalesY + 8, { align: 'right' })

  // Validaciones si hay
  if (datos.validaciones.length > 0) {
    const validY = totalesY + 20
    doc.setTextColor(...COLORS.dark)
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Validaciones', 14, validY)

    autoTable(doc, {
      startY: validY + 5,
      head: [['Estado', 'Descripción', 'Mensaje']],
      body: datos.validaciones.map(v => [
        v.resultado.toUpperCase(),
        v.descripcion,
        v.mensaje,
      ]),
      theme: 'striped',
      headStyles: {
        fillColor: COLORS.secondary,
        textColor: [255, 255, 255],
      },
      styles: { fontSize: 8 },
      didParseCell: (data) => {
        if (data.column.index === 0 && data.section === 'body') {
          const value = data.cell.raw as string
          if (value === 'ERROR') {
            data.cell.styles.textColor = COLORS.danger
            data.cell.styles.fontStyle = 'bold'
          } else if (value === 'WARNING') {
            data.cell.styles.textColor = COLORS.warning
            data.cell.styles.fontStyle = 'bold'
          } else {
            data.cell.styles.textColor = COLORS.success
          }
        }
      },
    })
  }

  // Footer
  const pageHeight = doc.internal.pageSize.getHeight()
  doc.setTextColor(...COLORS.secondary)
  doc.setFontSize(8)
  doc.text(
    `Generado por HV Consultores - ${new Date().toLocaleDateString('es-CL')} ${new Date().toLocaleTimeString('es-CL')}`,
    pageWidth / 2,
    pageHeight - 10,
    { align: 'center' }
  )

  // Guardar
  doc.save(`F29_${datos.cliente.rut}_${datos.periodo}.pdf`)
}

// Generar PDF de resumen mensual
export async function generarPDFResumenMensual(datos: DatosResumenMensual): Promise<void> {
  const { default: jsPDF } = await import('jspdf')
  const { default: autoTable } = await import('jspdf-autotable')

  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()

  // Header
  doc.setFillColor(...COLORS.primary)
  doc.rect(0, 0, pageWidth, 35, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text('RESUMEN MENSUAL', 14, 15)

  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.text(datos.cliente.razon_social, 14, 23)
  doc.text(`Período: ${datos.periodo}`, 14, 30)

  // KPIs
  doc.setTextColor(...COLORS.dark)
  const kpis = [
    { label: 'Total Compras', value: `$${datos.resumen.total_compras.toLocaleString('es-CL')}`, color: COLORS.danger },
    { label: 'Total Ventas', value: `$${datos.resumen.total_ventas.toLocaleString('es-CL')}`, color: COLORS.success },
    { label: 'IVA Débito', value: `$${datos.resumen.iva_debito.toLocaleString('es-CL')}`, color: COLORS.primary },
    { label: 'IVA Crédito', value: `$${datos.resumen.iva_credito.toLocaleString('es-CL')}`, color: COLORS.warning },
  ]

  let x = 14
  kpis.forEach((kpi) => {
    doc.setFillColor(...kpi.color)
    doc.roundedRect(x, 45, 43, 25, 3, 3, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(8)
    doc.text(kpi.label, x + 5, 53)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text(kpi.value, x + 5, 63)
    doc.setFont('helvetica', 'normal')
    x += 47
  })

  // Estadísticas de documentos
  doc.setTextColor(...COLORS.dark)
  doc.setFontSize(10)
  doc.text(`Documentos Procesados: ${datos.resumen.documentos_procesados}`, 14, 85)
  doc.text(`Documentos Pendientes: ${datos.resumen.documentos_pendientes}`, 100, 85)

  // Tabla por tipo
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('Desglose por Tipo de Documento', 14, 100)

  autoTable(doc, {
    startY: 105,
    head: [['Tipo de Documento', 'Cantidad', 'Monto Total']],
    body: datos.por_tipo.map(t => [
      t.tipo,
      t.cantidad.toString(),
      `$${t.monto_total.toLocaleString('es-CL')}`,
    ]),
    theme: 'striped',
    headStyles: {
      fillColor: COLORS.primary,
      textColor: [255, 255, 255],
    },
    columnStyles: {
      1: { halign: 'center' },
      2: { halign: 'right' },
    },
  })

  // Footer
  const pageHeight = doc.internal.pageSize.getHeight()
  doc.setTextColor(...COLORS.secondary)
  doc.setFontSize(8)
  doc.text(
    `Generado por HV Consultores - ${new Date().toLocaleDateString('es-CL')}`,
    pageWidth / 2,
    pageHeight - 10,
    { align: 'center' }
  )

  doc.save(`Resumen_${datos.cliente.rut}_${datos.periodo}.pdf`)
}

// ============================================
// GENERACIÓN DE EXCEL (lazy-loaded)
// ============================================

// Generar Excel de documentos
export async function generarExcelDocumentos(datos: DatosDocumentos): Promise<void> {
  const XLSX = await import('xlsx')
  const { saveAs } = await import('file-saver')

  // Crear workbook
  const wb = XLSX.utils.book_new()

  // Hoja de datos
  const wsData = [
    // Header con info del cliente
    ['REPORTE DE DOCUMENTOS'],
    [''],
    ['Cliente:', datos.cliente.razon_social],
    ['RUT:', datos.cliente.rut],
    ['Período:', datos.periodo],
    ['Fecha Generación:', new Date().toLocaleDateString('es-CL')],
    [''],
    // Encabezados de tabla
    ['Tipo', 'Folio', 'Fecha', 'Emisor', 'RUT Emisor', 'Glosa', 'Monto Neto', 'IVA', 'Total', 'Cuenta', 'Estado'],
    // Datos
    ...datos.documentos.map(d => [
      d.tipo,
      d.folio,
      d.fecha,
      d.emisor,
      d.rut_emisor,
      d.glosa,
      d.monto_neto,
      d.monto_iva,
      d.monto_total,
      d.cuenta,
      d.estado,
    ]),
  ]

  const ws = XLSX.utils.aoa_to_sheet(wsData)

  // Ajustar anchos de columna
  ws['!cols'] = [
    { wch: 15 }, // Tipo
    { wch: 12 }, // Folio
    { wch: 12 }, // Fecha
    { wch: 30 }, // Emisor
    { wch: 15 }, // RUT Emisor
    { wch: 40 }, // Glosa
    { wch: 15 }, // Monto Neto
    { wch: 12 }, // IVA
    { wch: 15 }, // Total
    { wch: 30 }, // Cuenta
    { wch: 12 }, // Estado
  ]

  XLSX.utils.book_append_sheet(wb, ws, 'Documentos')

  // Hoja de resumen
  const totales = datos.documentos.reduce(
    (acc, d) => ({
      neto: acc.neto + d.monto_neto,
      iva: acc.iva + d.monto_iva,
      total: acc.total + d.monto_total,
    }),
    { neto: 0, iva: 0, total: 0 }
  )

  const wsResumen = XLSX.utils.aoa_to_sheet([
    ['RESUMEN'],
    [''],
    ['Total Documentos:', datos.documentos.length],
    [''],
    ['Monto Neto Total:', totales.neto],
    ['IVA Total:', totales.iva],
    ['Monto Total:', totales.total],
  ])

  XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen')

  // Descargar
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  const blob = new Blob([wbout], { type: 'application/octet-stream' })
  saveAs(blob, `Documentos_${datos.cliente.rut}_${datos.periodo}.xlsx`)
}

// Generar Excel de F29
export async function generarExcelF29(datos: DatosF29): Promise<void> {
  const XLSX = await import('xlsx')
  const { saveAs } = await import('file-saver')

  const wb = XLSX.utils.book_new()

  // Hoja principal
  const wsData = [
    ['FORMULARIO 29 - DECLARACIÓN MENSUAL'],
    [''],
    ['Cliente:', datos.cliente.razon_social],
    ['RUT:', datos.cliente.rut],
    ['Período:', datos.periodo],
    [''],
    ['DETALLE POR CÓDIGOS'],
    ['Código', 'Descripción', 'Cantidad Docs', 'Monto Neto', 'IVA'],
    ...datos.codigos.map(c => [
      c.codigo,
      c.descripcion,
      c.cantidad_documentos,
      c.monto_neto,
      c.monto_iva,
    ]),
    [''],
    ['RESUMEN DE IMPUESTOS'],
    ['Débito Fiscal', datos.totales.debito_fiscal],
    ['Crédito Fiscal', datos.totales.credito_fiscal],
    ['Remanente Mes Anterior', datos.totales.remanente_anterior],
    ['Remanente del Mes', datos.totales.remanente_mes],
    ['PPM Determinado', datos.totales.ppm],
    [''],
    ['TOTAL A PAGAR', datos.totales.total_a_pagar],
  ]

  const ws = XLSX.utils.aoa_to_sheet(wsData)

  ws['!cols'] = [
    { wch: 12 },
    { wch: 40 },
    { wch: 15 },
    { wch: 15 },
    { wch: 15 },
  ]

  XLSX.utils.book_append_sheet(wb, ws, 'F29')

  // Hoja de validaciones
  if (datos.validaciones.length > 0) {
    const wsValidaciones = XLSX.utils.aoa_to_sheet([
      ['VALIDACIONES'],
      [''],
      ['Estado', 'Descripción', 'Mensaje'],
      ...datos.validaciones.map(v => [v.resultado, v.descripcion, v.mensaje]),
    ])
    XLSX.utils.book_append_sheet(wb, wsValidaciones, 'Validaciones')
  }

  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  const blob = new Blob([wbout], { type: 'application/octet-stream' })
  saveAs(blob, `F29_${datos.cliente.rut}_${datos.periodo}.xlsx`)
}

// Generar Excel de estadísticas generales
export async function generarExcelEstadisticas(datos: {
  periodo: string
  clientes: { rut: string; razon_social: string; documentos: number; f29_status: string }[]
  totales: { documentos: number; clientes: number; f29_enviados: number }
}): Promise<void> {
  const XLSX = await import('xlsx')
  const { saveAs } = await import('file-saver')

  const wb = XLSX.utils.book_new()

  const wsData = [
    ['ESTADÍSTICAS GENERALES - HV CONSULTORES'],
    [''],
    ['Período:', datos.periodo],
    ['Fecha:', new Date().toLocaleDateString('es-CL')],
    [''],
    ['RESUMEN GENERAL'],
    ['Total Clientes:', datos.totales.clientes],
    ['Total Documentos:', datos.totales.documentos],
    ['F29 Enviados:', datos.totales.f29_enviados],
    [''],
    ['DETALLE POR CLIENTE'],
    ['RUT', 'Razón Social', 'Documentos', 'Estado F29'],
    ...datos.clientes.map(c => [c.rut, c.razon_social, c.documentos, c.f29_status]),
  ]

  const ws = XLSX.utils.aoa_to_sheet(wsData)
  ws['!cols'] = [
    { wch: 15 },
    { wch: 40 },
    { wch: 15 },
    { wch: 15 },
  ]

  XLSX.utils.book_append_sheet(wb, ws, 'Estadísticas')

  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  const blob = new Blob([wbout], { type: 'application/octet-stream' })
  saveAs(blob, `Estadisticas_${datos.periodo}.xlsx`)
}
