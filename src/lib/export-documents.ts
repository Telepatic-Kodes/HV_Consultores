// @ts-nocheck
/**
 * Document Export Utilities
 * Export documents to Excel, CSV, and PDF formats
 */

import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import type { Database } from '@/types/database.types'

type DocumentoCarga = Database['public']['Tables']['documento_cargas']['Row']

interface ExportOptions {
  formato: 'csv' | 'excel' | 'json'
  incluirWorkflow?: boolean
}

/**
 * Convert documents to CSV format
 */
export function documentosToCSV(documentos: DocumentoCarga[]): string {
  const headers = [
    'ID',
    'Cliente ID',
    'Nombre de Archivo',
    'Tipo',
    'Folio',
    'Fecha',
    'Monto Total',
    'Estado',
    'Nubox ID',
    'Nubox Estado',
    'Cargado Por',
    'Cargado En',
    'Validado En',
    'Enviado En',
  ]

  const rows = documentos.map((doc) => [
    doc.id,
    doc.cliente_id,
    doc.nombre_archivo,
    doc.tipo_documento,
    doc.folio_documento || '',
    doc.fecha_documento || '',
    doc.monto_total || '',
    doc.estado,
    doc.nubox_documento_id || '',
    doc.nubox_estado || '',
    doc.cargado_por,
    doc.cargado_en ? format(new Date(doc.cargado_en), 'yyyy-MM-dd HH:mm:ss') : '',
    doc.validado_en ? format(new Date(doc.validado_en), 'yyyy-MM-dd HH:mm:ss') : '',
    doc.enviado_en ? format(new Date(doc.enviado_en), 'yyyy-MM-dd HH:mm:ss') : '',
  ])

  // Escape CSV values
  const escapedRows = rows.map((row) =>
    row.map((cell) => {
      const cellStr = String(cell)
      if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
        return `"${cellStr.replace(/"/g, '""')}"`
      }
      return cellStr
    })
  )

  return [headers, ...escapedRows].map((row) => row.join(',')).join('\n')
}

/**
 * Download CSV file
 */
