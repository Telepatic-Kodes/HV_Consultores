// SII RPA Constants
// HV Consultores - URLs, selectores y configuración del portal SII

// ============================================================================
// URLS DEL PORTAL SII
// ============================================================================

export const SII_URLS = {
  // Páginas de autenticación
  LOGIN: 'https://www.sii.cl/claveunica_sii/PortalIU/Login',
  LOGIN_RUT_CLAVE: 'https://www.sii.cl/sii_cvu/login/login.html',
  LOGIN_CLAVE_UNICA: 'https://www.sii.cl/claveunica_sii/PortalIU/ingreso_rut',
  LOGOUT: 'https://www.sii.cl/claveunica_sii/PortalIU/LogOut',

  // Declaraciones
  F29_PRINCIPAL: 'https://www4.sii.cl/declaracionesInternetService/F29',
  F29_FORMULARIO: 'https://www4.sii.cl/declaracionesInternetService/F29/declaracion',
  F29_RECTIFICATORIA: 'https://www4.sii.cl/declaracionesInternetService/F29/rectificatoria',
  F29_CONSULTA: 'https://www4.sii.cl/declaracionesInternetService/consultaF29',

  // Libros electrónicos
  LIBRO_COMPRAS: 'https://www4.sii.cl/registrocompaborMUI/consulta',
  LIBRO_COMPRAS_DESCARGA: 'https://www4.sii.cl/registrocompaborMUI/descargaArchivoCSV',
  LIBRO_VENTAS: 'https://www4.sii.cl/conaborMUI/consulta',
  LIBRO_VENTAS_DESCARGA: 'https://www4.sii.cl/conaborMUI/descargaArchivoCSV',

  // Situación tributaria
  SITUACION_TRIBUTARIA: 'https://zeus.sii.cl/cvc/stc/stc.html',
  SITUACION_TRIBUTARIA_CONSULTA: 'https://zeus.sii.cl/cvc_cgi/stc/getstc',
  CARPETA_TRIBUTARIA: 'https://www4.sii.cl/CarTribMVCUI/CarTrib/Home',

  // Certificados
  CERTIFICADO_SITUACION: 'https://zeus.sii.cl/cvc/stc/stc.html',
  CERTIFICADO_DEUDA: 'https://www4.sii.cl/deudacont_internet/DeudaContUI/ConsultaDeuda',
  CERTIFICADO_IVA: 'https://www4.sii.cl/CertIVAMvcUI/home',
  CERTIFICADO_RENTA: 'https://www4.sii.cl/rentasui/CertificadoRenta',

  // Portal mi SII
  MI_SII: 'https://www.sii.cl/mipagina/index.html',
  MI_SII_DASHBOARD: 'https://misiir.sii.cl/cgi_misii/siihome.cgi',

  // API endpoints
  API_CONTRIBUYENTE: 'https://www4.sii.cl/conaborMUI/services/datos/contribuyente',
} as const

// ============================================================================
// SELECTORES DOM
// ============================================================================

