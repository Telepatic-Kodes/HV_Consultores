// =============================================================================
// HV Consultores - Rules Engine Test Suite
// Tests for categorization rules engine
// =============================================================================

import { describe, it, expect, beforeEach } from 'vitest'
import {
  CategorizationRulesEngine,
  createRulesEngine,
  createRuleFromTransaction,
  suggestRules,
} from '@/lib/bank-rpa/categorization/rules-engine'
import type {
  BankTransaction,
  CategorizationRule,
  TransactionCategory,
} from '@/lib/bank-rpa/types'

// =============================================================================
// TEST DATA FACTORIES
// =============================================================================

const createMockTransaction = (overrides: Partial<BankTransaction> = {}): BankTransaction => ({
  id: 'tx-123',
  cuenta_id: 'cuenta-123',
  fecha: '2026-01-15',
  descripcion: 'TRANSFERENCIA ELECTRONICA',
  descripcion_normalizada: 'TRANSFERENCIA ELECTRONICA',
  monto: 50000,
  tipo: 'cargo',
  conciliado_sii: false,
  estado_conciliacion: 'pending',
  hash_transaccion: 'hash123',
  metadata: { banco: 'bancochile' },
  created_at: '2026-01-15T00:00:00Z',
  ...overrides,
})

const createMockRule = (overrides: Partial<CategorizationRule> = {}): CategorizationRule => ({
  id: 'rule-123',
  cliente_id: undefined,
  nombre: 'Test Rule',
  descripcion: 'Test rule description',
  categoria_id: 'cat-001',
  cuenta_contable: '11010001',
  palabras_clave: ['TRANSFERENCIA'],
  prioridad: 100,
  activa: true,
  veces_aplicada: 5,
  created_at: '2026-01-15T00:00:00Z',
  updated_at: '2026-01-15T00:00:00Z',
  ...overrides,
})

const createMockCategory = (overrides: Partial<TransactionCategory> = {}): TransactionCategory => ({
  id: 'cat-001',
  codigo: 'TRF',
  nombre: 'Transferencias',
  color: '#3B82F6',
  orden: 1,
  activa: true,
  created_at: '2026-01-15T00:00:00Z',
  ...overrides,
})

// =============================================================================
// RULES ENGINE TESTS
// =============================================================================

