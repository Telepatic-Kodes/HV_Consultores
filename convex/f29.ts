// @ts-nocheck
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// ─── F29 CALCULOS QUERIES ──────────────────────────────────

/**
 * List F29 submissions with filters
 */
export const listSubmissions = query({
  args: {
    clienteId: v.optional(v.id("clientes")),
    periodo: v.optional(v.string()),
    status: v.optional(
      v.union(
        v.literal("borrador"),
        v.literal("calculado"),
        v.literal("validado"),
        v.literal("aprobado"),
        v.literal("enviado")
      )
    ),
  },
  handler: async (ctx, args) => {
    let q = ctx.db.query("f29_calculos");

    if (args.clienteId) {
      q = q.withIndex("by_cliente", (q: any) => q.eq("cliente_id", args.clienteId!));
    }

    let results = await q.collect();

    // Apply additional filters
    if (args.periodo) {
      results = results.filter((f29) => f29.periodo === args.periodo);
    }

    if (args.status) {
      results = results.filter((f29) => f29.status === args.status);
    }

    return results;
  },
});

/**
 * Get single F29 submission
 */
export const getSubmission = query({
  args: { id: v.id("f29_calculos") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

/**
 * Get F29 submissions by periodo
 */
export const getSubmissionsByPeriodo = query({
  args: { periodo: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("f29_calculos")
      .withIndex("by_periodo", (q: any) => q.eq("periodo", args.periodo))
      .collect();
  },
});

/**
 * Get F29 submissions by status
 */
export const getSubmissionsByStatus = query({
  args: {
    status: v.union(
      v.literal("borrador"),
      v.literal("calculado"),
      v.literal("validado"),
      v.literal("aprobado"),
      v.literal("enviado")
    ),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("f29_calculos")
      .withIndex("by_status", (q: any) => q.eq("status", args.status))
      .collect();
  },
});

/**
 * Get F29 stats
 */
export const getF29Stats = query({
  args: {
    clienteId: v.optional(v.id("clientes")),
  },
  handler: async (ctx, args) => {
    let q = ctx.db.query("f29_calculos");

    if (args.clienteId) {
      q = q.withIndex("by_cliente", (q: any) => q.eq("cliente_id", args.clienteId!));
    }

    const submissions = await q.collect();

    const stats = {
      total: submissions.length,
      borrador: submissions.filter((f) => f.status === "borrador").length,
      calculado: submissions.filter((f) => f.status === "calculado").length,
      validado: submissions.filter((f) => f.status === "validado").length,
      aprobado: submissions.filter((f) => f.status === "aprobado").length,
      enviado: submissions.filter((f) => f.status === "enviado").length,
      totalPagar: submissions.reduce(
        (sum, f) => sum + (f.total_a_pagar || 0),
        0
      ),
    };

    return stats;
  },
});

// ─── F29 CODIGOS QUERIES ───────────────────────────────────

/**
 * Get F29 codigos for a submission
 */
export const getF29Codigos = query({
  args: { f29CalculoId: v.id("f29_calculos") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("f29_codigos")
      .withIndex("by_calculo", (q: any) => q.eq("f29_calculo_id", args.f29CalculoId))
      .collect();
  },
});

// ─── F29 VALIDACIONES QUERIES ──────────────────────────────

/**
 * Get F29 validations for a submission
 */
export const getF29Validaciones = query({
  args: { f29CalculoId: v.id("f29_calculos") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("f29_validaciones")
      .withIndex("by_calculo", (q: any) => q.eq("f29_calculo_id", args.f29CalculoId))
      .collect();
  },
});

/**
 * Get validation errors/warnings
 */
export const getSubmissionValidations = query({
  args: {
    f29CalculoId: v.id("f29_calculos"),
    resultado: v.optional(
      v.union(v.literal("ok"), v.literal("warning"), v.literal("error"))
    ),
  },
  handler: async (ctx, args) => {
    let q = ctx.db
      .query("f29_validaciones")
      .withIndex("by_calculo", (q: any) => q.eq("f29_calculo_id", args.f29CalculoId));

    const results = await q.collect();

    // Filter by resultado if specified
    if (args.resultado) {
      return results.filter((v) => v.resultado === args.resultado);
    }

    return results;
  },
});

// ─── F29 MUTATIONS ─────────────────────────────────────────

/**
 * Create F29 submission
 */
export const createSubmission = mutation({
  args: {
    cliente_id: v.id("clientes"),
    periodo: v.string(),
    total_debito_fiscal: v.optional(v.number()),
    total_credito_fiscal: v.optional(v.number()),
    ppm_determinado: v.optional(v.number()),
    retenciones_honorarios: v.optional(v.number()),
    impuesto_unico: v.optional(v.number()),
    remanente_anterior: v.optional(v.number()),
    remanente_actualizado: v.optional(v.number()),
    total_a_pagar: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();

    const f29Id = await ctx.db.insert("f29_calculos", {
      cliente_id: args.cliente_id,
      periodo: args.periodo,
      total_debito_fiscal: args.total_debito_fiscal,
      total_credito_fiscal: args.total_credito_fiscal,
      ppm_determinado: args.ppm_determinado,
      retenciones_honorarios: args.retenciones_honorarios,
      impuesto_unico: args.impuesto_unico,
      remanente_anterior: args.remanente_anterior,
      remanente_actualizado: args.remanente_actualizado,
      total_a_pagar: args.total_a_pagar,
      status: "borrador",
      created_at: now,
      updated_at: now,
    });

    return f29Id;
  },
});

/**
 * Update F29 submission status
 */
export const updateSubmissionStatus = mutation({
  args: {
    id: v.id("f29_calculos"),
    status: v.union(
      v.literal("borrador"),
      v.literal("calculado"),
      v.literal("validado"),
      v.literal("aprobado"),
      v.literal("enviado")
    ),
    aprobado_por: v.optional(v.id("profiles")),
    folio_sii: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();

    const updates: any = {
      status: args.status,
      updated_at: now,
    };

    if (args.status === "aprobado" && args.aprobado_por) {
      updates.aprobado_por = args.aprobado_por;
      updates.aprobado_at = now;
    }

    if (args.status === "enviado") {
      updates.enviado_sii_at = now;
      if (args.folio_sii) {
        updates.folio_sii = args.folio_sii;
      }
    }

    await ctx.db.patch(args.id, updates);

    return args.id;
  },
});

/**
 * Update F29 calculation values
 */
export const updateSubmission = mutation({
  args: {
    id: v.id("f29_calculos"),
    total_debito_fiscal: v.optional(v.number()),
    total_credito_fiscal: v.optional(v.number()),
    ppm_determinado: v.optional(v.number()),
    retenciones_honorarios: v.optional(v.number()),
    impuesto_unico: v.optional(v.number()),
    remanente_anterior: v.optional(v.number()),
    remanente_actualizado: v.optional(v.number()),
    total_a_pagar: v.optional(v.number()),
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
 * Create validation for F29
 */
export const createValidation = mutation({
  args: {
    f29_calculo_id: v.id("f29_calculos"),
    codigo_validacion: v.string(),
    descripcion: v.string(),
    resultado: v.union(
      v.literal("ok"),
      v.literal("warning"),
      v.literal("error")
    ),
    valor_esperado: v.optional(v.number()),
    valor_calculado: v.optional(v.number()),
    diferencia: v.optional(v.number()),
    mensaje: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const validacionId = await ctx.db.insert("f29_validaciones", {
      f29_calculo_id: args.f29_calculo_id,
      codigo_validacion: args.codigo_validacion,
      descripcion: args.descripcion,
      resultado: args.resultado,
      valor_esperado: args.valor_esperado,
      valor_calculado: args.valor_calculado,
      diferencia: args.diferencia,
      mensaje: args.mensaje,
      created_at: new Date().toISOString(),
    });

    return validacionId;
  },
});

/**
 * Create F29 codigo entry
 */
export const createF29Codigo = mutation({
  args: {
    f29_calculo_id: v.id("f29_calculos"),
    codigo: v.number(),
    descripcion: v.optional(v.string()),
    monto_neto: v.optional(v.number()),
    monto_iva: v.optional(v.number()),
    cantidad_documentos: v.optional(v.number()),
    fuente: v.optional(v.string()),
    detalle: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const codigoId = await ctx.db.insert("f29_codigos", {
      f29_calculo_id: args.f29_calculo_id,
      codigo: args.codigo,
      descripcion: args.descripcion,
      monto_neto: args.monto_neto,
      monto_iva: args.monto_iva,
      cantidad_documentos: args.cantidad_documentos,
      fuente: args.fuente,
      detalle: args.detalle,
    });

    return codigoId;
  },
});

/**
 * Delete F29 submission
 */
export const deleteSubmission = mutation({
  args: { id: v.id("f29_calculos") },
  handler: async (ctx, args) => {
    // Delete related validaciones
    const validaciones = await ctx.db
      .query("f29_validaciones")
      .withIndex("by_calculo", (q: any) => q.eq("f29_calculo_id", args.id))
      .collect();

    for (const val of validaciones) {
      await ctx.db.delete(val._id);
    }

    // Delete related codigos
    const codigos = await ctx.db
      .query("f29_codigos")
      .withIndex("by_calculo", (q: any) => q.eq("f29_calculo_id", args.id))
      .collect();

    for (const codigo of codigos) {
      await ctx.db.delete(codigo._id);
    }

    // Delete the submission
    await ctx.db.delete(args.id);

    return { success: true };
  },
});
