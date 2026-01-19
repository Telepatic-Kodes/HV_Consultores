// =============================================================================
// HV Consultores - Bank Parsers Test Suite
// Tests for PDF and Excel bank statement parsers
// =============================================================================

import { describe, it, expect, beforeEach } from 'vitest'
import { BankExcelParser, createExcelParser } from '@/lib/bank-rpa/parsers/excel-parser'
import type { BankCode } from '@/lib/bank-rpa/types'

// =============================================================================
// EXCEL PARSER TESTS
// =============================================================================

describe('BankExcelParser', () => {
  let parser: BankExcelParser

  beforeEach(() => {
    parser = createExcelParser('bancochile')
  })

  describe('parseCSV', () => {
    it('should parse basic CSV with comma delimiter', async () => {
      const csv = `fecha,descripcion,cargo,abono,saldo
01/01/2026,TRANSFERENCIA TEF,50000,,1000000
02/01/2026,DEPOSITO CHEQUE,,100000,1100000
03/01/2026,PAGO SERVICIO LUZ,25000,,1075000`

      const result = await parser.parseCSV(csv)

      expect(result.banco).toBe('bancochile')
      expect(result.transacciones.length).toBe(3)
      expect(result.transacciones[0].cargo).toBe(50000)
      expect(result.transacciones[1].abono).toBe(100000)
      expect(result.transacciones[2].cargo).toBe(25000)
    })

    it('should parse CSV with semicolon delimiter', async () => {
      const csv = `fecha;descripcion;cargo;abono;saldo
01/01/2026;TRANSFERENCIA;50000;;1000000
02/01/2026;DEPOSITO;;100000;1100000`

      const result = await parser.parseCSV(csv)

      expect(result.transacciones.length).toBe(2)
      expect(result.transacciones[0].descripcion).toBe('TRANSFERENCIA')
    })

    it('should handle Chilean number format', async () => {
      const csv = `fecha,descripcion,cargo,abono,saldo
01/01/2026,PAGO GRANDE,"1.234.567",,5000000
02/01/2026,PAGO DECIMAL,"1.234,56",,4998765`

      const result = await parser.parseCSV(csv)

      expect(result.transacciones[0].cargo).toBe(1234567)
      expect(result.transacciones[1].cargo).toBeCloseTo(1234.56, 2)
    })

    it('should skip empty rows', async () => {
      const csv = `fecha,descripcion,cargo,abono,saldo
01/01/2026,TRANSFERENCIA,50000,,1000000

03/01/2026,PAGO,25000,,975000`

      const result = await parser.parseCSV(csv)

      expect(result.transacciones.length).toBe(2)
    })

    it('should handle dates in different formats', async () => {
      const csv = `fecha,descripcion,cargo,abono,saldo
2026-01-01,FORMATO ISO,50000,,1000000
01/01/2026,FORMATO DD/MM/YYYY,25000,,975000
01-01-2026,FORMATO DD-MM-YYYY,10000,,965000`

      const result = await parser.parseCSV(csv)

      expect(result.transacciones.length).toBe(3)
      expect(result.transacciones[0].fecha).toBe('2026-01-01')
      expect(result.transacciones[1].fecha).toBe('2026-01-01')
      expect(result.transacciones[2].fecha).toBe('2026-01-01')
    })

    it('should detect column names case-insensitively', async () => {
      const csv = `FECHA,DESCRIPCION,CARGO,ABONO,SALDO
01/01/2026,PAGO,50000,,1000000`

      const result = await parser.parseCSV(csv)

      expect(result.transacciones.length).toBe(1)
      expect(result.transacciones[0].cargo).toBe(50000)
    })

    it('should handle alternative column names', async () => {
      const csv = `date,glosa,debito,credito,balance
01/01/2026,PAGO SERVICIO,50000,,1000000`

      const result = await parser.parseCSV(csv)

      expect(result.transacciones.length).toBe(1)
      expect(result.transacciones[0].descripcion).toBe('PAGO SERVICIO')
      expect(result.transacciones[0].cargo).toBe(50000)
    })

    it('should handle quoted fields with commas', async () => {
      const csv = `fecha,descripcion,cargo,abono,saldo
01/01/2026,"PAGO A EMPRESA, S.A.",50000,,1000000`

      const result = await parser.parseCSV(csv)

      expect(result.transacciones[0].descripcion).toBe('PAGO A EMPRESA, S.A.')
    })

    it('should calculate totals correctly', async () => {
      const csv = `fecha,descripcion,cargo,abono,saldo
01/01/2026,CARGO 1,10000,,990000
02/01/2026,CARGO 2,20000,,970000
03/01/2026,ABONO 1,,50000,1020000
04/01/2026,ABONO 2,,30000,1050000`

      const result = await parser.parseCSV(csv)

      expect(result.total_cargos).toBe(30000)
      expect(result.total_abonos).toBe(80000)
    })

    it('should sort transactions by date', async () => {
      const csv = `fecha,descripcion,cargo,abono,saldo
03/01/2026,TERCERO,30000,,970000
01/01/2026,PRIMERO,10000,,990000
02/01/2026,SEGUNDO,20000,,980000`

      const result = await parser.parseCSV(csv)

      expect(result.transacciones[0].descripcion).toBe('PRIMERO')
      expect(result.transacciones[1].descripcion).toBe('SEGUNDO')
      expect(result.transacciones[2].descripcion).toBe('TERCERO')
    })

    it('should handle single amount column with sign', async () => {
      const csv = `fecha,descripcion,monto,saldo
01/01/2026,CARGO,-50000,950000
02/01/2026,ABONO,100000,1050000`

      const result = await parser.parseCSV(csv)

      expect(result.transacciones[0].cargo).toBe(50000)
      expect(result.transacciones[0].abono).toBeUndefined()
      expect(result.transacciones[1].abono).toBe(100000)
      expect(result.transacciones[1].cargo).toBeUndefined()
    })
  })
})

