// @ts-nocheck
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// ─── QUERIES ───────────────────────────────────────────────

export const listTareasByProceso = query({
  args: { procesoId: v.id("procesos") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("tareas")
      .withIndex("by_proceso", (q) => q.eq("proceso_id", args.procesoId))
      .collect();
  },
});

export const getTarea = query({
  args: { id: v.id("tareas") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getTareaStats = query({
  args: { procesoId: v.id("procesos") },
  handler: async (ctx, args) => {
    const tareas = await ctx.db
      .query("tareas")
      .withIndex("by_proceso", (q) => q.eq("proceso_id", args.procesoId))
      .collect();

    return {
      total: tareas.length,
      pendiente: tareas.filter((t) => t.estado === "pendiente").length,
      en_progreso: tareas.filter((t) => t.estado === "en_progreso").length,
      en_revision: tareas.filter((t) => t.estado === "en_revision").length,
      completada: tareas.filter((t) => t.estado === "completada").length,
      bloqueada: tareas.filter((t) => t.estado === "bloqueada").length,
    };
  },
});

export const getTareasVencidas = query({
  args: { clienteId: v.optional(v.id("clientes")) },
  handler: async (ctx, args) => {
    const now = new Date().toISOString().split("T")[0];
    let tareas = await ctx.db.query("tareas").collect();

    // Filter overdue non-completed tasks
    tareas = tareas.filter(
      (t) => t.fecha_limite && t.fecha_limite < now && t.estado !== "completada"
    );

    if (args.clienteId) {
      const procesos = await ctx.db
        .query("procesos")
        .withIndex("by_cliente", (q) => q.eq("cliente_id", args.clienteId!))
        .collect();
      const procesoIds = new Set(procesos.map((p) => p._id));
      tareas = tareas.filter((t) => procesoIds.has(t.proceso_id));
    }

    return tareas;
  },
});

// ─── MUTATIONS ─────────────────────────────────────────────

export const createTarea = mutation({
  args: {
    titulo: v.string(),
    descripcion: v.optional(v.string()),
    proceso_id: v.id("procesos"),
    estado: v.optional(v.union(
      v.literal("pendiente"),
      v.literal("en_progreso"),
      v.literal("en_revision"),
      v.literal("completada"),
      v.literal("bloqueada")
    )),
    prioridad: v.union(
      v.literal("urgente"),
      v.literal("alta"),
      v.literal("media"),
      v.literal("baja")
    ),
    orden: v.optional(v.number()),
    asignado_a: v.optional(v.id("profiles")),
    fecha_inicio: v.optional(v.string()),
    fecha_limite: v.optional(v.string()),
    etiquetas: v.optional(v.array(v.string())),
    checklist: v.optional(v.array(v.object({
      texto: v.string(),
      completado: v.boolean(),
    }))),
    estimacion_horas: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();

    // Auto-calculate orden if not provided
    let orden = args.orden;
    if (orden === undefined) {
      const existing = await ctx.db
        .query("tareas")
        .withIndex("by_proceso", (q) => q.eq("proceso_id", args.proceso_id))
        .collect();
      orden = existing.length > 0
        ? Math.max(...existing.map((t) => t.orden)) + 1000
        : 0;
    }

    return await ctx.db.insert("tareas", {
      ...args,
      estado: args.estado ?? "pendiente",
      orden,
      created_at: now,
      updated_at: now,
    });
  },
});

export const updateTarea = mutation({
  args: {
    id: v.id("tareas"),
    titulo: v.optional(v.string()),
    descripcion: v.optional(v.string()),
    estado: v.optional(v.union(
      v.literal("pendiente"),
      v.literal("en_progreso"),
      v.literal("en_revision"),
      v.literal("completada"),
      v.literal("bloqueada")
    )),
    prioridad: v.optional(v.union(
      v.literal("urgente"),
      v.literal("alta"),
      v.literal("media"),
      v.literal("baja")
    )),
    asignado_a: v.optional(v.id("profiles")),
    fecha_inicio: v.optional(v.string()),
    fecha_limite: v.optional(v.string()),
    etiquetas: v.optional(v.array(v.string())),
    checklist: v.optional(v.array(v.object({
      texto: v.string(),
      completado: v.boolean(),
    }))),
    estimacion_horas: v.optional(v.number()),
    horas_reales: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, {
      ...updates,
      updated_at: new Date().toISOString(),
    });
    return id;
  },
});

export const deleteTarea = mutation({
  args: { id: v.id("tareas") },
  handler: async (ctx, args) => {
    // Delete comments
    const comentarios = await ctx.db
      .query("comentarios_tarea")
      .withIndex("by_tarea", (q) => q.eq("tarea_id", args.id))
      .collect();
    for (const c of comentarios) {
      await ctx.db.delete(c._id);
    }
    await ctx.db.delete(args.id);
    return { success: true };
  },
});

export const moverTarea = mutation({
  args: {
    tareaId: v.id("tareas"),
    nuevoEstado: v.union(
      v.literal("pendiente"),
      v.literal("en_progreso"),
      v.literal("en_revision"),
      v.literal("completada"),
      v.literal("bloqueada")
    ),
    nuevoOrden: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.tareaId, {
      estado: args.nuevoEstado,
      orden: args.nuevoOrden,
      updated_at: new Date().toISOString(),
    });
    return { success: true };
  },
});

export const reordenarTareas = mutation({
  args: {
    items: v.array(v.object({
      id: v.id("tareas"),
      orden: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    for (const item of args.items) {
      await ctx.db.patch(item.id, {
        orden: item.orden,
        updated_at: new Date().toISOString(),
      });
    }
    return { success: true };
  },
});

export const toggleChecklistItem = mutation({
  args: {
    tareaId: v.id("tareas"),
    index: v.number(),
  },
  handler: async (ctx, args) => {
    const tarea = await ctx.db.get(args.tareaId);
    if (!tarea || !tarea.checklist) return null;

    const checklist = [...tarea.checklist];
    if (args.index >= 0 && args.index < checklist.length) {
      checklist[args.index] = {
        ...checklist[args.index],
        completado: !checklist[args.index].completado,
      };
    }

    await ctx.db.patch(args.tareaId, {
      checklist,
      updated_at: new Date().toISOString(),
    });
    return { success: true };
  },
});
