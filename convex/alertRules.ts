// @ts-nocheck
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// ─── QUERIES ──────────────────────────────────────────────

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("alert_rules").order("desc").collect();
  },
});

export const get = query({
  args: { id: v.id("alert_rules") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getStats = query({
  args: {},
  handler: async (ctx) => {
    const rules = await ctx.db.query("alert_rules").collect();
    return {
      total: rules.length,
      enabled: rules.filter((r) => r.enabled).length,
      recentlyTriggered: rules.filter((r) => r.last_triggered).length,
    };
  },
});

// ─── MUTATIONS ────────────────────────────────────────────

export const create = mutation({
  args: {
    name: v.string(),
    enabled: v.boolean(),
    metric: v.string(),
    operator: v.string(),
    threshold: v.number(),
    duration: v.optional(v.number()),
    email: v.optional(v.array(v.string())),
    slack: v.optional(v.string()),
    webhook: v.optional(v.string()),
    inApp: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("alert_rules", {
      name: args.name,
      enabled: args.enabled,
      metric: args.metric,
      operator: args.operator,
      threshold: args.threshold,
      duration: args.duration,
      email: args.email,
      slack: args.slack,
      webhook: args.webhook,
      in_app: args.inApp,
      created_at: new Date().toISOString(),
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("alert_rules"),
    name: v.optional(v.string()),
    enabled: v.optional(v.boolean()),
    metric: v.optional(v.string()),
    operator: v.optional(v.string()),
    threshold: v.optional(v.number()),
    duration: v.optional(v.number()),
    email: v.optional(v.array(v.string())),
    slack: v.optional(v.string()),
    webhook: v.optional(v.string()),
    inApp: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, inApp, ...rest } = args;
    const patch: any = { ...rest, updated_at: new Date().toISOString() };
    if (inApp !== undefined) patch.in_app = inApp;
    // Remove undefined values
    for (const key of Object.keys(patch)) {
      if (patch[key] === undefined) delete patch[key];
    }
    await ctx.db.patch(id, patch);
  },
});

export const remove = mutation({
  args: { id: v.id("alert_rules") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const toggle = mutation({
  args: { id: v.id("alert_rules") },
  handler: async (ctx, args) => {
    const rule = await ctx.db.get(args.id);
    if (!rule) throw new Error("Alert rule not found");
    await ctx.db.patch(args.id, {
      enabled: !rule.enabled,
      updated_at: new Date().toISOString(),
    });
  },
});
