# Codebase Concerns

**Analysis Date:** 2026-02-09

## Tech Debt

**Incomplete Email/Notification Integration:**
- Issue: Multiple TODOs for email service integration; currently only webhook-based alerts exist
- Files: `src/lib/queue.ts` (line 309), `src/lib/sii-rpa/alerts.ts` (line 206), `src/app/dashboard/documentos/automation-actions.ts` (line 553, 687, 737, 894)
- Impact: Email notifications, SMTP webhooks, and Slack integrations are stubbed but not fully functional. Users cannot receive reliable notifications outside webhook-based alerts
- Fix approach: Implement SendGrid/AWS SES integration for email service; complete Slack webhook sender; add queue persistence for failed notifications

**Inconsistent Type Safety (any/unknown types):**
- Issue: Widespread use of `any` type in analytics aggregation and data transformation code
- Files: `src/lib/analytics/aggregation.ts` (lines 55, 77, 87, 129, 153, 168, 240, 248, 265, 307, 322, 325, 391, 403, 439, 442, 467, 470, 475, 522, 524, 525, 534, 537+), `src/types/reportes-ejecutivo.types.ts` (lines 281, 292, 322)
- Impact: Runtime type errors possible in analytics endpoints; IDE cannot catch data transformation bugs; difficult to maintain and refactor
- Fix approach: Replace all `any` with specific types; create proper TypeScript interfaces for aggregation results; use type guards for data validation

**Unimplemented Bank Integration:**
- Issue: Bank module only implements BancoChile; other banks marked as TODO
- Files: `rpa-server/src/tasks/banks/index.ts` (line 15), `rpa-server/src/tasks/task-executor.ts` (line 164)
- Impact: Cannot automate Banco Santander, BCI, Itaú, or other Chilean banks; only single bank supported in production RPA
- Fix approach: Implement remaining banks following BancoChile pattern; create bank-specific authentication flows; add test coverage for each bank

**Missing Caching Layer:**
- Issue: Analytics endpoints lack Redis caching; only TODOs exist
- Files: `src/app/api/analytics/documents/route.ts` (lines 128, 142)
- Impact: Analytics queries hit database directly on every request; will become bottleneck at scale; repeated expensive aggregations
- Fix approach: Implement Redis caching with 5-minute TTL for analytics; add cache invalidation on document changes; monitor cache hit rates

**Unimplemented Error Trend Analysis:**
- Issue: Error analytics stub returns empty array
- Files: `src/lib/analytics/aggregation.ts` (line 314)
- Impact: Error trending and pattern detection unavailable in analytics dashboard; cannot identify systemic failures
- Fix approach: Implement error tracking with timestamp bucketing; aggregate by error type and frequency

## Known Bugs

**Browser Resource Leak Risk:**
- Symptoms: Browsers may not be fully released if task execution crashes between `closeBrowser()` call and completion
- Files: `rpa-server/src/tasks/task-executor.ts` (line 122), `rpa-server/src/automation/browser-manager.ts` (line 118-130)
- Trigger: Task crashes during webhook sending or other post-execution cleanup; finally block may not execute in all scenarios
- Workaround: Browser cleanup interval runs every minute to reclaim idle browsers, but memory leaks possible during high concurrency

**Webhook Secret Validation Bypass:**
- Symptoms: Webhook endpoint accepts requests with no secret if WEBHOOK_SECRET env var is unset
- Files: `src/app/api/sii-rpa/webhook/route.ts` (lines 27-32)
- Trigger: Production deployment without explicit WEBHOOK_SECRET configuration; default allows all requests
- Workaround: WEBHOOK_SECRET should be mandatory, not optional; currently silently falls back to accepting any request

**Task Status Not Persisted Across Server Restarts:**
- Symptoms: If RPA server restarts, active task status is lost; status only stored in-memory
- Files: `rpa-server/src/tasks/task-executor.ts` (line 37 - `Map<string, RunningTask>`)
- Trigger: Server restart, deployment, or crash during task execution
- Workaround: Webhook updates sent to database, but transient tasks lose status; client must poll webhook database table

**Analytics Success Rate Calculation Hardcoded:**
- Symptoms: Success rate always returns 85% placeholder value
- Files: `src/lib/analytics/aggregation.ts` (line 567)
- Trigger: Any analytics dashboard request for success metrics
- Workaround: Dashboard shows misleading metrics; actual success rate not calculated

**Missing Input Validation in Large Actions:**
- Symptoms: Automation rule creation accepts any structure without validation
- Files: `src/app/dashboard/documentos/automation-actions.ts` (lines 34-64)
- Trigger: Malformed requests bypass validation; can insert invalid rule configurations
- Workaround: Database constraints may reject some invalid data, but validation should be client-side and server-side

