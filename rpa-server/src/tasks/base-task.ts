// HV Consultores - SII RPA Server
// Base Task Class - Foundation for all SII automation tasks

import { Page, BrowserContext } from 'playwright'
import { logger } from '../utils/logger'
import { sendWebhook } from '../utils/webhook'
import { SII_CONFIG, SII_SELECTORS } from '../selectors/sii-selectors'

// ============================================================================
// TYPES
// ============================================================================

export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'

export interface TaskCredentials {
  rut: string
  password: string
  authMethod: 'rut_clave' | 'clave_unica' | 'certificado_digital'
  rutRepresentante?: string
  certificatePath?: string
  certificatePassword?: string
}

export interface TaskContext {
  jobId: string
  sessionId: string
  credentials: TaskCredentials
  params: Record<string, unknown>
  page: Page
  context: BrowserContext
}

export interface TaskResult {
  success: boolean
  data?: Record<string, unknown>
  files?: Array<{
    type: string
    path: string
    size: number
  }>
  error?: {
    code: string
    message: string
    step?: string
  }
  screenshots: Array<{
    step: string
    path: string
    timestamp: string
  }>
  duration_ms: number
}

export interface TaskStep {
  name: string
  description: string
  execute: () => Promise<void>
}

// ============================================================================
// BASE TASK CLASS
// ============================================================================

export abstract class BaseTask {
  protected context: TaskContext
  protected page: Page
  protected startTime: number = 0
  protected currentStep: string = ''
  protected screenshots: Array<{ step: string; path: string; timestamp: string }> = []
  protected aborted: boolean = false

  constructor(context: TaskContext) {
    this.context = context
    this.page = context.page
  }

  // Abstract method - to be implemented by each task
  abstract getTaskName(): string
  abstract executeSteps(): Promise<Record<string, unknown> | undefined>

  async execute(): Promise<TaskResult> {
    this.startTime = Date.now()

    try {
      logger.info(`Starting task: ${this.getTaskName()}`, {
        jobId: this.context.jobId,
      })

      // Execute login first if needed
      await this.performLogin()

      // Check if aborted after login
      if (this.aborted) {
        return this.createResult(false, undefined, {
          code: 'TASK_CANCELLED',
          message: 'Task was cancelled',
        })
      }

      // Execute task-specific steps
      const data = await this.executeSteps()

      return this.createResult(true, data)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'

      logger.error(`Task failed: ${this.getTaskName()}`, {
        jobId: this.context.jobId,
        error: errorMessage,
        step: this.currentStep,
      })

      // Take error screenshot
      await this.takeScreenshot('error')

      return this.createResult(false, undefined, {
        code: 'TASK_ERROR',
        message: errorMessage,
        step: this.currentStep,
      })
    }
  }

  abort(): void {
    this.aborted = true
    logger.info('Task abort requested', { jobId: this.context.jobId })
  }

  protected async performLogin(): Promise<void> {
    this.currentStep = 'login'

    logger.info('Performing login', {
      jobId: this.context.jobId,
      authMethod: this.context.credentials.authMethod,
    })

    const { rut, password, authMethod } = this.context.credentials

    // Navigate to login page
    await this.page.goto(SII_CONFIG.URLS.LOGIN, {
      waitUntil: 'networkidle',
      timeout: SII_CONFIG.TIMEOUTS.PAGE_LOAD,
    })

    await this.takeScreenshot('login_page')

    // Select auth method
    if (authMethod === 'rut_clave') {
      await this.loginWithRutClave(rut, password)
    } else if (authMethod === 'clave_unica') {
      await this.loginWithClaveUnica(rut, password)
    } else {
      throw new Error(`Unsupported auth method: ${authMethod}`)
    }

    // Verify login success
    await this.verifyLogin()
    await this.takeScreenshot('login_success')

    logger.info('Login successful', { jobId: this.context.jobId })
  }

  private async loginWithRutClave(rut: string, password: string): Promise<void> {
    // Parse RUT
    const rutParts = this.parseRut(rut)
    if (!rutParts) {
      throw new Error('Invalid RUT format')
    }

    // Wait for and fill RUT field
    await this.page.waitForSelector(SII_SELECTORS.LOGIN.RUT_INPUT, {
      timeout: SII_CONFIG.TIMEOUTS.ELEMENT_VISIBLE,
    })

    await this.humanDelay()
    await this.page.fill(SII_SELECTORS.LOGIN.RUT_INPUT, rutParts.numero)

    // Fill DV if separate field exists
    const dvField = await this.page.$(SII_SELECTORS.LOGIN.RUT_VERIFICADOR)
    if (dvField) {
      await this.humanDelay()
      await dvField.fill(rutParts.dv)
    }

    // Fill password
    await this.humanDelay()
    await this.page.fill(SII_SELECTORS.LOGIN.PASSWORD_INPUT, password)

    // Submit
    await this.humanDelay()
    await this.page.click(SII_SELECTORS.LOGIN.LOGIN_BUTTON)

    // Wait for navigation
    await this.page.waitForLoadState('networkidle', {
      timeout: SII_CONFIG.TIMEOUTS.LOGIN,
    })
  }

