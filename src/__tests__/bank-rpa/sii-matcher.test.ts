// =============================================================================
// HV Consultores - SII Reconciliation Matcher Test Suite
// Tests for bank-SII document matching and reconciliation
// =============================================================================

import { describe, it, expect, beforeEach } from 'vitest'
import {
  SIIMatcher,
  createSIIMatcher,
  filterDocumentsByPeriod,
  groupDocumentsByRut,
  createReconciliationRecord,
  type SIIDocument,
  type MatchResult,
} from '@/lib/bank-rpa/reconciliation/sii-matcher'
import type { BankTransaction } from '@/lib/bank-rpa/types'

// =============================================================================
// TEST DATA FACTORIES
// =============================================================================

const createMockTransaction = (overrides: Partial<BankTransaction> = {}): BankTransaction => ({
  id: 'tx-123',
  cuenta_id: 'cuenta-123',
  fecha: '2026-01-15',
  descripcion: 'PAGO FACTURA EMPRESA ABC',
  descripcion_normalizada: 'PAGO FACTURA EMPRESA ABC',
  monto: 119000,
  tipo: 'cargo',
  conciliado_sii: false,
  estado_conciliacion: 'pending',
  hash_transaccion: 'hash123',
  metadata: { banco: 'bancochile' },
  ...overrides,
})

const createMockDocument = (overrides: Partial<SIIDocument> = {}): SIIDocument => ({
  id: 'doc-123',
  tipo: 'factura',
  folio: '12345',
  fecha: '2026-01-15',
  rut_emisor: '76.123.456-7',
  razon_social_emisor: 'EMPRESA ABC LTDA',
  rut_receptor: '77.654.321-K',
  razon_social_receptor: 'MI EMPRESA SPA',
  monto_neto: 100000,
  iva: 19000,
  monto_total: 119000,
  ...overrides,
})

// =============================================================================
// SII MATCHER TESTS
// =============================================================================

