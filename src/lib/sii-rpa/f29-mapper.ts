// F29 Mapper
// HV Consultores - Mapeo de códigos F29 a selectores del formulario SII

import { F29_CODIGOS, SII_SELECTORS } from './constants'

// ============================================================================
// TIPOS
// ============================================================================

export interface F29CodigoMapping {
  codigo: number
  nombre: string
  seccion: 'debitos' | 'creditos' | 'impuesto' | 'ppm' | 'retenciones' | 'total'
  selector: string
  readonly: boolean // Campos calculados automáticamente por SII
  required: boolean
}

export interface F29FormData {
  periodo: string // YYYYMM
  codigos: Record<number, number>
  tipo_declaracion: 'original' | 'rectificatoria'
  numero_rectificatoria?: number
}

export interface F29SubmissionResult {
  success: boolean
  folio?: string
  fecha_presentacion?: string
  numero_comprobante?: string
  total_declarado?: number
  total_a_pagar?: number
  remanente?: number
  error?: string
}

// ============================================================================
// MAPEO DE CÓDIGOS F29 A SELECTORES
// ============================================================================

export const F29_CODIGO_MAPPING: Record<number, F29CodigoMapping> = {
  // DÉBITOS FISCALES
  20: {
    codigo: 20,
    nombre: 'Ventas y/o servicios exentos',
    seccion: 'debitos',
    selector: SII_SELECTORS.F29.CODIGO_20,
    readonly: false,
    required: false,
  },
  89: {
    codigo: 89,
    nombre: 'IVA Débito Fiscal (ventas)',
    seccion: 'debitos',
    selector: SII_SELECTORS.F29.CODIGO_89,
    readonly: false,
    required: true,
  },
  47: {
    codigo: 47,
    nombre: 'IVA ventas bienes inmuebles',
    seccion: 'debitos',
    selector: 'input[name="codigo47"], #cod47, input[data-codigo="47"]',
    readonly: false,
    required: false,
  },

  // CRÉDITOS FISCALES
  520: {
    codigo: 520,
    nombre: 'IVA importaciones',
    seccion: 'creditos',
    selector: SII_SELECTORS.F29.CODIGO_520,
    readonly: false,
    required: false,
  },
  538: {
    codigo: 538,
    nombre: 'IVA Crédito Fiscal (compras)',
    seccion: 'creditos',
    selector: SII_SELECTORS.F29.CODIGO_538,
    readonly: false,
    required: true,
  },
  519: {
    codigo: 519,
    nombre: 'IVA activo fijo',
    seccion: 'creditos',
    selector: 'input[name="codigo519"], #cod519, input[data-codigo="519"]',
    readonly: false,
    required: false,
  },
  563: {
    codigo: 563,
    nombre: 'IVA compras supermercado',
    seccion: 'creditos',
    selector: SII_SELECTORS.F29.CODIGO_563,
    readonly: false,
    required: false,
  },
  502: {
    codigo: 502,
    nombre: 'IVA crédito sin derecho a devolución',
    seccion: 'creditos',
    selector: 'input[name="codigo502"], #cod502, input[data-codigo="502"]',
    readonly: false,
    required: false,
  },

  // IMPUESTO DETERMINADO
  91: {
    codigo: 91,
    nombre: 'IVA Determinado',
    seccion: 'impuesto',
    selector: SII_SELECTORS.F29.CODIGO_91,
    readonly: true, // Calculado automáticamente
    required: false,
  },
  92: {
    codigo: 92,
    nombre: 'Remanente de crédito mes anterior',
    seccion: 'impuesto',
    selector: 'input[name="codigo92"], #cod92, input[data-codigo="92"]',
    readonly: false,
    required: false,
  },
  93: {
    codigo: 93,
    nombre: 'Devolución solicitada por exportador',
    seccion: 'impuesto',
    selector: 'input[name="codigo93"], #cod93, input[data-codigo="93"]',
    readonly: false,
    required: false,
  },

  // PPM (Pagos Provisionales Mensuales)
  30: {
    codigo: 30,
    nombre: 'PPM neto determinado',
    seccion: 'ppm',
    selector: SII_SELECTORS.F29.CODIGO_30,
    readonly: false,
    required: false,
  },
  48: {
    codigo: 48,
    nombre: 'Tasa PPM (%)',
    seccion: 'ppm',
    selector: SII_SELECTORS.F29.CODIGO_48,
    readonly: false,
    required: false,
  },
  50: {
    codigo: 50,
    nombre: 'Diferencia PPM determinado',
    seccion: 'ppm',
    selector: 'input[name="codigo50"], #cod50, input[data-codigo="50"]',
    readonly: false,
    required: false,
  },

  // RETENCIONES
  151: {
    codigo: 151,
    nombre: 'Retención sobre honorarios',
    seccion: 'retenciones',
    selector: SII_SELECTORS.F29.CODIGO_151,
    readonly: false,
    required: false,
  },
  153: {
    codigo: 153,
    nombre: 'Retención sobre servicios de terceros',
    seccion: 'retenciones',
    selector: SII_SELECTORS.F29.CODIGO_153,
    readonly: false,
    required: false,
  },

  // RESULTADOS / TOTALES
  304: {
    codigo: 304,
    nombre: 'Total a pagar',
    seccion: 'total',
    selector: SII_SELECTORS.F29.CODIGO_304,
    readonly: true, // Calculado automáticamente
    required: false,
  },
  60: {
    codigo: 60,
    nombre: 'Remanente para período siguiente',
    seccion: 'total',
    selector: SII_SELECTORS.F29.CODIGO_60,
    readonly: true, // Calculado automáticamente
    required: false,
  },
  85: {
    codigo: 85,
    nombre: 'PPM a devolver por Art. 12 ter',
    seccion: 'total',
    selector: 'input[name="codigo85"], #cod85, input[data-codigo="85"]',
    readonly: true,
    required: false,
  },
  595: {
    codigo: 595,
    nombre: 'Crédito especial empresas constructoras',
    seccion: 'creditos',
    selector: SII_SELECTORS.F29.CODIGO_595,
    readonly: false,
    required: false,
  },
}

