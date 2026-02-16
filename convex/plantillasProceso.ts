// @ts-nocheck
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

const tareaTemplateValidator = v.object({
  titulo: v.string(),
  descripcion: v.optional(v.string()),
  prioridad: v.union(
    v.literal("urgente"),
    v.literal("alta"),
    v.literal("media"),
    v.literal("baja")
  ),
  etiquetas: v.optional(v.array(v.string())),
  offset_dias_inicio: v.number(),
  offset_dias_limite: v.number(),
  checklist: v.optional(v.array(v.object({
    texto: v.string(),
    completado: v.boolean(),
  }))),
});

// ─── QUERIES ───────────────────────────────────────────────

export const listPlantillas = query({
  args: { tipo: v.optional(v.string()) },
  handler: async (ctx, args) => {
    if (args.tipo) {
      return await ctx.db
        .query("plantillas_proceso")
        .withIndex("by_tipo", (q) => q.eq("tipo", args.tipo))
        .collect();
    }
    return await ctx.db.query("plantillas_proceso").collect();
  },
});

export const getPlantilla = query({
  args: { id: v.id("plantillas_proceso") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// ─── MUTATIONS ─────────────────────────────────────────────

export const createPlantilla = mutation({
  args: {
    nombre: v.string(),
    descripcion: v.optional(v.string()),
    tipo: v.union(
      v.literal("contabilidad_mensual"),
      v.literal("declaracion_f29"),
      v.literal("declaracion_renta"),
      v.literal("cierre_anual"),
      v.literal("onboarding_cliente"),
      v.literal("otro")
    ),
    tareas_template: v.array(tareaTemplateValidator),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    return await ctx.db.insert("plantillas_proceso", {
      ...args,
      created_at: now,
      updated_at: now,
    });
  },
});

export const updatePlantilla = mutation({
  args: {
    id: v.id("plantillas_proceso"),
    nombre: v.optional(v.string()),
    descripcion: v.optional(v.string()),
    tareas_template: v.optional(v.array(tareaTemplateValidator)),
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

export const deletePlantilla = mutation({
  args: { id: v.id("plantillas_proceso") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return { success: true };
  },
});

// ─── SEED ──────────────────────────────────────────────────

export const seedPlantillas = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("plantillas_proceso").collect();
    if (existing.length > 0) return { message: "Plantillas ya existen", count: existing.length };

    const now = new Date().toISOString();

    const plantillas = [
      {
        nombre: "Contabilidad Mensual",
        descripcion: "Proceso mensual estándar de contabilidad para clientes",
        tipo: "contabilidad_mensual" as const,
        tareas_template: [
          { titulo: "Recopilar documentación tributaria", prioridad: "alta" as const, etiquetas: ["documentos"], offset_dias_inicio: 0, offset_dias_limite: 3 },
          { titulo: "Descargar libros de compra/venta del SII", prioridad: "alta" as const, etiquetas: ["sii"], offset_dias_inicio: 1, offset_dias_limite: 4 },
          { titulo: "Clasificar documentos por cuenta contable", prioridad: "alta" as const, etiquetas: ["clasificacion"], offset_dias_inicio: 3, offset_dias_limite: 7 },
          { titulo: "Descargar cartola bancaria", prioridad: "media" as const, etiquetas: ["banco"], offset_dias_inicio: 1, offset_dias_limite: 5 },
          { titulo: "Conciliación bancaria", prioridad: "alta" as const, etiquetas: ["conciliacion"], offset_dias_inicio: 5, offset_dias_limite: 10 },
          { titulo: "Registrar boletas de honorarios", prioridad: "media" as const, etiquetas: ["honorarios"], offset_dias_inicio: 3, offset_dias_limite: 8 },
          { titulo: "Calcular F29", prioridad: "urgente" as const, etiquetas: ["f29", "impuestos"], offset_dias_inicio: 8, offset_dias_limite: 12 },
          { titulo: "Revisión por supervisor", prioridad: "alta" as const, etiquetas: ["revision"], offset_dias_inicio: 10, offset_dias_limite: 14 },
          { titulo: "Enviar F29 al SII", prioridad: "urgente" as const, etiquetas: ["f29", "sii"], offset_dias_inicio: 12, offset_dias_limite: 15 },
          { titulo: "Notificar al cliente", prioridad: "baja" as const, etiquetas: ["cliente"], offset_dias_inicio: 14, offset_dias_limite: 16 },
        ],
      },
      {
        nombre: "Declaración Renta Anual",
        descripcion: "Proceso anual de declaración de renta (Operación Renta)",
        tipo: "declaracion_renta" as const,
        tareas_template: [
          { titulo: "Cerrar contabilidad de diciembre", prioridad: "urgente" as const, etiquetas: ["cierre"], offset_dias_inicio: 0, offset_dias_limite: 10 },
          { titulo: "Preparar balance general", prioridad: "alta" as const, etiquetas: ["balance"], offset_dias_inicio: 5, offset_dias_limite: 15 },
          { titulo: "Calcular RLI (Renta Líquida Imponible)", prioridad: "urgente" as const, etiquetas: ["rli", "impuestos"], offset_dias_inicio: 10, offset_dias_limite: 20 },
          { titulo: "Preparar DJ 1879 (Honorarios)", prioridad: "alta" as const, etiquetas: ["dj", "honorarios"], offset_dias_inicio: 10, offset_dias_limite: 25 },
          { titulo: "Preparar DJ 1887 (Sueldos)", prioridad: "alta" as const, etiquetas: ["dj", "sueldos"], offset_dias_inicio: 10, offset_dias_limite: 25 },
          { titulo: "Enviar declaraciones juradas al SII", prioridad: "urgente" as const, etiquetas: ["dj", "sii"], offset_dias_inicio: 20, offset_dias_limite: 30 },
          { titulo: "Preparar F22", prioridad: "urgente" as const, etiquetas: ["f22", "renta"], offset_dias_inicio: 25, offset_dias_limite: 40 },
          { titulo: "Revisión final por supervisor", prioridad: "alta" as const, etiquetas: ["revision"], offset_dias_inicio: 35, offset_dias_limite: 45 },
          { titulo: "Enviar F22 al SII", prioridad: "urgente" as const, etiquetas: ["f22", "sii"], offset_dias_inicio: 40, offset_dias_limite: 50 },
          { titulo: "Confirmar recepción y notificar cliente", prioridad: "media" as const, etiquetas: ["cliente"], offset_dias_inicio: 45, offset_dias_limite: 55 },
        ],
      },
      {
        nombre: "Onboarding Cliente",
        descripcion: "Proceso de incorporación de nuevo cliente al estudio",
        tipo: "onboarding_cliente" as const,
        tareas_template: [
          { titulo: "Recopilar documentos constitutivos", prioridad: "urgente" as const, etiquetas: ["documentos", "legal"], offset_dias_inicio: 0, offset_dias_limite: 5 },
          { titulo: "Obtener claves SII del cliente", prioridad: "urgente" as const, etiquetas: ["sii", "credenciales"], offset_dias_inicio: 0, offset_dias_limite: 3 },
          { titulo: "Configurar plan de cuentas", prioridad: "alta" as const, etiquetas: ["plan_cuentas"], offset_dias_inicio: 3, offset_dias_limite: 7 },
          { titulo: "Solicitar accesos bancarios", prioridad: "alta" as const, etiquetas: ["banco", "credenciales"], offset_dias_inicio: 1, offset_dias_limite: 7 },
          { titulo: "Migrar contabilidad anterior", prioridad: "alta" as const, etiquetas: ["migracion"], offset_dias_inicio: 5, offset_dias_limite: 15 },
          { titulo: "Configurar bots de descarga automática", prioridad: "media" as const, etiquetas: ["bots", "automatizacion"], offset_dias_inicio: 7, offset_dias_limite: 12 },
          { titulo: "Reunión de kickoff con cliente", prioridad: "media" as const, etiquetas: ["cliente", "reunion"], offset_dias_inicio: 10, offset_dias_limite: 14 },
          { titulo: "Validar primer cierre mensual", prioridad: "alta" as const, etiquetas: ["validacion"], offset_dias_inicio: 14, offset_dias_limite: 20 },
        ],
      },
      {
        nombre: "Cierre Anual",
        descripcion: "Proceso de cierre contable de fin de año",
        tipo: "cierre_anual" as const,
        tareas_template: [
          { titulo: "Conciliar todas las cuentas", prioridad: "urgente" as const, etiquetas: ["conciliacion"], offset_dias_inicio: 0, offset_dias_limite: 10 },
          { titulo: "Realizar inventario de activos", prioridad: "alta" as const, etiquetas: ["activos", "inventario"], offset_dias_inicio: 0, offset_dias_limite: 10 },
          { titulo: "Registrar provisiones y ajustes", prioridad: "alta" as const, etiquetas: ["provisiones"], offset_dias_inicio: 5, offset_dias_limite: 12 },
          { titulo: "Corrección monetaria", prioridad: "urgente" as const, etiquetas: ["correccion_monetaria"], offset_dias_inicio: 8, offset_dias_limite: 15 },
          { titulo: "Balance de 8 columnas", prioridad: "alta" as const, etiquetas: ["balance"], offset_dias_inicio: 12, offset_dias_limite: 18 },
          { titulo: "Estado de resultados", prioridad: "alta" as const, etiquetas: ["eerr"], offset_dias_inicio: 15, offset_dias_limite: 20 },
          { titulo: "Revisión final y aprobación", prioridad: "urgente" as const, etiquetas: ["revision"], offset_dias_inicio: 18, offset_dias_limite: 25 },
        ],
      },
    ];

    let count = 0;
    for (const p of plantillas) {
      await ctx.db.insert("plantillas_proceso", {
        ...p,
        created_at: now,
        updated_at: now,
      });
      count++;
    }

    return { message: "Plantillas creadas", count };
  },
});
