// @ts-nocheck
import { query, mutation, action } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

// Pipeline steps in order
const PIPELINE_STEPS = [
  "import",
  "normalize",
  "categorize",
  "match",
  "validate",
  "alert",
  "approve",
] as const;

const estadoPipeline = v.union(
  v.literal("pending"),
  v.literal("import"),
  v.literal("normalize"),
  v.literal("categorize"),
  v.literal("match"),
  v.literal("validate"),
  v.literal("alert"),
  v.literal("approve"),
  v.literal("completed"),
  v.literal("failed"),
  v.literal("paused")
);

// ─── QUERIES ────────────────────────────────────────────────

/**
 * Get all pipeline runs for a client
 */
export const getPipelineRuns = query({
  args: {
    clienteId: v.id("clientes"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const runs = await ctx.db
      .query("pipeline_runs")
      .withIndex("by_cliente", (q: any) => q.eq("cliente_id", args.clienteId))
      .order("desc")
      .take(args.limit ?? 20);

    return runs;
  },
});

/**
 * Get a single pipeline run
 */
export const getPipelineRun = query({
  args: { runId: v.id("pipeline_runs") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.runId);
  },
});

/**
 * Get active pipeline runs (not completed/failed)
 */
export const getActivePipelineRuns = query({
  handler: async (ctx) => {
    const pending = await ctx.db
      .query("pipeline_runs")
      .withIndex("by_estado", (q: any) => q.eq("estado", "pending"))
      .collect();

    const activeStates = PIPELINE_STEPS.map((step) => step);
    const active: any[] = [...pending];

    for (const state of activeStates) {
      const runs = await ctx.db
        .query("pipeline_runs")
        .withIndex("by_estado", (q: any) => q.eq("estado", state))
        .collect();
      active.push(...runs);
    }

    // Get client names
    const clientIds = [...new Set(active.map((r) => r.cliente_id))];
    const clients: Record<string, any> = {};
    for (const cid of clientIds) {
      const client = await ctx.db.get(cid);
      if (client) clients[cid] = client;
    }

    return active.map((run) => ({
      ...run,
      cliente: clients[run.cliente_id] ?? null,
    }));
  },
});

/**
 * Get pipeline stats across all clients
 */
export const getPipelineStats = query({
  handler: async (ctx) => {
    const allRuns = await ctx.db.query("pipeline_runs").collect();

    const completed = allRuns.filter((r) => r.estado === "completed");
    const failed = allRuns.filter((r) => r.estado === "failed");
    const active = allRuns.filter(
      (r) =>
        r.estado !== "completed" && r.estado !== "failed" && r.estado !== "paused"
    );

    const totalTransactions = completed.reduce(
      (sum, r) => sum + (r.resultado?.transacciones_importadas ?? 0),
      0
    );
    const totalMatched = completed.reduce(
      (sum, r) => sum + (r.resultado?.transacciones_matched ?? 0),
      0
    );

    return {
      totalRuns: allRuns.length,
      completedRuns: completed.length,
      failedRuns: failed.length,
      activeRuns: active.length,
      totalTransactions,
      totalMatched,
      successRate:
        allRuns.length > 0
          ? Math.round((completed.length / allRuns.length) * 100)
          : 0,
    };
  },
});

// ─── MUTATIONS ──────────────────────────────────────────────

/**
 * Create a new pipeline run
 */
export const createPipelineRun = mutation({
  args: {
    clienteId: v.id("clientes"),
    periodo: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    return await ctx.db.insert("pipeline_runs", {
      cliente_id: args.clienteId,
      periodo: args.periodo,
      estado: "pending",
      paso_actual: 0,
      total_pasos: PIPELINE_STEPS.length,
      resultado: {
        transacciones_importadas: 0,
        transacciones_normalizadas: 0,
        transacciones_categorizadas: 0,
        transacciones_matched: 0,
        alertas_generadas: 0,
        errores: 0,
      },
      created_at: now,
      updated_at: now,
    });
  },
});

/**
 * Advance pipeline to next step
 */