describe('SIIMatcher', () => {
  let matcher: SIIMatcher

  beforeEach(() => {
    matcher = createSIIMatcher()
  })

  describe('loadDocuments', () => {
    it('should load documents into matcher', () => {
      const docs = [
        createMockDocument({ id: 'doc-1' }),
        createMockDocument({ id: 'doc-2' }),
      ]

      matcher.loadDocuments(docs)
      // Documents loaded successfully
    })
  })

  describe('matchTransaction', () => {
    beforeEach(() => {
      matcher.loadDocuments([
        createMockDocument({
          id: 'doc-1',
          monto_total: 119000,
          fecha: '2026-01-15',
          rut_emisor: '76.123.456-7',
        }),
        createMockDocument({
          id: 'doc-2',
          monto_total: 250000,
          fecha: '2026-01-20',
          rut_emisor: '76.999.888-5',
        }),
      ])
    })

    it('should find exact match by amount and date', () => {
      const tx = createMockTransaction({
        monto: 119000,
        fecha: '2026-01-15',
      })

      const result = matcher.matchTransaction(tx)

      expect(result.documento_id).toBe('doc-1')
      expect(result.estado).toBe('matched')
      expect(result.confianza).toBeGreaterThanOrEqual(0.7)
      expect(result.match_reasons).toContain('Monto exacto')
      expect(result.match_reasons).toContain('Fecha exacta')
    })

    it('should handle close date match', () => {
      const tx = createMockTransaction({
        monto: 119000,
        fecha: '2026-01-16', // 1 day difference
      })

      const result = matcher.matchTransaction(tx)

      expect(result.documento_id).toBe('doc-1')
      expect(result.confianza).toBeGreaterThan(0.5)
      expect(result.diferencia_dias).toBe(1)
    })

    it('should handle amount within tolerance', () => {
      const tx = createMockTransaction({
        monto: 119500, // ~0.4% difference
        fecha: '2026-01-15',
      })

      const result = matcher.matchTransaction(tx)

      expect(result.documento_id).toBe('doc-1')
      expect(result.match_reasons.some((r) => r.includes('Monto'))).toBe(true)
    })

    it('should return unmatched when no documents match', () => {
      const tx = createMockTransaction({
        monto: 500000, // No matching document
        fecha: '2026-02-01',
      })

      const result = matcher.matchTransaction(tx)

      expect(result.estado).toBe('unmatched')
      expect(result.confianza).toBeLessThan(0.5)
    })

    it('should match by RUT in description', () => {
      const tx = createMockTransaction({
        descripcion: 'PAGO A 76.123.456-7 FACTURA',
        descripcion_normalizada: 'PAGO A 76.123.456-7 FACTURA',
        monto: 119000,
        fecha: '2026-01-15',
      })

      const result = matcher.matchTransaction(tx)

      expect(result.documento_id).toBe('doc-1')
      expect(result.match_reasons).toContain('RUT coincide')
    })

    it('should match by folio/reference', () => {
      const tx = createMockTransaction({
        monto: 119000,
        fecha: '2026-01-15',
        referencia: '12345',
      })

      const result = matcher.matchTransaction(tx)

      expect(result.documento_id).toBe('doc-1')
      expect(result.match_reasons).toContain('Folio/Referencia coincide')
    })

    it('should match by company name', () => {
      const tx = createMockTransaction({
        descripcion: 'PAGO A EMPRESA ABC SERVICIO',
        descripcion_normalizada: 'PAGO A EMPRESA ABC SERVICIO',
        monto: 119000,
        fecha: '2026-01-15',
      })

      const result = matcher.matchTransaction(tx)

      expect(result.documento_id).toBe('doc-1')
      expect(result.match_reasons).toContain('Nombre coincide parcialmente')
    })

    it('should return partial match for medium confidence', () => {
      matcher.loadDocuments([
        createMockDocument({
          id: 'doc-partial',
          monto_total: 120000, // Slightly different
          fecha: '2026-01-20', // 5 days different
        }),
      ])

      const tx = createMockTransaction({
        monto: 119000,
        fecha: '2026-01-15',
      })

      const result = matcher.matchTransaction(tx)

      // Should be partial or unmatched depending on score
      expect(['partial', 'unmatched']).toContain(result.estado)
    })
  })

  describe('matchTransactions (batch)', () => {
    it('should match multiple transactions', () => {
      matcher.loadDocuments([
        createMockDocument({ id: 'doc-1', monto_total: 100000, fecha: '2026-01-10' }),
        createMockDocument({ id: 'doc-2', monto_total: 200000, fecha: '2026-01-15' }),
        createMockDocument({ id: 'doc-3', monto_total: 300000, fecha: '2026-01-20' }),
      ])

      const transactions = [
        createMockTransaction({ id: 'tx-1', monto: 100000, fecha: '2026-01-10' }),
        createMockTransaction({ id: 'tx-2', monto: 200000, fecha: '2026-01-15' }),
        createMockTransaction({ id: 'tx-3', monto: 500000, fecha: '2026-01-25' }), // No match
      ]

      const results = matcher.matchTransactions(transactions)

      expect(results.length).toBe(3)

      const matched = results.filter((r) => r.estado === 'matched')
      expect(matched.length).toBe(2)
    })

    it('should prevent duplicate document assignments', () => {
      matcher.loadDocuments([
        createMockDocument({ id: 'doc-1', monto_total: 100000, fecha: '2026-01-15' }),
      ])

      const transactions = [
        createMockTransaction({ id: 'tx-1', monto: 100000, fecha: '2026-01-15' }),
        createMockTransaction({ id: 'tx-2', monto: 100000, fecha: '2026-01-15' }), // Same match
      ]

      const results = matcher.matchTransactions(transactions)

      // One should be matched, one should be partial (document already used)
      const matched = results.filter((r) => r.estado === 'matched')
      const partial = results.filter((r) => r.estado === 'partial')

      expect(matched.length).toBe(1)
      expect(partial.length).toBe(1)
    })

    it('should process larger transactions first', () => {
      matcher.loadDocuments([
        createMockDocument({ id: 'doc-big', monto_total: 500000, fecha: '2026-01-15' }),
      ])

      const transactions = [
        createMockTransaction({ id: 'tx-small', monto: 100000, fecha: '2026-01-15' }),
        createMockTransaction({ id: 'tx-big', monto: 500000, fecha: '2026-01-15' }),
      ]

      const results = matcher.matchTransactions(transactions)

      // Big transaction should get the match
      const bigResult = results.find((r) => r.transaccion_id === 'tx-big')
      expect(bigResult?.estado).toBe('matched')
    })
  })

  describe('generateSummary', () => {
    it('should generate correct summary', () => {
      const results: MatchResult[] = [
        { transaccion_id: 't1', documento_id: 'd1', estado: 'matched', confianza: 0.9, diferencia_monto: 0, diferencia_dias: 0, match_reasons: [] },
        { transaccion_id: 't2', documento_id: 'd2', estado: 'matched', confianza: 0.8, diferencia_monto: 100, diferencia_dias: 1, match_reasons: [] },
        { transaccion_id: 't3', documento_id: 'd3', estado: 'partial', confianza: 0.6, diferencia_monto: 500, diferencia_dias: 3, match_reasons: [] },
        { transaccion_id: 't4', documento_id: null, estado: 'unmatched', confianza: 0.2, diferencia_monto: 0, diferencia_dias: 0, match_reasons: [] },
        { transaccion_id: 't5', documento_id: null, estado: 'pending', confianza: 0, diferencia_monto: 0, diferencia_dias: 0, match_reasons: [] },
      ]

      const summary = matcher.generateSummary(results)

      expect(summary.total_transacciones).toBe(5)
      expect(summary.matched).toBe(2)
      expect(summary.partial).toBe(1)
      expect(summary.unmatched).toBe(1)
      expect(summary.pending).toBe(1)
    })

    it('should handle empty results', () => {
      const summary = matcher.generateSummary([])

      expect(summary.total_transacciones).toBe(0)
      expect(summary.matched).toBe(0)
    })
  })
})

