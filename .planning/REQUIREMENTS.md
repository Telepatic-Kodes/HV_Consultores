# Requirements: HV Consultores Production Overhaul

**Defined:** 2026-02-09
**Core Value:** Accounting team processes documents, tax forms, and government portal interactions with minimal manual effort

## v1 Requirements

### Convex Migration (CONV)

- [ ] **CONV-01**: Replace Supabase client initialization with Convex provider and client setup
- [ ] **CONV-02**: Define Convex schema for all existing data models (documents, clients, F29, bots, banks, chat)
- [ ] **CONV-03**: Migrate all Supabase queries/mutations to Convex queries/mutations
- [ ] **CONV-04**: Replace Supabase realtime subscriptions with Convex reactive queries
- [ ] **CONV-05**: Remove all Supabase dependencies from package.json
- [ ] **CONV-06**: Update environment variables for Convex (remove Supabase env vars)

### Code Cleanup (CODE)

- [ ] **CODE-01**: Fix all TypeScript `any` types in analytics code with proper interfaces
- [ ] **CODE-02**: Remove dead code, unused imports, and commented-out blocks
- [ ] **CODE-03**: Remove unimplemented stubs (email notifications, incomplete bank integrations beyond BancoChile)
- [ ] **CODE-04**: Add proper error handling with user-friendly error messages across all pages
- [ ] **CODE-05**: Fix all TypeScript compiler errors for clean build
- [ ] **CODE-06**: Update deprecated dependencies (Next.js security patch, ESLint 9, remove deprecated Supabase auth helpers)

### UX Polish - Landing Page (UXLP)

- [ ] **UXLP-01**: Fix responsive layout issues on mobile and tablet viewports
- [ ] **UXLP-02**: Replace hardcoded "0" counters in hero stats with realistic static values
- [ ] **UXLP-03**: Ensure all images load correctly (fix missing favicon, broken image refs)
- [ ] **UXLP-04**: Polish animations and transitions for professional feel
- [ ] **UXLP-05**: Verify all navigation links work (no dead hrefs)

### UX Polish - Dashboard (UXDB)

- [ ] **UXDB-01**: Ensure all dashboard pages render without errors with mock/demo data
- [ ] **UXDB-02**: Fix responsive layout for dashboard sidebar and content areas
- [ ] **UXDB-03**: Polish loading states and empty states across all modules
- [ ] **UXDB-04**: Ensure consistent styling and spacing across all dashboard pages
- [ ] **UXDB-05**: Fix any broken interactive elements (buttons, forms, modals)

### Deployment & Security (DEPL)

- [ ] **DEPL-01**: Achieve clean `next build` with zero errors on Vercel
- [ ] **DEPL-02**: Document all required environment variables with example values
- [ ] **DEPL-03**: Add security headers (CSP, HSTS, X-Frame-Options) via next.config.js
- [ ] **DEPL-04**: Optimize bundle size (tree-shaking, dynamic imports for heavy modules)
- [ ] **DEPL-05**: Add basic health check endpoint for monitoring
- [ ] **DEPL-06**: Configure proper error pages (404, 500) with branded design

### Performance (PERF)

- [ ] **PERF-01**: Implement caching strategy for analytics endpoints
- [ ] **PERF-02**: Add lazy loading for dashboard modules not in viewport
- [ ] **PERF-03**: Optimize image loading (next/image, proper sizing)
- [ ] **PERF-04**: Reduce initial JavaScript bundle size below 300KB

## v2 Requirements

### Extended Bank Support

- **BANK-01**: Implement Banco Estado RPA automation
- **BANK-02**: Implement Santander RPA automation
- **BANK-03**: Implement BCI RPA automation

### Notifications

- **NOTF-01**: Email notification service (SendGrid/SES)
- **NOTF-02**: Slack integration for alerts
- **NOTF-03**: In-app notification center

### Advanced Analytics (Phase 7)

- **ANLYT-01**: Predictive analytics for document processing
- **ANLYT-02**: Client risk scoring
- **ANLYT-03**: Custom report builder

## Out of Scope

| Feature | Reason |
|---------|--------|
| Real authentication (Supabase Auth) | Internal tool, demo mode sufficient |
| OAuth/Social login | Not needed for internal team |
| Mobile app | Desktop-primary accounting workflow |
| Multi-tenancy | Single accounting firm usage |
| i18n/Localization | Chile-only, Spanish sufficient |
| Payment/billing system | Internal tool, no billing needed |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| CONV-01 | Phase 1 | Pending |
| CONV-02 | Phase 1 | Pending |
| CONV-03 | Phase 1 | Pending |
| CONV-04 | Phase 1 | Pending |
| CONV-05 | Phase 1 | Pending |
| CONV-06 | Phase 1 | Pending |
| CODE-01 | Phase 2 | Pending |
| CODE-02 | Phase 2 | Pending |
| CODE-03 | Phase 2 | Pending |
| CODE-04 | Phase 2 | Pending |
| CODE-05 | Phase 2 | Pending |
| CODE-06 | Phase 2 | Pending |
| UXLP-01 | Phase 3 | Pending |
| UXLP-02 | Phase 3 | Pending |
| UXLP-03 | Phase 3 | Pending |
| UXLP-04 | Phase 3 | Pending |
| UXLP-05 | Phase 3 | Pending |
| UXDB-01 | Phase 4 | Pending |
| UXDB-02 | Phase 4 | Pending |
| UXDB-03 | Phase 4 | Pending |
| UXDB-04 | Phase 4 | Pending |
| UXDB-05 | Phase 4 | Pending |
| DEPL-01 | Phase 5 | Pending |
| DEPL-02 | Phase 5 | Pending |
| DEPL-03 | Phase 5 | Pending |
| DEPL-04 | Phase 5 | Pending |
| DEPL-05 | Phase 5 | Pending |
| DEPL-06 | Phase 5 | Pending |
| PERF-01 | Phase 6 | Pending |
| PERF-02 | Phase 6 | Pending |
| PERF-03 | Phase 6 | Pending |
| PERF-04 | Phase 6 | Pending |

**Coverage:**
- v1 requirements: 31 total
- Mapped to phases: 31
- Unmapped: 0 ✓

---
*Requirements defined: 2026-02-09*
*Last updated: 2026-02-09 after initial definition*
