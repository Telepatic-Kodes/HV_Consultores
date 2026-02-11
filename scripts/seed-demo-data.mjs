#!/usr/bin/env node
/**
 * Seed script: Populates Convex with realistic demo data for HV Consultores.
 * Usage: node scripts/seed-demo-data.mjs
 */
import { ConvexHttpClient } from "convex/browser";
import { anyApi as api } from "convex/server";

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL
  || "https://hallowed-starfish-656.convex.cloud";

const convex = new ConvexHttpClient(CONVEX_URL);

// ─── Helpers ───────────────────────────────────────────────
function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ─── 1. Clients ───────────────────────────────────────────
console.log("🏢 Creating clients...");

const clientsData = [
  { razon_social: "Importadora Tech Chile SpA", rut: "76.543.210-K", nombre_fantasia: "TechChile", giro: "Importación de equipos tecnológicos", direccion: "Av. Providencia 1234, Of. 501", comuna: "Providencia", region: "Metropolitana", regimen_tributario: "14A", tasa_ppm: 1.0, activo: true },
  { razon_social: "Restaurantes del Sur Ltda", rut: "77.888.999-5", nombre_fantasia: "Del Sur", giro: "Restaurantes y servicios de catering", direccion: "O'Higgins 567", comuna: "Temuco", region: "Araucanía", regimen_tributario: "14D", tasa_ppm: 0.25, activo: true },
  { razon_social: "Constructora Andes SA", rut: "96.123.456-7", nombre_fantasia: "Andes", giro: "Construcción de obras civiles", direccion: "Los Militares 4567, Piso 12", comuna: "Las Condes", region: "Metropolitana", regimen_tributario: "14A", tasa_ppm: 1.5, activo: true },
  { razon_social: "Distribuidora Natural EIRL", rut: "78.654.321-0", nombre_fantasia: "Natural", giro: "Distribución de productos orgánicos", direccion: "Av. Matta 890", comuna: "Santiago Centro", region: "Metropolitana", regimen_tributario: "14D_N3", tasa_ppm: 0.25, activo: true },
  { razon_social: "Consultora Pacífico SpA", rut: "76.999.888-1", nombre_fantasia: "Pacífico", giro: "Consultoría empresarial", direccion: "Av. Apoquindo 3200", comuna: "Las Condes", region: "Metropolitana", regimen_tributario: "14D_N8", tasa_ppm: 0.5, activo: true },
  { razon_social: "Transportes Ruta Norte Ltda", rut: "77.111.222-3", nombre_fantasia: "Ruta Norte", giro: "Transporte de carga terrestre", direccion: "Ruta 5 Norte Km 45", comuna: "Coquimbo", region: "Coquimbo", regimen_tributario: "14A", tasa_ppm: 1.0, activo: false },
];

const clientIds = [];
for (const c of clientsData) {
  const id = await convex.mutation(api.clients.createClient, c);
  clientIds.push(id);
  console.log(`  ✓ ${c.nombre_fantasia} (${c.rut})`);
}

// ─── 2. Bot Definitions + Jobs ────────────────────────────
console.log("\n🤖 Creating bots...");

const botsData = [
  { nombre: "HV-SII", portal: "SII", descripcion: "Descarga DTE desde el SII", frecuencia_default: "diaria", activo: true },
  { nombre: "HV-Banco", portal: "Bancos", descripcion: "Descarga cartolas bancarias", frecuencia_default: "diaria", activo: true },
  { nombre: "HV-Previred", portal: "Previred", descripcion: "Descarga planillas previsionales", frecuencia_default: "mensual", activo: true },
  { nombre: "HV-TGR", portal: "TGR", descripcion: "Consulta deudas fiscales", frecuencia_default: "semanal", activo: true },
];

const botIds = [];
for (const b of botsData) {
  const id = await convex.mutation(api.bots.createBotDefinicion, b);
  botIds.push(id);
  console.log(`  ✓ ${b.nombre}`);
}

// Create bot jobs
const jobStatuses = ["completado", "completado", "completado", "fallido", "pendiente"];
let jobCount = 0;
for (let day = 0; day < 10; day++) {
  for (const botId of botIds) {
    if (Math.random() > 0.5) continue; // Not every bot runs every day
    const jobId = await convex.mutation(api.bots.createJob, {
      bot_id: botId,
      cliente_id: randomItem(clientIds.slice(0, 5)),
      triggered_by: "scheduled",
    });
    // Update status
    const status = randomItem(jobStatuses);
    await convex.mutation(api.bots.updateJobStatus, {
      id: jobId,
      status,
    });
    jobCount++;
  }
}
console.log(`  ✓ ${jobCount} bot jobs`);

// ─── 3. Documents ─────────────────────────────────────────
console.log("\n📄 Creating documents...");

