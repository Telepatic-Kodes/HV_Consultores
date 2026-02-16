// @ts-nocheck
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Create portal credentials for a client
 */
export const createCredencial = mutation({
  args: {
    cliente_id: v.id("clientes"),
    portal: v.string(),
    usuario_encriptado: v.string(),
    password_encriptado: v.string(),
    datos_adicionales: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("credenciales_portales", {
      cliente_id: args.cliente_id,
      portal: args.portal,
      usuario_encriptado: args.usuario_encriptado,
      password_encriptado: args.password_encriptado,
      datos_adicionales: args.datos_adicionales,
      activo: true,
      validacion_exitosa: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  },
});

/**
 * List credentials for a client
 */
export const listCredenciales = query({
  args: {
    clienteId: v.id("clientes"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("credenciales_portales")
      .withIndex("by_cliente", (q: any) => q.eq("cliente_id", args.clienteId))
      .collect();
  },
});

/**
 * Update credential status after validation
 */
export const updateCredencialValidation = mutation({
  args: {
    id: v.id("credenciales_portales"),
    validacion_exitosa: v.boolean(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      validacion_exitosa: args.validacion_exitosa,
      ultima_validacion: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    return args.id;
  },
});
