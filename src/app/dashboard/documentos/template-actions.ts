'use server'
// TODO: Phase 2 - Implement documento_plantillas module in Convex
// Note: This accesses `documento_plantillas` table (different from Convex's `plantillas_plan_cuenta`)

import { revalidatePath } from 'next/cache'

const DEMO_USER_ID = 'demo-user'

export interface DocumentoPlantilla {
  id: string
  cliente_id: string
  nombre: string
  descripcion: string | null
  tipo_documento: string
  folio_documento_prefijo: string | null
  folio_documento_siguiente: number
  fecha_documento_default: string | null
  monto_total_default: number | null
  activa: boolean
  uso_count: number
  ultima_usada_en: string | null
  creada_por: string
  creada_en: string
  actualizada_en: string
}

// Obtener todas las plantillas de un cliente
export async function obtenerPlantillasCliente(
  clienteId: string
): Promise<{ success: boolean; plantillas?: DocumentoPlantilla[]; error?: string }> {
  // Stub: returns empty data until Convex module is implemented
  return { success: true, plantillas: [] }
}

// Crear nueva plantilla
export async function crearPlantilla(
  clienteId: string,
  datos: {
    nombre: string
    descripcion?: string
    tipo_documento: string
    folio_documento_prefijo?: string
    fecha_documento_default?: string
    monto_total_default?: number
  }
): Promise<{ success: boolean; plantillaId?: string; error?: string }> {
  // Stub: returns success until Convex module is implemented
  return { success: true, plantillaId: 'stub-template-id' }
}

// Actualizar plantilla
export async function actualizarPlantilla(
  plantillaId: string,
  datos: Partial<{
    nombre: string
    descripcion: string | null
    tipo_documento: string
    folio_documento_prefijo: string | null
    fecha_documento_default: string | null
    monto_total_default: number | null
    activa: boolean
  }>
): Promise<{ success: boolean; error?: string }> {
  // Stub: returns success until Convex module is implemented
  return { success: true }
}

// Eliminar plantilla
export async function eliminarPlantilla(
  plantillaId: string
): Promise<{ success: boolean; error?: string }> {
  // Stub: returns success until Convex module is implemented
  return { success: true }
}

// Obtener plantilla por ID
export async function obtenerPlantilla(
  plantillaId: string
): Promise<{ success: boolean; plantilla?: DocumentoPlantilla; error?: string }> {
  // Stub: returns empty data until Convex module is implemented
  return { success: true, plantilla: undefined }
}

// Incrementar contador de uso de plantilla
export async function usarPlantilla(
  plantillaId: string
): Promise<{ success: boolean; error?: string }> {
  // Stub: returns success until Convex module is implemented
  return { success: true }
}

// Obtener proximo folio para una plantilla
export async function obtenerProximoFolio(
  plantillaId: string
): Promise<{ success: boolean; folio?: string; error?: string }> {
  // Stub: returns a default folio until Convex module is implemented
  return { success: true, folio: '0001' }
}

// Duplicar plantilla
export async function duplicarPlantilla(
  plantillaId: string,
  nuevoNombre: string
): Promise<{ success: boolean; plantillaId?: string; error?: string }> {
  // Stub: returns success until Convex module is implemented
  return { success: true, plantillaId: 'stub-duplicate-id' }
}
