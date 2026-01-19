# Complete System Deployment Checklist

**Project**: HV-Consultores Document Management System
**Version**: 6.0 (All 5 Phases + HV-Bancos Module)
**Release Date**: 2026-01-13
**Deployment Status**: PRODUCTION READY

---

## Table of Contents

1. [Pre-Deployment Preparation](#pre-deployment-preparation)
2. [Infrastructure Setup](#infrastructure-setup)
3. [Database Deployment](#database-deployment)
4. [Application Build & Deploy](#application-build--deploy)
5. [Environment Configuration](#environment-configuration)
6. [Integration Testing](#integration-testing)
7. [Security Verification](#security-verification)
8. [Performance Validation](#performance-validation)
9. [Production Cutover](#production-cutover)
10. [Post-Deployment Monitoring](#post-deployment-monitoring)

---

## Pre-Deployment Preparation

### 1. Code Review and Testing

- [ ] All code committed to main branch
- [ ] Code review completed by second developer
- [ ] All tests passing (`npm test`)
- [ ] TypeScript compilation successful (`npx tsc --noEmit`)
- [ ] No linting errors (`npm run lint`)
- [ ] Security audit passed (`npm audit`)
- [ ] Performance profiling completed
- [ ] Load testing passed (10+ concurrent users)
- [ ] All documented features implemented
- [ ] Documentation reviewed and updated

**Files to Verify:**
```
src/migrations/add_document_templates.sql        ✓
src/migrations/add_document_intelligence.sql     ✓
src/migrations/add_compliance_reporting.sql      ✓
src/migrations/add_bank_cartolas_tables.sql      ✓
src/app/dashboard/documentos/template-actions.ts ✓
src/app/dashboard/documentos/intelligence-actions.ts ✓
src/app/dashboard/documentos/compliance-actions.ts ✓
src/app/dashboard/documentos/templates/page.tsx  ✓
src/app/dashboard/documentos/intelligence/page.tsx ✓
src/app/dashboard/documentos/compliance/page.tsx ✓
src/lib/bank-rpa/types.ts                        ✓
src/lib/bank-rpa/parsers/                        ✓
src/lib/bank-rpa/normalizer.ts                   ✓
src/lib/bank-rpa/categorization/rules-engine.ts  ✓
src/lib/bank-rpa/reconciliation/sii-matcher.ts   ✓
```

### 2. Backup Strategy

- [ ] Full database backup scheduled
- [ ] Backup storage location configured
- [ ] Backup retention policy set (minimum 30 days)
- [ ] Backup verification procedure documented
- [ ] Restore procedure tested and documented
- [ ] File storage backup configured (Supabase)
- [ ] Backup automation verified

**Backup Configuration:**
```bash
# Database backup
supabase db dump > backup-$(date +%Y%m%d-%H%M%S).sql

# Storage backup
# Configure Supabase automated backups in dashboard

# Schedule with cron
0 2 * * * /path/to/backup-script.sh
```

### 3. Rollback Plan

- [ ] Previous production version identified
- [ ] Rollback procedure documented
- [ ] Rollback database migration script prepared
- [ ] Feature flags for quick disable prepared (if needed)
- [ ] Communication plan for rollback event
- [ ] Estimated rollback time: < 30 minutes

**Rollback Steps:**
```
1. Notify stakeholders
2. Revert application code to previous version
3. Run rollback migration (if database changes rollable)
4. Verify all systems operational
5. Monitor for 1 hour for any issues
6. Send all-clear notification
```

### 4. Deployment Team

- [ ] Deployment lead assigned
- [ ] Database administrator assigned
- [ ] Monitoring/operations lead assigned
- [ ] Communication/escalation contacts defined
- [ ] On-call support for 24 hours post-deployment
- [ ] Team training completed

**Team Assignments:**
| Role | Name | Contact |
|------|------|---------|
| Deployment Lead | _____ | _____ |
| Database Admin | _____ | _____ |
| Operations Lead | _____ | _____ |
| Technical Lead | _____ | _____ |

---

## Infrastructure Setup

### 1. Supabase Project Verification

- [ ] Project created and accessible
- [ ] Region appropriate for target users
- [ ] Backup settings configured
- [ ] SSL certificate valid
- [ ] API keys rotated (if needed)
- [ ] Service role key secure (not exposed)
- [ ] Firewall rules configured (if applicable)

**Verification Commands:**
```bash
# Test Supabase connectivity
curl -X GET "https://${SUPABASE_URL}/rest/v1/" \
  -H "apikey: ${SUPABASE_ANON_KEY}"

# Verify authentication working
# Login as test user and verify JWT token generated
```

### 2. PostgreSQL Configuration

- [ ] PostgreSQL 14+ running
- [ ] Shared buffers set to 25% of system RAM
- [ ] Effective cache size set to 50-75% of system RAM
- [ ] Max connections appropriate for load
- [ ] Connection pooling configured
- [ ] Replication configured (if applicable)
- [ ] Full-text search enabled
- [ ] UUID extension installed

**Configuration Check:**
```sql
-- Verify extensions
SELECT extname FROM pg_extension;
-- Should include: uuid-ossp, pg_trgm, pgcrypto

-- Verify configuration
SHOW shared_buffers;
SHOW max_connections;
SHOW effective_cache_size;
```

### 3. File Storage Setup

- [ ] Supabase Storage bucket created
- [ ] Bucket policies configured
- [ ] File size limits set
- [ ] File type restrictions configured
- [ ] CORS settings correct for application domain
- [ ] CDN enabled for document delivery
- [ ] Automatic cleanup for temporary files scheduled

**Bucket Configuration:**
```sql
-- Verify bucket exists
SELECT name, public FROM storage.buckets
WHERE name = 'documents';

-- Verify policies
SELECT * FROM pg_policies
WHERE table_name = 'objects';
```

### 4. Network & Security Setup

- [ ] Firewall rules configured
- [ ] WAF (Web Application Firewall) enabled
- [ ] DDoS protection enabled
- [ ] SSL/TLS certificate valid (>= 90 days)
- [ ] HSTS header enabled
- [ ] CORS properly configured
- [ ] Rate limiting configured
- [ ] IP whitelisting (if applicable)

**Security Headers Check:**
```bash
curl -I https://your-domain.com | grep -i security
# Should see: Strict-Transport-Security, X-Content-Type-Options, etc.
```

---

## Database Deployment

### 1. Pre-Migration Checks

- [ ] Current database size noted
- [ ] Estimated migration time calculated
- [ ] Migration window scheduled (low traffic period)
- [ ] Notification sent to users about maintenance window
- [ ] All users logged out (optional, for critical migrations)
- [ ] Backup created pre-migration
- [ ] Migration scripts reviewed for safety

**Migration Window:**
```
Recommended: Off-peak hours
- Sunday 2 AM - 4 AM (UTC)
- Or maintenance window agreed with stakeholders
```

### 2. Phase 1-2 Database (If Not Already Deployed)

**Migration File**: `src/migrations/01_initial_setup.sql`

```bash
# Execute migration
supabase db push

# Or manually:
psql -U postgres -d your_db -f src/migrations/initial_setup.sql

# Verify tables created
psql -U postgres -d your_db -c "\dt public.*"
```

- [ ] Migration executed successfully
- [ ] All Phase 1-2 tables created
- [ ] All indexes created
- [ ] All functions created
- [ ] All RLS policies active
- [ ] No errors in migration

### 3. Phase 3 Database (Document Templates)

**Migration File**: `src/migrations/add_document_templates.sql`

```bash
# Execute migration
supabase db push

# Verify
psql -U postgres -d your_db -c "SELECT * FROM information_schema.tables WHERE table_schema='public' AND table_name='documento_plantillas';"
```

- [ ] Template tables created
- [ ] Folio auto-increment functions working
- [ ] Template indexes created
- [ ] RLS policies active

### 4. Phase 4 Database (Document Intelligence)

**Migration File**: `src/migrations/add_document_intelligence.sql`

```bash
# Execute migration
supabase db push

# Verify analytics tables
psql -U postgres -d your_db -c "SELECT table_name FROM information_schema.tables WHERE table_name LIKE '%analytics%' OR table_name LIKE '%classification%' OR table_name LIKE '%insight%';"
```

- [ ] Analytics tables created
- [ ] Classification tables created
- [ ] Insights tables created
- [ ] Smart suggestions table created
- [ ] All indexes created
- [ ] All triggers created

### 5. Phase 5 Database (Compliance & Reporting)

**Migration File**: `src/migrations/add_compliance_reporting.sql`

```bash
# Execute migration
supabase db push

# Verify all 7 compliance tables
psql -U postgres -d your_db -c "
SELECT table_name
FROM information_schema.tables
WHERE table_schema='public'
AND table_name IN (
  'audit_logs_extended',
  'document_retention_policies',
  'document_lifecycle',
  'compliance_reports',
  'report_schedules',
  'compliance_checklists',
  'data_governance'
)
ORDER BY table_name;"
```

- [ ] All 7 compliance tables created
- [ ] All 18 indexes created
- [ ] All 2 functions created
- [ ] All 3 triggers created
- [ ] All 8 RLS policies active
- [ ] No migration errors

### 6. Data Validation

```sql
-- Count records in each table
SELECT 'documento_cargas' as table_name, COUNT(*) FROM documento_cargas
UNION ALL
SELECT 'documento_plantillas', COUNT(*) FROM documento_plantillas
UNION ALL
SELECT 'template_analytics', COUNT(*) FROM template_analytics
UNION ALL
SELECT 'audit_logs_extended', COUNT(*) FROM audit_logs_extended
UNION ALL
SELECT 'document_retention_policies', COUNT(*) FROM document_retention_policies
UNION ALL
SELECT 'document_lifecycle', COUNT(*) FROM document_lifecycle
UNION ALL
SELECT 'compliance_reports', COUNT(*) FROM compliance_reports
ORDER BY table_name;

-- Verify foreign key integrity
SELECT table_name, constraint_name
FROM information_schema.table_constraints
WHERE constraint_type = 'FOREIGN KEY'
AND table_schema = 'public'
ORDER BY table_name;
```

- [ ] All table record counts reasonable
- [ ] Foreign key integrity verified
- [ ] No orphaned records detected
- [ ] Data migration complete (if from legacy system)

### 7. Index Analysis

```sql
-- Check index usage
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan as scans
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

-- Check index sizes
SELECT
  schemaname,
  tablename,
  indexname,
  pg_size_pretty(pg_relation_size(indexrelid)) as size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY pg_relation_size(indexrelid) DESC;
```

- [ ] All expected indexes present
- [ ] Index sizes reasonable
- [ ] High-traffic indexes in place
- [ ] No unused indexes

---

## Application Build & Deploy

### 1. Build Verification

```bash
# Clean previous build
rm -rf .next

# Install dependencies
npm ci  # Using ci instead of install for production

# Run tests
npm run test

# Type check
npx tsc --noEmit

# Build application
npm run build

# Expected output:
# ✓ All tests passing
# ✓ No TypeScript errors
# ✓ Build completes successfully
# ✓ No console errors/warnings
```

- [ ] Dependencies installed successfully
- [ ] All tests passing
- [ ] TypeScript compilation successful
- [ ] Build completes without errors
- [ ] Bundle analysis completed
- [ ] Bundle size acceptable
- [ ] No security vulnerabilities

### 2. Docker Image (If Using)

```bash
# Build Docker image
docker build -t hv-consultores:5.0 .

# Tag for registry
docker tag hv-consultores:5.0 your-registry/hv-consultores:5.0

# Push to registry
docker push your-registry/hv-consultores:5.0

# Verify image
docker pull your-registry/hv-consultores:5.0
docker run --rm your-registry/hv-consultores:5.0 npm --version
```

- [ ] Docker image builds successfully
- [ ] Image can be pulled and run
- [ ] Image contains all dependencies
- [ ] Image size reasonable

### 3. Environment File Setup

```bash
# Copy example env (use production template)
cp .env.production.example .env.production

# CRITICAL: Update the following values:

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-prod-db.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-production-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-production-service-key

# OpenAI (for HV-Chat AI features)
OPENAI_API_KEY=sk-your-production-key

# Nubox Integration
NUBOX_API_URL=https://api.nubox.com
NUBOX_API_KEY=your-production-key
NUBOX_API_SECRET=your-production-secret

# Security
ENCRYPTION_KEY=your-32-character-key  # openssl rand -hex 16

# IMPORTANT: Disable demo mode in production
NEXT_PUBLIC_SHOW_DEMO_CREDENTIALS=false

# RPA Server (for HV-Bancos automation)
RPA_SERVER_URL=https://rpa.your-domain.com
RPA_WEBHOOK_SECRET=your-secure-secret

# Application Settings
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

- [ ] Production .env file created
- [ ] All required variables set
- [ ] No development variables in production config
- [ ] Sensitive data not committed to git
- [ ] Environment variables encrypted (if applicable)

### 4. Application Deployment

```bash
# Option A: Vercel (Recommended)
# The project includes vercel.json configuration

# 1. Install Vercel CLI
npm i -g vercel

# 2. Login to Vercel
vercel login

# 3. Set environment variables in Vercel Dashboard:
#    - NEXT_PUBLIC_SUPABASE_URL
#    - NEXT_PUBLIC_SUPABASE_ANON_KEY
#    - SUPABASE_SERVICE_ROLE_KEY
#    - OPENAI_API_KEY
#    - NUBOX_API_KEY, NUBOX_API_SECRET, NUBOX_API_URL
#    - ENCRYPTION_KEY
#    - RPA_SERVER_URL, RPA_WEBHOOK_SECRET
#    - NEXT_PUBLIC_SHOW_DEMO_CREDENTIALS=false

# 4. Deploy to production
vercel deploy --prod

# Option B: Self-hosted
# Build optimized production bundle
npm run build

# Start application
npm start

# Or with PM2
pm2 start npm --name "hv-consultores" -- start
pm2 save
```

- [ ] Application deployed to production
- [ ] Application accessible at production URL
- [ ] All pages load without errors
- [ ] Database connection successful
- [ ] File storage accessible
- [ ] API endpoints responding

### 5. Service Startup Verification

```bash
# Verify services running
pm2 status  # or equivalent for your deployment method

# Check logs
pm2 logs    # or check container logs

# Expected output:
# ✓ Application process running
# ✓ No startup errors
# ✓ Listening on correct port
# ✓ Database connection established
```

- [ ] Application service running
- [ ] No startup errors in logs
- [ ] Listening on correct port
- [ ] All required services connected

---

## Integration Testing

### 1. Phase 1-2 Features

```bash
# Test document upload
Navigate to: /dashboard/documentos
- [ ] Upload document form visible
- [ ] File upload works
- [ ] Document appears in list
- [ ] Approval workflow works
- [ ] Document can be approved/rejected

# Test Nubox integration
- [ ] Document can be submitted to Nubox
- [ ] Status updates from Nubox
- [ ] Webhook status updates received
```

### 2. Phase 3 Features

```bash
# Test templates
Navigate to: /dashboard/documentos/templates
- [ ] Templates page loads
- [ ] Can create template
- [ ] Can edit template
- [ ] Can delete template
- [ ] Auto-increment folio works
- [ ] Template selector works in upload form
```

### 3. Phase 4 Features

```bash
# Test intelligence
Navigate to: /dashboard/documentos/intelligence
- [ ] Intelligence page loads
- [ ] All 4 tabs visible
- [ ] Template analytics display
- [ ] Smart suggestions appear
- [ ] Insights data accurate
- [ ] Charts render correctly
```

### 4. Phase 5 Features

```bash
# Test compliance
Navigate to: /dashboard/documentos/compliance
- [ ] Compliance dashboard loads
- [ ] All 5 tabs functional
- [ ] Overview tab shows data
- [ ] Retention policies manageable
- [ ] Audit logs displayed
- [ ] Reports can be created
- [ ] Checklists functional
```

### 5. HV-Bancos Features

```bash
# Test bank statement module
Navigate to: /dashboard/bancos
- [ ] Bank dashboard page loads
- [ ] Account management visible
- [ ] Can add bank account
- [ ] Can configure credentials
- [ ] Transaction list displays

# Test parsing functionality
- [ ] CSV upload works
- [ ] PDF parsing extracts transactions
- [ ] Excel import works
- [ ] Transaction normalization applies

# Test categorization
- [ ] Auto-categorization rules apply
- [ ] Manual categorization works
- [ ] Confidence scores display
- [ ] Category suggestions appear

# Test SII reconciliation
- [ ] Matching with SII documents works
- [ ] Unmatched transactions identified
- [ ] Reconciliation status updates
```

### 6. Cross-Feature Integration

```bash
# Test workflows spanning multiple features
- [ ] Upload document → Check in intelligence
- [ ] Create template → Use in upload → See in analytics
- [ ] Approve document → Check in audit log
- [ ] Create compliance report → See audit data
- [ ] Check retention policy → See lifecycle tracking
- [ ] Upload bank statement → Reconcile with SII documents
- [ ] Bank transaction → Link to accounting entry
```

- [ ] All Phase 1-2 features working
- [ ] All Phase 3 features working
- [ ] All Phase 4 features working
- [ ] All Phase 5 features working
- [ ] All HV-Bancos features working
- [ ] Cross-feature integration verified
- [ ] No feature conflicts

---

## Security Verification

### 1. Authentication

```bash
# Test unauthenticated access
curl https://your-domain.com/dashboard/documentos
# Expected: redirect to login

# Test invalid token
curl -H "Authorization: Bearer invalid" \
  https://your-domain.com/api/protected-endpoint
# Expected: 401 Unauthorized

# Test valid token
# Login user and verify JWT token working
```

- [ ] Unauthenticated users redirected to login
- [ ] Invalid tokens rejected
- [ ] Valid tokens accepted
- [ ] Session timeout working
- [ ] CSRF protection active

### 2. Authorization

```bash
# Test client isolation (RLS)
SELECT * FROM audit_logs_extended
WHERE cliente_id != 'user-client-id';
# Expected: 0 rows returned

# Test role-based access
- [ ] Accountant sees only assigned client data
- [ ] Admin sees all data
- [ ] User cannot access other client's compliance reports
```

- [ ] Client isolation enforced
- [ ] Role-based access working
- [ ] No data leakage between clients
- [ ] Admin overrides working

### 3. Data Protection

```bash
# Test SQL injection prevention
# Attempt: '; DROP TABLE compliance_reports; --
# Result: Treated as literal string, no table dropped

# Test XSS prevention
# Attempt: <script>alert('xss')</script>
# Result: Displayed as text, not executed

# Test validation
# Attempt: Invalid email format
# Result: Validation error shown
```

- [ ] SQL injection prevented
- [ ] XSS prevention working
- [ ] Input validation enforced
- [ ] Output encoding correct
- [ ] CSRF tokens validated

### 4. Secrets Management

```bash
# Verify no secrets in code
grep -r "SUPABASE_KEY\|API_KEY\|PASSWORD" src/
# Expected: no actual secrets, only environment variable references

# Check git history
git log -S "password" --all
# Expected: no commits with hardcoded secrets

# Verify .env files excluded
cat .gitignore | grep ".env"
# Expected: .env files excluded
```

- [ ] No hardcoded secrets in code
- [ ] No secrets in git history
- [ ] .env files excluded from git
- [ ] API keys properly rotated
- [ ] Service keys secure

### 5. Security Headers

```bash
curl -I https://your-domain.com | grep -i "security\|content-type\|x-"
# Expected headers:
# - Strict-Transport-Security: max-age=31536000
# - X-Content-Type-Options: nosniff
# - X-Frame-Options: DENY
# - X-XSS-Protection: 1; mode=block
# - Referrer-Policy: strict-origin-when-cross-origin
```

- [ ] All security headers present
- [ ] HSTS enabled
- [ ] Content Security Policy configured
- [ ] X-Frame-Options set
- [ ] Referrer Policy configured

### 6. SSL/TLS Certificate

```bash
openssl s_client -connect your-domain.com:443
# Check certificate validity, expiration, chain
```

- [ ] SSL certificate valid
- [ ] Certificate not expired
- [ ] Certificate chain complete
- [ ] TLS 1.2+ enabled
- [ ] Weak ciphers disabled

### 7. OWASP Top 10 Check

Run security scanning tool:

```bash
# Using OWASP ZAP or similar
zap-cli quick-scan --self-signed https://your-domain.com

# Or using npm security tools
npm audit  # For vulnerable dependencies
```

- [ ] No vulnerabilities detected
- [ ] Dependencies up to date
- [ ] Security patches applied
- [ ] Known CVEs checked

---

## Performance Validation

### 1. Page Load Performance

```bash
# Using Lighthouse
npx lighthouse https://your-domain.com/dashboard/documentos/compliance

# Expected scores:
# - Performance: > 80
# - Accessibility: > 90
# - Best Practices: > 90
# - SEO: > 90
```

- [ ] Lighthouse Performance score > 80
- [ ] First Contentful Paint < 1.5s
- [ ] Largest Contentful Paint < 2.5s
- [ ] Cumulative Layout Shift < 0.1
- [ ] Time to Interactive < 3s

### 2. Database Query Performance

```sql
-- Slow query log
SET log_min_duration_statement = 500;  -- Log queries > 500ms

-- Monitor for a week
-- Check for slow queries
SELECT query, calls, mean_time
FROM pg_stat_statements
WHERE mean_time > 500
ORDER BY mean_time DESC
LIMIT 20;

-- Add indexes for slow queries if needed
```

- [ ] No queries slower than 500ms (except reports)
- [ ] Report generation < 5 seconds
- [ ] Dashboard load < 2 seconds
- [ ] API responses < 200ms
- [ ] Database connection pool optimal

### 3. Application Performance

```bash
# Monitor memory usage
top -b -n 1 | grep node

# Expected: < 500MB for normal operation

# Monitor CPU usage
# Expected: < 10% during normal operations

# Check disk space
df -h | grep -E "/$|/data"

# Expected: > 20% free space
```

- [ ] Memory usage reasonable
- [ ] CPU usage normal
- [ ] Disk space available
- [ ] No memory leaks
- [ ] Connection pools healthy

### 4. CDN Performance

```bash
# Test CDN delivery
curl -I https://your-cdn.com/documents/file.pdf | grep "x-cache"

# Expected: Cache HIT or MISS appropriately
```

- [ ] CDN configured correctly
- [ ] Static assets cached
- [ ] Cache headers correct
- [ ] Cache invalidation working
- [ ] CDN location appropriate

### 5. Load Testing

```bash
# Using Apache Bench
ab -n 1000 -c 10 https://your-domain.com/dashboard/documentos

# Expected:
# - Requests per second: > 50
# - Failed requests: 0
# - Longest request: < 5000ms
```

- [ ] Load test passed (10+ concurrent users)
- [ ] No request failures under load
- [ ] Response times acceptable
- [ ] Database handles concurrency
- [ ] No resource exhaustion

---

## Production Cutover

### 1. Pre-Cutover Communication

- [ ] Stakeholders notified of deployment
- [ ] Maintenance window announced
- [ ] Users informed of any changes
- [ ] Support team briefed
- [ ] Rollback procedures reviewed
- [ ] Escalation contacts confirmed

**Communication Template:**
```
Subject: HV-Consultores Update - v5.0 Deployment

Dear Users,

We're deploying an important system update on [DATE] at [TIME] UTC.

New Features:
- Document Templates for faster uploads
- Intelligence & Analytics dashboard
- Compliance & Reporting system

Expected downtime: [DURATION]
Expected completion: [TIME]

For support: [CONTACT INFO]

Regards,
IT Team
```

- [ ] All notifications sent
- [ ] Confirmation received from stakeholders
- [ ] Support team ready

### 2. Cutover Execution

**Phase 1: Pre-Cutover (T-30 min)**
- [ ] All team members logged into communication channel
- [ ] Database backup initiated
- [ ] System health checks passed
- [ ] Rollback plan reviewed
- [ ] Deployment scripts tested

**Phase 2: Deployment (T-0)**
- [ ] Deploy application code
- [ ] Verify application started
- [ ] Health check endpoint responding
- [ ] Database migrations applied
- [ ] Verify migrations successful
- [ ] Clear application cache (if applicable)

**Phase 3: Post-Deployment (T+0 to T+30 min)**
- [ ] Navigate to application
- [ ] Verify all pages load
- [ ] Test core workflows
- [ ] Check database connectivity
- [ ] Monitor error rates
- [ ] Monitor performance metrics
- [ ] Check user feedback channels

**Phase 4: Stabilization (T+30 min to T+2 hours)**
- [ ] Monitor all metrics
- [ ] Watch for error spikes
- [ ] Monitor database performance
- [ ] Watch file storage usage
- [ ] Monitor API response times
- [ ] Check scheduled jobs running

- [ ] Deployment executed as planned
- [ ] No critical errors encountered
- [ ] All systems operational
- [ ] Successful cutover confirmed

### 3. Post-Cutover Validation

```bash
# Comprehensive health check
./scripts/health-check.sh

# Expected output:
# ✓ Application running
# ✓ Database connected
# ✓ File storage accessible
# ✓ APIs responding
# ✓ All critical jobs scheduled
```

- [ ] Application fully operational
- [ ] Database responsive
- [ ] File storage accessible
- [ ] All integrations working
- [ ] No data integrity issues
- [ ] All features working as expected

---

## Post-Deployment Monitoring

### 1. 24-Hour Monitoring

**First 4 Hours (Critical)**:
- [ ] Monitor error rates (target: < 0.1%)
- [ ] Monitor API response times (target: < 200ms)
- [ ] Monitor database performance
- [ ] Monitor user experience (user feedback)
- [ ] Check logs for warnings/errors
- [ ] Monitor resource utilization

**First 24 Hours**:
- [ ] Verify all scheduled jobs executed
- [ ] Check for data consistency issues
- [ ] Monitor compliance features
- [ ] Monitor audit logging
- [ ] Review user feedback
- [ ] Verify backup completion

**Daily for 1 Week**:
- [ ] Check error logs
- [ ] Monitor performance trends
- [ ] Verify feature adoption
- [ ] Monitor system stability
- [ ] Check user satisfaction

### 2. Key Metrics to Monitor

```bash
# Application metrics
- Request rate
- Error rate (target: < 0.1%)
- Response time (target: < 200ms)
- Memory usage
- CPU usage
- Disk usage

# Database metrics
- Query response time
- Connection pool usage
- Slow query count
- Lock contention
- Backup status

# Business metrics
- Feature usage
- User activity
- Compliance report generation
- Document uploads/approvals
- Template usage
```

**Monitoring Tools**:
- [ ] Error tracking (Sentry/similar)
- [ ] Performance monitoring (Datadog/similar)
- [ ] Log aggregation (CloudWatch/similar)
- [ ] Uptime monitoring (StatusPage/similar)
- [ ] User analytics

### 3. Scheduled Reviews

**Day 1 Review**:
- [ ] All deployment objectives met
- [ ] No critical issues
- [ ] User feedback positive
- [ ] System stable
- [ ] Performance acceptable

**Week 1 Review**:
- [ ] Feature adoption rate
- [ ] User feedback summary
- [ ] Performance stability
- [ ] System reliability
- [ ] Any required hotfixes applied

**Month 1 Review**:
- [ ] Feature utilization metrics
- [ ] Performance baselines established
- [ ] User satisfaction survey
- [ ] System stability assessment
- [ ] Roadmap for v5.1

### 4. Issues & Resolution

**Issue Classification**:

| Severity | Response Time | Escalation |
|----------|---------------|-----------|
| Critical (Down) | 15 min | VP Engineering |
| High (Degraded) | 30 min | Engineering Lead |
| Medium (Feature Issue) | 2 hours | Product Manager |
| Low (Enhancement) | 24 hours | Backlog |

- [ ] Issue tracking system configured
- [ ] Escalation procedures defined
- [ ] On-call schedule established
- [ ] Communication channels active

### 5. Sign-Off & Documentation

**Deployment Completion Sign-Off**:

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Deployment Lead | _____ | _____ | _____ |
| Database Admin | _____ | _____ | _____ |
| Operations Lead | _____ | _____ | _____ |
| Technical Lead | _____ | _____ | _____ |

- [ ] Deployment completed successfully
- [ ] All tests passed
- [ ] All features verified
- [ ] System stable
- [ ] Ready for production support

**Post-Deployment Documentation**:
- [ ] Deployment notes created
- [ ] Any issues documented
- [ ] Performance baseline recorded
- [ ] Runbook updated
- [ ] Team trained on new features

---

## Rollback Procedures

### If Rollback Becomes Necessary

```bash
# Step 1: Stop application
pm2 stop hv-consultores

# Step 2: Revert code
git checkout production-backup-tag

# Step 3: Rebuild application
npm run build

# Step 4: Restart application
pm2 start hv-consultores

# Step 5: Run rollback migration (if needed)
psql -U postgres -d your_db -f scripts/rollback-phase5.sql

# Step 6: Verify system operational
curl https://your-domain.com/health

# Step 7: Notify stakeholders
# Document what went wrong
# Plan corrective actions
```

**Estimated Rollback Time**: < 30 minutes

- [ ] Rollback procedures documented
- [ ] Rollback scripts tested
- [ ] Estimated time realistic
- [ ] Team trained on rollback

---

## Success Criteria

The deployment is considered **SUCCESSFUL** when:

✅ **Technical Criteria**:
- [ ] All pages load without errors
- [ ] All database queries execute
- [ ] File storage accessible
- [ ] Webhooks receiving updates
- [ ] Email delivery working (if applicable)
- [ ] All integrations operational
- [ ] Error rate < 0.1%
- [ ] 99th percentile response time < 2 seconds

✅ **Functional Criteria**:
- [ ] All Phase 1-2 features working
- [ ] All Phase 3 features working
- [ ] All Phase 4 features working
- [ ] All Phase 5 features working
- [ ] Cross-feature workflows verified
- [ ] User can complete all key tasks
- [ ] No data integrity issues

✅ **Security Criteria**:
- [ ] Authentication working
- [ ] Authorization enforced
- [ ] RLS policies active
- [ ] No security vulnerabilities
- [ ] Audit logging functional
- [ ] Data encrypted in transit

✅ **Performance Criteria**:
- [ ] Page load time < 2 seconds
- [ ] API response time < 200ms
- [ ] Database queries < 500ms
- [ ] Lighthouse score > 80
- [ ] No memory leaks

✅ **Compliance Criteria**:
- [ ] All documentation updated
- [ ] All procedures documented
- [ ] Team trained
- [ ] Rollback plan in place
- [ ] Support team ready
- [ ] Monitoring configured

---

## Sign-Off

**Deployment Authority**: ____________________

**Title**: ____________________

**Date**: ____________________

**Status**: [ ] APPROVED [ ] CONDITIONAL [ ] REJECTED

**Comments**:
```
[Space for sign-off comments]
```

---

## Additional Resources

### Documentation
- COMPLETE_PROJECT_DELIVERY.md - Full system overview
- PHASE5_COMPLIANCE.md - Phase 5 feature documentation
- PHASE5_VERIFICATION_GUIDE.md - Testing procedures
- DEPLOYMENT_CHECKLIST_COMPLETE.md - This document

### Key Files
- Database migrations: `src/migrations/`
- Server actions: `src/app/dashboard/documentos/*-actions.ts`
- Pages: `src/app/dashboard/documentos/*/page.tsx`
- Vercel config: `vercel.json`
- Environment templates: `.env.example`, `.env.production.example`
- Bank module: `src/lib/bank-rpa/`
- Bank tests: `src/__tests__/bank-rpa/`

### External Resources
- Supabase Docs: https://supabase.com/docs
- Next.js Docs: https://nextjs.org/docs
- PostgreSQL Docs: https://www.postgresql.org/docs

---

**Document Version**: 2.0
**Last Updated**: 2026-01-13
**Status**: READY FOR DEPLOYMENT (v6.0 with HV-Bancos)
