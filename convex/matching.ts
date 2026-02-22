// @ts-nocheck
import { query, mutation, action } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

// ─── STATUS ENUMS ───────────────────────────────────────────
const estadoConciliacion = v.union(
  v.literal("pending"),
  v.literal("matched"),
  v.literal("partial"),
  v.literal("unmatched"),
  v.literal("manual")
);

// ─── QUERIES ────────────────────────────────────────────────

/**
 * Get top-3 suggested matches for a transaction
 */
export const getSuggestedMatches = query({
  args: { transactionId: v.id("bancos_transacciones") },
  handler: async (ctx, args) => {
    const transaction = await ctx.db.get(args.transactionId);
    if (!transaction) return [];

    // Get documents for the same client in a similar date range
    const clienteId = transaction.cliente_id;
    if (!clienteId) return [];

    const allDocs = await ctx.db
      .query("documentos")
      .withIndex("by_cliente", (q: any) => q.eq("cliente_id", clienteId))
      .collect();

    // Get existing conciliaciones to avoid already-matched documents
    const existingMatches = await ctx.db
      .query("conciliaciones")
      .withIndex("by_cliente", (q: any) => q.eq("cliente_id", clienteId))
      .filter((q: any) => q.eq(q.field("estado"), "matched"))
      .collect();

    const matchedDocIds = new Set(
      existingMatches
        .filter((m) => m.documento_id)
        .map((m) => m.documento_id!.toString())
    );

    // Get learned patterns for score boosting
    const patterns = await ctx.db
      .query("patrones_conciliacion")
      .withIndex("by_cliente", (q: any) => q.eq("cliente_id", clienteId))
      .filter((q: any) => q.eq(q.field("activo"), true))
      .collect();

    const descripcion = (
      transaction.descripcion_normalizada || transaction.descripcion
    ).toUpperCase();
    const montoTx = Math.abs(transaction.monto);
    const fechaTx = new Date(transaction.fecha);

    // Score each document
    const candidates = allDocs
      .filter((doc) => !matchedDocIds.has(doc._id.toString()))
      .map((doc) => {
        let score = 0;
        const reasons: string[] = [];

        // 1. Amount match (40%)
        const montoDoc = doc.monto_total || 0;
        const diffMonto = Math.abs(montoTx - Math.abs(montoDoc));
        const diffPercent = montoDoc !== 0 ? diffMonto / Math.abs(montoDoc) : 1;

        if (diffMonto === 0) {
          score += 0.4;
          reasons.push("Monto exacto");
        } else if (diffPercent <= 0.01) {
          score += 0.35;
          reasons.push(`Monto similar (${(diffPercent * 100).toFixed(1)}%)`);
        } else if (diffPercent <= 0.05) {
          score += 0.2;
          reasons.push(`Monto cercano (${(diffPercent * 100).toFixed(1)}%)`);
        }

        // 2. Date match (30%)
        const fechaDoc = new Date(doc.fecha_emision);
        const diffDias = Math.abs(
          Math.floor(
            (fechaTx.getTime() - fechaDoc.getTime()) / (1000 * 60 * 60 * 24)
          )
        );

        if (diffDias === 0) {
          score += 0.3;
          reasons.push("Fecha exacta");
        } else if (diffDias <= 2) {
          score += 0.25;
          reasons.push(`Fecha cercana (${diffDias}d)`);
        } else if (diffDias <= 5) {
          score += 0.15;
          reasons.push(`Fecha tolerancia (${diffDias}d)`);
        }

        // 3. RUT match (20%)
        const rutPattern = /(\d{1,2}\.?\d{3}\.?\d{3}[-]?[0-9Kk])/;
        const rutMatch = descripcion.match(rutPattern);
        if (rutMatch) {
          const rutNorm = rutMatch[1].replace(/\./g, "").replace(/-/g, "").toUpperCase();
          const rutEmisor = (doc.rut_emisor || "").replace(/\./g, "").replace(/-/g, "").toUpperCase();
          if (rutNorm === rutEmisor) {
            score += 0.2;
            reasons.push("RUT coincide");
          }
        }

        // 4. Folio reference (10%)
        if (transaction.referencia && doc.folio) {
          const ref = transaction.referencia.toLowerCase();
          const folio = doc.folio.toLowerCase();
          if (ref.includes(folio) || folio.includes(ref)) {
            score += 0.1;
            reasons.push("Folio coincide");
          }
        }

        // 5. Name bonus (5%)
        const nombreEmisor = (doc.razon_social_emisor || "").toUpperCase();
        if (nombreEmisor && descripcion.includes(nombreEmisor.slice(0, 10))) {
          score += 0.05;
          reasons.push("Nombre coincide");
        }

        // 6. Pattern boost from learned patterns
        for (const pattern of patterns) {
          const patternDesc = pattern.descripcion_patron.toUpperCase();
          if (descripcion.includes(patternDesc)) {
            const boost = pattern.score_boost || 0.1;
            score += boost;
            reasons.push(`Patrón aprendido (+${(boost * 100).toFixed(0)}%)`);
            break;
          }
        }

        return {
          documento: doc,
          score: Math.min(score, 1.0),
          reasons,
          diferencia_monto: diffMonto,
          diferencia_dias: diffDias,
        };
      })
      .filter((c) => c.score > 0.3)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    return candidates;
  },
});

