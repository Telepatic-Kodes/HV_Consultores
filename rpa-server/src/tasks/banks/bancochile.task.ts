// HV Consultores - Bank RPA Server
// Banco de Chile Task - Descarga de Cartolas

import { BankBaseTask, BankSelectors, BankTaskContext, BANK_CONFIG } from './bank-base-task'
import { logger } from '../../utils/logger'

// ============================================================================
// BANCO DE CHILE CONFIGURATION
// ============================================================================

const BANCOCHILE_URLS = {
  BASE: 'https://portalemp.bancochile.cl',
  LOGIN: 'https://portalemp.bancochile.cl/empresas',
  LOGIN_PERSONAS: 'https://portalpersonas.bancochile.cl/mibancochile/login',
  CARTOLAS: 'https://portalemp.bancochile.cl/empresas/cartola',
  SALDOS: 'https://portalemp.bancochile.cl/empresas/saldos',
}

const BANCOCHILE_SELECTORS: BankSelectors = {
  // Login - Empresas
  rutInput: '#rut, input[name="rut"], input[placeholder*="RUT"]',
  passwordInput: '#clave, #pass, input[name="password"], input[type="password"]',
  loginButton: '#btnIngresar, button[type="submit"], .btn-ingresar',
  otpInput: '#otp, #codigoOTP, input[name="otp"]',
  otpSubmit: '#btnValidarOtp, #btnValidar',
  tokenInput: '#token, input[name="token"], input[placeholder*="token"]',

  // Error detection
  errorMessage: '.alert-danger, .error-message, .mensaje-error, #errorLogin',
  sessionExpiredModal: '#sessionExpiredModal, .modal-sesion-expirada',

  // Navigation
  menuCuentas: '[data-menu="cuentas"], a[href*="cuentas"]',
  menuCartolas: '[data-menu="cartolas"], a[href*="cartola"]',

  // Cartola page
  accountSelector: '#selectCuenta, select[name="cuenta"], #cuentaOrigen',
  monthSelector: '#selectMes, select[name="mes"]',
  yearSelector: '#selectAnio, select[name="anio"], select[name="año"]',
  dateFromInput: '#fechaDesde, input[name="fechaDesde"]',
  dateToInput: '#fechaHasta, input[name="fechaHasta"]',
  searchButton: '#btnBuscar, #btnConsultar, button[type="submit"]',
  downloadButton: '#btnDescargar, .btn-descarga',
  downloadPdfButton: '#btnDescargaPdf, a[href*="pdf"], button[data-format="pdf"]',
  downloadExcelButton: '#btnDescargaExcel, a[href*="excel"], button[data-format="excel"]',

  // Transactions table
  transactionsTable: '.table-movimientos, #tablaMovimientos, .tabla-cartola',
  transactionRow: 'tbody tr, .movimiento-row',
  noDataMessage: '.sin-movimientos, .no-data, .empty-state',

  // Logout
  userMenu: '#menuUsuario, .user-dropdown, .dropdown-user',
  logoutButton: '#btnSalir, a[href*="logout"], .btn-logout, a.salir',
}

// ============================================================================
// BANCO DE CHILE TASK
// ============================================================================

export class BancoChileCartolaTask extends BankBaseTask {
  constructor(context: BankTaskContext) {
    super(context)
  }

  getBankCode(): 'bancochile' {
    return 'bancochile'
  }

  getBankName(): string {
    return 'Banco de Chile'
  }

  getTaskName(): string {
    return 'bancochile_descarga_cartola'
  }

  getLoginUrl(): string {
    return BANCOCHILE_URLS.LOGIN
  }

  getSelectors(): BankSelectors {
    return BANCOCHILE_SELECTORS
  }

  protected async beforeLogin(): Promise<void> {
    logger.info('Preparing Banco de Chile login', {
      jobId: this.context.jobId,
    })

    // Sometimes Banco de Chile has a pre-login page with options
    // Wait for it to stabilize
    await this.delay(1000)
  }

