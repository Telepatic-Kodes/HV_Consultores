# Roadmap: HV Consultores Production Overhaul

## Overview

Transform the HV Consultores accounting platform from a Supabase-backed prototype into a production-ready Convex-powered SaaS application. The journey moves from foundational backend migration through systematic code cleanup, UX refinement across landing and dashboard interfaces, performance optimization, and finally production deployment with security hardening.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Convex Migration** - Replace Supabase backend with Convex data layer
- [x] **Phase 2: Code Quality** - Fix TypeScript types, remove dead code, upgrade dependencies
- [ ] **Phase 3: Landing Page Polish** - Responsive design, fix assets, improve animations
- [ ] **Phase 4: Dashboard Polish** - Fix rendering issues, improve loading states, consistent styling
- [ ] **Phase 5: Performance Optimization** - Add caching, lazy loading, reduce bundle size
- [ ] **Phase 6: Production Deployment** - Clean builds, security headers, monitoring endpoints

## Phase Details

### Phase 1: Convex Migration
**Goal**: Application runs entirely on Convex backend with zero Supabase dependencies
**Depends on**: Nothing (first phase)
**Requirements**: CONV-01, CONV-02, CONV-03, CONV-04, CONV-05, CONV-06
**Success Criteria** (what must be TRUE):
  1. All data models (documents, clients, F29, bots, banks, chat) exist as Convex schemas
  2. All dashboard pages load data from Convex queries without errors
  3. Real-time updates work via Convex reactive queries (no Supabase realtime)
  4. Package.json contains zero Supabase dependencies
  5. Environment variables reference only Convex (no SUPABASE_URL or SUPABASE_KEY)
**Plans**: 5 plans

Plans:
- [x] 01-01-PLAN.md — Initialize Convex project and define complete schema
- [x] 01-02-PLAN.md — Create queries and mutations for all data models
- [x] 01-03-PLAN.md — Migrate Server Actions and components to Convex API
- [x] 01-04-PLAN.md — Replace Supabase Realtime with Convex reactive queries
- [x] 01-05-PLAN.md — Remove Supabase dependencies and verify clean build

### Phase 2: Code Quality
**Goal**: Codebase builds cleanly with proper TypeScript types and zero dead code
**Depends on**: Phase 1
**Requirements**: CODE-01, CODE-02, CODE-03, CODE-04, CODE-05, CODE-06
**Success Criteria** (what must be TRUE):
  1. Analytics code has zero `any` types (all properly typed interfaces)
  2. No commented-out code blocks, unused imports, or orphaned files remain
  3. Next.js build completes with zero TypeScript errors
  4. All pages show user-friendly error messages (no raw stack traces)
  5. Dependencies updated (Next.js security patch applied, ESLint 9, deprecated packages removed)
**Plans**: TBD

Plans:
- [x] 02-01-PLAN.md — Fix 9 TS errors, configure ESLint with @typescript-eslint
- [x] 02-02-PLAN.md — Remove @ts-nocheck from all 17 Server Action files
- [x] 02-03-PLAN.md — Remove @ts-nocheck from 67 remaining component/page/lib files

### Phase 3: Landing Page Polish
**Goal**: Landing page renders perfectly on all viewports with working assets
**Depends on**: Phase 2
**Requirements**: UXLP-01, UXLP-02, UXLP-03, UXLP-04, UXLP-05
**Success Criteria** (what must be TRUE):
  1. Landing page displays correctly on mobile (375px), tablet (768px), and desktop (1920px) viewports
  2. Hero stats show realistic values (no hardcoded zeros)
  3. All images load (favicon displays, no broken image icons)
  4. Animations and transitions feel professional (smooth, not janky)
  5. All navigation links navigate to valid pages (no 404s from header/footer)
**Plans**: TBD

Plans:
- [ ] TBD during planning

### Phase 4: Dashboard Polish
**Goal**: Dashboard provides consistent, error-free experience with professional UI
**Depends on**: Phase 3
**Requirements**: UXDB-01, UXDB-02, UXDB-03, UXDB-04, UXDB-05
**Success Criteria** (what must be TRUE):
  1. All dashboard modules (documents, F29, SII, banks, chat, reports) render without console errors
  2. Dashboard sidebar and content areas work on mobile and desktop viewports
  3. Loading skeletons appear during data fetch, empty states show when no data exists
  4. Consistent spacing, typography, and color palette across all pages
  5. All buttons, forms, and modals respond to user interaction correctly
**Plans**: TBD

Plans:
- [ ] TBD during planning

### Phase 5: Performance Optimization
**Goal**: Application loads quickly with optimized bundles and smart caching
**Depends on**: Phase 4
**Requirements**: PERF-01, PERF-02, PERF-03, PERF-04
**Success Criteria** (what must be TRUE):
  1. Analytics endpoints respond from cache (no repeated database hits for same query)
  2. Dashboard modules outside viewport lazy-load (not all loaded upfront)
  3. Images use next/image with proper sizing (no oversized downloads)
  4. Initial JavaScript bundle size under 300KB (measured via webpack-bundle-analyzer)
**Plans**: TBD

Plans:
- [ ] TBD during planning

### Phase 6: Production Deployment
**Goal**: Application deploys to Vercel with zero build errors and production-grade security
**Depends on**: Phase 5
**Requirements**: DEPL-01, DEPL-02, DEPL-03, DEPL-04, DEPL-05, DEPL-06
**Success Criteria** (what must be TRUE):
  1. `next build` completes on Vercel with zero errors or warnings
  2. Environment variables documented in README with example values
  3. Security headers (CSP, HSTS, X-Frame-Options) present in HTTP responses
  4. Bundle size optimized (tree-shaking verified, heavy modules dynamically imported)
  5. Health check endpoint `/api/health` returns 200 OK
  6. Custom 404 and 500 error pages display with HV Consultores branding
**Plans**: TBD

Plans:
- [ ] TBD during planning

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Convex Migration | 5/5 | **COMPLETE** | 2026-02-11 |
| 2. Code Quality | 3/3 | **COMPLETE** | 2026-02-11 |
| 3. Landing Page Polish | 0/TBD | Not started | - |
| 4. Dashboard Polish | 0/TBD | Not started | - |
| 5. Performance Optimization | 0/TBD | Not started | - |
| 6. Production Deployment | 0/TBD | Not started | - |
