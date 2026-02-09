# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-09)

**Core value:** Accounting team processes documents, tax forms, and government portal interactions with minimal manual effort — saving 200+ hours/month
**Current focus:** Phase 1 - Convex Migration

## Current Position

Phase: 1 of 6 (Convex Migration)
Plan: 3 of TBD in current phase
Status: In progress
Last activity: 2026-02-09 — Completed 01-03-PLAN.md

Progress: [███░░░░░░░] 30%

## Performance Metrics

**Velocity:**
- Total plans completed: 3
- Average duration: 65 min
- Total execution time: 3.3 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-convex-migration | 3 | 196 min | 65 min |

**Recent Trend:**
- Last 5 plans: 01-01 (71min), 01-02 (83min), 01-03 (42min)
- Trend: Improving velocity (42min vs 77min average)

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Migrate Supabase → Convex (user preference, Convex as primary backend)
- Keep demo mode (internal tool, no real auth needed)
- Preserve existing UI framework (avoid unnecessary rewrites)
- Upgrade Next.js for security patch (14.2.29 has known vulnerability)
- Use in-memory filtering for compound queries (Convex index limitation, works for small-to-medium datasets)
- Default to soft delete pattern (preserve audit trail, allow data recovery)
- Manually traverse relationships in queries (Convex doesn't support SQL joins)
- Use ConvexHttpClient in Server Actions (server context requires HTTP client, not React hooks)
- Create temporary _generated API shim (TypeScript needs import resolution before convex dev runs)
- Preserve Server Action signatures (minimize breaking changes for calling components)

### Pending Todos

- Run `npx convex dev` to authenticate and generate real API types
- Replace temporary _generated shims with actual Convex-generated files
- Set `NEXT_PUBLIC_CONVEX_URL` environment variable
- Migrate remaining non-critical dashboard actions (chat, clasificador, bancos, configuracion)
- Add documento_aprobaciones and workflow tables to schema when workflow features needed

### Blockers/Concerns

**From codebase analysis:**
- Convex migration affects all data access patterns (realtime subscriptions, queries, mutations)
- 462+ database queries may need connection pooling strategy with Convex
- RPA server communicates with main app via webhooks - ensure Convex can handle webhook writes
- Auth middleware currently disabled - clarify demo mode implementation for Convex

**From 01-03 execution:**
- Performance: In-memory aggregation works now, but watch if dataset grows >10k docs per query
- Type safety: Using `as any` casts temporarily until _generated types exist
- Missing features: Some actions have TODO markers for schema additions (aprobaciones, workflow)

## Session Continuity

Last session: 2026-02-09 (plan execution)
Stopped at: Completed 01-03-PLAN.md - Dashboard Server Actions migrated to Convex
Resume file: None
