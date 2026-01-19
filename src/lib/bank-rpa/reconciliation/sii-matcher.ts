// =============================================================================
// HV Consultores - SII Reconciliation Matcher
// Conciliación entre transacciones bancarias y documentos SII
// =============================================================================

import type {
  BankTransaction,
  SIIReconciliation,
  ReconciliationStatus,
  ReconciliationSummary,
} from '../types'

// ============================================================================
// TYPES
// ============================================================================

export interface SIIDocument {
  id: string
  tipo: string // 'factura', 'boleta', 'nc', 'nd'
  folio: string
  fecha: string
  rut_emisor: string
  razon_social_emisor: string
  rut_receptor: string
  razon_social_receptor: string
  monto_neto: number
  iva: number
  monto_total: number
  estado?: string
}

export interface MatchResult {
  transaccion_id: string
  documento_id: string | null
  estado: ReconciliationStatus
  confianza: number
  diferencia_monto: number
  diferencia_dias: number
  match_reasons: string[]
}

export interface MatcherOptions {
  toleranciaDias?: number // Días de diferencia permitidos (default: 5)
  toleranciaMonto?: number // Porcentaje de diferencia permitido (default: 0.01 = 1%)
  minConfidenceForMatch?: number // Confianza mínima para match automático (default: 0.7)
}

// ============================================================================
// SII MATCHER CLASS
// ============================================================================

export class SIIMatcher {
  private options: MatcherOptions
  private documents: SIIDocument[] = []

  constructor(options: MatcherOptions = {}) {
    this.options = {
      toleranciaDias: options.toleranciaDias ?? 5,
      toleranciaMonto: options.toleranciaMonto ?? 0.01,
      minConfidenceForMatch: options.minConfidenceForMatch ?? 0.7,
    }
  }

  /**
   * Carga los documentos SII para matching
   */
  loadDocuments(documents: SIIDocument[]): void {
    this.documents = documents
  }

  /**
   * Intenta encontrar un documento SII que coincida con la transacción
   */
  matchTransaction(transaction: BankTransaction): MatchResult {
    const descripcion = transaction.descripcion_normalizada || transaction.descripcion
    const monto = transaction.monto
    const fecha = new Date(transaction.fecha)

    let bestMatch: {
      document: SIIDocument | null
      score: number
      reasons: string[]
      diferenciaMonto: number
      diferenciaDias: number
    } = {
      document: null,
      score: 0,
      reasons: [],
      diferenciaMonto: 0,
      diferenciaDias: 0,
    }

    for (const doc of this.documents) {
      const matchInfo = this.calculateMatch(transaction, doc, descripcion, monto, fecha)

      if (matchInfo.score > bestMatch.score) {
        bestMatch = {
          document: doc,
          score: matchInfo.score,
          reasons: matchInfo.reasons,
          diferenciaMonto: matchInfo.diferenciaMonto,
          diferenciaDias: matchInfo.diferenciaDias,
        }
      }
    }

    // Determinar estado basado en confianza
    let estado: ReconciliationStatus = 'pending'
    if (bestMatch.score >= (this.options.minConfidenceForMatch || 0.7)) {
      estado = 'matched'
    } else if (bestMatch.score >= 0.5) {
      estado = 'partial'
    } else if (bestMatch.document === null) {
      estado = 'unmatched'
    }

    return {
      transaccion_id: transaction.id,
      documento_id: bestMatch.document?.id || null,
      estado,
      confianza: bestMatch.score,
      diferencia_monto: bestMatch.diferenciaMonto,
      diferencia_dias: bestMatch.diferenciaDias,
      match_reasons: bestMatch.reasons,
    }
  }

  /**
   * Concilia múltiples transacciones
   */
  matchTransactions(transactions: BankTransaction[]): MatchResult[] {
    const results: MatchResult[] = []
    const usedDocuments = new Set<string>()

    // Ordenar por monto descendente (transacciones grandes primero)
    const sortedTx = [...transactions].sort((a, b) => b.monto - a.monto)

    for (const tx of sortedTx) {
      const result = this.matchTransaction(tx)

      // Si encontró un match, marcar el documento como usado
      if (result.documento_id && result.estado === 'matched') {
        if (usedDocuments.has(result.documento_id)) {
          // El documento ya fue usado, buscar otro o marcar como partial
          result.estado = 'partial'
          result.match_reasons.push('Documento ya asignado a otra transacción')
        } else {
          usedDocuments.add(result.documento_id)
        }
      }

      results.push(result)
    }

    return results
  }