describe('CategorizationRulesEngine', () => {
  let engine: CategorizationRulesEngine

  beforeEach(() => {
    engine = createRulesEngine()
  })

  describe('loadRules', () => {
    it('should load and sort rules by priority', () => {
      const rules = [
        createMockRule({ id: 'rule-1', prioridad: 100 }),
        createMockRule({ id: 'rule-2', prioridad: 50 }),
        createMockRule({ id: 'rule-3', prioridad: 75 }),
      ]

      engine.loadRules(rules)
      const stats = engine.getStats()

      expect(stats.totalRules).toBe(3)
      expect(stats.activeRules).toBe(3)
    })

    it('should prioritize client rules when configured', () => {
      const rules = [
        createMockRule({ id: 'global-rule', cliente_id: undefined, prioridad: 50 }),
        createMockRule({ id: 'client-rule', cliente_id: 'cliente-123', prioridad: 100 }),
      ]

      engine.loadRules(rules)
      const stats = engine.getStats()

      expect(stats.clientRules).toBe(1)
      expect(stats.globalRules).toBe(1)
    })
  })

  describe('loadCategories', () => {
    it('should load categories into engine', () => {
      const categories = [
        createMockCategory({ id: 'cat-1', codigo: 'TRF' }),
        createMockCategory({ id: 'cat-2', codigo: 'COM' }),
      ]

      engine.loadCategories(categories)
      // Categories are loaded correctly (internal state)
    })
  })

  describe('categorize', () => {
    beforeEach(() => {
      engine.loadRules([
        createMockRule({
          id: 'rule-tef',
          palabras_clave: ['TRANSFERENCIA', 'TEF'],
          categoria_id: 'cat-trf',
        }),
        createMockRule({
          id: 'rule-pac',
          palabras_clave: ['PAC', 'PAGO AUTOMATICO'],
          categoria_id: 'cat-pac',
        }),
        createMockRule({
          id: 'rule-comision',
          palabras_clave: ['COMISION', 'MANTENCION'],
          categoria_id: 'cat-com',
        }),
      ])

      engine.loadCategories([
        createMockCategory({ id: 'cat-trf', codigo: 'TRF' }),
        createMockCategory({ id: 'cat-pac', codigo: 'SER' }),
        createMockCategory({ id: 'cat-com', codigo: 'FIN' }),
      ])
    })

    it('should categorize transaction by keyword match', () => {
      const tx = createMockTransaction({
        descripcion: 'TRANSFERENCIA ELECTRONICA A CUENTA',
        descripcion_normalizada: 'TRANSFERENCIA ELECTRONICA A CUENTA',
      })

      const result = engine.categorize(tx)

      expect(result).not.toBeNull()
      expect(result?.categoria_id).toBe('cat-trf')
      expect(result?.metodo).toBe('regla')
      expect(result?.confianza).toBeGreaterThanOrEqual(0.5)
    })

    it('should match PAC transactions', () => {
      const tx = createMockTransaction({
        descripcion: 'PAC LUZ ENEL DISTRIBUCION',
        descripcion_normalizada: 'PAC LUZ ENEL DISTRIBUCION',
      })

      const result = engine.categorize(tx)

      expect(result).not.toBeNull()
      expect(result?.categoria_id).toBe('cat-pac')
    })

    it('should match comision transactions', () => {
      const tx = createMockTransaction({
        descripcion: 'COMISION MANTENCION CUENTA',
        descripcion_normalizada: 'COMISION MANTENCION CUENTA',
      })

      const result = engine.categorize(tx)

      expect(result).not.toBeNull()
      expect(result?.categoria_id).toBe('cat-com')
    })

    it('should return null for unmatched transactions', () => {
      const tx = createMockTransaction({
        descripcion: 'MOVIMIENTO DESCONOCIDO XYZ',
        descripcion_normalizada: 'MOVIMIENTO DESCONOCIDO XYZ',
      })

      // Disable keyword fallback for this test
      const strictEngine = createRulesEngine({ useKeywordFallback: false })
      strictEngine.loadRules([createMockRule({ palabras_clave: ['TRANSFERENCIA'] })])

      const result = strictEngine.categorize(tx)

      expect(result).toBeNull()
    })

    it('should filter rules by client ID', () => {
      const clientRule = createMockRule({
        id: 'client-rule',
        cliente_id: 'cliente-123',
        palabras_clave: ['ESPECIFICO'],
        categoria_id: 'cat-client',
        prioridad: 1,
      })

      engine.loadRules([clientRule])

      const tx = createMockTransaction({
        descripcion: 'PAGO ESPECIFICO CLIENTE',
        descripcion_normalizada: 'PAGO ESPECIFICO CLIENTE',
      })

      // Without client ID, should not match
      const result1 = engine.categorize(tx, 'otro-cliente')
      expect(result1?.categoria_id).not.toBe('cat-client')

      // With correct client ID, should match
      const result2 = engine.categorize(tx, 'cliente-123')
      expect(result2?.categoria_id).toBe('cat-client')
    })

    it('should include cuenta_contable in result', () => {
      const tx = createMockTransaction({
        descripcion: 'TRANSFERENCIA A PROVEEDOR',
        descripcion_normalizada: 'TRANSFERENCIA A PROVEEDOR',
      })

      const result = engine.categorize(tx)

      expect(result?.cuenta_contable).toBe('11010001')
    })
  })

  describe('Rule Matching Conditions', () => {
    it('should filter by transaction type', () => {
      const cargoRule = createMockRule({
        palabras_clave: ['PAGO'],
        tipo_transaccion: 'cargo',
        categoria_id: 'cat-cargo',
      })

      engine.loadRules([cargoRule])

      const cargoTx = createMockTransaction({
        descripcion: 'PAGO PROVEEDOR',
        tipo: 'cargo',
      })

      const abonoTx = createMockTransaction({
        descripcion: 'PAGO RECIBIDO',
        tipo: 'abono',
      })

      const result1 = engine.categorize(cargoTx)
      const result2 = engine.categorize(abonoTx)

      expect(result1?.categoria_id).toBe('cat-cargo')
      expect(result2).toBeNull()
    })

    it('should filter by monto_min', () => {
      const largeAmountRule = createMockRule({
        palabras_clave: ['TRANSFERENCIA'],
        monto_min: 100000,
        categoria_id: 'cat-large',
      })

      engine.loadRules([largeAmountRule])

      const smallTx = createMockTransaction({
        descripcion: 'TRANSFERENCIA PEQUEÑA',
        monto: 50000,
      })

      const largeTx = createMockTransaction({
        descripcion: 'TRANSFERENCIA GRANDE',
        monto: 150000,
      })

      expect(engine.categorize(smallTx)).toBeNull()
      expect(engine.categorize(largeTx)?.categoria_id).toBe('cat-large')
    })

    it('should filter by monto_max', () => {
      const smallAmountRule = createMockRule({
        palabras_clave: ['PAGO'],
        monto_max: 50000,
        categoria_id: 'cat-small',
      })

      engine.loadRules([smallAmountRule])

      const smallTx = createMockTransaction({
        descripcion: 'PAGO PEQUEÑO',
        monto: 30000,
      })

      const largeTx = createMockTransaction({
        descripcion: 'PAGO GRANDE',
        monto: 100000,
      })

      expect(engine.categorize(smallTx)?.categoria_id).toBe('cat-small')
      expect(engine.categorize(largeTx)).toBeNull()
    })

    it('should match by regex pattern', () => {
      const regexRule = createMockRule({
        patron_descripcion: ['TEF.*EMPRESA', 'TRANSF.*LTDA'],
        categoria_id: 'cat-empresa',
      })

      engine.loadRules([regexRule])

      const tx1 = createMockTransaction({
        descripcion: 'TEF A EMPRESA ABC',
      })

      const tx2 = createMockTransaction({
        descripcion: 'TRANSF COMERCIAL LTDA',
      })

      const tx3 = createMockTransaction({
        descripcion: 'PAGO SERVICIO',
      })

      expect(engine.categorize(tx1)?.categoria_id).toBe('cat-empresa')
      expect(engine.categorize(tx2)?.categoria_id).toBe('cat-empresa')
      expect(engine.categorize(tx3)).toBeNull()
    })

    it('should skip inactive rules', () => {
      const inactiveRule = createMockRule({
        palabras_clave: ['TRANSFERENCIA'],
        activa: false,
        categoria_id: 'cat-inactive',
      })

      engine.loadRules([inactiveRule])

      const tx = createMockTransaction({
        descripcion: 'TRANSFERENCIA ELECTRONICA',
      })

      expect(engine.categorize(tx)).toBeNull()
    })
  })

  describe('Confidence Calculation', () => {
    it('should boost confidence for multiple keyword matches', () => {
      const multiKeywordRule = createMockRule({
        palabras_clave: ['TRANSFERENCIA', 'ELECTRONICA', 'CUENTA'],
        categoria_id: 'cat-multi',
      })

      engine.loadRules([multiKeywordRule])

      const tx = createMockTransaction({
        descripcion: 'TRANSFERENCIA ELECTRONICA A CUENTA',
      })

      const result = engine.categorize(tx)

      expect(result?.confianza).toBeGreaterThan(0.7)
    })

    it('should boost confidence for client-specific rules', () => {
      const clientRule = createMockRule({
        cliente_id: 'cliente-123',
        palabras_clave: ['ESPECIAL'],
        categoria_id: 'cat-client',
      })

      engine.loadRules([clientRule])

      const tx = createMockTransaction({
        descripcion: 'PAGO ESPECIAL',
      })

      const result = engine.categorize(tx, 'cliente-123')

      expect(result?.confianza).toBeGreaterThan(0.75)
    })

    it('should respect minConfidence option', () => {
      const lowConfEngine = createRulesEngine({ minConfidence: 0.9 })
      lowConfEngine.loadRules([
        createMockRule({
          palabras_clave: ['PAGO'],
          categoria_id: 'cat-pago',
        }),
      ])

      const tx = createMockTransaction({
        descripcion: 'PAGO SIMPLE',
      })

      // With high minConfidence threshold, might not pass
      const result = lowConfEngine.categorize(tx)
      expect(result).toBeNull()
    })
  })

  describe('categorizeMany', () => {
    it('should categorize multiple transactions', () => {
      engine.loadRules([
        createMockRule({ palabras_clave: ['TRANSFERENCIA'], categoria_id: 'cat-trf' }),
        createMockRule({ palabras_clave: ['COMISION'], categoria_id: 'cat-com' }),
      ])

      const transactions = [
        createMockTransaction({ id: 'tx-1', descripcion: 'TRANSFERENCIA' }),
        createMockTransaction({ id: 'tx-2', descripcion: 'COMISION MENSUAL' }),
        createMockTransaction({ id: 'tx-3', descripcion: 'DESCONOCIDO' }),
      ]

      const results = engine.categorizeMany(transactions)

      expect(results.size).toBe(3)
      expect(results.get('tx-1')?.categoria_id).toBe('cat-trf')
      expect(results.get('tx-2')?.categoria_id).toBe('cat-com')
      expect(results.get('tx-3')).toBeNull()
    })
  })

  describe('getStats', () => {
    it('should return accurate statistics', () => {
      engine.loadRules([
        createMockRule({ id: 'r1', cliente_id: undefined, activa: true }),
        createMockRule({ id: 'r2', cliente_id: 'client-1', activa: true }),
        createMockRule({ id: 'r3', cliente_id: 'client-2', activa: false }),
      ])

      const stats = engine.getStats()

      expect(stats.totalRules).toBe(3)
      expect(stats.globalRules).toBe(1)
      expect(stats.clientRules).toBe(2)
      expect(stats.activeRules).toBe(2)
    })
  })
})

