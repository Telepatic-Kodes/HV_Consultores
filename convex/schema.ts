// @ts-nocheck
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// Enum-like unions for status fields
const botJobStatus = v.union(
  v.literal("pendiente"),
  v.literal("ejecutando"),
  v.literal("completado"),
  v.literal("fallido"),
  v.literal("cancelado")
);

const documentoStatus = v.union(
  v.literal("pendiente"),
  v.literal("clasificado"),
  v.literal("revisado"),
  v.literal("aprobado"),
  v.literal("exportado")
);

const f29Status = v.union(
  v.literal("borrador"),
  v.literal("calculado"),
  v.literal("validado"),
  v.literal("aprobado"),
  v.literal("enviado")
);

const regimenTributario = v.union(
  v.literal("14A"),
  v.literal("14D"),
  v.literal("14D_N3"),
  v.literal("14D_N8")
);

const validacionResultado = v.union(
  v.literal("ok"),
  v.literal("warning"),
  v.literal("error")
);

const userRoleType = v.union(
  v.literal("admin"),
  v.literal("jefe_contabilidad"),
  v.literal("contador"),
  v.literal("coordinador_gp"),
  v.literal("asistente")
);

const estadoConciliacion = v.union(
  v.literal("pending"),
  v.literal("matched"),
  v.literal("partial"),
  v.literal("unmatched"),
  v.literal("manual")
);

const tipoTransaccion = v.union(
  v.literal("cargo"),
  v.literal("abono")
);

const monedaType = v.union(
  v.literal("CLP"),
  v.literal("USD"),
  v.literal("EUR"),
  v.literal("UF")
);

const tipoCuenta = v.union(
  v.literal("corriente"),
  v.literal("vista"),
  v.literal("ahorro"),
  v.literal("credito")
);

const bancoCode = v.union(
  v.literal("bancochile"),
  v.literal("bancoestado"),
  v.literal("santander"),
  v.literal("bci")
);

