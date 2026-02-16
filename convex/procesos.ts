// @ts-nocheck
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// ─── QUERIES ───────────────────────────────────────────────

export const listProcesos = query({
  args: {
    clienteId: v.optional(v.id("clientes")),
    estado: v.optional(v.string()),
    tipo: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let results;

    if (args.clienteId) {
      results = await ctx.db
        .query("procesos")
        .withIndex("by_cliente", (q) => q.eq("cliente_id", args.clienteId!))
        .collect();
    } else if (args.estado) {
      results = await ctx.db
        .query("procesos")
        .withIndex("by_estado", (q) => q.eq("estado", args.estado))
        .collect();
    } else if (args.tipo) {
      results = await ctx.db
        .query("procesos")
        .withIndex("by_tipo", (q) => q.eq("tipo", args.tipo))
        .collect();
    } else {
      results = await ctx.db.query("procesos").collect();
    }

    // Apply remaining filters in memory
    if (args.clienteId && args.estado) {
      results = results.filter((p) => p.estado === args.estado);
    }
    if (args.clienteId && args.tipo) {
      results = results.filter((p) => p.tipo === args.tipo);
    }
    if (args.estado && args.tipo && !args.clienteId) {
      results = results.filter((p) => p.tipo === args.tipo);
    }

    return results;
  },
});

export const getProceso = query({
  args: { id: v.id("procesos") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getProcesoStats = query({
  args: { clienteId: v.optional(v.id("clientes")) },
  handler: async (ctx, args) => {
    let procesos;
    if (args.clienteId) {
      procesos = await ctx.db
        .query("procesos")
        .withIndex("by_cliente", (q) => q.eq("cliente_id", args.clienteId!))
        .collect();
    } else {
      procesos = await ctx.db.query("procesos").collect();
    }

    const tareas = await ctx.db.query("tareas").collect();
    const now = new Date().toISOString();

    // Filter tareas by procesos in scope
    const procesoIds = new Set(procesos.map((p) => p._id));
    const tareasEnScope = tareas.filter((t) => procesoIds.has(t.proceso_id));

    return {
      procesosActivos: procesos.filter((p) => p.estado === "activo").length,
      procesosCompletados: procesos.filter((p) => p.estado === "completado").length,
      tareasVencidas: tareasEnScope.filter(
        (t) => t.fecha_limite && t.fecha_limite < now && t.estado !== "completada"
      ).length,
      totalTareas: tareasEnScope.length,
    };
  },
});

export const getProcesoConTareas = query({
  args: { id: v.id("procesos") },
  handler: async (ctx, args) => {
    const proceso = await ctx.db.get(args.id);
    if (!proceso) return null;

    const tareas = await ctx.db
      .query("tareas")
      .withIndex("by_proceso", (q) => q.eq("proceso_id", args.id))
      .collect();

    return { ...proceso, tareas };
  },
});

// ─── MUTATIONS ─────────────────────────────────────────────

export const createProceso = mutation({
  args: {
    nombre: v.string(),
    descripcion: v.optional(v.string()),
    tipo: v.union(
      v.literal("contabilidad_mensual"),
      v.literal("declaracion_f29"),
      v.literal("declaracion_renta"),
      v.literal("cierre_anual"),
      v.literal("onboarding_cliente"),
      v.literal("otro")
    ),
    cliente_id: v.id("clientes"),
    periodo: v.optional(v.string()),
    estado: v.optional(v.union(
      v.literal("activo"),
      v.literal("pausado"),
      v.literal("completado"),
      v.literal("cancelado")
    )),
    fecha_inicio: v.optional(v.string()),
    fecha_limite: v.optional(v.string()),
    responsable_id: v.optional(v.id("profiles")),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    return await ctx.db.insert("procesos", {
      ...args,
      estado: args.estado ?? "activo",
      created_at: now,
      updated_at: now,
    });
  },
});

export const updateProceso = mutation({
  args: {
    id: v.id("procesos"),
    nombre: v.optional(v.string()),
    descripcion: v.optional(v.string()),
    estado: v.optional(v.union(
      v.literal("activo"),
      v.literal("pausado"),
      v.literal("completado"),
      v.literal("cancelado")
    )),
    fecha_inicio: v.optional(v.string()),
    fecha_limite: v.optional(v.string()),
    responsable_id: v.optional(v.id("profiles")),
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

export const deleteProceso = mutation({
  args: { id: v.id("procesos") },
  handler: async (ctx, args) => {
    // Delete all tasks in this process
    const tareas = await ctx.db
      .query("tareas")
      .withIndex("by_proceso", (q) => q.eq("proceso_id", args.id))
      .collect();

    for (const tarea of tareas) {
      // Delete comments for each task
      const comentarios = await ctx.db
        .query("comentarios_tarea")
        .withIndex("by_tarea", (q) => q.eq("tarea_id", tarea._id))
        .collect();
      for (const c of comentarios) {
        await ctx.db.delete(c._id);
      }
      await ctx.db.delete(tarea._id);
    }

    await ctx.db.delete(args.id);
    return { success: true };
  },
});

export const crearDesdePlantilla = mutation({
  args: {
    plantillaId: v.id("plantillas_proceso"),
    clienteId: v.id("clientes"),
    periodo: v.optional(v.string()),
    fechaInicio: v.optional(v.string()),
    responsableId: v.optional(v.id("profiles")),
  },
  handler: async (ctx, args) => {
    const plantilla = await ctx.db.get(args.plantillaId);
    if (!plantilla) throw new Error("Plantilla no encontrada");

    const now = new Date().toISOString();
    const baseDate = args.fechaInicio ? new Date(args.fechaInicio) : new Date();

    const procesoId = await ctx.db.insert("procesos", {
      nombre: `${plantilla.nombre}${args.periodo ? ` - ${args.periodo}` : ""}`,
      descripcion: plantilla.descripcion,
      tipo: plantilla.tipo,
      cliente_id: args.clienteId,
      periodo: args.periodo,
      estado: "activo",
      fecha_inicio: baseDate.toISOString().split("T")[0],
      responsable_id: args.responsableId,
      created_at: now,
      updated_at: now,
    });

    // Create tasks from template
    for (let i = 0; i < plantilla.tareas_template.length; i++) {
      const t = plantilla.tareas_template[i];
      const inicio = new Date(baseDate);
      inicio.setDate(inicio.getDate() + t.offset_dias_inicio);
      const limite = new Date(baseDate);
      limite.setDate(limite.getDate() + t.offset_dias_limite);

      await ctx.db.insert("tareas", {
        titulo: t.titulo,
        descripcion: t.descripcion,
        proceso_id: procesoId,
        estado: "pendiente",
        prioridad: t.prioridad,
        orden: i * 1000,
        fecha_inicio: inicio.toISOString().split("T")[0],
        fecha_limite: limite.toISOString().split("T")[0],
        etiquetas: t.etiquetas,
        checklist: t.checklist,
        created_at: now,
        updated_at: now,
      });
    }

    return procesoId;
  },
});