## Security Considerations

**Plaintext Password Transmission in Task Execution:**
- Risk: Credentials sent to RPA server in request body, potentially logged or exposed
- Files: `rpa-server/src/server.ts` (lines 50-81), `rpa-server/src/tasks/task-executor.ts` (lines 52-66)
- Current mitigation: API key validation via header; rate limiting on endpoints
- Recommendations: (1) Never log credentials; (2) Use TLS/HTTPS only; (3) Consider encrypted credential storage; (4) Implement short-lived credential tokens; (5) Audit logging for all credential access

**Service Role Key Exposed in Webhook Handler:**
- Risk: SUPABASE_SERVICE_ROLE_KEY directly used in webhook processing route
- Files: `src/app/api/sii-rpa/webhook/route.ts` (lines 8-19)
- Current mitigation: Webhook signature validation with WEBHOOK_SECRET
- Recommendations: (1) Verify WEBHOOK_SECRET is mandatory before accepting webhooks; (2) Use narrow scopes for service role; (3) Rotate keys regularly; (4) Log all service role key usage

**Hardcoded Default Supabase URL:**
- Risk: Fallback URL for Supabase hardcoded if env var missing
- Files: `src/lib/supabase.ts` (line 5: fallback to 'https://gifmgwaogpamdeeiymup.supabase.co')
- Current mitigation: Public URL, no secrets leaked
- Recommendations: (1) Remove hardcoded URLs; (2) Fail fast if NEXT_PUBLIC_SUPABASE_URL not set; (3) Add validation at startup

**RPA Server Localhost Default:**
- Risk: RPA server URL defaults to localhost:3001 in production
- Files: `src/app/api/sii-rpa/execute/route.ts` (fallback to 'http://localhost:3001')
- Current mitigation: None
- Recommendations: (1) Fail fast if RPA_SERVER_URL not configured; (2) Validate URL is remote in production; (3) Add environment-specific validation

**Slack Webhook URL in Environment Variables:**
- Risk: Slack webhook URL stored plaintext in env vars
- Files: `src/lib/sii-rpa/alerts.ts` (line 375)
- Current mitigation: Env vars typically protected in deployment, but visible in code
- Recommendations: (1) Rotate webhook URLs periodically; (2) Restrict webhook permissions to minimal; (3) Monitor webhook usage; (4) Use secret management system

## Performance Bottlenecks

**N+1 Query Pattern in Analytics Aggregation:**
- Problem: Analytics functions make individual queries for each document, type, and status breakdown
- Files: `src/lib/analytics/aggregation.ts` (lines 29-93)
- Cause: Sequential calls to `getTopDocumentTypes()`, `getDocumentAgeDistribution()`, separate status query
- Improvement path: (1) Use database views/materialized views for pre-aggregated data; (2) Batch queries with `.select()` joins; (3) Add Redis caching layer; (4) Implement database query profiling

**Large Action Files Lack Code Splitting:**
- Problem: Monolithic server actions mixing multiple concerns
- Files: `src/app/dashboard/documentos/automation-actions.ts` (1005 lines), `src/app/dashboard/sii/actions.ts` (991 lines), `src/app/dashboard/documentos/compliance-actions.ts` (774 lines)
- Cause: Convenience of placing all actions in one file; no modularization
- Improvement path: (1) Split by domain (rules, webhooks, emails, etc.); (2) Extract shared utilities; (3) Lazy-load action modules; (4) Add performance monitoring for slow actions

**Browser Pool May Exhaust Memory:**
- Problem: Fixed pool of Chromium browsers consumes significant RAM with default limits
- Files: `rpa-server/src/automation/browser-manager.ts` (line 23: MAX_BROWSERS default 5)
- Cause: Each browser instance consumes 100-300MB; no swap strategy
- Improvement path: (1) Profile memory usage under load; (2) Implement browser weight-aware pool management; (3) Add automatic cleanup for idle browsers; (4) Use headless mode only; (5) Monitor OOM scenarios

**Task Status Polling Inefficient:**
- Problem: Client must poll `/status/:jobId` endpoint repeatedly to track progress
- Files: `rpa-server/src/server.ts` (lines 84-107)
- Cause: No WebSocket/SSE support for real-time updates
- Improvement path: (1) Implement Server-Sent Events for task updates; (2) Add WebSocket for bi-directional communication; (3) Cache status responses with short TTL

**Database Queue Processing Single-Threaded:**
- Problem: Queue processor checks for pending jobs sequentially with 5-second intervals
- Files: `src/lib/queue.ts` (processing logic)
- Cause: Simple interval-based polling without concurrency
- Improvement path: (1) Implement Bull.js Redis queue for distributed processing; (2) Add multiple workers; (3) Use job priorities; (4) Monitor queue depth