  protected async afterLogin(): Promise<void> {
    // Wait for dashboard to fully load
    await this.delay(2000)

    // Check for any modals or alerts that need to be closed
    await this.dismissModals()
  }

  protected async handleOtpRequest(): Promise<{ method: string; sent: boolean }> {
    // Banco de Chile typically uses Token or SMS
    const hasToken = !!this.context.credentials.tokenSerial
    const hasPhone = !!this.context.credentials.phoneOtp

    if (hasToken) {
      return { method: 'token', sent: false }
    } else if (hasPhone) {
      return { method: 'sms', sent: true }
    }

    return { method: 'unknown', sent: false }
  }

  async executeSteps(): Promise<Record<string, unknown>> {
    const { params } = this.context
    const results: Record<string, unknown> = {
      banco: this.getBankCode(),
      cuenta: params.cuenta,
      periodo: {
        mes: params.mes,
        año: params.año,
      },
      archivos: [],
    }

    try {
      // Step 1: Navigate to cartolas section
      this.currentStep = 'navigate_cartolas'
      await this.navigateToCartolasPage()
      await this.takeScreenshot('cartolas_page')

      // Step 2: Select account if specified
      if (params.cuenta) {
        this.currentStep = 'select_account'
        await this.selectAccount(params.cuenta)
        await this.humanDelay()
      }

      // Step 3: Select period
      this.currentStep = 'select_period'
      await this.selectPeriod(params.mes, params.año)
      await this.takeScreenshot('period_selected')

      // Step 4: Search/Load cartola
      this.currentStep = 'search_cartola'
      await this.searchCartola()
      await this.takeScreenshot('cartola_results')

      // Step 5: Download cartola
      this.currentStep = 'download_cartola'
      const downloadedFiles = await this.downloadCartola()
      results.archivos = downloadedFiles

      // Step 6: Extract transaction summary from page
      this.currentStep = 'extract_summary'
      const summary = await this.extractSummary()
      results.resumen = summary

      await this.reportProgress('cartola_downloaded', results)

      return results
    } catch (error) {
      logger.error('Banco Chile task step failed', {
        jobId: this.context.jobId,
        step: this.currentStep,
        error,
      })
      throw error
    }
  }

  // ============================================================================
  // BANCO DE CHILE SPECIFIC METHODS
  // ============================================================================

  private async navigateToCartolasPage(): Promise<void> {
    const selectors = this.getSelectors()

    // Try direct navigation first
    try {
      await this.page.goto(BANCOCHILE_URLS.CARTOLAS, {
        waitUntil: 'domcontentloaded',
        timeout: BANK_CONFIG.TIMEOUTS.PAGE_LOAD,
      })
      await this.page.waitForLoadState('networkidle').catch(() => {})
      return
    } catch {
      // If direct navigation fails, try menu navigation
    }

    // Navigate via menu
    if (selectors.menuCartolas) {
      const menuElement = await this.page.$(selectors.menuCartolas)
      if (menuElement && await menuElement.isVisible()) {
        await this.clickWithMouse(selectors.menuCartolas)
        await this.page.waitForLoadState('networkidle', {
          timeout: BANK_CONFIG.TIMEOUTS.PAGE_LOAD,
        }).catch(() => {})
        await this.humanDelay()
      }
    }
  }

  private async selectAccount(cuenta: string): Promise<void> {
    const selectors = this.getSelectors()

    if (!selectors.accountSelector) {
      logger.warn('No account selector found', { jobId: this.context.jobId })
      return
    }

    const selector = await this.page.$(selectors.accountSelector)
    if (!selector) {
      logger.warn('Account selector element not found', { jobId: this.context.jobId })
      return
    }

    // Try to find and select the account
    await this.humanDelay()

    // Get all options
    const options = await this.page.$$eval(`${selectors.accountSelector} option`, (opts) =>
      opts.map((o) => ({ value: o.value, text: o.textContent }))
    )

    // Find matching account (by number or partial match)
    const matchingOption = options.find(
      (o) => o.value?.includes(cuenta) || o.text?.includes(cuenta)
    )

    if (matchingOption?.value) {
      await this.selectOption(selectors.accountSelector, matchingOption.value)
      logger.info('Account selected', {
        jobId: this.context.jobId,
        cuenta: matchingOption.text,
      })
    } else {
      logger.warn('Account not found in selector', {
        jobId: this.context.jobId,
        cuenta,
        availableOptions: options.map((o) => o.text),
      })
    }
  }

