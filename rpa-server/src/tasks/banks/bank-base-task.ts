// HV Consultores - Bank RPA Server
// Base Task Class for Bank Automation
// Features: Enhanced anti-detection, OTP handling, session management

import { Page, BrowserContext, ElementHandle } from 'playwright'
import { logger } from '../../utils/logger'
import { sendWebhook } from '../../utils/webhook'

// ============================================================================
// TYPES
// ============================================================================

export type BankCode = 'bancochile' | 'bancoestado' | 'santander' | 'bci'

export type BankTaskStatus =
  | 'pending'
  | 'running'
  | 'waiting_otp'
  | 'downloading'
  | 'completed'
  | 'failed'
  | 'cancelled'

export interface BankCredentials {
  rut: string
  password: string
  tokenSerial?: string // Para dispositivos físicos de token
  emailOtp?: string // Email para recibir OTP
  phoneOtp?: string // Teléfono para SMS
}

export interface BankTaskContext {
  jobId: string
  sessionId: string
  banco: BankCode
  credentials: BankCredentials
  params: {
    cuenta?: string
    mes?: number
    año?: number
    fechaDesde?: string
    fechaHasta?: string
  }
  page: Page
  context: BrowserContext
  downloadPath: string
}

export interface BankTaskResult {
  success: boolean
  data?: Record<string, unknown>
  files?: Array<{
    type: string
    name: string
    path: string
    size: number
    format: string
  }>
  error?: {
    code: string
    message: string
    step?: string
    recoverable?: boolean
  }
  screenshots: Array<{
    step: string
    path: string
    timestamp: string
  }>
  duration_ms: number
  requiresOtp?: boolean
  otpMethod?: 'sms' | 'email' | 'token' | 'app'
}

// ============================================================================
// BANK CONFIGURATION
// ============================================================================

export const BANK_CONFIG = {
  TIMEOUTS: {
    PAGE_LOAD: 30000,
    ELEMENT_VISIBLE: 10000,
    LOGIN: 15000,
    OTP_WAIT: 120000, // 2 minutos para OTP
    DOWNLOAD: 60000,
    SESSION_CHECK: 5000,
  },
  ANTI_DETECTION: {
    ENABLED: true,
    MIN_DELAY_MS: 800,
    MAX_DELAY_MS: 2500,
    TYPING_MIN_MS: 50,
    TYPING_MAX_MS: 150,
    MOUSE_MOVEMENTS: true,
    RANDOM_SCROLLS: true,
  },
  SCREENSHOTS: {
    ENABLED: true,
    FULL_PAGE: false,
    QUALITY: 80,
  },
  RETRY: {
    MAX_ATTEMPTS: 3,
    DELAY_MS: 2000,
  },
}

// ============================================================================
// BANK BASE TASK CLASS
// ============================================================================

export abstract class BankBaseTask {
  protected context: BankTaskContext
  protected page: Page
  protected startTime: number = 0
  protected currentStep: string = ''
  protected screenshots: Array<{ step: string; path: string; timestamp: string }> = []
  protected aborted: boolean = false
  protected loggedIn: boolean = false
  protected sessionStartTime: number = 0

  constructor(context: BankTaskContext) {
    this.context = context
    this.page = context.page
  }

  // Abstract methods - to be implemented by each bank task
  abstract getBankCode(): BankCode
  abstract getBankName(): string
  abstract getTaskName(): string
  abstract getLoginUrl(): string
  abstract getSelectors(): BankSelectors
  abstract executeSteps(): Promise<Record<string, unknown> | undefined>

  // Optional hooks for bank-specific behavior
  protected async beforeLogin(): Promise<void> {}
  protected async afterLogin(): Promise<void> {}
  protected async handleOtpRequest(): Promise<{ method: string; sent: boolean }> {
    return { method: 'unknown', sent: false }
  }

