// HV Consultores - SII RPA Server
// F29 Submit Task - Envío de declaración F29 al SII

import { BaseTask, TaskContext, TaskResult } from './base-task'
import { SII_CONFIG, SII_SELECTORS } from '../selectors/sii-selectors'
import { logger } from '../utils/logger'

// ============================================================================
// TIPOS
// ============================================================================

interface F29CodigoField {
  codigo: number
  selector: string
  valor: number
  readonly: boolean
}

interface F29SubmitParams {
  periodo: string // YYYYMM
  codigos: Record<string, number>
  tipo_declaracion: 'original' | 'rectificatoria'
  numero_rectificatoria?: number
  f29_calculo_id?: string
}

interface F29SubmitResult {
  folio_sii?: string
  fecha_presentacion?: string
  numero_comprobante?: string
  total_declarado?: number
  total_a_pagar?: number
  remanente?: number
  pdf_path?: string
}

// ============================================================================
// MAPEO DE CÓDIGOS
// ============================================================================

const F29_FIELD_MAP: Record<number, { selector: string; readonly: boolean }> = {
  // Débitos
  20: { selector: SII_SELECTORS.F29.CODIGO_20, readonly: false },
  89: { selector: SII_SELECTORS.F29.CODIGO_89, readonly: false },
  // Créditos
  520: { selector: SII_SELECTORS.F29.CODIGO_520, readonly: false },
  538: { selector: SII_SELECTORS.F29.CODIGO_538, readonly: false },
  563: { selector: SII_SELECTORS.F29.CODIGO_563, readonly: false },
  595: { selector: SII_SELECTORS.F29.CODIGO_595, readonly: false },
  // PPM
  30: { selector: SII_SELECTORS.F29.CODIGO_30, readonly: false },
  48: { selector: SII_SELECTORS.F29.CODIGO_48, readonly: false },
  // Remanente anterior
  92: { selector: SII_SELECTORS.F29.CODIGO_92, readonly: false },
  // Retenciones
  151: { selector: SII_SELECTORS.F29.CODIGO_151, readonly: false },
  153: { selector: SII_SELECTORS.F29.CODIGO_153, readonly: false },
  // Campos readonly (calculados por SII)
  91: { selector: SII_SELECTORS.F29.CODIGO_91, readonly: true },
  304: { selector: SII_SELECTORS.F29.CODIGO_304, readonly: true },
  60: { selector: SII_SELECTORS.F29.CODIGO_60, readonly: true },
}

// ============================================================================
// F29 SUBMIT TASK
// ============================================================================

export class F29SubmitTask extends BaseTask {
  private params: F29SubmitParams

  constructor(context: TaskContext) {
    super(context)
    this.params = context.params as F29SubmitParams
  }

  getTaskName(): string {
    return 'f29_submit'
  }

  async executeSteps(): Promise<F29SubmitResult | undefined> {
    const { periodo, codigos, tipo_declaracion } = this.params

    // Validar parámetros
    if (!periodo || !codigos) {
      throw new Error('Período y códigos son requeridos para enviar F29')
    }

    logger.info('Iniciando envío de F29', {
      jobId: this.context.jobId,
      periodo,
      tipo: tipo_declaracion,
      codigosCount: Object.keys(codigos).length,
    })

    // Step 1: Navegar al formulario F29
    await this.navigateToF29()

    // Step 2: Seleccionar período
    await this.selectPeriodo(periodo)

    // Step 3: Iniciar nueva declaración o rectificatoria
    if (tipo_declaracion === 'rectificatoria') {
      await this.iniciarRectificatoria()
    } else {
      await this.iniciarNuevaDeclaracion()
    }

    // Step 4: Llenar campos del formulario
    await this.fillFormFields(codigos)

    // Step 5: Calcular
    await this.clickCalcular()

    // Step 6: Validar
    await this.clickValidar()

    // Step 7: Enviar declaración
    const result = await this.submitDeclaracion()

    return result
  }

  private async navigateToF29(): Promise<void> {
    this.currentStep = 'navigate_f29'

    logger.info('Navegando a F29', { jobId: this.context.jobId })

    await this.page.goto(SII_CONFIG.URLS.F29, {
      waitUntil: 'networkidle',
      timeout: SII_CONFIG.TIMEOUTS.PAGE_LOAD,
    })

    await this.takeScreenshot('f29_page')
    await this.reportStepProgress('navigate_f29', { url: SII_CONFIG.URLS.F29 })
  }

  private async selectPeriodo(periodo: string): Promise<void> {
    this.currentStep = 'select_periodo'

    const año = periodo.slice(0, 4)
    const mes = periodo.slice(4, 6)

    logger.info('Seleccionando período', {
      jobId: this.context.jobId,
      año,
      mes,
    })

    // Esperar a que los selectores estén disponibles
    await this.page.waitForSelector(SII_SELECTORS.F29.PERIODO_ANO, {
      timeout: SII_CONFIG.TIMEOUTS.ELEMENT_VISIBLE,
    })

    // Seleccionar año
    await this.humanDelay()
    await this.page.selectOption(SII_SELECTORS.F29.PERIODO_ANO, año)

    // Seleccionar mes
    await this.humanDelay()
    await this.page.selectOption(SII_SELECTORS.F29.PERIODO_MES, mes)

    await this.takeScreenshot('periodo_selected')
    await this.reportStepProgress('select_periodo', { periodo, año, mes })
  }

