# Reportes

> Modulo de reportes y metricas del sistema con visualizaciones ejecutivas estilo McKinsey/Deloitte.

## Ubicacion

```
src/app/dashboard/reportes/
├── page.tsx                    # Pagina principal
├── actions.ts                  # Server actions basicos
├── reportes-content.tsx        # Contenido con navegacion
├── ejecutivo/                  # Dashboard Ejecutivo
│   ├── page.tsx
│   ├── actions.ts
│   └── ejecutivo-content.tsx
└── presentacion/               # Presentacion Board
    ├── page.tsx
    └── presentacion-content.tsx
```

## Rutas Disponibles

| Ruta | Descripcion |
|------|-------------|
| `/dashboard/reportes` | Reportes basicos + navegacion a modulos ejecutivos |
| `/dashboard/reportes/ejecutivo` | Dashboard ejecutivo con KPIs premium |
| `/dashboard/reportes/presentacion` | Sistema de slides para directorio |

---

## Modulo Ejecutivo (Premium)

### Componentes de Graficos Ejecutivos

```
src/components/dashboard/executive-charts/
├── index.ts                    # Exports
├── chart-utils.ts              # Colores y utilidades
├── sparkline.tsx               # Mini graficos de tendencia
├── waterfall-chart.tsx         # Analisis flujo de caja
├── bullet-chart.tsx            # KPI vs meta
└── gauge-chart.tsx             # Medidores circulares
```

### Paleta de Colores Ejecutivos

```typescript
const EXECUTIVE_COLORS = {
  primary: '#0f3460',      // Navy Blue (McKinsey)
  secondary: '#1a5091',    // Consulting Blue
  accent: '#d4a418',       // Executive Gold
  success: '#059669',      // Green
  warning: '#d97706',      // Amber
  danger: '#dc2626',       // Red
  neutral: '#6b7280',      // Gray
  bgCard: '#ffffff',
  bgPage: '#f8fafc',
  border: '#e2e8f0',
  textPrimary: '#0f172a',
  textSecondary: '#64748b',
}
```

### KPI Cards Premium

```
src/components/dashboard/executive-kpis/
├── index.ts
├── kpi-sparkline.tsx           # KPI con mini grafico
├── kpi-comparison.tsx          # Comparativa periodo anterior
├── kpi-target.tsx              # KPI con meta y progreso
└── kpi-grid.tsx                # Grid responsivo
```

**Estructura KPI Card:**
```
┌─────────────────────────────────┐
│ VENTAS TOTALES          [icon] │
├─────────────────────────────────┤
│ $124.500.000                    │
│ ▁▂▃▄▅▆▇ (sparkline)            │
│ +12.5% vs mes anterior    ↑    │
└─────────────────────────────────┘
```

### Tablas Profesionales

```
src/components/dashboard/executive-tables/
├── index.ts
├── heatmap-table.tsx           # Celdas con gradiente
├── comparison-table.tsx        # Dos periodos lado a lado
├── ranking-table.tsx           # Posiciones con movimientos
└── summary-table.tsx           # Agrupada con subtotales
```

---

## Dashboard Ejecutivo

### Server Actions

```typescript
// src/app/dashboard/reportes/ejecutivo/actions.ts

getExecutiveDashboardData(clienteId?, periodo?): ExecutiveDashboardData
getExecutiveKPIs(clienteId?, periodo?): ExecutiveKPI[]
getWaterfallData(clienteId, periodo): WaterfallDataPoint[]
getCategoryBreakdown(clienteId, periodo): CategoryBreakdown[]
getExecutiveInsights(clienteId, periodo): Insight[]
```

### Tipos Principales

```typescript
// src/types/reportes-ejecutivo.types.ts

interface ExecutiveDashboardData {
  periodo: string
  kpis: ExecutiveKPI[]
  waterfall: WaterfallDataPoint[]
  categoryBreakdown: CategoryBreakdown[]
  evolution: TimeSeriesPoint[]
  insights: Insight[]
  recommendations?: Recommendation[]
}

interface ExecutiveKPI {
  id: string
  label: string
  value: number
  previousValue?: number
  change?: number
  changePercent?: number
  target?: number
  targetPercent?: number
  sparklineData?: number[]
  format: 'currency' | 'number' | 'percent'
  trend: 'up' | 'down' | 'neutral'
  status: 'success' | 'warning' | 'danger' | 'neutral'
}

interface Insight {
  id: string
  type: 'positive' | 'negative' | 'neutral' | 'alert'
  category: 'trend' | 'anomaly' | 'comparison' | 'recommendation' | 'milestone'
  title: string
  description: string
  metric?: { value: number; change: number; unit: string }
  priority: 1 | 2 | 3
  icon?: string
}
```

### Layout del Dashboard