export function downloadCSV(data: string, filename: string = 'documentos.csv'): void {
  const blob = new Blob([data], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)

  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

/**
 * Export to Excel using a simple library
 * Requires: npm install xlsx
 */
export async function documentosToExcel(documentos: DocumentoCarga[], filename: string = 'documentos.xlsx'): Promise<void> {
  try {
    // Dynamically import xlsx to avoid bundle size issues
    const XLSX = await import('xlsx')

    const data = documentos.map((doc) => ({
      'ID': doc.id.substring(0, 8),
      'Archivo': doc.nombre_archivo,
      'Tipo': doc.tipo_documento,
      'Folio': doc.folio_documento || '-',
      'Fecha': doc.fecha_documento ? format(new Date(doc.fecha_documento), 'dd/MM/yyyy') : '-',
      'Monto': doc.monto_total ? `$${doc.monto_total.toLocaleString('es-CL')}` : '-',
      'Estado': doc.estado,
      'Nubox ID': doc.nubox_documento_id || '-',
      'Nubox Estado': doc.nubox_estado || '-',
      'Cargado': doc.cargado_en ? format(new Date(doc.cargado_en), 'dd/MM/yyyy HH:mm') : '-',
    }))

    const worksheet = XLSX.utils.json_to_sheet(data)
    const workbook = XLSX.utils.book_new()

    // Set column widths
    worksheet['!cols'] = [
      { wch: 10 },
      { wch: 30 },
      { wch: 15 },
      { wch: 12 },
      { wch: 12 },
      { wch: 15 },
      { wch: 12 },
      { wch: 15 },
      { wch: 15 },
      { wch: 18 },
    ]

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Documentos')
    XLSX.writeFile(workbook, filename)
  } catch (error) {
    console.error('Error exporting to Excel:', error)
    throw new Error('Error al exportar a Excel. Asegúrate de tener la librería xlsx instalada.')
  }
}

/**
 * Export to JSON
 */
export function documentosToJSON(documentos: DocumentoCarga[], filename: string = 'documentos.json'): void {
  const data = {
    fecha_exportacion: new Date().toISOString(),
    total_documentos: documentos.length,
    documentos: documentos.map((doc) => ({
      id: doc.id,
      cliente_id: doc.cliente_id,
      nombre_archivo: doc.nombre_archivo,
      tipo_documento: doc.tipo_documento,
      folio_documento: doc.folio_documento,
      fecha_documento: doc.fecha_documento,
      monto_total: doc.monto_total,
      estado: doc.estado,
      nubox_documento_id: doc.nubox_documento_id,
      nubox_estado: doc.nubox_estado,
      cargado_en: doc.cargado_en,
      validado_en: doc.validado_en,
      enviado_en: doc.enviado_en,
    })),
  }

  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: 'application/json;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)

  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

/**
 * Generate summary report
 */
export function generateSummaryReport(documentos: DocumentoCarga[]): string {
  const total = documentos.length
  const porEstado = {
    pendiente: documentos.filter((d) => d.estado === 'pendiente').length,
    validado: documentos.filter((d) => d.estado === 'validado').length,
    enviado_nubox: documentos.filter((d) => d.estado === 'enviado_nubox').length,
    rechazado: documentos.filter((d) => d.estado === 'rechazado').length,
  }

  const montoTotal = documentos.reduce((sum, doc) => sum + (doc.monto_total || 0), 0)
  const porTipo = documentos.reduce(
    (acc, doc) => {
      acc[doc.tipo_documento] = (acc[doc.tipo_documento] || 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  const fechaActual = format(new Date(), 'dd MMMM yyyy', { locale: es })

  let report = `REPORTE DE DOCUMENTOS\n`
  report += `Generado: ${fechaActual}\n`
  report += `\n`
  report += `RESUMEN GENERAL\n`
  report += `===============\n`
  report += `Total de documentos: ${total}\n`
  report += `Monto total: $${montoTotal.toLocaleString('es-CL')}\n`
  report += `\n`

  report += `ESTADO DE DOCUMENTOS\n`
  report += `===================\n`
  report += `Pendiente: ${porEstado.pendiente}\n`
  report += `Validado: ${porEstado.validado}\n`
  report += `Enviado a Nubox: ${porEstado.enviado_nubox}\n`
  report += `Rechazado: ${porEstado.rechazado}\n`
  report += `\n`

  report += `DOCUMENTOS POR TIPO\n`
  report += `===================\n`
  Object.entries(porTipo).forEach(([tipo, cantidad]) => {
    report += `${tipo}: ${cantidad}\n`
  })
  report += `\n`

  const tasa_exito =
    total > 0 ? Math.round((porEstado.validado + porEstado.enviado_nubox) / total * 100) : 0
  report += `MÉTRICAS\n`
  report += `========\n`
  report += `Tasa de éxito: ${tasa_exito}%\n`
  report += `Documentos procesados: ${porEstado.validado + porEstado.enviado_nubox}\n`

  return report
}

/**
 * Download summary report as TXT
 */
export function downloadSummaryReport(documentos: DocumentoCarga[], filename: string = 'resumen.txt'): void {
  const report = generateSummaryReport(documentos)
  const blob = new Blob([report], { type: 'text/plain;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)

  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

/**
 * Export documents based on selected format
 */
export async function exportDocumentos(
  documentos: DocumentoCarga[],
  options: ExportOptions
): Promise<void> {
  const timestamp = format(new Date(), 'yyyy-MM-dd_HHmmss')

  switch (options.formato) {
    case 'csv':
      const csv = documentosToCSV(documentos)
      downloadCSV(csv, `documentos_${timestamp}.csv`)
      break

    case 'excel':
      await documentosToExcel(documentos, `documentos_${timestamp}.xlsx`)
      break

    case 'json':
      documentosToJSON(documentos, `documentos_${timestamp}.json`)
      break
  }
}