## Fragile Areas

**RPA Task Execution Without Timeout Protection:**
- Files: `rpa-server/src/tasks/base-task.ts`, `rpa-server/src/tasks/task-executor.ts`
- Why fragile: Browserinstance.acquireBrowser() may hang if page navigation fails; no explicit timeout on task execution
- Safe modification: (1) Add explicit timeout wrapper around execute(); (2) Implement page.goto() with timeout parameter; (3) Test timeout scenarios; (4) Add circuit breaker for repeated timeouts
- Test coverage: Missing timeout scenario tests

**Alert Rules Evaluation Engine:**
- Files: `src/lib/sii-rpa/alerts.ts`, `src/app/dashboard/documentos/automation-actions.ts`
- Why fragile: Rule evaluation logic scattered across multiple files; condition syntax not validated before evaluation
- Safe modification: (1) Centralize rule evaluation logic; (2) Add strict validation for rule syntax; (3) Create comprehensive test suite; (4) Add rule dry-run mode
- Test coverage: Limited to `src/__tests__/phase7-week3.test.ts`

**Credential Encryption Missing:**
- Files: `src/types/database.types.ts` (lines 505, 518 reference `password_encriptado`), but no encryption implementation found
- Why fragile: Field named suggests encryption but no crypto operations visible; unclear if actually encrypted
- Safe modification: (1) Audit where credentials are stored; (2) Implement AES-256 encryption for sensitive fields; (3) Use key rotation; (4) Add decryption test; (5) Ensure keys never logged
- Test coverage: No encryption tests found

**Webhook Signature Validation:**
- Files: `src/lib/queue.ts` (line 334: HMAC-SHA256), `src/app/api/sii-rpa/webhook/route.ts` (line 29: simple equality check)
- Why fragile: Queue implementation uses HMAC but webhook route uses plain string comparison; inconsistent validation
- Safe modification: (1) Standardize validation across both endpoints; (2) Use timing-safe comparison; (3) Add signature validation tests; (4) Document webhook signing algorithm
- Test coverage: Some tests exist but not comprehensive

**Report Generation with Mock Data:**
- Files: `src/components/analytics/ReportScheduler.tsx` (mock data), `src/components/analytics/AlertRulesManager.tsx` (mock data)
- Why fragile: UI uses mock data that doesn't reflect actual backend state
- Safe modification: (1) Remove mock data from production components; (2) Add proper data fetching; (3) Implement error handling for missing data; (4) Add loading states
- Test coverage: Mock data not tested against real data

## Scaling Limits

**Browser Pool Hard Limit:**
- Current capacity: MAX_BROWSERS configurable, defaults to 5 instances
- Limit: Cannot handle more than 5 concurrent RPA jobs; subsequent requests block or fail
- Scaling path: (1) Implement job queue with worker pool; (2) Distribute browser instances across multiple servers; (3) Use Docker containers for horizontal scaling; (4) Implement dynamic browser creation based on load; (5) Add metrics for browser utilization

**Database Queue Without Distributed Lock:**
- Current capacity: Single Next.js server with periodic queue processing
- Limit: Cannot horizontally scale queue processing; multiple instances may process same job
- Scaling path: (1) Migrate to Bull.js with Redis backend; (2) Implement distributed locks for job processing; (3) Add dead letter queue for failed jobs; (4) Use CDC (Change Data Capture) for real-time processing

**Supabase Connection Pooling:**
- Current capacity: Default connection pool from Supabase client
- Limit: 462+ database queries per request spike will exhaust connections under high load
- Scaling path: (1) Implement connection pooling with PgBouncer; (2) Add query result caching; (3) Use read replicas for analytics queries; (4) Implement batch operations; (5) Monitor connection usage

**WebSocket/SSE Not Implemented:**
- Current capacity: REST polling only; each client polling every N seconds
- Limit: Linear scaling of requests with client count; 100 clients = 100 requests per interval
- Scaling path: (1) Implement Server-Sent Events for task updates; (2) Use WebSocket for real-time features; (3) Add message compression; (4) Implement backoff for slow clients

## Dependencies at Risk

**Next.js 14.2.29 - Approaching Major Version:**
- Risk: Major version Next.js 15 released; future security patches may only target 15.x
- Impact: Security vulnerabilities in Next.js 14 may become unfixed; builds may fail on newer Node.js
- Migration plan: (1) Review Next.js 15 breaking changes; (2) Test with 15 in staging; (3) Plan migration timeline; (4) Update related packages (@supabase/auth-helpers, etc.)