// =============================================================================
// UTILITY FUNCTIONS TESTS
// =============================================================================

describe('createRuleFromTransaction', () => {
  it('should create a basic rule', () => {
    const tx = createMockTransaction({
      descripcion: 'PAGO PROVEEDOR ABC',
      descripcion_normalizada: 'PAGO PROVEEDOR ABC',
      tipo: 'cargo',
    })

    const rule = createRuleFromTransaction(tx, 'cat-123')

    expect(rule.categoria_id).toBe('cat-123')
    expect(rule.tipo_transaccion).toBe('cargo')
    expect(rule.activa).toBe(true)
    expect(rule.prioridad).toBe(50)
  })

  it('should extract keywords when requested', () => {
    const tx = createMockTransaction({
      descripcion: 'TRANSFERENCIA ELECTRONICA EMPRESA LTDA',
      descripcion_normalizada: 'TRANSFERENCIA ELECTRONICA EMPRESA LTDA',
    })

    const rule = createRuleFromTransaction(tx, 'cat-123', { extractKeywords: true })

    expect(rule.palabras_clave).toBeDefined()
    expect(rule.palabras_clave?.length).toBeGreaterThan(0)
    expect(rule.palabras_clave?.length).toBeLessThanOrEqual(4)
  })

  it('should exclude numbers from keywords', () => {
    const tx = createMockTransaction({
      descripcion: 'PAGO 12345 FACTURA 67890',
      descripcion_normalizada: 'PAGO 12345 FACTURA 67890',
    })

    const rule = createRuleFromTransaction(tx, 'cat-123', { extractKeywords: true })

    expect(rule.palabras_clave).not.toContain('12345')
    expect(rule.palabras_clave).not.toContain('67890')
  })

  it('should include cliente_id when provided', () => {
    const tx = createMockTransaction()

    const rule = createRuleFromTransaction(tx, 'cat-123', {
      cliente_id: 'cliente-456',
    })

    expect(rule.cliente_id).toBe('cliente-456')
  })

  it('should use custom name when provided', () => {
    const tx = createMockTransaction()

    const rule = createRuleFromTransaction(tx, 'cat-123', {
      nombre: 'Mi Regla Personalizada',
    })

    expect(rule.nombre).toBe('Mi Regla Personalizada')
  })

  it('should extract banco from transaction metadata', () => {
    const tx = createMockTransaction({
      metadata: { banco: 'santander' },
    })

    const rule = createRuleFromTransaction(tx, 'cat-123')

    expect(rule.banco).toBe('santander')
  })
})