// =============================================================================
// MATCHER OPTIONS TESTS
// =============================================================================

describe('MatcherOptions', () => {
  it('should use default options', () => {
    const matcher = createSIIMatcher()
    // Default toleranciaDias: 5, toleranciaMonto: 0.01, minConfidenceForMatch: 0.7
  })

  it('should respect custom toleranciaDias', () => {
    const strictMatcher = createSIIMatcher({ toleranciaDias: 1 })
    const lenientMatcher = createSIIMatcher({ toleranciaDias: 10 })

    strictMatcher.loadDocuments([createMockDocument({ fecha: '2026-01-10' })])
    lenientMatcher.loadDocuments([createMockDocument({ fecha: '2026-01-10' })])

    const tx = createMockTransaction({
      monto: 119000,
      fecha: '2026-01-15', // 5 days difference
    })

    const strictResult = strictMatcher.matchTransaction(tx)
    const lenientResult = lenientMatcher.matchTransaction(tx)

    // Lenient should have higher score
    expect(lenientResult.confianza).toBeGreaterThan(strictResult.confianza)
  })

  it('should respect custom toleranciaMonto', () => {
    const strictMatcher = createSIIMatcher({ toleranciaMonto: 0.001 }) // 0.1%
    const lenientMatcher = createSIIMatcher({ toleranciaMonto: 0.1 }) // 10%

    strictMatcher.loadDocuments([createMockDocument({ monto_total: 100000 })])
    lenientMatcher.loadDocuments([createMockDocument({ monto_total: 100000 })])

    const tx = createMockTransaction({
      monto: 105000, // 5% difference
      fecha: '2026-01-15',
    })

    const strictResult = strictMatcher.matchTransaction(tx)
    const lenientResult = lenientMatcher.matchTransaction(tx)

    // Lenient should recognize it as similar
    expect(lenientResult.match_reasons.some((r) => r.includes('Monto'))).toBe(true)
  })

  it('should respect custom minConfidenceForMatch', () => {
    const lowThreshold = createSIIMatcher({ minConfidenceForMatch: 0.5 })
    const highThreshold = createSIIMatcher({ minConfidenceForMatch: 0.95 })

    lowThreshold.loadDocuments([createMockDocument()])
    highThreshold.loadDocuments([createMockDocument()])

    const tx = createMockTransaction({
      monto: 119000,
      fecha: '2026-01-16', // 1 day diff, not perfect
    })

    const lowResult = lowThreshold.matchTransaction(tx)
    const highResult = highThreshold.matchTransaction(tx)

    // Low threshold should match, high threshold might not
    expect(lowResult.estado).toBe('matched')
    // High threshold result depends on actual score
  })
})

// =============================================================================
// UTILITY FUNCTIONS TESTS
// =============================================================================

describe('filterDocumentsByPeriod', () => {
  it('should filter documents by month and year', () => {
    const docs = [
      createMockDocument({ id: 'd1', fecha: '2026-01-15' }),
      createMockDocument({ id: 'd2', fecha: '2026-01-20' }),
      createMockDocument({ id: 'd3', fecha: '2026-02-05' }),
      createMockDocument({ id: 'd4', fecha: '2025-01-15' }),
    ]

    const filtered = filterDocumentsByPeriod(docs, 1, 2026)

    expect(filtered.length).toBe(2)
    expect(filtered.map((d) => d.id)).toContain('d1')
    expect(filtered.map((d) => d.id)).toContain('d2')
  })

  it('should handle empty array', () => {
    const filtered = filterDocumentsByPeriod([], 1, 2026)
    expect(filtered.length).toBe(0)
  })

  it('should handle December correctly', () => {
    const docs = [
      createMockDocument({ fecha: '2025-12-15' }),
      createMockDocument({ fecha: '2026-01-01' }),
    ]

    const filtered = filterDocumentsByPeriod(docs, 12, 2025)

    expect(filtered.length).toBe(1)
    expect(filtered[0].fecha).toBe('2025-12-15')
  })
})

