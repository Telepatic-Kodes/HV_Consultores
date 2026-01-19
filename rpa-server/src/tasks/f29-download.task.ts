// HV Consultores - SII RPA Server
// F29 Download Task - Descarga de F29 presentados desde el SII

import { BaseTask, TaskContext, TaskResult } from './base-task'
import { SII_CONFIG, SII_SELECTORS } from '../selectors/sii-selectors'
import { logger } from '../utils/logger'

// ============================================================================
// TIPOS
// ============================================================================

interface F29DownloadParams {
  periodo: string // YYYYMM
  folio?: string // Folio específico (opcional)
  formato?: 'pdf' | 'xml' | 'all'
}

interface F29DownloadResult {
  declaraciones: F29DeclaracionInfo[]
  archivos_descargados: Array<{
    tipo: string
    path: string
    size: number
  }>
}

interface F29DeclaracionInfo {
  folio: string
  periodo: string
  fecha_presentacion: string
  tipo: 'original' | 'rectificatoria'
  numero_rectificatoria?: number
  total_a_pagar: number
  remanente: number
  estado: string
}

// ============================================================================
// F29 DOWNLOAD TASK
// ============================================================================

export class F29DownloadTask extends BaseTask {
  private params: F29DownloadParams

  constructor(context: TaskContext) {
    super(context)
    this.params = context.params as F29DownloadParams
  }

  getTaskName(): string {
    return 'f29_download'
  }

  async executeSteps(): Promise<F29DownloadResult | undefined> {
    const { periodo, folio, formato = 'pdf' } = this.params

    if (!periodo) {
      throw new Error('Período es requerido para descargar F29')
    }

    logger.info('Iniciando descarga de F29', {
      jobId: this.context.jobId,
      periodo,
      folio,
      formato,
    })

    // Step 1: Navegar a consulta F29
    await this.navigateToConsultaF29()

    // Step 2: Seleccionar período
    await this.selectPeriodo(periodo)

    // Step 3: Buscar declaraciones
    const declaraciones = await this.buscarDeclaraciones()

    // Step 4: Descargar archivos
    const archivos = await this.descargarArchivos(declaraciones, formato, folio)

    return {
      declaraciones,
      archivos_descargados: archivos,
    }
  }

  private async navigateToConsultaF29(): Promise<void> {
    this.currentStep = 'navigate_consulta'

    logger.info('Navegando a consulta F29', { jobId: this.context.jobId })

    await this.page.goto(SII_CONFIG.URLS.F29_CONSULTA, {
      waitUntil: 'networkidle',
      timeout: SII_CONFIG.TIMEOUTS.PAGE_LOAD,
    })

    await this.takeScreenshot('consulta_f29_page')
    await this.reportStepProgress('navigate_consulta', {
      url: SII_CONFIG.URLS.F29_CONSULTA,
    })
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

    // Intentar encontrar los selectores de período
    const selectorAño = await this.page.$(SII_SELECTORS.F29.PERIODO_ANO)
    const selectorMes = await this.page.$(SII_SELECTORS.F29.PERIODO_MES)

    if (selectorAño) {
      await this.humanDelay()
      await this.page.selectOption(SII_SELECTORS.F29.PERIODO_ANO, año)
    }

    if (selectorMes) {
      await this.humanDelay()
      await this.page.selectOption(SII_SELECTORS.F29.PERIODO_MES, mes)
    }

    // Buscar botón de consultar/buscar
    await this.humanDelay()
    const btnConsultar = await this.page.$('#btnConsultar, button[type="submit"], input[type="submit"]')
    if (btnConsultar) {
      await btnConsultar.click()
      await this.page.waitForLoadState('networkidle', {
        timeout: SII_CONFIG.TIMEOUTS.NAVIGATION,
      })
    }

    await this.takeScreenshot('periodo_selected')
    await this.reportStepProgress('select_periodo', { periodo, año, mes })
  }

