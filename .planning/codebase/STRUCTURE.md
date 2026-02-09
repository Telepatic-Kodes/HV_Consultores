# Codebase Structure

**Analysis Date:** 2026-02-09

## Directory Layout

```
hv-consultores/
├── src/                                # Next.js frontend application
│   ├── app/                           # Next.js 14 App Router pages and routes
│   │   ├── layout.tsx                 # Root layout with fonts, metadata
│   │   ├── (auth)/                    # Authentication route group
│   │   │   ├── login/page.tsx         # Login page
│   │   │   └── registro/page.tsx      # Registration page
│   │   ├── api/                       # API route handlers
│   │   │   ├── sii-rpa/               # SII automation endpoints
│   │   │   │   ├── execute/route.ts   # Trigger RPA task
│   │   │   │   ├── status/route.ts    # Check task status
│   │   │   │   └── webhook/route.ts   # Receive RPA results
│   │   │   ├── analytics/             # Analytics/reporting endpoints
│   │   │   ├── alerts/                # Alert management endpoints
│   │   │   ├── reports/               # Report scheduling endpoints
│   │   │   └── webhooks/              # Third-party webhook receivers (Nubox)
│   │   └── dashboard/                 # Dashboard and feature pages
│   │       ├── layout.tsx             # Dashboard layout with sidebar
│   │       ├── page.tsx               # Main dashboard view
│   │       ├── actions.ts             # Server Actions for data loading
│   │       ├── sii/                   # SII automation UI
│   │       ├── reportes/              # Report generation UI
│   │       ├── clasificador/          # Document classification UI
│   │       ├── f29/                   # F29 form management UI
│   │       ├── bots/                  # Bot execution UI
│   │       ├── chat/                  # AI chat interface
│   │       └── configuracion/         # Settings/configuration
│   │
│   ├── components/                    # React components (Radix UI based)
│   │   ├── ui/                        # Primitive UI components
│   │   │   ├── card.tsx               # Card wrapper component
│   │   │   ├── button.tsx             # Button component
│   │   │   ├── dialog.tsx             # Modal dialog component
│   │   │   ├── dropdown-menu.tsx      # Dropdown menu component
│   │   │   ├── tabs.tsx               # Tabs component
│   │   │   ├── select.tsx             # Select dropdown component
│   │   │   ├── input.tsx              # Text input component
│   │   │   ├── textarea.tsx           # Textarea component
│   │   │   └── ... (20+ other primitives)
│   │   ├── dashboard/                 # Dashboard-specific components
│   │   │   ├── Sidebar.tsx            # Navigation sidebar
│   │   │   ├── TopNav.tsx             # Top navigation bar
│   │   │   ├── StatsCard.tsx          # Stat metric card
│   │   │   ├── NotificationsDropdown.tsx  # Notification menu
│   │   │   ├── charts.tsx             # Chart components (Recharts)
│   │   │   ├── realtime-toasts.tsx    # Real-time notification toasts
│   │   │   ├── DocumentBatchUpload.tsx  # Bulk document upload
│   │   │   ├── DocumentListView.tsx   # Table of documents
│   │   │   ├── DocumentAdvancedFilters.tsx  # Filter UI
│   │   │   ├── DocumentExportMenu.tsx # Export options
│   │   │   ├── executive-kpis/        # Executive dashboard KPIs
│   │   │   │   ├── kpi-grid.tsx
│   │   │   │   ├── kpi-target.tsx
│   │   │   │   ├── kpi-comparison.tsx
│   │   │   │   └── kpi-sparkline.tsx
│   │   │   ├── executive-charts/      # Executive-style chart components
│   │   │   ├── executive-tables/      # Executive data tables
│   │   │   ├── slides/                # Presentation slide builder
│   │   │   ├── index.ts               # Barrel export file
│   │   │   └── skeletons.tsx          # Loading skeleton components
│   │   ├── analytics/                 # Analytics-specific components
│   │   └── landing/                   # Landing page components
│   │
│   ├── lib/                           # Business logic and utilities
│   │   ├── supabase-server.ts         # Server-side Supabase client
│   │   ├── supabase-browser.ts        # Browser-side Supabase client
│   │   ├── external-services.ts       # Third-party service integrations
│   │   ├── nubox.ts                   # Nubox API integration
│   │   ├── queue.ts                   # Job queue management
│   │   ├── services/                  # Business logic services
│   │   │   ├── reportGenerator.ts     # Report generation engine
│   │   │   └── alertRuleEngine.ts     # Alert rule evaluation
│   │   ├── bank-rpa/                  # Bank statement processing
│   │   │   ├── types.ts               # Type definitions
│   │   │   ├── constants.ts           # Bank data, timeouts, formats
│   │   │   ├── index.ts               # Barrel exports
│   │   │   ├── normalizer.ts          # Normalize transactions
│   │   │   ├── parsers/               # Format-specific parsers
│   │   │   │   ├── index.ts
│   │   │   │   ├── excel-parser.ts    # XLSX/CSV parser
│   │   │   │   └── pdf-parser.ts      # PDF statement parser
│   │   │   ├── categorization/        # Transaction categorization
│   │   │   │   ├── index.ts
│   │   │   │   └── rules-engine.ts    # Rule-based categorization
│   │   │   └── reconciliation/        # Bank-to-SII matching
│   │   │       ├── index.ts
│   │   │       └── sii-matcher.ts     # Match transactions to tax docs
│   │   ├── sii-rpa/                   # SII portal automation
│   │   │   ├── constants.ts           # SII-specific constants
│   │   │   ├── encryption.ts          # Credential encryption/decryption
│   │   │   └── ... (other SII utilities)
│   │   └── analytics/                 # Analytics computation
│   │
│   ├── hooks/                         # React custom hooks
│   │   ├── use-realtime.ts            # Real-time subscription hooks
│   │   └── index.ts                   # Hook exports
│   │
│   ├── providers/                     # React Context providers
│   │   └── realtime-provider.tsx      # Real-time events and notifications
│   │
│   ├── types/                         # TypeScript type definitions
│   │   ├── database.types.ts          # Supabase auto-generated types (1199 lines)
│   │   ├── analytics.ts               # Analytics-related types
│   │   └── reportes-ejecutivo.types.ts  # Executive report types
│   │
│   ├── migrations/                    # Database migration scripts
│   └── __tests__/                     # Test files
│       ├── bank-rpa/                  # Bank RPA tests
│       │   ├── parsers.test.ts        # Parser unit tests
│       │   ├── normalizer.test.ts     # Normalizer tests
│       │   ├── rules-engine.test.ts   # Categorization tests
│       │   └── sii-matcher.test.ts    # Reconciliation tests
│       └── phase*.test.ts             # Feature/phase integration tests
│
├── rpa-server/                        # Separate Express server for RPA
│   ├── src/
│   │   ├── index.ts                   # Server entry point
│   │   ├── server.ts                  # Express app setup
│   │   ├── automation/
│   │   │   └── browser-manager.ts     # Playwright browser pool
│   │   ├── tasks/                     # Task implementations
│   │   │   ├── base-task.ts           # Abstract base class
│   │   │   ├── task-executor.ts       # Task orchestration
│   │   │   ├── login.task.ts          # SII login
│   │   │   ├── f29-download.task.ts   # F29 retrieval
│   │   │   ├── f29-submit.task.ts     # F29 submission
│   │   │   ├── libro-compras.task.ts  # Purchase log retrieval
│   │   │   ├── libro-ventas.task.ts   # Sales log retrieval
│   │   │   ├── situacion-tributaria.task.ts  # Tax status
│   │   │   └── banks/                 # Bank automation tasks
│   │   │       ├── bank-base-task.ts  # Abstract bank task
│   │   │       └── bancochile.task.ts # BancoChile specific
│   │   ├── middleware/
│   │   │   └── auth.ts                # API key validation
│   │   ├── selectors/
│   │   │   └── sii-selectors.ts       # CSS/XPath selectors
│   │   └── utils/
│   │       ├── logger.ts              # Logging utility
│   │       ├── retry.ts               # Retry logic with backoff
│   │       └── webhook.ts             # Webhook notification sender
│   ├── package.json
│   └── tsconfig.json
│
├── docs/                              # Project documentation
│   ├── CHECKLIST_RAPIDO.md
│   ├── FLUJOS_AVANZADOS.md
│   ├── GUIA_IMPLEMENTACION.md
│   └── plans/
│
├── .planning/
│   └── codebase/                      # GSD analysis documents
│       ├── ARCHITECTURE.md
│       └── STRUCTURE.md
│
├── public/                            # Static assets
├── package.json                       # Next.js app dependencies
├── tsconfig.json                      # TypeScript configuration
├── next.config.js                     # Next.js configuration
├── vitest.config.ts                   # Vitest configuration
├── components.json                    # Shadcn/ui config
└── .env.example                       # Environment variable template
```

