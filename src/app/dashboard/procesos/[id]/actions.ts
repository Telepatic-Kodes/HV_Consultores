'use server'

import { ConvexHttpClient } from "convex/browser"
import { api } from "../../../../../convex/_generated/api"
import type { Id } from "../../../../../convex/_generated/dataModel"
import { revalidatePath } from 'next/cache'

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL
const convex = convexUrl ? new ConvexHttpClient(convexUrl) : null

export async function getProcesoConTareas(procesoId: string) {
  try {
    if (!convex) throw new Error('Convex client not initialized')
    return await convex.query(api.procesos.getProcesoConTareas, {
      id: procesoId as Id<"procesos">,
    })
  } catch (error) {
    console.error('Error fetching proceso with tareas:', error)
    return null
  }
}

export async function getCliente(clienteId: string) {
  try {
    if (!convex) throw new Error('Convex client not initialized')
    return await convex.query(api.clients.getClient, {
      id: clienteId as Id<"clientes">,
    })
  } catch (error) {
    console.error('Error fetching cliente:', error)
    return null
  }
}

export async function getComentarios(tareaId: string) {
  try {
    if (!convex) throw new Error('Convex client not initialized')
    return await convex.query(api.comentariosTarea.listComentarios, {
      tareaId: tareaId as Id<"tareas">,
    })
  } catch (error) {
    console.error('Error fetching comentarios:', error)
    return []
  }
}

export async function moverTarea(tareaId: string, nuevoEstado: string, nuevoOrden: number) {
  try {
    if (!convex) throw new Error('Convex client not initialized')
    await convex.mutation(api.tareas.moverTarea, {
      tareaId: tareaId as Id<"tareas">,
      nuevoEstado: nuevoEstado as any,
      nuevoOrden,
    })
    return { success: true }
  } catch (error) {
    console.error('Error moving tarea:', error)
    return { success: false }
  }
}

export async function updateTarea(tareaId: string, data: Record<string, any>) {
  try {
    if (!convex) throw new Error('Convex client not initialized')
    await convex.mutation(api.tareas.updateTarea, {
      id: tareaId as Id<"tareas">,
      ...data,
    })
    return { success: true }
  } catch (error) {
    console.error('Error updating tarea:', error)
    return { success: false }
  }
}

export async function createTarea(data: {
  titulo: string
  descripcion?: string
  proceso_id: string
  prioridad: string
  fecha_inicio?: string
  fecha_limite?: string
  etiquetas?: string[]
}) {
  try {
    if (!convex) throw new Error('Convex client not initialized')
    const id = await convex.mutation(api.tareas.createTarea, {
      titulo: data.titulo,
      descripcion: data.descripcion,
      proceso_id: data.proceso_id as Id<"procesos">,
      prioridad: data.prioridad as any,
      fecha_inicio: data.fecha_inicio,
      fecha_limite: data.fecha_limite,
      etiquetas: data.etiquetas,
    })
    return { success: true, id }
  } catch (error) {
    console.error('Error creating tarea:', error)
    return { success: false }
  }
}

export async function deleteTarea(tareaId: string) {
  try {
    if (!convex) throw new Error('Convex client not initialized')
    await convex.mutation(api.tareas.deleteTarea, {
      id: tareaId as Id<"tareas">,
    })
    return { success: true }
  } catch (error) {
    console.error('Error deleting tarea:', error)
    return { success: false }
  }
}

export async function toggleChecklistItem(tareaId: string, index: number) {
  try {
    if (!convex) throw new Error('Convex client not initialized')
    await convex.mutation(api.tareas.toggleChecklistItem, {
      tareaId: tareaId as Id<"tareas">,
      index,
    })
    return { success: true }
  } catch (error) {
    console.error('Error toggling checklist:', error)
    return { success: false }
  }
}

export async function addComentario(tareaId: string, contenido: string) {
  try {
    if (!convex) throw new Error('Convex client not initialized')
    await convex.mutation(api.comentariosTarea.createComentario, {
      tarea_id: tareaId as Id<"tareas">,
      contenido,
      tipo: "comentario",
    })
    return { success: true }
  } catch (error) {
    console.error('Error adding comentario:', error)
    return { success: false }
  }
}

export async function updateProceso(procesoId: string, data: Record<string, any>) {
  try {
    if (!convex) throw new Error('Convex client not initialized')
    await convex.mutation(api.procesos.updateProceso, {
      id: procesoId as Id<"procesos">,
      ...data,
    })
    revalidatePath(`/dashboard/procesos/${procesoId}`)
    return { success: true }
  } catch (error) {
    console.error('Error updating proceso:', error)
    return { success: false }
  }
}
