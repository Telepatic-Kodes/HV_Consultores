// =============================================================================
// HV Consultores - Matching Service
// Wraps SIIMatcher with Convex integration, pattern learning, and configurable weights
// =============================================================================

import {
  SIIMatcher,
  createSIIMatcher,
  type SIIDocument,
  type MatchResult,
  type MatcherOptions,
} from '../bank-rpa/reconciliation/sii-matcher'
import type { BankTransaction, ReconciliationSummary } from '../bank-rpa/types'

// =============================================================================
// TYPES
// =============================================================================

export interface MatchingWeights {
  monto: number   // default 0.4
  fecha: number   // default 0.3
  rut: number     // default 0.2
  folio: number   // default 0.1
}

export interface LearnedPattern {
  descripcion_patron: string
  rut_contraparte?: string
  cuenta_contable_id?: string
  categoria?: string
  documento_tipo?: string
  score_boost: number
  veces_aplicado: number
}

export interface MatchingServiceConfig {
  weights?: Partial<MatchingWeights>
  matcherOptions?: MatcherOptions
  patterns?: LearnedPattern[]
}

export interface EnrichedMatchResult extends MatchResult {
  documento?: SIIDocument
  pattern_boosted: boolean
  original_score: number
}

// =============================================================================
// MATCHING SERVICE
// =============================================================================

export class MatchingService {
  private matcher: SIIMatcher
  private weights: MatchingWeights
  private patterns: LearnedPattern[]
  private documents: SIIDocument[] = []

  constructor(config: MatchingServiceConfig = {}) {
    this.matcher = createSIIMatcher(config.matcherOptions)
    this.weights = {
      monto: config.weights?.monto ?? 0.4,
      fecha: config.weights?.fecha ?? 0.3,
      rut: config.weights?.rut ?? 0.2,
      folio: config.weights?.folio ?? 0.1,
    }
    this.patterns = config.patterns ?? []
  }

  /**
   * Load SII documents for matching
   */
  loadDocuments(documents: SIIDocument[]): void {
    this.documents = documents
    this.matcher.loadDocuments(documents)
  }

  /**
   * Load learned patterns for score boosting
   */
  loadPatterns(patterns: LearnedPattern[]): void {
    this.patterns = patterns
  }

  /**
   * Match a single transaction with pattern boosting
   */
  matchTransaction(transaction: BankTransaction): EnrichedMatchResult {
    const baseResult = this.matcher.matchTransaction(transaction)

    // Apply pattern boost
    const { boostedScore, patternApplied } = this.applyPatternBoost(
      transaction,
      baseResult.confianza
    )

    // Find the matched document for enrichment
    const documento = baseResult.documento_id
      ? this.documents.find((d) => d.id === baseResult.documento_id)
      : undefined

    // Re-evaluate status with boosted score
    let estado = baseResult.estado
    if (boostedScore >= 0.7 && baseResult.documento_id) {
      estado = 'matched'
    } else if (boostedScore >= 0.5 && baseResult.documento_id) {
      estado = 'partial'
    }

    return {
      ...baseResult,
      confianza: boostedScore,
      estado,
      documento,
      pattern_boosted: patternApplied,
      original_score: baseResult.confianza,
    }
  }

  /**
   * Match multiple transactions (batch)
   */
  matchTransactions(transactions: BankTransaction[]): EnrichedMatchResult[] {
    const baseResults = this.matcher.matchTransactions(transactions)

    return baseResults.map((result) => {
      const transaction = transactions.find(
        (t) => t.id === result.transaccion_id
      )

      const { boostedScore, patternApplied } = this.applyPatternBoost(
        transaction!,
        result.confianza
      )

      const documento = result.documento_id
        ? this.documents.find((d) => d.id === result.documento_id)
        : undefined

      let estado = result.estado
      if (boostedScore >= 0.7 && result.documento_id) {
        estado = 'matched'
      } else if (boostedScore >= 0.5 && result.documento_id) {
        estado = 'partial'
      }

      return {
        ...result,
        confianza: boostedScore,
        estado,
        documento,
        pattern_boosted: patternApplied,
        original_score: result.confianza,
      }
    })
  }

  /**
   * Generate summary with amount tracking
   */
  generateSummary(
    results: EnrichedMatchResult[],
    transactions: BankTransaction[]
  ): ReconciliationSummary & { pattern_boosted_count: number } {
    const baseSummary = this.matcher.generateSummary(results)

    let montoConciliado = 0
    let montoPendiente = 0
    let patternBoostedCount = 0

    for (const result of results) {
      const tx = transactions.find((t) => t.id === result.transaccion_id)
      const monto = Math.abs(tx?.monto || 0)

      if (result.estado === 'matched') {
        montoConciliado += monto
      } else {
        montoPendiente += monto
      }

      if (result.pattern_boosted) {
        patternBoostedCount++
      }
    }

    return {
      ...baseSummary,
      monto_conciliado: montoConciliado,
      monto_pendiente: montoPendiente,
      pattern_boosted_count: patternBoostedCount,
    }
  }

  /**
   * Extract a learnable pattern from a confirmed match
   */
  static extractPattern(
    transaction: BankTransaction,
    document: SIIDocument
  ): Omit<LearnedPattern, 'veces_aplicado'> {
    const descripcion = (
      transaction.descripcion_normalizada || transaction.descripcion
    ).toUpperCase()

    // Extract first 3 meaningful words as pattern key
    const words = descripcion.split(/\s+/).filter((w) => w.length > 2)
    const patternKey = words.slice(0, 3).join(' ')

    return {
      descripcion_patron: patternKey,
      rut_contraparte: document.rut_emisor,
      categoria: transaction.categoria_id,
      documento_tipo: document.tipo,
      score_boost: 0.1,
    }
  }

  // ─── Private Methods ─────────────────────────────────────

  private applyPatternBoost(
    transaction: BankTransaction,
    baseScore: number
  ): { boostedScore: number; patternApplied: boolean } {
    if (this.patterns.length === 0) {
      return { boostedScore: baseScore, patternApplied: false }
    }

    const descripcion = (
      transaction.descripcion_normalizada || transaction.descripcion
    ).toUpperCase()

    for (const pattern of this.patterns) {
      const patternDesc = pattern.descripcion_patron.toUpperCase()
      if (descripcion.includes(patternDesc)) {
        const boostedScore = Math.min(baseScore + pattern.score_boost, 1.0)
        return { boostedScore, patternApplied: true }
      }
    }

    return { boostedScore: baseScore, patternApplied: false }
  }
}

// =============================================================================
// FACTORY
// =============================================================================

export function createMatchingService(
  config?: MatchingServiceConfig
): MatchingService {
  return new MatchingService(config)
}
