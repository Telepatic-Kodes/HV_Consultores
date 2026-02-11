// @ts-nocheck
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

const tipoAlerta = v.union(
  v.literal("monto_inusual"),
  v.literal("proveedor_nuevo"),
  v.literal("posible_duplicado"),
  v.literal("patron_diferente"),
  v.literal("conciliacion_fallida")
);

const severidadAlerta = v.union(
  v.literal("alta"),
  v.literal("media"),
  v.literal("baja")
);

const estadoAlerta = v.union(
  v.literal("abierta"),
  v.literal("revisada"),
  v.literal("descartada"),
  v.literal("resuelta")
);

// ─── QUERIES ────────────────────────────────────────────────

/**
 * Get alerts for a client, optionally filtered
 */
export const getAlerts = query({
  args: {
    clienteId: v.optional(v.id("clientes")),
    estado: v.optional(estadoAlerta),
    severidad: v.optional(severidadAlerta),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let alerts;

    if (args.clienteId) {
      alerts = await ctx.db
        .query("alertas_anomalias")
        .withIndex("by_cliente", (q: any) =>
          q.eq("cliente_id", args.clienteId)
        )
        .order("desc")
        .collect();
    } else if (args.estado) {
      alerts = await ctx.db
        .query("alertas_anomalias")
        .withIndex("by_estado", (q: any) => q.eq("estado", args.estado))
        .order("desc")
        .collect();
    } else {
      alerts = await ctx.db
        .query("alertas_anomalias")
        .order("desc")
        .collect();
    }

    // Apply additional filters in memory
    if (args.clienteId && args.estado) {
      alerts = alerts.filter((a) => a.estado === args.estado);
    }
    if (args.severidad) {
      alerts = alerts.filter((a) => a.severidad === args.severidad);
    }

    if (args.limit) {
      alerts = alerts.slice(0, args.limit);
    }

    // Enrich with client info
    const clientIds = [...new Set(alerts.map((a) => a.cliente_id))];
    const clients: Record<string, any> = {};
    for (const cid of clientIds) {
      const client = await ctx.db.get(cid);
      if (client) clients[cid.toString()] = client;
    }

    return alerts.map((alert) => ({
      ...alert,
      cliente: clients[alert.cliente_id.toString()] ?? null,
    }));
  },
});

/**
 * Get alert counts by severity
 */
export const getAlertStats = query({
  args: { clienteId: v.optional(v.id("clientes")) },
  handler: async (ctx, args) => {
    let alerts;
    if (args.clienteId) {
      alerts = await ctx.db
        .query("alertas_anomalias")
        .withIndex("by_cliente", (q: any) =>
          q.eq("cliente_id", args.clienteId)
        )
        .collect();
    } else {
      alerts = await ctx.db.query("alertas_anomalias").collect();
    }

    const open = alerts.filter((a) => a.estado === "abierta");

    return {
      total: alerts.length,
      abiertas: open.length,
      alta: open.filter((a) => a.severidad === "alta").length,
      media: open.filter((a) => a.severidad === "media").length,
      baja: open.filter((a) => a.severidad === "baja").length,
      resueltas: alerts.filter((a) => a.estado === "resuelta").length,
      descartadas: alerts.filter((a) => a.estado === "descartada").length,
    };
  },
});

// ─── MUTATIONS ──────────────────────────────────────────────

/**
 * Create a new anomaly alert
 */
export const createAlert = mutation({
  args: {
    clienteId: v.id("clientes"),
    tipo: tipoAlerta,
    severidad: severidadAlerta,
    titulo: v.string(),
    descripcion: v.string(),
    transaccionId: v.optional(v.id("bancos_transacciones")),
    documentoId: v.optional(v.id("documentos")),
    montoReferencia: v.optional(v.number()),
    montoDetectado: v.optional(v.number()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("alertas_anomalias", {
      cliente_id: args.clienteId,
      tipo: args.tipo,
      severidad: args.severidad,
      titulo: args.titulo,
      descripcion: args.descripcion,
      transaccion_id: args.transaccionId,
      documento_id: args.documentoId,
      monto_referencia: args.montoReferencia,
      monto_detectado: args.montoDetectado,
      metadata: args.metadata,
      estado: "abierta",
      created_at: new Date().toISOString(),
    });
  },
});

/**
 * Resolve an alert
 */
export const resolveAlert = mutation({
  args: {
    alertId: v.id("alertas_anomalias"),
    notas: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.alertId, {
      estado: "resuelta",
      notas_resolucion: args.notas,
      resuelta_at: new Date().toISOString(),
    });
  },
});

/**
 * Dismiss an alert
 */
