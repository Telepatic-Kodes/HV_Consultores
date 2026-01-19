// HV Consultores - SII RPA Server
// SII Portal Selectors and Configuration

export const SII_CONFIG = {
  URLS: {
    LOGIN: 'https://www.sii.cl/claveunica_sii/PortalIU/Login',
    LOGIN_RUT_CLAVE: 'https://www.sii.cl/sii_cvu/login/login.html',
    SITUACION_TRIBUTARIA: 'https://zeus.sii.cl/cvc/stc/stc.html',
    LIBRO_COMPRAS: 'https://www4.sii.cl/registrocompaborMUI/consulta',
    LIBRO_VENTAS: 'https://www4.sii.cl/conaborMUI/consulta',
    F29: 'https://www4.sii.cl/declaracionesInternetService/F29',
    F29_DECLARACION: 'https://www4.sii.cl/declaracionesInternetService/F29/declaracion',
    F29_RECTIFICATORIA: 'https://www4.sii.cl/declaracionesInternetService/F29/rectificatoria',
    F29_CONSULTA: 'https://www4.sii.cl/declaracionesInternetService/consultaF29',
    MI_SII: 'https://www.sii.cl/mipagina/index.html',
  },

  TIMEOUTS: {
    PAGE_LOAD: 30000,
    NAVIGATION: 45000,
    LOGIN: 60000,
    ELEMENT_VISIBLE: 10000,
    ELEMENT_CLICKABLE: 5000,
    DOWNLOAD: 60000,
  },

  SCREENSHOTS: {
    ENABLED: true,
    ON_ERROR: true,
    ON_SUCCESS: false,
    ON_STEP: true,
    QUALITY: 80,
    FULL_PAGE: false,
  },

  ANTI_DETECTION: {
    ENABLED: true,
    RANDOM_DELAYS: true,
    MIN_DELAY_MS: 500,
    MAX_DELAY_MS: 2000,
  },
} as const