  async execute(): Promise<BankTaskResult> {
    this.startTime = Date.now()

    try {
      logger.info(`Starting bank task: ${this.getTaskName()}`, {
        jobId: this.context.jobId,
        banco: this.getBankCode(),
      })

      // Pre-login hook
      await this.beforeLogin()

      // Execute login
      const loginResult = await this.performLogin()

      if (loginResult.requiresOtp) {
        return this.createResult(false, undefined, undefined, {
          requiresOtp: true,
          otpMethod: loginResult.otpMethod,
        })
      }

      // Check if aborted
      if (this.aborted) {
        return this.createResult(false, undefined, {
          code: 'TASK_CANCELLED',
          message: 'Task was cancelled',
          recoverable: false,
        })
      }

      // Post-login hook
      await this.afterLogin()

      // Execute task-specific steps
      const data = await this.executeSteps()

      // Logout safely
      await this.performLogout()

      return this.createResult(true, data)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      const errorCode = this.categorizeError(errorMessage)

      logger.error(`Bank task failed: ${this.getTaskName()}`, {
        jobId: this.context.jobId,
        banco: this.getBankCode(),
        error: errorMessage,
        step: this.currentStep,
      })

      // Take error screenshot
      await this.takeScreenshot('error')

      // Try to logout even on error
      await this.performLogout().catch(() => {})

      return this.createResult(false, undefined, {
        code: errorCode,
        message: errorMessage,
        step: this.currentStep,
        recoverable: this.isRecoverableError(errorCode),
      })
    }
  }

  abort(): void {
    this.aborted = true
    logger.info('Bank task abort requested', {
      jobId: this.context.jobId,
      banco: this.getBankCode(),
    })
  }

  // ============================================================================
  // LOGIN METHODS
  // ============================================================================

  protected async performLogin(): Promise<{ success: boolean; requiresOtp?: boolean; otpMethod?: string }> {
    this.currentStep = 'login'
    const selectors = this.getSelectors()

    logger.info('Performing bank login', {
      jobId: this.context.jobId,
      banco: this.getBankCode(),
    })

    // Navigate to login page
    await this.navigateWithRetry(this.getLoginUrl())
    await this.takeScreenshot('login_page')

    // Random scroll to appear human
    await this.randomScroll()

    // Fill RUT
    await this.waitAndType(selectors.rutInput, this.formatRutForInput(this.context.credentials.rut))
    await this.humanDelay()

    // Fill password with human-like typing
    await this.waitAndTypeSlowly(selectors.passwordInput, this.context.credentials.password)
    await this.humanDelay()

    await this.takeScreenshot('login_filled')

    // Click login button
    await this.humanDelay(500, 1000)
    await this.clickWithMouse(selectors.loginButton)

    // Wait for response
    await this.page.waitForLoadState('networkidle', {
      timeout: BANK_CONFIG.TIMEOUTS.LOGIN,
    }).catch(() => {})

    await this.humanDelay()
    await this.takeScreenshot('login_response')

    // Check for OTP requirement
    if (selectors.otpInput) {
      const otpElement = await this.page.$(selectors.otpInput)
      if (otpElement && await otpElement.isVisible()) {
        logger.info('OTP required', {
          jobId: this.context.jobId,
          banco: this.getBankCode(),
        })

        const otpInfo = await this.handleOtpRequest()
        return {
          success: false,
          requiresOtp: true,
          otpMethod: otpInfo.method,
        }
      }
    }

    // Check for token requirement
    if (selectors.tokenInput) {
      const tokenElement = await this.page.$(selectors.tokenInput)
      if (tokenElement && await tokenElement.isVisible()) {
        // Handle token input if we have credentials for it
        if (this.context.credentials.tokenSerial) {
          logger.info('Token input detected, will need token value', {
            jobId: this.context.jobId,
          })
          return {
            success: false,
            requiresOtp: true,
            otpMethod: 'token',
          }
        }
      }
    }

    // Check for login errors
    const error = await this.checkLoginError()
    if (error) {
      throw new Error(`Login failed: ${error}`)
    }

    // Verify successful login
    await this.verifyLogin()

    this.loggedIn = true
    this.sessionStartTime = Date.now()

    logger.info('Bank login successful', {
      jobId: this.context.jobId,
      banco: this.getBankCode(),
    })

    await this.takeScreenshot('login_success')

    return { success: true }
  }