  private async selectPeriod(mes?: number, año?: number): Promise<void> {
    const selectors = this.getSelectors()
    const currentDate = new Date()
    const targetMonth = mes ?? currentDate.getMonth() + 1
    const targetYear = año ?? currentDate.getFullYear()

    // Select year
    if (selectors.yearSelector) {
      const yearSelector = await this.page.$(selectors.yearSelector)
      if (yearSelector && await yearSelector.isVisible()) {
        await this.humanDelay()
        await this.selectOption(selectors.yearSelector, targetYear.toString())
      }
    }

    // Select month
    if (selectors.monthSelector) {
      const monthSelector = await this.page.$(selectors.monthSelector)
      if (monthSelector && await monthSelector.isVisible()) {
        await this.humanDelay()
        // Months might be 1-12 or 01-12
        const monthValue = targetMonth.toString().padStart(2, '0')
        try {
          await this.selectOption(selectors.monthSelector, monthValue)
        } catch {
          // Try without padding
          await this.selectOption(selectors.monthSelector, targetMonth.toString())
        }
      }
    }

    // Alternative: date range inputs
    if (selectors.dateFromInput && selectors.dateToInput) {
      const dateFrom = await this.page.$(selectors.dateFromInput)
      const dateTo = await this.page.$(selectors.dateToInput)

      if (dateFrom && await dateFrom.isVisible()) {
        const firstDay = `01/${targetMonth.toString().padStart(2, '0')}/${targetYear}`
        const lastDay = new Date(targetYear, targetMonth, 0).getDate()
        const lastDayStr = `${lastDay}/${targetMonth.toString().padStart(2, '0')}/${targetYear}`

        await this.waitAndType(selectors.dateFromInput, firstDay)
        await this.humanDelay()
        await this.waitAndType(selectors.dateToInput, lastDayStr)
      }
    }

    logger.info('Period selected', {
      jobId: this.context.jobId,
      mes: targetMonth,
      año: targetYear,
    })
  }

  private async searchCartola(): Promise<void> {
    const selectors = this.getSelectors()

    if (!selectors.searchButton) {
      logger.warn('No search button found', { jobId: this.context.jobId })
      return
    }

    await this.humanDelay()
    await this.clickWithMouse(selectors.searchButton)

    // Wait for results
    await this.page.waitForLoadState('networkidle', {
      timeout: BANK_CONFIG.TIMEOUTS.PAGE_LOAD,
    }).catch(() => {})

    await this.humanDelay(1000, 2000)

    // Check for no data message
    if (selectors.noDataMessage) {
      const noData = await this.page.$(selectors.noDataMessage)
      if (noData && await noData.isVisible()) {
        logger.info('No transactions found for period', { jobId: this.context.jobId })
      }
    }
  }