const tiposDoc = ["FACTURA_ELECTRONICA", "BOLETA_ELECTRONICA", "NOTA_CREDITO", "NOTA_DEBITO", "FACTURA_COMPRA", "FACTURA_EXENTA", "GUIA_DESPACHO"];
const proveedores = [
  { rut: "76.000.001-1", razon: "Sodimac SA", giro: "Ferretería" },
  { rut: "76.000.002-2", razon: "Copec SA", giro: "Combustibles" },
  { rut: "76.000.003-3", razon: "Entel PCS", giro: "Telecomunicaciones" },
  { rut: "76.000.004-4", razon: "Enel Distribución", giro: "Electricidad" },
  { rut: "76.000.005-5", razon: "Aguas Andinas", giro: "Agua potable" },
  { rut: "76.000.006-6", razon: "Office Depot Chile", giro: "Material de oficina" },
  { rut: "76.000.007-7", razon: "Walmart Chile", giro: "Supermercado" },
  { rut: "76.000.008-8", razon: "Google Cloud Chile", giro: "Servicios cloud" },
  { rut: "76.000.009-9", razon: "AWS Chile SpA", giro: "Servicios cloud" },
  { rut: "76.000.010-0", razon: "Falabella Retail", giro: "Retail" },
];

let docCount = 0;
const docIds = [];
for (let day = 0; day < 14; day++) {
  const numDocs = randomInt(3, 8);
  for (let i = 0; i < numDocs; i++) {
    const clienteId = randomItem(clientIds.slice(0, 5));
    const prov = randomItem(proveedores);
    const tipo = randomItem(tiposDoc);
    const neto = randomInt(50000, 5000000);
    const iva = Math.round(neto * 0.19);
    const total = neto + iva;

    const id = await convex.mutation(api.documents.createDocument, {
      cliente_id: clienteId,
      tipo_documento: tipo,
      folio: String(randomInt(10000, 99999)),
      periodo: "2026-02",
      fecha_emision: daysAgo(day).split("T")[0],
      rut_emisor: prov.rut,
      razon_social_emisor: prov.razon,
      giro_emisor: prov.giro,
      glosa: `Servicios ${prov.giro.toLowerCase()}`,
      es_compra: Math.random() > 0.3,
      monto_neto: neto,
      monto_iva: iva,
      monto_total: total,
      confidence_score: Math.random() * 0.3 + 0.7,
    });
    docIds.push(id);
    docCount++;
  }
}
console.log(`  ✓ ${docCount} documentos (14 días)`);

// Update some to classified status
const statusUpdates = ["clasificado", "revisado", "aprobado", "exportado"];
let classifiedCount = 0;
for (const docId of docIds) {
  if (Math.random() > 0.55) continue;
  await convex.mutation(api.documents.updateDocument, {
    id: docId,
    status: randomItem(statusUpdates),
  });
  classifiedCount++;
}
console.log(`  ✓ ${classifiedCount} documentos con estado actualizado`);

// ─── 4. F29 Submissions ──────────────────────────────────
console.log("\n📊 Creating F29...");

const periodos = ["2025-09", "2025-10", "2025-11", "2025-12", "2026-01", "2026-02"];
let f29Count = 0;
for (const clientId of clientIds.slice(0, 5)) {
  for (let i = 0; i < periodos.length; i++) {
    const periodo = periodos[i];
    const debitoFiscal = randomInt(500000, 8000000);
    const creditoFiscal = randomInt(300000, 6000000);
    const ppm = randomInt(50000, 500000);
    const totalPagar = Math.max(0, debitoFiscal - creditoFiscal + ppm);

    const f29Id = await convex.mutation(api.f29.createSubmission, {
      cliente_id: clientId,
      periodo,
      total_debito_fiscal: debitoFiscal,
      total_credito_fiscal: creditoFiscal,
      ppm_determinado: ppm,
      total_a_pagar: totalPagar,
    });

    // Older periods → enviado, recent → borrador/calculado
    const targetStatus = i < 4 ? "enviado" : (i === 4 ? "calculado" : "borrador");
    if (targetStatus !== "borrador") {
      await convex.mutation(api.f29.updateSubmissionStatus, {
        id: f29Id,
        status: targetStatus,
      });
    }
    f29Count++;
  }
}
console.log(`  ✓ ${f29Count} F29 submissions`);

// ─── 5. Bank Transactions ────────────────────────────────
console.log("\n🏦 Creating bank transactions...");

const bancos = ["bancochile", "bancoestado", "santander", "bci"];
const categorias = ["Servicios básicos", "Arriendos", "Sueldos", "Proveedores", "Impuestos", "Seguros", "Honorarios", "Materiales", "Transporte", "Publicidad"];
const txDescs = ["PAG PROVEEDOR", "TRANSF RECIBIDA", "CARGO AUTOMATICO", "ABONO CLIENTE", "PAG NOMINA", "PAG IMPUESTOS SII", "PAG ARRIENDO", "CARGO TARJETA", "DEPOSITO EFECTIVO", "TRANSF ENVIADA", "PAG LUZ/AGUA", "COMISION BANCARIA"];

