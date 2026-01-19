// SII RPA Encryption Module
// HV Consultores - Encriptación AES-256-GCM para credenciales
// IMPORTANTE: Las credenciales SOLO se desencriptan en el RPA server

import { randomBytes, createCipheriv, createDecipheriv } from 'crypto'

// ============================================================================
// CONFIGURACIÓN
// ============================================================================

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16 // 128 bits
const AUTH_TAG_LENGTH = 16 // 128 bits
const KEY_LENGTH = 32 // 256 bits

// ============================================================================
// INTERFACES
// ============================================================================

export interface EncryptedData {
  ciphertext: string // Base64 encoded
  iv: string // Base64 encoded
  authTag: string // Base64 encoded
  version: number // Para futuras migraciones
}

export interface EncryptionResult {
  success: boolean
  data?: EncryptedData
  error?: string
}

export interface DecryptionResult {
  success: boolean
  plaintext?: string
  error?: string
}

// ============================================================================
// ENCRYPTION KEY MANAGEMENT
// ============================================================================

/**
 * Obtiene la clave de encriptación del ambiente
 * NUNCA debe exponerse en logs o errores
 */
function getEncryptionKey(): Buffer {
  const keyEnv = process.env.CREDENTIALS_ENCRYPTION_KEY

  if (!keyEnv) {
    throw new Error('CREDENTIALS_ENCRYPTION_KEY no está configurada')
  }

  // La clave puede estar en hex o base64
  let keyBuffer: Buffer

  if (keyEnv.length === 64) {
    // Hex encoded (32 bytes = 64 hex chars)
    keyBuffer = Buffer.from(keyEnv, 'hex')
  } else if (keyEnv.length === 44) {
    // Base64 encoded (32 bytes = 44 base64 chars)
    keyBuffer = Buffer.from(keyEnv, 'base64')
  } else {
    throw new Error('CREDENTIALS_ENCRYPTION_KEY tiene formato inválido')
  }

  if (keyBuffer.length !== KEY_LENGTH) {
    throw new Error('CREDENTIALS_ENCRYPTION_KEY debe ser de 256 bits')
  }

  return keyBuffer
}

/**
 * Genera una nueva clave de encriptación
 * Solo para configuración inicial del sistema
 */
export function generateEncryptionKey(): { hex: string; base64: string } {
  const key = randomBytes(KEY_LENGTH)
  return {
    hex: key.toString('hex'),
    base64: key.toString('base64'),
  }
}

// ============================================================================
// ENCRYPTION FUNCTIONS
// ============================================================================

/**
 * Encripta un string usando AES-256-GCM
 * @param plaintext - Texto a encriptar (password, certificado, etc.)
 * @returns Datos encriptados o error
 */
export function encrypt(plaintext: string): EncryptionResult {
  try {
    if (!plaintext || plaintext.length === 0) {
      return { success: false, error: 'Texto vacío' }
    }

    const key = getEncryptionKey()
    const iv = randomBytes(IV_LENGTH)

    const cipher = createCipheriv(ALGORITHM, key, iv, {
      authTagLength: AUTH_TAG_LENGTH,
    })

    let ciphertext = cipher.update(plaintext, 'utf8', 'base64')
    ciphertext += cipher.final('base64')

    const authTag = cipher.getAuthTag()

    return {
      success: true,
      data: {
        ciphertext,
        iv: iv.toString('base64'),
        authTag: authTag.toString('base64'),
        version: 1,
      },
    }
  } catch (error) {
    // No exponer detalles del error de encriptación
    console.error('[Encryption] Error:', error instanceof Error ? error.message : 'Unknown')
    return { success: false, error: 'Error al encriptar datos' }
  }
}

/**
 * Desencripta datos previamente encriptados
 * SOLO debe usarse en el RPA server, NUNCA en el frontend
 * @param encryptedData - Datos encriptados
 * @returns Texto original o error
 */
