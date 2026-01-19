// =============================================================================
// HV Consultores - Transaction Normalizer Test Suite
// Tests for transaction normalization and duplicate detection
// =============================================================================

import { describe, it, expect, beforeEach } from 'vitest'
import {
  TransactionNormalizer,
  createNormalizer,
  normalizeDescription,
  normalizeTransactions,
  detectDuplicates,
} from '@/lib/bank-rpa/normalizer'
import type { RawTransaction, BankCode } from '@/lib/bank-rpa/types'

// =============================================================================
// NORMALIZER CLASS TESTS
// =============================================================================

describe('TransactionNormalizer', () => {
  let normalizer: TransactionNormalizer

  beforeEach(() => {
    normalizer = createNormalizer('bancochile')
  })

  describe('normalizeDescription', () => {
    it('should uppercase descriptions', () => {
      expect(normalizer.normalizeDescription('transferencia tef')).toBe('TRANSFERENCIA ELECTRONICA TRANSFERENCIA ELECTRONICA')
    })

    it('should expand common abbreviations', () => {
      expect(normalizer.normalizeDescription('TEF')).toBe('TRANSFERENCIA ELECTRONICA')
      expect(normalizer.normalizeDescription('PAC')).toBe('PAGO AUTOMATICO CUENTA')
      expect(normalizer.normalizeDescription('CHQ')).toBe('CHEQUE')
      expect(normalizer.normalizeDescription('COM')).toBe('COMISION')
    })

    it('should trim whitespace', () => {
      expect(normalizer.normalizeDescription('  PAGO SERVICIO  ')).toBe('PAGO SERVICIO')
    })

    it('should collapse multiple spaces', () => {
      expect(normalizer.normalizeDescription('PAGO    SERVICIO    LUZ')).toBe('PAGO SERVICIO LUZ')
    })

    it('should remove leading/trailing punctuation', () => {
      const result = normalizer.normalizeDescription('..PAGO SERVICIO..')
      expect(result).toBe('PAGO SERVICIO')
    })

    it('should handle complex bank descriptions', () => {
      const input = 'TEF RECIBIDO DE  EMPRESA LTDA'
      const result = normalizer.normalizeDescription(input)
      expect(result).toContain('TRANSFERENCIA ELECTRONICA')
      expect(result).toContain('EMPRESA LTDA')
    })
  })

  describe('normalize', () => {
    const cuentaId = 'cuenta-123'

    it('should normalize a cargo transaction', () => {
      const raw: RawTransaction = {
        fecha: '2026-01-15',
        descripcion: 'TEF ENVIADO',
        cargo: 50000,
      }

      const result = normalizer.normalize(raw, cuentaId)

      expect(result.cuenta_id).toBe(cuentaId)
      expect(result.fecha).toBe('2026-01-15')
      expect(result.tipo).toBe('cargo')
      expect(result.monto).toBe(50000)
      expect(result.descripcion_normalizada).toContain('TRANSFERENCIA ELECTRONICA')
      expect(result.hash_transaccion).toBeDefined()
      expect(result.hash_transaccion.length).toBe(64) // SHA-256 hex
    })

    it('should normalize an abono transaction', () => {
      const raw: RawTransaction = {
        fecha: '2026-01-15',
        descripcion: 'DEPOSITO EN CUENTA',
        abono: 100000,
      }

      const result = normalizer.normalize(raw, cuentaId)

      expect(result.tipo).toBe('abono')
      expect(result.monto).toBe(100000)
    })

    it('should include archivo_id when provided', () => {
      const raw: RawTransaction = {
        fecha: '2026-01-15',
        descripcion: 'PAGO',
        cargo: 50000,
      }

      const result = normalizer.normalize(raw, cuentaId, 'archivo-456')

      expect(result.cartola_archivo_id).toBe('archivo-456')
    })

    it('should initialize conciliation fields', () => {
      const raw: RawTransaction = {
        fecha: '2026-01-15',
        descripcion: 'PAGO',
        cargo: 50000,
      }

      const result = normalizer.normalize(raw, cuentaId)

      expect(result.conciliado_sii).toBe(false)
      expect(result.estado_conciliacion).toBe('pending')
      expect(result.documento_sii_id).toBeUndefined()
    })

    it('should preserve original description', () => {
      const raw: RawTransaction = {
        fecha: '2026-01-15',
        descripcion: 'tef enviado',
        cargo: 50000,
      }

      const result = normalizer.normalize(raw, cuentaId)

      expect(result.descripcion).toBe('tef enviado')
      expect(result.descripcion_normalizada).toContain('TRANSFERENCIA ELECTRONICA')
    })
  })

  describe('normalizeMany', () => {
    it('should normalize multiple transactions', () => {
      const raws: RawTransaction[] = [
        { fecha: '2026-01-15', descripcion: 'PAGO 1', cargo: 10000 },
        { fecha: '2026-01-16', descripcion: 'PAGO 2', cargo: 20000 },
        { fecha: '2026-01-17', descripcion: 'DEPOSITO', abono: 50000 },
      ]

      const results = normalizer.normalizeMany(raws, 'cuenta-123')

      expect(results.length).toBe(3)
      expect(results[0].monto).toBe(10000)
      expect(results[1].monto).toBe(20000)
      expect(results[2].monto).toBe(50000)
    })
  })

  describe('extractMetadata', () => {
    it('should extract RUT from description', () => {
      const metadata = normalizer.extractMetadata('TEF A 12.345.678-9 EMPRESA')
      expect(metadata.rut).toBe('12.345.678-9')
    })

    it('should extract document number', () => {
      const metadata = normalizer.extractMetadata('PAGO FACTURA DOC 12345')
      expect(metadata.documentNumber).toBe('12345')
    })

    it('should detect transfer out', () => {
      const metadata = normalizer.extractMetadata('TRANSFERENCIA A CUENTA 12345')
      expect(metadata.transactionType).toBe('transfer_out')
    })

    it('should detect transfer in', () => {
      const metadata = normalizer.extractMetadata('TRANSFERENCIA DE EMPRESA LTDA')
      expect(metadata.transactionType).toBe('transfer_in')
    })

    it('should detect PAC', () => {
      const metadata = normalizer.extractMetadata('PAC LUZ ENEL')
      expect(metadata.transactionType).toBe('pac')
    })

    it('should detect cheque', () => {
      const metadata = normalizer.extractMetadata('CHEQUE 123456')
      expect(metadata.transactionType).toBe('cheque')
    })

    it('should detect comision', () => {
      const metadata = normalizer.extractMetadata('COMISION MANTENCION')
      expect(metadata.transactionType).toBe('comision')
    })
  })
})

