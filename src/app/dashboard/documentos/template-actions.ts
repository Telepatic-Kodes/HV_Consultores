'use server'

import { createClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

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
  const supabase = createClient()

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'No autenticado' }
    }

    const { data: plantillas, error } = await supabase
      .from('documento_plantillas')
      .select('*')
      .eq('cliente_id', clienteId)
      .order('creada_en', { ascending: false })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, plantillas: (plantillas || []) as DocumentoPlantilla[] }
  } catch (error) {
    return { success: false, error: 'Error al obtener plantillas' }
  }
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
  const supabase = createClient()

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'No autenticado' }
    }

    // Validar que el cliente existe y el usuario tiene acceso
    const { data: cliente, error: clienteError } = await supabase
      .from('clientes')
      .select('id, contador_asignado_id')
      .eq('id', clienteId)
      .single()

    if (clienteError || !cliente) {
      return { success: false, error: 'Cliente no encontrado' }
    }

    // Validar nombre único
    const { data: existente } = await supabase
      .from('documento_plantillas')
      .select('id')
      .eq('cliente_id', clienteId)
      .eq('nombre', datos.nombre)
      .single()

    if (existente) {
      return { success: false, error: 'Ya existe una plantilla con ese nombre' }
    }

    // Crear plantilla
    const { data: plantilla, error: insertError } = await supabase
      .from('documento_plantillas')
      .insert({
        cliente_id: clienteId,
        nombre: datos.nombre,
        descripcion: datos.descripcion || null,
        tipo_documento: datos.tipo_documento,
        folio_documento_prefijo: datos.folio_documento_prefijo || null,
        fecha_documento_default: datos.fecha_documento_default || null,
        monto_total_default: datos.monto_total_default || null,
        creada_por: user.id,
      })
      .select('id')
      .single()

    if (insertError) {
      return { success: false, error: insertError.message }
    }

    revalidatePath(`/dashboard/documentos`)
    return { success: true, plantillaId: plantilla.id }
  } catch (error) {
    return { success: false, error: 'Error al crear plantilla' }
  }
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
  const supabase = createClient()

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'No autenticado' }
    }

    // Obtener plantilla actual
    const { data: plantilla, error: getError } = await supabase
      .from('documento_plantillas')
      .select('*')
      .eq('id', plantillaId)
      .single()

    if (getError || !plantilla) {
      return { success: false, error: 'Plantilla no encontrada' }
    }

    // Verificar permiso
    if (plantilla.creada_por !== user.id) {
      return { success: false, error: 'No tiene permiso para editar esta plantilla' }
    }

    // Actualizar
    const { error: updateError } = await supabase
      .from('documento_plantillas')
      .update(datos)
      .eq('id', plantillaId)

    if (updateError) {
      return { success: false, error: updateError.message }
    }

    revalidatePath(`/dashboard/documentos`)
    return { success: true }
  } catch (error) {
    return { success: false, error: 'Error al actualizar plantilla' }
  }
}

// Eliminar plantilla
export async function eliminarPlantilla(
  plantillaId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'No autenticado' }
    }

    // Obtener plantilla
    const { data: plantilla, error: getError } = await supabase
      .from('documento_plantillas')
      .select('creada_por')
      .eq('id', plantillaId)
      .single()

    if (getError || !plantilla) {
      return { success: false, error: 'Plantilla no encontrada' }
    }

    // Verificar permiso
    if (plantilla.creada_por !== user.id) {
      return { success: false, error: 'No tiene permiso para eliminar esta plantilla' }
    }

    // Eliminar
    const { error: deleteError } = await supabase
      .from('documento_plantillas')
      .delete()
      .eq('id', plantillaId)

    if (deleteError) {
      return { success: false, error: deleteError.message }
    }

    revalidatePath(`/dashboard/documentos`)
    return { success: true }
  } catch (error) {
    return { success: false, error: 'Error al eliminar plantilla' }
  }
}

// Obtener plantilla por ID
export async function obtenerPlantilla(
  plantillaId: string
): Promise<{ success: boolean; plantilla?: DocumentoPlantilla; error?: string }> {
  const supabase = createClient()

  try {
    const { data: plantilla, error } = await supabase
      .from('documento_plantillas')
      .select('*')
      .eq('id', plantillaId)
      .single()

    if (error || !plantilla) {
      return { success: false, error: 'Plantilla no encontrada' }
    }

    return { success: true, plantilla: plantilla as DocumentoPlantilla }
  } catch (error) {
    return { success: false, error: 'Error al obtener plantilla' }
  }
}

// Incrementar contador de uso de plantilla
export async function usarPlantilla(
  plantillaId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()

  try {
    const { error } = await supabase.rpc('incrementar_folio_plantilla', {
      p_plantilla_id: plantillaId,
    })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    return { success: false, error: 'Error al usar plantilla' }
  }
}

// Obtener próximo folio para una plantilla
export async function obtenerProximoFolio(
  plantillaId: string
): Promise<{ success: boolean; folio?: string; error?: string }> {
  const supabase = createClient()

  try {
    const { data, error } = await supabase.rpc('obtener_proximo_folio_plantilla', {
      p_plantilla_id: plantillaId,
    })

    if (error) {
      return { success: false, error: error.message }
    }

    // Get the prefix
    const { data: plantilla, error: getError } = await supabase
      .from('documento_plantillas')
      .select('folio_documento_prefijo')
      .eq('id', plantillaId)
      .single()

    if (getError || !plantilla) {
      return { success: false, error: 'Plantilla no encontrada' }
    }

    const folio = plantilla.folio_documento_prefijo
      ? `${plantilla.folio_documento_prefijo}${data}`
      : `${data}`

    return { success: true, folio }
  } catch (error) {
    return { success: false, error: 'Error al obtener próximo folio' }
  }
}

// Duplicar plantilla
export async function duplicarPlantilla(
  plantillaId: string,
  nuevoNombre: string
): Promise<{ success: boolean; plantillaId?: string; error?: string }> {
  const supabase = createClient()

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'No autenticado' }
    }

    // Obtener plantilla original
    const { data: original, error: getError } = await supabase
      .from('documento_plantillas')
      .select('*')
      .eq('id', plantillaId)
      .single()

    if (getError || !original) {
      return { success: false, error: 'Plantilla no encontrada' }
    }

    // Crear copia
    const { data: copia, error: insertError } = await supabase
      .from('documento_plantillas')
      .insert({
        cliente_id: original.cliente_id,
        nombre: nuevoNombre,
        descripcion: original.descripcion,
        tipo_documento: original.tipo_documento,
        folio_documento_prefijo: original.folio_documento_prefijo,
        fecha_documento_default: original.fecha_documento_default,
        monto_total_default: original.monto_total_default,
        creada_por: user.id,
      })
      .select('id')
      .single()

    if (insertError) {
      return { success: false, error: insertError.message }
    }

    revalidatePath(`/dashboard/documentos`)
    return { success: true, plantillaId: copia.id }
  } catch (error) {
    return { success: false, error: 'Error al duplicar plantilla' }
  }
}