  private async iniciarNuevaDeclaracion(): Promise<void> {
    this.currentStep = 'nueva_declaracion'

    logger.info('Iniciando nueva declaración', { jobId: this.context.jobId })

    await this.humanDelay()

    // Buscar y hacer clic en el botón de nueva declaración
    const btnNueva = await this.page.$(SII_SELECTORS.F29.BTN_NUEVA)
    if (btnNueva) {
      await btnNueva.click()
    } else {
      // Puede ser que el botón tenga otro nombre o esté en un submenú
      const btnContinuar = await this.page.$(SII_SELECTORS.F29.BTN_CONTINUAR)
      if (btnContinuar) {
        await btnContinuar.click()
      }
    }

    await this.page.waitForLoadState('networkidle', {
      timeout: SII_CONFIG.TIMEOUTS.NAVIGATION,
    })

    await this.takeScreenshot('formulario_f29')
    await this.reportStepProgress('nueva_declaracion')
  }

  private async iniciarRectificatoria(): Promise<void> {
    this.currentStep = 'rectificatoria'

    logger.info('Iniciando declaración rectificatoria', {
      jobId: this.context.jobId,
      numero: this.params.numero_rectificatoria,
    })

    await this.humanDelay()

    const btnRectificatoria = await this.page.$(SII_SELECTORS.F29.BTN_RECTIFICATORIA)
    if (btnRectificatoria) {
      await btnRectificatoria.click()
    } else {
      // Navegar directamente a URL de rectificatoria
      await this.page.goto(SII_CONFIG.URLS.F29_RECTIFICATORIA, {
        waitUntil: 'networkidle',
        timeout: SII_CONFIG.TIMEOUTS.PAGE_LOAD,
      })
    }

    await this.page.waitForLoadState('networkidle', {
      timeout: SII_CONFIG.TIMEOUTS.NAVIGATION,
    })

    await this.takeScreenshot('formulario_rectificatoria')
    await this.reportStepProgress('rectificatoria', {
      numero: this.params.numero_rectificatoria,
    })
  }

  private async fillFormFields(codigos: Record<string, number>): Promise<void> {
    this.currentStep = 'fill_form'

    logger.info('Llenando campos del formulario', {
      jobId: this.context.jobId,
      codigosCount: Object.keys(codigos).length,
    })

    const filledFields: string[] = []

    for (const [codigoStr, valor] of Object.entries(codigos)) {
      const codigo = parseInt(codigoStr, 10)
      const fieldInfo = F29_FIELD_MAP[codigo]

      // Si el campo no existe en el mapeo o es readonly, saltarlo
      if (!fieldInfo || fieldInfo.readonly) {
        logger.debug(`Saltando código ${codigo} (${fieldInfo?.readonly ? 'readonly' : 'no mapeado'})`)
        continue
      }

      // Si el valor es 0, no llenar
      if (valor === 0) continue

      try {
        // Esperar a que el campo exista
        const field = await this.page.$(fieldInfo.selector)
        if (field) {
          await this.humanDelay(200, 500)

          // Limpiar y llenar el campo
          await field.click()
          await field.fill('')
          await field.fill(valor.toString())

          filledFields.push(`${codigo}=${valor}`)

          logger.debug(`Campo ${codigo} llenado con ${valor}`, {
            jobId: this.context.jobId,
          })
        } else {
          logger.warn(`Campo ${codigo} no encontrado en el formulario`, {
            jobId: this.context.jobId,
            selector: fieldInfo.selector,
          })
        }
      } catch (error) {
        logger.error(`Error al llenar campo ${codigo}`, {
          jobId: this.context.jobId,
          error,
        })
      }
    }

    await this.takeScreenshot('form_filled')
    await this.reportStepProgress('fill_form', { filledFields })
  }

  private async clickCalcular(): Promise<void> {
    this.currentStep = 'calcular'

    logger.info('Calculando declaración', { jobId: this.context.jobId })

    await this.humanDelay()

    const btnCalcular = await this.page.$(SII_SELECTORS.F29.BTN_CALCULAR)
    if (btnCalcular) {
      await btnCalcular.click()

      // Esperar a que el cálculo termine
      await this.page.waitForLoadState('networkidle', {
        timeout: SII_CONFIG.TIMEOUTS.NAVIGATION,
      })

      // Verificar si hay errores
      const error = await this.page.$(SII_SELECTORS.F29.ERROR)
      if (error) {
        const errorText = await error.textContent()
        if (errorText && errorText.trim()) {
          throw new Error(`Error en cálculo: ${errorText.trim()}`)
        }
      }
    }

    await this.takeScreenshot('calcular_result')
    await this.reportStepProgress('calcular')
  }