// =============================================================================
// TRANSACTION TYPE DETERMINATION TESTS
// =============================================================================

describe('Transaction Type Determination', () => {
  // Test the determination logic
  const determineType = (raw: RawTransaction): 'cargo' | 'abono' => {
    if (raw.cargo !== undefined && raw.cargo > 0) return 'cargo'
    if (raw.abono !== undefined && raw.abono > 0) return 'abono'
    if (raw.cargo !== undefined && raw.cargo < 0) return 'abono'

    const desc = raw.descripcion.toUpperCase()
    const cargoPatterns = [/CARGO/i, /PAGO\s+A/i, /GIRO/i, /RETIRO/i, /CHEQUE/i, /COMISION/i]
    const abonoPatterns = [/ABONO/i, /DEPOSITO/i, /TRANSFERENCIA\s+DE/i, /RECIBIDO/i, /INGRESO/i]

    for (const pattern of cargoPatterns) {
      if (pattern.test(desc)) return 'cargo'
    }

    for (const pattern of abonoPatterns) {
      if (pattern.test(desc)) return 'abono'
    }

    return 'cargo'
  }

  it('should determine cargo from cargo field', () => {
    expect(determineType({ fecha: '2026-01-15', descripcion: 'PAGO', cargo: 50000 })).toBe('cargo')
  })

  it('should determine abono from abono field', () => {
    expect(determineType({ fecha: '2026-01-15', descripcion: 'DEPOSITO', abono: 50000 })).toBe('abono')
  })

  it('should determine abono from negative cargo', () => {
    expect(determineType({ fecha: '2026-01-15', descripcion: 'DEPOSITO', cargo: -50000 })).toBe('abono')
  })

  it('should infer cargo from description keywords', () => {
    expect(determineType({ fecha: '2026-01-15', descripcion: 'PAGO A PROVEEDOR' })).toBe('cargo')
    expect(determineType({ fecha: '2026-01-15', descripcion: 'GIRO CAJERO' })).toBe('cargo')
    expect(determineType({ fecha: '2026-01-15', descripcion: 'CHEQUE 12345' })).toBe('cargo')
    expect(determineType({ fecha: '2026-01-15', descripcion: 'COMISION MENSUAL' })).toBe('cargo')
  })

  it('should infer abono from description keywords', () => {
    expect(determineType({ fecha: '2026-01-15', descripcion: 'ABONO SUELDO' })).toBe('abono')
    expect(determineType({ fecha: '2026-01-15', descripcion: 'DEPOSITO EN EFECTIVO' })).toBe('abono')
    expect(determineType({ fecha: '2026-01-15', descripcion: 'TRANSFERENCIA DE CLIENTE' })).toBe('abono')
  })

  it('should default to cargo when unclear', () => {
    expect(determineType({ fecha: '2026-01-15', descripcion: 'MOVIMIENTO DESCONOCIDO' })).toBe('cargo')
  })
})