export const dismissAlert = mutation({
  args: {
    alertId: v.id("alertas_anomalias"),
    notas: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.alertId, {
      estado: "descartada",
      notas_resolucion: args.notas,
      resuelta_at: new Date().toISOString(),
    });
  },
});

/**
 * Mark alert as reviewed
 */
export const reviewAlert = mutation({
  args: { alertId: v.id("alertas_anomalias") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.alertId, {
      estado: "revisada",
    });
  },
});

/**
 * Run anomaly detection on a client's transactions
 */
export const detectAnomalies = mutation({
  args: {
    clienteId: v.id("clientes"),
    periodo: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const transactions = await ctx.db
      .query("bancos_transacciones")
      .withIndex("by_cliente", (q: any) => q.eq("cliente_id", args.clienteId))
      .collect();

    let alertsCreated = 0;

    // Group by RUT/provider description for stats
    const providerStats: Map<string, { count: number; totalMonto: number; montos: number[] }> = new Map();
    for (const t of transactions) {
      const key = t.descripcion_normalizada ?? t.descripcion;
      const existing = providerStats.get(key) ?? { count: 0, totalMonto: 0, montos: [] };
      existing.count++;
      existing.totalMonto += Math.abs(t.monto);
      existing.montos.push(Math.abs(t.monto));
      providerStats.set(key, existing);
    }

    // Check each transaction
    for (const t of transactions) {
      const key = t.descripcion_normalizada ?? t.descripcion;
      const stats = providerStats.get(key);
      if (!stats || stats.count < 2) continue;

      const avgMonto = stats.totalMonto / stats.count;
      const currentMonto = Math.abs(t.monto);

      // Rule 1: Amount > 3x average for that provider
      if (currentMonto > avgMonto * 3 && stats.count >= 3) {
        // Check if we already have this alert
        const existing = await ctx.db
          .query("alertas_anomalias")
          .withIndex("by_cliente", (q: any) =>
            q.eq("cliente_id", args.clienteId)
          )
          .filter((q: any) =>
            q.and(
              q.eq(q.field("tipo"), "monto_inusual"),
              q.eq(q.field("transaccion_id"), t._id)
            )
          )
          .first();

        if (!existing) {
          await ctx.db.insert("alertas_anomalias", {
            cliente_id: args.clienteId,
            tipo: "monto_inusual",
            severidad: currentMonto > avgMonto * 5 ? "alta" : "media",
            titulo: `Monto inusual: ${key}`,
            descripcion: `Transacción de $${currentMonto.toLocaleString('es-CL')} supera ${Math.round(currentMonto / avgMonto)}x el promedio ($${Math.round(avgMonto).toLocaleString('es-CL')})`,
            transaccion_id: t._id,
            monto_referencia: avgMonto,
            monto_detectado: currentMonto,
            estado: "abierta",
            created_at: new Date().toISOString(),
          });
          alertsCreated++;
        }
      }
    }

    // Rule 2: Possible duplicates (same amount ±3 days)
    const sortedByDate = [...transactions].sort(
      (a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
    );

    for (let i = 0; i < sortedByDate.length; i++) {
      for (let j = i + 1; j < sortedByDate.length; j++) {
        const a = sortedByDate[i];
        const b = sortedByDate[j];

        const daysDiff = Math.abs(
          (new Date(b.fecha).getTime() - new Date(a.fecha).getTime()) /
            (1000 * 60 * 60 * 24)
        );
        if (daysDiff > 3) break;

        if (
          Math.abs(a.monto) === Math.abs(b.monto) &&
          a.descripcion === b.descripcion &&
          a._id !== b._id
        ) {
          const existing = await ctx.db
            .query("alertas_anomalias")
            .withIndex("by_cliente", (q: any) =>
              q.eq("cliente_id", args.clienteId)
            )
            .filter((q: any) =>
              q.and(
                q.eq(q.field("tipo"), "posible_duplicado"),
                q.eq(q.field("transaccion_id"), b._id)
              )
            )
            .first();

          if (!existing) {
            await ctx.db.insert("alertas_anomalias", {
              cliente_id: args.clienteId,
              tipo: "posible_duplicado",
              severidad: "media",
              titulo: `Posible duplicado: ${a.descripcion}`,
              descripcion: `Dos transacciones de $${Math.abs(a.monto).toLocaleString('es-CL')} con ${daysDiff} día(s) de diferencia`,
              transaccion_id: b._id,
              monto_referencia: Math.abs(a.monto),
              monto_detectado: Math.abs(b.monto),
              metadata: { transaccion_original_id: a._id },
              estado: "abierta",
              created_at: new Date().toISOString(),
            });
            alertsCreated++;
          }
        }
      }
    }

    return { alertsCreated, transactionsAnalyzed: transactions.length };
  },
});
