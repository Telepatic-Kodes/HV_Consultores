// @ts-nocheck
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { PLAN_LIMITS } from "./subscriptions";

// ─── QUERIES ───────────────────────────────────────────────

/**
 * List all clients with optional filters
 */
export const listClients = query({
  args: {
    activo: v.optional(v.boolean()),
    contadorAsignadoId: v.optional(v.id("profiles")),
  },
  handler: async (ctx, args) => {
    let q = ctx.db.query("clientes");

    // Filter by activo status
    if (args.activo !== undefined) {
      q = q.withIndex("by_activo", (q: any) => q.eq("activo", args.activo!));
    }

    let results = await q.collect();

    // Filter by contador if specified
    if (args.contadorAsignadoId) {
      results = results.filter(
        (c) => c.contador_asignado_id === args.contadorAsignadoId
      );
    }

    return results;
  },
});

/**
 * Get single client by ID
 */
export const getClient = query({
  args: { id: v.id("clientes") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

/**
 * Get client by RUT
 */
export const getClientByRut = query({
  args: { rut: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("clientes")
      .withIndex("by_rut", (q: any) => q.eq("rut", args.rut))
      .first();
  },
});

/**
 * Search clients by name or RUT
 */
export const searchClients = query({
  args: {
    searchTerm: v.string(),
    activo: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let q = ctx.db.query("clientes");

    if (args.activo !== undefined) {
      q = q.withIndex("by_activo", (q: any) => q.eq("activo", args.activo!));
    }

    const results = await q.collect();

    // Filter by search term (case-insensitive)
    const searchLower = args.searchTerm.toLowerCase();
    return results.filter(
      (client) =>
        client.razon_social.toLowerCase().includes(searchLower) ||
        client.rut.toLowerCase().includes(searchLower) ||
        (client.nombre_fantasia &&
          client.nombre_fantasia.toLowerCase().includes(searchLower))
    );
  },
});

/**
 * Get clients assigned to a specific contador
 */
export const getClientsByContador = query({
  args: { contadorId: v.id("profiles") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("clientes")
      .withIndex("by_contador", (q: any) => q.eq("contador_asignado_id", args.contadorId))
      .collect();
  },
});

/**
 * Get client stats
 */
export const getClientStats = query({
  args: {},
  handler: async (ctx) => {
    const clients = await ctx.db.query("clientes").collect();

    const stats = {
      total: clients.length,
      activos: clients.filter((c) => c.activo === true).length,
      inactivos: clients.filter((c) => c.activo === false).length,
      porRegimen: {
        "14A": clients.filter((c) => c.regimen_tributario === "14A").length,
        "14D": clients.filter((c) => c.regimen_tributario === "14D").length,
        "14D_N3": clients.filter((c) => c.regimen_tributario === "14D_N3").length,
        "14D_N8": clients.filter((c) => c.regimen_tributario === "14D_N8").length,
      },
    };

    return stats;
  },
});

// ─── MUTATIONS ─────────────────────────────────────────────

/**
 * Create new client
 */
export const createClient = mutation({
  args: {
    razon_social: v.string(),
    rut: v.string(),
    nombre_fantasia: v.optional(v.string()),
    giro: v.optional(v.string()),
    direccion: v.optional(v.string()),
    comuna: v.optional(v.string()),
    region: v.optional(v.string()),
    regimen_tributario: v.optional(
      v.union(
        v.literal("14A"),
        v.literal("14D"),
        v.literal("14D_N3"),
        v.literal("14D_N8")
      )
    ),
    tasa_ppm: v.optional(v.number()),
    nubox_id: v.optional(v.string()),
    contador_asignado_id: v.optional(v.id("profiles")),
    activo: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();

    const clientId = await ctx.db.insert("clientes", {
      razon_social: args.razon_social,
      rut: args.rut,
      nombre_fantasia: args.nombre_fantasia,
      giro: args.giro,
      direccion: args.direccion,
      comuna: args.comuna,
      region: args.region,
      regimen_tributario: args.regimen_tributario,
      tasa_ppm: args.tasa_ppm,
      nubox_id: args.nubox_id,
      contador_asignado_id: args.contador_asignado_id,
      activo: args.activo ?? true,
      created_at: now,
      updated_at: now,
    });

    return clientId;
  },
});

/**
 * Update client
 */
export const updateClient = mutation({
  args: {
    id: v.id("clientes"),
    razon_social: v.optional(v.string()),
    rut: v.optional(v.string()),
    nombre_fantasia: v.optional(v.string()),
    giro: v.optional(v.string()),
    direccion: v.optional(v.string()),
    comuna: v.optional(v.string()),
    region: v.optional(v.string()),
    regimen_tributario: v.optional(
      v.union(
        v.literal("14A"),
        v.literal("14D"),
        v.literal("14D_N3"),
        v.literal("14D_N8")
      )
    ),
    tasa_ppm: v.optional(v.number()),
    nubox_id: v.optional(v.string()),
    contador_asignado_id: v.optional(v.id("profiles")),
    activo: v.optional(v.boolean()),
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
 * Delete client (soft delete by setting activo = false)
 */
export const deleteClient = mutation({
  args: {
    id: v.id("clientes"),
    hardDelete: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    if (args.hardDelete) {
      await ctx.db.delete(args.id);
    } else {
      // Soft delete
      await ctx.db.patch(args.id, {
        activo: false,
        updated_at: new Date().toISOString(),
      });
    }

    return { success: true };
  },
});

/**
 * Assign contador to client
 */
export const assignContador = mutation({
  args: {
    clienteId: v.id("clientes"),
    contadorId: v.id("profiles"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.clienteId, {
      contador_asignado_id: args.contadorId,
      updated_at: new Date().toISOString(),
    });

    return { success: true };
  },
});

// ─── ALIASES (Spanish ↔ English compatibility) ──────────
export const listClientes = listClients;
export const createCliente = createClient;
export const updateCliente = updateClient;
export const deleteCliente = deleteClient;