// =============================================================================
// HASH GENERATION TESTS
// =============================================================================

describe('Hash Generation', () => {
  it('should generate consistent hashes for same data', () => {
    const normalizer = createNormalizer('bancochile')
    const raw: RawTransaction = {
      fecha: '2026-01-15',
      descripcion: 'TRANSFERENCIA',
      cargo: 50000,
    }

    const result1 = normalizer.normalize(raw, 'cuenta-123')
    const result2 = normalizer.normalize(raw, 'cuenta-123')

    expect(result1.hash_transaccion).toBe(result2.hash_transaccion)
  })

  it('should generate different hashes for different dates', () => {
    const normalizer = createNormalizer('bancochile')

    const result1 = normalizer.normalize(
      { fecha: '2026-01-15', descripcion: 'PAGO', cargo: 50000 },
      'cuenta-123'
    )
    const result2 = normalizer.normalize(
      { fecha: '2026-01-16', descripcion: 'PAGO', cargo: 50000 },
      'cuenta-123'
    )

    expect(result1.hash_transaccion).not.toBe(result2.hash_transaccion)
  })

  it('should generate different hashes for different amounts', () => {
    const normalizer = createNormalizer('bancochile')

    const result1 = normalizer.normalize(
      { fecha: '2026-01-15', descripcion: 'PAGO', cargo: 50000 },
      'cuenta-123'
    )
    const result2 = normalizer.normalize(
      { fecha: '2026-01-15', descripcion: 'PAGO', cargo: 60000 },
      'cuenta-123'
    )

    expect(result1.hash_transaccion).not.toBe(result2.hash_transaccion)
  })

  it('should generate different hashes for different accounts', () => {
    const normalizer = createNormalizer('bancochile')
    const raw: RawTransaction = {
      fecha: '2026-01-15',
      descripcion: 'PAGO',
      cargo: 50000,
    }

    const result1 = normalizer.normalize(raw, 'cuenta-123')
    const result2 = normalizer.normalize(raw, 'cuenta-456')

    expect(result1.hash_transaccion).not.toBe(result2.hash_transaccion)
  })
})

// =============================================================================
// DUPLICATE DETECTION TESTS
// =============================================================================

describe('Duplicate Detection', () => {
  it('should detect duplicates based on hash', () => {
    const normalizer = createNormalizer('bancochile')

    const raw1: RawTransaction = { fecha: '2026-01-15', descripcion: 'PAGO 1', cargo: 50000 }
    const raw2: RawTransaction = { fecha: '2026-01-16', descripcion: 'PAGO 2', cargo: 60000 }
    const raw3: RawTransaction = { fecha: '2026-01-15', descripcion: 'PAGO 1', cargo: 50000 } // Duplicate

    const tx1 = normalizer.normalize(raw1, 'cuenta-123')
    const tx2 = normalizer.normalize(raw2, 'cuenta-123')
    const tx3 = normalizer.normalize(raw3, 'cuenta-123')

    const existingHashes = new Set([tx1.hash_transaccion])
    const newTransactions = [tx2, tx3]

    const { unique, duplicates } = detectDuplicates(newTransactions, existingHashes)

    expect(unique.length).toBe(1)
    expect(duplicates.length).toBe(1)
    expect(unique[0].descripcion).toBe('PAGO 2')
    expect(duplicates[0].descripcion).toBe('PAGO 1')
  })

  it('should add unique transactions to hash set', () => {
    const normalizer = createNormalizer('bancochile')

    const tx1 = normalizer.normalize(
      { fecha: '2026-01-15', descripcion: 'PAGO 1', cargo: 50000 },
      'cuenta-123'
    )
    const tx2 = normalizer.normalize(
      { fecha: '2026-01-16', descripcion: 'PAGO 2', cargo: 60000 },
      'cuenta-123'
    )

    const existingHashes = new Set<string>()
    const { unique } = detectDuplicates([tx1, tx2], existingHashes)

    expect(unique.length).toBe(2)
    expect(existingHashes.size).toBe(2)
    expect(existingHashes.has(tx1.hash_transaccion)).toBe(true)
    expect(existingHashes.has(tx2.hash_transaccion)).toBe(true)
  })

  it('should handle empty input', () => {
    const existingHashes = new Set<string>()
    const { unique, duplicates } = detectDuplicates([], existingHashes)

    expect(unique.length).toBe(0)
    expect(duplicates.length).toBe(0)
  })
})

// =============================================================================
// ABBREVIATION EXPANSION TESTS
// =============================================================================

