// =============================================================================
// HV Consultores - Bank Statement PDF Parser
// Extrae transacciones de cartolas bancarias en formato PDF
// =============================================================================

import type {
  BankCode,
  ParsedCartola,
  RawTransaction,
  ParserOptions,
  Currency,
  AccountType,
} from '../types'

// ============================================================================
// TYPES
// ============================================================================

interface PDFParseResult {
  text: string
  pages: number
  metadata?: Record<string, unknown>
}

interface LinePattern {
  regex: RegExp
  groups: {
    fecha?: number
    fechaValor?: number
    descripcion?: number
    cargo?: number
    abono?: number
    saldo?: number
    referencia?: number
  }
}

// ============================================================================
// BANK-SPECIFIC PATTERNS
// ============================================================================

const BANK_PATTERNS: Record<BankCode, LinePattern[]> = {
  bancochile: [
    // Pattern 1: DD/MM/YYYY | Descripción | Cargo | Abono | Saldo
    {
      regex: /^(\d{2}\/\d{2}\/\d{4})\s+(.+?)\s+([\d.,]+)?\s+([\d.,]+)?\s+([\d.,]+)$/,
      groups: { fecha: 1, descripcion: 2, cargo: 3, abono: 4, saldo: 5 },
    },
    // Pattern 2: DD/MM | Descripción | Movimiento | Saldo
    {
      regex: /^(\d{2}\/\d{2})\s+(.+?)\s+(-?[\d.,]+)\s+([\d.,]+)$/,
      groups: { fecha: 1, descripcion: 2, cargo: 3, saldo: 4 },
    },
    // Pattern 3: Fecha Descripción REF### Monto Saldo
    {
      regex: /^(\d{2}\/\d{2}\/\d{4})\s+(.+?)\s+(?:REF|N°)?\s*(\d+)?\s+([\d.,]+)\s+([\d.,]+)$/,
      groups: { fecha: 1, descripcion: 2, referencia: 3, cargo: 4, saldo: 5 },
    },
  ],

  bancoestado: [
    // Pattern: DD-MM-YYYY | Descripción | Cargo | Abono | Saldo
    {
      regex: /^(\d{2}-\d{2}-\d{4})\s+(.+?)\s+([\d.,]+)?\s+([\d.,]+)?\s+([\d.,]+)$/,
      groups: { fecha: 1, descripcion: 2, cargo: 3, abono: 4, saldo: 5 },
    },
    // Pattern: DD/MM/YY Descripción Monto
    {
      regex: /^(\d{2}\/\d{2}\/\d{2})\s+(.+?)\s+(-?[\d.,]+)$/,
      groups: { fecha: 1, descripcion: 2, cargo: 3 },
    },
  ],

  santander: [
    // Pattern: FECHA | DESCRIPCION | CARGO | ABONO | SALDO
    {
      regex: /^(\d{2}\/\d{2}\/\d{4})\s+(\d{2}\/\d{2}\/\d{4})?\s*(.+?)\s+([\d.,]+)?\s+([\d.,]+)?\s+([\d.,]+)$/,
      groups: { fecha: 1, fechaValor: 2, descripcion: 3, cargo: 4, abono: 5, saldo: 6 },
    },
    // Pattern simpler
    {
      regex: /^(\d{2}\/\d{2})\s+(.+?)\s+([\d.,]+)\s+([\d.,]+)$/,
      groups: { fecha: 1, descripcion: 2, cargo: 3, saldo: 4 },
    },
  ],

  bci: [
    // Pattern: Fecha | Fecha Valor | Descripción | Cargo | Abono | Saldo
    {
      regex: /^(\d{2}\/\d{2}\/\d{4})\s+(\d{2}\/\d{2}\/\d{4})\s+(.+?)\s+([\d.,]+)?\s+([\d.,]+)?\s+([\d.,]+)$/,
      groups: { fecha: 1, fechaValor: 2, descripcion: 3, cargo: 4, abono: 5, saldo: 6 },
    },
    // Pattern simpler
    {
      regex: /^(\d{2}-\d{2}-\d{4})\s+(.+?)\s+([\d.,]+)\s+([\d.,]+)$/,
      groups: { fecha: 1, descripcion: 2, cargo: 3, saldo: 4 },
    },
  ],
}