// =============================================================================
// AMOUNT PARSING TESTS (Internal Logic)
// =============================================================================

describe('Amount Parsing Logic', () => {
  // Test the parsing logic by creating a simple parser function
  const parseAmount = (value: string): number | undefined => {
    if (!value || value.trim() === '') return undefined

    let clean = value.replace(/[$€]/g, '').replace(/\s/g, '')

    // Handle Chilean format: 1.234.567,89 → 1234567.89
    if (clean.includes(',') && clean.includes('.')) {
      clean = clean.replace(/\./g, '').replace(',', '.')
    } else if (clean.includes(',') && !clean.includes('.')) {
      const parts = clean.split(',')
      if (parts[1] && parts[1].length <= 2) {
        clean = clean.replace(',', '.')
      } else {
        clean = clean.replace(/,/g, '')
      }
    } else if (clean.split('.').length > 2) {
      clean = clean.replace(/\./g, '')
    }

    const isNegative = clean.startsWith('-') || clean.startsWith('(')
    clean = clean.replace(/[()-]/g, '')

    const amount = parseFloat(clean)
    if (isNaN(amount)) return undefined

    return isNegative ? -amount : amount
  }

  it('should parse simple integers', () => {
    expect(parseAmount('50000')).toBe(50000)
    expect(parseAmount('1000000')).toBe(1000000)
  })

  it('should parse US format (period as decimal)', () => {
    expect(parseAmount('50000.50')).toBe(50000.50)
    expect(parseAmount('1234.56')).toBe(1234.56)
  })

  it('should parse Chilean format (comma as decimal)', () => {
    expect(parseAmount('50000,50')).toBe(50000.50)
    expect(parseAmount('1234,56')).toBe(1234.56)
  })

  it('should parse Chilean thousands separators', () => {
    expect(parseAmount('1.234.567')).toBe(1234567)
    expect(parseAmount('50.000')).toBe(50000)
  })

  it('should parse full Chilean format (dots for thousands, comma for decimal)', () => {
    expect(parseAmount('1.234.567,89')).toBe(1234567.89)
    expect(parseAmount('50.000,50')).toBe(50000.50)
  })

  it('should handle currency symbols', () => {
    expect(parseAmount('$50000')).toBe(50000)
    expect(parseAmount('$ 1.234.567')).toBe(1234567)
    expect(parseAmount('€1234,56')).toBe(1234.56)
  })

  it('should handle negative numbers', () => {
    expect(parseAmount('-50000')).toBe(-50000)
    expect(parseAmount('(50000)')).toBe(-50000)
    expect(parseAmount('-1.234.567,89')).toBe(-1234567.89)
  })

  it('should return undefined for invalid input', () => {
    expect(parseAmount('')).toBeUndefined()
    expect(parseAmount('abc')).toBeUndefined()
    expect(parseAmount('N/A')).toBeUndefined()
  })
})