  private async buscarDeclaraciones(): Promise<F29DeclaracionInfo[]> {
    this.currentStep = 'buscar_declaraciones'

    logger.info('Buscando declaraciones', { jobId: this.context.jobId })

    const declaraciones: F29DeclaracionInfo[] = []

    // Buscar tabla de declaraciones
    const tabla = await this.page.$(SII_SELECTORS.F29.TABLA_DECLARACIONES)
    if (!tabla) {
      logger.warn('No se encontró tabla de declaraciones', {
        jobId: this.context.jobId,
      })

      // Puede que no haya declaraciones
      const sinDeclaraciones = await this.page.$('.sin-declaraciones, .no-data, #mensajeSinDatos')
      if (sinDeclaraciones) {
        logger.info('No hay declaraciones para el período', {
          jobId: this.context.jobId,
        })
        return []
      }

      // Intentar buscar de otra forma
      await this.takeScreenshot('no_tabla')
      return []
    }

    // Extraer filas
    const filas = await tabla.$$('tbody tr, tr.declaracion')

    for (const fila of filas) {
      try {
        const declaracion = await this.extractDeclaracionFromRow(fila)
        if (declaracion) {
          declaraciones.push(declaracion)
        }
      } catch (error) {
        logger.warn('Error extrayendo declaración de fila', {
          jobId: this.context.jobId,
          error,
        })
      }
    }

    await this.takeScreenshot('declaraciones_encontradas')
    await this.reportStepProgress('buscar_declaraciones', {
      count: declaraciones.length,
    })

    logger.info('Declaraciones encontradas', {
      jobId: this.context.jobId,
      count: declaraciones.length,
    })

    return declaraciones
  }

  private async extractDeclaracionFromRow(row: any): Promise<F29DeclaracionInfo | null> {
    const cells = await row.$$('td')
    if (cells.length < 3) return null

    try {
      // Extraer datos según la estructura típica del SII
      // La estructura varía, intentamos varios patrones

      // Buscar folio
      let folio = ''
      const linkFolio = await row.$(SII_SELECTORS.F29.LINK_FOLIO + ', a')
      if (linkFolio) {
        folio = (await linkFolio.textContent())?.trim() || ''
      } else if (cells[0]) {
        folio = (await cells[0].textContent())?.trim() || ''
      }

      // Si no hay folio válido, saltar
      if (!folio || !/^\d+$/.test(folio.replace(/\D/g, ''))) {
        return null
      }

      // Extraer otros datos
      const fechaText = cells[1] ? (await cells[1].textContent())?.trim() : ''
      const tipoText = cells[2] ? (await cells[2].textContent())?.trim() : ''
      const totalText = cells[3] ? (await cells[3].textContent())?.trim() : '0'

      // Determinar tipo de declaración
      const esRectificatoria = tipoText?.toLowerCase().includes('rectificatoria')
      let numeroRectificatoria: number | undefined
      if (esRectificatoria) {
        const match = tipoText?.match(/(\d+)/)
        if (match) {
          numeroRectificatoria = parseInt(match[1], 10)
        }
      }

      // Parsear monto
      const totalAPagar = parseInt(totalText.replace(/\D/g, ''), 10) || 0

      return {
        folio: folio.replace(/\D/g, ''),
        periodo: this.params.periodo,
        fecha_presentacion: fechaText || new Date().toISOString().split('T')[0],
        tipo: esRectificatoria ? 'rectificatoria' : 'original',
        numero_rectificatoria: numeroRectificatoria,
        total_a_pagar: totalAPagar,
        remanente: 0, // Se puede extraer si está disponible
        estado: 'presentado',
      }
    } catch (error) {
      logger.debug('Error parseando fila', { error })
      return null
    }
  }

