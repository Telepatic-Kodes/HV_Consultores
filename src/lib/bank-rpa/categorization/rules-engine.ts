// =============================================================================
// HV Consultores - Categorization Rules Engine
// Motor de reglas para categorización automática de transacciones
// =============================================================================

import type {
  BankTransaction,
  CategorizationRule,
  RuleMatchResult,
  TransactionCategory,
  BankCode,
  TransactionType,
} from '../types'
import { DEFAULT_CATEGORY_KEYWORDS } from '../constants'

// ============================================================================
// TYPES
// ============================================================================

export interface CategorizationResult {
  categoria_id: string
  confianza: number
  regla_id?: string
  regla_nombre?: string
  metodo: 'regla' | 'keyword' | 'ml' | 'manual'
  cuenta_contable?: string
  centro_costo?: string
}

export interface RulesEngineOptions {
  minConfidence?: number // Mínima confianza para aceptar (default: 0.5)
  useKeywordFallback?: boolean // Usar keywords si no hay reglas (default: true)
  prioritizeClientRules?: boolean // Priorizar reglas del cliente (default: true)
}

// ============================================================================
// RULES ENGINE CLASS
// ============================================================================

export class CategorizationRulesEngine {
  private rules: CategorizationRule[] = []
  private categories: Map<string, TransactionCategory> = new Map()
  private options: RulesEngineOptions

  constructor(options: RulesEngineOptions = {}) {
    this.options = {
      minConfidence: options.minConfidence ?? 0.5,
      useKeywordFallback: options.useKeywordFallback ?? true,
      prioritizeClientRules: options.prioritizeClientRules ?? true,
    }
  }

  /**
   * Carga las reglas de categorización
   */
  loadRules(rules: CategorizationRule[]): void {
    this.rules = this.sortRulesByPriority(rules)
  }

  /**
   * Carga las categorías disponibles
   */
  loadCategories(categories: TransactionCategory[]): void {
    this.categories.clear()
    for (const cat of categories) {
      this.categories.set(cat.id, cat)
    }
  }

  /**
   * Categoriza una transacción
   */
  categorize(
    transaction: BankTransaction,
    clienteId?: string
  ): CategorizationResult | null {
    const descripcion = transaction.descripcion_normalizada || transaction.descripcion
    const monto = transaction.monto
    const tipo = transaction.tipo

    // Paso 1: Intentar con reglas
    const ruleResult = this.matchRules(
      descripcion,
      monto,
      tipo,
      clienteId,
      transaction
    )

    if (ruleResult && ruleResult.confianza >= (this.options.minConfidence || 0.5)) {
      return {
        categoria_id: ruleResult.categoria_id,
        confianza: ruleResult.confianza,
        regla_id: ruleResult.rule_id,
        regla_nombre: ruleResult.rule_name,
        metodo: 'regla',
        cuenta_contable: ruleResult.cuenta_contable,
      }
    }

    // Paso 2: Fallback a keywords por defecto
    if (this.options.useKeywordFallback) {
      const keywordResult = this.matchKeywords(descripcion, tipo)
      if (keywordResult) {
        return {
          categoria_id: keywordResult.categoria_id,
          confianza: keywordResult.confianza,
          metodo: 'keyword',
        }
      }
    }

    return null
  }

  /**
   * Categoriza múltiples transacciones
   */
  categorizeMany(
    transactions: BankTransaction[],
    clienteId?: string
  ): Map<string, CategorizationResult | null> {
    const results = new Map<string, CategorizationResult | null>()

    for (const tx of transactions) {
      const result = this.categorize(tx, clienteId)
      results.set(tx.id, result)
    }

    return results
  }

  /**
   * Intenta encontrar una regla que coincida
   */
  private matchRules(
    descripcion: string,
    monto: number,
    tipo: TransactionType,
    clienteId?: string,
    transaction?: BankTransaction
  ): RuleMatchResult | null {
    const normalizedDesc = descripcion.toUpperCase()

    for (const rule of this.rules) {
      // Filtrar por cliente
      if (rule.cliente_id && rule.cliente_id !== clienteId) continue

      // Verificar si la regla está activa
      if (!rule.activa) continue

      // Verificar condiciones
      if (!this.ruleMatches(rule, normalizedDesc, monto, tipo, transaction)) continue

      // Calcular confianza
      const confianza = this.calculateConfidence(rule, normalizedDesc)

      return {
        rule_id: rule.id,
        rule_name: rule.nombre,
        categoria_id: rule.categoria_id,
        cuenta_contable: rule.cuenta_contable,
        confianza,
        match_reason: this.getMatchReason(rule, normalizedDesc),
      }
    }

    return null
  }