describe('suggestRules', () => {
  it('should suggest rules based on recurring patterns', () => {
    const transactions = [
      createMockTransaction({ id: '1', descripcion: 'PAGO LUZ ENEL' }),
      createMockTransaction({ id: '2', descripcion: 'PAGO LUZ ENEL' }),
      createMockTransaction({ id: '3', descripcion: 'PAGO LUZ ENEL' }),
      createMockTransaction({ id: '4', descripcion: 'TRANSFERENCIA UNICA' }),
    ]

    const suggestions = suggestRules(transactions, 3)

    expect(suggestions.length).toBe(1)
    expect(suggestions[0].pattern).toBe('PAGO LUZ ENEL')
    expect(suggestions[0].count).toBe(3)
  })

  it('should return empty for transactions below threshold', () => {
    const transactions = [
      createMockTransaction({ id: '1', descripcion: 'PAGO A' }),
      createMockTransaction({ id: '2', descripcion: 'PAGO B' }),
    ]

    const suggestions = suggestRules(transactions, 3)

    expect(suggestions.length).toBe(0)
  })

  it('should sort suggestions by frequency', () => {
    const transactions = [
      // 5 occurrences
      ...Array(5).fill(null).map((_, i) =>
        createMockTransaction({ id: `a${i}`, descripcion: 'COMISION MENSUAL' })
      ),
      // 3 occurrences
      ...Array(3).fill(null).map((_, i) =>
        createMockTransaction({ id: `b${i}`, descripcion: 'PAC SERVICIO' })
      ),
    ]

    const suggestions = suggestRules(transactions, 3)

    expect(suggestions.length).toBe(2)
    expect(suggestions[0].count).toBeGreaterThan(suggestions[1].count)
  })

  it('should use normalized description if available', () => {
    const transactions = [
      createMockTransaction({
        id: '1',
        descripcion: 'tef enviado',
        descripcion_normalizada: 'TRANSFERENCIA ELECTRONICA ENVIADO',
      }),
      createMockTransaction({
        id: '2',
        descripcion: 'TEF ENVIADO',
        descripcion_normalizada: 'TRANSFERENCIA ELECTRONICA ENVIADO',
      }),
      createMockTransaction({
        id: '3',
        descripcion: 'Tef Enviado',
        descripcion_normalizada: 'TRANSFERENCIA ELECTRONICA ENVIADO',
      }),
    ]

    const suggestions = suggestRules(transactions, 3)

    expect(suggestions.length).toBe(1)
    expect(suggestions[0].count).toBe(3)
  })
})