## Directory Purposes

**src/app:**
- Purpose: Next.js App Router pages, layouts, and API routes
- Contains: All customer-facing pages, authentication, API endpoints, layouts
- Key files: `layout.tsx` (root layout), `dashboard/page.tsx` (main page)
- Routing: File-based routing (file = route)

**src/components:**
- Purpose: Reusable React components
- Contains: UI primitives (Radix UI wraps), dashboard widgets, forms
- Key files: `ui/` (50+ primitives), `dashboard/` (specific features)
- Pattern: Component exports in barrel files (`index.ts`)

**src/lib:**
- Purpose: Business logic, data access, external integrations
- Contains: Supabase clients, bank processing, SII automation, services
- Key files: `supabase-server.ts` (database), `bank-rpa/` (parsing/categorization)
- Pattern: Organized by domain (bank-rpa, sii-rpa, services)

**src/hooks:**
- Purpose: Custom React hooks for realtime subscriptions
- Contains: `use-realtime.ts` with hooks for notifications, bots, documents, F29
- Usage: Called from providers and components to subscribe to Supabase changes

**src/providers:**
- Purpose: React Context providers for app-wide state
- Contains: `realtime-provider.tsx` manages notifications, events, bot status
- Usage: Wrapped in `src/app/dashboard/layout.tsx` for protected pages