  /**
   * Calcula el score de match entre transacción y documento
   */
  private calculateMatch(
    transaction: BankTransaction,
    document: SIIDocument,
    descripcion: string,
    montoTx: number,
    fechaTx: Date
  ): {
    score: number
    reasons: string[]
    diferenciaMonto: number
    diferenciaDias: number
  } {
    let score = 0
    const reasons: string[] = []

    // 1. Match por monto (40% del score)
    const montosDoc = [document.monto_total, document.monto_neto, document.monto_neto + document.iva]
    let mejorDiferenciaMonto = Infinity

    for (const montoDoc of montosDoc) {
      const diff = Math.abs(montoTx - montoDoc)
      const diffPercent = montoDoc > 0 ? diff / montoDoc : 0

      if (diffPercent < mejorDiferenciaMonto) {
        mejorDiferenciaMonto = diffPercent
      }

      if (diff === 0) {
        score += 0.4
        reasons.push('Monto exacto')
        break
      } else if (diffPercent <= (this.options.toleranciaMonto || 0.01)) {
        score += 0.35
        reasons.push(`Monto similar (${(diffPercent * 100).toFixed(1)}% diff)`)
        break
      } else if (diffPercent <= 0.05) {
        score += 0.2
        reasons.push(`Monto cercano (${(diffPercent * 100).toFixed(1)}% diff)`)
        break
      }
    }

    // 2. Match por fecha (30% del score)
    const fechaDoc = new Date(document.fecha)
    const diffDias = Math.abs(Math.floor((fechaTx.getTime() - fechaDoc.getTime()) / (1000 * 60 * 60 * 24)))

    if (diffDias === 0) {
      score += 0.3
      reasons.push('Fecha exacta')
    } else if (diffDias <= 2) {
      score += 0.25
      reasons.push(`Fecha cercana (${diffDias} días)`)
    } else if (diffDias <= (this.options.toleranciaDias || 5)) {
      score += 0.15
      reasons.push(`Fecha dentro de tolerancia (${diffDias} días)`)
    }

    // 3. Match por RUT en descripción (20% del score)
    const rutMatch = this.extractRutFromDescription(descripcion)
    if (rutMatch) {
      const rutNormalized = this.normalizeRut(rutMatch)
      const rutEmisor = this.normalizeRut(document.rut_emisor)
      const rutReceptor = this.normalizeRut(document.rut_receptor)

      if (rutNormalized === rutEmisor || rutNormalized === rutReceptor) {
        score += 0.2
        reasons.push('RUT coincide')
      }
    }

    // 4. Match por folio/referencia (10% del score)
    if (transaction.referencia) {
      const refLower = transaction.referencia.toLowerCase()
      const folioLower = document.folio.toLowerCase()

      if (refLower.includes(folioLower) || folioLower.includes(refLower)) {
        score += 0.1
        reasons.push('Folio/Referencia coincide')
      }
    }

    // 5. Match por razón social (bonus)
    const nombreEmiso = document.razon_social_emisor.toUpperCase()
    const nombreReceptor = document.razon_social_receptor.toUpperCase()

    if (
      descripcion.includes(nombreEmiso.slice(0, 10)) ||
      descripcion.includes(nombreReceptor.slice(0, 10))
    ) {
      score += 0.05
      reasons.push('Nombre coincide parcialmente')
    }

    return {
      score: Math.min(score, 1.0),
      reasons,
      diferenciaMonto: mejorDiferenciaMonto * montoTx,
      diferenciaDias: diffDias,
    }
  }

  /**
   * Extrae RUT de la descripción
   */
  private extractRutFromDescription(descripcion: string): string | null {
    const rutPattern = /(\d{1,2}\.?\d{3}\.?\d{3}[-]?[0-9Kk])/
    const match = descripcion.match(rutPattern)
    return match ? match[1] : null
  }

  /**
   * Normaliza RUT removiendo puntos y guión
   */
  private normalizeRut(rut: string): string {
    return rut.replace(/\./g, '').replace(/-/g, '').toUpperCase()
  }

  /**
   * Genera resumen de conciliación
   */
  generateSummary(results: MatchResult[]): ReconciliationSummary {
    const summary: ReconciliationSummary = {
      total_transacciones: results.length,
      matched: 0,
      partial: 0,
      unmatched: 0,
      pending: 0,
      monto_conciliado: 0,
      monto_pendiente: 0,
    }

    // Note: We don't have access to actual amounts here,
    // this would need to be enhanced with transaction data
    for (const result of results) {
      switch (result.estado) {
        case 'matched':
          summary.matched++
          break
        case 'partial':
          summary.partial++
          break
        case 'unmatched':
          summary.unmatched++
          break
        case 'pending':
          summary.pending++
          break
      }
    }

    return summary
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

export function createSIIMatcher(options?: MatcherOptions): SIIMatcher {
  return new SIIMatcher(options)
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Filtra documentos SII por período
 */
export function filterDocumentsByPeriod(
  documents: SIIDocument[],
  mes: number,
  año: number
): SIIDocument[] {
  return documents.filter((doc) => {
    const fecha = new Date(doc.fecha)
    return fecha.getMonth() + 1 === mes && fecha.getFullYear() === año
  })
}

/**
 * Agrupa documentos por RUT
 */
export function groupDocumentsByRut(
  documents: SIIDocument[]
): Map<string, SIIDocument[]> {
  const groups = new Map<string, SIIDocument[]>()

  for (const doc of documents) {
    const rut = doc.rut_emisor
    if (!groups.has(rut)) {
      groups.set(rut, [])
    }
    groups.get(rut)!.push(doc)
  }

  return groups
}

/**
 * Crea un registro de conciliación desde un resultado de match
 */
export function createReconciliationRecord(
  result: MatchResult,
  document: SIIDocument | null
): Omit<SIIReconciliation, 'id' | 'created_at' | 'updated_at'> {
  return {
    transaccion_id: result.transaccion_id,
    documento_sii_id: result.documento_id || undefined,
    tipo_documento: document?.tipo,
    folio_documento: document?.folio,
    rut_contraparte: document?.rut_emisor,
    nombre_contraparte: document?.razon_social_emisor,
    monto_documento: document?.monto_total,
    fecha_documento: document?.fecha,
    estado: result.estado,
    confianza_match: result.confianza,
    diferencia_monto: result.diferencia_monto,
    diferencia_dias: result.diferencia_dias,
    match_manual: false,
    notas: result.match_reasons.join('; '),
  }
}
