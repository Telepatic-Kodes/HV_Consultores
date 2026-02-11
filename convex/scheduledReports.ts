// @ts-nocheck
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

const reportType = v.union(
  v.literal("daily"),
  v.literal("weekly"),
  v.literal("monthly")
);

const reportFormat = v.union(
  v.literal("pdf"),
  v.literal("excel"),
  v.literal("html")
);

// ─── QUERIES ──────────────────────────────────────────────

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("scheduled_reports").order("desc").collect();
  },
});

export const get = query({
  args: { id: v.id("scheduled_reports") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getStats = query({
  args: {},
  handler: async (ctx) => {
    const reports = await ctx.db.query("scheduled_reports").collect();
    return {
      total: reports.length,
      enabled: reports.filter((r) => r.enabled).length,
      recentlySent: reports.filter((r) => r.last_sent).length,
    };
  },
});

// ─── MUTATIONS ────────────────────────────────────────────

export const create = mutation({
  args: {
    name: v.string(),
    enabled: v.boolean(),
    type: reportType,
    scheduleTime: v.string(),
    scheduleDayOfWeek: v.optional(v.number()),
    scheduleDayOfMonth: v.optional(v.number()),
    email: v.optional(v.array(v.string())),
    slack: v.optional(v.string()),
    webhook: v.optional(v.string()),
    dashboards: v.array(v.string()),
    format: reportFormat,
    includeCharts: v.boolean(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("scheduled_reports", {
      name: args.name,
      enabled: args.enabled,
      type: args.type,
      schedule_time: args.scheduleTime,
      schedule_day_of_week: args.scheduleDayOfWeek,
      schedule_day_of_month: args.scheduleDayOfMonth,
      email: args.email,
      slack: args.slack,
      webhook: args.webhook,
      dashboards: args.dashboards,
      format: args.format,
      include_charts: args.includeCharts,
      created_at: new Date().toISOString(),
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("scheduled_reports"),
    name: v.optional(v.string()),
    enabled: v.optional(v.boolean()),
    type: v.optional(reportType),
    scheduleTime: v.optional(v.string()),
    scheduleDayOfWeek: v.optional(v.number()),
    scheduleDayOfMonth: v.optional(v.number()),
    email: v.optional(v.array(v.string())),
    slack: v.optional(v.string()),
    webhook: v.optional(v.string()),
    dashboards: v.optional(v.array(v.string())),
    format: v.optional(reportFormat),
    includeCharts: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, scheduleTime, scheduleDayOfWeek, scheduleDayOfMonth, includeCharts, ...rest } = args;
    const patch: any = { ...rest, updated_at: new Date().toISOString() };
    if (scheduleTime !== undefined) patch.schedule_time = scheduleTime;
    if (scheduleDayOfWeek !== undefined) patch.schedule_day_of_week = scheduleDayOfWeek;
    if (scheduleDayOfMonth !== undefined) patch.schedule_day_of_month = scheduleDayOfMonth;
    if (includeCharts !== undefined) patch.include_charts = includeCharts;
    for (const key of Object.keys(patch)) {
      if (patch[key] === undefined) delete patch[key];
    }
    await ctx.db.patch(id, patch);
  },
});

export const remove = mutation({
  args: { id: v.id("scheduled_reports") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const toggle = mutation({
  args: { id: v.id("scheduled_reports") },
  handler: async (ctx, args) => {
    const report = await ctx.db.get(args.id);
    if (!report) throw new Error("Scheduled report not found");
    await ctx.db.patch(args.id, {
      enabled: !report.enabled,
      updated_at: new Date().toISOString(),
    });
  },
});

export const markReportSent = mutation({
  args: { id: v.id("scheduled_reports") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      last_sent: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  },
});
