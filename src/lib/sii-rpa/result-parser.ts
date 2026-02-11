// @ts-nocheck — temporary: types need update after Convex migration
// SII RPA Result Parser
// HV Consultores - Parseo de respuestas del portal SII

import type {
  SiiSituacionTributaria,
  ActividadEconomica,
  DeclaracionPendiente,
  SiiLibroDownload,
  SiiF29Submission,
} from './types'
import { SII_ERRORS } from './constants'

// ============================================================================
// SITUACIÓN TRIBUTARIA PARSER
// ============================================================================

export interface SituacionTributariaRaw {
  html?: string
  text?: string
  estructurada?: Record<string, unknown>
}

export function parseSituacionTributaria(
  raw: SituacionTributariaRaw,
  clienteId: string,
  rut: string
): { success: boolean; data?: Partial<SiiSituacionTributaria>; error?: string } {
  try {
    const result: Partial<SiiSituacionTributaria> = {
      cliente_id: clienteId,
      rut,
      consultado_at: new Date().toISOString(),
      html_raw: raw.html,
    }

    // Si viene estructurada desde el scraper
    if (raw.estructurada) {
      const e = raw.estructurada as Record<string, unknown>

      result.razon_social = e.razon_social as string | undefined
      result.nombre_fantasia = e.nombre_fantasia as string | undefined
      result.inicio_actividades = e.inicio_actividades as string | undefined
      result.termino_giro = e.termino_giro as string | undefined
      result.facturador_electronico = Boolean(e.facturador_electronico)
      result.fecha_certificacion_dte = e.fecha_certificacion_dte as string | undefined
      result.contribuyente_iva = Boolean(e.contribuyente_iva)
      result.tasa_ppm_vigente = e.tasa_ppm_vigente as number | undefined
      result.mora_tributaria = Boolean(e.mora_tributaria)
      result.monto_deuda = e.monto_deuda as number | undefined

      // Parsear actividades económicas
      if (Array.isArray(e.actividades)) {
        result.actividades_economicas = e.actividades.map((a: Record<string, unknown>) => ({
          codigo: String(a.codigo || ''),
          descripcion: String(a.descripcion || ''),
          afecta_iva: Boolean(a.afecta_iva),
          fecha_inicio: a.fecha_inicio as string | undefined,
        }))
      }

      // Parsear declaraciones pendientes
      if (Array.isArray(e.declaraciones_pendientes)) {
        result.declaraciones_pendientes = e.declaraciones_pendientes.map(
          (d: Record<string, unknown>) => ({
            tipo: String(d.tipo || ''),
            periodo: String(d.periodo || ''),
            fecha_vencimiento: String(d.fecha_vencimiento || ''),
          })
        )
      }

      return { success: true, data: result }
    }

    // Parsear desde HTML/texto si no hay datos estructurados
    if (raw.html || raw.text) {
      const content = raw.html || raw.text || ''

      // Extraer razón social
      const razonMatch = content.match(/Raz[óo]n Social[:\s]*([^<\n]+)/i)
      if (razonMatch) result.razon_social = razonMatch[1].trim()

      // Extraer inicio de actividades
      const inicioMatch = content.match(/Inicio de Actividades[:\s]*(\d{2}[/-]\d{2}[/-]\d{4})/i)
      if (inicioMatch) result.inicio_actividades = inicioMatch[1]

      // Verificar si es facturador electrónico
      result.facturador_electronico = /facturador\s+electr[óo]nico/i.test(content)

      // Verificar contribuyente IVA
      result.contribuyente_iva = /contribuyente\s+de?\s+IVA/i.test(content)

      // Extraer tasa PPM
      const ppmMatch = content.match(/Tasa\s+PPM[:\s]*(\d+[.,]?\d*)\s*%/i)
      if (ppmMatch) result.tasa_ppm_vigente = parseFloat(ppmMatch[1].replace(',', '.'))

      // Verificar mora
      result.mora_tributaria = /mora|deuda|incumplimiento/i.test(content)

      // Extraer actividades económicas
      const actividadesRegex = /(\d{6})\s*[-–]\s*([^<\n]+)/g
      const actividades: ActividadEconomica[] = []
      let actMatch
      while ((actMatch = actividadesRegex.exec(content)) !== null) {
        actividades.push({
          codigo: actMatch[1],
          descripcion: actMatch[2].trim(),
          afecta_iva: true, // Por defecto
        })
      }
      if (actividades.length > 0) {
        result.actividades_economicas = actividades
      }

      return { success: true, data: result }
    }

    return { success: false, error: 'No hay datos para parsear' }
  } catch (error) {
    console.error('[parseSituacionTributaria] Error:', error)
    return { success: false, error: 'Error al parsear situación tributaria' }
  }
}