  private async descargarArchivos(
    declaraciones: F29DeclaracionInfo[],
    formato: 'pdf' | 'xml' | 'all',
    folioEspecifico?: string
  ): Promise<Array<{ tipo: string; path: string; size: number }>> {
    this.currentStep = 'descargar_archivos'

    const archivos: Array<{ tipo: string; path: string; size: number }> = []

    // Filtrar por folio si se especificó
    const declaracionesADescargar = folioEspecifico
      ? declaraciones.filter(d => d.folio === folioEspecifico)
      : declaraciones

    if (declaracionesADescargar.length === 0) {
      logger.warn('No hay declaraciones para descargar', {
        jobId: this.context.jobId,
        folioEspecifico,
      })
      return archivos
    }

    for (const declaracion of declaracionesADescargar) {
      logger.info('Descargando declaración', {
        jobId: this.context.jobId,
        folio: declaracion.folio,
      })

      try {
        // Navegar al detalle de la declaración
        const linkFolio = await this.page.$(`a[href*="${declaracion.folio}"], a:text("${declaracion.folio}")`)
        if (linkFolio) {
          await linkFolio.click()
          await this.page.waitForLoadState('networkidle', {
            timeout: SII_CONFIG.TIMEOUTS.NAVIGATION,
          })

          await this.takeScreenshot(`detalle_${declaracion.folio}`)

          // Descargar PDF
          if (formato === 'pdf' || formato === 'all') {
            const pdfFile = await this.descargarPDF(declaracion.folio)
            if (pdfFile) archivos.push(pdfFile)
          }

          // Descargar XML
          if (formato === 'xml' || formato === 'all') {
            const xmlFile = await this.descargarXML(declaracion.folio)
            if (xmlFile) archivos.push(xmlFile)
          }

          // Volver a la lista
          await this.page.goBack()
          await this.page.waitForLoadState('networkidle', {
            timeout: SII_CONFIG.TIMEOUTS.NAVIGATION,
          })
        } else {
          // Intentar descargar directamente desde la lista
          const pdfFile = await this.descargarPDF(declaracion.folio)
          if (pdfFile) archivos.push(pdfFile)
        }
      } catch (error) {
        logger.error('Error descargando declaración', {
          jobId: this.context.jobId,
          folio: declaracion.folio,
          error,
        })
      }
    }

    await this.reportStepProgress('descargar_archivos', {
      count: archivos.length,
      formatos: archivos.map(a => a.tipo),
    })

    return archivos
  }

  private async descargarPDF(folio: string): Promise<{ tipo: string; path: string; size: number } | null> {
    try {
      const btnPdf = await this.page.$(SII_SELECTORS.F29.BTN_DESCARGAR_PDF)
      if (!btnPdf) {
        logger.debug('Botón PDF no encontrado', { jobId: this.context.jobId })
        return null
      }

      // Configurar descarga
      const [download] = await Promise.all([
        this.page.waitForEvent('download', { timeout: SII_CONFIG.TIMEOUTS.DOWNLOAD }),
        btnPdf.click(),
      ])

      const filename = `f29_${this.params.periodo}_${folio}.pdf`
      const path = `/tmp/downloads/${filename}`
      await download.saveAs(path)

      // Obtener tamaño (aproximado)
      const size = 0 // En producción obtener de fs.stat

      logger.info('PDF descargado', {
        jobId: this.context.jobId,
        folio,
        path,
      })

      return { tipo: 'pdf', path, size }
    } catch (error) {
      logger.warn('Error descargando PDF', {
        jobId: this.context.jobId,
        folio,
        error,
      })
      return null
    }
  }

  private async descargarXML(folio: string): Promise<{ tipo: string; path: string; size: number } | null> {
    try {
      const btnXml = await this.page.$('a[href*="XML"], #btnXML, .btn-xml')
      if (!btnXml) {
        logger.debug('Botón XML no encontrado', { jobId: this.context.jobId })
        return null
      }

      // Configurar descarga
      const [download] = await Promise.all([
        this.page.waitForEvent('download', { timeout: SII_CONFIG.TIMEOUTS.DOWNLOAD }),
        btnXml.click(),
      ])

      const filename = `f29_${this.params.periodo}_${folio}.xml`
      const path = `/tmp/downloads/${filename}`
      await download.saveAs(path)

      logger.info('XML descargado', {
        jobId: this.context.jobId,
        folio,
        path,
      })

      return { tipo: 'xml', path, size: 0 }
    } catch (error) {
      logger.warn('Error descargando XML', {
        jobId: this.context.jobId,
        folio,
        error,
      })
      return null
    }
  }
}

export default F29DownloadTask