export const SII_SELECTORS = {
  LOGIN: {
    RUT_INPUT: 'input[name="rut"], #rut, input[id*="rut"]',
    RUT_VERIFICADOR: 'input[name="dv"], #dv',
    PASSWORD_INPUT: 'input[type="password"], input[name="clave"], #clave',
    LOGIN_BUTTON: 'button[type="submit"], input[type="submit"], #bt_ingresar',
    CLAVE_UNICA_BUTTON: 'a[href*="claveunica"], .btn-clave-unica',
    CLAVE_UNICA_RUT: '#uname, input[name="uname"]',
    CLAVE_UNICA_PASSWORD: '#pword, input[name="pword"]',
    CLAVE_UNICA_SUBMIT: '#login-form button[type="submit"]',
    LOGGED_IN_INDICATOR: '.user-menu, [data-logged="true"], .menu-usuario, #menu_usuario',
    ERROR_MESSAGE: '.error-message, .alert-danger, .mensaje-error, #mensajeError',
  },

  SITUACION: {
    RUT_INPUT: 'input[name="RUT"], #rutConsulta',
    CONSULTAR_BUTTON: '#btnConsultar, input[type="submit"]',
    RAZON_SOCIAL: '.razon-social, #razonSocial',
    INICIO_ACTIVIDADES: '#inicioActividades',
    TABLA_ACTIVIDADES: 'table.actividades, #tablaActividades',
    ESTADO_DTE: '#estadoDTE, .estado-dte',
    CONTRIBUYENTE_IVA: '#contribuyenteIVA, .contribuyente-iva',
    TASA_PPM: '#tasaPPM, .tasa-ppm',
    INDICADOR_MORA: '.indicador-mora, #enMora',
    BTN_CERTIFICADO: '#btnCertificado, a[href*="certificado"]',
  },

  LIBROS: {
    PERIODO_MES: 'select[name="periodoMes"], #periodoMes',
    PERIODO_ANO: 'select[name="periodoAnno"], #periodoAnno',
    BTN_CONSULTAR: '#btnConsultar, button[type="submit"]',
    TABLA_DOCUMENTOS: 'table.documentos, #tablaDocumentos',
    TOTAL_NETO: '.total-neto, #totalNeto',
    TOTAL_IVA: '.total-iva, #totalIva',
    TOTAL_GENERAL: '.total-general, #totalGeneral',
    BTN_DESCARGAR_CSV: 'a[href*="CSV"], #btnCSV, .btn-csv',
    BTN_DESCARGAR_XML: 'a[href*="XML"], #btnXML',
    SIN_MOVIMIENTO: '.sin-movimiento, .no-data, #mensajeSinDatos',
  },

  F29: {
    // Navegación
    PERIODO_MES: 'select[name="mes"], #mes, #periodoMes',
    PERIODO_ANO: 'select[name="ano"], #ano, #periodoAno',
    BTN_NUEVA: '#btnNuevaDeclaracion, a[href*="nueva"]',
    BTN_RECTIFICATORIA: '#btnRectificatoria, a[href*="rectificatoria"]',
    BTN_CONTINUAR: '#btnContinuar, button[type="submit"]',

    // Campos del formulario por código
    CODIGO_20: 'input[name="codigo20"], #cod20, input[data-codigo="20"]',
    CODIGO_89: 'input[name="codigo89"], #cod89, input[data-codigo="89"]',
    CODIGO_520: 'input[name="codigo520"], #cod520, input[data-codigo="520"]',
    CODIGO_538: 'input[name="codigo538"], #cod538, input[data-codigo="538"]',
    CODIGO_563: 'input[name="codigo563"], #cod563, input[data-codigo="563"]',
    CODIGO_595: 'input[name="codigo595"], #cod595, input[data-codigo="595"]',
    CODIGO_30: 'input[name="codigo30"], #cod30, input[data-codigo="30"]',
    CODIGO_48: 'input[name="codigo48"], #cod48, input[data-codigo="48"]',
    CODIGO_91: 'input[name="codigo91"], #cod91, input[data-codigo="91"]',
    CODIGO_92: 'input[name="codigo92"], #cod92, input[data-codigo="92"]',
    CODIGO_151: 'input[name="codigo151"], #cod151, input[data-codigo="151"]',
    CODIGO_153: 'input[name="codigo153"], #cod153, input[data-codigo="153"]',
    CODIGO_304: 'input[name="codigo304"], #cod304, input[data-codigo="304"]',
    CODIGO_60: 'input[name="codigo60"], #cod60, input[data-codigo="60"]',

    // Acciones
    BTN_CALCULAR: '#btnCalcular, button[name="calcular"]',
    BTN_VALIDAR: '#btnValidar, button[name="validar"]',
    BTN_ENVIAR: '#btnEnviar, button[name="enviar"]',
    BTN_CONFIRMAR: '#btnConfirmar, .confirmar-envio, button.confirm',

    // Resultado
    FOLIO: '#folio, .numero-folio, [data-folio]',
    COMPROBANTE: '#comprobante, a[href*="comprobante"]',
    BTN_DESCARGAR_PDF: 'a[href*=".pdf"], #btnPDF, .btn-pdf',
    MENSAJE_EXITO: '.mensaje-exito, .alert-success',
    ERROR: '.mensaje-error, .alert-danger, .error',

    // Consulta de declaraciones
    TABLA_DECLARACIONES: '#tablaDeclaraciones, table.declaraciones',
    FILA_DECLARACION: 'tr.declaracion, tbody tr',
    LINK_FOLIO: 'a[href*="folio"], td.folio a',
  },

  COMMON: {
    LOADING: '.loading, .spinner, #loading',
    SESION_EXPIRADA: '.sesion-expirada, #mensajeSesionExpirada',
    ERROR_SISTEMA: '.error-sistema, .error-500',
  },
} as const
