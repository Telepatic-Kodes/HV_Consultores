# Estructura de Carpetas

```
HV-CONSULTORES/
├── docs/                          # Documentacion Obsidian
│   ├── README.md
│   └── *.md
│
├── public/                        # Assets estaticos
│   └── images/
│
├── src/
│   ├── app/                       # App Router (Next.js 14)
│   │   ├── layout.tsx            # Layout raiz
│   │   ├── page.tsx              # Landing page
│   │   ├── globals.css           # Estilos globales
│   │   │
│   │   ├── (auth)/               # Grupo de rutas auth
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   └── registro/
│   │   │       └── page.tsx
│   │   │
│   │   └── dashboard/            # Area protegida
│   │       ├── layout.tsx        # Layout del dashboard
│   │       ├── page.tsx          # Vista principal
│   │       │
│   │       ├── clasificador/     # HV-Class
│   │       │   ├── page.tsx
│   │       │   ├── actions.ts
│   │       │   └── clasificador-content.tsx
│   │       │
│   │       ├── f29/              # HV-F29
│   │       │   ├── page.tsx
│   │       │   ├── actions.ts
│   │       │   └── f29-content.tsx
│   │       │
│   │       ├── bots/             # HV-Bot
│   │       │   ├── page.tsx
│   │       │   ├── actions.ts
│   │       │   └── bots-content.tsx
│   │       │
│   │       ├── chat/             # HV-Chat
│   │       │   ├── page.tsx
│   │       │   ├── actions.ts
│   │       │   └── chat-content.tsx
│   │       │
│   │       ├── clientes/         # Gestion de clientes
│   │       │   ├── page.tsx
│   │       │   ├── actions.ts
│   │       │   └── clientes-content.tsx
│   │       │
│   │       ├── reportes/         # Reportes y metricas
│   │       │   ├── page.tsx
│   │       │   ├── actions.ts
│   │       │   ├── reportes-content.tsx
│   │       │   │
│   │       │   ├── ejecutivo/    # Dashboard Ejecutivo
│   │       │   │   ├── page.tsx
│   │       │   │   ├── actions.ts
│   │       │   │   └── ejecutivo-content.tsx
│   │       │   │
│   │       │   └── presentacion/ # Presentacion Board
│   │       │       ├── page.tsx
│   │       │       └── presentacion-content.tsx
│   │       │
│   │       └── configuracion/    # Ajustes
│   │           ├── page.tsx
│   │           ├── actions.ts
│   │           └── configuracion-content.tsx
│   │
│   ├── components/               # Componentes reutilizables
│   │   ├── ui/                   # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   ├── select.tsx
│   │   │   ├── tabs.tsx
│   │   │   ├── switch.tsx
│   │   │   ├── label.tsx
│   │   │   └── ...
│   │   │
│   │   ├── dashboard/            # Componentes del dashboard
│   │   │   ├── index.ts
│   │   │   ├── Sidebar.tsx
│   │   │   ├── TopNav.tsx
│   │   │   ├── MobileNav.tsx
│   │   │   ├── skeletons.tsx
│   │   │   │
│   │   │   ├── executive-charts/     # Graficos ejecutivos
│   │   │   │   ├── index.ts
│   │   │   │   ├── chart-utils.ts
│   │   │   │   ├── sparkline.tsx
│   │   │   │   ├── waterfall-chart.tsx
│   │   │   │   ├── bullet-chart.tsx
│   │   │   │   └── gauge-chart.tsx
│   │   │   │
│   │   │   ├── executive-kpis/       # KPIs premium
│   │   │   │   ├── index.ts
│   │   │   │   ├── kpi-sparkline.tsx
│   │   │   │   ├── kpi-comparison.tsx
│   │   │   │   ├── kpi-target.tsx
│   │   │   │   └── kpi-grid.tsx
│   │   │   │
│   │   │   ├── executive-tables/     # Tablas profesionales
│   │   │   │   ├── index.ts
│   │   │   │   ├── heatmap-table.tsx
│   │   │   │   ├── comparison-table.tsx
│   │   │   │   ├── ranking-table.tsx
│   │   │   │   └── summary-table.tsx
│   │   │   │
│   │   │   └── slides/               # Sistema de presentacion
│   │   │       ├── index.ts
│   │   │       ├── slide-container.tsx
│   │   │       ├── slide-templates.tsx
│   │   │       └── slide-builder.tsx
│   │   │
│   │   └── landing/              # Componentes del landing
│   │       ├── Header.tsx
│   │       ├── Hero.tsx
│   │       └── ...
│   │
│   ├── lib/                      # Utilidades
│   │   ├── supabase-server.ts    # Cliente Supabase (server)
│   │   ├── supabase-browser.ts   # Cliente Supabase (browser)
│   │   ├── utils.ts              # Helpers generales
│   │   ├── reportes.ts           # Generador reportes basicos
│   │   └── reportes-ejecutivo.ts # Generador PDF ejecutivo
│   │
│   ├── types/                    # Tipos TypeScript
│   │   ├── database.types.ts     # Tipos generados de Supabase
│   │   └── reportes-ejecutivo.types.ts # Tipos reportes ejecutivos
│   │
│   └── middleware.ts             # Middleware de autenticacion
│
├── .env.local                    # Variables de entorno
├── next.config.js                # Configuracion Next.js
├── tailwind.config.ts            # Configuracion Tailwind
├── tsconfig.json                 # Configuracion TypeScript
└── package.json                  # Dependencias
```

## Convenciones de Nombres

| Tipo | Convencion | Ejemplo |
|------|------------|---------|
| Carpetas | kebab-case | `dashboard/`, `clientes/` |
| Componentes | PascalCase | `ClasificadorContent.tsx` |
| Archivos componente | kebab-case | `clasificador-content.tsx` |
| Server Actions | camelCase | `enviarMensaje()` |
| Tipos | PascalCase | `ClienteConStats` |

## Modulos Principales

| Carpeta | Descripcion |
|---------|-------------|
| `clasificador/` | HV-Class - Clasificador IA de documentos |
| `f29/` | HV-F29 - Formularios tributarios |
| `bots/` | HV-Bot - Automatizacion RPA |
| `chat/` | HV-Chat - Asistente IA |
| `clientes/` | Gestion de clientes |
| `reportes/` | Reportes y metricas |
| `reportes/ejecutivo/` | Dashboard ejecutivo McKinsey style |
| `reportes/presentacion/` | Sistema de slides para directorio |
| `configuracion/` | Ajustes del sistema |

## Ver tambien

- [[Arquitectura General]]
- [[Server Actions]]
- [[Reportes]]
- [[Componentes UI]]
