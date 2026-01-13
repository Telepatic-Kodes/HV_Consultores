'use server'

import { createClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'
import type { Database } from '@/types/database.types'

type Cliente = Database['public']['Tables']['clientes']['Row']
type Profile = Database['public']['Tables']['profiles']['Row']

export interface ClienteConStats extends Cliente {
  contador?: Profile | null
  documentos_pendientes: number
  estado_f29: 'al_dia' | 'pendiente' | 'atrasado'
  ultimo_f29?: {
    periodo: string
    status: string | null
  } | null
}

export interface ClienteStats {
  total: number
  activos: number
  f29AlDia: number
  f29Pendiente: number
  f29Atrasado: number
}

// Obtener lista de clientes con estadísticas
export async function getClientes(filtro?: string): Promise<ClienteConStats[]> {
  const supabase = createClient()

  let query = supabase
    .from('clientes')
    .select(`
      *,
      contador:profiles!clientes_contador_asignado_id_fkey(id, nombre_completo)
    `)
    .eq('activo', true)
    .order('razon_social', { ascending: true })

  if (filtro) {
    query = query.or(`razon_social.ilike.%${filtro}%,rut.ilike.%${filtro}%`)
  }

  const { data: clientes, error } = await query

  if (error) {
    console.error('Error fetching clientes:', error)
    return []
  }

  // Obtener estadísticas para cada cliente
  const clientesConStats: ClienteConStats[] = await Promise.all(
    (clientes || []).map(async (cliente) => {
      // Contar documentos pendientes
      const { count: docsPendientes } = await supabase
        .from('documentos')
        .select('id', { count: 'exact', head: true })
        .eq('cliente_id', cliente.id)
        .eq('status', 'pendiente')

      // Obtener último F29
      const { data: ultimoF29 } = await supabase
        .from('f29_calculos')
        .select('periodo, status')
        .eq('cliente_id', cliente.id)
        .order('periodo', { ascending: false })
        .limit(1)
        .single()

      // Determinar estado F29
      let estadoF29: 'al_dia' | 'pendiente' | 'atrasado' = 'pendiente'
      if (ultimoF29) {
        const mesActual = new Date().toISOString().slice(0, 7)
        const mesAnterior = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .slice(0, 7)

        if (ultimoF29.status === 'enviado' || ultimoF29.status === 'aprobado') {
          if (ultimoF29.periodo >= mesAnterior) {
            estadoF29 = 'al_dia'
          } else {
            estadoF29 = 'atrasado'
          }
        } else {
          estadoF29 = 'pendiente'
        }
      }

      return {
        ...cliente,
        contador: cliente.contador as Profile | null,
        documentos_pendientes: docsPendientes || 0,
        estado_f29: estadoF29,
        ultimo_f29: ultimoF29,
      }
    })
  )

  return clientesConStats
}

// Obtener estadísticas generales
export async function getClienteStats(): Promise<ClienteStats> {
  const supabase = createClient()

  const { count: total } = await supabase
    .from('clientes')
    .select('id', { count: 'exact', head: true })

  const { count: activos } = await supabase
    .from('clientes')
    .select('id', { count: 'exact', head: true })
    .eq('activo', true)

  // Contar estados de F29 basados en datos
  const clientes = await getClientes()
  const f29AlDia = clientes.filter((c) => c.estado_f29 === 'al_dia').length
  const f29Pendiente = clientes.filter((c) => c.estado_f29 === 'pendiente').length
  const f29Atrasado = clientes.filter((c) => c.estado_f29 === 'atrasado').length

  return {
    total: total || 0,
    activos: activos || 0,
    f29AlDia,
    f29Pendiente,
    f29Atrasado,
  }
}

// Obtener cliente por ID
export async function getClienteById(id: string): Promise<ClienteConStats | null> {
  const supabase = createClient()

  const { data: cliente, error } = await supabase
    .from('clientes')
    .select(`
      *,
      contador:profiles!clientes_contador_asignado_id_fkey(id, nombre_completo)
    `)
    .eq('id', id)
    .single()

  if (error || !cliente) {
    return null
  }

  const { count: docsPendientes } = await supabase
    .from('documentos')
    .select('id', { count: 'exact', head: true })
    .eq('cliente_id', cliente.id)
    .eq('status', 'pendiente')

  const { data: ultimoF29 } = await supabase
    .from('f29_calculos')
    .select('periodo, status')
    .eq('cliente_id', cliente.id)
    .order('periodo', { ascending: false })
    .limit(1)
    .single()

  let estadoF29: 'al_dia' | 'pendiente' | 'atrasado' = 'pendiente'
  if (ultimoF29) {
    const mesAnterior = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 7)
    if (ultimoF29.status === 'enviado' || ultimoF29.status === 'aprobado') {
      estadoF29 = ultimoF29.periodo >= mesAnterior ? 'al_dia' : 'atrasado'
    }
  }

  return {
    ...cliente,
    contador: cliente.contador as Profile | null,
    documentos_pendientes: docsPendientes || 0,
    estado_f29: estadoF29,
    ultimo_f29: ultimoF29,
  }
}

