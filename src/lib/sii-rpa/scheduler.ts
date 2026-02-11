// SII RPA Scheduler
// Sistema de scheduling con expresiones cron para tareas programadas

// ============================================================================
// CRON PARSER
// ============================================================================

export interface CronParts {
  minute: number[]
  hour: number[]
  dayOfMonth: number[]
  month: number[]
  dayOfWeek: number[]
}

/**
 * Parsea una expresión cron en sus partes componentes
 * Formato: minuto hora dia_mes mes dia_semana
 * Ejemplo: "0 8 * * 1-5" = 8:00 AM de lunes a viernes
 */
export function parseCronExpression(expression: string): CronParts | null {
  const parts = expression.trim().split(/\s+/)

  if (parts.length !== 5) {
    return null
  }

  try {
    return {
      minute: parseField(parts[0], 0, 59),
      hour: parseField(parts[1], 0, 23),
      dayOfMonth: parseField(parts[2], 1, 31),
      month: parseField(parts[3], 1, 12),
      dayOfWeek: parseField(parts[4], 0, 6),
    }
  } catch {
    return null
  }
}

function parseField(field: string, min: number, max: number): number[] {
  const values: number[] = []

  // Handle multiple values separated by commas
  const segments = field.split(',')

  for (const segment of segments) {
    if (segment === '*') {
      // All values
      for (let i = min; i <= max; i++) {
        values.push(i)
      }
    } else if (segment.includes('/')) {
      // Step values (e.g., */5, 0-30/10)
      const [range, stepStr] = segment.split('/')
      const step = parseInt(stepStr, 10)
      let start = min
      let end = max

      if (range !== '*') {
        if (range.includes('-')) {
          const [s, e] = range.split('-').map(Number)
          start = s
          end = e
        } else {
          start = parseInt(range, 10)
        }
      }

      for (let i = start; i <= end; i += step) {
        values.push(i)
      }
    } else if (segment.includes('-')) {
      // Range (e.g., 1-5)
      const [start, end] = segment.split('-').map(Number)
      for (let i = start; i <= end; i++) {
        values.push(i)
      }
    } else {
      // Single value
      values.push(parseInt(segment, 10))
    }
  }

  return Array.from(new Set(values)).sort((a, b) => a - b)
}

// ============================================================================
// NEXT EXECUTION CALCULATOR
// ============================================================================

/**
 * Calcula la próxima fecha de ejecución basada en una expresión cron
 */
export function getNextExecution(cronExpression: string, fromDate: Date = new Date()): Date | null {
  const cron = parseCronExpression(cronExpression)

  if (!cron) {
    return null
  }

  // Start from the next minute
  const next = new Date(fromDate)
  next.setSeconds(0)
  next.setMilliseconds(0)
  next.setMinutes(next.getMinutes() + 1)

  // Try up to 366 days ahead
  const maxIterations = 366 * 24 * 60 // 1 year in minutes

  for (let i = 0; i < maxIterations; i++) {
    if (
      cron.month.includes(next.getMonth() + 1) &&
      cron.dayOfMonth.includes(next.getDate()) &&
      cron.dayOfWeek.includes(next.getDay()) &&
      cron.hour.includes(next.getHours()) &&
      cron.minute.includes(next.getMinutes())
    ) {
      return next
    }

    // Increment by 1 minute
    next.setMinutes(next.getMinutes() + 1)
  }

  return null
}

/**
 * Verifica si una fecha coincide con una expresión cron
 */
export function matchesCron(cronExpression: string, date: Date = new Date()): boolean {
  const cron = parseCronExpression(cronExpression)

  if (!cron) {
    return false
  }

  return (
    cron.month.includes(date.getMonth() + 1) &&
    cron.dayOfMonth.includes(date.getDate()) &&
    cron.dayOfWeek.includes(date.getDay()) &&
    cron.hour.includes(date.getHours()) &&
    cron.minute.includes(date.getMinutes())
  )
}

// ============================================================================
// CRON PRESETS
// ============================================================================

