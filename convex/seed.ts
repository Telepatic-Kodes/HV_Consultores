// @ts-nocheck
import { mutation } from "./_generated/server";

/**
 * Seed data for demo/testing purposes.
 * Creates realistic Chilean accounting firm data.
 */
export const seedAll = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if already seeded
    const existing = await ctx.db.query("clientes").first();
    if (existing) {
      return { status: "already_seeded", message: "Data already exists" };
    }

    const now = new Date();
    const iso = (d: Date) => d.toISOString();
    const daysAgo = (n: number) =>
      new Date(now.getTime() - n * 24 * 60 * 60 * 1000);

    // ─── 1. Profiles ────────────────────────────────────────
    const profiles = [
      { nombre_completo: "Carlos Muñoz", cargo: "Jefe Contabilidad" },
      { nombre_completo: "Patricia Soto", cargo: "Contadora Senior" },
      { nombre_completo: "Roberto Díaz", cargo: "Contador" },
      { nombre_completo: "María Fernanda López", cargo: "Asistente Contable" },
      { nombre_completo: "Andrés Valenzuela", cargo: "Coordinador" },
    ];

    const profileIds: any[] = [];
    for (const p of profiles) {
      const id = await ctx.db.insert("profiles", {
        ...p,
        activo: true,
        created_at: iso(daysAgo(90)),
        updated_at: iso(now),
      });
      profileIds.push(id);
    }

    // ─── 2. Roles ───────────────────────────────────────────
    const adminRole = await ctx.db.insert("roles", {
      nombre: "admin",
      descripcion: "Administrador del sistema",
      created_at: iso(daysAgo(90)),
    });
    const contadorRole = await ctx.db.insert("roles", {
      nombre: "contador",
      descripcion: "Contador con acceso a documentos y F29",
      created_at: iso(daysAgo(90)),
    });

    await ctx.db.insert("user_roles", {
      user_id: profileIds[0],
      role_id: adminRole,
      assigned_at: iso(daysAgo(90)),
    });
    for (let i = 1; i < profileIds.length; i++) {
      await ctx.db.insert("user_roles", {
        user_id: profileIds[i],
        role_id: contadorRole,
        assigned_at: iso(daysAgo(90)),
      });
    }

    // ─── 3. Clients ─────────────────────────────────────────
    const clientData = [
      {
        razon_social: "Comercial Austral Ltda.",
        rut: "76.123.456-7",
        nombre_fantasia: "Austral Comercio",
        giro: "Comercio al por mayor",
        regimen_tributario: "14A" as const,
        tasa_ppm: 1.0,
      },
      {
        razon_social: "Transportes del Sur SpA",
        rut: "76.234.567-8",
        nombre_fantasia: "TransSur",
        giro: "Transporte de carga",
        regimen_tributario: "14D" as const,
        tasa_ppm: 0.25,
      },
      {
        razon_social: "Constructora Norte Grande S.A.",
        rut: "96.345.678-9",
        nombre_fantasia: "CNG",
        giro: "Construcción obras civiles",
        regimen_tributario: "14A" as const,
        tasa_ppm: 1.0,
      },
      {
        razon_social: "Alimentos Naturales Chile SpA",
        rut: "77.456.789-0",
        nombre_fantasia: "NaturChile",
        giro: "Fabricación de alimentos",
        regimen_tributario: "14D_N3" as const,
        tasa_ppm: 0.25,
      },
      {
        razon_social: "Servicios TI Innovación Ltda.",
        rut: "76.567.890-1",
        nombre_fantasia: "ITInnova",
        giro: "Desarrollo de software",
        regimen_tributario: "14D_N8" as const,
        tasa_ppm: 0.25,
      },
      {
        razon_social: "Agrícola Valle Central SpA",
        rut: "77.678.901-2",
        nombre_fantasia: "AgriValle",
        giro: "Agricultura y ganadería",
        regimen_tributario: "14D" as const,
        tasa_ppm: 0.25,
      },
      {
        razon_social: "Importadora Pacific Trade Ltda.",
        rut: "76.789.012-3",
        nombre_fantasia: "PacificTrade",
        giro: "Importación de productos",
        regimen_tributario: "14A" as const,
        tasa_ppm: 1.0,
      },
      {
        razon_social: "Clínica Dental Sonrisa SpA",
        rut: "77.890.123-4",
        nombre_fantasia: "Sonrisa",
        giro: "Servicios de salud dental",
        regimen_tributario: "14D_N3" as const,
        tasa_ppm: 0.25,
      },
    ];

    const clientIds: any[] = [];
    for (let i = 0; i < clientData.length; i++) {
      const id = await ctx.db.insert("clientes", {
        ...clientData[i],
        direccion: `Av. Principal ${100 + i * 50}`,
        comuna: ["Santiago", "Providencia", "Las Condes", "Ñuñoa", "Vitacura", "Maipú", "La Florida", "Puente Alto"][i],
        region: "Metropolitana",
        contador_asignado_id: profileIds[i % profileIds.length],
        activo: true,
        created_at: iso(daysAgo(60 + i * 10)),
        updated_at: iso(daysAgo(i * 3)),
      });
      clientIds.push(id);
    }

    // ─── 4. Documents ───────────────────────────────────────
    const tiposDoc = [
      "Factura Electrónica",
      "Boleta Electrónica",
      "Nota de Crédito",
      "Nota de Débito",
      "Factura de Compra",
      "Guía de Despacho",
    ];
    const statuses: Array<"pendiente" | "clasificado" | "revisado" | "aprobado" | "exportado"> = [
      "pendiente", "clasificado", "revisado", "aprobado", "exportado",
    ];
    const emisores = [
      { rut: "11.111.111-1", razon: "Proveedor Alpha Ltda." },
      { rut: "22.222.222-2", razon: "Distribuidora Beta SpA" },
      { rut: "33.333.333-3", razon: "Servicios Gamma S.A." },
      { rut: "44.444.444-4", razon: "Insumos Delta Ltda." },
      { rut: "55.555.555-5", razon: "Comercial Epsilon SpA" },
      { rut: "66.666.666-6", razon: "Logística Zeta S.A." },
    ];

    const docIds: any[] = [];
    for (let i = 0; i < 120; i++) {
      const dayOffset = Math.floor(Math.random() * 60);
      const clientIdx = Math.floor(Math.random() * clientIds.length);
      const tipoIdx = Math.floor(Math.random() * tiposDoc.length);
      const emisorIdx = Math.floor(Math.random() * emisores.length);
      const statusIdx = Math.min(
        Math.floor(Math.random() * 5),
        statuses.length - 1
      );
      const neto = Math.round(50000 + Math.random() * 5000000);
      const iva = Math.round(neto * 0.19);

      const id = await ctx.db.insert("documentos", {
        cliente_id: clientIds[clientIdx],
        tipo_documento: tiposDoc[tipoIdx],
        folio: `${1000 + i}`,
        periodo: `2026-${String(Math.max(1, 2 - Math.floor(dayOffset / 30))).padStart(2, "0")}`,
        fecha_emision: iso(daysAgo(dayOffset)),
        rut_emisor: emisores[emisorIdx].rut,
        razon_social_emisor: emisores[emisorIdx].razon,
        giro_emisor: "Servicios generales",
        glosa: `Documento #${1000 + i} - ${tiposDoc[tipoIdx]}`,
        es_compra: Math.random() > 0.4,
        monto_neto: neto,
        monto_iva: iva,
        monto_total: neto + iva,
        confidence_score: 0.75 + Math.random() * 0.25,
        status: statuses[statusIdx],
        created_at: iso(daysAgo(dayOffset)),
        updated_at: iso(daysAgo(Math.max(0, dayOffset - 2))),
      });
      docIds.push(id);
    }

    // ─── 5. Bot Definitions ─────────────────────────────────
    const botDefs = [
      { nombre: "SII Scraper", portal: "SII", descripcion: "Descarga documentos del SII" },
      { nombre: "Banco Chile Bot", portal: "BancoChile", descripcion: "Descarga cartolas Banco Chile" },
      { nombre: "BancoEstado Bot", portal: "BancoEstado", descripcion: "Descarga cartolas BancoEstado" },
      { nombre: "Nubox Sync", portal: "Nubox", descripcion: "Sincroniza con Nubox" },
      { nombre: "F29 Submitter", portal: "SII", descripcion: "Envía F29 al SII" },
    ];

    const botIds: any[] = [];
    for (const b of botDefs) {
      const id = await ctx.db.insert("bot_definiciones", {
        ...b,
        frecuencia_default: "diario",
        activo: true,
        created_at: iso(daysAgo(60)),
      });
      botIds.push(id);
    }

    // ─── 6. Bot Jobs (last 30 days) ─────────────────────────
    const jobStatuses: Array<"pendiente" | "ejecutando" | "completado" | "fallido"> = [
      "completado", "completado", "completado", "completado",
      "completado", "completado", "completado", "fallido",
    ];

    for (let i = 0; i < 80; i++) {
      const dayOffset = Math.floor(Math.random() * 30);
      const botIdx = Math.floor(Math.random() * botIds.length);
      const clientIdx = Math.floor(Math.random() * clientIds.length);
      const status = jobStatuses[Math.floor(Math.random() * jobStatuses.length)];
      const startDate = daysAgo(dayOffset);
      const execMs = 5000 + Math.floor(Math.random() * 55000);
      const endDate = new Date(startDate.getTime() + execMs);

      await ctx.db.insert("bot_jobs", {
        bot_id: botIds[botIdx],
        cliente_id: clientIds[clientIdx],
        status,
        triggered_by: "scheduler",
        started_at: iso(startDate),
        completed_at: status === "completado" || status === "fallido" ? iso(endDate) : undefined,
        error_message: status === "fallido" ? "Timeout: portal no respondió en 60s" : undefined,
        max_retries: 3,
        retry_count: status === "fallido" ? 1 : 0,
        created_at: iso(startDate),
      });
    }

    // ─── 7. F29 Calculations ────────────────────────────────
    const f29Statuses: Array<"borrador" | "calculado" | "validado" | "aprobado" | "enviado"> = [
      "borrador", "calculado", "validado", "aprobado", "enviado",
    ];

    for (let i = 0; i < clientIds.length; i++) {
      for (const periodo of ["2026-01", "2026-02"]) {
        const debito = Math.round(500000 + Math.random() * 3000000);
        const credito = Math.round(400000 + Math.random() * 2500000);
        const ppm = Math.round(debito * 0.01);
        const total = Math.max(0, debito - credito + ppm);
        const statusIdx = Math.min(
          Math.floor(Math.random() * 5),
          f29Statuses.length - 1
        );

        await ctx.db.insert("f29_calculos", {
          cliente_id: clientIds[i],
          periodo,
          total_debito_fiscal: debito,
          total_credito_fiscal: credito,
          ppm_determinado: ppm,
          total_a_pagar: total,
          status: f29Statuses[statusIdx],
          created_at: iso(daysAgo(periodo === "2026-01" ? 30 : 5)),
          updated_at: iso(daysAgo(periodo === "2026-01" ? 20 : 1)),
        });
      }
    }

    // ─── 8. Bank Transactions ───────────────────────────────
    const bancos = ["bancochile", "bancoestado", "santander", "bci"];
    const descBanco = [
      "Pago factura proveedor",
      "Cobro cliente",
      "Transferencia nómina",
      "Pago arriendo oficina",
      "Comisión bancaria",
      "Depósito cliente",
      "Pago servicio eléctrico",
      "Compra insumos oficina",
      "Pago honorarios",
      "Devolución IVA",
    ];

    for (let i = 0; i < 60; i++) {
      const dayOffset = Math.floor(Math.random() * 30);
      const clientIdx = Math.floor(Math.random() * clientIds.length);
      const esCargo = Math.random() > 0.4;
      const monto = Math.round(10000 + Math.random() * 3000000) * (esCargo ? -1 : 1);

      await ctx.db.insert("bancos_transacciones", {
        cliente_id: clientIds[clientIdx],
        banco: bancos[Math.floor(Math.random() * bancos.length)],
        fecha: iso(daysAgo(dayOffset)).substring(0, 10),
        descripcion: descBanco[Math.floor(Math.random() * descBanco.length)],
        monto: Math.abs(monto),
        tipo: esCargo ? "cargo" as const : "abono" as const,
        moneda: "CLP" as const,
        monto_clp: Math.abs(monto),
        estado_conciliacion: ["pending", "matched", "unmatched"][Math.floor(Math.random() * 3)] as any,
        reconciliado: Math.random() > 0.4,
        created_at: iso(daysAgo(dayOffset)),
      });
    }

    // ─── 9. Audit Logs ──────────────────────────────────────
    const acciones = [
      "crear_documento", "clasificar_documento", "aprobar_documento",
      "ejecutar_bot", "generar_f29", "exportar_reporte",
      "login", "actualizar_cliente", "conciliar_transaccion",
    ];

    for (let i = 0; i < 150; i++) {
      const dayOffset = Math.floor(Math.random() * 30);
      const hour = 8 + Math.floor(Math.random() * 10);
      const d = daysAgo(dayOffset);
      d.setHours(hour, Math.floor(Math.random() * 60));

      await ctx.db.insert("audit_logs", {
        accion: acciones[Math.floor(Math.random() * acciones.length)],
        tabla: "documentos",
        usuario_id: profileIds[Math.floor(Math.random() * profileIds.length)],
        created_at: iso(d),
      });
    }

    // ─── 10. Anomalías / Alertas ────────────────────────────
    const tiposAnomalia: Array<"monto_inusual" | "proveedor_nuevo" | "posible_duplicado" | "patron_diferente" | "conciliacion_fallida"> = [
      "monto_inusual", "proveedor_nuevo", "posible_duplicado",
      "patron_diferente", "conciliacion_fallida",
    ];
    const severidades: Array<"alta" | "media" | "baja"> = ["alta", "media", "baja"];
    const estadosAlerta: Array<"abierta" | "revisada" | "resuelta" | "descartada"> = [
      "abierta", "revisada", "resuelta", "descartada",
    ];

    for (let i = 0; i < 25; i++) {
      const dayOffset = Math.floor(Math.random() * 30);
      const tipo = tiposAnomalia[Math.floor(Math.random() * tiposAnomalia.length)];
      const estado = estadosAlerta[Math.floor(Math.random() * estadosAlerta.length)];

      await ctx.db.insert("alertas_anomalias", {
        cliente_id: clientIds[Math.floor(Math.random() * clientIds.length)],
        tipo,
        severidad: severidades[Math.floor(Math.random() * severidades.length)],
        titulo: {
          monto_inusual: "Monto inusualmente alto detectado",
          proveedor_nuevo: "Nuevo proveedor sin historial",
          posible_duplicado: "Posible documento duplicado",
          patron_diferente: "Patrón de gasto diferente al habitual",
          conciliacion_fallida: "Transacción sin match en documentos",
        }[tipo],
        descripcion: `Anomalía detectada para revisión del equipo contable`,
        monto_referencia: Math.round(100000 + Math.random() * 2000000),
        monto_detectado: Math.round(100000 + Math.random() * 5000000),
        estado,
        resuelta_at: estado === "resuelta" ? iso(daysAgo(Math.max(0, dayOffset - 3))) : undefined,
        resuelta_por: estado === "resuelta" ? profileIds[0] : undefined,
        created_at: iso(daysAgo(dayOffset)),
      });
    }

    // ─── 11. Notifications ──────────────────────────────────
    const notifTypes = [
      { tipo: "bot_completado", titulo: "Bot ejecutado exitosamente", mensaje: "El bot SII Scraper completó la descarga de 12 documentos" },
      { tipo: "anomalia", titulo: "Nueva anomalía detectada", mensaje: "Se detectó un monto inusual en Comercial Austral" },
      { tipo: "f29_listo", titulo: "F29 listo para revisión", mensaje: "El F29 de enero 2026 de TransSur está calculado" },
      { tipo: "conciliacion", titulo: "Conciliación completada", mensaje: "Se conciliaron 15 transacciones de Banco Chile" },
      { tipo: "sistema", titulo: "Actualización del sistema", mensaje: "Se actualizó el módulo de Analytics con nuevas métricas" },
    ];

    for (let i = 0; i < 10; i++) {
      const notif = notifTypes[Math.floor(Math.random() * notifTypes.length)];
      await ctx.db.insert("notificaciones", {
        usuario_id: profileIds[0],
        ...notif,
        leida: i > 4,
        created_at: iso(daysAgo(i)),
      });
    }

    // ─── 12. Pipeline Runs ──────────────────────────────────
    const pipelineEstados: Array<"pending" | "completed" | "failed" | "import" | "categorize"> = [
      "completed", "completed", "completed", "completed", "failed",
    ];

    for (let i = 0; i < 15; i++) {
      const dayOffset = Math.floor(Math.random() * 30);
      const clientIdx = Math.floor(Math.random() * clientIds.length);
      const estado = pipelineEstados[Math.floor(Math.random() * pipelineEstados.length)];

      await ctx.db.insert("pipeline_runs", {
        cliente_id: clientIds[clientIdx],
        periodo: "2026-01",
        estado,
        paso_actual: estado === "completed" ? 7 : 3,
        total_pasos: 7,
        resultado: {
          transacciones_importadas: Math.floor(10 + Math.random() * 40),
          transacciones_normalizadas: Math.floor(10 + Math.random() * 35),
          transacciones_categorizadas: Math.floor(8 + Math.random() * 30),
          transacciones_matched: Math.floor(5 + Math.random() * 25),
          alertas_generadas: Math.floor(Math.random() * 5),
          errores: estado === "failed" ? 1 : 0,
        },
        started_at: iso(daysAgo(dayOffset)),
        completed_at: estado === "completed" ? iso(daysAgo(Math.max(0, dayOffset - 1))) : undefined,
        created_at: iso(daysAgo(dayOffset)),
      });
    }

    // ─── 13. Alert Rules (Phase 7) ──────────────────────────
    const alertRulesData = [
      { name: "High Error Rate", metric: "bot_error_rate", operator: "greater_than", threshold: 20, enabled: true },
      { name: "Low Classification Accuracy", metric: "classification_accuracy", operator: "less_than", threshold: 85, enabled: true },
      { name: "Queue Depth Alert", metric: "queue_depth", operator: "greater_than", threshold: 50, enabled: true },
      { name: "Document Processing Delay", metric: "avg_processing_time", operator: "greater_than", threshold: 300000, enabled: false },
    ];

    for (const rule of alertRulesData) {
      await ctx.db.insert("alert_rules", {
        ...rule,
        email: ["alertas@hvconsultores.cl"],
        in_app: true,
        created_at: iso(daysAgo(10)),
      });
    }

    // ─── 14. Scheduled Reports (Phase 7) ────────────────────
    await ctx.db.insert("scheduled_reports", {
      name: "Reporte Semanal Ejecutivo",
      enabled: true,
      type: "weekly" as const,
      schedule_time: "08:00",
      schedule_day_of_week: 1,
      email: ["carlos@hvconsultores.cl"],
      dashboards: ["documents", "automation", "compliance"],
      format: "pdf" as const,
      include_charts: true,
      created_at: iso(daysAgo(10)),
    });

    await ctx.db.insert("scheduled_reports", {
      name: "Reporte Mensual Compliance",
      enabled: true,
      type: "monthly" as const,
      schedule_time: "09:00",
      schedule_day_of_month: 1,
      email: ["compliance@hvconsultores.cl"],
      dashboards: ["compliance"],
      format: "pdf" as const,
      include_charts: true,
      created_at: iso(daysAgo(10)),
    });

    return {
      status: "seeded",
      counts: {
        profiles: profiles.length,
        clients: clientData.length,
        documents: 120,
        botDefinitions: botDefs.length,
        botJobs: 80,
        f29Calculations: clientData.length * 2,
        bankTransactions: 60,
        auditLogs: 150,
        anomalies: 25,
        notifications: 10,
        pipelineRuns: 15,
        alertRules: alertRulesData.length,
        scheduledReports: 2,
      },
    };
  },
});