export const SII_SELECTORS = {
  // === LOGIN ===
  LOGIN: {
    // Login con RUT y clave
    RUT_INPUT: 'input[name="rut"], #rut, input[id*="rut"]',
    RUT_VERIFICADOR: 'input[name="dv"], #dv',
    PASSWORD_INPUT: 'input[type="password"], input[name="clave"], #clave',
    LOGIN_BUTTON: 'button[type="submit"], input[type="submit"], #bt_ingresar',

    // Clave Única
    CLAVE_UNICA_BUTTON: 'a[href*="claveunica"], .btn-clave-unica',
    CLAVE_UNICA_RUT: '#uname, input[name="uname"]',
    CLAVE_UNICA_PASSWORD: '#pword, input[name="pword"]',
    CLAVE_UNICA_SUBMIT: '#login-form button[type="submit"]',

    // Verificación de login exitoso
    LOGGED_IN_INDICATOR: '.user-menu, [data-logged="true"], .menu-usuario, #menu_usuario',
    NOMBRE_USUARIO: '.nombre-usuario, #nombreUsuario, .user-name',

    // Errores
    ERROR_MESSAGE: '.error-message, .alert-danger, .mensaje-error, #mensajeError',
    CAPTCHA: '#captcha, .g-recaptcha, [data-sitekey]',
  },

  // === F29 ===
  F29: {
    // Navegación
    MENU_F29: 'a[href*="F29"], .menu-f29',
    NUEVA_DECLARACION: '#btnNuevaDeclaracion, a[href*="nueva"]',
    RECTIFICATORIA: '#btnRectificatoria, a[href*="rectificatoria"]',

    // Selección de período
    PERIODO_MES: 'select[name="mes"], #mes, #periodoMes',
    PERIODO_ANO: 'select[name="ano"], #ano, #periodoAno',
    BTN_CONTINUAR: '#btnContinuar, button[type="submit"]',

    // Campos del formulario (por código)
    // Débitos
    CODIGO_20: 'input[name="codigo20"], #cod20, input[data-codigo="20"]',
    CODIGO_89: 'input[name="codigo89"], #cod89, input[data-codigo="89"]',
    // Créditos
    CODIGO_520: 'input[name="codigo520"], #cod520, input[data-codigo="520"]',
    CODIGO_538: 'input[name="codigo538"], #cod538, input[data-codigo="538"]',
    CODIGO_563: 'input[name="codigo563"], #cod563, input[data-codigo="563"]',
    CODIGO_595: 'input[name="codigo595"], #cod595, input[data-codigo="595"]',
    // PPM
    CODIGO_30: 'input[name="codigo30"], #cod30, input[data-codigo="30"]',
    CODIGO_48: 'input[name="codigo48"], #cod48, input[data-codigo="48"]',
    // Retenciones
    CODIGO_151: 'input[name="codigo151"], #cod151, input[data-codigo="151"]',
    CODIGO_153: 'input[name="codigo153"], #cod153, input[data-codigo="153"]',
    // Resultados
    CODIGO_91: 'input[name="codigo91"], #cod91, input[data-codigo="91"]', // IVA determinado
    CODIGO_304: 'input[name="codigo304"], #cod304, input[data-codigo="304"]', // Total a pagar
    CODIGO_60: 'input[name="codigo60"], #cod60, input[data-codigo="60"]', // Remanente

    // Botones de acción
    BTN_CALCULAR: '#btnCalcular, button[name="calcular"]',
    BTN_VALIDAR: '#btnValidar, button[name="validar"]',
    BTN_ENVIAR: '#btnEnviar, button[name="enviar"]',
    BTN_CONFIRMAR: '#btnConfirmar, .confirmar-envio',

    // Resultado
    FOLIO: '#folio, .numero-folio, [data-folio]',
    COMPROBANTE: '#comprobante, .comprobante, a[href*="comprobante"]',
    MENSAJE_EXITO: '.mensaje-exito, .alert-success',
    MENSAJE_ERROR: '.mensaje-error, .alert-danger, .error',
  },

  // === LIBROS ===
  LIBROS: {
    // Común
    PERIODO_MES: 'select[name="periodoMes"], #periodoMes',
    PERIODO_ANO: 'select[name="periodoAnno"], #periodoAnno',
    BTN_CONSULTAR: '#btnConsultar, button[type="submit"]',

    // Tabla de resultados
    TABLA_DOCUMENTOS: 'table.documentos, #tablaDocumentos, .tabla-libro',
    FILA_DOCUMENTO: 'tr.documento, tbody tr',
    TOTAL_NETO: '.total-neto, #totalNeto, td[data-total="neto"]',
    TOTAL_IVA: '.total-iva, #totalIva, td[data-total="iva"]',
    TOTAL_GENERAL: '.total-general, #totalGeneral, td[data-total="general"]',

    // Descargas
    BTN_DESCARGAR_CSV: 'a[href*="CSV"], #btnCSV, .btn-csv',
    BTN_DESCARGAR_XML: 'a[href*="XML"], #btnXML, .btn-xml',
    BTN_DESCARGAR_PDF: 'a[href*="PDF"], #btnPDF, .btn-pdf',

    // Sin movimiento
    SIN_MOVIMIENTO: '.sin-movimiento, .no-data, #mensajeSinDatos',
  },

  // === SITUACIÓN TRIBUTARIA ===
  SITUACION: {
    // Consulta
    RUT_CONSULTA: 'input[name="RUT"], #rutConsulta',
    BTN_CONSULTAR: '#btnConsultar, input[type="submit"]',

    // Datos del contribuyente
    RAZON_SOCIAL: '.razon-social, #razonSocial, td:contains("Razón Social") + td',
    NOMBRE_FANTASIA: '.nombre-fantasia, #nombreFantasia',
    INICIO_ACTIVIDADES: '#inicioActividades, td:contains("Inicio") + td',

    // Actividades económicas
    TABLA_ACTIVIDADES: 'table.actividades, #tablaActividades',
    CODIGO_ACTIVIDAD: 'td.codigo-actividad, td:first-child',
    DESC_ACTIVIDAD: 'td.desc-actividad, td:nth-child(2)',
    AFECTA_IVA: 'td.afecta-iva, td:nth-child(3)',

    // Estado tributario
    ESTADO_DTE: '#estadoDTE, .estado-dte',
    CONTRIBUYENTE_IVA: '#contribuyenteIVA, .contribuyente-iva',
    TASA_PPM: '#tasaPPM, .tasa-ppm',

    // Deudas
    INDICADOR_MORA: '.indicador-mora, #enMora',
    MONTO_DEUDA: '#montoDeuda, .monto-deuda',

    // Descargas
    BTN_CERTIFICADO: '#btnCertificado, a[href*="certificado"]',
    BTN_IMPRIMIR: '#btnImprimir, a[href*="imprimir"]',
  },

  // === CERTIFICADOS ===
  CERTIFICADOS: {
    // Situación tributaria
    BTN_GENERAR_CERT: '#btnGenerarCert, button[name="generar"]',
    LINK_DESCARGA: 'a[href*=".pdf"], .link-certificado',

    // Certificado de deuda
    TABLA_DEUDAS: '#tablaDeudas, table.deudas',
    SIN_DEUDA: '.sin-deuda, #mensajeSinDeuda',

    // Estado
    PROCESANDO: '.procesando, .loading, #spinner',
    CERT_LISTO: '.certificado-listo, .cert-ready',
  },

  // === COMÚN ===
  COMMON: {
    // Carga de página
    LOADING: '.loading, .spinner, #loading, [aria-busy="true"]',
    OVERLAY: '.overlay, .modal-backdrop',

    // Sesión
    SESION_EXPIRADA: '.sesion-expirada, #mensajeSesionExpirada',
    BTN_RENOVAR_SESION: '#btnRenovarSesion, a[href*="renovar"]',

    // Errores del sistema
    ERROR_SISTEMA: '.error-sistema, .error-500, #errorSistema',
    MANTENIMIENTO: '.mantenimiento, #paginaMantenimiento',

    // Frames
    FRAME_PRINCIPAL: 'frame[name="main"], iframe[name="main"]',
    FRAME_CONTENIDO: 'frame[name="contenido"], iframe#contenido',
  },
} as const

