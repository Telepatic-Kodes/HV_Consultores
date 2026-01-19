// HV Consultores - SII RPA Server
// Libro Compras Task - Download purchase records

import { BaseTask, TaskContext, TaskResult } from './base-task'
import { SII_CONFIG, SII_SELECTORS } from '../selectors/sii-selectors'
import { logger } from '../utils/logger'
import path from 'path'
import fs from 'fs'

export class LibroComprasTask extends BaseTask {
  constructor(context: TaskContext) {
    super(context)
  }

  getTaskName(): string {
    return 'libro_compras'
  }

  async executeSteps(): Promise<Record<string, unknown>> {
    const periodo = this.context.params.periodo as string

    if (!periodo) {
      throw new Error('Período es requerido para descargar libro de compras')
    }

    // Parse periodo (YYYYMM)
    const year = periodo.slice(0, 4)
    const month = periodo.slice(4, 6)

    this.currentStep = 'navigate_to_libro'

    // Navigate to libro compras
    await this.page.goto(SII_CONFIG.URLS.LIBRO_COMPRAS, {
      waitUntil: 'networkidle',
      timeout: SII_CONFIG.TIMEOUTS.PAGE_LOAD,
    })

    await this.takeScreenshot('libro_compras_page')
    await this.humanDelay()

    this.currentStep = 'select_periodo'

    // Select year
    const yearSelect = await this.page.$(SII_SELECTORS.LIBROS.PERIODO_ANO)
    if (yearSelect) {
      await yearSelect.selectOption(year)
      await this.humanDelay(300, 800)
    }

    // Select month
    const monthSelect = await this.page.$(SII_SELECTORS.LIBROS.PERIODO_MES)
    if (monthSelect) {
      await monthSelect.selectOption(month)
      await this.humanDelay(300, 800)
    }

    await this.takeScreenshot('periodo_selected')

    this.currentStep = 'consultar'

    // Click consultar
    await this.page.click(SII_SELECTORS.LIBROS.BTN_CONSULTAR)

    // Wait for results
    await this.page.waitForLoadState('networkidle', {
      timeout: SII_CONFIG.TIMEOUTS.PAGE_LOAD,
    })

    await this.humanDelay()
    await this.takeScreenshot('resultados')

    // Check for "sin movimiento"
    const sinMovimiento = await this.page.$(SII_SELECTORS.LIBROS.SIN_MOVIMIENTO)
    if (sinMovimiento) {
      logger.info('Sin movimientos para el período', {
        jobId: this.context.jobId,
        periodo,
      })

      return {
        periodo,
        tipo_libro: 'compras',
        sin_movimiento: true,
        total_documentos: 0,
        monto_neto_total: 0,
        monto_iva_total: 0,
        monto_total: 0,
      }
    }

    this.currentStep = 'extract_totals'

    // Extract totals
    const data: Record<string, unknown> = {
      periodo,
      tipo_libro: 'compras',
      sin_movimiento: false,
    }

    const totalNetoEl = await this.page.$(SII_SELECTORS.LIBROS.TOTAL_NETO)
    if (totalNetoEl) {
      const text = (await totalNetoEl.textContent()) || '0'
      data.monto_neto_total = this.parseAmount(text)
    }

    const totalIvaEl = await this.page.$(SII_SELECTORS.LIBROS.TOTAL_IVA)
    if (totalIvaEl) {
      const text = (await totalIvaEl.textContent()) || '0'
      data.monto_iva_total = this.parseAmount(text)
    }

    const totalGeneralEl = await this.page.$(SII_SELECTORS.LIBROS.TOTAL_GENERAL)
    if (totalGeneralEl) {
      const text = (await totalGeneralEl.textContent()) || '0'
      data.monto_total = this.parseAmount(text)
    }

    // Count documents
    const tabla = await this.page.$(SII_SELECTORS.LIBROS.TABLA_DOCUMENTOS)
    if (tabla) {
      const rows = await tabla.$$('tbody tr')
      data.total_documentos = rows.length
    }

    this.currentStep = 'download_csv'

    // Download CSV
    const downloadButton = await this.page.$(SII_SELECTORS.LIBROS.BTN_DESCARGAR_CSV)

    if (downloadButton) {
      // Set up download handler
      const downloadPath = `/tmp/downloads/${this.context.jobId}`
      fs.mkdirSync(downloadPath, { recursive: true })

      const [download] = await Promise.all([
        this.page.waitForEvent('download', { timeout: SII_CONFIG.TIMEOUTS.DOWNLOAD }),
        downloadButton.click(),
      ])

      const filename = `libro_compras_${periodo}.csv`
      const filePath = path.join(downloadPath, filename)

      await download.saveAs(filePath)

      data.archivo_csv_path = filePath

      // Get file size
      const stats = fs.statSync(filePath)
      data.archivo_size = stats.size

      logger.info('CSV downloaded', {
        jobId: this.context.jobId,
        path: filePath,
        size: stats.size,
      })
    }

    await this.takeScreenshot('download_complete')

    // Report progress
    await this.reportStepProgress('libro_descargado', {
      periodo,
      total_documentos: data.total_documentos,
      monto_total: data.monto_total,
    })

    return data
  }

  private parseAmount(text: string): number {
    const cleaned = text
      .replace(/\$/g, '')
      .replace(/\./g, '')
      .replace(/,/g, '.')
      .trim()

    const num = parseFloat(cleaned)
    return isNaN(num) ? 0 : num
  }
}
