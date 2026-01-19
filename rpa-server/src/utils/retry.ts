// HV Consultores - SII RPA Server
// Retry Utility - Exponential backoff for failed tasks

import { logger } from './logger'

// ============================================================================
// TYPES
// ============================================================================

export interface RetryOptions {
  maxRetries: number
  initialDelayMs: number
  maxDelayMs: number
  backoffMultiplier: number
  retryableErrors?: string[]
  onRetry?: (attempt: number, error: Error, delayMs: number) => void
}

export interface RetryResult<T> {
  success: boolean
  data?: T
  error?: Error
  attempts: number
  totalTimeMs: number
}

// ============================================================================
// DEFAULT OPTIONS
// ============================================================================

export const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxRetries: 3,
  initialDelayMs: 1000,      // 1 second
  maxDelayMs: 30000,         // 30 seconds
  backoffMultiplier: 2,
  retryableErrors: [
    'ETIMEDOUT',
    'ECONNRESET',
    'ECONNREFUSED',
    'NETWORK_ERROR',
    'TIMEOUT',
    'PAGE_LOAD_TIMEOUT',
    'NAVIGATION_TIMEOUT',
    'SELECTOR_TIMEOUT',
    'SESSION_EXPIRED',
  ],
}

// ============================================================================
// RETRY WITH EXPONENTIAL BACKOFF
// ============================================================================

/**
 * Executes a function with exponential backoff retry logic
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<RetryResult<T>> {
  const opts: RetryOptions = { ...DEFAULT_RETRY_OPTIONS, ...options }
  const startTime = Date.now()
  let lastError: Error | undefined
  let attempts = 0

  for (let i = 0; i <= opts.maxRetries; i++) {
    attempts = i + 1

    try {
      const data = await fn()
      return {
        success: true,
        data,
        attempts,
        totalTimeMs: Date.now() - startTime,
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

      // Check if this is the last attempt
      if (i === opts.maxRetries) {
        break
      }

      // Check if error is retryable
      if (!isRetryableError(lastError, opts.retryableErrors)) {
        logger.warn('Non-retryable error encountered', {
          error: lastError.message,
          attempt: attempts,
        })
        break
      }

      // Calculate delay with exponential backoff + jitter
      const baseDelay = opts.initialDelayMs * Math.pow(opts.backoffMultiplier, i)
      const jitter = Math.random() * 0.3 * baseDelay // Add up to 30% jitter
      const delayMs = Math.min(baseDelay + jitter, opts.maxDelayMs)

      logger.info('Retrying after error', {
        attempt: attempts,
        maxRetries: opts.maxRetries,
        delayMs: Math.round(delayMs),
        error: lastError.message,
      })

      // Callback for retry event
      if (opts.onRetry) {
        opts.onRetry(attempts, lastError, delayMs)
      }

      // Wait before retrying
      await sleep(delayMs)
    }
  }

  return {
    success: false,
    error: lastError,
    attempts,
    totalTimeMs: Date.now() - startTime,
  }
}

// ============================================================================
// RETRY FOR SPECIFIC SII OPERATIONS
// ============================================================================

export const SII_RETRY_OPTIONS: Record<string, Partial<RetryOptions>> = {
  // Login: fewer retries, quick failures
  login: {
    maxRetries: 2,
    initialDelayMs: 2000,
    maxDelayMs: 10000,
    retryableErrors: ['TIMEOUT', 'NETWORK_ERROR', 'PAGE_LOAD_TIMEOUT'],
  },

  // F29 Submit: more retries, longer delays (critical operation)
  f29_submit: {
    maxRetries: 3,
    initialDelayMs: 3000,
    maxDelayMs: 60000,
    retryableErrors: ['TIMEOUT', 'NETWORK_ERROR', 'SESSION_EXPIRED', 'NAVIGATION_TIMEOUT'],
  },

  // Downloads: moderate retries
  download: {
    maxRetries: 3,
    initialDelayMs: 2000,
    maxDelayMs: 30000,
    retryableErrors: ['TIMEOUT', 'NETWORK_ERROR', 'DOWNLOAD_FAILED'],
  },

  // Page navigation: quick retries
  navigation: {
    maxRetries: 2,
    initialDelayMs: 1000,
    maxDelayMs: 10000,
    retryableErrors: ['NAVIGATION_TIMEOUT', 'PAGE_LOAD_TIMEOUT'],
  },

  // Element interaction: quick retries
  interaction: {
    maxRetries: 3,
    initialDelayMs: 500,
    maxDelayMs: 5000,
    retryableErrors: ['SELECTOR_TIMEOUT', 'ELEMENT_NOT_FOUND', 'ELEMENT_NOT_VISIBLE'],
  },
}

/**
 * Execute a SII operation with appropriate retry settings
 */
