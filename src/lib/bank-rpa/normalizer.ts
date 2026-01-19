// =============================================================================
// HV Consultores - Transaction Normalizer
// Normaliza y limpia descripciones de transacciones bancarias
// =============================================================================

import type { RawTransaction, BankTransaction, BankCode, TransactionType } from './types'
import { TRANSACTION_PATTERNS } from './constants'
import crypto from 'crypto'

// ============================================================================
// NORMALIZATION RULES
// ============================================================================

interface NormalizationRule {
  pattern: RegExp
  replacement: string
}

// Common abbreviations to expand
const ABBREVIATION_EXPANSIONS: Record<string, string> = {
  'TEF': 'TRANSFERENCIA ELECTRONICA',
  'TRANSF': 'TRANSFERENCIA',
  'PAC': 'PAGO AUTOMATICO CUENTA',
  'PAT': 'PAGO AUTOMATICO TARJETA',
  'CHQ': 'CHEQUE',
  'COM': 'COMISION',
  'INT': 'INTERES',
  'IMP': 'IMPUESTO',
  'REM': 'REMUNERACION',
  'DIV': 'DIVIDENDO',
  'DEP': 'DEPOSITO',
  'RET': 'RETIRO',
  'GTO': 'GASTO',
  'ABN': 'ABONO',
  'CRG': 'CARGO',
  'SRV': 'SERVICIO',
  'MANT': 'MANTENCION',
  'SEG': 'SEGURO',
  'CTA': 'CUENTA',
  'NRO': 'NUMERO',
  'N°': 'NUMERO',
  'REF': 'REFERENCIA',
}

// Patterns to clean from descriptions
const CLEANUP_PATTERNS: NormalizationRule[] = [
  // Remove multiple spaces
  { pattern: /\s+/g, replacement: ' ' },
  // Remove leading/trailing punctuation
  { pattern: /^[.,;:\-_]+|[.,;:\-_]+$/g, replacement: '' },
  // Remove document numbers that are just noise
  { pattern: /\bDOC\s*\d+\b/gi, replacement: '' },
  // Normalize dates in description
  { pattern: /(\d{2})\/(\d{2})\/(\d{2,4})/g, replacement: '$1-$2-$3' },
  // Remove excess asterisks
  { pattern: /\*+/g, replacement: '' },
  // Remove parentheses with just numbers
  { pattern: /\(\d+\)/g, replacement: '' },
]

// ============================================================================
// NORMALIZER CLASS
// ============================================================================

export class TransactionNormalizer {
  private banco: BankCode

  constructor(banco: BankCode) {
    this.banco = banco
  }

  /**
   * Normaliza una transacción cruda en una transacción estructurada
   */
  normalize(
    raw: RawTransaction,
    cuentaId: string,
    archivoId?: string
  ): Omit<BankTransaction, 'id' | 'created_at'> {
    // Normalizar descripción
    const descripcionNormalizada = this.normalizeDescription(raw.descripcion)

    // Determinar tipo de transacción
    const tipo = this.determineTransactionType(raw)

    // Calcular monto (siempre positivo)
    const monto = this.calculateAmount(raw, tipo)

    // Generar hash único para la transacción
    const hashTransaccion = this.generateHash(cuentaId, raw.fecha, raw.descripcion, monto, tipo)

    return {
      cuenta_id: cuentaId,
      cartola_archivo_id: archivoId,
      fecha: raw.fecha,
      fecha_valor: raw.fecha_valor,
      descripcion: raw.descripcion.trim(),
      descripcion_normalizada: descripcionNormalizada,
      referencia: raw.referencia,
      monto,
      tipo,
      saldo: raw.saldo,
      // Campos de parametrización (se llenan después)
      categoria_id: undefined,
      categoria_confianza: undefined,
      categorizado_manual: false,
      cuenta_contable: undefined,
      centro_costo: undefined,
      // Conciliación SII
      conciliado_sii: false,
      documento_sii_id: undefined,
      estado_conciliacion: 'pending',
      // Metadata
      hash_transaccion: hashTransaccion,
      metadata: {
        banco: this.banco,
        linea_original: raw.linea_original,
      },
    }
  }

  /**
   * Normaliza múltiples transacciones
   */
  normalizeMany(
    rawTransactions: RawTransaction[],
    cuentaId: string,
    archivoId?: string
  ): Omit<BankTransaction, 'id' | 'created_at'>[] {
    return rawTransactions.map((raw) => this.normalize(raw, cuentaId, archivoId))
  }

  /**
   * Normaliza la descripción de una transacción
   */
  normalizeDescription(description: string): string {
    let normalized = description.toUpperCase().trim()

    // Aplicar reglas de limpieza
    for (const rule of CLEANUP_PATTERNS) {
      normalized = normalized.replace(rule.pattern, rule.replacement)
    }

    // Expandir abreviaciones
    for (const [abbr, expansion] of Object.entries(ABBREVIATION_EXPANSIONS)) {
      const pattern = new RegExp(`\\b${abbr}\\b`, 'g')
      normalized = normalized.replace(pattern, expansion)
    }

    // Limpiar espacios extra finales
    normalized = normalized.replace(/\s+/g, ' ').trim()

    return normalized
  }