```
┌──────────────────────────────────────────────────────┐
│  DASHBOARD EJECUTIVO    [Periodo ▼] [Cliente ▼] [⬇] │
├──────────────────────────────────────────────────────┤
│ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐    │
│ │ KPI │ │ KPI │ │ KPI │ │ KPI │ │ KPI │ │ KPI │    │
│ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘    │
├──────────────────────────────────────────────────────┤
│ ┌─────────────────┐ ┌─────────────────┐             │
│ │   WATERFALL     │ │  EVOLUCION      │             │
│ │  Cash Flow      │ │  MENSUAL        │             │
│ │                 │ │                 │             │
│ └─────────────────┘ └─────────────────┘             │
├──────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────┐ │
│ │              INSIGHTS AUTOMATICOS               │ │
│ │  • Insight 1    • Insight 2    • Insight 3      │ │
│ └─────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────┘
```

---

## Presentacion Board

### Sistema de Slides

```
src/components/dashboard/slides/
├── index.ts
├── slide-container.tsx         # Container 16:9 con navegacion
├── slide-templates.tsx         # Plantillas de slides
└── slide-builder.tsx           # Generador de deck
```

### Plantillas Disponibles

| Plantilla | Uso |
|-----------|-----|
| TitleSlide | Apertura con logo y titulo |
| KPISlide | 4-6 KPIs principales |
| ChartSlide | Grafico unico (waterfall, area) |
| ComparisonSlide | Antes/despues |
| InsightSlide | Puntos clave numerados |
| SummarySlide | Cierre con proximos pasos |

### Controles de Teclado

| Tecla | Accion |
|-------|--------|
| `→` / `Espacio` | Siguiente slide |
| `←` | Slide anterior |
| `F` | Pantalla completa |
| `G` | Vista cuadricula |
| `P` | Play/Pause auto-play |
| `ESC` | Salir fullscreen |

### Caracteristicas

- Formato 16:9 profesional
- Modo pantalla completa
- Auto-play con timer configurable (15s default)
- Exportar a PDF
- Animaciones de transicion suaves
- Vista de cuadricula para navegacion rapida

---

## Informe PDF Ejecutivo

### Generador

```typescript
// src/lib/reportes-ejecutivo.ts

generarInformeEjecutivoPDF(datos: InformeEjecutivoData): void
```

### Estructura del PDF (4+ paginas)

```
Pagina 1: PORTADA
├── Logo HV Consultores
├── "INFORME EJECUTIVO MENSUAL"
├── Cliente y Periodo
└── Fecha de generacion

Pagina 2: RESUMEN EJECUTIVO
├── 4 KPIs principales en cuadros
├── 3 puntos clave (highlights)
└── Indicador de estado general

Pagina 3: ANALISIS DETALLADO
├── Grafico Waterfall de flujo de caja
├── Tabla de documentos procesados
└── Comparativa vs periodo anterior

Pagina 4: INSIGHTS Y RECOMENDACIONES
├── Insights numerados con iconos
├── Acciones recomendadas
└── Indicadores de riesgo
```

---

## Motor de Insights

### Tipos de Insights Automaticos

```typescript
// Ejemplos generados automaticamente
const insights = [
  {
    type: 'positive',
    category: 'trend',
    title: 'Ventas en aumento',
    description: 'Las ventas aumentaron 15% respecto al mes anterior',
    priority: 1
  },
  {
    type: 'alert',
    category: 'anomaly',
    title: 'Documentos pendientes',
    description: '3 documentos sin clasificar por mas de 7 dias',
    priority: 2
  },
  {
    type: 'neutral',
    category: 'recommendation',
    title: 'Revisar F29',
    description: 'Fecha limite de presentacion: dia 12',
    priority: 1
  }
]
```

---

## Reportes Basicos

### Server Actions Originales

```typescript
// src/app/dashboard/reportes/actions.ts

getMetricasGenerales(): MetricaGeneral[]
getDatosEvolucion(meses): DatosGrafico[]
getReportesDisponibles(): ReporteDisponible[]
generarReporte(reporteId): { success: boolean; data: any }
getProductividadContadores(): ProductividadContador[]
getClientesParaReportes(): Cliente[]
getPeriodosDisponibles(clienteId): string[]
getDatosF29ParaReporte(clienteId, periodo): DatosF29
getDocumentosParaReporte(clienteId, periodo): DocumentosReporte
getResumenMensualParaReporte(clienteId, periodo): ResumenMensual
```

### Exportacion de Reportes

| Formato | Funcion |
|---------|---------|
| PDF F29 | `generarPDFF29(datos)` |
| Excel F29 | `generarExcelF29(datos)` |
| Excel Documentos | `generarExcelDocumentos(datos)` |
| PDF Resumen | `generarPDFResumenMensual(datos)` |
| PDF Ejecutivo | `generarInformeEjecutivoPDF(datos)` |

---

## Dependencias

```json
{
  "recharts": "^2.x",
  "jspdf": "^2.x",
  "jspdf-autotable": "^3.x",
  "xlsx": "^0.x",
  "file-saver": "^2.x"
}
```

---

## Ver tambien

- [[HV-Class - Clasificador IA]]
- [[HV-F29 - Formularios Tributarios]]
- [[Clientes]]
- [[Tipos TypeScript]]
- [[Componentes UI]]