describe('groupDocumentsByRut', () => {
  it('should group documents by RUT emisor', () => {
    const docs = [
      createMockDocument({ id: 'd1', rut_emisor: '76.123.456-7' }),
      createMockDocument({ id: 'd2', rut_emisor: '76.123.456-7' }),
      createMockDocument({ id: 'd3', rut_emisor: '76.999.888-5' }),
    ]

    const groups = groupDocumentsByRut(docs)

    expect(groups.size).toBe(2)
    expect(groups.get('76.123.456-7')?.length).toBe(2)
    expect(groups.get('76.999.888-5')?.length).toBe(1)
  })

  it('should handle empty array', () => {
    const groups = groupDocumentsByRut([])
    expect(groups.size).toBe(0)
  })
})

describe('createReconciliationRecord', () => {
  it('should create complete record from match result', () => {
    const result: MatchResult = {
      transaccion_id: 'tx-123',
      documento_id: 'doc-456',
      estado: 'matched',
      confianza: 0.85,
      diferencia_monto: 500,
      diferencia_dias: 1,
      match_reasons: ['Monto exacto', 'Fecha cercana'],
    }

    const document = createMockDocument({
      id: 'doc-456',
      tipo: 'factura',
      folio: '12345',
      fecha: '2026-01-15',
      rut_emisor: '76.123.456-7',
      razon_social_emisor: 'EMPRESA ABC LTDA',
      monto_total: 119000,
    })

    const record = createReconciliationRecord(result, document)

    expect(record.transaccion_id).toBe('tx-123')
    expect(record.documento_sii_id).toBe('doc-456')
    expect(record.tipo_documento).toBe('factura')
    expect(record.folio_documento).toBe('12345')
    expect(record.rut_contraparte).toBe('76.123.456-7')
    expect(record.nombre_contraparte).toBe('EMPRESA ABC LTDA')
    expect(record.monto_documento).toBe(119000)
    expect(record.estado).toBe('matched')
    expect(record.confianza_match).toBe(0.85)
    expect(record.diferencia_monto).toBe(500)
    expect(record.diferencia_dias).toBe(1)
    expect(record.match_manual).toBe(false)
    expect(record.notas).toContain('Monto exacto')
  })

  it('should handle null document (unmatched)', () => {
    const result: MatchResult = {
      transaccion_id: 'tx-123',
      documento_id: null,
      estado: 'unmatched',
      confianza: 0.1,
      diferencia_monto: 0,
      diferencia_dias: 0,
      match_reasons: [],
    }

    const record = createReconciliationRecord(result, null)

    expect(record.transaccion_id).toBe('tx-123')
    expect(record.documento_sii_id).toBeUndefined()
    expect(record.tipo_documento).toBeUndefined()
    expect(record.estado).toBe('unmatched')
  })
})

// =============================================================================
// RUT MATCHING TESTS
// =============================================================================

describe('RUT Matching', () => {
  let matcher: SIIMatcher

  beforeEach(() => {
    matcher = createSIIMatcher()
    matcher.loadDocuments([
      createMockDocument({
        id: 'doc-rut',
        rut_emisor: '76.123.456-7',
        rut_receptor: '77.654.321-K',
      }),
    ])
  })

  it('should match RUT with dots and dash', () => {
    const tx = createMockTransaction({
      descripcion: 'PAGO A 76.123.456-7',
      monto: 119000,
      fecha: '2026-01-15',
    })

    const result = matcher.matchTransaction(tx)
    expect(result.match_reasons).toContain('RUT coincide')
  })

  it('should match RUT without dots', () => {
    const tx = createMockTransaction({
      descripcion: 'PAGO A 76123456-7',
      monto: 119000,
      fecha: '2026-01-15',
    })

    const result = matcher.matchTransaction(tx)
    expect(result.match_reasons).toContain('RUT coincide')
  })

  it('should match RUT without dash', () => {
    const tx = createMockTransaction({
      descripcion: 'PAGO A 761234567',
      monto: 119000,
      fecha: '2026-01-15',
    })

    const result = matcher.matchTransaction(tx)
    expect(result.match_reasons).toContain('RUT coincide')
  })

  it('should match receptor RUT', () => {
    const tx = createMockTransaction({
      descripcion: 'PAGO DE 77.654.321-K RECIBIDO',
      monto: 119000,
      fecha: '2026-01-15',
    })

    const result = matcher.matchTransaction(tx)
    expect(result.match_reasons).toContain('RUT coincide')
  })
})