  private async downloadCartola(): Promise<Array<{ name: string; path: string; format: string; size: number }>> {
    const selectors = this.getSelectors()
    const downloadedFiles: Array<{ name: string; path: string; format: string; size: number }> = []

    // Try PDF download first
    if (selectors.downloadPdfButton) {
      const pdfButton = await this.page.$(selectors.downloadPdfButton)
      if (pdfButton && await pdfButton.isVisible()) {
        await this.humanDelay()
        const pdfFile = await this.downloadFile(selectors.downloadPdfButton)
        if (pdfFile) {
          const stats = await this.getFileStats(pdfFile.path)
          downloadedFiles.push({
            name: pdfFile.filename,
            path: pdfFile.path,
            format: 'pdf',
            size: stats?.size || 0,
          })
        }
      }
    }

    // Try Excel download
    if (selectors.downloadExcelButton) {
      const excelButton = await this.page.$(selectors.downloadExcelButton)
      if (excelButton && await excelButton.isVisible()) {
        await this.humanDelay()
        const excelFile = await this.downloadFile(selectors.downloadExcelButton)
        if (excelFile) {
          const stats = await this.getFileStats(excelFile.path)
          downloadedFiles.push({
            name: excelFile.filename,
            path: excelFile.path,
            format: 'excel',
            size: stats?.size || 0,
          })
        }
      }
    }

    // Fallback: generic download button
    if (downloadedFiles.length === 0 && selectors.downloadButton) {
      const downloadButton = await this.page.$(selectors.downloadButton)
      if (downloadButton && await downloadButton.isVisible()) {
        await this.humanDelay()
        const file = await this.downloadFile(selectors.downloadButton)
        if (file) {
          const format = this.detectFileFormat(file.filename)
          const stats = await this.getFileStats(file.path)
          downloadedFiles.push({
            name: file.filename,
            path: file.path,
            format,
            size: stats?.size || 0,
          })
        }
      }
    }

    logger.info('Cartola download complete', {
      jobId: this.context.jobId,
      filesCount: downloadedFiles.length,
      files: downloadedFiles.map((f) => f.name),
    })

    return downloadedFiles
  }

  private async extractSummary(): Promise<Record<string, unknown>> {
    const selectors = this.getSelectors()
    const summary: Record<string, unknown> = {}

    try {
      // Try to extract summary info from page
      // This is highly dependent on the actual page structure

      // Look for balance elements
      const balanceSelectors = [
        '.saldo-disponible',
        '.balance',
        '#saldoActual',
        '.monto-total',
      ]

      for (const selector of balanceSelectors) {
        const element = await this.page.$(selector)
        if (element && await element.isVisible()) {
          const text = await element.textContent()
          if (text) {
            summary.saldo = this.parseAmount(text)
            break
          }
        }
      }

      // Try to get transaction count
      if (selectors.transactionsTable) {
        const rows = await this.page.$$(`${selectors.transactionsTable} tbody tr`)
        summary.cantidadTransacciones = rows.length
      }

    } catch (error) {
      logger.warn('Could not extract summary', {
        jobId: this.context.jobId,
        error,
      })
    }

    return summary
  }

  private async dismissModals(): Promise<void> {
    // Common modal close buttons
    const modalCloseSelectors = [
      '.modal-close',
      '.close-modal',
      'button[aria-label="Close"]',
      '.btn-cerrar',
      '.modal .close',
    ]

    for (const selector of modalCloseSelectors) {
      try {
        const closeBtn = await this.page.$(selector)
        if (closeBtn && await closeBtn.isVisible()) {
          await closeBtn.click()
          await this.humanDelay(300, 500)
        }
      } catch {
        // Ignore errors dismissing modals
      }
    }
  }

  private detectFileFormat(filename: string): string {
    const lower = filename.toLowerCase()
    if (lower.endsWith('.pdf')) return 'pdf'
    if (lower.endsWith('.xlsx') || lower.endsWith('.xls')) return 'excel'
    if (lower.endsWith('.csv')) return 'csv'
    if (lower.endsWith('.ofx')) return 'ofx'
    return 'unknown'
  }

  private parseAmount(text: string): number | null {
    try {
      // Remove currency symbols and formatting
      const clean = text
        .replace(/[$€]/g, '')
        .replace(/\./g, '')
        .replace(',', '.')
        .trim()

      const amount = parseFloat(clean)
      return isNaN(amount) ? null : amount
    } catch {
      return null
    }
  }

  private async getFileStats(path: string): Promise<{ size: number } | null> {
    try {
      const fs = await import('fs/promises')
      const stats = await fs.stat(path)
      return { size: stats.size }
    } catch {
      return null
    }
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

export function createBancoChileTask(context: BankTaskContext): BancoChileCartolaTask {
  return new BancoChileCartolaTask(context)
}