/**
 * Get unmatched transactions for a client in a period
 */
export const getUnmatchedTransactions = query({
  args: {
    clienteId: v.id("clientes"),
    periodo: v.optional(v.string()), // "YYYY-MM"
  },
  handler: async (ctx, args) => {
    let transactions = await ctx.db
      .query("bancos_transacciones")
      .withIndex("by_cliente", (q: any) => q.eq("cliente_id", args.clienteId))
      .collect();

    // Filter by estado_conciliacion (pending or unmatched)
    transactions = transactions.filter(
      (t) =>
        !t.estado_conciliacion ||
        t.estado_conciliacion === "pending" ||
        t.estado_conciliacion === "unmatched"
    );

    // Filter by period if specified
    if (args.periodo) {
      transactions = transactions.filter((t) =>
        t.fecha.startsWith(args.periodo!)
      );
    }

    // Sort newest first
    transactions.sort((a, b) => b.fecha.localeCompare(a.fecha));

    return transactions;
  },
});

/**
 * Get matching statistics for a client in a period
 */
export const getMatchingStats = query({
  args: {
    clienteId: v.id("clientes"),
    periodo: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let transactions = await ctx.db
      .query("bancos_transacciones")
      .withIndex("by_cliente", (q: any) => q.eq("cliente_id", args.clienteId))
      .collect();

    // Filter by period
    if (args.periodo) {
      transactions = transactions.filter((t) =>
        t.fecha.startsWith(args.periodo!)
      );
    }

    const total = transactions.length;
    const matched = transactions.filter(
      (t) => t.estado_conciliacion === "matched"
    ).length;
    const partial = transactions.filter(
      (t) => t.estado_conciliacion === "partial"
    ).length;
    const unmatched = transactions.filter(
      (t) => t.estado_conciliacion === "unmatched"
    ).length;
    const pending = transactions.filter(
      (t) => !t.estado_conciliacion || t.estado_conciliacion === "pending"
    ).length;

    const montoTotal = transactions.reduce(
      (sum, t) => sum + Math.abs(t.monto),
      0
    );
    const montoConciliado = transactions
      .filter((t) => t.estado_conciliacion === "matched")
      .reduce((sum, t) => sum + Math.abs(t.monto), 0);

    const tasaConciliacion =
      total > 0 ? Math.round((matched / total) * 100) : 0;

    return {
      total,
      matched,
      partial,
      unmatched,
      pending,
      montoTotal,
      montoConciliado,
      montoPendiente: montoTotal - montoConciliado,
      tasaConciliacion,
    };
  },
});

/**
 * Get learned patterns for a client
 */
export const getLearnedPatterns = query({
  args: { clienteId: v.id("clientes") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("patrones_conciliacion")
      .withIndex("by_cliente", (q: any) => q.eq("cliente_id", args.clienteId))
      .filter((q: any) => q.eq(q.field("activo"), true))
      .collect();
  },
});

