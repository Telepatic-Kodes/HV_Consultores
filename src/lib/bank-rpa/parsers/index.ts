// =============================================================================
// HV Consultores - Bank Statement Parsers
// Exportaciones centralizadas de parsers
// =============================================================================

export * from './pdf-parser'
export * from './excel-parser'

// Re-export main functions
export { parseBankPDF, createPDFParser, BankPDFParser } from './pdf-parser'
export { parseBankExcel, parseBankCSV, createExcelParser, BankExcelParser } from './excel-parser'

// Import types
import type { BankCode, ParsedCartola, ParserOptions, FileFormat } from '../types'
import { parseBankPDF } from './pdf-parser'
import { parseBankExcel, parseBankCSV } from './excel-parser'

// ============================================================================
// UNIFIED PARSER
// ============================================================================

/**
 * Parsea un archivo de cartola bancaria automáticamente detectando el formato
 */
export async function parseCartola(
  buffer: Buffer,
  banco: BankCode,
  options: ParserOptions & { format?: FileFormat } = {}
): Promise<ParsedCartola> {
  const format = options.format || detectFormat(buffer, options.formato)

  switch (format) {
    case 'pdf':
      return parseBankPDF(buffer, banco, options)

    case 'excel':
      return parseBankExcel(buffer, banco, options)

    case 'csv':
      return parseBankCSV(buffer, banco, options)

    case 'ofx':
      // OFX parser would go here
      // For now, try Excel parser as fallback
      return parseBankExcel(buffer, banco, options)

    default:
      throw new Error(`Formato de archivo no soportado: ${format}`)
  }
}

/**
 * Detecta el formato de un archivo basándose en magic bytes y contenido
 */
export function detectFormat(buffer: Buffer, hint?: string): FileFormat {
  // Check hint first
  if (hint) {
    const h = hint.toLowerCase()
    if (h === 'pdf') return 'pdf'
    if (h === 'xlsx' || h === 'xls' || h === 'excel') return 'excel'
    if (h === 'csv') return 'csv'
    if (h === 'ofx') return 'ofx'
  }

  // Check magic bytes
  const header = buffer.slice(0, 8)

  // PDF: %PDF-
  if (header.slice(0, 5).toString() === '%PDF-') {
    return 'pdf'
  }

  // XLSX (ZIP): PK
  if (header[0] === 0x50 && header[1] === 0x4B) {
    return 'excel'
  }

  // XLS (OLE): D0 CF 11 E0
  if (
    header[0] === 0xD0 &&
    header[1] === 0xCF &&
    header[2] === 0x11 &&
    header[3] === 0xE0
  ) {
    return 'excel'
  }

  // Check text content for OFX/CSV
  const text = buffer.toString('utf-8', 0, Math.min(buffer.length, 1000))

  // OFX starts with OFXHEADER or <?OFX
  if (text.includes('OFXHEADER') || text.includes('<?OFX')) {
    return 'ofx'
  }

  // CSV detection: check for common delimiters and structure
  const lines = text.split('\n').filter((l) => l.trim())
  if (lines.length > 0) {
    const firstLine = lines[0]
    const delimiters = [',', ';', '\t']

    for (const d of delimiters) {
      const count = (firstLine.match(new RegExp(d.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length
      if (count >= 2) {
        return 'csv'
      }
    }
  }

  return 'unknown'
}

/**
 * Valida que un archivo tenga un formato soportado
 */
export function isFormatSupported(format: FileFormat): boolean {
  return ['pdf', 'excel', 'csv', 'ofx'].includes(format)
}

/**
 * Obtiene la extensión de archivo esperada para un formato
 */
export function getFileExtension(format: FileFormat): string {
  switch (format) {
    case 'pdf':
      return '.pdf'
    case 'excel':
      return '.xlsx'
    case 'csv':
      return '.csv'
    case 'ofx':
      return '.ofx'
    default:
      return ''
  }
}

/**
 * Obtiene el MIME type para un formato
 */
export function getMimeType(format: FileFormat): string {
  switch (format) {
    case 'pdf':
      return 'application/pdf'
    case 'excel':
      return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    case 'csv':
      return 'text/csv'
    case 'ofx':
      return 'application/x-ofx'
    default:
      return 'application/octet-stream'
  }
}

// ============================================================================
// SUPPORTED FORMATS
// ============================================================================

export const SUPPORTED_FORMATS: FileFormat[] = ['pdf', 'excel', 'csv', 'ofx']

export const FORMAT_INFO: Record<
  FileFormat,
  { name: string; extensions: string[]; mimeTypes: string[] }
> = {
  pdf: {
    name: 'PDF',
    extensions: ['.pdf'],
    mimeTypes: ['application/pdf'],
  },
  excel: {
    name: 'Excel',
    extensions: ['.xlsx', '.xls'],
    mimeTypes: [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
    ],
  },
  csv: {
    name: 'CSV',
    extensions: ['.csv'],
    mimeTypes: ['text/csv', 'text/plain'],
  },
  ofx: {
    name: 'OFX',
    extensions: ['.ofx', '.qfx'],
    mimeTypes: ['application/x-ofx'],
  },
  unknown: {
    name: 'Desconocido',
    extensions: [],
    mimeTypes: [],
  },
}
