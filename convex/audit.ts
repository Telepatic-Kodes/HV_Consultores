import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// ─── QUERIES ───────────────────────────────────────────────

/**
 * List audit logs with filters
 */
export const listAuditLogs = query({
  args: {
    tabla: v.optional(v.string()),
    usuario_id: v.optional(v.id("profiles")),
    accion: v.optional(v.string()),
    fechaDesde: v.optional(v.string()),
    fechaHasta: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let q = ctx.db.query("audit_logs");

    if (args.tabla) {
      q = q.withIndex("by_tabla", (q) => q.eq("tabla", args.tabla!));
    } else if (args.usuario_id) {
      q = q.withIndex("by_usuario", (q) => q.eq("usuario_id", args.usuario_id!));
    }

    let results = await q.collect();

    // Apply additional filters
    if (args.tabla && args.usuario_id) {
      results = results.filter((log) => log.usuario_id === args.usuario_id);
    }

    if (args.accion) {
      results = results.filter((log) => log.accion === args.accion);
    }

    if (args.fechaDesde) {
      results = results.filter(
        (log) => log.created_at && log.created_at >= args.fechaDesde!
      );
    }

    if (args.fechaHasta) {
      results = results.filter(
        (log) => log.created_at && log.created_at <= args.fechaHasta!
      );
    }

    // Sort by created_at descending (newest first)
    results.sort((a, b) => {
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return dateB - dateA;
    });

    // Apply limit
    if (args.limit && args.limit > 0) {
      results = results.slice(0, args.limit);
    }

    return results;
  },
});

/**
 * Get single audit log
 */
export const getAuditLog = query({
  args: { id: v.id("audit_logs") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

/**
 * Get audit logs for specific record
 */
export const getRecordAuditLogs = query({
  args: {
    tabla: v.string(),
    registro_id: v.string(),
  },
  handler: async (ctx, args) => {
    const logs = await ctx.db
      .query("audit_logs")
      .withIndex("by_tabla", (q) => q.eq("tabla", args.tabla))
      .collect();

    const recordLogs = logs.filter((log) => log.registro_id === args.registro_id);

    // Sort by created_at ascending (chronological order)
    recordLogs.sort((a, b) => {
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return dateA - dateB;
    });

    return recordLogs;
  },
});

/**
 * Get audit stats
 */
export const getAuditStats = query({
  args: {
    fechaDesde: v.optional(v.string()),
    fechaHasta: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let logs = await ctx.db.query("audit_logs").collect();

    // Apply date filters
    if (args.fechaDesde) {
      logs = logs.filter(
        (log) => log.created_at && log.created_at >= args.fechaDesde!
      );
    }

    if (args.fechaHasta) {
      logs = logs.filter(
        (log) => log.created_at && log.created_at <= args.fechaHasta!
      );
    }

    // Calculate stats
    const stats = {
      total: logs.length,
      porAccion: {} as Record<string, number>,
      porTabla: {} as Record<string, number>,
      porUsuario: {} as Record<string, number>,
    };

    logs.forEach((log) => {
      // Count by accion
      if (log.accion) {
        stats.porAccion[log.accion] = (stats.porAccion[log.accion] || 0) + 1;
      }

      // Count by tabla
      if (log.tabla) {
        stats.porTabla[log.tabla] = (stats.porTabla[log.tabla] || 0) + 1;
      }

      // Count by usuario
      if (log.usuario_id) {
        const userId = log.usuario_id.toString();
        stats.porUsuario[userId] = (stats.porUsuario[userId] || 0) + 1;
      }
    });

    return stats;
  },
});

/**
 * Get user activity
 */
export const getUserActivity = query({
  args: {
    usuario_id: v.id("profiles"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let logs = await ctx.db
      .query("audit_logs")
      .withIndex("by_usuario", (q) => q.eq("usuario_id", args.usuario_id))
      .collect();

    // Sort by created_at descending
    logs.sort((a, b) => {
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return dateB - dateA;
    });

    // Apply limit
    if (args.limit && args.limit > 0) {
      logs = logs.slice(0, args.limit);
    }

    return logs;
  },
});

// ─── MUTATIONS ─────────────────────────────────────────────

/**
 * Create audit log
 */
export const createAuditLog = mutation({
  args: {
    accion: v.string(),
    tabla: v.optional(v.string()),
    registro_id: v.optional(v.string()),
    usuario_id: v.optional(v.id("profiles")),
    datos_anteriores: v.optional(v.any()),
    datos_nuevos: v.optional(v.any()),
    ip_address: v.optional(v.string()),
    user_agent: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const auditLogId = await ctx.db.insert("audit_logs", {
      accion: args.accion,
      tabla: args.tabla,
      registro_id: args.registro_id,
      usuario_id: args.usuario_id,
      datos_anteriores: args.datos_anteriores,
      datos_nuevos: args.datos_nuevos,
      ip_address: args.ip_address,
      user_agent: args.user_agent,
      created_at: new Date().toISOString(),
    });

    return auditLogId;
  },
});

/**
 * Bulk create audit logs
 */
export const bulkCreateAuditLogs = mutation({
  args: {
    logs: v.array(
      v.object({
        accion: v.string(),
        tabla: v.optional(v.string()),
        registro_id: v.optional(v.string()),
        usuario_id: v.optional(v.id("profiles")),
        datos_anteriores: v.optional(v.any()),
        datos_nuevos: v.optional(v.any()),
        ip_address: v.optional(v.string()),
        user_agent: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    const ids = [];

    for (const log of args.logs) {
      const id = await ctx.db.insert("audit_logs", {
        ...log,
        created_at: now,
      });
      ids.push(id);
    }

    return { success: true, count: ids.length, ids };
  },
});

/**
 * Delete old audit logs (cleanup)
 */
export const deleteOldAuditLogs = mutation({
  args: {
    olderThan: v.string(), // ISO date string
  },
  handler: async (ctx, args) => {
    const logs = await ctx.db.query("audit_logs").collect();

    const oldLogs = logs.filter(
      (log) => log.created_at && log.created_at < args.olderThan
    );

    for (const log of oldLogs) {
      await ctx.db.delete(log._id);
    }

    return { success: true, count: oldLogs.length };
  },
});