  protected async submitOtp(otpCode: string): Promise<void> {
    const selectors = this.getSelectors()

    if (!selectors.otpInput) {
      throw new Error('No OTP input selector defined for this bank')
    }

    await this.waitAndType(selectors.otpInput, otpCode)
    await this.humanDelay()

    if (selectors.otpSubmit) {
      await this.clickWithMouse(selectors.otpSubmit)
    } else {
      await this.page.press(selectors.otpInput, 'Enter')
    }

    await this.page.waitForLoadState('networkidle', {
      timeout: BANK_CONFIG.TIMEOUTS.LOGIN,
    }).catch(() => {})

    const error = await this.checkLoginError()
    if (error) {
      throw new Error(`OTP verification failed: ${error}`)
    }

    await this.verifyLogin()
    this.loggedIn = true
    this.sessionStartTime = Date.now()
  }

  protected async verifyLogin(): Promise<void> {
    const selectors = this.getSelectors()

    // Check for error messages
    if (selectors.errorMessage) {
      const errorElement = await this.page.$(selectors.errorMessage)
      if (errorElement && await errorElement.isVisible()) {
        const errorText = await errorElement.textContent()
        throw new Error(`Login failed: ${errorText || 'Unknown error'}`)
      }
    }

    // Wait for dashboard/logged-in indicator
    // This is bank-specific, implement in subclass if needed
    await this.humanDelay()
  }

  protected async checkLoginError(): Promise<string | null> {
    const selectors = this.getSelectors()

    if (selectors.errorMessage) {
      const errorElement = await this.page.$(selectors.errorMessage)
      if (errorElement && await errorElement.isVisible()) {
        return await errorElement.textContent() || 'Unknown error'
      }
    }

    return null
  }

  protected async performLogout(): Promise<void> {
    if (!this.loggedIn) return

    const selectors = this.getSelectors()

    try {
      this.currentStep = 'logout'

      // Click user menu if exists
      if (selectors.userMenu) {
        const userMenu = await this.page.$(selectors.userMenu)
        if (userMenu && await userMenu.isVisible()) {
          await this.clickWithMouse(selMenu.selector || selectors.userMenu)
          await this.humanDelay(300, 600)
        }
      }

      // Click logout
      if (selectors.logoutButton) {
        const logoutBtn = await this.page.$(selectors.logoutButton)
        if (logoutBtn && await logoutBtn.isVisible()) {
          await this.clickWithMouse(selectors.logoutButton)
          await this.humanDelay()
        }
      }

      this.loggedIn = false
      logger.info('Bank logout successful', {
        jobId: this.context.jobId,
        banco: this.getBankCode(),
      })
    } catch (error) {
      logger.warn('Logout failed', {
        jobId: this.context.jobId,
        error,
      })
    }
  }

  // ============================================================================
  // NAVIGATION METHODS
  // ============================================================================