// ============================================================================
// CÓDIGOS F29
// ============================================================================

export const F29_CODIGOS = {
  // DÉBITOS FISCALES
  DEBITOS: {
    20: { nombre: 'Ventas y/o servicios exentos', seccion: 'debitos' },
    89: { nombre: 'IVA por ventas y servicios del giro', seccion: 'debitos' },
    47: { nombre: 'IVA ventas bienes inmuebles', seccion: 'debitos' },
    48: { nombre: 'IVA reintegrado proporcional', seccion: 'debitos' },
  },

  // CRÉDITOS FISCALES
  CREDITOS: {
    520: { nombre: 'IVA importaciones', seccion: 'creditos' },
    538: { nombre: 'IVA soportado en compras del giro', seccion: 'creditos' },
    563: { nombre: 'IVA compras supermercado', seccion: 'creditos' },
    519: { nombre: 'IVA activo fijo', seccion: 'creditos' },
    595: { nombre: 'Crédito Art. 28 por utilidades absorbidas', seccion: 'creditos' },
    502: { nombre: 'IVA crédito sin derecho a devolución', seccion: 'creditos' },
    503: { nombre: 'IVA crédito por cambio de sujeto', seccion: 'creditos' },
  },

  // IMPUESTO DETERMINADO
  IMPUESTO: {
    91: { nombre: 'IVA determinado (débito - crédito)', seccion: 'impuesto' },
    92: { nombre: 'Remanente de crédito mes anterior', seccion: 'impuesto' },
    93: { nombre: 'Devolución solicita por exportador', seccion: 'impuesto' },
  },

  // PPM
  PPM: {
    30: { nombre: 'PPM neto determinado', seccion: 'ppm' },
    48: { nombre: 'PPM tasa variable', seccion: 'ppm' },
    50: { nombre: 'Diferencia PPM determinado', seccion: 'ppm' },
  },

  // RETENCIONES
  RETENCIONES: {
    151: { nombre: 'Retención sobre honorarios', seccion: 'retenciones' },
    153: { nombre: 'Retención sobre servicios de terceros', seccion: 'retenciones' },
    48: { nombre: 'Retención impuesto adicional', seccion: 'retenciones' },
  },

  // RESULTADOS
  RESULTADOS: {
    304: { nombre: 'Total a pagar', seccion: 'total' },
    60: { nombre: 'Remanente para período siguiente', seccion: 'total' },
    85: { nombre: 'PPM a devolver por 12 ter', seccion: 'total' },
  },
} as const