  /**
   * Determina el tipo de transacción (cargo/abono)
   */
  private determineTransactionType(raw: RawTransaction): TransactionType {
    // Si tiene campos separados, es directo
    if (raw.cargo !== undefined && raw.cargo > 0) return 'cargo'
    if (raw.abono !== undefined && raw.abono > 0) return 'abono'

    // Si solo tiene cargo pero es negativo, es abono
    if (raw.cargo !== undefined && raw.cargo < 0) return 'abono'

    // Analizar descripción para pistas
    const desc = raw.descripcion.toUpperCase()

    // Patrones que indican cargo (salida de dinero)
    const cargoPatterns = [
      /CARGO/i,
      /PAGO\s+A/i,
      /TRANSFERENCIA\s+A/i,
      /GIRO/i,
      /RETIRO/i,
      /CHEQUE/i,
      /COMISION/i,
      /MANTENCION/i,
    ]

    // Patrones que indican abono (entrada de dinero)
    const abonoPatterns = [
      /ABONO/i,
      /DEPOSITO/i,
      /TRANSFERENCIA\s+DE/i,
      /RECIBIDO/i,
      /INGRESO/i,
    ]

    for (const pattern of cargoPatterns) {
      if (pattern.test(desc)) return 'cargo'
    }

    for (const pattern of abonoPatterns) {
      if (pattern.test(desc)) return 'abono'
    }

    // Default: asumir cargo si hay monto
    return 'cargo'
  }

  /**
   * Calcula el monto absoluto de la transacción
   */
  private calculateAmount(raw: RawTransaction, tipo: TransactionType): number {
    if (tipo === 'cargo' && raw.cargo !== undefined) {
      return Math.abs(raw.cargo)
    }

    if (tipo === 'abono' && raw.abono !== undefined) {
      return Math.abs(raw.abono)
    }

    // Si solo hay un monto, usar ese
    if (raw.cargo !== undefined) return Math.abs(raw.cargo)
    if (raw.abono !== undefined) return Math.abs(raw.abono)

    return 0
  }

  /**
   * Genera un hash único para detectar duplicados
   */
  private generateHash(
    cuentaId: string,
    fecha: string,
    descripcion: string,
    monto: number,
    tipo: TransactionType
  ): string {
    const data = `${cuentaId}|${fecha}|${descripcion}|${monto}|${tipo}`
    return crypto.createHash('sha256').update(data).digest('hex')
  }

  /**
   * Extrae información adicional de la descripción
   */
  extractMetadata(description: string): {
    rut?: string
    documentNumber?: string
    date?: string
    transactionType?: string
  } {
    const metadata: ReturnType<typeof this.extractMetadata> = {}

    // Extraer RUT
    const rutMatch = description.match(TRANSACTION_PATTERNS.RUT)
    if (rutMatch) {
      metadata.rut = rutMatch[1]
    }

    // Extraer número de documento
    const docMatch = description.match(TRANSACTION_PATTERNS.DOC_NUMBER)
    if (docMatch) {
      metadata.documentNumber = docMatch[1]
    }

    // Extraer fecha si está en la descripción
    const dateMatch = description.match(TRANSACTION_PATTERNS.DATE_DMY)
    if (dateMatch) {
      metadata.date = dateMatch[1]
    }

    // Detectar tipo de transacción
    if (TRANSACTION_PATTERNS.TRANSFER_OUT.test(description)) {
      metadata.transactionType = 'transfer_out'
    } else if (TRANSACTION_PATTERNS.TRANSFER_IN.test(description)) {
      metadata.transactionType = 'transfer_in'
    } else if (TRANSACTION_PATTERNS.PAC.test(description)) {
      metadata.transactionType = 'pac'
    } else if (TRANSACTION_PATTERNS.PAT.test(description)) {
      metadata.transactionType = 'pat'
    } else if (TRANSACTION_PATTERNS.CHEQUE.test(description)) {
      metadata.transactionType = 'cheque'
    } else if (TRANSACTION_PATTERNS.COMISION.test(description)) {
      metadata.transactionType = 'comision'
    } else if (TRANSACTION_PATTERNS.SUELDO.test(description)) {
      metadata.transactionType = 'sueldo'
    } else if (TRANSACTION_PATTERNS.IMPUESTO.test(description)) {
      metadata.transactionType = 'impuesto'
    }

    return metadata
  }
}

// ============================================================================
// FACTORY AND UTILITY FUNCTIONS
// ============================================================================

export function createNormalizer(banco: BankCode): TransactionNormalizer {
  return new TransactionNormalizer(banco)
}

export function normalizeTransactions(
  rawTransactions: RawTransaction[],
  banco: BankCode,
  cuentaId: string,
  archivoId?: string
): Omit<BankTransaction, 'id' | 'created_at'>[] {
  const normalizer = createNormalizer(banco)
  return normalizer.normalizeMany(rawTransactions, cuentaId, archivoId)
}

export function normalizeDescription(description: string, banco: BankCode): string {
  const normalizer = createNormalizer(banco)
  return normalizer.normalizeDescription(description)
}

// ============================================================================
// DUPLICATE DETECTION
// ============================================================================

export function detectDuplicates(
  newTransactions: Omit<BankTransaction, 'id' | 'created_at'>[],
  existingHashes: Set<string>
): {
  unique: Omit<BankTransaction, 'id' | 'created_at'>[]
  duplicates: Omit<BankTransaction, 'id' | 'created_at'>[]
} {
  const unique: Omit<BankTransaction, 'id' | 'created_at'>[] = []
  const duplicates: Omit<BankTransaction, 'id' | 'created_at'>[] = []

  for (const tx of newTransactions) {
    if (existingHashes.has(tx.hash_transaccion)) {
      duplicates.push(tx)
    } else {
      unique.push(tx)
      existingHashes.add(tx.hash_transaccion)
    }
  }

  return { unique, duplicates }
}