let txCount = 0;
for (let day = 0; day < 30; day++) {
  const numTx = randomInt(4, 12);
  for (let i = 0; i < numTx; i++) {
    const clientId = randomItem(clientIds.slice(0, 5));
    const esAbono = Math.random() > 0.45;
    const monto = esAbono ? randomInt(100000, 15000000) : -randomInt(50000, 8000000);
    const matched = day > 7 ? Math.random() > 0.3 : Math.random() > 0.7;
    const estado = matched ? "matched" : (Math.random() > 0.8 ? "unmatched" : "pending");

    await convex.mutation(api.banks.createTransaction, {
      cliente_id: clientId,
      banco: randomItem(bancos),
      fecha: daysAgo(day).split("T")[0],
      descripcion: randomItem(txDescs),
      monto,
      categoria: randomItem(categorias),
      reconciliado: matched,
      tipo: esAbono ? "abono" : "cargo",
      moneda: "CLP",
      monto_clp: Math.abs(monto),
      estado_conciliacion: estado,
    });
    txCount++;
  }
}
console.log(`  ✓ ${txCount} transacciones bancarias (30 días)`);

// ─── 6. Exchange Rates ───────────────────────────────────
console.log("\n💱 Creating exchange rates...");

let rateCount = 0;
for (let day = 0; day < 30; day++) {
  const fecha = daysAgo(day).split("T")[0];
  await convex.mutation(api.currency.setExchangeRate, { moneda: "UF", fecha, valor: 38500 + randomInt(-500, 500), fuente: "SII" });
  await convex.mutation(api.currency.setExchangeRate, { moneda: "USD", fecha, valor: 920 + randomInt(-30, 30), fuente: "CMF" });
  await convex.mutation(api.currency.setExchangeRate, { moneda: "EUR", fecha, valor: 980 + randomInt(-40, 40), fuente: "CMF" });
  rateCount += 3;
}
console.log(`  ✓ ${rateCount} tipos de cambio`);

// ─── 7. Anomaly Alerts ───────────────────────────────────
console.log("\n🚨 Creating alerts...");

const alertTypes = [
  { tipo: "monto_inusual", titulo: "Monto inusual detectado", severidad: "alta" },
  { tipo: "proveedor_nuevo", titulo: "Proveedor nuevo sin historial", severidad: "media" },
  { tipo: "posible_duplicado", titulo: "Posible factura duplicada", severidad: "alta" },
  { tipo: "patron_diferente", titulo: "Patrón de gasto diferente", severidad: "baja" },
  { tipo: "conciliacion_fallida", titulo: "Conciliación automática fallida", severidad: "media" },
];

for (let i = 0; i < 12; i++) {
  const alert = randomItem(alertTypes);
  const clientId = randomItem(clientIds.slice(0, 5));
  const montoRef = randomInt(100000, 5000000);

  await convex.mutation(api.anomalies.createAlert, {
    clienteId: clientId,
    tipo: alert.tipo,
    severidad: alert.severidad,
    titulo: alert.titulo,
    descripcion: `${alert.titulo} para cliente. Monto: $${montoRef.toLocaleString("es-CL")}`,
    montoReferencia: montoRef,
    montoDetectado: montoRef + randomInt(-50000, 200000),
  });
}
console.log(`  ✓ 12 alertas de anomalías`);

// ─── 8. Pipeline Runs ────────────────────────────────────
console.log("\n⚙️  Creating pipeline runs...");

for (let i = 0; i < 6; i++) {
  const clientId = randomItem(clientIds.slice(0, 5));
  const runId = await convex.mutation(api.pipeline.createPipelineRun, {
    clienteId: clientId,
    periodo: randomItem(periodos.slice(-3)),
  });

  // Advance pipeline through steps
  const stepsToAdvance = i < 4 ? 7 : randomInt(2, 5);
  for (let step = 0; step < stepsToAdvance; step++) {
    try {
      await convex.mutation(api.pipeline.advancePipeline, {
        runId: runId,
        stepResult: {
          transacciones_importadas: randomInt(10, 50),
          transacciones_normalizadas: randomInt(8, 45),
          transacciones_categorizadas: randomInt(5, 40),
          transacciones_matched: randomInt(3, 35),
          alertas_generadas: randomInt(0, 2),
          errores: 0,
        },
      });
    } catch {
      break; // Pipeline already completed
    }
  }
}
console.log(`  ✓ 6 pipeline runs`);

// ─── Summary ─────────────────────────────────────────────
console.log("\n════════════════════════════════════════════");
console.log("✅ Seed complete!");
console.log(`   ${clientIds.length} clientes`);
console.log(`   ${botIds.length} bot definitions + ${jobCount} jobs`);
console.log(`   ${docCount} documentos`);
console.log(`   ${f29Count} F29 submissions`);
console.log(`   ${txCount} transacciones bancarias`);
console.log(`   ${rateCount} tipos de cambio`);
console.log(`   12 alertas`);
console.log(`   6 pipeline runs`);
console.log("════════════════════════════════════════════");