// ============================================================================
// CONFIGURACIÓN
// ============================================================================

export const SII_CONFIG = {
  // Timeouts (milisegundos)
  TIMEOUTS: {
    PAGE_LOAD: 30000,
    NAVIGATION: 45000,
    LOGIN: 60000,
    FORM_SUBMIT: 120000,
    DOWNLOAD: 60000,
    ELEMENT_VISIBLE: 10000,
    ELEMENT_CLICKABLE: 5000,
  },

  // Reintentos
  RETRIES: {
    MAX_RETRIES: 3,
    RETRY_DELAY_MS: 5000,
    EXPONENTIAL_BACKOFF: true,
    MAX_DELAY_MS: 60000,
  },

  // Screenshots
  SCREENSHOTS: {
    ENABLED: true,
    ON_ERROR: true,
    ON_SUCCESS: false,
    ON_STEP: true,
    QUALITY: 80,
    FULL_PAGE: false,
  },

  // Navegador
  BROWSER: {
    HEADLESS: true,
    SLOW_MO: 100, // ms entre acciones
    VIEWPORT: { width: 1920, height: 1080 },
    USER_AGENT: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    LOCALE: 'es-CL',
    TIMEZONE: 'America/Santiago',
  },

  // Anti-detección
  ANTI_DETECTION: {
    ENABLED: true,
    RANDOM_DELAYS: true,
    MIN_DELAY_MS: 500,
    MAX_DELAY_MS: 2000,
    MOUSE_MOVEMENTS: true,
    HUMAN_TYPING: true,
  },

  // Horarios permitidos (hora Chile)
  HORARIOS: {
    ENABLED: false, // Activar para respetar horarios SII
    INICIO: '07:00',
    FIN: '23:00',
    DIAS_HABILES: [1, 2, 3, 4, 5], // Lunes a Viernes
  },

  // Rate limiting
  RATE_LIMIT: {
    MAX_REQUESTS_PER_MINUTE: 10,
    MAX_REQUESTS_PER_HOUR: 100,
    COOLDOWN_AFTER_ERROR_MS: 30000,
  },
} as const

// ============================================================================
// MENSAJES DE ERROR CONOCIDOS
// ============================================================================

