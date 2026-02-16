// @ts-nocheck
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// ─── QUERIES ───────────────────────────────────────────────

export const listComentarios = query({
  args: { tareaId: v.id("tareas") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("comentarios_tarea")
      .withIndex("by_tarea", (q) => q.eq("tarea_id", args.tareaId))
      .collect();
  },
});

// ─── MUTATIONS ─────────────────────────────────────────────

export const createComentario = mutation({
  args: {
    tarea_id: v.id("tareas"),
    autor_id: v.optional(v.id("profiles")),
    contenido: v.string(),
    tipo: v.optional(v.union(
      v.literal("comentario"),
      v.literal("cambio_estado"),
      v.literal("asignacion"),
      v.literal("sistema")
    )),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("comentarios_tarea", {
      tarea_id: args.tarea_id,
      autor_id: args.autor_id,
      contenido: args.contenido,
      tipo: args.tipo ?? "comentario",
      created_at: new Date().toISOString(),
    });
  },
});

export const deleteComentario = mutation({
  args: { id: v.id("comentarios_tarea") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return { success: true };
  },
});