// ============================================================================
// FUNCIONES DE MAPEO
// ============================================================================

/**
 * Obtiene el mapeo para un código específico
 */
export function getCodigoMapping(codigo: number): F29CodigoMapping | undefined {
  return F29_CODIGO_MAPPING[codigo]
}

/**
 * Obtiene todos los códigos de una sección específica
 */
export function getCodigosBySeccion(seccion: F29CodigoMapping['seccion']): F29CodigoMapping[] {
  return Object.values(F29_CODIGO_MAPPING).filter(m => m.seccion === seccion)
}

/**
 * Filtra los códigos que son editables (no readonly)
 */
export function getEditableCodigos(): F29CodigoMapping[] {
  return Object.values(F29_CODIGO_MAPPING).filter(m => !m.readonly)
}

/**
 * Filtra los códigos requeridos
 */
export function getRequiredCodigos(): F29CodigoMapping[] {
  return Object.values(F29_CODIGO_MAPPING).filter(m => m.required)
}

/**
 * Convierte los códigos del cálculo F29 al formato para el formulario SII
 * @param codigosF29 - Objeto con códigos y sus valores
 * @returns Array de {selector, valor} para llenar en el formulario
 */
export function mapCodigosToFormFields(
  codigosF29: Record<number, number>
): Array<{ codigo: number; selector: string; valor: number; readonly: boolean }> {
  const fields: Array<{ codigo: number; selector: string; valor: number; readonly: boolean }> = []

  for (const [codigoStr, valor] of Object.entries(codigosF29)) {
    const codigo = parseInt(codigoStr, 10)
    const mapping = F29_CODIGO_MAPPING[codigo]

    if (mapping && valor !== 0) {
      fields.push({
        codigo,
        selector: mapping.selector,
        valor,
        readonly: mapping.readonly,
      })
    }
  }

  // Ordenar por sección: débitos > créditos > ppm > retenciones > totales
  const seccionOrder: Record<string, number> = {
    debitos: 1,
    creditos: 2,
    impuesto: 3,
    ppm: 4,
    retenciones: 5,
    total: 6,
  }

  return fields.sort((a, b) => {
    const mappingA = F29_CODIGO_MAPPING[a.codigo]
    const mappingB = F29_CODIGO_MAPPING[b.codigo]
    return seccionOrder[mappingA.seccion] - seccionOrder[mappingB.seccion]
  })
}

/**
 * Valida que los códigos requeridos estén presentes
 */
export function validateRequiredCodigos(
  codigosF29: Record<number, number>
): { valid: boolean; missingCodigos: number[] } {
  const requiredCodigos = getRequiredCodigos()
  const missingCodigos: number[] = []

  for (const mapping of requiredCodigos) {
    const valor = codigosF29[mapping.codigo]
    if (valor === undefined || valor === null) {
      missingCodigos.push(mapping.codigo)
    }
  }

  return {
    valid: missingCodigos.length === 0,
    missingCodigos,
  }
}

/**
 * Calcula el IVA determinado basado en débitos y créditos
 */