  /**
   * Verifica si una regla coincide con la transacción
   */
  private ruleMatches(
    rule: CategorizationRule,
    descripcion: string,
    monto: number,
    tipo: TransactionType,
    transaction?: BankTransaction
  ): boolean {
    // Verificar tipo de transacción
    if (rule.tipo_transaccion && rule.tipo_transaccion !== tipo) {
      return false
    }

    // Verificar banco
    if (rule.banco && transaction) {
      const txBanco = (transaction.metadata as { banco?: BankCode })?.banco
      if (txBanco && rule.banco !== txBanco) {
        return false
      }
    }

    // Verificar rango de monto
    if (rule.monto_min !== undefined && rule.monto_min !== null && monto < rule.monto_min) {
      return false
    }
    if (rule.monto_max !== undefined && rule.monto_max !== null && monto > rule.monto_max) {
      return false
    }

    // Verificar patrones regex
    if (rule.patron_descripcion && rule.patron_descripcion.length > 0) {
      const patternMatch = rule.patron_descripcion.some((pattern) => {
        try {
          const regex = new RegExp(pattern, 'i')
          return regex.test(descripcion)
        } catch {
          return false
        }
      })

      if (patternMatch) return true
    }

    // Verificar palabras clave
    if (rule.palabras_clave && rule.palabras_clave.length > 0) {
      const keywordMatch = rule.palabras_clave.some((keyword) => {
        return descripcion.includes(keyword.toUpperCase())
      })

      if (keywordMatch) return true
    }

    // Si tiene patrones o keywords definidos pero no coincide ninguno
    if (
      (rule.patron_descripcion && rule.patron_descripcion.length > 0) ||
      (rule.palabras_clave && rule.palabras_clave.length > 0)
    ) {
      return false
    }

    // Regla sin patrones ni keywords (solo por monto/tipo) - no aplicar
    return false
  }

  /**
   * Calcula la confianza del match
   */
  private calculateConfidence(rule: CategorizationRule, descripcion: string): number {
    let confidence = 0.7 // Base confidence for rule match

    // Boost por match de múltiples keywords
    if (rule.palabras_clave && rule.palabras_clave.length > 0) {
      const matchedKeywords = rule.palabras_clave.filter((kw) =>
        descripcion.includes(kw.toUpperCase())
      ).length

      const keywordRatio = matchedKeywords / rule.palabras_clave.length
      confidence += keywordRatio * 0.2
    }

    // Boost por regla específica del cliente
    if (rule.cliente_id) {
      confidence += 0.1
    }

    // Boost por veces aplicada (indica que funciona bien)
    if (rule.veces_aplicada > 10) {
      confidence += 0.05
    }

    return Math.min(confidence, 1.0)
  }

  /**
   * Obtiene la razón del match para debugging
   */
  private getMatchReason(rule: CategorizationRule, descripcion: string): string {
    const reasons: string[] = []

    if (rule.palabras_clave) {
      const matched = rule.palabras_clave.filter((kw) =>
        descripcion.includes(kw.toUpperCase())
      )
      if (matched.length > 0) {
        reasons.push(`Keywords: ${matched.join(', ')}`)
      }
    }

    if (rule.patron_descripcion) {
      for (const pattern of rule.patron_descripcion) {
        try {
          const regex = new RegExp(pattern, 'i')
          if (regex.test(descripcion)) {
            reasons.push(`Pattern: ${pattern}`)
            break
          }
        } catch {
          continue
        }
      }
    }

    return reasons.join('; ') || 'Rule match'
  }

  /**
   * Fallback a keywords por defecto
   */
  private matchKeywords(
    descripcion: string,
    tipo: TransactionType
  ): { categoria_id: string; confianza: number } | null {
    const normalizedDesc = descripcion.toUpperCase()
    let bestMatch: { codigo: string; score: number } | null = null

    for (const [codigo, keywords] of Object.entries(DEFAULT_CATEGORY_KEYWORDS)) {
      let score = 0
      let matchedCount = 0

      for (const keyword of keywords) {
        if (normalizedDesc.includes(keyword.toUpperCase())) {
          matchedCount++
          // Longer keywords are more specific, give them more weight
          score += keyword.length / 10
        }
      }

      if (matchedCount > 0 && (!bestMatch || score > bestMatch.score)) {
        bestMatch = { codigo, score }
      }
    }

    if (bestMatch) {
      // Find category ID by code
      for (const [id, category] of Array.from(this.categories)) {
        if (category.codigo === bestMatch.codigo) {
          return {
            categoria_id: id,
            confianza: Math.min(0.3 + bestMatch.score * 0.1, 0.7), // Keyword matches have lower confidence
          }
        }
      }
    }

    return null
  }

