// @ts-nocheck — temporary: remove after npx convex dev generates real types
'use server'

import { ConvexHttpClient } from "convex/browser"
import { api } from "../../../../convex/_generated/api"
import { revalidatePath } from 'next/cache'

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL
const convex = convexUrl ? new ConvexHttpClient(convexUrl) : null

export interface ClienteConStats {
  _id: string
  id: string
  razon_social: string
  rut: string
  nombre_fantasia?: string
  giro?: string
  regimen_tributario?: string
  direccion?: string
  comuna?: string
  region?: string
  tasa_ppm?: number
  contador_asignado_id?: string
  contador?: { nombre: string; nombre_completo: string } | null
  activo?: boolean
  documentos_pendientes: number
  estado_f29: 'al_dia' | 'pendiente' | 'atrasado'
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
  try {
    const [clientes, docs, f29s] = await Promise.all([
      convex.query(api.clients.listClientes, {}),
      convex.query(api.documents.listDocuments, {}),
      convex.query(api.f29.listSubmissions, {}),
    ])

    const clientesConStats: ClienteConStats[] = clientes
      .filter(c => c.activo)
      .map(cliente => {
        const clienteDocs = docs.filter(d => d.cliente_id === cliente._id)
        const clienteF29s = f29s.filter(f => f.cliente_id === cliente._id)

        const docsPendientes = clienteDocs.filter(d => d.status === 'pendiente').length
        const ultimoF29 = clienteF29s.sort((a, b) => (b.periodo || '').localeCompare(a.periodo || ''))[0]

        let estadoF29: 'al_dia' | 'pendiente' | 'atrasado' = 'pendiente'
        if (ultimoF29 && (ultimoF29.status === 'enviado' || ultimoF29.status === 'aprobado')) {
          estadoF29 = 'al_dia'
        }

        return {
          _id: cliente._id,
          razon_social: cliente.razon_social,
          rut: cliente.rut,
          activo: cliente.activo,
          documentos_pendientes: docsPendientes,
          estado_f29: estadoF29,
        }
      })

    return filtro
      ? clientesConStats.filter(c =>
          c.razon_social.toLowerCase().includes(filtro.toLowerCase()) ||
          c.rut.includes(filtro)
        )
      : clientesConStats
  } catch (error) {
    console.error('Error fetching clientes:', error)
    return []
  }
}

// Obtener estadísticas de clientes
export async function getClientesStats(): Promise<ClienteStats> {
  try {
    const clientes = await getClientes()

    return {
      total: clientes.length,
      activos: clientes.filter(c => c.activo).length,
      f29AlDia: clientes.filter(c => c.estado_f29 === 'al_dia').length,
      f29Pendiente: clientes.filter(c => c.estado_f29 === 'pendiente').length,
      f29Atrasado: clientes.filter(c => c.estado_f29 === 'atrasado').length,
    }
  } catch (error) {
    console.error('Error getting client stats:', error)
    return {
      total: 0,
      activos: 0,
      f29AlDia: 0,
      f29Pendiente: 0,
      f29Atrasado: 0,
    }
  }
}

// Crear cliente
export async function createCliente(data: {
  razon_social: string
  rut: string
  nombre_fantasia?: string
  giro?: string
}): Promise<{ success: boolean; clienteId?: string; error?: string }> {
  try {
    const clienteId = await convex.mutation(api.clients.createCliente, {
      razon_social: data.razon_social,
      rut: data.rut,
      nombre_fantasia: data.nombre_fantasia,
      giro: data.giro,
    })

    revalidatePath('/dashboard/clientes')
    return { success: true, clienteId: clienteId as string }
  } catch (error) {
    console.error('Error creating cliente:', error)
    return { success: false, error: 'Error creando cliente' }
  }
}

// Actualizar cliente
export async function updateCliente(
  clienteId: string,
  data: Partial<{
    razon_social: string
    rut: string
    nombre_fantasia?: string
    giro?: string
    regimen_tributario?: string
    direccion?: string
    comuna?: string
    region?: string
    tasa_ppm?: number
    contador_asignado_id?: string
    activo?: boolean
  }>
): Promise<{ success: boolean; error?: string }> {
  try {
    await convex.mutation(api.clients.updateCliente, {
      id: clienteId as any,
      ...data,
    })

    revalidatePath('/dashboard/clientes')
    return { success: true }
  } catch (error) {
    console.error('Error updating cliente:', error)
    return { success: false, error: 'Error actualizando cliente' }
  }
}

// Eliminar cliente
export async function deleteCliente(
  clienteId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await convex.mutation(api.clients.deleteCliente, {
      id: clienteId as any,
    })

    revalidatePath('/dashboard/clientes')
    return { success: true }
  } catch (error) {
    console.error('Error deleting cliente:', error)
    return { success: false, error: 'Error eliminando cliente' }
  }
}

// --- Backward-compatible exports for page components ---

export async function getClienteStats(): Promise<ClienteStats> {
  return getClientesStats()
}

export async function getContadores(): Promise<any[]> {
  // Contadores not in current schema - return demo data
  return [
    { id: '1', nombre: 'Demo Contador', email: 'demo@hv.cl', clientes_asignados: 0 },
  ]
}

export async function crearCliente(
  data: Record<string, any>
): Promise<{ success: boolean; clienteId?: string; error?: string }> {
  return createCliente(data as any)
}

export async function actualizarCliente(
  clienteId: string,
  data: Record<string, any>
): Promise<{ success: boolean; error?: string }> {
  return updateCliente(clienteId, data)
}

export async function desactivarCliente(
  clienteId: string
): Promise<{ success: boolean; error?: string }> {
  return updateCliente(clienteId, { activo: false })
}
