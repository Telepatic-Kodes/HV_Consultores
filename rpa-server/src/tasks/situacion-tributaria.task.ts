// HV Consultores - SII RPA Server
// Situación Tributaria Task - Extract tax status information

import { BaseTask, TaskContext } from './base-task'
import { SII_CONFIG, SII_SELECTORS } from '../selectors/sii-selectors'
import { logger } from '../utils/logger'

interface ActividadEconomica {
  codigo: string
  descripcion: string
  afecta_iva: boolean
  fecha_inicio?: string
}

export class SituacionTributariaTask extends BaseTask {
  constructor(context: TaskContext) {
    super(context)
  }

  getTaskName(): string {
    return 'situacion_tributaria'
  }

  async executeSteps(): Promise<Record<string, unknown>> {
    this.currentStep = 'navigate_to_situacion'

    // Navigate to situación tributaria page
    await this.page.goto(SII_CONFIG.URLS.SITUACION_TRIBUTARIA, {
      waitUntil: 'networkidle',
      timeout: SII_CONFIG.TIMEOUTS.PAGE_LOAD,
    })

    await this.takeScreenshot('situacion_page')
    await this.humanDelay()

    this.currentStep = 'extract_data'

    // Extract all information
    const data: Record<string, unknown> = {
      rut: this.context.credentials.rut,
      consultado_at: new Date().toISOString(),
    }

    // Extract razón social
    const razonSocialEl = await this.page.$(SII_SELECTORS.SITUACION.RAZON_SOCIAL)
    if (razonSocialEl) {
      data.razon_social = (await razonSocialEl.textContent())?.trim()
    }

    // Extract inicio de actividades
    const inicioActEl = await this.page.$(SII_SELECTORS.SITUACION.INICIO_ACTIVIDADES)
    if (inicioActEl) {
      data.inicio_actividades = (await inicioActEl.textContent())?.trim()
    }

    // Extract estado DTE
    const estadoDteEl = await this.page.$(SII_SELECTORS.SITUACION.ESTADO_DTE)
    if (estadoDteEl) {
      const estadoText = (await estadoDteEl.textContent())?.toLowerCase() || ''
      data.facturador_electronico = estadoText.includes('autorizado') || estadoText.includes('habilitado')
    }

    // Extract contribuyente IVA
    const contribIvaEl = await this.page.$(SII_SELECTORS.SITUACION.CONTRIBUYENTE_IVA)
    if (contribIvaEl) {
      const ivaText = (await contribIvaEl.textContent())?.toLowerCase() || ''
      data.contribuyente_iva = ivaText.includes('sí') || ivaText.includes('afecto')
    }

    // Extract tasa PPM
    const tasaPpmEl = await this.page.$(SII_SELECTORS.SITUACION.TASA_PPM)
    if (tasaPpmEl) {
      const ppmText = (await tasaPpmEl.textContent()) || ''
      const ppmMatch = ppmText.match(/(\d+[.,]?\d*)/)
      if (ppmMatch) {
        data.tasa_ppm_vigente = parseFloat(ppmMatch[1].replace(',', '.'))
      }
    }

    // Check for mora
    const moraEl = await this.page.$(SII_SELECTORS.SITUACION.INDICADOR_MORA)
    if (moraEl) {
      const moraText = (await moraEl.textContent())?.toLowerCase() || ''
      data.mora_tributaria = moraText.includes('sí') || moraText.includes('mora')
    } else {
      data.mora_tributaria = false
    }

    // Extract actividades económicas
    const actividadesTable = await this.page.$(SII_SELECTORS.SITUACION.TABLA_ACTIVIDADES)
    if (actividadesTable) {
      const actividades: ActividadEconomica[] = []

      const rows = await actividadesTable.$$('tbody tr, tr')
      for (const row of rows) {
        const cells = await row.$$('td')
        if (cells.length >= 2) {
          const codigo = (await cells[0].textContent())?.trim() || ''
          const descripcion = (await cells[1].textContent())?.trim() || ''

          if (codigo && descripcion) {
            const afectaIva = cells.length >= 3
              ? ((await cells[2].textContent())?.toLowerCase().includes('sí') || false)
              : true

            actividades.push({
              codigo,
              descripcion,
              afecta_iva: afectaIva,
            })
          }
        }
      }

      if (actividades.length > 0) {
        data.actividades_economicas = actividades
      }
    }

    // Get raw HTML for storage
    const htmlContent = await this.page.content()
    data.html_raw = htmlContent.substring(0, 50000) // Limit size

    await this.takeScreenshot('situacion_extracted')

    // Report progress
    await this.reportStepProgress('data_extracted', {
      razon_social: data.razon_social,
      actividades_count: (data.actividades_economicas as ActividadEconomica[] | undefined)?.length || 0,
    })

    logger.info('Situación tributaria extracted', {
      jobId: this.context.jobId,
      razon_social: data.razon_social,
    })

    return data
  }
}