**src/types:**
- Purpose: TypeScript type definitions
- Contains: Database schema types (auto-generated from Supabase), custom types
- Key files: `database.types.ts` (1199 lines, all tables and relationships)

**src/__tests__:**
- Purpose: Unit and integration tests
- Contains: Vitest tests for bank-rpa module, phase-specific tests
- Pattern: Co-located with features (e.g., `bank-rpa/parsers.test.ts`)

**rpa-server:**
- Purpose: Separate Node.js server for Playwright browser automation
- Contains: Task definitions, browser pool management, credential handling
- Key files: `index.ts` (entry), `server.ts` (Express setup), `tasks/` (implementations)
- Communication: HTTP API with main app, webhooks for callbacks

**docs:**
- Purpose: Project documentation and implementation guides
- Contains: Implementation guides, roadmaps, deployment checklists
- Key files: Phase-specific implementation guides, quick checklists

**.planning/codebase:**
- Purpose: GSD (Guided Software Delivery) analysis documents
- Contains: Architecture, structure, conventions, testing patterns, concerns

## Key File Locations

**Entry Points:**
- `src/app/layout.tsx`: Root layout, font setup, metadata
- `src/app/dashboard/page.tsx`: Main dashboard (loads stats, charts, KPIs)
- `src/app/(auth)/login/page.tsx`: Login page
- `rpa-server/src/index.ts`: RPA server startup
- `rpa-server/src/server.ts`: Express application setup

**Configuration:**
- `next.config.js`: Next.js settings (redirects, headers)
- `tsconfig.json`: TypeScript configuration
- `package.json`: Dependencies and scripts
- `.env.example`: Required environment variables

**Core Logic:**
- `src/app/dashboard/actions.ts`: Server Actions (getDashboardStats, getModulosStatus, etc.)
- `src/lib/services/reportGenerator.ts`: PDF/presentation generation
- `src/lib/services/alertRuleEngine.ts`: Alert evaluation logic
- `src/lib/bank-rpa/categorization/rules-engine.ts`: Transaction categorization
- `src/lib/bank-rpa/reconciliation/sii-matcher.ts`: Bank-to-SII matching

**API Routes:**
- `src/app/api/sii-rpa/execute/route.ts`: Trigger RPA task
- `src/app/api/sii-rpa/webhook/route.ts`: Receive RPA results
- `src/app/api/analytics/queue/route.ts`: Queue analytics job
- `src/app/api/webhooks/nubox/route.ts`: Receive Nubox updates