// Header/footer detection patterns
const IGNORE_PATTERNS = [
  /^página\s+\d+/i,
  /^pág\.\s*\d+/i,
  /^page\s+\d+/i,
  /^total/i,
  /^saldo\s+(anterior|inicial|final)/i,
  /^fecha\s+descripci[oó]n/i,
  /^movimientos/i,
  /^\s*$/,
  /^-+$/,
  /^=+$/,
]

// Account info patterns
const ACCOUNT_PATTERNS = {
  numero: /(?:cuenta|cta\.?|n[uú]mero)\s*[:#]?\s*([\d-]+)/i,
  tipo: /(?:tipo|type)\s*[:#]?\s*(corriente|vista|ahorro)/i,
  moneda: /(?:moneda|currency)\s*[:#]?\s*(CLP|USD|EUR|UF)/i,
  periodo: /(?:per[ií]odo|period)\s*[:#]?\s*(\w+\s+\d{4}|\d{2}\/\d{4})/i,
  saldoInicial: /saldo\s+(?:anterior|inicial)\s*[:#]?\s*\$?\s*([\d.,]+)/i,
  saldoFinal: /saldo\s+(?:final|actual)\s*[:#]?\s*\$?\s*([\d.,]+)/i,
}

// ============================================================================
// PDF PARSER CLASS
// ============================================================================

export class BankPDFParser {
  private banco: BankCode
  private options: ParserOptions

  constructor(banco: BankCode, options: ParserOptions = {}) {
    this.banco = banco
    this.options = options
  }

  async parse(buffer: Buffer): Promise<ParsedCartola> {
    // Dynamic import pdf-parse (it's a CommonJS module)
    const pdfParse = (await import('pdf-parse')).default

    const pdfData: PDFParseResult = await pdfParse(buffer)
    const text = pdfData.text
    const lines = text.split('\n').map((line) => line.trim())

    // Extract metadata
    const metadata = this.extractMetadata(lines)

    // Extract transactions
    const transactions = this.extractTransactions(lines)

    // Calculate totals
    let totalCargos = 0
    let totalAbonos = 0

    for (const tx of transactions) {
      if (tx.cargo) totalCargos += tx.cargo
      if (tx.abono) totalAbonos += tx.abono
    }

    return {
      banco: this.banco,
      numero_cuenta: metadata.numeroCuenta || '',
      tipo_cuenta: metadata.tipoCuenta as AccountType | undefined,
      moneda: (metadata.moneda as Currency) || 'CLP',
      periodo: {
        mes: metadata.mes || new Date().getMonth() + 1,
        año: metadata.año || new Date().getFullYear(),
        fecha_desde: metadata.fechaDesde || '',
        fecha_hasta: metadata.fechaHasta || '',
      },
      saldo_inicial: metadata.saldoInicial,
      saldo_final: metadata.saldoFinal,
      total_cargos: totalCargos,
      total_abonos: totalAbonos,
      transacciones: transactions,
      metadata: {
        paginas: pdfData.pages,
        formato_detectado: 'pdf',
        warnings: metadata.warnings,
      },
    }
  }

  private extractMetadata(lines: string[]): {
    numeroCuenta?: string
    tipoCuenta?: string
    moneda?: string
    mes?: number
    año?: number
    fechaDesde?: string
    fechaHasta?: string
    saldoInicial?: number
    saldoFinal?: number
    warnings: string[]
  } {
    const result: ReturnType<typeof this.extractMetadata> = { warnings: [] }

    // Join first 30 lines for header analysis
    const headerText = lines.slice(0, 30).join(' ')

    // Extract account number
    const numeroMatch = headerText.match(ACCOUNT_PATTERNS.numero)
    if (numeroMatch) {
      result.numeroCuenta = numeroMatch[1].replace(/-/g, '')
    }

    // Extract account type
    const tipoMatch = headerText.match(ACCOUNT_PATTERNS.tipo)
    if (tipoMatch) {
      result.tipoCuenta = tipoMatch[1].toLowerCase()
    }

    // Extract currency
    const monedaMatch = headerText.match(ACCOUNT_PATTERNS.moneda)
    if (monedaMatch) {
      result.moneda = monedaMatch[1].toUpperCase()
    }

    // Extract period
    const periodoMatch = headerText.match(ACCOUNT_PATTERNS.periodo)
    if (periodoMatch) {
      const periodText = periodoMatch[1]
      const dateInfo = this.parsePeriod(periodText)
      if (dateInfo) {
        result.mes = dateInfo.mes
        result.año = dateInfo.año
      }
    }

    // Extract balances
    const saldoInicialMatch = headerText.match(ACCOUNT_PATTERNS.saldoInicial)
    if (saldoInicialMatch) {
      result.saldoInicial = this.parseAmount(saldoInicialMatch[1])
    }

    const saldoFinalMatch = headerText.match(ACCOUNT_PATTERNS.saldoFinal)
    if (saldoFinalMatch) {
      result.saldoFinal = this.parseAmount(saldoFinalMatch[1])
    }

    // Determine date range from transactions if not found in header
    // This will be done after transaction extraction

    return result
  }

  private extractTransactions(lines: string[]): RawTransaction[] {
    const transactions: RawTransaction[] = []
    const patterns = BANK_PATTERNS[this.banco] || []
    const currentYear = this.options.dateFormat ? undefined : new Date().getFullYear()

    for (const line of lines) {
      // Skip headers/footers
      if (this.shouldIgnoreLine(line)) continue

      // Try each pattern
      for (const pattern of patterns) {
        const match = line.match(pattern.regex)
        if (match) {
          try {
            const tx = this.parseTransactionMatch(match, pattern, currentYear)
            if (tx && this.isValidTransaction(tx)) {
              transactions.push(tx)
            }
          } catch {
            // Pattern matched but parsing failed, try next pattern
            continue
          }
          break // Found a matching pattern
        }
      }
    }

    // Sort by date
    transactions.sort((a, b) => {
      const dateA = new Date(a.fecha)
      const dateB = new Date(b.fecha)
      return dateA.getTime() - dateB.getTime()
    })

    return transactions
  }

  private shouldIgnoreLine(line: string): boolean {
    if (!line || line.length < 5) return true

    for (const pattern of IGNORE_PATTERNS) {
      if (pattern.test(line)) return true
    }

    return false
  }

  private parseTransactionMatch(
    match: RegExpMatchArray,
    pattern: LinePattern,
    defaultYear?: number
  ): RawTransaction | null {
    const groups = pattern.groups

    // Get date
    let fecha = groups.fecha ? match[groups.fecha] : undefined
    if (!fecha) return null

    // Normalize date format
    fecha = this.normalizeDate(fecha, defaultYear)
    if (!fecha) return null

    // Get fecha valor if present
    let fechaValor: string | undefined
    if (groups.fechaValor && match[groups.fechaValor]) {
      fechaValor = this.normalizeDate(match[groups.fechaValor], defaultYear)
    }

    // Get description
    const descripcion = groups.descripcion ? match[groups.descripcion]?.trim() : ''
    if (!descripcion) return null

    // Get amounts
    const cargoStr = groups.cargo ? match[groups.cargo] : undefined
    const abonoStr = groups.abono ? match[groups.abono] : undefined
    const saldoStr = groups.saldo ? match[groups.saldo] : undefined
    const referenciaStr = groups.referencia ? match[groups.referencia] : undefined

    const cargo = cargoStr ? this.parseAmount(cargoStr) : undefined
    const abono = abonoStr ? this.parseAmount(abonoStr) : undefined
    const saldo = saldoStr ? this.parseAmount(saldoStr) : undefined

    // Determine if it's a cargo or abono based on sign or presence
    let finalCargo: number | undefined
    let finalAbono: number | undefined

    if (cargo !== undefined && abono !== undefined) {
      finalCargo = cargo > 0 ? cargo : undefined
      finalAbono = abono > 0 ? abono : undefined
    } else if (cargo !== undefined) {
      // Single amount - check if negative
      if (cargo < 0) {
        finalAbono = Math.abs(cargo)
      } else {
        finalCargo = cargo
      }
    }

    return {
      fecha,
      fecha_valor: fechaValor,
      descripcion,
      referencia: referenciaStr,
      cargo: finalCargo,
      abono: finalAbono,
      saldo,
      linea_original: match[0],
    }
  }

  private normalizeDate(dateStr: string, defaultYear?: number): string | undefined {
    if (!dateStr) return undefined

    // Remove any extra whitespace
    dateStr = dateStr.trim()

    // Try different formats
    const formats = [
      // DD/MM/YYYY
      /^(\d{2})\/(\d{2})\/(\d{4})$/,
      // DD-MM-YYYY
      /^(\d{2})-(\d{2})-(\d{4})$/,
      // DD/MM/YY
      /^(\d{2})\/(\d{2})\/(\d{2})$/,
      // DD/MM (needs year)
      /^(\d{2})\/(\d{2})$/,
    ]

    for (const format of formats) {
      const match = dateStr.match(format)
      if (match) {
        const day = match[1]
        const month = match[2]
        let year = match[3]

        if (!year && defaultYear) {
          year = defaultYear.toString()
        } else if (year && year.length === 2) {
          // Convert YY to YYYY
          const yy = parseInt(year)
          year = (yy > 50 ? 1900 + yy : 2000 + yy).toString()
        }

        if (year) {
          // Return ISO format YYYY-MM-DD
          return `${year}-${month}-${day}`
        }
      }
    }

    return undefined
  }

  private parseAmount(amountStr: string): number | undefined {
    if (!amountStr) return undefined

    // Remove currency symbols and whitespace
    let clean = amountStr
      .replace(/[$€]/g, '')
      .replace(/\s/g, '')
      .trim()

    // Handle Chilean format: 1.234.567,89 → 1234567.89
    // Check if comma is decimal separator (Chilean format)
    if (clean.includes(',') && clean.includes('.')) {
      // Format: 1.234.567,89
      clean = clean.replace(/\./g, '').replace(',', '.')
    } else if (clean.includes(',') && !clean.includes('.')) {
      // Format: 1234567,89 or 123,45
      const parts = clean.split(',')
      if (parts[1] && parts[1].length <= 2) {
        clean = clean.replace(',', '.')
      } else {
        // It's a thousands separator
        clean = clean.replace(/,/g, '')
      }
    } else {
      // Format: 1.234.567 (no decimals) or 1234567.89
      const parts = clean.split('.')
      if (parts.length > 2) {
        // Multiple dots = thousands separators
        clean = clean.replace(/\./g, '')
      }
    }

    // Check for negative (parentheses or minus)
    const isNegative = clean.startsWith('-') || clean.startsWith('(')
    clean = clean.replace(/[()-]/g, '')

    const amount = parseFloat(clean)
    if (isNaN(amount)) return undefined

    return isNegative ? -amount : amount
  }

  private parsePeriod(periodText: string): { mes: number; año: number } | undefined {
    // Try MM/YYYY format
    const mmyyyyMatch = periodText.match(/(\d{2})\/(\d{4})/)
    if (mmyyyyMatch) {
      return {
        mes: parseInt(mmyyyyMatch[1]),
        año: parseInt(mmyyyyMatch[2]),
      }
    }

    // Try month name + year format
    const monthNames: Record<string, number> = {
      enero: 1, febrero: 2, marzo: 3, abril: 4, mayo: 5, junio: 6,
      julio: 7, agosto: 8, septiembre: 9, octubre: 10, noviembre: 11, diciembre: 12,
      january: 1, february: 2, march: 3, april: 4, may: 5, june: 6,
      july: 7, august: 8, september: 9, october: 10, november: 11, december: 12,
    }

    const words = periodText.toLowerCase().split(/\s+/)
    let mes: number | undefined
    let año: number | undefined

    for (const word of words) {
      if (monthNames[word]) {
        mes = monthNames[word]
      }
      const yearMatch = word.match(/\d{4}/)
      if (yearMatch) {
        año = parseInt(yearMatch[0])
      }
    }

    if (mes && año) {
      return { mes, año }
    }

    return undefined
  }

  private isValidTransaction(tx: RawTransaction): boolean {
    // Must have date and description
    if (!tx.fecha || !tx.descripcion) return false

    // Must have at least one amount
    if (tx.cargo === undefined && tx.abono === undefined) return false

    // Amounts should be positive
    if (tx.cargo !== undefined && tx.cargo < 0) return false
    if (tx.abono !== undefined && tx.abono < 0) return false

    // Description should have reasonable length
    if (tx.descripcion.length < 3 || tx.descripcion.length > 500) return false

    return true
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

export function createPDFParser(banco: BankCode, options?: ParserOptions): BankPDFParser {
  return new BankPDFParser(banco, options)
}

// ============================================================================
// UTILITY FUNCTION
// ============================================================================

export async function parseBankPDF(
  buffer: Buffer,
  banco: BankCode,
  options?: ParserOptions
): Promise<ParsedCartola> {
  const parser = createPDFParser(banco, options)
  return parser.parse(buffer)
}