  private async clickValidar(): Promise<void> {
    this.currentStep = 'validar'

    logger.info('Validando declaración', { jobId: this.context.jobId })

    await this.humanDelay()

    const btnValidar = await this.page.$(SII_SELECTORS.F29.BTN_VALIDAR)
    if (btnValidar) {
      await btnValidar.click()

      await this.page.waitForLoadState('networkidle', {
        timeout: SII_CONFIG.TIMEOUTS.NAVIGATION,
      })

      // Verificar si hay errores de validación
      const error = await this.page.$(SII_SELECTORS.F29.ERROR)
      if (error) {
        const errorText = await error.textContent()
        if (errorText && errorText.trim()) {
          throw new Error(`Error en validación: ${errorText.trim()}`)
        }
      }
    }

    await this.takeScreenshot('validar_result')
    await this.reportStepProgress('validar')
  }

  private async submitDeclaracion(): Promise<F29SubmitResult> {
    this.currentStep = 'submit'

    logger.info('Enviando declaración al SII', { jobId: this.context.jobId })

    await this.humanDelay()

    // Clic en enviar
    const btnEnviar = await this.page.$(SII_SELECTORS.F29.BTN_ENVIAR)
    if (!btnEnviar) {
      throw new Error('Botón de enviar no encontrado')
    }

    await btnEnviar.click()

    // Esperar confirmación si existe
    await this.humanDelay(1000, 2000)

    const btnConfirmar = await this.page.$(SII_SELECTORS.F29.BTN_CONFIRMAR)
    if (btnConfirmar) {
      logger.info('Confirmando envío', { jobId: this.context.jobId })
      await btnConfirmar.click()
    }

    // Esperar respuesta del SII
    await this.page.waitForLoadState('networkidle', {
      timeout: SII_CONFIG.TIMEOUTS.NAVIGATION,
    })

    await this.takeScreenshot('submit_result')

    // Verificar error
    const error = await this.page.$(SII_SELECTORS.F29.ERROR)
    if (error) {
      const errorText = await error.textContent()
      if (errorText && errorText.trim()) {
        throw new Error(`Error al enviar: ${errorText.trim()}`)
      }
    }

    // Verificar éxito
    const mensajeExito = await this.page.$(SII_SELECTORS.F29.MENSAJE_EXITO)
    if (!mensajeExito) {
      // Puede que el éxito se muestre de otra forma, intentar extraer folio
      logger.warn('No se encontró mensaje de éxito, intentando extraer folio', {
        jobId: this.context.jobId,
      })
    }

    // Extraer datos del resultado
    const result = await this.extractSubmitResult()

    await this.reportStepProgress('submit', result)

    return result
  }

  private async extractSubmitResult(): Promise<F29SubmitResult> {
    const result: F29SubmitResult = {}

    try {
      // Extraer folio
      const folioElement = await this.page.$(SII_SELECTORS.F29.FOLIO)
      if (folioElement) {
        const folioText = await folioElement.textContent()
        if (folioText) {
          // Buscar patrón de folio (números)
          const folioMatch = folioText.match(/\d{10,15}/)
          if (folioMatch) {
            result.folio_sii = folioMatch[0]
          } else {
            result.folio_sii = folioText.trim()
          }
        }
      }

      // Extraer fecha de presentación (fecha actual)
      result.fecha_presentacion = new Date().toISOString()

      // Extraer total a pagar (código 304)
      const totalPagarField = await this.page.$(SII_SELECTORS.F29.CODIGO_304)
      if (totalPagarField) {
        const totalText = await totalPagarField.inputValue()
        if (totalText) {
          result.total_a_pagar = parseInt(totalText.replace(/\D/g, ''), 10) || 0
        }
      }

      // Extraer remanente (código 60)
      const remanenteField = await this.page.$(SII_SELECTORS.F29.CODIGO_60)
      if (remanenteField) {
        const remanenteText = await remanenteField.inputValue()
        if (remanenteText) {
          result.remanente = parseInt(remanenteText.replace(/\D/g, ''), 10) || 0
        }
      }

      // Intentar descargar comprobante PDF
      const btnPdf = await this.page.$(SII_SELECTORS.F29.BTN_DESCARGAR_PDF)
      if (btnPdf) {
        try {
          // Configurar descarga
          const [download] = await Promise.all([
            this.page.waitForEvent('download', { timeout: 10000 }),
            btnPdf.click(),
          ])

          const filename = `f29_${this.params.periodo}_${result.folio_sii || Date.now()}.pdf`
          const path = `/tmp/downloads/${filename}`
          await download.saveAs(path)
          result.pdf_path = path

          logger.info('Comprobante PDF descargado', {
            jobId: this.context.jobId,
            path,
          })
        } catch (downloadError) {
          logger.warn('No se pudo descargar PDF de comprobante', {
            jobId: this.context.jobId,
            error: downloadError,
          })
        }
      }

      logger.info('Resultado extraído', {
        jobId: this.context.jobId,
        folio: result.folio_sii,
        totalAPagar: result.total_a_pagar,
      })
    } catch (error) {
      logger.error('Error al extraer resultado', {
        jobId: this.context.jobId,
        error,
      })
    }

    return result
  }
}

export default F29SubmitTask