export const CRON_PRESETS = {
  // Cada día a una hora específica
  dailyAt: (hour: number, minute: number = 0) => `${minute} ${hour} * * *`,

  // Días laborales (lunes a viernes)
  weekdaysAt: (hour: number, minute: number = 0) => `${minute} ${hour} * * 1-5`,

  // Cada semana (día específico)
  weeklyOn: (dayOfWeek: number, hour: number, minute: number = 0) =>
    `${minute} ${hour} * * ${dayOfWeek}`,

  // Cada mes (día específico)
  monthlyOn: (dayOfMonth: number, hour: number, minute: number = 0) =>
    `${minute} ${hour} ${dayOfMonth} * *`,

  // Específico para SII Chile
  sii: {
    // F29: Día 12 de cada mes a las 10:00
    f29Mensual: '0 10 12 * *',

    // Libros: Día 15 de cada mes a las 9:00
    librosMensual: '0 9 15 * *',

    // Validación de credenciales: Cada lunes a las 8:00
    validacionSemanal: '0 8 * * 1',

    // Situación tributaria: Primer día de cada mes
    situacionMensual: '0 8 1 * *',
  }
}

// ============================================================================
// CRON DESCRIPTION
// ============================================================================

/**
 * Genera una descripción legible de una expresión cron
 */
export function describeCron(expression: string): string {
  const cron = parseCronExpression(expression)

  if (!cron) {
    return 'Expresión inválida'
  }

  const parts: string[] = []

  // Time
  if (cron.minute.length === 1 && cron.hour.length === 1) {
    const hour = cron.hour[0].toString().padStart(2, '0')
    const minute = cron.minute[0].toString().padStart(2, '0')
    parts.push(`a las ${hour}:${minute}`)
  } else if (cron.minute.length === 60 && cron.hour.length === 24) {
    parts.push('cada minuto')
  } else if (cron.minute.length === 60) {
    parts.push(`cada hora (a las ${formatList(cron.hour)})`)
  }

  // Day of week
  const dayNames = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
  if (cron.dayOfWeek.length < 7) {
    if (arraysEqual(cron.dayOfWeek, [1, 2, 3, 4, 5])) {
      parts.push('de lunes a viernes')
    } else if (arraysEqual(cron.dayOfWeek, [0, 6])) {
      parts.push('fines de semana')
    } else {
      parts.push(`los ${cron.dayOfWeek.map(d => dayNames[d]).join(', ')}`)
    }
  }

  // Day of month
  if (cron.dayOfMonth.length < 31 && cron.dayOfMonth.length > 0) {
    parts.push(`el día ${formatList(cron.dayOfMonth)} del mes`)
  }

  // Month
  const monthNames = ['', 'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
                      'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
  if (cron.month.length < 12) {
    parts.push(`en ${cron.month.map(m => monthNames[m]).join(', ')}`)
  }

  return parts.join(' ') || 'Frecuencia personalizada'
}

function formatList(arr: number[]): string {
  if (arr.length === 0) return ''
  if (arr.length === 1) return arr[0].toString()
  if (arr.length === 2) return `${arr[0]} y ${arr[1]}`
  return arr.slice(0, -1).join(', ') + ' y ' + arr[arr.length - 1]
}

function arraysEqual(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return false
  const sortedA = [...a].sort()
  const sortedB = [...b].sort()
  return sortedA.every((val, idx) => val === sortedB[idx])
}

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Valida una expresión cron
 */
export function validateCronExpression(expression: string): {
  valid: boolean
  error?: string
  nextExecution?: Date
} {
  const cron = parseCronExpression(expression)

  if (!cron) {
    return {
      valid: false,
      error: 'Formato de cron inválido. Use: minuto hora día_mes mes día_semana',
    }
  }

  const next = getNextExecution(expression)

  if (!next) {
    return {
      valid: false,
      error: 'No se pudo calcular la próxima ejecución',
    }
  }

  return {
    valid: true,
    nextExecution: next,
  }
}
