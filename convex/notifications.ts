import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// ─── QUERIES ───────────────────────────────────────────────

/**
 * List notifications for a user
 */
export const listNotifications = query({
  args: {
    usuario_id: v.id("profiles"),
    leida: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let q = ctx.db
      .query("notificaciones")
      .withIndex("by_usuario", (q) => q.eq("usuario_id", args.usuario_id));

    let results = await q.collect();

    // Filter by leida status
    if (args.leida !== undefined) {
      results = results.filter((n) => n.leida === args.leida);
    }

    // Sort by created_at descending (newest first)
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
 * Get unread notifications count
 */
export const getUnreadCount = query({
  args: { usuario_id: v.id("profiles") },
  handler: async (ctx, args) => {
    const notifications = await ctx.db
      .query("notificaciones")
      .withIndex("by_usuario", (q) => q.eq("usuario_id", args.usuario_id))
      .collect();

    const unreadCount = notifications.filter((n) => n.leida === false).length;

    return { count: unreadCount };
  },
});

/**
 * Get single notification
 */
export const getNotification = query({
  args: { id: v.id("notificaciones") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

/**
 * Get notifications by type
 */
export const getNotificationsByType = query({
  args: {
    usuario_id: v.id("profiles"),
    tipo: v.string(),
  },
  handler: async (ctx, args) => {
    const notifications = await ctx.db
      .query("notificaciones")
      .withIndex("by_usuario", (q) => q.eq("usuario_id", args.usuario_id))
      .collect();

    return notifications.filter((n) => n.tipo === args.tipo);
  },
});

// ─── MUTATIONS ─────────────────────────────────────────────

/**
 * Create notification
 */
export const createNotification = mutation({
  args: {
    usuario_id: v.id("profiles"),
    tipo: v.string(),
    titulo: v.string(),
    mensaje: v.string(),
    link: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const notificationId = await ctx.db.insert("notificaciones", {
      usuario_id: args.usuario_id,
      tipo: args.tipo,
      titulo: args.titulo,
      mensaje: args.mensaje,
      link: args.link,
      leida: false,
      created_at: new Date().toISOString(),
    });

    return notificationId;
  },
});

/**
 * Mark notification as read
 */
export const markAsRead = mutation({
  args: { id: v.id("notificaciones") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      leida: true,
    });

    return { success: true };
  },
});

/**
 * Mark all notifications as read for a user
 */
export const markAllAsRead = mutation({
  args: { usuario_id: v.id("profiles") },
  handler: async (ctx, args) => {
    const notifications = await ctx.db
      .query("notificaciones")
      .withIndex("by_usuario", (q) => q.eq("usuario_id", args.usuario_id))
      .collect();

    const unread = notifications.filter((n) => n.leida === false);

    for (const notification of unread) {
      await ctx.db.patch(notification._id, {
        leida: true,
      });
    }

    return { success: true, count: unread.length };
  },
});

/**
 * Delete notification
 */
export const deleteNotification = mutation({
  args: { id: v.id("notificaciones") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return { success: true };
  },
});

/**
 * Delete all read notifications for a user
 */
export const deleteAllRead = mutation({
  args: { usuario_id: v.id("profiles") },
  handler: async (ctx, args) => {
    const notifications = await ctx.db
      .query("notificaciones")
      .withIndex("by_usuario", (q) => q.eq("usuario_id", args.usuario_id))
      .collect();

    const read = notifications.filter((n) => n.leida === true);

    for (const notification of read) {
      await ctx.db.delete(notification._id);
    }

    return { success: true, count: read.length };
  },
});

/**
 * Bulk create notifications (e.g., for multiple users)
 */
export const bulkCreateNotifications = mutation({
  args: {
    notifications: v.array(
      v.object({
        usuario_id: v.id("profiles"),
        tipo: v.string(),
        titulo: v.string(),
        mensaje: v.string(),
        link: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    const ids = [];

    for (const notif of args.notifications) {
      const id = await ctx.db.insert("notificaciones", {
        ...notif,
        leida: false,
        created_at: now,
      });
      ids.push(id);
    }

    return { success: true, count: ids.length, ids };
  },
});
