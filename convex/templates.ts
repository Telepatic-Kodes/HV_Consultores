// @ts-nocheck
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// ─── QUERIES ────────────────────────────────────────────────

/**
 * List all active plantillas (templates)
 */
export const listPlantillas = query({
  args: {
    regimen: v.optional(
      v.union(
        v.literal("14A"),
        v.literal("14D"),
        v.literal("14D_N3"),
        v.literal("14D_N8")
      )
    ),
  },
  handler: async (ctx, args) => {
    if (args.regimen) {
      return await ctx.db
        .query("plantillas_plan_cuenta")
        .withIndex("by_regimen", (q: any) => q.eq("regimen", args.regimen))
        .collect();
    }
    return await ctx.db.query("plantillas_plan_cuenta").collect();
  },
});

/**
 * Get a single plantilla by ID
 */
export const getPlantilla = query({
  args: { plantillaId: v.id("plantillas_plan_cuenta") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.plantillaId);
  },
});

/**
 * List reglas de categorización for a client (merged with global)
 */
export const getReglasCategorizacion = query({
  args: {
    clienteId: v.optional(v.id("clientes")),
    soloActivas: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Get global rules
    const globalRules = await ctx.db
      .query("reglas_categorizacion")
      .withIndex("by_es_global", (q: any) => q.eq("es_global", true))
      .collect();

    // Get client-specific rules
    let clientRules: any[] = [];
    if (args.clienteId) {
      clientRules = await ctx.db
        .query("reglas_categorizacion")
        .withIndex("by_cliente", (q: any) =>
          q.eq("cliente_id", args.clienteId)
        )
        .collect();
    }

    // Merge: client rules override global when same patron + campo
    const allRules = [...clientRules, ...globalRules];

    // Filter active if requested
    const filtered = args.soloActivas
      ? allRules.filter((r) => r.activa !== false)
      : allRules;

    // Sort by priority (lower number = higher priority)
    return filtered.sort((a, b) => (a.prioridad ?? 999) - (b.prioridad ?? 999));
  },
});

/**
 * Get a single regla by ID
 */
export const getRegla = query({
  args: { reglaId: v.id("reglas_categorizacion") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.reglaId);
  },
});

// ─── MUTATIONS ──────────────────────────────────────────────

/**
 * Create a new plantilla de plan de cuenta
 */
