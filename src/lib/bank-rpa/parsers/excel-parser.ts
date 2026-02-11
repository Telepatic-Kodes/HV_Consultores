// @ts-nocheck — temporary: types need update after Convex migration
// =============================================================================
// HV Consultores - Bank Statement Excel/CSV Parser
// Extrae transacciones de cartolas bancarias en formato Excel o CSV
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

interface ColumnMapping {
  fecha?: string | number
  fechaValor?: string | number
  descripcion?: string | number
  cargo?: string | number
  abono?: string | number
  monto?: string | number
  saldo?: string | number
  referencia?: string | number
}

interface RowData {
  [key: string]: string | number | undefined
}

// ============================================================================
// COLUMN NAME MAPPINGS (for auto-detection)
// ============================================================================

const COLUMN_ALIASES = {
  fecha: ['fecha', 'date', 'fecha_movimiento', 'fecha mov', 'f.mov', 'dia'],
  fechaValor: ['fecha valor', 'fecha_valor', 'value_date', 'f.valor'],
  descripcion: ['descripcion', 'descripción', 'description', 'detalle', 'concepto', 'glosa', 'movimiento'],
  cargo: ['cargo', 'debito', 'débito', 'debit', 'egreso', 'salida', 'debe'],
  abono: ['abono', 'credito', 'crédito', 'credit', 'ingreso', 'entrada', 'haber'],
  monto: ['monto', 'amount', 'importe', 'valor'],
  saldo: ['saldo', 'balance', 'saldo_actual', 'saldo actual'],
  referencia: ['referencia', 'reference', 'ref', 'numero', 'nro', 'comprobante'],
}

// ============================================================================
// EXCEL PARSER CLASS
// ============================================================================

export class BankExcelParser {
  private banco: BankCode
  private options: ParserOptions

  constructor(banco: BankCode, options: ParserOptions = {}) {
    this.banco = banco
    this.options = options
  }