export function calcularIVADeterminado(codigosF29: Record<number, number>): number {
  const debitoFiscal = codigosF29[89] || 0
  const creditoFiscal = codigosF29[538] || 0
  return debitoFiscal - creditoFiscal
}

/**
 * Calcula el total a pagar
 */
export function calcularTotalAPagar(codigosF29: Record<number, number>): number {
  const ivaDeterminado = calcularIVADeterminado(codigosF29)
  const ppm = codigosF29[30] || 0
  const retenciones = (codigosF29[151] || 0) + (codigosF29[153] || 0)
  const remanente = codigosF29[92] || 0

  // Total = MAX(0, IVA - Remanente) + PPM + Retenciones
  return Math.max(0, ivaDeterminado - remanente) + ppm + retenciones
}

/**
 * Calcula el remanente para el período siguiente
 */
export function calcularRemanente(codigosF29: Record<number, number>): number {
  const ivaDeterminado = calcularIVADeterminado(codigosF29)
  const remanente = codigosF29[92] || 0

  // Si el crédito es mayor que el débito + remanente usado, queda remanente
  if (ivaDeterminado < 0) {
    return Math.abs(ivaDeterminado)
  }

  // Si hay remanente y cubre el IVA, el exceso pasa al siguiente período
  if (remanente > ivaDeterminado && ivaDeterminado > 0) {
    return remanente - ivaDeterminado
  }

  return 0
}

/**
 * Genera un resumen de los códigos para logging
 */
export function generateCodigosResumen(codigosF29: Record<number, number>): string {
  const lines: string[] = ['=== RESUMEN F29 ===']

  const secciones: Record<string, string[]> = {
    debitos: [],
    creditos: [],
    impuesto: [],
    ppm: [],
    retenciones: [],
    total: [],
  }

  for (const [codigoStr, valor] of Object.entries(codigosF29)) {
    const codigo = parseInt(codigoStr, 10)
    const mapping = F29_CODIGO_MAPPING[codigo]

    if (mapping) {
      secciones[mapping.seccion].push(
        `  Código ${codigo} (${mapping.nombre}): $${valor.toLocaleString('es-CL')}`
      )
    }
  }

  for (const [seccion, items] of Object.entries(secciones)) {
    if (items.length > 0) {
      lines.push(`\n[${seccion.toUpperCase()}]`)
      lines.push(...items)
    }
  }

  lines.push('\n=== CÁLCULOS ===')
  lines.push(`IVA Determinado (89-538): $${calcularIVADeterminado(codigosF29).toLocaleString('es-CL')}`)
  lines.push(`Total a Pagar: $${calcularTotalAPagar(codigosF29).toLocaleString('es-CL')}`)
  lines.push(`Remanente siguiente: $${calcularRemanente(codigosF29).toLocaleString('es-CL')}`)

  return lines.join('\n')
}

/**
 * Extrae el período en formato separado (año y mes)
 */
export function parsePeriodo(periodo: string): { año: number; mes: number } | null {
  if (!/^\d{6}$/.test(periodo)) return null

  return {
    año: parseInt(periodo.slice(0, 4), 10),
    mes: parseInt(periodo.slice(4, 6), 10),
  }
}

/**
 * Formatea el período para mostrar
 */
export function formatPeriodoDisplay(periodo: string): string {
  const parsed = parsePeriodo(periodo)
  if (!parsed) return periodo

  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ]

  return `${meses[parsed.mes - 1]} ${parsed.año}`
}

// ============================================================================
// CÓDIGOS ADICIONALES F29 (Referencia)
// ============================================================================

export const F29_CODIGOS_ADICIONALES = {
  // Ventas afectas
  VENTAS_NETAS: 20,
  VENTAS_IVA: 89,

  // Compras con crédito
  COMPRAS_IVA_CREDITO: 538,
  IMPORTACIONES_IVA: 520,
  ACTIVO_FIJO_IVA: 519,
  SUPERMERCADO_IVA: 563,

  // IVA determinado
  IVA_DETERMINADO: 91,
  REMANENTE_ANTERIOR: 92,

  // PPM
  PPM_NETO: 30,
  PPM_TASA: 48,
  PPM_BASE: 563, // Ventas netas para cálculo PPM

  // Retenciones
  RETENCION_HONORARIOS: 151,
  RETENCION_TERCEROS: 153,

  // Totales
  TOTAL_A_PAGAR: 304,
  REMANENTE_SIGUIENTE: 60,

  // Especiales
  CREDITO_CONSTRUCTORAS: 595,
  DEVOLUCION_EXPORTADORES: 93,
} as const
