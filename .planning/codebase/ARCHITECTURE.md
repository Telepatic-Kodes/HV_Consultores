# Architecture

**Analysis Date:** 2026-02-09

## Pattern Overview

**Overall:** Multi-tier microservices with Next.js frontend + separate Express RPA server

**Key Characteristics:**
- Next.js 14 App Router for frontend (React 18)
- Dedicated Node.js/Express RPA automation server for Playwright-based tasks
- Supabase for authentication, realtime subscriptions, and database
- Task-based execution pattern with browser pool management
- Server Actions for server-side data operations
- Realtime event streaming via WebSockets (Supabase Realtime)

## Layers

**Presentation (Client):**
- Purpose: React components with server-side rendering via Next.js 14
- Location: `src/app/` (pages), `src/components/`
- Contains: Pages, layouts, UI components (Radix UI primitives)
- Depends on: Server Actions, API routes, hooks
- Used by: Web browsers, end users

**API/Route Layer (Next.js):**
- Purpose: HTTP endpoints for backend operations
- Location: `src/app/api/`
- Contains: Route handlers (`route.ts` files), webhook endpoints
- Depends on: Supabase client, RPA server communication, third-party services
- Used by: Frontend via fetch, external webhooks, RPA server callbacks

**Business Logic (Server):**
- Purpose: Core application logic and data orchestration
- Location: `src/lib/services/`, `src/lib/*.ts` utility files
- Contains: Report generation, alert rules, bank categorization, SII RPA coordination
- Depends on: Database (Supabase), external APIs (Nubox, SII)
- Used by: API routes, Server Actions

**Data Access (Supabase):**
- Purpose: Database queries, real-time subscriptions, authentication
- Location: `src/lib/supabase-server.ts`, `src/lib/supabase-browser.ts`
- Contains: Supabase client initialization, type-safe database interfaces
- Depends on: Supabase project configuration
- Used by: All layers for data persistence and auth

**RPA Automation Server:**
- Purpose: Browser automation for SII and bank portals
- Location: `rpa-server/src/`
- Contains: Playwright-based task executors, browser management, credential handling
- Depends on: Browser pool, task definitions, webhook callbacks
- Used by: Main app via HTTP API calls to `RPA_SERVER_URL`

**Infrastructure/Utilities:**
- Purpose: Logging, retry logic, encryption, webhooks
- Location: `rpa-server/src/utils/`, `src/lib/` utilities
- Contains: Logger, retry wrapper, webhook sender, credential encryption
- Depends on: Environment variables, external services
- Used by: All task and service layers

## Data Flow

**Dashboard Load Flow:**

1. Browser requests `/dashboard` page
2. Next.js renders `src/app/dashboard/page.tsx` (Server Component)
3. Page calls multiple Server Actions from `src/app/dashboard/actions.ts`:
   - `getDashboardStats()` → Supabase query for stats
   - `getModulosStatus()` → Module health status
   - `getActividadReciente()` → Recent activity log
   - `getDocumentosPorDia()` → Chart data
   - `getF29PorMes()` → F29 submission metrics
   - `getBotsActividad()` → Bot execution stats
   - `getKPIs()` → Key performance indicators
4. Server Actions fetch from Supabase database using typed client (`src/lib/supabase-server.ts`)
5. Data rendered with `Suspense` boundaries for streaming UI
6. Charts, tables, and metrics display using Recharts and custom components

**RPA Task Execution Flow:**

1. User triggers task (e.g., "Execute F29 Download") from `src/app/dashboard/sii/`
2. Frontend calls API route `src/app/api/sii-rpa/execute/route.ts` (POST)
3. API route:
   - Verifies authentication via Supabase
   - Retrieves job details and encrypted credentials from database
   - Decrypts credentials using `src/lib/sii-rpa/encryption`
   - Sends HTTP POST to RPA server at `${RPA_SERVER_URL}/api/execute`
4. RPA Server (`rpa-server/src/server.ts`) receives request:
   - Validates API key via middleware (`rpa-server/src/middleware/auth.ts`)
   - TaskExecutor (`rpa-server/src/tasks/task-executor.ts`) creates task instance
   - Acquires browser from pool (`rpa-server/src/automation/browser-manager.ts`)
   - Task executes steps (e.g., `F29DownloadTask`)
   - Results sent back via webhook to `src/app/api/sii-rpa/webhook/route.ts`
5. Main app stores result in database, triggers realtime notifications
6. Dashboard updates via RealtimeProvider subscription

**Document Classification Flow:**

1. User uploads document(s) via `DocumentBatchUpload` component
2. Document stored in Supabase Storage
3. Server Action processes via bank-rpa module (`src/lib/bank-rpa/`)
4. Parser detects format (PDF/Excel/CSV) via `src/lib/bank-rpa/parsers/`
5. Normalizer standardizes transaction data via `src/lib/bank-rpa/normalizer.ts`
6. Categorization Engine applies rules via `src/lib/bank-rpa/categorization/rules-engine.ts`
7. Reconciliation matches against SII data via `src/lib/bank-rpa/reconciliation/sii-matcher.ts`
8. Results persisted to database, real-time notification dispatched
9. UI updates via Supabase Realtime subscription