// ============================================================================
// LIBRO COMPRAS PARSER
// ============================================================================

export interface LibroComprasRaw {
  csv?: string
  xml?: string
  json?: unknown[]
}

export interface DocumentoLibro {
  tipo_documento: string
  folio: string
  rut_proveedor: string
  razon_social: string
  fecha_emision: string
  monto_exento: number
  monto_neto: number
  monto_iva: number
  monto_total: number
  tasa_iva?: number
}

export function parseLibroCompras(
  raw: LibroComprasRaw,
  clienteId: string,
  periodo: string
): {
  success: boolean
  data?: {
    documentos: DocumentoLibro[]
    totales: {
      neto: number
      iva: number
      total: number
      cantidad: number
    }
  }
  error?: string
} {
  try {
    const documentos: DocumentoLibro[] = []

    // Parsear desde CSV
    if (raw.csv) {
      const lines = raw.csv.split('\n')
      const headers = lines[0]?.split(';').map((h) => h.trim().toLowerCase())

      if (!headers) {
        return { success: false, error: 'CSV vacío' }
      }

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(';')
        if (values.length < 5) continue

        const doc: DocumentoLibro = {
          tipo_documento: getColumnValue(values, headers, ['tipo', 'tipo_documento', 'tipodte']) || '',
          folio: getColumnValue(values, headers, ['folio', 'nro_documento']) || '',
          rut_proveedor: getColumnValue(values, headers, ['rut', 'rut_proveedor', 'rut_emisor']) || '',
          razon_social: getColumnValue(values, headers, ['razon_social', 'nombre', 'proveedor']) || '',
          fecha_emision: getColumnValue(values, headers, ['fecha', 'fecha_emision', 'fch_doc']) || '',
          monto_exento: parseNumber(getColumnValue(values, headers, ['exento', 'monto_exento'])),
          monto_neto: parseNumber(getColumnValue(values, headers, ['neto', 'monto_neto'])),
          monto_iva: parseNumber(getColumnValue(values, headers, ['iva', 'monto_iva'])),
          monto_total: parseNumber(getColumnValue(values, headers, ['total', 'monto_total'])),
        }

        documentos.push(doc)
      }
    }

    // Parsear desde JSON
    if (raw.json && Array.isArray(raw.json)) {
      for (const item of raw.json) {
        const doc = item as Record<string, unknown>
        documentos.push({
          tipo_documento: String(doc.tipo_documento || doc.tipodte || ''),
          folio: String(doc.folio || doc.nro_documento || ''),
          rut_proveedor: String(doc.rut_proveedor || doc.rut_emisor || ''),
          razon_social: String(doc.razon_social || doc.nombre || ''),
          fecha_emision: String(doc.fecha_emision || doc.fch_doc || ''),
          monto_exento: parseNumber(doc.monto_exento),
          monto_neto: parseNumber(doc.monto_neto),
          monto_iva: parseNumber(doc.monto_iva),
          monto_total: parseNumber(doc.monto_total),
        })
      }
    }

    // Calcular totales
    const totales = documentos.reduce(
      (acc, doc) => ({
        neto: acc.neto + doc.monto_neto,
        iva: acc.iva + doc.monto_iva,
        total: acc.total + doc.monto_total,
        cantidad: acc.cantidad + 1,
      }),
      { neto: 0, iva: 0, total: 0, cantidad: 0 }
    )

    return { success: true, data: { documentos, totales } }
  } catch (error) {
    console.error('[parseLibroCompras] Error:', error)
    return { success: false, error: 'Error al parsear libro de compras' }
  }
}

