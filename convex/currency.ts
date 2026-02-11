// @ts-nocheck
import { query, mutation, action } from "./_generated/server";
import { v } from "convex/values";

const monedaType = v.union(
  v.literal("CLP"),
  v.literal("USD"),
  v.literal("EUR"),
  v.literal("UF")
);

// ─── QUERIES ────────────────────────────────────────────────

/**
 * Get exchange rate for a specific currency and date
 */
export const getExchangeRate = query({
  args: {
    moneda: monedaType,
    fecha: v.string(),
  },
  handler: async (ctx, args) => {
    const rate = await ctx.db
      .query("tipos_cambio")
      .withIndex("by_moneda_fecha", (q: any) =>
        q.eq("moneda", args.moneda).eq("fecha", args.fecha)
      )
      .first();

    if (rate) return rate;

    // Fallback: find closest previous date
    const rates = await ctx.db
      .query("tipos_cambio")
      .withIndex("by_moneda_fecha", (q: any) =>
        q.eq("moneda", args.moneda).lt("fecha", args.fecha)
      )
      .order("desc")
      .take(1);

    return rates[0] ?? null;
  },
});

/**
 * Get the latest exchange rate for a currency
 */
export const getLatestRate = query({
  args: { moneda: monedaType },
  handler: async (ctx, args) => {
    const rates = await ctx.db
      .query("tipos_cambio")
      .withIndex("by_moneda_fecha", (q: any) =>
        q.eq("moneda", args.moneda)
      )
      .order("desc")
      .take(1);

    return rates[0] ?? null;
  },
});

/**
 * Get exchange rate history for a currency
 */
export const getRateHistory = query({
  args: {
    moneda: monedaType,
    fechaDesde: v.optional(v.string()),
    fechaHasta: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let q = ctx.db
      .query("tipos_cambio")
      .withIndex("by_moneda_fecha", (qb: any) => {
        let chain = qb.eq("moneda", args.moneda);
        if (args.fechaDesde) chain = chain.gte("fecha", args.fechaDesde);
        if (args.fechaHasta) chain = chain.lte("fecha", args.fechaHasta);
        return chain;
      })
      .order("desc");

    if (args.limit) {
      return await q.take(args.limit);
    }
    return await q.collect();
  },
});

/**
 * Get latest rates for all currencies
 */
export const getAllLatestRates = query({
  handler: async (ctx) => {
    const monedas = ["UF", "USD", "EUR"] as const;
    const result: Record<string, any> = {};

    for (const moneda of monedas) {
      const rates = await ctx.db
        .query("tipos_cambio")
        .withIndex("by_moneda_fecha", (q: any) => q.eq("moneda", moneda))
        .order("desc")
        .take(1);

      if (rates[0]) {
        result[moneda] = rates[0];
      }
    }

    return result;
  },
});

/**
 * Convert an amount between currencies
 */
export const convertAmount = query({
  args: {
    monto: v.number(),
    monedaOrigen: monedaType,
    monedaDestino: monedaType,
    fecha: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.monedaOrigen === args.monedaDestino) {
      return { monto: args.monto, tasa: 1, fecha: args.fecha ?? "" };
    }

    const fecha = args.fecha ?? new Date().toISOString().split("T")[0];

    // Helper to get rate (returns CLP value)
    const getRate = async (moneda: string) => {
      if (moneda === "CLP") return 1;
      const rates = await ctx.db
        .query("tipos_cambio")
        .withIndex("by_moneda_fecha", (q: any) =>
          q.eq("moneda", moneda).lte("fecha", fecha)
        )
        .order("desc")
        .take(1);
      return rates[0]?.valor ?? null;
    };

    const rateOrigen = await getRate(args.monedaOrigen);
    const rateDestino = await getRate(args.monedaDestino);

    if (!rateOrigen || !rateDestino) {
      return { monto: null, tasa: null, fecha, error: "Tipo de cambio no disponible" };
    }

    // Convert: origen -> CLP -> destino
    const montoCLP = args.monto * rateOrigen;
    const montoDestino = montoCLP / rateDestino;
    const tasa = rateOrigen / rateDestino;

    return {
      monto: Math.round(montoDestino * 100) / 100,
      tasa: Math.round(tasa * 10000) / 10000,
      fecha,
    };
  },
});

// ─── MUTATIONS ──────────────────────────────────────────────

/**
 * Import exchange rates in bulk
 */
export const importExchangeRates = mutation({
  args: {
    rates: v.array(
      v.object({
        moneda: monedaType,
        fecha: v.string(),
        valor: v.number(),
        fuente: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    let created = 0;
    let updated = 0;

    for (const rate of args.rates) {
      // Check if already exists
      const existing = await ctx.db
        .query("tipos_cambio")
        .withIndex("by_moneda_fecha", (q: any) =>
          q.eq("moneda", rate.moneda).eq("fecha", rate.fecha)
        )
        .first();

      if (existing) {
        if (existing.valor !== rate.valor) {
          await ctx.db.patch(existing._id, {
            valor: rate.valor,
            fuente: rate.fuente,
          });
          updated++;
        }
      } else {
        await ctx.db.insert("tipos_cambio", {
          moneda: rate.moneda,
          fecha: rate.fecha,
          valor: rate.valor,
          fuente: rate.fuente ?? "manual",
          created_at: new Date().toISOString(),
        });
        created++;
      }
    }

    return { created, updated, total: args.rates.length };
  },
});

/**
 * Set a single exchange rate
 */
export const setExchangeRate = mutation({
  args: {
    moneda: monedaType,
    fecha: v.string(),
    valor: v.number(),
    fuente: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("tipos_cambio")
      .withIndex("by_moneda_fecha", (q: any) =>
        q.eq("moneda", args.moneda).eq("fecha", args.fecha)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        valor: args.valor,
        fuente: args.fuente,
      });
      return existing._id;
    }

    return await ctx.db.insert("tipos_cambio", {
      moneda: args.moneda,
      fecha: args.fecha,
      valor: args.valor,
      fuente: args.fuente ?? "manual",
      created_at: new Date().toISOString(),
    });
  },
});

/**
 * Delete exchange rates for a date range
 */
export const deleteRates = mutation({
  args: {
    moneda: monedaType,
    fechaDesde: v.string(),
    fechaHasta: v.string(),
  },
  handler: async (ctx, args) => {
    const rates = await ctx.db
      .query("tipos_cambio")
      .withIndex("by_moneda_fecha", (q: any) =>
        q
          .eq("moneda", args.moneda)
          .gte("fecha", args.fechaDesde)
          .lte("fecha", args.fechaHasta)
      )
      .collect();

    for (const rate of rates) {
      await ctx.db.delete(rate._id);
    }

    return { deleted: rates.length };
  },
});