  /**
   * Ordena reglas por prioridad
   */
  private sortRulesByPriority(rules: CategorizationRule[]): CategorizationRule[] {
    return [...rules].sort((a, b) => {
      // Reglas de cliente primero (si está configurado)
      if (this.options.prioritizeClientRules) {
        if (a.cliente_id && !b.cliente_id) return -1
        if (!a.cliente_id && b.cliente_id) return 1
      }

      // Luego por prioridad numérica (menor = mayor prioridad)
      return a.prioridad - b.prioridad
    })
  }

  /**
   * Obtiene estadísticas del engine
   */
  getStats(): {
    totalRules: number
    globalRules: number
    clientRules: number
    activeRules: number
  } {
    return {
      totalRules: this.rules.length,
      globalRules: this.rules.filter((r) => !r.cliente_id).length,
      clientRules: this.rules.filter((r) => !!r.cliente_id).length,
      activeRules: this.rules.filter((r) => r.activa).length,
    }
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

export function createRulesEngine(options?: RulesEngineOptions): CategorizationRulesEngine {
  return new CategorizationRulesEngine(options)
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Crea una regla de categorización desde una transacción
 */
export function createRuleFromTransaction(
  transaction: BankTransaction,
  categoria_id: string,
  options?: {
    nombre?: string
    cliente_id?: string
    extractKeywords?: boolean
  }
): Omit<CategorizationRule, 'id' | 'created_at' | 'updated_at'> {
  const descripcion = transaction.descripcion_normalizada || transaction.descripcion
  let palabras_clave: string[] = []

  // Extraer palabras clave si se solicita
  if (options?.extractKeywords) {
    // Dividir en palabras y filtrar las más relevantes
    const words = descripcion
      .toUpperCase()
      .split(/\s+/)
      .filter((w) => w.length >= 3)
      .filter((w) => !/^\d+$/.test(w)) // Excluir números

    // Tomar las primeras 3-4 palabras significativas
    palabras_clave = Array.from(new Set(words)).slice(0, 4)
  }

  return {
    cliente_id: options?.cliente_id,
    nombre: options?.nombre || `Regla desde: ${descripcion.slice(0, 50)}`,
    descripcion: `Creada automáticamente desde transacción`,
    categoria_id,
    cuenta_contable: undefined,
    centro_costo: undefined,
    patron_descripcion: undefined,
    palabras_clave: palabras_clave.length > 0 ? palabras_clave : undefined,
    monto_min: undefined,
    monto_max: undefined,
    tipo_transaccion: transaction.tipo,
    banco: (transaction.metadata as { banco?: BankCode })?.banco,
    prioridad: 50, // Prioridad media
    activa: true,
    veces_aplicada: 0,
    ultima_aplicacion: undefined,
  }
}

/**
 * Sugiere reglas basándose en transacciones similares
 */
export function suggestRules(
  transactions: BankTransaction[],
  minOccurrences: number = 3
): Array<{
  pattern: string
  count: number
  sample: BankTransaction
}> {
  const patterns = new Map<string, { count: number; samples: BankTransaction[] }>()

  for (const tx of transactions) {
    const desc = tx.descripcion_normalizada || tx.descripcion
    // Extraer un patrón genérico (primeras 2-3 palabras)
    const words = desc.toUpperCase().split(/\s+/).slice(0, 3)
    const pattern = words.join(' ')

    if (!patterns.has(pattern)) {
      patterns.set(pattern, { count: 0, samples: [] })
    }

    const entry = patterns.get(pattern)!
    entry.count++
    if (entry.samples.length < 3) {
      entry.samples.push(tx)
    }
  }

  // Filtrar por mínimo de ocurrencias y ordenar
  return Array.from(patterns.entries())
    .filter(([_, data]) => data.count >= minOccurrences)
    .map(([pattern, data]) => ({
      pattern,
      count: data.count,
      sample: data.samples[0],
    }))
    .sort((a, b) => b.count - a.count)
}