// ============================================================================
// LIBRO VENTAS PARSER
// ============================================================================

export function parseLibroVentas(
  raw: LibroComprasRaw,
  clienteId: string,
  periodo: string
): {
  success: boolean
  data?: {
    documentos: DocumentoLibro[]
    totales: {
      neto: number
      iva: number
      total: number
      cantidad: number
    }
  }
  error?: string
} {
  // La estructura es similar al libro de compras
  // Reutilizamos la lógica pero ajustando nombres de campos si es necesario
  return parseLibroCompras(raw, clienteId, periodo)
}

// ============================================================================
// F29 RESPONSE PARSER
// ============================================================================

export interface F29ResponseRaw {
  html?: string
  json?: Record<string, unknown>
  folio?: string
  comprobante_url?: string
}

export function parseF29Response(raw: F29ResponseRaw): {
  success: boolean
  data?: {
    folio: string
    fecha_presentacion: string
    numero_comprobante?: string
    total_declarado: number
    total_a_pagar: number
    remanente?: number
    observaciones?: string
  }
  error?: string
} {
  try {
    // Si viene como JSON estructurado
    if (raw.json) {
      const j = raw.json
      return {
        success: true,
        data: {
          folio: String(j.folio || raw.folio || ''),
          fecha_presentacion: String(j.fecha_presentacion || new Date().toISOString()),
          numero_comprobante: j.numero_comprobante as string | undefined,
          total_declarado: parseNumber(j.total_declarado),
          total_a_pagar: parseNumber(j.total_a_pagar),
          remanente: j.remanente ? parseNumber(j.remanente) : undefined,
          observaciones: j.observaciones as string | undefined,
        },
      }
    }

    // Parsear desde HTML
    if (raw.html) {
      const html = raw.html

      // Buscar folio
      const folioMatch = html.match(/[Ff]olio[:\s]*(\d+)/i)
      const folio = folioMatch ? folioMatch[1] : raw.folio || ''

      // Buscar fecha de presentación
      const fechaMatch = html.match(/[Ff]echa[:\s]*(\d{2}[/-]\d{2}[/-]\d{4})/i)
      const fecha = fechaMatch ? fechaMatch[1] : new Date().toISOString().split('T')[0]

      // Buscar total a pagar
      const totalMatch = html.match(/[Tt]otal\s+a\s+[Pp]agar[:\s]*\$?\s*([\d.,]+)/i)
      const total = totalMatch ? parseNumber(totalMatch[1]) : 0

      // Verificar si hubo error
      if (html.includes('error') || html.includes('rechazad')) {
        const errorMatch = html.match(/error[:\s]*([^<]+)/i)
        return {
          success: false,
          error: errorMatch ? errorMatch[1].trim() : 'Error en envío de F29',
        }
      }

      return {
        success: true,
        data: {
          folio,
          fecha_presentacion: fecha,
          total_declarado: total,
          total_a_pagar: total,
        },
      }
    }

    // Si solo tenemos folio
    if (raw.folio) {
      return {
        success: true,
        data: {
          folio: raw.folio,
          fecha_presentacion: new Date().toISOString(),
          total_declarado: 0,
          total_a_pagar: 0,
        },
      }
    }

    return { success: false, error: 'No hay datos de respuesta F29' }
  } catch (error) {
    console.error('[parseF29Response] Error:', error)
    return { success: false, error: 'Error al parsear respuesta F29' }
  }
}

// ============================================================================
// CERTIFICADO PARSER
// ============================================================================

export interface CertificadoResponseRaw {
  pdf_url?: string
  pdf_base64?: string
  json?: Record<string, unknown>
}