export function decrypt(encryptedData: EncryptedData): DecryptionResult {
  try {
    if (!encryptedData || !encryptedData.ciphertext) {
      return { success: false, error: 'Datos encriptados inválidos' }
    }

    const key = getEncryptionKey()
    const iv = Buffer.from(encryptedData.iv, 'base64')
    const authTag = Buffer.from(encryptedData.authTag, 'base64')
    const ciphertext = Buffer.from(encryptedData.ciphertext, 'base64')

    const decipher = createDecipheriv(ALGORITHM, key, iv, {
      authTagLength: AUTH_TAG_LENGTH,
    })
    decipher.setAuthTag(authTag)

    let plaintext = decipher.update(ciphertext)
    plaintext = Buffer.concat([plaintext, decipher.final()])

    return {
      success: true,
      plaintext: plaintext.toString('utf8'),
    }
  } catch (error) {
    // No exponer detalles del error de desencriptación
    console.error('[Decryption] Error:', error instanceof Error ? error.message : 'Unknown')
    return { success: false, error: 'Error al desencriptar datos' }
  }
}

// ============================================================================
// CREDENTIAL-SPECIFIC FUNCTIONS
// ============================================================================

export interface CredentialEncryptionInput {
  password: string
  certificadoBase64?: string
  certificadoPassword?: string
}

export interface EncryptedCredentials {
  password_encriptado: string // JSON serialized EncryptedData
  certificado_archivo_enc?: string // JSON serialized EncryptedData
  certificado_password_enc?: string // JSON serialized EncryptedData
}

/**
 * Encripta todas las credenciales sensibles de un cliente
 * @param credentials - Credenciales en texto plano
 * @returns Credenciales encriptadas para almacenar en DB
 */
export function encryptCredentials(
  credentials: CredentialEncryptionInput
): { success: boolean; encrypted?: EncryptedCredentials; error?: string } {
  try {
    // Encriptar password (obligatorio)
    const passwordResult = encrypt(credentials.password)
    if (!passwordResult.success || !passwordResult.data) {
      return { success: false, error: 'Error encriptando password' }
    }

    const encrypted: EncryptedCredentials = {
      password_encriptado: JSON.stringify(passwordResult.data),
    }

    // Encriptar certificado si existe
    if (credentials.certificadoBase64) {
      const certResult = encrypt(credentials.certificadoBase64)
      if (!certResult.success || !certResult.data) {
        return { success: false, error: 'Error encriptando certificado' }
      }
      encrypted.certificado_archivo_enc = JSON.stringify(certResult.data)
    }

    // Encriptar password de certificado si existe
    if (credentials.certificadoPassword) {
      const certPwdResult = encrypt(credentials.certificadoPassword)
      if (!certPwdResult.success || !certPwdResult.data) {
        return { success: false, error: 'Error encriptando password de certificado' }
      }
      encrypted.certificado_password_enc = JSON.stringify(certPwdResult.data)
    }

    return { success: true, encrypted }
  } catch (error) {
    console.error('[encryptCredentials] Error:', error)
    return { success: false, error: 'Error al encriptar credenciales' }
  }
}

/**
 * Desencripta credenciales almacenadas
 * SOLO usar en RPA server
 */
export function decryptCredentials(encrypted: EncryptedCredentials): {
  success: boolean
  decrypted?: {
    password: string
    certificadoBase64?: string
    certificadoPassword?: string
  }
  error?: string
} {
  try {
    // Desencriptar password
    const passwordData: EncryptedData = JSON.parse(encrypted.password_encriptado)
    const passwordResult = decrypt(passwordData)
    if (!passwordResult.success || !passwordResult.plaintext) {
      return { success: false, error: 'Error desencriptando password' }
    }

    const decrypted: {
      password: string
      certificadoBase64?: string
      certificadoPassword?: string
    } = {
      password: passwordResult.plaintext,
    }

    // Desencriptar certificado si existe
    if (encrypted.certificado_archivo_enc) {
      const certData: EncryptedData = JSON.parse(encrypted.certificado_archivo_enc)
      const certResult = decrypt(certData)
      if (!certResult.success || !certResult.plaintext) {
        return { success: false, error: 'Error desencriptando certificado' }
      }
      decrypted.certificadoBase64 = certResult.plaintext
    }

    // Desencriptar password de certificado si existe
    if (encrypted.certificado_password_enc) {
      const certPwdData: EncryptedData = JSON.parse(encrypted.certificado_password_enc)
      const certPwdResult = decrypt(certPwdData)
      if (!certPwdResult.success || !certPwdResult.plaintext) {
        return { success: false, error: 'Error desencriptando password de certificado' }
      }
      decrypted.certificadoPassword = certPwdResult.plaintext
    }

    return { success: true, decrypted }
  } catch (error) {
    console.error('[decryptCredentials] Error:', error)
    return { success: false, error: 'Error al desencriptar credenciales' }
  }
}