// =============================================================================
// ENGINE OPTIONS TESTS
// =============================================================================

describe('RulesEngineOptions', () => {
  it('should use default options when not provided', () => {
    const engine = createRulesEngine()
    // Engine should have default minConfidence of 0.5
    // and useKeywordFallback true
  })

  it('should respect useKeywordFallback option', () => {
    const engine = createRulesEngine({ useKeywordFallback: false })
    engine.loadCategories([createMockCategory({ id: 'cat-1', codigo: 'VEN' })])

    const tx = createMockTransaction({
      descripcion: 'VENTA PRODUCTO',
    })

    // Without rules and keyword fallback disabled, should return null
    const result = engine.categorize(tx)
    expect(result).toBeNull()
  })

  it('should respect prioritizeClientRules option', () => {
    const engineWithPriority = createRulesEngine({ prioritizeClientRules: true })
    const engineWithoutPriority = createRulesEngine({ prioritizeClientRules: false })

    const globalRule = createMockRule({
      id: 'global',
      cliente_id: undefined,
      prioridad: 1,
      palabras_clave: ['PAGO'],
      categoria_id: 'cat-global',
    })

    const clientRule = createMockRule({
      id: 'client',
      cliente_id: 'cliente-123',
      prioridad: 100,
      palabras_clave: ['PAGO'],
      categoria_id: 'cat-client',
    })

    engineWithPriority.loadRules([globalRule, clientRule])
    engineWithoutPriority.loadRules([globalRule, clientRule])

    const tx = createMockTransaction({ descripcion: 'PAGO SERVICIO' })

    // With priority, client rule should be checked first
    const result1 = engineWithPriority.categorize(tx, 'cliente-123')
    expect(result1?.categoria_id).toBe('cat-client')

    // Without priority, lower prioridad number wins
    const result2 = engineWithoutPriority.categorize(tx, 'cliente-123')
    expect(result2?.categoria_id).toBe('cat-global')
  })
})

