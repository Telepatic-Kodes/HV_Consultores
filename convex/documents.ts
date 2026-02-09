import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// ─── QUERIES ───────────────────────────────────────────────

/**
 * List documents with optional filters
 */
export const listDocuments = query({
  args: {
    clienteId: v.optional(v.id("clientes")),
    periodo: v.optional(v.string()),
    status: v.optional(
      v.union(
        v.literal("pendiente"),
        v.literal("clasificado"),
        v.literal("revisado"),
        v.literal("aprobado"),
        v.literal("exportado")
      )
    ),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let q = ctx.db.query("documentos");

    if (args.clienteId) {
      q = q.withIndex("by_cliente", (q) => q.eq("cliente_id", args.clienteId!));
    }

    let results = await q.collect();

    // Apply additional filters
    if (args.periodo) {
      results = results.filter((doc) => doc.periodo === args.periodo);
    }

    if (args.status) {
      results = results.filter((doc) => doc.status === args.status);
    }

    // Apply limit
    if (args.limit && args.limit > 0) {
      results = results.slice(0, args.limit);
    }

    return results;
  },
});

/**
 * Get single document by ID
 */
export const getDocument = query({
  args: { id: v.id("documentos") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

/**
 * Get documents by status
 */
export const getDocumentsByStatus = query({
  args: {
    status: v.union(
      v.literal("pendiente"),
      v.literal("clasificado"),
      v.literal("revisado"),
      v.literal("aprobado"),
      v.literal("exportado")
    ),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("documentos")
      .withIndex("by_status", (q) => q.eq("status", args.status))
      .collect();
  },
});

/**
 * Search documents by folio or razon social
 */
export const searchDocuments = query({
  args: {
    searchTerm: v.string(),
    clienteId: v.optional(v.id("clientes")),
  },
  handler: async (ctx, args) => {
    let q = ctx.db.query("documentos");

    if (args.clienteId) {
      q = q.withIndex("by_cliente", (q) => q.eq("cliente_id", args.clienteId!));
    }

    const results = await q.collect();

    // Filter by search term (case-insensitive)
    const searchLower = args.searchTerm.toLowerCase();
    return results.filter(
      (doc) =>
        doc.folio.toLowerCase().includes(searchLower) ||
        (doc.razon_social_emisor &&
          doc.razon_social_emisor.toLowerCase().includes(searchLower)) ||
        (doc.glosa && doc.glosa.toLowerCase().includes(searchLower))
    );
  },
});

/**
 * Get document stats for dashboard
 */
export const getDocumentStats = query({
  args: {
    clienteId: v.optional(v.id("clientes")),
  },
  handler: async (ctx, args) => {
    let q = ctx.db.query("documentos");

    if (args.clienteId) {
      q = q.withIndex("by_cliente", (q) => q.eq("cliente_id", args.clienteId!));
    }

    const docs = await q.collect();

    // Calculate stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString();

    const todayDocs = docs.filter(
      (doc) => doc.created_at && doc.created_at >= todayISO
    );
    const clasificadosHoy = docs.filter(
      (doc) => doc.clasificado_at && doc.clasificado_at >= todayISO
    );

    const stats = {
      total: docs.length,
      pendiente: docs.filter((d) => d.status === "pendiente").length,
      clasificado: docs.filter((d) => d.status === "clasificado").length,
      revisado: docs.filter((d) => d.status === "revisado").length,
      aprobado: docs.filter((d) => d.status === "aprobado").length,
      exportado: docs.filter((d) => d.status === "exportado").length,
      todayCount: todayDocs.length,
      clasificadosHoy: clasificadosHoy.length,
    };

    return stats;
  },
});

/**
 * Get documents by period
 */
export const getDocumentsByPeriodo = query({
  args: {
    periodo: v.string(),
    clienteId: v.optional(v.id("clientes")),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("documentos")
      .withIndex("by_periodo", (q) => q.eq("periodo", args.periodo))
      .filter((q) =>
        args.clienteId ? q.eq(q.field("cliente_id"), args.clienteId) : true
      )
      .collect();
  },
});

// ─── MUTATIONS ─────────────────────────────────────────────

/**
 * Create new document
 */
export const createDocument = mutation({
  args: {
    cliente_id: v.id("clientes"),
    tipo_documento: v.string(),
    folio: v.string(),
    periodo: v.string(),
    fecha_emision: v.string(),
    rut_emisor: v.string(),
    razon_social_emisor: v.optional(v.string()),
    giro_emisor: v.optional(v.string()),
    glosa: v.optional(v.string()),
    es_compra: v.boolean(),
    es_activo_fijo: v.optional(v.boolean()),
    monto_neto: v.optional(v.number()),
    monto_iva: v.optional(v.number()),
    monto_total: v.optional(v.number()),
    cuenta_sugerida_id: v.optional(v.id("cuentas_contables")),
    confidence_score: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();

    const documentId = await ctx.db.insert("documentos", {
      cliente_id: args.cliente_id,
      tipo_documento: args.tipo_documento,
      folio: args.folio,
      periodo: args.periodo,
      fecha_emision: args.fecha_emision,
      rut_emisor: args.rut_emisor,
      razon_social_emisor: args.razon_social_emisor,
      giro_emisor: args.giro_emisor,
      glosa: args.glosa,
      es_compra: args.es_compra,
      es_activo_fijo: args.es_activo_fijo,
      monto_neto: args.monto_neto,
      monto_iva: args.monto_iva,
      monto_total: args.monto_total,
      cuenta_sugerida_id: args.cuenta_sugerida_id,
      confidence_score: args.confidence_score,
      status: "pendiente",
      created_at: now,
      updated_at: now,
    });

    return documentId;
  },
});

/**
 * Update document
 */
export const updateDocument = mutation({
  args: {
    id: v.id("documentos"),
    tipo_documento: v.optional(v.string()),
    folio: v.optional(v.string()),
    periodo: v.optional(v.string()),
    fecha_emision: v.optional(v.string()),
    rut_emisor: v.optional(v.string()),
    razon_social_emisor: v.optional(v.string()),
    giro_emisor: v.optional(v.string()),
    glosa: v.optional(v.string()),
    es_compra: v.optional(v.boolean()),
    es_activo_fijo: v.optional(v.boolean()),
    monto_neto: v.optional(v.number()),
    monto_iva: v.optional(v.number()),
    monto_total: v.optional(v.number()),
    cuenta_final_id: v.optional(v.id("cuentas_contables")),
    status: v.optional(
      v.union(
        v.literal("pendiente"),
        v.literal("clasificado"),
        v.literal("revisado"),
        v.literal("aprobado"),
        v.literal("exportado")
      )
    ),
    nubox_id: v.optional(v.string()),
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

/**
 * Classify document - set cuenta_final and mark as clasificado
 */
export const classifyDocument = mutation({
  args: {
    id: v.id("documentos"),
    cuenta_final_id: v.id("cuentas_contables"),
    confidence_score: v.optional(v.number()),
    clasificado_por: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      cuenta_final_id: args.cuenta_final_id,
      confidence_score: args.confidence_score,
      clasificado_at: new Date().toISOString(),
      clasificado_por: args.clasificado_por || "sistema",
      status: "clasificado",
      updated_at: new Date().toISOString(),
    });

    return args.id;
  },
});

/**
 * Delete document
 */
export const deleteDocument = mutation({
  args: { id: v.id("documentos") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return { success: true };
  },
});

/**
 * Bulk import documents
 */
export const bulkImportDocuments = mutation({
  args: {
    documents: v.array(
      v.object({
        cliente_id: v.id("clientes"),
        tipo_documento: v.string(),
        folio: v.string(),
        periodo: v.string(),
        fecha_emision: v.string(),
        rut_emisor: v.string(),
        razon_social_emisor: v.optional(v.string()),
        giro_emisor: v.optional(v.string()),
        glosa: v.optional(v.string()),
        es_compra: v.boolean(),
        es_activo_fijo: v.optional(v.boolean()),
        monto_neto: v.optional(v.number()),
        monto_iva: v.optional(v.number()),
        monto_total: v.optional(v.number()),
        cuenta_sugerida_id: v.optional(v.id("cuentas_contables")),
        confidence_score: v.optional(v.number()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    const ids = [];

    for (const doc of args.documents) {
      const id = await ctx.db.insert("documentos", {
        ...doc,
        status: "pendiente",
        created_at: now,
        updated_at: now,
      });
      ids.push(id);
    }

    return { success: true, count: ids.length, ids };
  },
});