/**
 * Get conciliaciones for a client, optionally filtered
 */
export const getConciliaciones = query({
  args: {
    clienteId: v.id("clientes"),
    estado: v.optional(estadoConciliacion),
    periodo: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let results = await ctx.db
      .query("conciliaciones")
      .withIndex("by_cliente", (q: any) => q.eq("cliente_id", args.clienteId))
      .collect();

    if (args.estado) {
      results = results.filter((r) => r.estado === args.estado);
    }

    if (args.periodo) {
      results = results.filter(
        (r) => r.periodo && r.periodo.startsWith(args.periodo!)
      );
    }

    results.sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""));

    if (args.limit) {
      results = results.slice(0, args.limit);
    }

    return results;
  },
});

/**
 * Get all clients with their reconciliation summary stats
 */
export const getClientsWithMatchingStats = query({
  args: {},
  handler: async (ctx) => {
    const clientes = await ctx.db
      .query("clientes")
      .filter((q: any) => q.eq(q.field("activo"), true))
      .collect();

    const stats = [];

    for (const cliente of clientes) {
      const transactions = await ctx.db
        .query("bancos_transacciones")
        .withIndex("by_cliente", (q: any) => q.eq("cliente_id", cliente._id))
        .collect();

      const total = transactions.length;

      const matched = transactions.filter(
        (t) => t.estado_conciliacion === "matched"
      ).length;
      const pending = transactions.filter(
        (t) =>
          !t.estado_conciliacion || t.estado_conciliacion === "pending"
      ).length;

      stats.push({
        cliente,
        totalTransacciones: total,
        matched,
        pending,
        tasaConciliacion: total > 0 ? Math.round((matched / total) * 100) : 0,
      });
    }

    return stats.sort((a, b) => b.pending - a.pending);
  },
});

// ─── MUTATIONS ──────────────────────────────────────────────

/**
 * Confirm a match between a transaction and a document.
 * Also learns the pattern for future matching.
 */
export const confirmMatch = mutation({
  args: {
    transactionId: v.id("bancos_transacciones"),
    documentId: v.id("documentos"),
    notas: v.optional(v.string()),
    userId: v.optional(v.id("profiles")),
  },
  handler: async (ctx, args) => {
    const transaction = await ctx.db.get(args.transactionId);
    if (!transaction) throw new Error("Transacción no encontrada");

    const document = await ctx.db.get(args.documentId);
    if (!document) throw new Error("Documento no encontrado");

    const clienteId = transaction.cliente_id;
    if (!clienteId) throw new Error("Transacción sin cliente");

    const now = new Date().toISOString();

    // Create or update conciliacion record
    const existing = await ctx.db
      .query("conciliaciones")
      .withIndex("by_transaccion", (q: any) =>
        q.eq("transaccion_id", args.transactionId)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        documento_id: args.documentId,
        estado: "matched",
        confianza: 1.0,
        confirmado_por: args.userId,
        confirmado_at: now,
        notas: args.notas,
        updated_at: now,
      });
    } else {
      await ctx.db.insert("conciliaciones", {
        transaccion_id: args.transactionId,
        documento_id: args.documentId,
        cliente_id: clienteId,
        confianza: 1.0,
        estado: "matched",
        confirmado_por: args.userId,
        confirmado_at: now,
        notas: args.notas,
        periodo: transaction.fecha.slice(0, 7),
        created_at: now,
        updated_at: now,
      });
    }

    // Update transaction status
    await ctx.db.patch(args.transactionId, {
      estado_conciliacion: "matched",
      reconciliado: true,
      documento_id: args.documentId,
    });

    // Learn pattern: extract description pattern and upsert
    const descripcion = (
      transaction.descripcion_normalizada || transaction.descripcion
    ).toUpperCase();

    // Extract first meaningful words as pattern (up to 20 chars)
    const words = descripcion.split(/\s+/).filter((w) => w.length > 2);
    const patternKey = words.slice(0, 3).join(" ");

    if (patternKey.length >= 5) {
      const existingPattern = await ctx.db
        .query("patrones_conciliacion")
        .withIndex("by_cliente", (q: any) =>
          q.eq("cliente_id", clienteId)
        )
        .filter((q: any) =>
          q.eq(q.field("descripcion_patron"), patternKey)
        )
        .first();

      if (existingPattern) {
        await ctx.db.patch(existingPattern._id, {
          veces_aplicado: (existingPattern.veces_aplicado || 0) + 1,
          ultima_aplicacion: now,
          updated_at: now,
        });
      } else {
        await ctx.db.insert("patrones_conciliacion", {
          cliente_id: clienteId,
          descripcion_patron: patternKey,
          rut_contraparte: document.rut_emisor,
          categoria: transaction.categoria,
          documento_tipo: document.tipo_documento,
          veces_aplicado: 1,
          ultima_aplicacion: now,
          score_boost: 0.1,
          activo: true,
          created_at: now,
          updated_at: now,
        });
      }
    }

    return { success: true };
  },
});

