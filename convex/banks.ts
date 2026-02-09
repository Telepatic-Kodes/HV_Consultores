import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// ─── QUERIES ───────────────────────────────────────────────

/**
 * List bank transactions with filters
 */
export const listTransactions = query({
  args: {
    clienteId: v.optional(v.id("clientes")),
    banco: v.optional(v.string()),
    fechaDesde: v.optional(v.string()),
    fechaHasta: v.optional(v.string()),
    categoria: v.optional(v.string()),
    reconciliado: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let q = ctx.db.query("bancos_transacciones");

    if (args.clienteId) {
      q = q.withIndex("by_cliente", (q) => q.eq("cliente_id", args.clienteId!));
    } else if (args.banco) {
      q = q.withIndex("by_banco", (q) => q.eq("banco", args.banco!));
    }

    let results = await q.collect();

    // Apply additional filters
    if (args.clienteId && args.banco) {
      results = results.filter((t) => t.banco === args.banco);
    }

    if (args.fechaDesde) {
      results = results.filter((t) => t.fecha >= args.fechaDesde!);
    }

    if (args.fechaHasta) {
      results = results.filter((t) => t.fecha <= args.fechaHasta!);
    }

    if (args.categoria) {
      results = results.filter((t) => t.categoria === args.categoria);
    }

    if (args.reconciliado !== undefined) {
      results = results.filter((t) => t.reconciliado === args.reconciliado);
    }

    // Sort by fecha descending (newest first)
    results.sort((a, b) => {
      return b.fecha.localeCompare(a.fecha);
    });

    // Apply limit
    if (args.limit && args.limit > 0) {
      results = results.slice(0, args.limit);
    }

    return results;
  },
});

/**
 * Get single transaction
 */