  private async loginWithClaveUnica(rut: string, password: string): Promise<void> {
    // Click Clave Única button
    await this.page.click(SII_SELECTORS.LOGIN.CLAVE_UNICA_BUTTON)

    // Wait for Clave Única page
    await this.page.waitForLoadState('networkidle', {
      timeout: SII_CONFIG.TIMEOUTS.PAGE_LOAD,
    })

    await this.takeScreenshot('clave_unica_page')

    // Fill RUT
    await this.humanDelay()
    await this.page.fill(SII_SELECTORS.LOGIN.CLAVE_UNICA_RUT, rut)

    // Fill password
    await this.humanDelay()
    await this.page.fill(SII_SELECTORS.LOGIN.CLAVE_UNICA_PASSWORD, password)

    // Submit
    await this.humanDelay()
    await this.page.click(SII_SELECTORS.LOGIN.CLAVE_UNICA_SUBMIT)

    // Wait for redirect back to SII
    await this.page.waitForLoadState('networkidle', {
      timeout: SII_CONFIG.TIMEOUTS.LOGIN,
    })
  }

  private async verifyLogin(): Promise<void> {
    // Check for error messages
    const errorElement = await this.page.$(SII_SELECTORS.LOGIN.ERROR_MESSAGE)
    if (errorElement) {
      const errorText = await errorElement.textContent()
      throw new Error(`Login failed: ${errorText || 'Unknown error'}`)
    }

    // Check for login success indicator
    try {
      await this.page.waitForSelector(SII_SELECTORS.LOGIN.LOGGED_IN_INDICATOR, {
        timeout: SII_CONFIG.TIMEOUTS.ELEMENT_VISIBLE,
      })
    } catch {
      throw new Error('Login verification failed: Could not find logged-in indicator')
    }
  }

  protected async takeScreenshot(stepName: string): Promise<void> {
    if (!SII_CONFIG.SCREENSHOTS.ENABLED) return

    try {
      const timestamp = new Date().toISOString()
      const filename = `${this.context.jobId}_${stepName}_${Date.now()}.png`
      const path = `/tmp/screenshots/${filename}`

      await this.page.screenshot({
        path,
        fullPage: SII_CONFIG.SCREENSHOTS.FULL_PAGE,
        quality: SII_CONFIG.SCREENSHOTS.QUALITY,
        type: 'jpeg',
      })

      this.screenshots.push({
        step: stepName,
        path,
        timestamp,
      })

      logger.debug('Screenshot taken', { jobId: this.context.jobId, step: stepName })
    } catch (error) {
      logger.error('Failed to take screenshot', {
        jobId: this.context.jobId,
        step: stepName,
        error,
      })
    }
  }

  protected async humanDelay(min?: number, max?: number): Promise<void> {
    if (!SII_CONFIG.ANTI_DETECTION.RANDOM_DELAYS) return

    const minDelay = min || SII_CONFIG.ANTI_DETECTION.MIN_DELAY_MS
    const maxDelay = max || SII_CONFIG.ANTI_DETECTION.MAX_DELAY_MS
    const delay = Math.random() * (maxDelay - minDelay) + minDelay

    await new Promise((resolve) => setTimeout(resolve, delay))
  }

  protected parseRut(rut: string): { numero: string; dv: string } | null {
    const clean = rut.replace(/\./g, '').replace(/-/g, '')
    if (clean.length < 2) return null

    return {
      numero: clean.slice(0, -1),
      dv: clean.slice(-1).toUpperCase(),
    }
  }

  protected createResult(
    success: boolean,
    data?: Record<string, unknown>,
    error?: { code: string; message: string; step?: string }
  ): TaskResult {
    return {
      success,
      data,
      error,
      screenshots: this.screenshots,
      duration_ms: Date.now() - this.startTime,
    }
  }

  protected async reportStepProgress(stepName: string, data?: Record<string, unknown>): Promise<void> {
    await sendWebhook(this.context.jobId, 'step_completed', {
      step: stepName,
      data,
    })
  }
}