export const SII_ERRORS = {
  // Autenticación
  AUTH: {
    INVALID_CREDENTIALS: 'RUT o clave incorrectos',
    ACCOUNT_LOCKED: 'Cuenta bloqueada por múltiples intentos',
    SESSION_EXPIRED: 'Sesión expirada',
    CAPTCHA_REQUIRED: 'Se requiere completar CAPTCHA',
    CERTIFICATE_ERROR: 'Error en certificado digital',
    CLAVE_UNICA_ERROR: 'Error en Clave Única',
  },

  // F29
  F29: {
    PERIOD_NOT_AVAILABLE: 'Período no disponible para declaración',
    ALREADY_SUBMITTED: 'Ya existe declaración para este período',
    VALIDATION_ERROR: 'Error de validación en formulario',
    CALCULATION_MISMATCH: 'Los cálculos no coinciden',
    SUBMISSION_FAILED: 'Error al enviar declaración',
  },

  // Libros
  LIBROS: {
    NO_DATA: 'Sin movimientos para el período',
    DOWNLOAD_FAILED: 'Error al descargar archivo',
    PERIOD_NOT_AVAILABLE: 'Período no disponible',
  },

  // Sistema
  SYSTEM: {
    MAINTENANCE: 'Sistema en mantenimiento',
    UNAVAILABLE: 'Servicio no disponible',
    TIMEOUT: 'Tiempo de espera agotado',
    NETWORK_ERROR: 'Error de conexión',
    UNKNOWN: 'Error desconocido',
  },
} as const

// ============================================================================
// TIPOS DE ACTIVIDADES ECONÓMICAS
// ============================================================================

export const ACTIVIDADES_IVA = {
  AFECTAS: ['Primera categoría afectas', 'Segunda categoría afectas'],
  EXENTAS: ['Primera categoría exentas', 'Segunda categoría exentas'],
} as const

// ============================================================================
// EXPRESIONES REGULARES
// ============================================================================

export const SII_PATTERNS = {
  RUT: /^(\d{1,2})\.?(\d{3})\.?(\d{3})-?([\dkK])$/,
  RUT_SIMPLE: /^\d{7,8}[\dkK]$/,
  FOLIO: /^\d{10,15}$/,
  PERIODO: /^\d{4}(0[1-9]|1[0-2])$/, // YYYYMM
  MONTO: /^\$?\s*[\d.,]+$/,
  FECHA_SII: /^\d{2}\/\d{2}\/\d{4}$/, // DD/MM/YYYY
} as const

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function formatRut(rut: string): string {
  // Remove dots and dash
  const clean = rut.replace(/\./g, '').replace(/-/g, '')

  if (clean.length < 2) return rut

  const dv = clean.slice(-1)
  const numero = clean.slice(0, -1)

  // Format with dots
  const formatted = numero.replace(/\B(?=(\d{3})+(?!\d))/g, '.')

  return `${formatted}-${dv}`
}

export function parseRut(rut: string): { numero: string; dv: string } | null {
  const match = rut.match(SII_PATTERNS.RUT)
  if (!match) return null

  const numero = `${match[1]}${match[2]}${match[3]}`
  const dv = match[4].toUpperCase()

  return { numero, dv }
}

export function validarRut(rut: string): boolean {
  const parsed = parseRut(rut)
  if (!parsed) return false

  const { numero, dv } = parsed

  // Calcular dígito verificador
  let suma = 0
  let multiplicador = 2

  for (let i = numero.length - 1; i >= 0; i--) {
    suma += parseInt(numero[i]) * multiplicador
    multiplicador = multiplicador === 7 ? 2 : multiplicador + 1
  }

  const resto = suma % 11
  const dvCalculado = resto === 0 ? '0' : resto === 1 ? 'K' : String(11 - resto)

  return dv === dvCalculado
}

export function formatPeriodo(year: number, month: number): string {
  return `${year}${month.toString().padStart(2, '0')}`
}

export function parsePeriodo(periodo: string): { year: number; month: number } | null {
  if (!SII_PATTERNS.PERIODO.test(periodo)) return null

  return {
    year: parseInt(periodo.slice(0, 4)),
    month: parseInt(periodo.slice(4, 6)),
  }
}

export function formatMonto(monto: number): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
  }).format(monto)
}