export default defineSchema({
  // ─── User Profiles ───────────────────────────────────────
  profiles: defineTable({
    nombre_completo: v.string(),
    cargo: v.optional(v.string()),
    telefono: v.optional(v.string()),
    avatar_url: v.optional(v.string()),
    activo: v.optional(v.boolean()),
    created_at: v.optional(v.string()),
    updated_at: v.optional(v.string()),
  }),

  roles: defineTable({
    nombre: v.string(),
    descripcion: v.optional(v.string()),
    permisos: v.optional(v.any()),
    created_at: v.optional(v.string()),
  }),

  user_roles: defineTable({
    user_id: v.id("profiles"),
    role_id: v.id("roles"),
    assigned_by: v.optional(v.id("profiles")),
    assigned_at: v.optional(v.string()),
  })
    .index("by_user", ["user_id"])
    .index("by_role", ["role_id"]),

  // ─── Clients ─────────────────────────────────────────────
  clientes: defineTable({
    razon_social: v.string(),
    rut: v.string(),
    nombre_fantasia: v.optional(v.string()),
    giro: v.optional(v.string()),
    direccion: v.optional(v.string()),
    comuna: v.optional(v.string()),
    region: v.optional(v.string()),
    regimen_tributario: v.optional(regimenTributario),
    tasa_ppm: v.optional(v.number()),
    nubox_id: v.optional(v.string()),
    contador_asignado_id: v.optional(v.id("profiles")),
    activo: v.optional(v.boolean()),
    created_at: v.optional(v.string()),
    updated_at: v.optional(v.string()),
  })
    .index("by_rut", ["rut"])
    .index("by_contador", ["contador_asignado_id"])
    .index("by_activo", ["activo"]),

  // ─── Accounting Plans ────────────────────────────────────
  planes_cuenta: defineTable({
    nombre: v.string(),
    cliente_id: v.id("clientes"),
    version: v.optional(v.number()),
    activo: v.optional(v.boolean()),
    created_at: v.optional(v.string()),
  })
    .index("by_cliente", ["cliente_id"]),

  cuentas_contables: defineTable({
    codigo: v.string(),
    nombre: v.string(),
    plan_cuenta_id: v.id("planes_cuenta"),
    cuenta_padre_id: v.optional(v.id("cuentas_contables")),
    tipo: v.optional(v.string()),
    nivel: v.optional(v.number()),
    es_cuenta_mayor: v.optional(v.boolean()),
    activa: v.optional(v.boolean()),
  })
    .index("by_plan", ["plan_cuenta_id"])
    .index("by_codigo", ["codigo"]),

  // ─── Documents ───────────────────────────────────────────
  documentos: defineTable({
    cliente_id: v.id("clientes"),
    tipo_documento: v.string(),
    folio: v.string(),
    periodo: v.string(),
    fecha_emision: v.string(),
    rut_emisor: v.string(),
    razon_social_emisor: v.optional(v.string()),
    giro_emisor: v.optional(v.string()),
    glosa: v.optional(v.string()),
    es_compra: v.boolean(),
    es_activo_fijo: v.optional(v.boolean()),
    monto_neto: v.optional(v.number()),
    monto_iva: v.optional(v.number()),
    monto_total: v.optional(v.number()),
    cuenta_sugerida_id: v.optional(v.id("cuentas_contables")),
    cuenta_final_id: v.optional(v.id("cuentas_contables")),
    confidence_score: v.optional(v.number()),
    clasificado_at: v.optional(v.string()),
    clasificado_por: v.optional(v.string()),
    status: v.optional(documentoStatus),
    nubox_id: v.optional(v.string()),
    created_at: v.optional(v.string()),
    updated_at: v.optional(v.string()),
  })
    .index("by_cliente", ["cliente_id"])
    .index("by_periodo", ["periodo"])
    .index("by_status", ["status"])
    .index("by_created", ["created_at"]),

  clasificaciones_ml: defineTable({
    documento_id: v.id("documentos"),
    cuenta_predicha_id: v.id("cuentas_contables"),
    confidence: v.number(),
    ranking: v.number(),
    modelo_version: v.string(),
    features_input: v.optional(v.any()),
    shap_values: v.optional(v.any()),
    created_at: v.optional(v.string()),
  })
    .index("by_documento", ["documento_id"]),

  feedback_clasificacion: defineTable({
    documento_id: v.id("documentos"),
    cuenta_predicha_id: v.id("cuentas_contables"),
    cuenta_correcta_id: v.id("cuentas_contables"),
    usuario_id: v.id("profiles"),
    comentario: v.optional(v.string()),
    usado_reentrenamiento: v.optional(v.boolean()),
    created_at: v.optional(v.string()),
  })
    .index("by_documento", ["documento_id"]),

  // ─── F29 Tax Forms ───────────────────────────────────────
  f29_calculos: defineTable({
    cliente_id: v.id("clientes"),
    periodo: v.string(),
    total_debito_fiscal: v.optional(v.number()),
    total_credito_fiscal: v.optional(v.number()),
    ppm_determinado: v.optional(v.number()),
    retenciones_honorarios: v.optional(v.number()),
    impuesto_unico: v.optional(v.number()),
    remanente_anterior: v.optional(v.number()),
    remanente_actualizado: v.optional(v.number()),
    total_a_pagar: v.optional(v.number()),
    status: v.optional(f29Status),
    aprobado_por: v.optional(v.id("profiles")),
    aprobado_at: v.optional(v.string()),
    enviado_sii_at: v.optional(v.string()),
    folio_sii: v.optional(v.string()),
    created_at: v.optional(v.string()),
    updated_at: v.optional(v.string()),
  })
    .index("by_cliente", ["cliente_id"])
    .index("by_periodo", ["periodo"])
    .index("by_status", ["status"]),

  f29_codigos: defineTable({
    f29_calculo_id: v.id("f29_calculos"),
    codigo: v.number(),
    descripcion: v.optional(v.string()),
    monto_neto: v.optional(v.number()),
    monto_iva: v.optional(v.number()),
    cantidad_documentos: v.optional(v.number()),
    fuente: v.optional(v.string()),
    detalle: v.optional(v.any()),
  })
    .index("by_calculo", ["f29_calculo_id"]),

  f29_validaciones: defineTable({
    f29_calculo_id: v.id("f29_calculos"),
    codigo_validacion: v.string(),
    descripcion: v.string(),
    resultado: validacionResultado,
    valor_esperado: v.optional(v.number()),
    valor_calculado: v.optional(v.number()),
    diferencia: v.optional(v.number()),
    mensaje: v.optional(v.string()),
    created_at: v.optional(v.string()),
  })
    .index("by_calculo", ["f29_calculo_id"]),

  // ─── RPA Bots ────────────────────────────────────────────
  bot_definiciones: defineTable({
    nombre: v.string(),
    portal: v.string(),
    descripcion: v.optional(v.string()),
    frecuencia_default: v.optional(v.string()),
    config_default: v.optional(v.any()),
    activo: v.optional(v.boolean()),
    created_at: v.optional(v.string()),
  }),

  bot_jobs: defineTable({
    bot_id: v.id("bot_definiciones"),
    cliente_id: v.optional(v.id("clientes")),
    status: v.optional(botJobStatus),
    config_override: v.optional(v.any()),
    resultado: v.optional(v.any()),
    error_message: v.optional(v.string()),
    max_retries: v.optional(v.number()),
    retry_count: v.optional(v.number()),
    triggered_by: v.optional(v.string()),
    triggered_by_user: v.optional(v.id("profiles")),
    scheduled_at: v.optional(v.string()),
    started_at: v.optional(v.string()),
    completed_at: v.optional(v.string()),
    created_at: v.optional(v.string()),
  })
    .index("by_bot", ["bot_id"])
    .index("by_status", ["status"])
    .index("by_cliente", ["cliente_id"])
    .index("by_created", ["created_at"]),

  bot_logs: defineTable({
    job_id: v.id("bot_jobs"),
    paso: v.optional(v.string()),
    nivel: v.optional(v.string()),
    mensaje: v.string(),
    metadata: v.optional(v.any()),
    screenshot_url: v.optional(v.string()),
    timestamp: v.optional(v.string()),
  })
    .index("by_job", ["job_id"]),

  // ─── Portal Credentials ──────────────────────────────────
  credenciales_portales: defineTable({
    cliente_id: v.id("clientes"),
    portal: v.string(),
    usuario_encriptado: v.string(),
    password_encriptado: v.string(),
    datos_adicionales: v.optional(v.any()),
    activo: v.optional(v.boolean()),
    validacion_exitosa: v.optional(v.boolean()),
    ultima_validacion: v.optional(v.string()),
    created_at: v.optional(v.string()),
    updated_at: v.optional(v.string()),
  })
    .index("by_cliente", ["cliente_id"])
    .index("by_portal", ["portal"]),

  // ─── Chat ────────────────────────────────────────────────
  chat_sesiones: defineTable({
    usuario_id: v.id("profiles"),
    titulo: v.optional(v.string()),
    activa: v.optional(v.boolean()),
    created_at: v.optional(v.string()),
    updated_at: v.optional(v.string()),
  })
    .index("by_usuario", ["usuario_id"]),

  chat_mensajes: defineTable({
    sesion_id: v.id("chat_sesiones"),
    rol: v.string(),
    contenido: v.string(),
    fuentes: v.optional(v.any()),
    modelo_usado: v.optional(v.string()),
    tokens_input: v.optional(v.number()),
    tokens_output: v.optional(v.number()),
    latencia_ms: v.optional(v.number()),
    created_at: v.optional(v.string()),
  })
    .index("by_sesion", ["sesion_id"]),

  chat_feedback: defineTable({
    mensaje_id: v.id("chat_mensajes"),
    usuario_id: v.id("profiles"),
    rating: v.optional(v.number()),
    comentario: v.optional(v.string()),
    created_at: v.optional(v.string()),
  })
    .index("by_mensaje", ["mensaje_id"]),

  // ─── Knowledge Base (RAG) ────────────────────────────────
  documentos_conocimiento: defineTable({
    titulo: v.string(),
    contenido: v.string(),
    categoria: v.string(),
    embedding: v.optional(v.string()),
    metadata: v.optional(v.any()),
    version: v.optional(v.number()),
    activo: v.optional(v.boolean()),
    created_at: v.optional(v.string()),
    updated_at: v.optional(v.string()),
  })
    .index("by_categoria", ["categoria"]),

  // ─── Notifications ───────────────────────────────────────
  notificaciones: defineTable({
    usuario_id: v.id("profiles"),
    tipo: v.string(),
    titulo: v.string(),
    mensaje: v.string(),
    link: v.optional(v.string()),
    leida: v.optional(v.boolean()),
    created_at: v.optional(v.string()),
  })
    .index("by_usuario", ["usuario_id"])
    .index("by_leida", ["leida"]),

  // ─── System Config ───────────────────────────────────────
  configuracion_sistema: defineTable({
    clave: v.string(),
    valor: v.any(),
    descripcion: v.optional(v.string()),
    updated_by: v.optional(v.id("profiles")),
    updated_at: v.optional(v.string()),
  })
    .index("by_clave", ["clave"]),

  // ─── Audit Logs ──────────────────────────────────────────
  audit_logs: defineTable({
    accion: v.string(),
    tabla: v.optional(v.string()),
    registro_id: v.optional(v.string()),
    usuario_id: v.optional(v.id("profiles")),
    datos_anteriores: v.optional(v.any()),
    datos_nuevos: v.optional(v.any()),
    ip_address: v.optional(v.string()),
    user_agent: v.optional(v.string()),
    created_at: v.optional(v.string()),
  })
    .index("by_usuario", ["usuario_id"])
    .index("by_tabla", ["tabla"])
    .index("by_created", ["created_at"]),

  // ─── Bank Transactions ───────────────────────────────────
  bancos_transacciones: defineTable({
    cliente_id: v.optional(v.id("clientes")),
    banco: v.string(),
    fecha: v.string(),
    descripcion: v.string(),
    monto: v.number(),
    categoria: v.optional(v.string()),
    reconciliado: v.optional(v.boolean()),
    documento_id: v.optional(v.id("documentos")),
    created_at: v.optional(v.string()),
    // Phase 1: Extended fields for conciliation engine
    descripcion_normalizada: v.optional(v.string()),
    referencia: v.optional(v.string()),
    tipo: v.optional(tipoTransaccion),
    moneda: v.optional(monedaType),
    monto_clp: v.optional(v.number()),
    hash_transaccion: v.optional(v.string()),
    estado_conciliacion: v.optional(estadoConciliacion),
    cuenta_contable_id: v.optional(v.id("cuentas_contables")),
  })
    .index("by_cliente", ["cliente_id"])
    .index("by_banco", ["banco"])
    .index("by_fecha", ["fecha"])
    .index("by_estado_conciliacion", ["estado_conciliacion"])
    .index("by_hash", ["hash_transaccion"]),

  // ─── Bank Accounts (Cuentas Bancarias) ─────────────────
  bancos_cuentas: defineTable({
    cliente_id: v.id("clientes"),
    banco: bancoCode,
    numero_cuenta: v.string(),
    tipo_cuenta: tipoCuenta,
    moneda: v.optional(monedaType),
    alias: v.optional(v.string()),
    saldo_actual: v.optional(v.number()),
    activa: v.optional(v.boolean()),
    credencial_id: v.optional(v.id("credenciales_portales")),
    ultima_descarga: v.optional(v.string()),
    created_at: v.optional(v.string()),
    updated_at: v.optional(v.string()),
  })
    .index("by_cliente", ["cliente_id"])
    .index("by_banco", ["banco"]),

  // ─── Conciliaciones (Matching Results) ─────────────────
  conciliaciones: defineTable({
    transaccion_id: v.id("bancos_transacciones"),
    documento_id: v.optional(v.id("documentos")),
    cliente_id: v.id("clientes"),
    confianza: v.number(),
    estado: estadoConciliacion,
    diferencia_monto: v.optional(v.number()),
    diferencia_dias: v.optional(v.number()),
    match_reasons: v.optional(v.array(v.string())),
    confirmado_por: v.optional(v.id("profiles")),
    confirmado_at: v.optional(v.string()),
    notas: v.optional(v.string()),
    periodo: v.optional(v.string()),
    created_at: v.optional(v.string()),
    updated_at: v.optional(v.string()),
  })
    .index("by_transaccion", ["transaccion_id"])
    .index("by_documento", ["documento_id"])
    .index("by_cliente", ["cliente_id"])
    .index("by_estado", ["estado"])
    .index("by_periodo", ["periodo"]),

  // ─── Plantillas Plan de Cuenta (Templates) ────────────
  plantillas_plan_cuenta: defineTable({
    nombre: v.string(),
    regimen: regimenTributario,
    descripcion: v.optional(v.string()),
    cuentas: v.array(v.object({
      codigo: v.string(),
      nombre: v.string(),
      tipo: v.optional(v.string()),
      nivel: v.number(),
      cuenta_padre_codigo: v.optional(v.string()),
      es_cuenta_mayor: v.optional(v.boolean()),
    })),
    version: v.optional(v.number()),
    activa: v.optional(v.boolean()),
    created_by: v.optional(v.id("profiles")),
    created_at: v.optional(v.string()),
    updated_at: v.optional(v.string()),
  })
    .index("by_regimen", ["regimen"])
    .index("by_activa", ["activa"]),

  // ─── Reglas de Categorización ─────────────────────────
  reglas_categorizacion: defineTable({
    cliente_id: v.optional(v.id("clientes")),
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
    activa: v.optional(v.boolean()),
    veces_aplicada: v.optional(v.number()),
    ultima_aplicacion: v.optional(v.string()),
    created_by: v.optional(v.id("profiles")),
    created_at: v.optional(v.string()),
    updated_at: v.optional(v.string()),
  })
    .index("by_cliente", ["cliente_id"])
    .index("by_prioridad", ["prioridad"])
    .index("by_es_global", ["es_global"])
    .index("by_activa", ["activa"]),

  // ─── Tipos de Cambio (Exchange Rates) ─────────────────
  tipos_cambio: defineTable({
    moneda: monedaType,
    fecha: v.string(),
    valor: v.number(),
    fuente: v.optional(v.string()),
    created_at: v.optional(v.string()),
  })
    .index("by_moneda_fecha", ["moneda", "fecha"])
    .index("by_fecha", ["fecha"]),

  // ─── Pipeline Runs ─────────────────────────────────────
  pipeline_runs: defineTable({
    cliente_id: v.id("clientes"),
    periodo: v.optional(v.string()),
    estado: v.union(
      v.literal("pending"),
      v.literal("import"),
      v.literal("normalize"),
      v.literal("categorize"),
      v.literal("match"),
      v.literal("validate"),
      v.literal("alert"),
      v.literal("approve"),
      v.literal("completed"),
      v.literal("failed"),
      v.literal("paused")
    ),
    paso_actual: v.optional(v.number()),
    total_pasos: v.optional(v.number()),
    resultado: v.optional(v.object({
      transacciones_importadas: v.optional(v.number()),
      transacciones_normalizadas: v.optional(v.number()),
      transacciones_categorizadas: v.optional(v.number()),
      transacciones_matched: v.optional(v.number()),
      alertas_generadas: v.optional(v.number()),
      errores: v.optional(v.number()),
    })),
    error_message: v.optional(v.string()),
    iniciado_por: v.optional(v.id("profiles")),
    started_at: v.optional(v.string()),
    completed_at: v.optional(v.string()),
    paused_at: v.optional(v.string()),
    created_at: v.optional(v.string()),
    updated_at: v.optional(v.string()),
  })
    .index("by_cliente", ["cliente_id"])
    .index("by_estado", ["estado"])
    .index("by_periodo", ["periodo"]),

  // ─── Alertas de Anomalías ─────────────────────────────
  alertas_anomalias: defineTable({
    cliente_id: v.id("clientes"),
    tipo: v.union(
      v.literal("monto_inusual"),
      v.literal("proveedor_nuevo"),
      v.literal("posible_duplicado"),
      v.literal("patron_diferente"),
      v.literal("conciliacion_fallida")
    ),
    severidad: v.union(
      v.literal("alta"),
      v.literal("media"),
      v.literal("baja")
    ),
    titulo: v.string(),
    descripcion: v.string(),
    transaccion_id: v.optional(v.id("bancos_transacciones")),
    documento_id: v.optional(v.id("documentos")),
    monto_referencia: v.optional(v.number()),
    monto_detectado: v.optional(v.number()),
    metadata: v.optional(v.any()),
    estado: v.union(
      v.literal("abierta"),
      v.literal("revisada"),
      v.literal("descartada"),
      v.literal("resuelta")
    ),
    resuelta_por: v.optional(v.id("profiles")),
    resuelta_at: v.optional(v.string()),
    notas_resolucion: v.optional(v.string()),
    created_at: v.optional(v.string()),
  })
    .index("by_cliente", ["cliente_id"])
    .index("by_tipo", ["tipo"])
    .index("by_severidad", ["severidad"])
    .index("by_estado", ["estado"]),

  // ─── Patrones de Conciliación (Learned Patterns) ───────
  patrones_conciliacion: defineTable({
    cliente_id: v.id("clientes"),
    descripcion_patron: v.string(),
    rut_contraparte: v.optional(v.string()),
    cuenta_contable_id: v.optional(v.id("cuentas_contables")),
    categoria: v.optional(v.string()),
    documento_tipo: v.optional(v.string()),
    veces_aplicado: v.optional(v.number()),
    ultima_aplicacion: v.optional(v.string()),
    score_boost: v.optional(v.number()),
    activo: v.optional(v.boolean()),
    created_at: v.optional(v.string()),
    updated_at: v.optional(v.string()),
  })
    .index("by_cliente", ["cliente_id"])
    .index("by_descripcion", ["descripcion_patron"]),
});
