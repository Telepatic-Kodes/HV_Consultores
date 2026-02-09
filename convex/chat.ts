import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// ─── CHAT SESIONES QUERIES ─────────────────────────────────

/**
 * List chat sessions for a user
 */
export const listChatSesiones = query({
  args: {
    usuario_id: v.id("profiles"),
    activa: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let sessions = await ctx.db
      .query("chat_sesiones")
      .withIndex("by_usuario", (q) => q.eq("usuario_id", args.usuario_id))
      .collect();

    // Filter by activa status
    if (args.activa !== undefined) {
      sessions = sessions.filter((s) => s.activa === args.activa);
    }

    // Sort by updated_at descending (most recent first)
    sessions.sort((a, b) => {
      const dateA = a.updated_at ? new Date(a.updated_at).getTime() : 0;
      const dateB = b.updated_at ? new Date(b.updated_at).getTime() : 0;
      return dateB - dateA;
    });

    return sessions;
  },
});

/**
 * Get single chat session
 */
export const getChatSesion = query({
  args: { id: v.id("chat_sesiones") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// ─── CHAT MENSAJES QUERIES ─────────────────────────────────

/**
 * Get chat messages for a session
 */
export const getChatMensajes = query({
  args: {
    sesion_id: v.id("chat_sesiones"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let messages = await ctx.db
      .query("chat_mensajes")
      .withIndex("by_sesion", (q) => q.eq("sesion_id", args.sesion_id))
      .collect();

    // Sort by created_at ascending (chronological order)
    messages.sort((a, b) => {
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return dateA - dateB;
    });

    // Apply limit if specified (return last N messages)
    if (args.limit && args.limit > 0) {
      messages = messages.slice(-args.limit);
    }

    return messages;
  },
});

/**
 * List messages (alias for compatibility)
 */
export const listMessages = query({
  args: {
    usuario_id: v.optional(v.id("profiles")),
    sesion_id: v.optional(v.id("chat_sesiones")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    if (args.sesion_id) {
      // Get messages for specific session
      let messages = await ctx.db
        .query("chat_mensajes")
        .withIndex("by_sesion", (q) => q.eq("sesion_id", args.sesion_id!))
        .collect();

      // Sort chronologically
      messages.sort((a, b) => {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return dateA - dateB;
      });

      if (args.limit && args.limit > 0) {
        messages = messages.slice(-args.limit);
      }

      return messages;
    }

    if (args.usuario_id) {
      // Get all sessions for user, then get messages
      const sessions = await ctx.db
        .query("chat_sesiones")
        .withIndex("by_usuario", (q) => q.eq("usuario_id", args.usuario_id!))
        .collect();

      const sessionIds = sessions.map((s) => s._id);

      const allMessages = await ctx.db.query("chat_mensajes").collect();

      let messages = allMessages.filter((m) => sessionIds.includes(m.sesion_id));

      // Sort chronologically
      messages.sort((a, b) => {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return dateB - dateA; // Most recent first
      });

      if (args.limit && args.limit > 0) {
        messages = messages.slice(0, args.limit);
      }

      return messages;
    }

    return [];
  },
});

/**
 * Search messages by content
 */
export const searchMessages = query({
  args: {
    usuario_id: v.id("profiles"),
    searchTerm: v.string(),
  },
  handler: async (ctx, args) => {
    // Get user's sessions
    const sessions = await ctx.db
      .query("chat_sesiones")
      .withIndex("by_usuario", (q) => q.eq("usuario_id", args.usuario_id))
      .collect();

    const sessionIds = sessions.map((s) => s._id);

    // Get all messages
    const allMessages = await ctx.db.query("chat_mensajes").collect();

    // Filter by session and search term
    const searchLower = args.searchTerm.toLowerCase();
    const messages = allMessages
      .filter((m) => sessionIds.includes(m.sesion_id))
      .filter((m) => m.contenido.toLowerCase().includes(searchLower));

    // Sort by relevance (most recent first)
    messages.sort((a, b) => {
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return dateB - dateA;
    });

    return messages;
  },
});

// ─── CHAT MUTATIONS ────────────────────────────────────────

/**
 * Create chat session
 */
export const createChatSesion = mutation({
  args: {
    usuario_id: v.id("profiles"),
    titulo: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();

    const sessionId = await ctx.db.insert("chat_sesiones", {
      usuario_id: args.usuario_id,
      titulo: args.titulo || "Nueva conversación",
      activa: true,
      created_at: now,
      updated_at: now,
    });

    return sessionId;
  },
});

/**
 * Send chat message
 */
export const sendMessage = mutation({
  args: {
    sesion_id: v.id("chat_sesiones"),
    rol: v.string(), // "user" or "assistant"
    contenido: v.string(),
    fuentes: v.optional(v.any()),
    modelo_usado: v.optional(v.string()),
    tokens_input: v.optional(v.number()),
    tokens_output: v.optional(v.number()),
    latencia_ms: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();

    // Create message
    const messageId = await ctx.db.insert("chat_mensajes", {
      sesion_id: args.sesion_id,
      rol: args.rol,
      contenido: args.contenido,
      fuentes: args.fuentes,
      modelo_usado: args.modelo_usado,
      tokens_input: args.tokens_input,
      tokens_output: args.tokens_output,
      latencia_ms: args.latencia_ms,
      created_at: now,
    });

    // Update session's updated_at and titulo if needed
    const session = await ctx.db.get(args.sesion_id);
    if (session) {
      const updates: any = { updated_at: now };

      // Auto-generate titulo from first user message
      if (
        args.rol === "user" &&
        (!session.titulo || session.titulo === "Nueva conversación")
      ) {
        const titulo =
          args.contenido.length > 60
            ? args.contenido.substring(0, 60) + "..."
            : args.contenido;
        updates.titulo = titulo;
      }

      await ctx.db.patch(args.sesion_id, updates);
    }

    return messageId;
  },
});

/**
 * Send chat message (alias for compatibility)
 */
export const sendChatMensaje = mutation({
  args: {
    sesion_id: v.id("chat_sesiones"),
    rol: v.string(),
    contenido: v.string(),
    fuentes: v.optional(v.any()),
    modelo_usado: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();

    const messageId = await ctx.db.insert("chat_mensajes", {
      sesion_id: args.sesion_id,
      rol: args.rol,
      contenido: args.contenido,
      fuentes: args.fuentes,
      modelo_usado: args.modelo_usado,
      created_at: now,
    });

    // Update session
    await ctx.db.patch(args.sesion_id, {
      updated_at: now,
    });

    return messageId;
  },
});

/**
 * Update session titulo
 */
export const updateSesionTitulo = mutation({
  args: {
    id: v.id("chat_sesiones"),
    titulo: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      titulo: args.titulo,
      updated_at: new Date().toISOString(),
    });

    return { success: true };
  },
});

/**
 * Delete message
 */
export const deleteMessage = mutation({
  args: { id: v.id("chat_mensajes") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return { success: true };
  },
});

/**
 * Delete session and all its messages
 */
export const deleteChatSesion = mutation({
  args: { id: v.id("chat_sesiones") },
  handler: async (ctx, args) => {
    // Delete all messages in session
    const messages = await ctx.db
      .query("chat_mensajes")
      .withIndex("by_sesion", (q) => q.eq("sesion_id", args.id))
      .collect();

    for (const message of messages) {
      await ctx.db.delete(message._id);
    }

    // Delete session
    await ctx.db.delete(args.id);

    return { success: true };
  },
});

/**
 * Archive session (set activa = false)
 */
export const archiveChatSesion = mutation({
  args: { id: v.id("chat_sesiones") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      activa: false,
      updated_at: new Date().toISOString(),
    });

    return { success: true };
  },
});