  async parseExcel(buffer: Buffer): Promise<ParsedCartola> {
    // Dynamic import xlsx
    const XLSX = await import('xlsx')

    const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true })

    // Get first sheet (or specified sheet)
    const sheetName = workbook.SheetNames[0]
    const sheet = workbook.Sheets[sheetName]

    // Convert to JSON
    const rows: RowData[] = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      raw: false,
      dateNF: 'yyyy-mm-dd',
    }) as RowData[]

    return this.parseRows(rows)
  }

  async parseCSV(content: string | Buffer): Promise<ParsedCartola> {
    const text = Buffer.isBuffer(content) ? content.toString('utf-8') : content

    // Detect delimiter
    const delimiter = this.detectDelimiter(text)

    // Parse CSV manually (simple parser for bank statements)
    const lines = text.split(/\r?\n/)
    const rows: RowData[] = []

    for (const line of lines) {
      if (!line.trim()) continue

      const values = this.parseCSVLine(line, delimiter)
      const row: RowData = {}

      values.forEach((value, index) => {
        row[index] = value.trim()
      })

      rows.push(row)
    }

    return this.parseRows(rows)
  }

  private parseRows(rows: RowData[]): ParsedCartola {
    if (rows.length < 2) {
      throw new Error('El archivo no contiene suficientes datos')
    }

    // Try to find header row and detect column mapping
    const { headerIndex, mapping } = this.detectColumns(rows)

    // Extract metadata from rows before header
    const metadata = this.extractMetadata(rows.slice(0, headerIndex))

    // Extract transactions
    const transactions = this.extractTransactions(rows.slice(headerIndex + 1), mapping)

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
        fecha_desde: transactions[0]?.fecha || '',
        fecha_hasta: transactions[transactions.length - 1]?.fecha || '',
      },
      saldo_inicial: metadata.saldoInicial,
      saldo_final: metadata.saldoFinal,
      total_cargos: totalCargos,
      total_abonos: totalAbonos,
      transacciones: transactions,
      metadata: {
        formato_detectado: 'excel',
        columnas_detectadas: mapping,
        warnings: [],
      },
    }
  }

  private detectColumns(rows: RowData[]): { headerIndex: number; mapping: ColumnMapping } {
    // Try to find the header row (first row with recognizable column names)
    for (let i = 0; i < Math.min(rows.length, 10); i++) {
      const row = rows[i]
      const mapping = this.tryMapColumns(row)

      if (mapping && (mapping.fecha || mapping.descripcion)) {
        return { headerIndex: i, mapping }
      }
    }

    // If no header found, try to use numeric indices based on common patterns
    // Typically: Fecha | Descripción | Cargo | Abono | Saldo
    return {
      headerIndex: 0,
      mapping: {
        fecha: 0,
        descripcion: 1,
        cargo: 2,
        abono: 3,
        saldo: 4,
      },
    }
  }

  private tryMapColumns(row: RowData): ColumnMapping | null {
    const mapping: ColumnMapping = {}
    let foundCount = 0

    const rowValues = Object.entries(row)

    for (const [key, value] of rowValues) {
      if (!value || typeof value !== 'string') continue

      const normalizedValue = value.toString().toLowerCase().trim()

      // Check each alias category
      for (const [field, aliases] of Object.entries(COLUMN_ALIASES)) {
        for (const alias of aliases) {
          if (normalizedValue === alias || normalizedValue.includes(alias)) {
            mapping[field as keyof ColumnMapping] = key
            foundCount++
            break
          }
        }
      }
    }

    return foundCount >= 2 ? mapping : null
  }

  private extractTransactions(rows: RowData[], mapping: ColumnMapping): RawTransaction[] {
    const transactions: RawTransaction[] = []

    for (const row of rows) {
      const tx = this.parseRow(row, mapping)
      if (tx && this.isValidTransaction(tx)) {
        transactions.push(tx)
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

  private parseRow(row: RowData, mapping: ColumnMapping): RawTransaction | null {
    // Get date
    const fechaRaw = mapping.fecha !== undefined ? row[mapping.fecha] : undefined
    if (!fechaRaw) return null

    const fecha = this.parseDate(fechaRaw)
    if (!fecha) return null

    // Get fecha valor
    const fechaValorRaw = mapping.fechaValor !== undefined ? row[mapping.fechaValor] : undefined
    const fechaValor = fechaValorRaw ? this.parseDate(fechaValorRaw) : undefined

    // Get description
    const descripcionRaw = mapping.descripcion !== undefined ? row[mapping.descripcion] : undefined
    const descripcion = descripcionRaw?.toString().trim() || ''
    if (!descripcion) return null

    // Get amounts
    let cargo: number | undefined
    let abono: number | undefined

    if (mapping.monto !== undefined) {
      // Single amount column - determine type by sign
      const montoRaw = row[mapping.monto]
      const monto = this.parseAmount(montoRaw)

      if (monto !== undefined) {
        if (monto < 0) {
          cargo = Math.abs(monto)
        } else {
          abono = monto
        }
      }
    } else {
      // Separate cargo/abono columns
      if (mapping.cargo !== undefined) {
        cargo = this.parseAmount(row[mapping.cargo])
      }
      if (mapping.abono !== undefined) {
        abono = this.parseAmount(row[mapping.abono])
      }
    }

    // Get saldo
    const saldoRaw = mapping.saldo !== undefined ? row[mapping.saldo] : undefined
    const saldo = saldoRaw ? this.parseAmount(saldoRaw) : undefined

    // Get referencia
    const referenciaRaw = mapping.referencia !== undefined ? row[mapping.referencia] : undefined
    const referencia = referenciaRaw?.toString().trim()

    return {
      fecha,
      fecha_valor: fechaValor,
      descripcion,
      referencia,
      cargo,
      abono,
      saldo,
    }
  }

  private extractMetadata(rows: RowData[]): {
    numeroCuenta?: string
    tipoCuenta?: string
    moneda?: string
    mes?: number
    año?: number
    saldoInicial?: number
    saldoFinal?: number
  } {
    const metadata: ReturnType<typeof this.extractMetadata> = {}

    // Join all text from header rows
    const headerText = rows
      .map((row) => Object.values(row).join(' '))
      .join(' ')
      .toLowerCase()

    // Extract account number
    const cuentaMatch = headerText.match(/cuenta[:\s]*(\d[\d-]+)/i)
    if (cuentaMatch) {
      metadata.numeroCuenta = cuentaMatch[1].replace(/-/g, '')
    }

    // Extract currency
    if (headerText.includes('usd') || headerText.includes('dólar')) {
      metadata.moneda = 'USD'
    } else if (headerText.includes('uf')) {
      metadata.moneda = 'UF'
    } else if (headerText.includes('eur') || headerText.includes('euro')) {
      metadata.moneda = 'EUR'
    }

    return metadata
  }

  private parseDate(value: unknown): string | undefined {
    if (!value) return undefined

    // If it's already a Date object
    if (value instanceof Date) {
      return value.toISOString().split('T')[0]
    }

    const str = value.toString().trim()

    // Try various formats
    const formats = [
      // ISO format YYYY-MM-DD
      { regex: /^(\d{4})-(\d{2})-(\d{2})/, order: [1, 2, 3] },
      // DD/MM/YYYY
      { regex: /^(\d{2})\/(\d{2})\/(\d{4})/, order: [3, 2, 1] },
      // DD-MM-YYYY
      { regex: /^(\d{2})-(\d{2})-(\d{4})/, order: [3, 2, 1] },
      // DD/MM/YY
      { regex: /^(\d{2})\/(\d{2})\/(\d{2})$/, order: [3, 2, 1], shortYear: true },
      // YYYY/MM/DD
      { regex: /^(\d{4})\/(\d{2})\/(\d{2})/, order: [1, 2, 3] },
    ]

    for (const format of formats) {
      const match = str.match(format.regex)
      if (match) {
        let year = match[format.order[0]]
        const month = match[format.order[1]]
        const day = match[format.order[2]]

        if (format.shortYear) {
          const yy = parseInt(year)
          year = (yy > 50 ? 1900 + yy : 2000 + yy).toString()
        }

        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
      }
    }

    // Try to parse as a JavaScript date
    const date = new Date(str)
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0]
    }

    return undefined
  }

  private parseAmount(value: unknown): number | undefined {
    if (value === undefined || value === null || value === '') return undefined

    const str = value.toString().trim()
    if (!str) return undefined

    // Remove currency symbols and spaces
    let clean = str.replace(/[$€]/g, '').replace(/\s/g, '')

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
      // Multiple dots = thousands separators
      clean = clean.replace(/\./g, '')
    }

    // Check for negative (parentheses or minus)
    const isNegative = clean.startsWith('-') || clean.startsWith('(')
    clean = clean.replace(/[()-]/g, '')

    const amount = parseFloat(clean)
    if (isNaN(amount)) return undefined

    return isNegative ? -amount : amount
  }

  private detectDelimiter(text: string): string {
    const firstLine = text.split(/\r?\n/)[0] || ''

    // Count occurrences of common delimiters
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

  private parseCSVLine(line: string, delimiter: string): string[] {
    const result: string[] = []
    let current = ''
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
      const char = line[i]

      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"'
          i++
        } else {
          inQuotes = !inQuotes
        }
      } else if (char === delimiter && !inQuotes) {
        result.push(current)
        current = ''
      } else {
        current += char
      }
    }

    result.push(current)
    return result
  }

  private isValidTransaction(tx: RawTransaction): boolean {
    if (!tx.fecha || !tx.descripcion) return false
    if (tx.cargo === undefined && tx.abono === undefined) return false
    if (tx.descripcion.length < 2 || tx.descripcion.length > 500) return false
    return true
  }
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

export function createExcelParser(banco: BankCode, options?: ParserOptions): BankExcelParser {
  return new BankExcelParser(banco, options)
}

export async function parseBankExcel(
  buffer: Buffer,
  banco: BankCode,
  options?: ParserOptions
): Promise<ParsedCartola> {
  const parser = createExcelParser(banco, options)
  return parser.parseExcel(buffer)
}

export async function parseBankCSV(
  content: string | Buffer,
  banco: BankCode,
  options?: ParserOptions
): Promise<ParsedCartola> {
  const parser = createExcelParser(banco, options)
  return parser.parseCSV(content)
}
