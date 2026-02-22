// @ts-nocheck
import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";

// ─── Plan Limits ──────────────────────────────────────────
export const PLAN_LIMITS = {
  free: { maxClients: 1, maxBotRuns: 10 },
  pro: { maxClients: 20, maxBotRuns: 500 },
  enterprise: { maxClients: 999999, maxBotRuns: 999999 },
} as const;

// ─── QUERIES ──────────────────────────────────────────────

/**
 * Get the current user's subscription
 */
export const getMySubscription = query({
  args: {},
  handler: async (ctx) => {
    const subscription = await ctx.db
      .query("subscriptions")
      .first();

    if (!subscription) {
      // Return default free plan
      return {
        plan: "free" as const,
        status: "active" as const,
        maxClients: PLAN_LIMITS.free.maxClients,
        maxBotRuns: PLAN_LIMITS.free.maxBotRuns,
        cancelAtPeriodEnd: false,
        currentPeriodEnd: null,
        stripeCustomerId: null,
        stripeSubscriptionId: null,
      };
    }

    return subscription;
  },
});

/**
 * Get subscription by Stripe customer ID (used by webhooks)
 */
export const getByStripeCustomerId = query({
  args: { stripeCustomerId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("subscriptions")
      .withIndex("by_stripeCustomerId", (q: any) =>
        q.eq("stripeCustomerId", args.stripeCustomerId)
      )
      .first();
  },
});

/**
 * Check if user can add more clients (paywall check)
 */
export const canAddClient = query({
  args: {},
  handler: async (ctx) => {
    const subscription = await ctx.db
      .query("subscriptions")
      .first();

    // If subscription exists but status is not active/trialing, treat as free plan
    const isActive =
      !subscription ||
      subscription.status === "active" ||
      subscription.status === "trialing";

    const effectivePlan = isActive ? (subscription?.plan || "free") : "free";
    const limits = PLAN_LIMITS[effectivePlan as keyof typeof PLAN_LIMITS];
    const maxClients = limits.maxClients;

    // Count current clients belonging to this user's organization.
    // NOTE: The clientes table has no userId/createdBy field — clients are
    // shared across the accounting firm. We count all active clients as the
    // firm-wide total, which is correct for per-org billing.
    const clients = await ctx.db.query("clientes").collect();
    const activeClients = clients.filter((c) => c.activo !== false).length;

    if (activeClients >= maxClients) {
      return {
        allowed: false,
        reason: `Tu plan permite máximo ${maxClients} cliente(s). Actualiza tu plan para agregar más.`,
        currentCount: activeClients,
        limit: maxClients,
        plan: effectivePlan,
      };
    }

    return {
      allowed: true,
      currentCount: activeClients,
      limit: maxClients,
      plan: effectivePlan,
    };
  },
});

/**
 * Check if user can run bots (paywall check)
 */
export const canRunBot = query({
  args: {},
  handler: async (ctx) => {
    const subscription = await ctx.db
      .query("subscriptions")
      .first();

    // If subscription exists but status is not active/trialing, treat as free plan
    const isActive =
      !subscription ||
      subscription.status === "active" ||
      subscription.status === "trialing";

    const effectivePlan = isActive ? (subscription?.plan || "free") : "free";

    if (effectivePlan === "free") {
      return {
        allowed: false,
        reason: "Los bots RPA requieren plan Pro o Enterprise.",
        plan: effectivePlan,
      };
    }

    // Count bot jobs created this month to enforce usage limits
    const limits = PLAN_LIMITS[effectivePlan as keyof typeof PLAN_LIMITS];
    const now = new Date();
    const firstOfMonth = new Date(
      now.getFullYear(),
      now.getMonth(),
      1
    ).toISOString();
    const botJobs = await ctx.db.query("bot_jobs").collect();
    const monthlyBotRuns = botJobs.filter(
      (j) => j.created_at && j.created_at >= firstOfMonth
    ).length;

    if (monthlyBotRuns >= limits.maxBotRuns) {
      return {
        allowed: false,
        reason: `Has alcanzado el límite de ${limits.maxBotRuns} ejecuciones de bot este mes. Actualiza tu plan para más.`,
        plan: effectivePlan,
        currentUsage: monthlyBotRuns,
        limit: limits.maxBotRuns,
      };
    }

    return {
      allowed: true,
      plan: effectivePlan,
      currentUsage: monthlyBotRuns,
      limit: limits.maxBotRuns,
    };
  },
});

/**
 * Get usage stats for billing display
 */