export const getTransaction = query({
  args: { id: v.id("bancos_transacciones") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

/**
 * Get transactions by date range
 */
export const getTransactionsByDateRange = query({
  args: {
    fechaDesde: v.string(),
    fechaHasta: v.string(),
    clienteId: v.optional(v.id("clientes")),
    banco: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let transactions = await ctx.db.query("bancos_transacciones").collect();

    // Filter by date range
    transactions = transactions.filter(
      (t) => t.fecha >= args.fechaDesde && t.fecha <= args.fechaHasta
    );

    // Apply optional filters
    if (args.clienteId) {
      transactions = transactions.filter(
        (t) => t.cliente_id === args.clienteId
      );
    }

    if (args.banco) {
      transactions = transactions.filter((t) => t.banco === args.banco);
    }

    // Sort by fecha
    transactions.sort((a, b) => a.fecha.localeCompare(b.fecha));

    return transactions;
  },
});

/**
 * Get transaction stats
 */
export const getTransactionStats = query({
  args: {
    clienteId: v.optional(v.id("clientes")),
    banco: v.optional(v.string()),
    fechaDesde: v.optional(v.string()),
    fechaHasta: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let transactions = await ctx.db.query("bancos_transacciones").collect();

    // Apply filters
    if (args.clienteId) {
      transactions = transactions.filter(
        (t) => t.cliente_id === args.clienteId
      );
    }

    if (args.banco) {
      transactions = transactions.filter((t) => t.banco === args.banco);
    }

    if (args.fechaDesde) {
      transactions = transactions.filter((t) => t.fecha >= args.fechaDesde!);
    }

    if (args.fechaHasta) {
      transactions = transactions.filter((t) => t.fecha <= args.fechaHasta!);
    }

    // Calculate stats
    const ingresos = transactions
      .filter((t) => t.monto > 0)
      .reduce((sum, t) => sum + t.monto, 0);

    const egresos = transactions
      .filter((t) => t.monto < 0)
      .reduce((sum, t) => sum + Math.abs(t.monto), 0);

    const stats = {
      total: transactions.length,
      reconciliadas: transactions.filter((t) => t.reconciliado === true).length,
      pendientes: transactions.filter((t) => t.reconciliado === false || !t.reconciliado).length,
      ingresos,
      egresos,
      balance: ingresos - egresos,
      porCategoria: {} as Record<string, { count: number; total: number }>,
    };

    // Group by categoria
    transactions.forEach((t) => {
      const cat = t.categoria || "Sin categoría";
      if (!stats.porCategoria[cat]) {
        stats.porCategoria[cat] = { count: 0, total: 0 };
      }
      stats.porCategoria[cat].count++;
      stats.porCategoria[cat].total += t.monto;
    });

    return stats;
  },
});

/**
 * Get unreconciled transactions
 */
export const getUnreconciledTransactions = query({
  args: {
    clienteId: v.optional(v.id("clientes")),
    banco: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let transactions = await ctx.db.query("bancos_transacciones").collect();

    // Filter by reconciliado = false
    transactions = transactions.filter((t) => !t.reconciliado);

    // Apply optional filters
    if (args.clienteId) {
      transactions = transactions.filter(
        (t) => t.cliente_id === args.clienteId
      );
    }

    if (args.banco) {
      transactions = transactions.filter((t) => t.banco === args.banco);
    }

    // Sort by fecha descending
    transactions.sort((a, b) => b.fecha.localeCompare(a.fecha));

    return transactions;
  },
});

// ─── MUTATIONS ─────────────────────────────────────────────

/**
 * Create transaction
 */
export const createTransaction = mutation({
  args: {
    cliente_id: v.optional(v.id("clientes")),
    banco: v.string(),
    fecha: v.string(),
    descripcion: v.string(),
    monto: v.number(),
    categoria: v.optional(v.string()),
    reconciliado: v.optional(v.boolean()),
    documento_id: v.optional(v.id("documentos")),
  },
  handler: async (ctx, args) => {
    const transactionId = await ctx.db.insert("bancos_transacciones", {
      cliente_id: args.cliente_id,
      banco: args.banco,
      fecha: args.fecha,
      descripcion: args.descripcion,
      monto: args.monto,
      categoria: args.categoria,
      reconciliado: args.reconciliado ?? false,
      documento_id: args.documento_id,
      created_at: new Date().toISOString(),
    });

    return transactionId;
  },
});

/**
 * Update transaction
 */
export const updateTransaction = mutation({
  args: {
    id: v.id("bancos_transacciones"),
    banco: v.optional(v.string()),
    fecha: v.optional(v.string()),
    descripcion: v.optional(v.string()),
    monto: v.optional(v.number()),
    categoria: v.optional(v.string()),
    reconciliado: v.optional(v.boolean()),
    documento_id: v.optional(v.id("documentos")),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;

    await ctx.db.patch(id, updates);

    return id;
  },
});

/**
 * Categorize transaction
 */
export const categorizeTransaction = mutation({
  args: {
    id: v.id("bancos_transacciones"),
    categoria: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      categoria: args.categoria,
    });

    return args.id;
  },
});

/**
 * Reconcile transaction
 */
export const reconcileTransaction = mutation({
  args: {
    id: v.id("bancos_transacciones"),
    documento_id: v.optional(v.id("documentos")),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      reconciliado: true,
      documento_id: args.documento_id,
    });

    return args.id;
  },
});

/**
 * Bulk import transactions
 */
export const bulkImportTransactions = mutation({
  args: {
    transactions: v.array(
      v.object({
        cliente_id: v.optional(v.id("clientes")),
        banco: v.string(),
        fecha: v.string(),
        descripcion: v.string(),
        monto: v.number(),
        categoria: v.optional(v.string()),
        reconciliado: v.optional(v.boolean()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    const ids = [];

    for (const transaction of args.transactions) {
      const id = await ctx.db.insert("bancos_transacciones", {
        ...transaction,
        reconciliado: transaction.reconciliado ?? false,
        created_at: now,
      });
      ids.push(id);
    }

    return { success: true, count: ids.length, ids };
  },
});

/**
 * Delete transaction
 */
export const deleteTransaction = mutation({
  args: { id: v.id("bancos_transacciones") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return { success: true };
  },
});

/**
 * Bulk reconcile transactions
 */
export const bulkReconcileTransactions = mutation({
  args: {
    transactionIds: v.array(v.id("bancos_transacciones")),
  },
  handler: async (ctx, args) => {
    for (const id of args.transactionIds) {
      await ctx.db.patch(id, {
        reconciliado: true,
      });
    }

    return { success: true, count: args.transactionIds.length };
  },
});