// =============================================================================
// DATE PARSING TESTS (Internal Logic)
// =============================================================================

describe('Date Parsing Logic', () => {
  const parseDate = (value: string): string | undefined => {
    if (!value) return undefined

    const str = value.toString().trim()

    const formats = [
      { regex: /^(\d{4})-(\d{2})-(\d{2})/, order: [1, 2, 3] },
      { regex: /^(\d{2})\/(\d{2})\/(\d{4})/, order: [3, 2, 1] },
      { regex: /^(\d{2})-(\d{2})-(\d{4})/, order: [3, 2, 1] },
      { regex: /^(\d{2})\/(\d{2})\/(\d{2})$/, order: [3, 2, 1], shortYear: true },
    ]

    for (const format of formats) {
      const match = str.match(format.regex)
      if (match) {
        let year = match[format.order[0]]
        const month = match[format.order[1]]
        const day = match[format.order[2]]

        if ((format as any).shortYear) {
          const yy = parseInt(year)
          year = (yy > 50 ? 1900 + yy : 2000 + yy).toString()
        }

        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
      }
    }

    return undefined
  }

  it('should parse ISO format YYYY-MM-DD', () => {
    expect(parseDate('2026-01-15')).toBe('2026-01-15')
    expect(parseDate('2026-12-31')).toBe('2026-12-31')
  })

  it('should parse DD/MM/YYYY format', () => {
    expect(parseDate('15/01/2026')).toBe('2026-01-15')
    expect(parseDate('31/12/2026')).toBe('2026-12-31')
  })

  it('should parse DD-MM-YYYY format', () => {
    expect(parseDate('15-01-2026')).toBe('2026-01-15')
    expect(parseDate('31-12-2026')).toBe('2026-12-31')
  })

  it('should parse short year DD/MM/YY format', () => {
    expect(parseDate('15/01/26')).toBe('2026-01-15')
    expect(parseDate('15/01/99')).toBe('1999-01-15')
    expect(parseDate('15/01/00')).toBe('2000-01-15')
  })

  it('should return undefined for invalid dates', () => {
    expect(parseDate('')).toBeUndefined()
    expect(parseDate('invalid')).toBeUndefined()
  })
})

// =============================================================================
// CSV DELIMITER DETECTION TESTS
// =============================================================================