// Obtener contadores disponibles
export async function getContadores(): Promise<Profile[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('activo', true)
    .order('nombre_completo')

  if (error) {
    console.error('Error fetching contadores:', error)
    return []
  }

  return data || []
}

// Crear nuevo cliente
export async function crearCliente(datos: {
  razon_social: string
  rut: string
  regimen_tributario?: string
  contador_asignado_id?: string
  giro?: string
  direccion?: string
  comuna?: string
  region?: string
  nombre_fantasia?: string
  tasa_ppm?: number
}): Promise<{ success: boolean; cliente?: Cliente; error?: string }> {
  const supabase = createClient()

  // Validar RUT único
  const { data: existente } = await supabase
    .from('clientes')
    .select('id')
    .eq('rut', datos.rut)
    .single()

  if (existente) {
    return { success: false, error: 'Ya existe un cliente con este RUT' }
  }

  const { data: cliente, error } = await supabase
    .from('clientes')
    .insert({
      razon_social: datos.razon_social,
      rut: datos.rut,
      regimen_tributario: datos.regimen_tributario as any,
      contador_asignado_id: datos.contador_asignado_id || null,
      giro: datos.giro || null,
      direccion: datos.direccion || null,
      comuna: datos.comuna || null,
      region: datos.region || null,
      nombre_fantasia: datos.nombre_fantasia || null,
      tasa_ppm: datos.tasa_ppm || null,
      activo: true,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating cliente:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard/clientes')
  return { success: true, cliente }
}

// Actualizar cliente
export async function actualizarCliente(
  id: string,
  datos: {
    razon_social?: string
    regimen_tributario?: string
    contador_asignado_id?: string | null
    giro?: string
    direccion?: string
    comuna?: string
    region?: string
    nombre_fantasia?: string
    tasa_ppm?: number
    activo?: boolean
  }
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()

  const updateData: any = { updated_at: new Date().toISOString() }

  if (datos.razon_social !== undefined) updateData.razon_social = datos.razon_social
  if (datos.regimen_tributario !== undefined)
    updateData.regimen_tributario = datos.regimen_tributario
  if (datos.contador_asignado_id !== undefined)
    updateData.contador_asignado_id = datos.contador_asignado_id
  if (datos.giro !== undefined) updateData.giro = datos.giro
  if (datos.direccion !== undefined) updateData.direccion = datos.direccion
  if (datos.comuna !== undefined) updateData.comuna = datos.comuna
  if (datos.region !== undefined) updateData.region = datos.region
  if (datos.nombre_fantasia !== undefined) updateData.nombre_fantasia = datos.nombre_fantasia
  if (datos.tasa_ppm !== undefined) updateData.tasa_ppm = datos.tasa_ppm
  if (datos.activo !== undefined) updateData.activo = datos.activo

  const { error } = await supabase.from('clientes').update(updateData).eq('id', id)

  if (error) {
    console.error('Error updating cliente:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard/clientes')
  return { success: true }
}

// Desactivar cliente (soft delete)
export async function desactivarCliente(id: string): Promise<{ success: boolean }> {
  const supabase = createClient()

  const { error } = await supabase
    .from('clientes')
    .update({ activo: false, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    console.error('Error deactivating cliente:', error)
    return { success: false }
  }

  revalidatePath('/dashboard/clientes')
  return { success: true }
}