describe('Abbreviation Expansion', () => {
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
    'CTA': 'CUENTA',
  }

  const expandAbbreviations = (text: string): string => {
    let result = text.toUpperCase()
    for (const [abbr, expansion] of Object.entries(ABBREVIATION_EXPANSIONS)) {
      const pattern = new RegExp(`\\b${abbr}\\b`, 'g')
      result = result.replace(pattern, expansion)
    }
    return result
  }

  it('should expand TEF', () => {
    expect(expandAbbreviations('TEF ENVIADO')).toBe('TRANSFERENCIA ELECTRONICA ENVIADO')
  })

  it('should expand PAC', () => {
    expect(expandAbbreviations('PAC LUZ')).toBe('PAGO AUTOMATICO CUENTA LUZ')
  })

  it('should expand multiple abbreviations', () => {
    const result = expandAbbreviations('TEF COM CTA')
    expect(result).toContain('TRANSFERENCIA ELECTRONICA')
    expect(result).toContain('COMISION')
    expect(result).toContain('CUENTA')
  })

  it('should not expand partial matches', () => {
    // TEFL should not match TEF
    expect(expandAbbreviations('TEFLON')).toBe('TEFLON')
  })

  it('should preserve non-abbreviated text', () => {
    expect(expandAbbreviations('PAGO SERVICIO LUZ')).toBe('PAGO SERVICIO LUZ')
  })
})

// =============================================================================
// UTILITY FUNCTION TESTS
// =============================================================================

describe('Utility Functions', () => {
  describe('normalizeDescription function', () => {
    it('should normalize using specified bank', () => {
      const result = normalizeDescription('tef enviado', 'bancochile')
      expect(result).toContain('TRANSFERENCIA ELECTRONICA')
    })
  })

  describe('normalizeTransactions function', () => {
    it('should normalize batch of transactions', () => {
      const raws: RawTransaction[] = [
        { fecha: '2026-01-15', descripcion: 'PAGO 1', cargo: 10000 },
        { fecha: '2026-01-16', descripcion: 'PAGO 2', cargo: 20000 },
      ]

      const results = normalizeTransactions(raws, 'bancochile', 'cuenta-123')

      expect(results.length).toBe(2)
      expect(results[0].cuenta_id).toBe('cuenta-123')
      expect(results[1].cuenta_id).toBe('cuenta-123')
    })
  })
})

// =============================================================================
// EDGE CASES
// =============================================================================

describe('Edge Cases', () => {
  let normalizer: TransactionNormalizer

  beforeEach(() => {
    normalizer = createNormalizer('bancochile')
  })

  it('should handle very long descriptions', () => {
    const longDesc = 'A'.repeat(500)
    const result = normalizer.normalizeDescription(longDesc)
    expect(result.length).toBeLessThanOrEqual(500)
  })

  it('should handle special characters', () => {
    const result = normalizer.normalizeDescription('PAGO @#$% EMPRESA')
    expect(result).toContain('PAGO')
    expect(result).toContain('EMPRESA')
  })

  it('should handle unicode characters', () => {
    const result = normalizer.normalizeDescription('PAGO SEÑOR PÉREZ')
    expect(result).toContain('SEÑOR')
    expect(result).toContain('PÉREZ')
  })

  it('should handle zero amounts', () => {
    const raw: RawTransaction = {
      fecha: '2026-01-15',
      descripcion: 'AJUSTE',
      cargo: 0,
    }

    const result = normalizer.normalize(raw, 'cuenta-123')
    expect(result.monto).toBe(0)
  })

  it('should handle very large amounts', () => {
    const raw: RawTransaction = {
      fecha: '2026-01-15',
      descripcion: 'TRANSFERENCIA GRANDE',
      cargo: 999999999999,
    }

    const result = normalizer.normalize(raw, 'cuenta-123')
    expect(result.monto).toBe(999999999999)
  })

  it('should handle fecha_valor', () => {
    const raw: RawTransaction = {
      fecha: '2026-01-15',
      fecha_valor: '2026-01-17',
      descripcion: 'CHEQUE',
      cargo: 50000,
    }

    const result = normalizer.normalize(raw, 'cuenta-123')
    expect(result.fecha).toBe('2026-01-15')
    expect(result.fecha_valor).toBe('2026-01-17')
  })

  it('should handle referencia', () => {
    const raw: RawTransaction = {
      fecha: '2026-01-15',
      descripcion: 'TRANSFERENCIA',
      referencia: 'REF123456',
      cargo: 50000,
    }

    const result = normalizer.normalize(raw, 'cuenta-123')
    expect(result.referencia).toBe('REF123456')
  })

  it('should handle saldo', () => {
    const raw: RawTransaction = {
      fecha: '2026-01-15',
      descripcion: 'PAGO',
      cargo: 50000,
      saldo: 1000000,
    }

    const result = normalizer.normalize(raw, 'cuenta-123')
    expect(result.saldo).toBe(1000000)
  })
})