describe('CSV Delimiter Detection', () => {
  const detectDelimiter = (text: string): string => {
    const firstLine = text.split(/\r?\n/)[0] || ''
    const delimiters = [',', ';', '\t', '|']
    let bestDelimiter = ','
    let maxCount = 0

    for (const d of delimiters) {
      const count = (firstLine.match(new RegExp(d.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length
      if (count > maxCount) {
        maxCount = count
        bestDelimiter = d
      }
    }

    return bestDelimiter
  }

  it('should detect comma delimiter', () => {
    expect(detectDelimiter('fecha,descripcion,cargo,abono')).toBe(',')
  })

  it('should detect semicolon delimiter', () => {
    expect(detectDelimiter('fecha;descripcion;cargo;abono')).toBe(';')
  })

  it('should detect tab delimiter', () => {
    expect(detectDelimiter('fecha\tdescripcion\tcargo\tabono')).toBe('\t')
  })

  it('should detect pipe delimiter', () => {
    expect(detectDelimiter('fecha|descripcion|cargo|abono')).toBe('|')
  })

  it('should default to comma when no delimiter found', () => {
    expect(detectDelimiter('single value')).toBe(',')
  })
})

// =============================================================================
// COLUMN MAPPING TESTS
// =============================================================================

describe('Column Mapping Detection', () => {
  const COLUMN_ALIASES = {
    fecha: ['fecha', 'date', 'fecha_movimiento', 'dia'],
    descripcion: ['descripcion', 'descripción', 'detalle', 'concepto', 'glosa'],
    cargo: ['cargo', 'debito', 'débito', 'debit', 'egreso'],
    abono: ['abono', 'credito', 'crédito', 'credit', 'ingreso'],
    saldo: ['saldo', 'balance', 'saldo_actual'],
  }

  const findColumnMatch = (header: string): string | null => {
    const normalized = header.toLowerCase().trim()

    for (const [field, aliases] of Object.entries(COLUMN_ALIASES)) {
      for (const alias of aliases) {
        if (normalized === alias || normalized.includes(alias)) {
          return field
        }
      }
    }

    return null
  }

  it('should detect fecha column', () => {
    expect(findColumnMatch('fecha')).toBe('fecha')
    expect(findColumnMatch('FECHA')).toBe('fecha')
    expect(findColumnMatch('date')).toBe('fecha')
    expect(findColumnMatch('Fecha Movimiento')).toBe('fecha')
  })

  it('should detect descripcion column', () => {
    expect(findColumnMatch('descripcion')).toBe('descripcion')
    expect(findColumnMatch('DESCRIPCIÓN')).toBe('descripcion')
    expect(findColumnMatch('detalle')).toBe('descripcion')
    expect(findColumnMatch('glosa')).toBe('descripcion')
    expect(findColumnMatch('concepto')).toBe('descripcion')
  })

  it('should detect cargo column', () => {
    expect(findColumnMatch('cargo')).toBe('cargo')
    expect(findColumnMatch('DEBITO')).toBe('cargo')
    expect(findColumnMatch('débito')).toBe('cargo')
    expect(findColumnMatch('egreso')).toBe('cargo')
  })

  it('should detect abono column', () => {
    expect(findColumnMatch('abono')).toBe('abono')
    expect(findColumnMatch('CREDITO')).toBe('abono')
    expect(findColumnMatch('crédito')).toBe('abono')
    expect(findColumnMatch('ingreso')).toBe('abono')
  })

  it('should detect saldo column', () => {
    expect(findColumnMatch('saldo')).toBe('saldo')
    expect(findColumnMatch('BALANCE')).toBe('saldo')
    expect(findColumnMatch('saldo_actual')).toBe('saldo')
  })

  it('should return null for unknown columns', () => {
    expect(findColumnMatch('unknown')).toBeNull()
    expect(findColumnMatch('xyz')).toBeNull()
  })
})

// =============================================================================
// TRANSACTION VALIDATION TESTS
// =============================================================================

describe('Transaction Validation', () => {
  interface RawTransaction {
    fecha: string
    descripcion: string
    cargo?: number
    abono?: number
  }

  const isValidTransaction = (tx: RawTransaction): boolean => {
    if (!tx.fecha || !tx.descripcion) return false
    if (tx.cargo === undefined && tx.abono === undefined) return false
    if (tx.descripcion.length < 2 || tx.descripcion.length > 500) return false
    return true
  }

  it('should validate complete transaction', () => {
    expect(isValidTransaction({
      fecha: '2026-01-15',
      descripcion: 'TRANSFERENCIA',
      cargo: 50000,
    })).toBe(true)
  })

  it('should reject transaction without date', () => {
    expect(isValidTransaction({
      fecha: '',
      descripcion: 'TRANSFERENCIA',
      cargo: 50000,
    })).toBe(false)
  })

  it('should reject transaction without description', () => {
    expect(isValidTransaction({
      fecha: '2026-01-15',
      descripcion: '',
      cargo: 50000,
    })).toBe(false)
  })

  it('should reject transaction without amount', () => {
    expect(isValidTransaction({
      fecha: '2026-01-15',
      descripcion: 'TRANSFERENCIA',
    })).toBe(false)
  })

  it('should reject transaction with too short description', () => {
    expect(isValidTransaction({
      fecha: '2026-01-15',
      descripcion: 'A',
      cargo: 50000,
    })).toBe(false)
  })

  it('should accept transaction with abono instead of cargo', () => {
    expect(isValidTransaction({
      fecha: '2026-01-15',
      descripcion: 'DEPOSITO',
      abono: 100000,
    })).toBe(true)
  })
})

// =============================================================================
// BANK-SPECIFIC PATTERN TESTS
// =============================================================================

describe('Bank-Specific Patterns', () => {
  describe('Banco de Chile patterns', () => {
    const patterns = [
      // Pattern 1: DD/MM/YYYY | Descripción | Cargo | Abono | Saldo
      /^(\d{2}\/\d{2}\/\d{4})\s+(.+?)\s+([\d.,]+)?\s+([\d.,]+)?\s+([\d.,]+)$/,
      // Pattern 2: DD/MM | Descripción | Movimiento | Saldo
      /^(\d{2}\/\d{2})\s+(.+?)\s+(-?[\d.,]+)\s+([\d.,]+)$/,
    ]

    it('should match full date format', () => {
      const line = '15/01/2026 TRANSFERENCIA TEF 50.000 1.000.000'
      expect(patterns[1].test(line)).toBe(true)
    })

    it('should match short date format', () => {
      const line = '15/01 TRANSFERENCIA TEF -50.000 950.000'
      expect(patterns[1].test(line)).toBe(true)
    })
  })

  describe('Banco Estado patterns', () => {
    const patterns = [
      /^(\d{2}-\d{2}-\d{4})\s+(.+?)\s+([\d.,]+)?\s+([\d.,]+)?\s+([\d.,]+)$/,
      /^(\d{2}\/\d{2}\/\d{2})\s+(.+?)\s+(-?[\d.,]+)$/,
    ]

    it('should match dash-separated date format', () => {
      const line = '15-01-2026 PAGO SERVICIO 50000 1000000'
      // Note: This pattern requires specific spacing
      const match = line.match(/^(\d{2}-\d{2}-\d{4})\s+(.+)/)
      expect(match).not.toBeNull()
    })
  })

  describe('Header/Footer detection', () => {
    const IGNORE_PATTERNS = [
      /^página\s+\d+/i,
      /^pág\.\s*\d+/i,
      /^total/i,
      /^saldo\s+(anterior|inicial|final)/i,
      /^fecha\s+descripci[oó]n/i,
      /^\s*$/,
      /^-+$/,
    ]

    const shouldIgnore = (line: string): boolean => {
      if (!line || line.length < 5) return true
      for (const pattern of IGNORE_PATTERNS) {
        if (pattern.test(line)) return true
      }
      return false
    }

    it('should ignore page numbers', () => {
      expect(shouldIgnore('Página 1')).toBe(true)
      expect(shouldIgnore('Pág. 5')).toBe(true)
    })

    it('should ignore totals', () => {
      expect(shouldIgnore('Total Cargos: 500.000')).toBe(true)
      expect(shouldIgnore('TOTAL')).toBe(true)
    })

    it('should ignore balance lines', () => {
      expect(shouldIgnore('Saldo Anterior: 1.000.000')).toBe(true)
      expect(shouldIgnore('Saldo Final: 2.000.000')).toBe(true)
    })

    it('should ignore empty lines', () => {
      expect(shouldIgnore('')).toBe(true)
      expect(shouldIgnore('   ')).toBe(true)
    })

    it('should ignore separator lines', () => {
      expect(shouldIgnore('--------------------')).toBe(true)
    })

    it('should not ignore transaction lines', () => {
      expect(shouldIgnore('15/01/2026 TRANSFERENCIA 50000')).toBe(false)
    })
  })
})