  protected async navigateWithRetry(url: string, maxRetries = 3): Promise<void> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await this.page.goto(url, {
          waitUntil: 'domcontentloaded',
          timeout: BANK_CONFIG.TIMEOUTS.PAGE_LOAD,
        })
        await this.page.waitForLoadState('networkidle', {
          timeout: BANK_CONFIG.TIMEOUTS.PAGE_LOAD,
        }).catch(() => {})
        return
      } catch (error) {
        if (attempt === maxRetries) throw error
        logger.warn(`Navigation failed, retrying (${attempt}/${maxRetries})`, {
          url,
          error,
        })
        await this.delay(BANK_CONFIG.RETRY.DELAY_MS * attempt)
      }
    }
  }

  protected async navigateToCartolas(): Promise<void> {
    const selectors = this.getSelectors()

    if (selectors.menuCartolas) {
      await this.clickWithMouse(selectors.menuCartolas)
      await this.page.waitForLoadState('networkidle', {
        timeout: BANK_CONFIG.TIMEOUTS.PAGE_LOAD,
      }).catch(() => {})
      await this.humanDelay()
    }
  }

  // ============================================================================
  // ANTI-DETECTION METHODS
  // ============================================================================

  protected async humanDelay(min?: number, max?: number): Promise<void> {
    if (!BANK_CONFIG.ANTI_DETECTION.ENABLED) return

    const minDelay = min ?? BANK_CONFIG.ANTI_DETECTION.MIN_DELAY_MS
    const maxDelay = max ?? BANK_CONFIG.ANTI_DETECTION.MAX_DELAY_MS
    const delay = Math.random() * (maxDelay - minDelay) + minDelay

    await new Promise((resolve) => setTimeout(resolve, delay))
  }

  protected async delay(ms: number): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, ms))
  }

  protected async waitAndType(selector: string, text: string): Promise<void> {
    await this.page.waitForSelector(selector, {
      timeout: BANK_CONFIG.TIMEOUTS.ELEMENT_VISIBLE,
    })
    await this.humanDelay(200, 400)
    await this.page.fill(selector, text)
  }

  protected async waitAndTypeSlowly(selector: string, text: string): Promise<void> {
    await this.page.waitForSelector(selector, {
      timeout: BANK_CONFIG.TIMEOUTS.ELEMENT_VISIBLE,
    })
    await this.humanDelay(200, 400)

    // Click to focus
    await this.page.click(selector)
    await this.humanDelay(100, 200)

    // Type character by character with random delays
    for (const char of text) {
      await this.page.keyboard.type(char)
      const charDelay = Math.random() *
        (BANK_CONFIG.ANTI_DETECTION.TYPING_MAX_MS - BANK_CONFIG.ANTI_DETECTION.TYPING_MIN_MS) +
        BANK_CONFIG.ANTI_DETECTION.TYPING_MIN_MS
      await this.delay(charDelay)
    }
  }

  protected async clickWithMouse(selector: string): Promise<void> {
    const element = await this.page.waitForSelector(selector, {
      timeout: BANK_CONFIG.TIMEOUTS.ELEMENT_VISIBLE,
    })

    if (!element) {
      throw new Error(`Element not found: ${selector}`)
    }

    // Get element position
    const box = await element.boundingBox()
    if (!box) {
      throw new Error(`Element not visible: ${selector}`)
    }

    // Move mouse to random position within element
    const x = box.x + Math.random() * box.width
    const y = box.y + Math.random() * box.height

    if (BANK_CONFIG.ANTI_DETECTION.MOUSE_MOVEMENTS) {
      // Move mouse in steps
      await this.page.mouse.move(x, y, { steps: Math.floor(Math.random() * 5) + 3 })
      await this.humanDelay(50, 150)
    }

    await this.page.mouse.click(x, y)
  }

  protected async randomScroll(): Promise<void> {
    if (!BANK_CONFIG.ANTI_DETECTION.RANDOM_SCROLLS) return

    const scrollAmount = Math.floor(Math.random() * 200) + 50
    const direction = Math.random() > 0.5 ? 1 : -1

    await this.page.mouse.wheel(0, scrollAmount * direction)
    await this.humanDelay(200, 500)
    await this.page.mouse.wheel(0, -scrollAmount * direction * 0.5)
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  protected formatRutForInput(rut: string): string {
    // Remove dots and dashes, return clean format
    return rut.replace(/\./g, '').replace(/-/g, '')
  }

  protected parseRut(rut: string): { numero: string; dv: string } | null {
    const clean = rut.replace(/\./g, '').replace(/-/g, '')
    if (clean.length < 2) return null

    return {
      numero: clean.slice(0, -1),
      dv: clean.slice(-1).toUpperCase(),
    }
  }

  protected async takeScreenshot(stepName: string): Promise<void> {
    if (!BANK_CONFIG.SCREENSHOTS.ENABLED) return

    try {
      const timestamp = new Date().toISOString()
      const filename = `${this.context.jobId}_${this.getBankCode()}_${stepName}_${Date.now()}.png`
      const path = `/tmp/screenshots/${filename}`

      await this.page.screenshot({
        path,
        fullPage: BANK_CONFIG.SCREENSHOTS.FULL_PAGE,
        quality: BANK_CONFIG.SCREENSHOTS.QUALITY,
        type: 'jpeg',
      })

      this.screenshots.push({
        step: stepName,
        path,
        timestamp,
      })

      logger.debug('Screenshot taken', {
        jobId: this.context.jobId,
        banco: this.getBankCode(),
        step: stepName,
      })
    } catch (error) {
      logger.error('Failed to take screenshot', {
        jobId: this.context.jobId,
        step: stepName,
        error,
      })
    }
  }

  protected async downloadFile(buttonSelector: string): Promise<{ path: string; filename: string } | null> {
    try {
      const [download] = await Promise.all([
        this.page.waitForEvent('download', {
          timeout: BANK_CONFIG.TIMEOUTS.DOWNLOAD,
        }),
        this.page.click(buttonSelector),
      ])

      const filename = download.suggestedFilename()
      const path = `${this.context.downloadPath}/${filename}`
      await download.saveAs(path)

      logger.info('File downloaded', {
        jobId: this.context.jobId,
        filename,
        path,
      })

      return { path, filename }
    } catch (error) {
      logger.error('Download failed', {
        jobId: this.context.jobId,
        error,
      })
      return null
    }
  }

  protected async selectOption(selector: string, value: string): Promise<void> {
    await this.page.waitForSelector(selector, {
      timeout: BANK_CONFIG.TIMEOUTS.ELEMENT_VISIBLE,
    })
    await this.humanDelay(100, 300)
    await this.page.selectOption(selector, value)
  }

  protected async reportProgress(stepName: string, data?: Record<string, unknown>): Promise<void> {
    await sendWebhook(this.context.jobId, 'step_completed', {
      step: stepName,
      banco: this.getBankCode(),
      data,
    })
  }

  protected categorizeError(message: string): string {
    const lowerMessage = message.toLowerCase()

    if (lowerMessage.includes('timeout')) return 'TIMEOUT_ERROR'
    if (lowerMessage.includes('login') || lowerMessage.includes('credencial')) return 'LOGIN_ERROR'
    if (lowerMessage.includes('session') || lowerMessage.includes('sesión')) return 'SESSION_ERROR'
    if (lowerMessage.includes('network') || lowerMessage.includes('connection')) return 'NETWORK_ERROR'
    if (lowerMessage.includes('otp') || lowerMessage.includes('token')) return 'OTP_ERROR'
    if (lowerMessage.includes('download') || lowerMessage.includes('descarga')) return 'DOWNLOAD_ERROR'
    if (lowerMessage.includes('element') || lowerMessage.includes('selector')) return 'SELECTOR_ERROR'

    return 'UNKNOWN_ERROR'
  }

  protected isRecoverableError(code: string): boolean {
    const recoverableErrors = ['TIMEOUT_ERROR', 'NETWORK_ERROR', 'SESSION_ERROR']
    return recoverableErrors.includes(code)
  }

  protected createResult(
    success: boolean,
    data?: Record<string, unknown>,
    error?: { code: string; message: string; step?: string; recoverable?: boolean },
    extra?: { requiresOtp?: boolean; otpMethod?: string }
  ): BankTaskResult {
    return {
      success,
      data,
      error,
      screenshots: this.screenshots,
      duration_ms: Date.now() - this.startTime,
      ...extra,
    }
  }
}

// ============================================================================
// SELECTOR INTERFACE
// ============================================================================

export interface BankSelectors {
  // Login
  rutInput: string
  passwordInput: string
  loginButton: string
  otpInput?: string
  otpSubmit?: string
  tokenInput?: string

  // Post-login
  errorMessage?: string
  sessionExpiredModal?: string

  // Navigation
  menuCuentas?: string
  menuCartolas?: string

  // Cartolas
  accountSelector?: string
  monthSelector?: string
  yearSelector?: string
  dateFromInput?: string
  dateToInput?: string
  searchButton?: string
  downloadButton?: string
  downloadPdfButton?: string
  downloadExcelButton?: string

  // Table
  transactionsTable?: string
  transactionRow?: string
  noDataMessage?: string

  // Logout
  userMenu?: string
  logoutButton?: string
}