/**
 * Reject a suggested match
 */
export const rejectMatch = mutation({
  args: {
    transactionId: v.id("bancos_transacciones"),
    notas: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const transaction = await ctx.db.get(args.transactionId);
    if (!transaction) throw new Error("Transacción no encontrada");

    await ctx.db.patch(args.transactionId, {
      estado_conciliacion: "unmatched",
    });

    // Update any existing conciliacion record
    const existing = await ctx.db
      .query("conciliaciones")
      .withIndex("by_transaccion", (q: any) =>
        q.eq("transaccion_id", args.transactionId)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        estado: "unmatched",
        notas: args.notas,
        updated_at: new Date().toISOString(),
      });
    }

    return { success: true };
  },
});

/**
 * Run batch matching for all pending transactions of a client
 */
export const runBatchMatching = mutation({
  args: {
    clienteId: v.id("clientes"),
    periodo: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();

    // Get pending transactions
    let transactions = await ctx.db
      .query("bancos_transacciones")
      .withIndex("by_cliente", (q: any) => q.eq("cliente_id", args.clienteId))
      .collect();

    transactions = transactions.filter(
      (t) =>
        !t.estado_conciliacion ||
        t.estado_conciliacion === "pending"
    );

    if (args.periodo) {
      transactions = transactions.filter((t) =>
        t.fecha.startsWith(args.periodo!)
      );
    }

    // Get documents for matching
    const documents = await ctx.db
      .query("documentos")
      .withIndex("by_cliente", (q: any) => q.eq("cliente_id", args.clienteId))
      .collect();

    // Get existing matched document IDs
    const existingMatches = await ctx.db
      .query("conciliaciones")
      .withIndex("by_cliente", (q: any) => q.eq("cliente_id", args.clienteId))
      .filter((q: any) => q.eq(q.field("estado"), "matched"))
      .collect();

    const matchedDocIds = new Set(
      existingMatches
        .filter((m) => m.documento_id)
        .map((m) => m.documento_id!.toString())
    );

    // Get learned patterns
    const patterns = await ctx.db
      .query("patrones_conciliacion")
      .withIndex("by_cliente", (q: any) => q.eq("cliente_id", args.clienteId))
      .filter((q: any) => q.eq(q.field("activo"), true))
      .collect();

    let matched = 0;
    let partial = 0;
    let unmatched = 0;

    // Sort transactions by amount descending (bigger first)
    const sortedTx = [...transactions].sort(
      (a, b) => Math.abs(b.monto) - Math.abs(a.monto)
    );

    for (const tx of sortedTx) {
      const descripcion = (
        tx.descripcion_normalizada || tx.descripcion
      ).toUpperCase();
      const montoTx = Math.abs(tx.monto);
      const fechaTx = new Date(tx.fecha);

      let bestDoc = null;
      let bestScore = 0;
      let bestReasons: string[] = [];
      let bestDiffMonto = 0;
      let bestDiffDias = 0;

      for (const doc of documents) {
        if (matchedDocIds.has(doc._id.toString())) continue;

        let score = 0;
        const reasons: string[] = [];

        // Amount (40%)
        const montoDoc = Math.abs(doc.monto_total || 0);
        const diffMonto = Math.abs(montoTx - montoDoc);
        const diffPercent = montoDoc > 0 ? diffMonto / montoDoc : 1;

        if (diffMonto === 0) {
          score += 0.4;
          reasons.push("Monto exacto");
        } else if (diffPercent <= 0.01) {
          score += 0.35;
          reasons.push(`Monto ~${(diffPercent * 100).toFixed(1)}%`);
        } else if (diffPercent <= 0.05) {
          score += 0.2;
          reasons.push(`Monto cercano`);
        }

        // Date (30%)
        const fechaDoc = new Date(doc.fecha_emision);
        const diffDias = Math.abs(
          Math.floor(
            (fechaTx.getTime() - fechaDoc.getTime()) / (86400000)
          )
        );

        if (diffDias === 0) {
          score += 0.3;
          reasons.push("Fecha exacta");
        } else if (diffDias <= 2) {
          score += 0.25;
          reasons.push(`${diffDias}d`);
        } else if (diffDias <= 5) {
          score += 0.15;
          reasons.push(`${diffDias}d tolerancia`);
        }

        // RUT (20%)
        const rutPattern = /(\d{1,2}\.?\d{3}\.?\d{3}[-]?[0-9Kk])/;
        const rutMatch = descripcion.match(rutPattern);
        if (rutMatch) {
          const rutNorm = rutMatch[1].replace(/[.\-]/g, "").toUpperCase();
          const rutEmisor = (doc.rut_emisor || "").replace(/[.\-]/g, "").toUpperCase();
          if (rutNorm === rutEmisor) {
            score += 0.2;
            reasons.push("RUT");
          }
        }

        // Folio (10%)
        if (tx.referencia && doc.folio) {
          if (
            tx.referencia.includes(doc.folio) ||
            doc.folio.includes(tx.referencia)
          ) {
            score += 0.1;
            reasons.push("Folio");
          }
        }

        // Pattern boost
        for (const p of patterns) {
          if (descripcion.includes(p.descripcion_patron.toUpperCase())) {
            score += p.score_boost || 0.1;
            reasons.push("Patrón");
            break;
          }
        }

        score = Math.min(score, 1.0);

        if (score > bestScore) {
          bestDoc = doc;
          bestScore = score;
          bestReasons = reasons;
          bestDiffMonto = diffMonto;
          bestDiffDias = diffDias;
        }
      }

      // Determine status
      let estado: string;
      if (bestScore >= 0.7 && bestDoc) {
        estado = "matched";
        matchedDocIds.add(bestDoc._id.toString());
        matched++;
      } else if (bestScore >= 0.5 && bestDoc) {
        estado = "partial";
        partial++;
      } else {
        estado = "unmatched";
        unmatched++;
      }

      // Update transaction
      await ctx.db.patch(tx._id, {
        estado_conciliacion: estado as any,
        reconciliado: estado === "matched",
        documento_id: estado === "matched" && bestDoc ? bestDoc._id : undefined,
      });

      // Create conciliacion record
      await ctx.db.insert("conciliaciones", {
        transaccion_id: tx._id,
        documento_id: bestDoc?._id,
        cliente_id: args.clienteId,
        confianza: bestScore,
        estado: estado as any,
        diferencia_monto: bestDiffMonto,
        diferencia_dias: bestDiffDias,
        match_reasons: bestReasons,
        periodo: tx.fecha.slice(0, 7),
        created_at: now,
        updated_at: now,
      });
    }

    return {
      success: true,
      total: sortedTx.length,
      matched,
      partial,
      unmatched,
    };
  },
});

/**
 * Undo a confirmed match
 */
export const undoMatch = mutation({
  args: { conciliacionId: v.id("conciliaciones") },
  handler: async (ctx, args) => {
    const conciliacion = await ctx.db.get(args.conciliacionId);
    if (!conciliacion) throw new Error("Conciliación no encontrada");

    // Reset transaction
    await ctx.db.patch(conciliacion.transaccion_id, {
      estado_conciliacion: "pending",
      reconciliado: false,
      documento_id: undefined,
    });

    // Delete conciliacion record
    await ctx.db.delete(args.conciliacionId);

    return { success: true };
  },
});