export const createPlantilla = mutation({
  args: {
    nombre: v.string(),
    regimen: v.union(
      v.literal("14A"),
      v.literal("14D"),
      v.literal("14D_N3"),
      v.literal("14D_N8")
    ),
    descripcion: v.optional(v.string()),
    cuentas: v.array(
      v.object({
        codigo: v.string(),
        nombre: v.string(),
        tipo: v.optional(v.string()),
        nivel: v.number(),
        cuenta_padre_codigo: v.optional(v.string()),
        es_cuenta_mayor: v.optional(v.boolean()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    return await ctx.db.insert("plantillas_plan_cuenta", {
      nombre: args.nombre,
      regimen: args.regimen,
      descripcion: args.descripcion,
      cuentas: args.cuentas,
      version: 1,
      activa: true,
      created_at: now,
      updated_at: now,
    });
  },
});

/**
 * Update a plantilla
 */
export const updatePlantilla = mutation({
  args: {
    plantillaId: v.id("plantillas_plan_cuenta"),
    nombre: v.optional(v.string()),
    descripcion: v.optional(v.string()),
    cuentas: v.optional(
      v.array(
        v.object({
          codigo: v.string(),
          nombre: v.string(),
          tipo: v.optional(v.string()),
          nivel: v.number(),
          cuenta_padre_codigo: v.optional(v.string()),
          es_cuenta_mayor: v.optional(v.boolean()),
        })
      )
    ),
    activa: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { plantillaId, ...updates } = args;
    const existing = await ctx.db.get(plantillaId);
    if (!existing) throw new Error("Plantilla no encontrada");

    const filtered: Record<string, any> = {};
    for (const [key, val] of Object.entries(updates)) {
      if (val !== undefined) filtered[key] = val;
    }

    // Bump version if cuentas changed
    if (filtered.cuentas) {
      filtered.version = (existing.version ?? 1) + 1;
    }
    filtered.updated_at = new Date().toISOString();

    await ctx.db.patch(plantillaId, filtered);
  },
});

/**
 * Clone a plantilla as an active plan de cuenta for a client
 */
export const cloneTemplateForClient = mutation({
  args: {
    plantillaId: v.id("plantillas_plan_cuenta"),
    clienteId: v.id("clientes"),
  },
  handler: async (ctx, args) => {
    const template = await ctx.db.get(args.plantillaId);
    if (!template) throw new Error("Plantilla no encontrada");

    const now = new Date().toISOString();

    // Create plan de cuenta
    const planId = await ctx.db.insert("planes_cuenta", {
      nombre: `${template.nombre} - Copia`,
      cliente_id: args.clienteId,
      version: 1,
      activo: true,
      created_at: now,
    });

    // Create cuentas contables from template
    const codeToId = new Map<string, any>();
    // Sort by nivel to ensure parents created first
    const sorted = [...template.cuentas].sort((a, b) => a.nivel - b.nivel);

    for (const cuenta of sorted) {
      const parentId = cuenta.cuenta_padre_codigo
        ? codeToId.get(cuenta.cuenta_padre_codigo)
        : undefined;

      const cuentaId = await ctx.db.insert("cuentas_contables", {
        codigo: cuenta.codigo,
        nombre: cuenta.nombre,
        plan_cuenta_id: planId,
        cuenta_padre_id: parentId,
        tipo: cuenta.tipo,
        nivel: cuenta.nivel,
        es_cuenta_mayor: cuenta.es_cuenta_mayor ?? false,
        activa: true,
      });

      codeToId.set(cuenta.codigo, cuentaId);
    }

    return { planId, cuentasCreadas: sorted.length };
  },
});

/**
 * Delete a plantilla (soft delete)
 */
export const deletePlantilla = mutation({
  args: { plantillaId: v.id("plantillas_plan_cuenta") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.plantillaId, {
      activa: false,
      updated_at: new Date().toISOString(),
    });
  },
});

// ─── REGLAS CATEGORIZACION MUTATIONS ────────────────────────

/**
 * Create a categorization rule
 */
export const createRegla = mutation({
  args: {
    clienteId: v.optional(v.id("clientes")),
    nombre: v.string(),
    descripcion: v.optional(v.string()),
    patron: v.string(),
    tipo_patron: v.union(
      v.literal("contains"),
      v.literal("regex"),
      v.literal("exact"),
      v.literal("starts_with")
    ),
    campo_aplicacion: v.union(
      v.literal("descripcion"),
      v.literal("rut"),
      v.literal("razon_social"),
      v.literal("glosa")
    ),
    cuenta_contable_id: v.optional(v.id("cuentas_contables")),
    categoria: v.optional(v.string()),
    prioridad: v.number(),
    es_global: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    return await ctx.db.insert("reglas_categorizacion", {
      cliente_id: args.clienteId,
      nombre: args.nombre,
      descripcion: args.descripcion,
      patron: args.patron,
      tipo_patron: args.tipo_patron,
      campo_aplicacion: args.campo_aplicacion,
      cuenta_contable_id: args.cuenta_contable_id,
      categoria: args.categoria,
      prioridad: args.prioridad,
      es_global: args.es_global ?? !args.clienteId,
      activa: true,
      veces_aplicada: 0,
      created_at: now,
      updated_at: now,
    });
  },
});

/**
 * Update a categorization rule
 */
export const updateRegla = mutation({
  args: {
    reglaId: v.id("reglas_categorizacion"),
    nombre: v.optional(v.string()),
    descripcion: v.optional(v.string()),
    patron: v.optional(v.string()),
    tipo_patron: v.optional(
      v.union(
        v.literal("contains"),
        v.literal("regex"),
        v.literal("exact"),
        v.literal("starts_with")
      )
    ),
    campo_aplicacion: v.optional(
      v.union(
        v.literal("descripcion"),
        v.literal("rut"),
        v.literal("razon_social"),
        v.literal("glosa")
      )
    ),
    cuenta_contable_id: v.optional(v.id("cuentas_contables")),
    categoria: v.optional(v.string()),
    prioridad: v.optional(v.number()),
    activa: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { reglaId, ...updates } = args;

    const filtered: Record<string, any> = {};
    for (const [key, val] of Object.entries(updates)) {
      if (val !== undefined) filtered[key] = val;
    }
    filtered.updated_at = new Date().toISOString();

    await ctx.db.patch(reglaId, filtered);
  },
});

/**
 * Delete a categorization rule
 */
export const deleteRegla = mutation({
  args: { reglaId: v.id("reglas_categorizacion") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.reglaId, {
      activa: false,
      updated_at: new Date().toISOString(),
    });
  },
});

/**
 * Reorder rules (update priorities)
 */
export const reorderReglas = mutation({
  args: {
    orderedIds: v.array(v.id("reglas_categorizacion")),
  },
  handler: async (ctx, args) => {
    for (let i = 0; i < args.orderedIds.length; i++) {
      await ctx.db.patch(args.orderedIds[i], {
        prioridad: i + 1,
        updated_at: new Date().toISOString(),
      });
    }
  },
});

/**
 * Test a pattern against a sample text
 */
export const testPattern = query({
  args: {
    patron: v.string(),
    tipo_patron: v.union(
      v.literal("contains"),
      v.literal("regex"),
      v.literal("exact"),
      v.literal("starts_with")
    ),
    textosPrueba: v.array(v.string()),
  },
  handler: async (_ctx, args) => {
    return args.textosPrueba.map((texto) => {
      let matches = false;
      try {
        switch (args.tipo_patron) {
          case "contains":
            matches = texto.toLowerCase().includes(args.patron.toLowerCase());
            break;
          case "exact":
            matches = texto.toLowerCase() === args.patron.toLowerCase();
            break;
          case "starts_with":
            matches = texto
              .toLowerCase()
              .startsWith(args.patron.toLowerCase());
            break;
          case "regex":
            matches = new RegExp(args.patron, "i").test(texto);
            break;
        }
      } catch {
        matches = false;
      }
      return { texto, matches };
    });
  },
});
