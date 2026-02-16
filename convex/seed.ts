// @ts-nocheck
import { mutation } from "./_generated/server";
import { v } from "convex/values";

// ─── Helpers ─────────────────────────────────────────────
function isoDate(daysAgo: number = 0): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString();
}

function dateStr(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function periodo(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}`;
}

// ─── Seed Demo Data ─────────────────────────────────────
export const seedDemoData = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("clientes").first();
    if (existing) {
      throw new Error("Ya existen datos. Usa 'Limpiar datos' primero.");
    }

    const now = isoDate();

    // ═══════════════════════════════════════════════════════
    // 1. PROFILES & ROLES
    // ═══════════════════════════════════════════════════════
    const profiles = [
      { nombre_completo: "Carlos Muñoz", cargo: "Jefe Contabilidad" },
      { nombre_completo: "Patricia Soto", cargo: "Contadora Senior" },
      { nombre_completo: "Roberto Díaz", cargo: "Contador" },
    ];

    const profileIds: any[] = [];
    for (const p of profiles) {
      const id = await ctx.db.insert("profiles", {
        ...p,
        activo: true,
        created_at: isoDate(90),
        updated_at: now,
      });
      profileIds.push(id);
    }

    const adminRole = await ctx.db.insert("roles", {
      nombre: "admin",
      descripcion: "Administrador del sistema",
      created_at: isoDate(90),
    });
    const contadorRole = await ctx.db.insert("roles", {
      nombre: "contador",
      descripcion: "Contador con acceso a documentos y F29",
      created_at: isoDate(90),
    });

    await ctx.db.insert("user_roles", {
      user_id: profileIds[0],
      role_id: adminRole,
      assigned_at: isoDate(90),
    });
    for (let i = 1; i < profileIds.length; i++) {
      await ctx.db.insert("user_roles", {
        user_id: profileIds[i],
        role_id: contadorRole,
        assigned_at: isoDate(90),
      });
    }

    // ═══════════════════════════════════════════════════════
    // 2. CREATE CLIENTS
    // ═══════════════════════════════════════════════════════
    const cliente1 = await ctx.db.insert("clientes", {
      razon_social: "Distribuidora Los Andes SpA",
      rut: "76.543.210-K",
      nombre_fantasia: "Los Andes",
      giro: "Distribución de alimentos y bebidas",
      direccion: "Av. Providencia 2315, Of. 1201",
      comuna: "Providencia",
      region: "Metropolitana",
      regimen_tributario: "14D",
      tasa_ppm: 1.0,
      contador_asignado_id: profileIds[0],
      activo: true,
      created_at: isoDate(60),
      updated_at: now,
    });

    const cliente2 = await ctx.db.insert("clientes", {
      razon_social: "Constructora Pacífico Ltda",
      rut: "77.891.234-5",
      nombre_fantasia: "Pacífico",
      giro: "Construcción de obras civiles",
      direccion: "Av. Apoquindo 4700, Of. 803",
      comuna: "Las Condes",
      region: "Metropolitana",
      regimen_tributario: "14A",
      tasa_ppm: 1.5,
      contador_asignado_id: profileIds[1],
      activo: true,
      created_at: isoDate(45),
      updated_at: now,
    });

    const cliente3 = await ctx.db.insert("clientes", {
      razon_social: "Café Artesanal Sur SPA",
      rut: "76.112.345-8",
      nombre_fantasia: "Café Sur",
      giro: "Elaboración y venta de café artesanal",
      direccion: "Calle General Lagos 1024",
      comuna: "Valdivia",
      region: "Los Ríos",
      regimen_tributario: "14D_N8",
      tasa_ppm: 0.5,
      contador_asignado_id: profileIds[2],
      activo: true,
      created_at: isoDate(30),
      updated_at: now,
    });

    const clientes = [
      { id: cliente1, rut: "76.543.210-K", regimen: "14D" as const },
      { id: cliente2, rut: "77.891.234-5", regimen: "14A" as const },
      { id: cliente3, rut: "76.112.345-8", regimen: "14D_N8" as const },
    ];

    // ═══════════════════════════════════════════════════════
    // 3. PLAN DE CUENTAS + CUENTAS CONTABLES
    // ═══════════════════════════════════════════════════════
    const baseCuentas = [
      { codigo: "1.0.0.0", nombre: "Activos", tipo: "activo", nivel: 1, es_mayor: true },
      { codigo: "1.1.0.0", nombre: "Activos Corrientes", tipo: "activo", nivel: 2, es_mayor: true },
      { codigo: "1.1.1.0", nombre: "Efectivo y Equivalentes", tipo: "activo", nivel: 3, es_mayor: false },
      { codigo: "1.1.2.0", nombre: "Cuentas por Cobrar", tipo: "activo", nivel: 3, es_mayor: false },
      { codigo: "1.1.3.0", nombre: "Inventarios", tipo: "activo", nivel: 3, es_mayor: false },
      { codigo: "2.0.0.0", nombre: "Pasivos", tipo: "pasivo", nivel: 1, es_mayor: true },
      { codigo: "2.1.0.0", nombre: "Pasivos Corrientes", tipo: "pasivo", nivel: 2, es_mayor: true },
      { codigo: "2.1.1.0", nombre: "Proveedores", tipo: "pasivo", nivel: 3, es_mayor: false },
      { codigo: "2.1.2.0", nombre: "IVA por Pagar", tipo: "pasivo", nivel: 3, es_mayor: false },
      { codigo: "3.0.0.0", nombre: "Patrimonio", tipo: "patrimonio", nivel: 1, es_mayor: true },
      { codigo: "3.1.0.0", nombre: "Capital", tipo: "patrimonio", nivel: 2, es_mayor: false },
      { codigo: "4.0.0.0", nombre: "Ingresos", tipo: "resultado", nivel: 1, es_mayor: true },
      { codigo: "4.1.0.0", nombre: "Ventas", tipo: "resultado", nivel: 2, es_mayor: false },
      { codigo: "5.0.0.0", nombre: "Costos y Gastos", tipo: "resultado", nivel: 1, es_mayor: true },
      { codigo: "5.1.0.0", nombre: "Costo de Ventas", tipo: "resultado", nivel: 2, es_mayor: false },
      { codigo: "5.2.0.0", nombre: "Gastos Administrativos", tipo: "resultado", nivel: 2, es_mayor: false },
    ];

    for (const c of clientes) {
      const planId = await ctx.db.insert("planes_cuenta", {
        nombre: `Plan ${c.regimen} — ${c.rut}`,
        cliente_id: c.id,
        version: 1,
        activo: true,
        created_at: now,
      });

      for (const cuenta of baseCuentas) {
        await ctx.db.insert("cuentas_contables", {
          codigo: cuenta.codigo,
          nombre: cuenta.nombre,
          plan_cuenta_id: planId,
          tipo: cuenta.tipo,
          nivel: cuenta.nivel,
          es_cuenta_mayor: cuenta.es_mayor,
          activa: true,
        });
      }
    }

    // ═══════════════════════════════════════════════════════
    // 4. DOCUMENTOS
    // ═══════════════════════════════════════════════════════
    // SII codes: 33=Factura, 34=Exenta, 39=Boleta, 56=N.Débito, 61=N.Crédito, 52=Guía
    const docSets = [
      // Cliente 1 — 15 documentos
      { clienteId: cliente1, docs: [
        { tipo: "33", folio: "1001", per: periodo(2025,11), fecha: dateStr(2025,11,5), rut: "76.543.210-K", razon: "Distribuidora Los Andes", compra: false, neto: 500000, iva: 95000, total: 595000, status: "aprobado" as const },
        { tipo: "33", folio: "1002", per: periodo(2025,11), fecha: dateStr(2025,11,12), rut: "76.543.210-K", razon: "Distribuidora Los Andes", compra: false, neto: 750000, iva: 142500, total: 892500, status: "aprobado" as const },
        { tipo: "39", folio: "B001", per: periodo(2025,11), fecha: dateStr(2025,11,15), rut: "76.543.210-K", razon: "Distribuidora Los Andes", compra: false, neto: 84034, iva: 15966, total: 100000, status: "aprobado" as const },
        { tipo: "33", folio: "P201", per: periodo(2025,11), fecha: dateStr(2025,11,8), rut: "78.900.111-2", razon: "Proveedor Alimentos SA", compra: true, neto: 400000, iva: 76000, total: 476000, status: "aprobado" as const },
        { tipo: "33", folio: "P202", per: periodo(2025,11), fecha: dateStr(2025,11,20), rut: "77.888.999-0", razon: "Transportes del Sur Ltda", compra: true, neto: 120000, iva: 22800, total: 142800, status: "clasificado" as const },
        { tipo: "33", folio: "1003", per: periodo(2025,12), fecha: dateStr(2025,12,3), rut: "76.543.210-K", razon: "Distribuidora Los Andes", compra: false, neto: 680000, iva: 129200, total: 809200, status: "aprobado" as const },
        { tipo: "33", folio: "1004", per: periodo(2025,12), fecha: dateStr(2025,12,10), rut: "76.543.210-K", razon: "Distribuidora Los Andes", compra: false, neto: 450000, iva: 85500, total: 535500, status: "clasificado" as const },
        { tipo: "61", folio: "NC01", per: periodo(2025,12), fecha: dateStr(2025,12,15), rut: "76.543.210-K", razon: "Distribuidora Los Andes", compra: false, neto: -50000, iva: -9500, total: -59500, status: "aprobado" as const },
        { tipo: "33", folio: "P301", per: periodo(2025,12), fecha: dateStr(2025,12,5), rut: "78.900.111-2", razon: "Proveedor Alimentos SA", compra: true, neto: 350000, iva: 66500, total: 416500, status: "aprobado" as const },
        { tipo: "33", folio: "P302", per: periodo(2025,12), fecha: dateStr(2025,12,18), rut: "76.222.333-4", razon: "Envases Chile Ltda", compra: true, neto: 80000, iva: 15200, total: 95200, status: "pendiente" as const },
        { tipo: "33", folio: "1005", per: periodo(2026,1), fecha: dateStr(2026,1,8), rut: "76.543.210-K", razon: "Distribuidora Los Andes", compra: false, neto: 920000, iva: 174800, total: 1094800, status: "clasificado" as const },
        { tipo: "39", folio: "B002", per: periodo(2026,1), fecha: dateStr(2026,1,10), rut: "76.543.210-K", razon: "Distribuidora Los Andes", compra: false, neto: 42017, iva: 7983, total: 50000, status: "pendiente" as const },
        { tipo: "33", folio: "P401", per: periodo(2026,1), fecha: dateStr(2026,1,5), rut: "78.900.111-2", razon: "Proveedor Alimentos SA", compra: true, neto: 520000, iva: 98800, total: 618800, status: "pendiente" as const },
        { tipo: "33", folio: "P402", per: periodo(2026,1), fecha: dateStr(2026,1,12), rut: "77.888.999-0", razon: "Transportes del Sur Ltda", compra: true, neto: 150000, iva: 28500, total: 178500, status: "pendiente" as const },
        { tipo: "56", folio: "ND01", per: periodo(2026,1), fecha: dateStr(2026,1,15), rut: "76.543.210-K", razon: "Distribuidora Los Andes", compra: false, neto: 25000, iva: 4750, total: 29750, status: "pendiente" as const },
      ]},
      // Cliente 2 — 19 documentos
      { clienteId: cliente2, docs: [
        { tipo: "33", folio: "F2001", per: periodo(2025,10), fecha: dateStr(2025,10,5), rut: "77.891.234-5", razon: "Constructora Pacífico", compra: false, neto: 15000000, iva: 2850000, total: 17850000, status: "aprobado" as const },
        { tipo: "33", folio: "F2002", per: periodo(2025,10), fecha: dateStr(2025,10,15), rut: "77.891.234-5", razon: "Constructora Pacífico", compra: false, neto: 8500000, iva: 1615000, total: 10115000, status: "aprobado" as const },
        { tipo: "52", folio: "GD001", per: periodo(2025,10), fecha: dateStr(2025,10,8), rut: "77.891.234-5", razon: "Constructora Pacífico", compra: false, neto: 2000000, iva: 380000, total: 2380000, status: "aprobado" as const },
        { tipo: "33", folio: "CP101", per: periodo(2025,10), fecha: dateStr(2025,10,3), rut: "79.111.222-3", razon: "Cementos Bio-Bio SA", compra: true, neto: 5500000, iva: 1045000, total: 6545000, status: "aprobado" as const },
        { tipo: "33", folio: "CP102", per: periodo(2025,10), fecha: dateStr(2025,10,20), rut: "80.333.444-5", razon: "Aceros Arequipa Chile", compra: true, neto: 3200000, iva: 608000, total: 3808000, status: "aprobado" as const },
        { tipo: "33", folio: "F2003", per: periodo(2025,11), fecha: dateStr(2025,11,3), rut: "77.891.234-5", razon: "Constructora Pacífico", compra: false, neto: 12000000, iva: 2280000, total: 14280000, status: "aprobado" as const },
        { tipo: "33", folio: "F2004", per: periodo(2025,11), fecha: dateStr(2025,11,18), rut: "77.891.234-5", razon: "Constructora Pacífico", compra: false, neto: 6800000, iva: 1292000, total: 8092000, status: "aprobado" as const },
        { tipo: "33", folio: "CP201", per: periodo(2025,11), fecha: dateStr(2025,11,7), rut: "79.111.222-3", razon: "Cementos Bio-Bio SA", compra: true, neto: 4800000, iva: 912000, total: 5712000, status: "aprobado" as const },
        { tipo: "33", folio: "CP202", per: periodo(2025,11), fecha: dateStr(2025,11,22), rut: "81.555.666-7", razon: "Maquinarias del Norte Ltda", compra: true, neto: 7200000, iva: 1368000, total: 8568000, status: "clasificado" as const },
        { tipo: "61", folio: "NC201", per: periodo(2025,11), fecha: dateStr(2025,11,25), rut: "77.891.234-5", razon: "Constructora Pacífico", compra: false, neto: -500000, iva: -95000, total: -595000, status: "aprobado" as const },
        { tipo: "33", folio: "F2005", per: periodo(2025,12), fecha: dateStr(2025,12,5), rut: "77.891.234-5", razon: "Constructora Pacífico", compra: false, neto: 18500000, iva: 3515000, total: 22015000, status: "aprobado" as const },
        { tipo: "33", folio: "F2006", per: periodo(2025,12), fecha: dateStr(2025,12,12), rut: "77.891.234-5", razon: "Constructora Pacífico", compra: false, neto: 4200000, iva: 798000, total: 4998000, status: "clasificado" as const },
        { tipo: "33", folio: "CP301", per: periodo(2025,12), fecha: dateStr(2025,12,3), rut: "79.111.222-3", razon: "Cementos Bio-Bio SA", compra: true, neto: 6100000, iva: 1159000, total: 7259000, status: "aprobado" as const },
        { tipo: "52", folio: "GD002", per: periodo(2025,12), fecha: dateStr(2025,12,8), rut: "77.891.234-5", razon: "Constructora Pacífico", compra: false, neto: 3500000, iva: 665000, total: 4165000, status: "aprobado" as const },
        { tipo: "33", folio: "F2007", per: periodo(2026,1), fecha: dateStr(2026,1,4), rut: "77.891.234-5", razon: "Constructora Pacífico", compra: false, neto: 22000000, iva: 4180000, total: 26180000, status: "clasificado" as const },
        { tipo: "33", folio: "F2008", per: periodo(2026,1), fecha: dateStr(2026,1,15), rut: "77.891.234-5", razon: "Constructora Pacífico", compra: false, neto: 9800000, iva: 1862000, total: 11662000, status: "pendiente" as const },
        { tipo: "33", folio: "CP401", per: periodo(2026,1), fecha: dateStr(2026,1,6), rut: "80.333.444-5", razon: "Aceros Arequipa Chile", compra: true, neto: 4500000, iva: 855000, total: 5355000, status: "pendiente" as const },
        { tipo: "33", folio: "CP402", per: periodo(2026,1), fecha: dateStr(2026,1,10), rut: "81.555.666-7", razon: "Maquinarias del Norte Ltda", compra: true, neto: 8800000, iva: 1672000, total: 10472000, status: "pendiente" as const },
        { tipo: "56", folio: "ND201", per: periodo(2026,1), fecha: dateStr(2026,1,18), rut: "77.891.234-5", razon: "Constructora Pacífico", compra: false, neto: 350000, iva: 66500, total: 416500, status: "pendiente" as const },
      ]},
      // Cliente 3 — 10 documentos
      { clienteId: cliente3, docs: [
        { tipo: "39", folio: "BC001", per: periodo(2025,12), fecha: dateStr(2025,12,2), rut: "76.112.345-8", razon: "Café Artesanal Sur", compra: false, neto: 168067, iva: 31933, total: 200000, status: "aprobado" as const },
        { tipo: "39", folio: "BC002", per: periodo(2025,12), fecha: dateStr(2025,12,9), rut: "76.112.345-8", razon: "Café Artesanal Sur", compra: false, neto: 252101, iva: 47899, total: 300000, status: "aprobado" as const },
        { tipo: "33", folio: "FC001", per: periodo(2025,12), fecha: dateStr(2025,12,15), rut: "76.112.345-8", razon: "Café Artesanal Sur", compra: false, neto: 420000, iva: 79800, total: 499800, status: "aprobado" as const },
        { tipo: "33", folio: "PC01", per: periodo(2025,12), fecha: dateStr(2025,12,5), rut: "82.777.888-9", razon: "Importadora Café Verde Ltda", compra: true, neto: 350000, iva: 66500, total: 416500, status: "aprobado" as const },
        { tipo: "33", folio: "PC02", per: periodo(2025,12), fecha: dateStr(2025,12,20), rut: "83.999.000-1", razon: "Envases Ecológicos SpA", compra: true, neto: 85000, iva: 16150, total: 101150, status: "clasificado" as const },
        { tipo: "39", folio: "BC003", per: periodo(2026,1), fecha: dateStr(2026,1,5), rut: "76.112.345-8", razon: "Café Artesanal Sur", compra: false, neto: 336134, iva: 63866, total: 400000, status: "clasificado" as const },
        { tipo: "33", folio: "FC002", per: periodo(2026,1), fecha: dateStr(2026,1,12), rut: "76.112.345-8", razon: "Café Artesanal Sur", compra: false, neto: 580000, iva: 110200, total: 690200, status: "pendiente" as const },
        { tipo: "39", folio: "BC004", per: periodo(2026,1), fecha: dateStr(2026,1,18), rut: "76.112.345-8", razon: "Café Artesanal Sur", compra: false, neto: 210084, iva: 39916, total: 250000, status: "pendiente" as const },
        { tipo: "33", folio: "PC03", per: periodo(2026,1), fecha: dateStr(2026,1,8), rut: "82.777.888-9", razon: "Importadora Café Verde Ltda", compra: true, neto: 420000, iva: 79800, total: 499800, status: "pendiente" as const },
        { tipo: "33", folio: "PC04", per: periodo(2026,1), fecha: dateStr(2026,1,22), rut: "83.999.000-1", razon: "Envases Ecológicos SpA", compra: true, neto: 95000, iva: 18050, total: 113050, status: "pendiente" as const },
      ]},
    ];

    const docIdsByCliente: Record<string, any[]> = {};
    for (const set of docSets) {
      const ids: any[] = [];
      for (const d of set.docs) {
        const docId = await ctx.db.insert("documentos", {
          cliente_id: set.clienteId,
          tipo_documento: d.tipo,
          folio: d.folio,
          periodo: d.per,
          fecha_emision: d.fecha,
          rut_emisor: d.rut,
          razon_social_emisor: d.razon,
          es_compra: d.compra,
          monto_neto: d.neto,
          monto_iva: d.iva,
          monto_total: d.total,
          status: d.status,
          created_at: now,
        });
        ids.push(docId);
      }
      docIdsByCliente[set.clienteId] = ids;
    }

    // ═══════════════════════════════════════════════════════
    // 5. F29 CALCULATIONS
    // ═══════════════════════════════════════════════════════
    const f29Sets = [
      { clienteId: cliente1, calcs: [
        { per: periodo(2025,11), debito: 253466, credito: 98800, ppm: 13340, remanente: 0, total: 141326, status: "enviado" as const },
        { per: periodo(2025,12), debito: 205200, credito: 81700, ppm: 11300, total: 112200, remanente: 0, status: "validado" as const },
        { per: periodo(2026,1), debito: 187533, credito: 127300, ppm: 9870, total: 51103, remanente: 0, status: "borrador" as const },
      ]},
      { clienteId: cliente2, calcs: [
        { per: periodo(2025,10), debito: 4845000, credito: 1653000, ppm: 352500, total: 2839500, remanente: 0, status: "enviado" as const },
        { per: periodo(2025,11), debito: 3477000, credito: 2280000, ppm: 282000, total: 915000, remanente: 0, status: "enviado" as const },
        { per: periodo(2025,12), debito: 4978000, credito: 1159000, ppm: 345000, total: 3474000, remanente: 0, status: "validado" as const },
        { per: periodo(2026,1), debito: 6108500, credito: 2527000, ppm: 477000, total: 3104500, remanente: 0, status: "borrador" as const },
      ]},
      { clienteId: cliente3, calcs: [
        { per: periodo(2025,12), debito: 159632, credito: 82650, ppm: 4200, total: 72782, remanente: 0, status: "enviado" as const },
        { per: periodo(2026,1), debito: 213982, credito: 97850, ppm: 6650, total: 109482, remanente: 0, status: "borrador" as const },
      ]},
    ];

    for (const set of f29Sets) {
      for (const f of set.calcs) {
        const f29Id = await ctx.db.insert("f29_calculos", {
          cliente_id: set.clienteId, periodo: f.per,
          total_debito_fiscal: f.debito, total_credito_fiscal: f.credito,
          ppm_determinado: f.ppm, remanente_anterior: f.remanente,
          total_a_pagar: f.total, status: f.status, created_at: now,
        });
        await ctx.db.insert("f29_codigos", { f29_calculo_id: f29Id, codigo: 91, descripcion: "Ventas afectas", monto_neto: Math.round(f.debito / 0.19) });
        await ctx.db.insert("f29_codigos", { f29_calculo_id: f29Id, codigo: 89, descripcion: "Débito fiscal", monto_iva: f.debito });
        await ctx.db.insert("f29_codigos", { f29_calculo_id: f29Id, codigo: 520, descripcion: "Crédito fiscal", monto_iva: f.credito });
        await ctx.db.insert("f29_codigos", { f29_calculo_id: f29Id, codigo: 547, descripcion: "PPM obligatorio", monto_iva: f.ppm });
      }
    }

    // ═══════════════════════════════════════════════════════
    // 6. BANK ACCOUNTS + TRANSACTIONS
    // ═══════════════════════════════════════════════════════
    await ctx.db.insert("bancos_cuentas", { cliente_id: cliente1, banco: "bancoestado", tipo_cuenta: "corriente", numero_cuenta: "0012345678", moneda: "CLP", alias: "Cuenta Principal", saldo_actual: 4850000, activa: true, created_at: now, updated_at: now });
    await ctx.db.insert("bancos_cuentas", { cliente_id: cliente2, banco: "bancochile", tipo_cuenta: "corriente", numero_cuenta: "0087654321", moneda: "CLP", alias: "Cuenta Operaciones", saldo_actual: 45200000, activa: true, created_at: now, updated_at: now });
    await ctx.db.insert("bancos_cuentas", { cliente_id: cliente2, banco: "santander", tipo_cuenta: "vista", numero_cuenta: "0055443322", moneda: "CLP", alias: "Cuenta Vista", saldo_actual: 3500000, activa: true, created_at: now, updated_at: now });
    await ctx.db.insert("bancos_cuentas", { cliente_id: cliente3, banco: "santander", tipo_cuenta: "corriente", numero_cuenta: "0099887766", moneda: "CLP", alias: "Cuenta Café", saldo_actual: 1200000, activa: true, created_at: now, updated_at: now });

    const txSets = [
      { clienteId: cliente1, banco: "bancoestado", txs: [
        { fecha: dateStr(2025,11,5), desc: "ABONO TRANSFER SUPERMERCADOS UNIMARC", monto: 595000, tipo: "abono" as const, cat: "ventas", rec: true },
        { fecha: dateStr(2025,11,8), desc: "CARGO TRANSFER PROVEEDOR ALIMENTOS SA", monto: -476000, tipo: "cargo" as const, cat: "compras", rec: true },
        { fecha: dateStr(2025,11,12), desc: "ABONO TRANSFER RESTAURANT EL BUEN SABOR", monto: 892500, tipo: "abono" as const, cat: "ventas", rec: true },
        { fecha: dateStr(2025,11,15), desc: "ABONO VENTA TRANSBANK", monto: 100000, tipo: "abono" as const, cat: "ventas", rec: true },
        { fecha: dateStr(2025,11,18), desc: "CARGO PAC LUZ ENEL", monto: -85000, tipo: "cargo" as const, cat: "servicios", rec: false },
        { fecha: dateStr(2025,11,20), desc: "CARGO TRANSFER TRANSPORTES DEL SUR", monto: -142800, tipo: "cargo" as const, cat: "compras", rec: true },
        { fecha: dateStr(2025,11,25), desc: "CARGO REMUNERACIONES NOV", monto: -1200000, tipo: "cargo" as const, cat: "remuneraciones", rec: false },
        { fecha: dateStr(2025,12,3), desc: "ABONO TRANSFER MINIMARKET DON PEPE", monto: 809200, tipo: "abono" as const, cat: "ventas", rec: true },
        { fecha: dateStr(2025,12,5), desc: "CARGO TRANSFER PROVEEDOR ALIMENTOS SA", monto: -416500, tipo: "cargo" as const, cat: "compras", rec: true },
        { fecha: dateStr(2025,12,10), desc: "ABONO TRANSFER HOTEL PLAZA", monto: 535500, tipo: "abono" as const, cat: "ventas", rec: false },
        { fecha: dateStr(2025,12,15), desc: "ABONO NC AJUSTE", monto: -59500, tipo: "cargo" as const, cat: "ajustes", rec: true },
        { fecha: dateStr(2025,12,25), desc: "CARGO REMUNERACIONES DIC", monto: -1200000, tipo: "cargo" as const, cat: "remuneraciones", rec: false },
        { fecha: dateStr(2026,1,5), desc: "CARGO TRANSFER PROVEEDOR ALIMENTOS SA", monto: -618800, tipo: "cargo" as const, cat: "compras", rec: false },
        { fecha: dateStr(2026,1,8), desc: "ABONO TRANSFER NATURAL FOODS", monto: 1094800, tipo: "abono" as const, cat: "ventas", rec: false },
        { fecha: dateStr(2026,1,10), desc: "ABONO VENTA TRANSBANK", monto: 50000, tipo: "abono" as const, cat: "ventas", rec: false },
        { fecha: dateStr(2026,1,12), desc: "CARGO TRANSFER TRANSPORTES DEL SUR", monto: -178500, tipo: "cargo" as const, cat: "compras", rec: false },
        { fecha: dateStr(2026,1,15), desc: "CARGO COMISION BANCARIA", monto: -12500, tipo: "cargo" as const, cat: "gastos_bancarios", rec: false },
        { fecha: dateStr(2026,1,20), desc: "CARGO PAC AGUA SMAPA", monto: -42000, tipo: "cargo" as const, cat: "servicios", rec: false },
        { fecha: dateStr(2026,1,25), desc: "CARGO REMUNERACIONES ENE", monto: -1250000, tipo: "cargo" as const, cat: "remuneraciones", rec: false },
        { fecha: dateStr(2026,1,28), desc: "CARGO PAGO PREVIRED", monto: -395000, tipo: "cargo" as const, cat: "prevision", rec: false },
      ]},
      { clienteId: cliente3, banco: "santander", txs: [
        { fecha: dateStr(2025,12,2), desc: "ABONO VENTA TRANSBANK POS", monto: 200000, tipo: "abono" as const, cat: "ventas", rec: true },
        { fecha: dateStr(2025,12,5), desc: "CARGO TRANSFER IMPORTADORA CAFE VERDE", monto: -416500, tipo: "cargo" as const, cat: "compras", rec: true },
        { fecha: dateStr(2025,12,9), desc: "ABONO VENTA TRANSBANK POS", monto: 300000, tipo: "abono" as const, cat: "ventas", rec: true },
        { fecha: dateStr(2025,12,15), desc: "ABONO TRANSFER HOTEL BOUTIQUE VALDIVIA", monto: 499800, tipo: "abono" as const, cat: "ventas", rec: true },
        { fecha: dateStr(2025,12,20), desc: "CARGO TRANSFER ENVASES ECOLOGICOS", monto: -101150, tipo: "cargo" as const, cat: "compras", rec: false },
        { fecha: dateStr(2025,12,25), desc: "CARGO REMUNERACIONES DIC", monto: -450000, tipo: "cargo" as const, cat: "remuneraciones", rec: false },
        { fecha: dateStr(2026,1,5), desc: "ABONO VENTA TRANSBANK POS", monto: 400000, tipo: "abono" as const, cat: "ventas", rec: false },
        { fecha: dateStr(2026,1,8), desc: "CARGO TRANSFER IMPORTADORA CAFE VERDE", monto: -499800, tipo: "cargo" as const, cat: "compras", rec: false },
        { fecha: dateStr(2026,1,12), desc: "ABONO TRANSFER CAFE DELIVERY APP", monto: 690200, tipo: "abono" as const, cat: "ventas", rec: false },
        { fecha: dateStr(2026,1,18), desc: "ABONO VENTA TRANSBANK POS", monto: 250000, tipo: "abono" as const, cat: "ventas", rec: false },
        { fecha: dateStr(2026,1,22), desc: "CARGO TRANSFER ENVASES ECOLOGICOS", monto: -113050, tipo: "cargo" as const, cat: "compras", rec: false },
        { fecha: dateStr(2026,1,25), desc: "CARGO REMUNERACIONES ENE", monto: -480000, tipo: "cargo" as const, cat: "remuneraciones", rec: false },
      ]},
    ];

    const txIdsByCliente: Record<string, any[]> = {};
    for (const set of txSets) {
      const ids: any[] = [];
      for (const tx of set.txs) {
        const txId = await ctx.db.insert("bancos_transacciones", {
          cliente_id: set.clienteId, banco: set.banco, fecha: tx.fecha,
          descripcion: tx.desc, monto: tx.monto, tipo: tx.tipo,
          categoria: tx.cat, moneda: "CLP", monto_clp: tx.monto,
          reconciliado: tx.rec, estado_conciliacion: tx.rec ? "matched" : "pending",
          created_at: now,
        });
        ids.push(txId);
      }
      txIdsByCliente[set.clienteId] = ids;
    }

    // ═══════════════════════════════════════════════════════
    // 7. CONCILIACIONES
    // ═══════════════════════════════════════════════════════
    const matchPairs = [
      { cId: cliente1, tx: 0, doc: 0, conf: 0.95 }, { cId: cliente1, tx: 1, doc: 3, conf: 0.98 },
      { cId: cliente1, tx: 2, doc: 1, conf: 0.92 }, { cId: cliente1, tx: 3, doc: 2, conf: 0.88 },
      { cId: cliente1, tx: 5, doc: 4, conf: 0.97 }, { cId: cliente1, tx: 7, doc: 5, conf: 0.91 },
      { cId: cliente1, tx: 8, doc: 8, conf: 0.96 }, { cId: cliente1, tx: 10, doc: 7, conf: 0.85 },
      { cId: cliente3, tx: 0, doc: 0, conf: 0.94 }, { cId: cliente3, tx: 1, doc: 3, conf: 0.97 },
      { cId: cliente3, tx: 2, doc: 1, conf: 0.93 }, { cId: cliente3, tx: 3, doc: 2, conf: 0.90 },
      { cId: cliente3, tx: 4, doc: 4, conf: 0.72 },
    ];

    for (const m of matchPairs) {
      const txIds = txIdsByCliente[m.cId];
      const docIds = docIdsByCliente[m.cId];
      if (txIds?.[m.tx] && docIds?.[m.doc]) {
        await ctx.db.insert("conciliaciones", {
          transaccion_id: txIds[m.tx], documento_id: docIds[m.doc],
          cliente_id: m.cId, confianza: m.conf,
          estado: m.conf > 0.8 ? "matched" : "partial",
          diferencia_monto: 0, diferencia_dias: Math.floor(Math.random() * 3),
          match_reasons: ["monto_exacto", "fecha_cercana", "rut_match"],
          created_at: now,
        });
      }
    }

    // ═══════════════════════════════════════════════════════
    // 8. BOTS + JOBS
    // ═══════════════════════════════════════════════════════
    const botClasificador = await ctx.db.insert("bot_definiciones", { nombre: "Clasificador de Documentos", portal: "interno", descripcion: "Clasifica documentos tributarios con ML", frecuencia_default: "al_ingresar", activo: true, created_at: now });
    const botConciliador = await ctx.db.insert("bot_definiciones", { nombre: "Conciliador Bancario", portal: "banco", descripcion: "Concilia transacciones con documentos", frecuencia_default: "diario", activo: true, created_at: now });
    const botF29 = await ctx.db.insert("bot_definiciones", { nombre: "Preparador F29", portal: "sii", descripcion: "Prepara formulario F29", frecuencia_default: "mensual", activo: true, created_at: now });

    for (const c of clientes) {
      for (const bot of [botClasificador, botConciliador, botF29]) {
        await ctx.db.insert("bot_jobs", { bot_id: bot, cliente_id: c.id, status: "completado", resultado: { documentos_procesados: 15, exitosos: 14, errores: 1 }, triggered_by: "scheduler", started_at: isoDate(7), completed_at: isoDate(7), created_at: isoDate(7) });
        await ctx.db.insert("bot_jobs", { bot_id: bot, cliente_id: c.id, status: "completado", resultado: { documentos_procesados: 12, exitosos: 12, errores: 0 }, triggered_by: "scheduler", started_at: isoDate(1), completed_at: isoDate(1), created_at: isoDate(1) });
      }
    }

    // ═══════════════════════════════════════════════════════
    // 9. PROCESSES + TASKS
    // ═══════════════════════════════════════════════════════
    for (const c of clientes) {
      const pOnboard = await ctx.db.insert("procesos", { nombre: "Onboarding Cliente", tipo: "onboarding_cliente", cliente_id: c.id, estado: "completado", fecha_inicio: isoDate(30), created_at: isoDate(30) });
      await ctx.db.insert("tareas", { titulo: "Configurar datos básicos", proceso_id: pOnboard, estado: "completada", prioridad: "alta", orden: 1, created_at: isoDate(30) });
      await ctx.db.insert("tareas", { titulo: "Asignar plan de cuentas", proceso_id: pOnboard, estado: "completada", prioridad: "alta", orden: 2, created_at: isoDate(28) });

      const pCierre = await ctx.db.insert("procesos", { nombre: "Cierre Mensual Enero 2026", tipo: "contabilidad_mensual", cliente_id: c.id, periodo: periodo(2026, 1), estado: "activo", fecha_inicio: isoDate(5), fecha_limite: dateStr(2026, 2, 20), created_at: isoDate(5) });
      await ctx.db.insert("tareas", { titulo: "Revisar documentos pendientes", proceso_id: pCierre, estado: "en_progreso", prioridad: "alta", orden: 1, fecha_limite: dateStr(2026, 2, 10), created_at: isoDate(5) });
      await ctx.db.insert("tareas", { titulo: "Completar conciliación bancaria", proceso_id: pCierre, estado: "pendiente", prioridad: "media", orden: 2, fecha_limite: dateStr(2026, 2, 15), created_at: isoDate(5) });
      await ctx.db.insert("tareas", { titulo: "Preparar y enviar F29", proceso_id: pCierre, estado: "pendiente", prioridad: "urgente", orden: 3, fecha_limite: dateStr(2026, 2, 20), created_at: isoDate(5) });
    }

    // ═══════════════════════════════════════════════════════
    // 10. ALERTAS / ANOMALÍAS
    // ═══════════════════════════════════════════════════════
    await ctx.db.insert("alertas_anomalias", { cliente_id: cliente1, tipo: "posible_duplicado", severidad: "alta", titulo: "Posible factura duplicada", descripcion: "La factura 1002 tiene monto similar a la 1001 en el mismo período", estado: "abierta", monto_referencia: 595000, monto_detectado: 892500, created_at: isoDate(10) });
    await ctx.db.insert("alertas_anomalias", { cliente_id: cliente2, tipo: "monto_inusual", severidad: "media", titulo: "Monto inusualmente alto", descripcion: "La factura F2007 por $22.000.000 supera el promedio en 180%", estado: "abierta", monto_referencia: 12000000, monto_detectado: 22000000, created_at: isoDate(5) });
    await ctx.db.insert("alertas_anomalias", { cliente_id: cliente2, tipo: "proveedor_nuevo", severidad: "baja", titulo: "Nuevo proveedor detectado", descripcion: "Primera transacción con Maquinarias del Norte Ltda (81.555.666-7)", estado: "revisada", created_at: isoDate(20) });
    await ctx.db.insert("alertas_anomalias", { cliente_id: cliente3, tipo: "conciliacion_fallida", severidad: "media", titulo: "Transacción sin match", descripcion: "Cargo de $113.050 a Envases Ecológicos sin documento asociado", estado: "abierta", monto_detectado: 113050, created_at: isoDate(3) });

    // ═══════════════════════════════════════════════════════
    // 11. CREDENCIALES PORTALES
    // ═══════════════════════════════════════════════════════
    for (const c of clientes) {
      await ctx.db.insert("credenciales_portales", { cliente_id: c.id, portal: "SII_MIPYME", usuario_encriptado: `enc_${c.rut}_user`, password_encriptado: `enc_${c.rut}_pass`, activo: true, validacion_exitosa: true, ultima_validacion: isoDate(2), created_at: now, updated_at: now });
    }
    await ctx.db.insert("credenciales_portales", { cliente_id: cliente1, portal: "BANCO_ESTADO", usuario_encriptado: "enc_be_user", password_encriptado: "enc_be_pass", activo: true, validacion_exitosa: true, ultima_validacion: isoDate(1), created_at: now, updated_at: now });
    await ctx.db.insert("credenciales_portales", { cliente_id: cliente2, portal: "BANCO_CHILE", usuario_encriptado: "enc_bch_user", password_encriptado: "enc_bch_pass", activo: true, validacion_exitosa: true, ultima_validacion: isoDate(1), created_at: now, updated_at: now });

    // ═══════════════════════════════════════════════════════
    // 12. TIPOS DE CAMBIO (últimos 30 días)
    // ═══════════════════════════════════════════════════════
    const currencies = [
      { moneda: "USD" as const, base: 950, var: 15 },
      { moneda: "EUR" as const, base: 1030, var: 20 },
      { moneda: "UF" as const, base: 38200, var: 50 },
    ];
    for (let i = 0; i < 30; i++) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const f = d.toISOString().split("T")[0];
      for (const curr of currencies) {
        await ctx.db.insert("tipos_cambio", { moneda: curr.moneda, fecha: f, valor: Math.round((curr.base + (Math.random() - 0.5) * 2 * curr.var) * 100) / 100, fuente: "SII", created_at: now });
      }
    }

    // ═══════════════════════════════════════════════════════
    // 13. REGLAS DE CATEGORIZACIÓN
    // ═══════════════════════════════════════════════════════
    const reglasGlobales = [
      { nombre: "Remuneraciones", patron: "REMUNERACION", cat: "remuneraciones", prioridad: 10 },
      { nombre: "Previred", patron: "PREVIRED", cat: "prevision", prioridad: 10 },
      { nombre: "Comisiones bancarias", patron: "COMISION BANCARIA", cat: "gastos_bancarios", prioridad: 5 },
      { nombre: "PAC Servicios", patron: "PAC", cat: "servicios", prioridad: 3 },
      { nombre: "Transbank", patron: "TRANSBANK", cat: "ventas", prioridad: 8 },
    ];
    for (const r of reglasGlobales) {
      await ctx.db.insert("reglas_categorizacion", { nombre: r.nombre, patron: r.patron, tipo_patron: "contains", campo_aplicacion: "descripcion", categoria: r.cat, prioridad: r.prioridad, es_global: true, activa: true, veces_aplicada: Math.floor(Math.random() * 50) + 5, created_at: now });
    }
    await ctx.db.insert("reglas_categorizacion", { cliente_id: cliente1, nombre: "Proveedor Alimentos SA", patron: "PROVEEDOR ALIMENTOS", tipo_patron: "contains", campo_aplicacion: "descripcion", categoria: "compras", prioridad: 15, es_global: false, activa: true, veces_aplicada: 8, created_at: now });
    await ctx.db.insert("reglas_categorizacion", { cliente_id: cliente2, nombre: "Cementos Bio-Bio", patron: "79.111.222-3", tipo_patron: "exact", campo_aplicacion: "rut", categoria: "materiales", prioridad: 15, es_global: false, activa: true, veces_aplicada: 12, created_at: now });
    await ctx.db.insert("reglas_categorizacion", { cliente_id: cliente3, nombre: "Café Verde Import", patron: "CAFE VERDE", tipo_patron: "contains", campo_aplicacion: "descripcion", categoria: "materia_prima", prioridad: 15, es_global: false, activa: true, veces_aplicada: 5, created_at: now });

    // ═══════════════════════════════════════════════════════
    // 14. NOTIFICATIONS
    // ═══════════════════════════════════════════════════════
    const notifs = [
      { tipo: "bot_completado", titulo: "Bot ejecutado", mensaje: "El Clasificador procesó 15 documentos de Los Andes" },
      { tipo: "anomalia", titulo: "Anomalía detectada", mensaje: "Monto inusual en Constructora Pacífico" },
      { tipo: "f29_listo", titulo: "F29 listo", mensaje: "F29 enero 2026 de Café Sur está en borrador" },
    ];
    for (let i = 0; i < notifs.length; i++) {
      await ctx.db.insert("notificaciones", { usuario_id: profileIds[0], ...notifs[i], leida: i > 0, created_at: isoDate(i) });
    }

    return {
      success: true,
      message: "Datos de demostración cargados exitosamente",
      clientes: 3,
      documentos: docSets.reduce((sum, s) => sum + s.docs.length, 0),
      transacciones: txSets.reduce((sum, s) => sum + s.txs.length, 0),
    };
  },
});

// ─── Clear Demo Data ─────────────────────────────────────
export const clearDemoData = mutation({
  args: {},
  handler: async (ctx) => {
    const tables = [
      "comentarios_tarea", "tareas", "procesos",
      "bot_logs", "bot_jobs", "bot_definiciones",
      "alertas_anomalias", "conciliaciones", "patrones_conciliacion",
      "bancos_transacciones", "bancos_cuentas",
      "f29_validaciones", "f29_codigos", "f29_calculos",
      "clasificaciones_ml", "feedback_clasificacion", "documentos",
      "cuentas_contables", "planes_cuenta",
      "reglas_categorizacion", "credenciales_portales", "tipos_cambio",
      "pipeline_runs", "notificaciones",
      "user_roles", "roles",
      "clientes",
    ] as const;

    let totalDeleted = 0;
    for (const table of tables) {
      const rows = await ctx.db.query(table).collect();
      for (const row of rows) {
        await ctx.db.delete(row._id);
        totalDeleted++;
      }
    }

    return { success: true, message: "Datos eliminados", registros_eliminados: totalDeleted };
  },
});

// Backward-compatible alias
export const seedAll = seedDemoData;