**State Management:**
- **Client-side:** React Context (RealtimeProvider in `src/providers/realtime-provider.tsx`)
- **Server-side:** Supabase database (source of truth)
- **Real-time:** Supabase Realtime WebSocket subscriptions (Broadcast, Presence, Postgres Changes)
- **Realtime Hooks:** `src/hooks/use-realtime.ts` (useNotificacionesRealtime, useBotJobsRealtime, etc.)

## Key Abstractions

**BaseTask (Abstract Class):**
- Purpose: Foundation for all RPA automation tasks
- Examples: `rpa-server/src/tasks/f29-download.task.ts`, `rpa-server/src/tasks/login.task.ts`
- Pattern: Template Method - subclasses implement `execute()`, inherit step management
- Responsibilities: Logging, error handling, screenshot capture, webhook notification

**BrowserManager (Singleton):**
- Purpose: Pool of Playwright browsers for concurrent RPA execution
- Location: `rpa-server/src/automation/browser-manager.ts`
- Pattern: Object Pool + Singleton
- Methods: `acquireBrowser()`, `releaseBrowser()`, `initialize()`, `closeAll()`

**CategorizationRulesEngine:**
- Purpose: Apply transaction categorization rules
- Location: `src/lib/bank-rpa/categorization/rules-engine.ts`
- Pattern: Strategy Pattern (pluggable rule definitions)
- Usage: Parse transaction descriptions, apply regex/keyword rules, return category

**SIIMatcher:**
- Purpose: Match bank transactions against SII tax documents
- Location: `src/lib/bank-rpa/reconciliation/sii-matcher.ts`
- Pattern: Matching algorithm with fuzzy text comparison
- Usage: Cross-reference invoices, receipts, and bank transactions

**RealtimeProvider:**
- Purpose: Centralized realtime event management
- Location: `src/providers/realtime-provider.tsx`
- Pattern: React Context + Hooks
- State: notificaciones, eventosRecientes, botsEnEjecucion, isConnected

## Entry Points

**Frontend Application:**
- Location: `src/app/layout.tsx`
- Triggers: Browser navigation to `/`
- Responsibilities: Root layout, font loading, metadata, auth session provider setup

**Dashboard Page:**
- Location: `src/app/dashboard/page.tsx`
- Triggers: Authenticated user navigates to `/dashboard`
- Responsibilities: Load stats, render KPIs, display charts, show module status

**SII RPA API Endpoint:**
- Location: `src/app/api/sii-rpa/execute/route.ts`
- Triggers: Frontend POST request to trigger task
- Responsibilities: Validate auth, fetch credentials, call RPA server, update job status

**RPA Server:**
- Location: `rpa-server/src/index.ts`
- Triggers: `npm run dev` (development) or deployment startup
- Responsibilities: Initialize browser pool, start Express server, listen for execute requests

**Authentication Flow:**
- Location: `src/app/(auth)/login/page.tsx`, `src/app/(auth)/registro/page.tsx`
- Uses: `@supabase/auth-helpers-nextjs` for session management
- Stores: Auth state in Supabase, cookies for session persistence

## Error Handling

**Strategy:** Layered error handling with logging and user notifications

**Patterns:**

1. **Server Actions (src/app/dashboard/actions.ts):**
   - Try-catch blocks wrap Supabase queries
   - Return error objects or default values
   - Log via `console.error()` for debugging

2. **API Routes (src/app/api/):**
   - Return NextResponse with appropriate HTTP status codes (400, 401, 404, 500)
   - Include `success: false` and error message in JSON response
   - Log via `console.error()`

3. **RPA Server (rpa-server/src/):**
   - Use `logger.error()` from custom logger (`rpa-server/src/utils/logger.ts`)
   - Send error notifications via webhook callback
   - Capture screenshots on failure for debugging
   - Set task status to 'failed' with error details

4. **Task Execution:**
   - BaseTask handles step failures
   - Automatic retry logic via `rpa-server/src/utils/retry.ts`
   - On critical error, release browser, abort task, notify main app

5. **Frontend (React Components):**
   - Suspense boundaries for loading states
   - Error components show user-friendly messages
   - Toast notifications via Sonner for transient feedback
   - Console logging for development

## Cross-Cutting Concerns

**Logging:**
- RPA Server: Custom logger in `rpa-server/src/utils/logger.ts` (info, error, debug levels)
- Frontend: `console.log()`, `console.error()` in browser DevTools
- Database: Audit logs table (`audit_logs`) in Supabase tracks user actions

**Validation:**
- Frontend: TypeScript types enforce structure at compile time
- API Routes: Request body validation before processing (check required fields)
- Supabase: Database constraints and RLS (Row Level Security) policies
- RPA Tasks: Credential validation before browser automation

**Authentication:**
- Supabase Auth: JWT-based with session cookies
- API Routes: `supabase.auth.getUser()` verifies session
- RPA Server: API key validation in `rpa-server/src/middleware/auth.ts` via `X-API-Key` header
- Dashboard: Protected route via layout check (redirect to login if no session)

**Concurrency:**
- Browser Pool: TaskExecutor manages concurrent task execution (max browsers configurable)
- Realtime Subscriptions: Multiple clients receive updates simultaneously
- Database: Supabase handles concurrent writes with optimistic locking

---

*Architecture analysis: 2026-02-09*
