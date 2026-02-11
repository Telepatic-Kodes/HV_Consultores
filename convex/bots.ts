// @ts-nocheck
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// ─── BOT DEFINICIONES QUERIES ──────────────────────────────

/**
 * List all bot definitions
 */
export const listBotDefiniciones = query({
  args: {
    activo: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let q = ctx.db.query("bot_definiciones");

    const results = await q.collect();

    if (args.activo !== undefined) {
      return results.filter((bot) => bot.activo === args.activo);
    }

    return results;
  },
});

/**
 * Get bot definition by ID
 */
export const getBotDefinicion = query({
  args: { id: v.id("bot_definiciones") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// ─── BOT JOBS QUERIES ──────────────────────────────────────

/**
 * List bot jobs with filters
 */
export const listJobs = query({
  args: {
    botId: v.optional(v.id("bot_definiciones")),
    clienteId: v.optional(v.id("clientes")),
    status: v.optional(
      v.union(
        v.literal("pendiente"),
        v.literal("ejecutando"),
        v.literal("completado"),
        v.literal("fallido"),
        v.literal("cancelado")
      )
    ),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let q = ctx.db.query("bot_jobs");

    if (args.botId) {
      q = q.withIndex("by_bot", (q: any) => q.eq("bot_id", args.botId!));
    } else if (args.status) {
      q = q.withIndex("by_status", (q: any) => q.eq("status", args.status!));
    } else if (args.clienteId) {
      q = q.withIndex("by_cliente", (q: any) => q.eq("cliente_id", args.clienteId!));
    }

    let results = await q.collect();

    // Apply additional filters
    if (args.botId && args.status) {
      results = results.filter((job) => job.status === args.status);
    }

    if (args.botId && args.clienteId) {
      results = results.filter((job) => job.cliente_id === args.clienteId);
    }

    // Sort by created_at descending
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
 * Get single bot job
 */
export const getJob = query({
  args: { id: v.id("bot_jobs") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

/**
 * Get active jobs (pendiente or ejecutando)
 */
export const getActiveJobs = query({
  args: {
    botId: v.optional(v.id("bot_definiciones")),
  },
  handler: async (ctx, args) => {
    let jobs = await ctx.db.query("bot_jobs").collect();

    jobs = jobs.filter(
      (job) => job.status === "pendiente" || job.status === "ejecutando"
    );

    if (args.botId) {
      jobs = jobs.filter((job) => job.bot_id === args.botId);
    }

    return jobs;
  },
});

/**
 * Get job execution steps (logs)
 */
export const getJobSteps = query({
  args: { jobId: v.id("bot_jobs") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("bot_logs")
      .withIndex("by_job", (q: any) => q.eq("job_id", args.jobId))
      .collect();
  },
});

/**
 * Get bot logs for a job
 */
export const getBotLogs = query({
  args: {
    jobId: v.id("bot_jobs"),
    nivel: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let logs = await ctx.db
      .query("bot_logs")
      .withIndex("by_job", (q: any) => q.eq("job_id", args.jobId))
      .collect();

    if (args.nivel) {
      logs = logs.filter((log) => log.nivel === args.nivel);
    }

    // Sort by timestamp
    logs.sort((a, b) => {
      const dateA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
      const dateB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
      return dateA - dateB;
    });

    return logs;
  },
});

/**
 * Get bot stats
 */
export const getBotStats = query({
  args: {
    botId: v.optional(v.id("bot_definiciones")),
    days: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const days = args.days || 30;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    const cutoffISO = cutoffDate.toISOString();

    let q = ctx.db.query("bot_jobs");

    if (args.botId) {
      q = q.withIndex("by_bot", (q: any) => q.eq("bot_id", args.botId!));
    }

    const jobs = await q.collect();

    const recentJobs = jobs.filter(
      (job) => job.created_at && job.created_at >= cutoffISO
    );

    const stats = {
      total: recentJobs.length,
      pendiente: recentJobs.filter((j) => j.status === "pendiente").length,
      ejecutando: recentJobs.filter((j) => j.status === "ejecutando").length,
      completado: recentJobs.filter((j) => j.status === "completado").length,
      fallido: recentJobs.filter((j) => j.status === "fallido").length,
      cancelado: recentJobs.filter((j) => j.status === "cancelado").length,
      tasaExito:
        recentJobs.length > 0
          ? Math.round(
              (recentJobs.filter((j) => j.status === "completado").length /
                recentJobs.length) *
                100
            )
          : 0,
    };

    return stats;
  },
});

// ─── BOT MUTATIONS ─────────────────────────────────────────

/**
 * Create bot job
 */
export const createJob = mutation({
  args: {
    bot_id: v.id("bot_definiciones"),
    cliente_id: v.optional(v.id("clientes")),
    config_override: v.optional(v.any()),
    triggered_by: v.optional(v.string()),
    triggered_by_user: v.optional(v.id("profiles")),
    scheduled_at: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();

    const jobId = await ctx.db.insert("bot_jobs", {
      bot_id: args.bot_id,
      cliente_id: args.cliente_id,
      status: "pendiente",
      config_override: args.config_override,
      triggered_by: args.triggered_by || "manual",
      triggered_by_user: args.triggered_by_user,
      scheduled_at: args.scheduled_at,
      max_retries: 3,
      retry_count: 0,
      created_at: now,
    });

    return jobId;
  },
});

/**
 * Update bot job status
 */
export const updateJobStatus = mutation({
  args: {
    id: v.id("bot_jobs"),
    status: v.union(
      v.literal("pendiente"),
      v.literal("ejecutando"),
      v.literal("completado"),
      v.literal("fallido"),
      v.literal("cancelado")
    ),
    error_message: v.optional(v.string()),
    resultado: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();

    const updates: any = {
      status: args.status,
    };

    if (args.status === "ejecutando") {
      updates.started_at = now;
    }

    if (args.status === "completado" || args.status === "fallido") {
      updates.completed_at = now;
    }

    if (args.error_message) {
      updates.error_message = args.error_message;
    }

    if (args.resultado) {
      updates.resultado = args.resultado;
    }

    await ctx.db.patch(args.id, updates);

    return args.id;
  },
});

/**
 * Add execution step (log entry)
 */
export const addExecutionStep = mutation({
  args: {
    job_id: v.id("bot_jobs"),
    paso: v.optional(v.string()),
    nivel: v.optional(v.string()),
    mensaje: v.string(),
    metadata: v.optional(v.any()),
    screenshot_url: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const logId = await ctx.db.insert("bot_logs", {
      job_id: args.job_id,
      paso: args.paso,
      nivel: args.nivel || "info",
      mensaje: args.mensaje,
      metadata: args.metadata,
      screenshot_url: args.screenshot_url,
      timestamp: new Date().toISOString(),
    });

    return logId;
  },
});

/**
 * Complete job successfully
 */
export const completeJob = mutation({
  args: {
    id: v.id("bot_jobs"),
    resultado: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      status: "completado",
      resultado: args.resultado,
      completed_at: new Date().toISOString(),
    });

    return args.id;
  },
});

/**
 * Fail job with error
 */
export const failJob = mutation({
  args: {
    id: v.id("bot_jobs"),
    error_message: v.string(),
    shouldRetry: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const job = await ctx.db.get(args.id);

    if (!job) {
      throw new Error("Job not found");
    }

    const retryCount = (job.retry_count || 0) + 1;
    const maxRetries = job.max_retries || 3;

    const shouldRetry = args.shouldRetry && retryCount < maxRetries;

    const updates: any = {
      error_message: args.error_message,
      retry_count: retryCount,
    };

    if (shouldRetry) {
      updates.status = "pendiente";
    } else {
      updates.status = "fallido";
      updates.completed_at = new Date().toISOString();
    }

    await ctx.db.patch(args.id, updates);

    return args.id;
  },
});

/**
 * Cancel job
 */
export const cancelJob = mutation({
  args: { id: v.id("bot_jobs") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      status: "cancelado",
      completed_at: new Date().toISOString(),
    });

    return { success: true };
  },
});
