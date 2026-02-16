'use server'

import { ConvexHttpClient } from "convex/browser"
import { api } from "../../../../convex/_generated/api"
import type { Id } from "../../../../convex/_generated/dataModel"
import { revalidatePath } from 'next/cache'

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL
const convex = convexUrl ? new ConvexHttpClient(convexUrl) : null

export async function getProcesos(clienteId?: string, estado?: string, tipo?: string) {
  try {
    if (!convex) throw new Error('Convex client not initialized')
    return await convex.query(api.procesos.listProcesos, {
      clienteId: clienteId ? clienteId as Id<"clientes"> : undefined,
      estado,
      tipo,
    })
  } catch (error) {
    console.error('Error fetching procesos:', error)
    return []
  }
}

export async function getProcesoStats(clienteId?: string) {
  try {
    if (!convex) throw new Error('Convex client not initialized')
    return await convex.query(api.procesos.getProcesoStats, {
      clienteId: clienteId ? clienteId as Id<"clientes"> : undefined,
    })
  } catch (error) {
    console.error('Error fetching proceso stats:', error)
    return { procesosActivos: 0, procesosCompletados: 0, tareasVencidas: 0, totalTareas: 0 }
  }
}

export async function getPlantillas() {
  try {
    if (!convex) throw new Error('Convex client not initialized')
    return await convex.query(api.plantillasProceso.listPlantillas, {})
  } catch (error) {
    console.error('Error fetching plantillas:', error)
    return []
  }
}

export async function getClientes() {
  try {
    if (!convex) throw new Error('Convex client not initialized')
    return await convex.query(api.clients.listClientes, {})
  } catch (error) {
    console.error('Error fetching clientes:', error)
    return []
  }
}

export async function createProceso(data: {
  nombre: string
  descripcion?: string
  tipo: string
  cliente_id: string
  periodo?: string
  fecha_inicio?: string
  fecha_limite?: string
  responsable_id?: string
}) {
  try {
    if (!convex) throw new Error('Convex client not initialized')
    const id = await convex.mutation(api.procesos.createProceso, {
      nombre: data.nombre,
      descripcion: data.descripcion,
      tipo: data.tipo as any,
      cliente_id: data.cliente_id as Id<"clientes">,
      periodo: data.periodo,
      fecha_inicio: data.fecha_inicio,
      fecha_limite: data.fecha_limite,
      responsable_id: data.responsable_id ? data.responsable_id as Id<"profiles"> : undefined,
    })
    revalidatePath('/dashboard/procesos')
    return { success: true, id }
  } catch (error) {
    console.error('Error creating proceso:', error)
    return { success: false, error: 'Error creando proceso' }
  }
}

export async function crearDesdePlantilla(data: {
  plantillaId: string
  clienteId: string
  periodo?: string
  fechaInicio?: string
}) {
  try {
    if (!convex) throw new Error('Convex client not initialized')
    const id = await convex.mutation(api.procesos.crearDesdePlantilla, {
      plantillaId: data.plantillaId as Id<"plantillas_proceso">,
      clienteId: data.clienteId as Id<"clientes">,
      periodo: data.periodo,
      fechaInicio: data.fechaInicio,
    })
    revalidatePath('/dashboard/procesos')
    return { success: true, id }
  } catch (error) {
    console.error('Error creating proceso from template:', error)
    return { success: false, error: 'Error creando proceso desde plantilla' }
  }
}

export async function updateProceso(id: string, data: {
  nombre?: string
  descripcion?: string
  estado?: string
  fecha_inicio?: string
  fecha_limite?: string
}) {
  try {
    if (!convex) throw new Error('Convex client not initialized')
    await convex.mutation(api.procesos.updateProceso, {
      id: id as Id<"procesos">,
      ...data as any,
    })
    revalidatePath('/dashboard/procesos')
    return { success: true }
  } catch (error) {
    console.error('Error updating proceso:', error)
    return { success: false, error: 'Error actualizando proceso' }
  }
}

export async function deleteProceso(id: string) {
  try {
    if (!convex) throw new Error('Convex client not initialized')
    await convex.mutation(api.procesos.deleteProceso, {
      id: id as Id<"procesos">,
    })
    revalidatePath('/dashboard/procesos')
    return { success: true }
  } catch (error) {
    console.error('Error deleting proceso:', error)
    return { success: false, error: 'Error eliminando proceso' }
  }
}

export async function seedPlantillas() {
  try {
    if (!convex) throw new Error('Convex client not initialized')
    const result = await convex.mutation(api.plantillasProceso.seedPlantillas, {})
    return result
  } catch (error) {
    console.error('Error seeding plantillas:', error)
    return { message: 'Error', count: 0 }
  }
}