export function parseCertificadoResponse(
  raw: CertificadoResponseRaw,
  tipoCertificado: string
): {
  success: boolean
  data?: {
    url?: string
    base64?: string
    fecha_generacion: string
    tipo: string
    vigente_hasta?: string
  }
  error?: string
} {
  try {
    if (!raw.pdf_url && !raw.pdf_base64) {
      return { success: false, error: 'No se generó el certificado' }
    }

    return {
      success: true,
      data: {
        url: raw.pdf_url,
        base64: raw.pdf_base64,
        fecha_generacion: new Date().toISOString(),
        tipo: tipoCertificado,
        vigente_hasta: raw.json?.vigente_hasta as string | undefined,
      },
    }
  } catch (error) {
    console.error('[parseCertificadoResponse] Error:', error)
    return { success: false, error: 'Error al parsear certificado' }
  }
}

// ============================================================================
// ERROR EXTRACTION
// ============================================================================

export function extractErrorFromPage(
  html: string,
  context?: string
): { code: string; message: string } {
  // Errores de autenticación
  if (/RUT.*incorrecto|clave.*incorrecta|usuario.*no.*existe/i.test(html)) {
    return { code: 'AUTH_INVALID', message: SII_ERRORS.AUTH.INVALID_CREDENTIALS }
  }

  if (/cuenta.*bloqueada|demasiados.*intentos/i.test(html)) {
    return { code: 'AUTH_LOCKED', message: SII_ERRORS.AUTH.ACCOUNT_LOCKED }
  }

  if (/sesi[óo]n.*expirada|vuelva.*ingresar/i.test(html)) {
    return { code: 'SESSION_EXPIRED', message: SII_ERRORS.AUTH.SESSION_EXPIRED }
  }

  if (/captcha|verificaci[óo]n.*humana/i.test(html)) {
    return { code: 'CAPTCHA_REQUIRED', message: SII_ERRORS.AUTH.CAPTCHA_REQUIRED }
  }

  // Errores F29
  if (/per[íi]odo.*no.*disponible/i.test(html)) {
    return { code: 'PERIOD_NOT_AVAILABLE', message: SII_ERRORS.F29.PERIOD_NOT_AVAILABLE }
  }

  if (/ya.*existe.*declaraci[óo]n/i.test(html)) {
    return { code: 'ALREADY_SUBMITTED', message: SII_ERRORS.F29.ALREADY_SUBMITTED }
  }

  if (/error.*validaci[óo]n/i.test(html)) {
    return { code: 'VALIDATION_ERROR', message: SII_ERRORS.F29.VALIDATION_ERROR }
  }

  // Errores de sistema
  if (/mantenimiento|temporalmente.*no.*disponible/i.test(html)) {
    return { code: 'MAINTENANCE', message: SII_ERRORS.SYSTEM.MAINTENANCE }
  }

  if (/servicio.*no.*disponible|error.*sistema/i.test(html)) {
    return { code: 'UNAVAILABLE', message: SII_ERRORS.SYSTEM.UNAVAILABLE }
  }

  // Error genérico
  const errorMatch = html.match(/error[:\s]*([^<\n]{10,100})/i)
  if (errorMatch) {
    return { code: 'UNKNOWN_ERROR', message: errorMatch[1].trim() }
  }

  return { code: 'UNKNOWN', message: SII_ERRORS.SYSTEM.UNKNOWN }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getColumnValue(
  values: string[],
  headers: string[],
  possibleNames: string[]
): string | undefined {
  for (const name of possibleNames) {
    const index = headers.indexOf(name.toLowerCase())
    if (index !== -1 && values[index]) {
      return values[index].trim()
    }
  }
  return undefined
}

function parseNumber(value: unknown): number {
  if (typeof value === 'number') return value
  if (!value) return 0

  const str = String(value)
    .replace(/[$.]/g, '')
    .replace(',', '.')
    .trim()

  const num = parseFloat(str)
  return isNaN(num) ? 0 : num
}

// ============================================================================
// EXPORTS ADICIONALES
// ============================================================================

export { DocumentoLibro }