**Supabase Auth Helpers (v0.15.0) - Deprecated:**
- Risk: Supabase moving away from auth-helpers toward @supabase/ssr
- Impact: Package may be abandoned; future versions may break; alternative already in use
- Migration plan: (1) Current setup uses both `@supabase/ssr` and `auth-helpers`; (2) Consolidate to ssr only; (3) Audit all auth patterns; (4) Test session handling

**Playwright (in RPA server) - System Dependencies:**
- Risk: Requires Chromium binary; breaks on different Linux distributions; requires root for sandboxing
- Impact: Container builds may fail; different versions required for different systems; sandboxing disabled in current code
- Migration plan: (1) Profile resource usage with sandboxing enabled; (2) Consider puppeteer or jsdom for lighter testing; (3) Use official Playwright Docker image; (4) Document system requirements

**OpenAI (v6.16.0) - Possible Breaking Changes:**
- Risk: Streaming API changes; model version changes; rate limiting changes
- Impact: API calls may break with newer OpenAI versions; model behavior changes
- Migration plan: (1) Pin to specific model version; (2) Add tests for OpenAI integration; (3) Handle deprecation gracefully; (4) Monitor OpenAI status page

## Missing Critical Features

**No Audit Logging for Sensitive Operations:**
- Problem: No centralized audit log for credential access, rule changes, document access
- Blocks: Compliance requirements, forensics, user activity tracking
- Implementation path: (1) Create audit_logs table in database; (2) Log all mutations with user/timestamp/changes; (3) Create read-only audit dashboard; (4) Implement retention policy; (5) Test audit integrity

**No Secrets Rotation Mechanism:**
- Problem: API keys, service roles, webhook secrets cannot be rotated without downtime
- Blocks: Security best practices, incident response, key compromise handling
- Implementation path: (1) Implement versioned secrets; (2) Support multiple valid keys during rotation; (3) Schedule rotation automatically; (4) Add grace period for old keys; (5) Monitor unused keys

**No Multi-Tenancy Isolation:**
- Problem: Database queries rely on client_id filtering but no tenant isolation at database level
- Blocks: True multi-tenant SaaS, data breach containment
- Implementation path: (1) Implement database row-level security (RLS); (2) Use schema-per-tenant or row-per-tenant pattern; (3) Add network isolation; (4) Test data leakage scenarios

**No Rate Limiting on Business Logic:**
- Problem: RPA server has rate limiting, but database operations and file operations do not
- Blocks: DOS protection, fair resource sharing, cost control
- Implementation path: (1) Add Redis-backed rate limiting to API routes; (2) Implement user-level quotas; (3) Add cost tracking; (4) Implement graceful degradation

## Test Coverage Gaps

**RPA Browser Automation - Minimal Coverage:**
- What's not tested: Bank login flows, form filling, document extraction, screenshot capture
- Files: `rpa-server/src/tasks/banks/`, `rpa-server/src/automation/browser-manager.ts`
- Risk: Browser changes (DOM selectors), authentication changes, new bank security features can break without detection
- Priority: **High** - RPA core functionality untested; regex selectors fragile

**Webhook Processing - Incomplete Coverage:**
- What's not tested: Concurrent webhook delivery, out-of-order events, duplicate job IDs, malformed payloads
- Files: `src/app/api/sii-rpa/webhook/route.ts`
- Risk: Race conditions, data corruption, missing state updates not caught
- Priority: **High** - Business-critical webhook handling

**Analytics Aggregation - No Type Tests:**
- What's not tested: Data aggregation with edge cases (null values, missing fields, duplicate records)
- Files: `src/lib/analytics/aggregation.ts`
- Risk: Incorrect metrics due to unhandled edge cases; NaN or undefined values propagate
- Priority: **High** - Business intelligence relies on accurate data

**Email/Notification Delivery - Stubbed Only:**
- What's not tested: Email sending, SMTP errors, Slack delivery, retry logic
- Files: `src/lib/queue.ts`, `src/lib/sii-rpa/alerts.ts`
- Risk: Silent failures; users don't receive notifications; no error visibility
- Priority: **Medium** - Notifications currently disabled

**Automation Rules Execution - Partial Coverage:**
- What's not tested: Complex rule conditions, multiple actions in sequence, circular dependencies
- Files: `src/app/dashboard/documentos/automation-actions.ts`
- Risk: Rules execute unexpectedly or not at all; users trust automation that may silently fail
- Priority: **Medium** - User expectations not validated

**Database Transaction Integrity - None:**
- What's not tested: Multi-step operations with rollback scenarios, concurrent updates
- Files: All server actions using Supabase client
- Risk: Partial state updates if operation fails mid-transaction
- Priority: **Medium** - Data consistency may be compromised

---

*Concerns audit: 2026-02-09*