**Authentication & Client Setup:**
- `src/lib/supabase-server.ts`: Server-side Supabase client (cookies, SSR)
- `src/lib/supabase-browser.ts`: Browser-side Supabase client
- `src/providers/realtime-provider.tsx`: Real-time context setup
- `src/hooks/use-realtime.ts`: Real-time subscription hooks

**Database Schema:**
- `src/types/database.types.ts`: Full Supabase schema (auto-generated)

**Testing:**
- `src/__tests__/bank-rpa/parsers.test.ts`: Parser unit tests
- `src/__tests__/bank-rpa/rules-engine.test.ts`: Categorization tests
- `vitest.config.ts`: Test runner configuration

## Naming Conventions

**Files:**
- Pages: PascalCase (e.g., `page.tsx` for routes)
- Components: PascalCase (e.g., `Dashboard.tsx`, `Sidebar.tsx`)
- Utilities/Services: camelCase (e.g., `reportGenerator.ts`, `logger.ts`)
- Types: camelCase for files (e.g., `database.types.ts`), PascalCase for types inside
- Tests: `*.test.ts` or `*.spec.ts` suffix (e.g., `parsers.test.ts`)

**Directories:**
- Feature areas: kebab-case (e.g., `bank-rpa`, `sii-rpa`, `executive-kpis`)
- Route groups: parentheses (e.g., `(auth)`, `(dashboard)`)
- Logical groupings: lowercase plural (e.g., `components`, `hooks`, `types`)

**Exports:**
- Barrel files: `index.ts` re-exports from directory
- Example: `src/components/dashboard/index.ts` exports all dashboard components
- Usage: `import { Sidebar, TopNav } from '@/components/dashboard'`

**Imports:**
- Path aliases: `@/` prefix (configured in `tsconfig.json`)
- Pattern: `import { Component } from '@/components/...'`
- Never: Relative imports like `import { x } from '../../../lib/...'`

## Where to Add New Code

**New Feature (e.g., new automation task):**
- Primary code: `src/app/dashboard/[feature]/page.tsx` (UI), `src/lib/services/[feature].ts` (logic)
- API endpoint: `src/app/api/[feature]/route.ts`
- Server Actions: Add to `src/app/dashboard/[feature]/actions.ts`
- Components: Create in `src/components/dashboard/[feature]/` as needed
- Tests: Create `src/__tests__/[feature].test.ts`

**New RPA Task (SII automation):**
- Task class: `rpa-server/src/tasks/[task-name].task.ts` (extend BaseTask)
- Register: Add import and create case in `TaskExecutor.createTask()`
- Selectors: Add CSS/XPath selectors to `rpa-server/src/selectors/sii-selectors.ts`
- Tests: Add test in RPA server test directory (if needed)

**New Component/Module:**
- UI primitive: `src/components/ui/[component].tsx`
- Dashboard widget: `src/components/dashboard/[widget].tsx`
- Custom hook: `src/hooks/use-[hook-name].ts`
- Service/utility: `src/lib/[domain]/[service].ts`
- Export: Add to barrel file `index.ts` in parent directory

**Utilities:**
- Shared helpers: `src/lib/[domain]/[utility].ts`
- RPA utilities: `rpa-server/src/utils/[utility].ts`
- Types: `src/types/[domain].ts`

## Special Directories

**src/migrations:**
- Purpose: Database schema changes (Supabase migrations)
- Generated: By Supabase CLI (`supabase migration new`)
- Committed: Yes (track schema in git)

**src/__tests__:**
- Purpose: Test files for application logic
- Generated: No (written by developers)
- Committed: Yes

**rpa-server:**
- Purpose: Separate Node.js/Express server for Playwright automation
- Generated: No
- Committed: Yes
- Startup: `npm run dev` in rpa-server directory (separate from main app)

**public:**
- Purpose: Static assets (images, fonts, downloads)
- Generated: No
- Committed: Yes (assets)

**.next:**
- Purpose: Next.js build output directory
- Generated: Yes (`npm run build`)
- Committed: No (in .gitignore)

**node_modules:**
- Purpose: Installed npm dependencies
- Generated: Yes (`npm install`)
- Committed: No (in .gitignore)

---

*Structure analysis: 2026-02-09*
