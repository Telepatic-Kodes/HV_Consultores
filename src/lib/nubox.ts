/**
 * Nubox API Integration
 * Handles document submission and status tracking with Nubox
 */

import crypto from 'crypto'

interface NuboxConfig {
  apiUrl: string
  partnerToken: string
  companyApiKey: string
  environment: 'uat' | 'production'
}

interface NuboxDocumentoRequest {
  tipo: string // 'factura', 'boleta', 'nota_credito', 'nota_debito', 'guia_despacho'
  folio: string
  fechaEmision: string
  montoTotal: number
  montoNeto?: number
  montoIva?: number
  rutEmisor: string
  razonSocialEmisor: string
  rutReceptor?: string
  razonSocialReceptor?: string
  lineaDetalle?: Array<{
    descripcion: string
    cantidad: number
    precioUnitario: number
    montoTotal: number
  }>
}

interface NuboxDocumentoResponse {
  id: string
  folio: string
  estado: string
  estadoSii: string
  pdf?: string
  xml?: string
  errores?: Array<{
    codigo: string
    mensaje: string
  }>
}

export class NuboxClient {
  private config: NuboxConfig
  private baseUrl: string

  constructor(config: NuboxConfig) {
    this.config = config
    this.baseUrl = config.apiUrl || 'https://api.nubox.com'
  }

  /**
   * Obtener headers de autenticación requeridos
   */
  private obtenerHeaders(): Record<string, string> {
    return {
      'Authorization': `Bearer ${this.config.partnerToken}`,
      'X-Api-Key': this.config.companyApiKey,
      'Content-Type': 'application/json',
      'x-idempotence-id': crypto.randomUUID(),
    }
  }

  /**
   * Emitir documento en Nubox
   */
  async emitirDocumento(documento: NuboxDocumentoRequest): Promise<{
    success: boolean
    data?: NuboxDocumentoResponse
    error?: string
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/v1/sales/issuance`, {
        method: 'POST',
        headers: this.obtenerHeaders(),
        body: JSON.stringify(documento),
      })

      const data = await response.json()

      if (!response.ok) {
        return {
          success: false,
          error: data.mensaje || `Error ${response.status}: ${response.statusText}`,
        }
      }

      return {
        success: true,
        data: data as NuboxDocumentoResponse,
      }
    } catch (error) {
      console.error('Error emitiendo documento en Nubox:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      }
    }
  }

  /**
   * Obtener estado de documento
   */
  async obtenerEstadoDocumento(documentoId: string): Promise<{
    success: boolean
    data?: NuboxDocumentoResponse
    error?: string
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/v1/sales/${documentoId}`, {
        method: 'GET',
        headers: this.obtenerHeaders(),
      })

      const data = await response.json()

      if (!response.ok) {
        return {
          success: false,
          error: data.mensaje || `Error ${response.status}`,
        }
      }

      return {
        success: true,
        data: data as NuboxDocumentoResponse,
      }
    } catch (error) {
      console.error('Error obteniendo estado de documento:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      }
    }
  }

  /**
   * Descargar PDF
   */
  async descargarPdf(documentoId: string): Promise<{
    success: boolean
    buffer?: Buffer
    error?: string
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/v1/sales/${documentoId}/pdf`, {
        method: 'GET',
        headers: this.obtenerHeaders(),
      })

      if (!response.ok) {
        return {
          success: false,
          error: `Error ${response.status}: ${response.statusText}`,
        }
      }

      const arrayBuffer = await response.arrayBuffer()
      return {
        success: true,
        buffer: Buffer.from(arrayBuffer),
      }
    } catch (error) {
      console.error('Error descargando PDF:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      }
    }
  }

  /**
   * Descargar XML
   */
  async descargarXml(documentoId: string): Promise<{
    success: boolean
    buffer?: Buffer
    error?: string
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/v1/sales/${documentoId}/xml`, {
        method: 'GET',
        headers: this.obtenerHeaders(),
      })

      if (!response.ok) {
        return {
          success: false,
          error: `Error ${response.status}: ${response.statusText}`,
        }
      }

      const arrayBuffer = await response.arrayBuffer()
      return {
        success: true,
        buffer: Buffer.from(arrayBuffer),
      }
    } catch (error) {
      console.error('Error descargando XML:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      }
    }
  }

  /**
   * Listar ventas (documentos)
   */
  async listarVentas(filtros?: {
    estado?: string
    fechaInicio?: string
    fechaFin?: string
  }): Promise<{
    success: boolean
    data?: NuboxDocumentoResponse[]
    error?: string
  }> {
    try {
      const params = new URLSearchParams()
      if (filtros?.estado) params.append('estado', filtros.estado)
      if (filtros?.fechaInicio) params.append('fecha_inicio', filtros.fechaInicio)
      if (filtros?.fechaFin) params.append('fecha_fin', filtros.fechaFin)

      const queryString = params.toString()
      const url = `${this.baseUrl}/v1/sales${queryString ? '?' + queryString : ''}`

      const response = await fetch(url, {
        method: 'GET',
        headers: this.obtenerHeaders(),
      })

      const data = await response.json()

      if (!response.ok) {
        return {
          success: false,
          error: data.mensaje || `Error ${response.status}`,
        }
      }

      return {
        success: true,
        data: data as NuboxDocumentoResponse[],
      }
    } catch (error) {
      console.error('Error listando ventas:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      }
    }
  }
}

/**
 * Crear instancia de cliente Nubox
 */
export function crearClienteNubox(): NuboxClient | null {
  const apiUrl = process.env.NUBOX_API_URL
  const partnerToken = process.env.NUBOX_PARTNER_TOKEN
  const companyApiKey = process.env.NUBOX_COMPANY_API_KEY

  if (!apiUrl || !partnerToken || !companyApiKey) {
    console.warn('Credenciales de Nubox no configuradas')
    return null
  }

  return new NuboxClient({
    apiUrl,
    partnerToken,
    companyApiKey,
    environment: process.env.NODE_ENV === 'production' ? 'production' : 'uat',
  })
}