export const getUsageStats = query({
  args: {},
  handler: async (ctx) => {
    const subscription = await ctx.db
      .query("subscriptions")
      .first();

    const plan = subscription?.plan || "free";
    const limits = PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS];

    // Count clients
    const clients = await ctx.db.query("clientes").collect();
    const activeClients = clients.filter((c) => c.activo !== false).length;

    // Count bot runs this month
    const now = new Date();
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const botJobs = await ctx.db.query("bot_jobs").collect();
    const monthlyBotRuns = botJobs.filter(
      (j) => j.created_at && j.created_at >= firstOfMonth
    ).length;

    return {
      plan,
      clients: { used: activeClients, limit: limits.maxClients },
      botRuns: { used: monthlyBotRuns, limit: limits.maxBotRuns },
    };
  },
});

/**
 * Check if a Stripe event has already been processed (idempotency check)
 */
export const isBillingEventProcessed = query({
  args: { stripeEventId: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("billing_events")
      .withIndex("by_stripeEventId", (q: any) =>
        q.eq("stripeEventId", args.stripeEventId)
      )
      .first();
    return !!existing;
  },
});

/**
 * Get subscription by userId (used by API routes for auth verification)
 */
export const getSubscriptionByUserId = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("subscriptions")
      .withIndex("by_userId", (q: any) => q.eq("userId", args.userId))
      .first();
  },
});

// ─── MUTATIONS ────────────────────────────────────────────

/**
 * Create or update subscription from Stripe webhook
 */
export const upsertSubscription = mutation({
  args: {
    userId: v.id("users"),
    stripeCustomerId: v.string(),
    stripeSubscriptionId: v.optional(v.string()),
    stripePriceId: v.optional(v.string()),
    plan: v.union(v.literal("free"), v.literal("pro"), v.literal("enterprise")),
    status: v.union(
      v.literal("active"),
      v.literal("canceled"),
      v.literal("past_due"),
      v.literal("trialing"),
      v.literal("incomplete"),
      v.literal("unpaid")
    ),
    currentPeriodStart: v.optional(v.string()),
    currentPeriodEnd: v.optional(v.string()),
    cancelAtPeriodEnd: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("subscriptions")
      .withIndex("by_userId", (q: any) => q.eq("userId", args.userId))
      .first();

    const limits = PLAN_LIMITS[args.plan];
    const now = new Date().toISOString();

    if (existing) {
      await ctx.db.patch(existing._id, {
        stripeCustomerId: args.stripeCustomerId,
        stripeSubscriptionId: args.stripeSubscriptionId,
        stripePriceId: args.stripePriceId,
        plan: args.plan,
        status: args.status,
        currentPeriodStart: args.currentPeriodStart,
        currentPeriodEnd: args.currentPeriodEnd,
        cancelAtPeriodEnd: args.cancelAtPeriodEnd,
        maxClients: limits.maxClients,
        maxBotRuns: limits.maxBotRuns,
        updated_at: now,
      });
      return existing._id;
    }

    return await ctx.db.insert("subscriptions", {
      userId: args.userId,
      stripeCustomerId: args.stripeCustomerId,
      stripeSubscriptionId: args.stripeSubscriptionId,
      stripePriceId: args.stripePriceId,
      plan: args.plan,
      status: args.status,
      currentPeriodStart: args.currentPeriodStart,
      currentPeriodEnd: args.currentPeriodEnd,
      cancelAtPeriodEnd: args.cancelAtPeriodEnd,
      maxClients: limits.maxClients,
      maxBotRuns: limits.maxBotRuns,
      created_at: now,
      updated_at: now,
    });
  },
});

/**
 * Store a Stripe billing event
 */
export const logBillingEvent = mutation({
  args: {
    subscriptionId: v.id("subscriptions"),
    stripeEventId: v.string(),
    type: v.string(),
    data: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    // Deduplicate events
    const existing = await ctx.db
      .query("billing_events")
      .withIndex("by_stripeEventId", (q: any) =>
        q.eq("stripeEventId", args.stripeEventId)
      )
      .first();

    if (existing) return existing._id;

    return await ctx.db.insert("billing_events", {
      subscriptionId: args.subscriptionId,
      stripeEventId: args.stripeEventId,
      type: args.type,
      data: args.data,
      created_at: new Date().toISOString(),
    });
  },
});

/**
 * Update subscription status (cancel, reactivate, etc.)
 */
export const updateSubscriptionStatus = mutation({
  args: {
    stripeSubscriptionId: v.string(),
    status: v.union(
      v.literal("active"),
      v.literal("canceled"),
      v.literal("past_due"),
      v.literal("trialing"),
      v.literal("incomplete"),
      v.literal("unpaid")
    ),
    cancelAtPeriodEnd: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_stripeSubscriptionId", (q: any) =>
        q.eq("stripeSubscriptionId", args.stripeSubscriptionId)
      )
      .first();

    if (!subscription) return null;

    await ctx.db.patch(subscription._id, {
      status: args.status,
      cancelAtPeriodEnd: args.cancelAtPeriodEnd,
      updated_at: new Date().toISOString(),
    });

    return subscription._id;
  },
});