export async function withSiiRetry<T>(
  operationType: keyof typeof SII_RETRY_OPTIONS,
  fn: () => Promise<T>,
  additionalOptions?: Partial<RetryOptions>
): Promise<RetryResult<T>> {
  const baseOptions = SII_RETRY_OPTIONS[operationType] || {}
  return withRetry(fn, { ...baseOptions, ...additionalOptions })
}

// ============================================================================
// HELPERS
// ============================================================================

function isRetryableError(error: Error, retryableErrors?: string[]): boolean {
  if (!retryableErrors || retryableErrors.length === 0) {
    return true // Retry all errors by default
  }

  const errorString = `${error.name} ${error.message}`.toUpperCase()

  return retryableErrors.some(retryableError =>
    errorString.includes(retryableError.toUpperCase())
  )
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// ============================================================================
// CIRCUIT BREAKER
// ============================================================================

interface CircuitBreakerState {
  failures: number
  lastFailure: number
  state: 'closed' | 'open' | 'half-open'
}

export class CircuitBreaker {
  private state: CircuitBreakerState = {
    failures: 0,
    lastFailure: 0,
    state: 'closed',
  }

  constructor(
    private readonly failureThreshold: number = 5,
    private readonly resetTimeMs: number = 60000 // 1 minute
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // Check if circuit is open
    if (this.state.state === 'open') {
      // Check if enough time has passed to try again
      if (Date.now() - this.state.lastFailure >= this.resetTimeMs) {
        this.state.state = 'half-open'
      } else {
        throw new Error('Circuit breaker is open')
      }
    }

    try {
      const result = await fn()

      // Reset on success
      if (this.state.state === 'half-open') {
        this.reset()
      }

      return result
    } catch (error) {
      this.recordFailure()
      throw error
    }
  }

  private recordFailure(): void {
    this.state.failures++
    this.state.lastFailure = Date.now()

    if (this.state.failures >= this.failureThreshold) {
      this.state.state = 'open'
      logger.warn('Circuit breaker opened', {
        failures: this.state.failures,
        threshold: this.failureThreshold,
      })
    }
  }

  private reset(): void {
    this.state = {
      failures: 0,
      lastFailure: 0,
      state: 'closed',
    }
    logger.info('Circuit breaker reset')
  }

  getState(): CircuitBreakerState {
    return { ...this.state }
  }
}

// ============================================================================
// RATE LIMITER
// ============================================================================

export class RateLimiter {
  private requests: number[] = []

  constructor(
    private readonly maxRequests: number,
    private readonly windowMs: number
  ) {}

  async acquire(): Promise<void> {
    const now = Date.now()

    // Remove expired requests
    this.requests = this.requests.filter(time => now - time < this.windowMs)

    if (this.requests.length >= this.maxRequests) {
      // Calculate wait time
      const oldestRequest = this.requests[0]
      const waitTime = this.windowMs - (now - oldestRequest)

      logger.debug('Rate limit reached, waiting', { waitTime })
      await sleep(waitTime)

      // Retry after waiting
      return this.acquire()
    }

    this.requests.push(now)
  }
}