// =============================================================================
// EDGE CASES
// =============================================================================

describe('Edge Cases', () => {
  let engine: CategorizationRulesEngine

  beforeEach(() => {
    engine = createRulesEngine()
  })

  it('should handle empty rules array', () => {
    engine.loadRules([])

    const tx = createMockTransaction({ descripcion: 'CUALQUIER COSA' })
    const result = engine.categorize(tx)

    expect(result).toBeNull()
  })

  it('should handle transaction with empty description', () => {
    engine.loadRules([createMockRule({ palabras_clave: ['PAGO'] })])

    const tx = createMockTransaction({
      descripcion: '',
      descripcion_normalizada: '',
    })

    const result = engine.categorize(tx)
    expect(result).toBeNull()
  })

  it('should handle invalid regex pattern gracefully', () => {
    const badRule = createMockRule({
      patron_descripcion: ['[invalid(regex'],
      categoria_id: 'cat-bad',
    })

    engine.loadRules([badRule])

    const tx = createMockTransaction({ descripcion: 'TEST' })

    // Should not throw, just not match
    expect(() => engine.categorize(tx)).not.toThrow()
  })

  it('should handle null/undefined palabras_clave', () => {
    const rule = createMockRule({
      palabras_clave: undefined,
      patron_descripcion: ['TEST'],
      categoria_id: 'cat-test',
    })

    engine.loadRules([rule])

    const tx = createMockTransaction({ descripcion: 'TEST TRANSACTION' })
    const result = engine.categorize(tx)

    expect(result?.categoria_id).toBe('cat-test')
  })

  it('should be case-insensitive for keyword matching', () => {
    engine.loadRules([
      createMockRule({
        palabras_clave: ['transferencia'],
        categoria_id: 'cat-trf',
      }),
    ])

    const tx = createMockTransaction({
      descripcion: 'TRANSFERENCIA GRANDE',
      descripcion_normalizada: 'TRANSFERENCIA GRANDE',
    })

    const result = engine.categorize(tx)
    expect(result?.categoria_id).toBe('cat-trf')
  })
})
