# HV Consultores - Production Overhaul

## What This Is

A SaaS platform for Chilean accounting firms that automates document classification (AI), tax form generation (F29), RPA for government portals (SII, Previred), bank statement management, and provides an AI chat assistant for tax regulations. Currently an internal tool for a specific accounting firm, deployed on Vercel.

## Core Value

The accounting team can process documents, generate tax forms, and automate government portal interactions with minimal manual effort — saving 200+ hours/month.

## Requirements

### Validated

- ✓ AI document classification with XGBoost model — existing
- ✓ F29 tax form generation and validation — existing
- ✓ RPA automation for SII portal (login, situacion tributaria, libros) — existing
- ✓ Bank statement management (Banco de Chile) — existing
- ✓ AI chat assistant (GPT-4 integration) — existing
- ✓ Client management (CRUD) — existing
- ✓ Reports and metrics dashboard — existing
- ✓ Real-time notifications via Supabase — existing
- ✓ Document management (6 phases complete) — existing
- ✓ Landing page with contact form — existing
- ✓ Demo mode login — existing

### Active

- [ ] Migrate backend from Supabase to Convex (data layer, queries, mutations)
- [ ] Full UX/UI polish across landing page and dashboard
- [ ] Code cleanup — remove dead code, fix TypeScript types, proper error handling
- [ ] Clean Vercel deployment — zero build errors, env vars documented
- [ ] Security hardening — CSP headers, env var management, bundle optimization
- [ ] Fix widespread `any` types in analytics code
- [ ] Remove/replace unimplemented stubs (email notifications, incomplete bank integrations)
- [ ] Performance optimization — add caching, optimize bundle size

### Out of Scope

- Real authentication (Supabase Auth) — keeping demo mode for internal use
- Additional bank integrations beyond Banco de Chile — not needed for current client
- Mobile app — web-first, desktop usage by accountants
- OAuth/social login — internal tool, no need
- Phase 7 Advanced Analytics — defer until core is production-ready

## Context

- **Current state:** All 10+ modules marked "complete" but using Supabase throughout. Heavy mock/hardcoded data in places. Auth middleware disabled. Many TODOs and stubs.
- **Deployment:** Vercel (vercel.json exists). Next.js 14.2.29 (has known security vulnerability — needs upgrade).
- **Tech debt:** Widespread `any` types in analytics, missing caching layer, incomplete email/notification integration, unimplemented bank parsers.
- **Migration:** Supabase → Convex is the biggest architectural change. Affects data layer, realtime subscriptions, hooks, server actions.
- **Deprecated dependencies:** `@supabase/auth-helpers-nextjs` and `@supabase/auth-helpers-react` are deprecated. ESLint 8 deprecated. Next.js needs security patch.

## Constraints

- **Backend:** Convex (replacing Supabase for data layer)
- **Frontend:** Next.js 14+ on Vercel
- **Auth:** Demo mode only (no real auth)
- **UI:** Radix UI + Tailwind CSS + shadcn/ui (existing stack)
- **Timeline:** Ship incrementally, phase by phase
- **Budget:** Minimize external service costs (Convex free tier where possible)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Migrate Supabase → Convex | User preference, Convex as primary backend | — Pending |
| Keep demo mode (no auth) | Internal tool, team access only | — Pending |
| Deploy on Vercel | Already configured, natural fit for Next.js | — Pending |
| Preserve existing UI framework (Radix + Tailwind) | Avoid unnecessary rewrites, components already built | — Pending |
| Upgrade Next.js for security patch | 14.2.29 has known vulnerability | — Pending |

---
*Last updated: 2026-02-09 after initialization*