export const advancePipeline = mutation({
  args: {
    runId: v.id("pipeline_runs"),
    stepResult: v.optional(v.object({
      transacciones_importadas: v.optional(v.number()),
      transacciones_normalizadas: v.optional(v.number()),
      transacciones_categorizadas: v.optional(v.number()),
      transacciones_matched: v.optional(v.number()),
      alertas_generadas: v.optional(v.number()),
      errores: v.optional(v.number()),
    })),
  },
  handler: async (ctx, args) => {
    const run = await ctx.db.get(args.runId);
    if (!run) throw new Error("Pipeline run not found");

    const currentIndex = PIPELINE_STEPS.indexOf(run.estado as any);
    const now = new Date().toISOString();

    // Merge step results
    const currentResult = run.resultado ?? {};
    const merged = { ...currentResult };
    if (args.stepResult) {
      for (const [key, val] of Object.entries(args.stepResult)) {
        if (val !== undefined) {
          (merged as any)[key] = ((merged as any)[key] ?? 0) + val;
        }
      }
    }

    if (currentIndex >= PIPELINE_STEPS.length - 1) {
      // Last step - mark as completed
      await ctx.db.patch(args.runId, {
        estado: "completed",
        paso_actual: PIPELINE_STEPS.length,
        resultado: merged,
        completed_at: now,
        updated_at: now,
      });
    } else {
      // Move to next step
      const nextStep = PIPELINE_STEPS[currentIndex + 1];
      await ctx.db.patch(args.runId, {
        estado: nextStep,
        paso_actual: currentIndex + 2,
        resultado: merged,
        updated_at: now,
      });
    }
  },
});

/**
 * Start a pipeline (move from pending to first step)
 */
export const startPipeline = mutation({
  args: { runId: v.id("pipeline_runs") },
  handler: async (ctx, args) => {
    const run = await ctx.db.get(args.runId);
    if (!run) throw new Error("Pipeline run not found");
    if (run.estado !== "pending") throw new Error("Pipeline already started");

    const now = new Date().toISOString();
    await ctx.db.patch(args.runId, {
      estado: "import",
      paso_actual: 1,
      started_at: now,
      updated_at: now,
    });
  },
});

/**
 * Pause a running pipeline
 */
export const pausePipeline = mutation({
  args: { runId: v.id("pipeline_runs") },
  handler: async (ctx, args) => {
    const run = await ctx.db.get(args.runId);
    if (!run) throw new Error("Pipeline run not found");

    const now = new Date().toISOString();
    await ctx.db.patch(args.runId, {
      estado: "paused",
      paused_at: now,
      updated_at: now,
    });
  },
});

/**
 * Resume a paused pipeline (back to last active step)
 */
export const resumePipeline = mutation({
  args: {
    runId: v.id("pipeline_runs"),
    resumeStep: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const run = await ctx.db.get(args.runId);
    if (!run) throw new Error("Pipeline run not found");
    if (run.estado !== "paused") throw new Error("Pipeline not paused");

    const step = args.resumeStep ?? PIPELINE_STEPS[run.paso_actual ?? 0];
    const now = new Date().toISOString();
    await ctx.db.patch(args.runId, {
      estado: step,
      paused_at: undefined,
      updated_at: now,
    });
  },
});

/**
 * Fail a pipeline with error
 */
export const failPipeline = mutation({
  args: {
    runId: v.id("pipeline_runs"),
    errorMessage: v.string(),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    await ctx.db.patch(args.runId, {
      estado: "failed",
      error_message: args.errorMessage,
      completed_at: now,
      updated_at: now,
    });
  },
});

/**
 * Run a full pipeline (simulates all steps)
 */
export const runFullPipeline = mutation({
  args: {
    clienteId: v.id("clientes"),
    periodo: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();

    // Get transaction counts for this client
    const transactions = await ctx.db
      .query("bancos_transacciones")
      .withIndex("by_cliente", (q: any) => q.eq("cliente_id", args.clienteId))
      .collect();

    const pendingTransactions = transactions.filter(
      (t) => !t.estado_conciliacion || t.estado_conciliacion === "pending"
    );

    // Get matching stats
    const conciliaciones = await ctx.db
      .query("conciliaciones")
      .withIndex("by_cliente", (q: any) => q.eq("cliente_id", args.clienteId))
      .filter((q: any) => q.eq(q.field("estado"), "matched"))
      .collect();

    const runId = await ctx.db.insert("pipeline_runs", {
      cliente_id: args.clienteId,
      periodo: args.periodo,
      estado: "completed",
      paso_actual: PIPELINE_STEPS.length,
      total_pasos: PIPELINE_STEPS.length,
      resultado: {
        transacciones_importadas: transactions.length,
        transacciones_normalizadas: transactions.length,
        transacciones_categorizadas: transactions.filter((t) => t.categoria).length,
        transacciones_matched: conciliaciones.length,
        alertas_generadas: 0,
        errores: 0,
      },
      started_at: now,
      completed_at: now,
      created_at: now,
      updated_at: now,
    });

    return { runId, totalTransactions: transactions.length };
  },
});