/**
 * Seed bank transactions for existing clients.
 * Use this when the main seed was skipped but bank data is missing.
 */
export const seedBankTransactions = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if bank transactions already exist
    const existing = await ctx.db.query("bancos_transacciones").first();
    if (existing) {
      return { status: "already_has_bank_data", message: "Bank transactions already exist" };
    }

    // Get existing active clients
    const clientes = await ctx.db
      .query("clientes")
      .filter((q: any) => q.eq(q.field("activo"), true))
      .collect();

    if (clientes.length === 0) {
      return { status: "no_clients", message: "No active clients found" };
    }

    const now = new Date();
    const iso = (d: Date) => d.toISOString();
    const daysAgo = (n: number) => new Date(now.getTime() - n * 24 * 60 * 60 * 1000);

    const bancos = ["Banco de Chile", "BancoEstado", "Santander", "BCI", "Scotiabank"];
    const descripciones = [
      "Pago proveedor factura",
      "Cobro cliente transferencia",
      "Transferencia nómina",
      "Pago arriendo oficina",
      "Comisión bancaria",
      "Depósito cliente",
      "Pago servicio eléctrico",
      "Compra insumos oficina",
      "Pago honorarios",
      "Devolución IVA",
      "Abono venta",
      "Pago impuesto mensual",
    ];

    const clientIds = clientes.map((c) => c._id);
    let count = 0;

    for (let i = 0; i < 60; i++) {
      const dayOffset = Math.floor(Math.random() * 30);
      const clientIdx = Math.floor(Math.random() * clientIds.length);
      const esCargo = Math.random() > 0.4;
      const monto = Math.round(50000 + Math.random() * 5000000);
      const estados: Array<"pending" | "matched" | "unmatched"> = ["pending", "matched", "unmatched"];
      const estado = estados[Math.floor(Math.random() * 3)];

      await ctx.db.insert("bancos_transacciones", {
        cliente_id: clientIds[clientIdx],
        banco: bancos[Math.floor(Math.random() * bancos.length)],
        fecha: iso(daysAgo(dayOffset)).substring(0, 10),
        descripcion: descripciones[Math.floor(Math.random() * descripciones.length)],
        monto,
        tipo: esCargo ? "cargo" as const : "abono" as const,
        moneda: "CLP" as const,
        monto_clp: monto,
        estado_conciliacion: estado,
        reconciliado: estado === "matched",
        created_at: iso(daysAgo(dayOffset)),
      });
      count++;
    }

    return { status: "seeded", bankTransactions: count };
  },
});