// ============================================================================
// SECURITY UTILITIES
// ============================================================================

/**
 * Limpia datos sensibles de la memoria
 * Llamar después de usar credenciales desencriptadas
 */
export function secureWipe(data: string | Buffer): void {
  if (typeof data === 'string') {
    // No hay forma garantizada de limpiar strings en JS
    // pero al menos eliminamos la referencia
    return
  }

  if (Buffer.isBuffer(data)) {
    // Sobrescribir buffer con ceros
    data.fill(0)
  }
}

/**
 * Valida el formato de datos encriptados
 */
export function isValidEncryptedData(data: unknown): data is EncryptedData {
  if (!data || typeof data !== 'object') return false

  const obj = data as Record<string, unknown>

  return (
    typeof obj.ciphertext === 'string' &&
    typeof obj.iv === 'string' &&
    typeof obj.authTag === 'string' &&
    typeof obj.version === 'number'
  )
}

/**
 * Genera un hash seguro para comparación (NO para passwords)
 * Usar para verificar integridad de datos
 */
export function generateHash(data: string): string {
  const crypto = require('crypto')
  return crypto.createHash('sha256').update(data).digest('hex')
}

// ============================================================================
// BROWSER-SAFE FUNCTIONS (para frontend)
// ============================================================================

/**
 * Encripta datos en el navegador usando Web Crypto API
 * Para uso en frontend antes de enviar al backend
 */
export async function encryptInBrowser(
  plaintext: string,
  publicKeyPem?: string
): Promise<{ success: boolean; encrypted?: string; error?: string }> {
  // Nota: Esta función está pensada para ejecutarse en el navegador
  // usando SubtleCrypto API

  if (typeof window === 'undefined') {
    return { success: false, error: 'Solo disponible en navegador' }
  }

  try {
    // Para simplicidad, usamos una encriptación simétrica
    // con una clave derivada del lado del servidor

    // En producción, considerar:
    // 1. Derivar clave con PBKDF2/Argon2
    // 2. Usar RSA para intercambio de clave
    // 3. TLS ya protege el transporte

    const encoder = new TextEncoder()
    const data = encoder.encode(plaintext)

    // Generar IV aleatorio
    const iv = crypto.getRandomValues(new Uint8Array(12))

    // Clave temporal (en producción, derivar del servidor)
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(process.env.NEXT_PUBLIC_ENCRYPTION_SALT || 'default-salt-change-me'),
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    )

    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: encoder.encode('sii-credentials'),
        iterations: 100000,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt']
    )

    const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data)

    // Combinar IV + ciphertext
    const combined = new Uint8Array(iv.length + encrypted.byteLength)
    combined.set(iv)
    combined.set(new Uint8Array(encrypted), iv.length)

    return {
      success: true,
      encrypted: btoa(String.fromCharCode(...combined)),
    }
  } catch (error) {
    console.error('[encryptInBrowser] Error:', error)
    return { success: false, error: 'Error de encriptación' }
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  encrypt,
  decrypt,
  encryptCredentials,
  decryptCredentials,
  generateEncryptionKey,
  isValidEncryptedData,
  secureWipe,
  generateHash,
  encryptInBrowser,
}