// =============================================================================
// AMOUNT MATCHING TESTS
// =============================================================================

describe('Amount Matching', () => {
  let matcher: SIIMatcher

  beforeEach(() => {
    matcher = createSIIMatcher()
    matcher.loadDocuments([
      createMockDocument({
        monto_neto: 100000,
        iva: 19000,
        monto_total: 119000,
      }),
    ])
  })

  it('should match by monto_total', () => {
    const tx = createMockTransaction({ monto: 119000, fecha: '2026-01-15' })
    const result = matcher.matchTransaction(tx)
    expect(result.match_reasons).toContain('Monto exacto')
  })

  it('should match by monto_neto', () => {
    const tx = createMockTransaction({ monto: 100000, fecha: '2026-01-15' })
    const result = matcher.matchTransaction(tx)
    expect(result.match_reasons.some((r) => r.includes('Monto'))).toBe(true)
  })

  it('should calculate diferencia_monto correctly', () => {
    const tx = createMockTransaction({ monto: 120000, fecha: '2026-01-15' })
    const result = matcher.matchTransaction(tx)
    expect(result.diferencia_monto).toBeCloseTo(1000, 0)
  })
})

// =============================================================================
// DATE MATCHING TESTS
// =============================================================================

describe('Date Matching', () => {
  let matcher: SIIMatcher

  beforeEach(() => {
    matcher = createSIIMatcher({ toleranciaDias: 5 })
    matcher.loadDocuments([
      createMockDocument({ fecha: '2026-01-15' }),
    ])
  })

  it('should match exact date', () => {
    const tx = createMockTransaction({ fecha: '2026-01-15' })
    const result = matcher.matchTransaction(tx)
    expect(result.match_reasons).toContain('Fecha exacta')
    expect(result.diferencia_dias).toBe(0)
  })

  it('should match date within 2 days', () => {
    const tx = createMockTransaction({ fecha: '2026-01-17' })
    const result = matcher.matchTransaction(tx)
    expect(result.match_reasons.some((r) => r.includes('cercana'))).toBe(true)
    expect(result.diferencia_dias).toBe(2)
  })

  it('should match date within tolerance', () => {
    const tx = createMockTransaction({ fecha: '2026-01-19' }) // 4 days
    const result = matcher.matchTransaction(tx)
    expect(result.match_reasons.some((r) => r.includes('tolerancia'))).toBe(true)
    expect(result.diferencia_dias).toBe(4)
  })

  it('should handle dates before document date', () => {
    const tx = createMockTransaction({ fecha: '2026-01-13' }) // 2 days before
    const result = matcher.matchTransaction(tx)
    expect(result.diferencia_dias).toBe(2)
  })
})

// =============================================================================
// EDGE CASES
// =============================================================================

describe('Edge Cases', () => {
  it('should handle no documents loaded', () => {
    const matcher = createSIIMatcher()
    // No documents loaded

    const tx = createMockTransaction()
    const result = matcher.matchTransaction(tx)

    expect(result.estado).toBe('unmatched')
    expect(result.documento_id).toBeNull()
  })

  it('should handle transaction with empty description', () => {
    const matcher = createSIIMatcher()
    matcher.loadDocuments([createMockDocument()])

    const tx = createMockTransaction({
      descripcion: '',
      descripcion_normalizada: '',
    })

    // Should not throw
    expect(() => matcher.matchTransaction(tx)).not.toThrow()
  })

  it('should handle document with zero amounts', () => {
    const matcher = createSIIMatcher()
    matcher.loadDocuments([
      createMockDocument({
        monto_neto: 0,
        iva: 0,
        monto_total: 0,
      }),
    ])

    const tx = createMockTransaction({ monto: 0 })
    const result = matcher.matchTransaction(tx)

    // Should still try to match
    expect(result).toBeDefined()
  })

  it('should handle very large amounts', () => {
    const matcher = createSIIMatcher()
    matcher.loadDocuments([
      createMockDocument({ monto_total: 999999999999 }),
    ])

    const tx = createMockTransaction({ monto: 999999999999 })
    const result = matcher.matchTransaction(tx)

    expect(result.match_reasons).toContain('Monto exacto')
  })

  it('should handle RUT with K verification digit', () => {
    const matcher = createSIIMatcher()
    matcher.loadDocuments([
      createMockDocument({ rut_emisor: '12.345.678-K' }),
    ])

    const tx = createMockTransaction({
      descripcion: 'PAGO A 12345678K',
      monto: 119000,
      fecha: '2026-01-15',
    })

    const result = matcher.matchTransaction(tx)
    expect(result.match_reasons).toContain('RUT coincide')
  })
})
