# Production Deployment Checklist - Phase 6
## Complete deployment guide for automation & integration system

**Status**: Ready for Production
**Date**: 2026-01-11
**Scope**: All Phase 6 features
**Target Environment**: Production

---

## Table of Contents

1. [Pre-Deployment Verification](#pre-deployment-verification)
2. [Environment Configuration](#environment-configuration)
3. [Database Preparation](#database-preparation)
4. [Security Hardening](#security-hardening)
5. [Performance Optimization](#performance-optimization)
6. [Monitoring & Logging](#monitoring--logging)
7. [Backup & Recovery](#backup--recovery)
8. [Deployment Steps](#deployment-steps)
9. [Post-Deployment Verification](#post-deployment-verification)
10. [Rollback Procedures](#rollback-procedures)

---

## Pre-Deployment Verification

### Code Quality Checks

- [ ] All TypeScript code compiles without errors
  ```bash
  npm run build
  # Expected: No build errors
  ```

- [ ] No console errors or warnings in production build
  ```bash
  npm run build
  # Check terminal output for [error] markers
  ```

- [ ] All tests passing
  ```bash
  npm test
  # Expected: All tests green
  # Coverage: > 90%
  ```

- [ ] Linting passes
  ```bash
  npm run lint
  # Expected: No ESLint errors
  ```

- [ ] No security vulnerabilities
  ```bash
  npm audit
  # Result should be:
  # - 0 critical vulnerabilities
  # - 0 high vulnerabilities
  # If issues exist, run: npm audit fix
  ```

### Code Review

- [ ] Phase 6 code reviewed by team lead
- [ ] Architecture approved
- [ ] Security reviewed
- [ ] Performance validated
- [ ] No hardcoded secrets or API keys
- [ ] All error handling in place
- [ ] Logging implemented appropriately

### Feature Verification

- [ ] Automation rules working correctly
- [ ] Job queue processing jobs
- [ ] External services (email, Slack, webhooks) tested
- [ ] Batch operations functioning
- [ ] Scheduler executing on schedule
- [ ] Notifications delivering
- [ ] UI dashboard loading and functional

---

## Environment Configuration

### Create Production `.env` File

```bash
# Copy from template
cp .env.example .env.production

# Edit with production values
nano .env.production
```

### Required Variables

```bash
# ============================================================================
# NEXT.JS CONFIGURATION
# ============================================================================
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://hv-consultores.com
NEXT_PUBLIC_ENVIRONMENT=production

# ============================================================================
# SUPABASE CONFIGURATION
# ============================================================================
NEXT_PUBLIC_SUPABASE_URL=https://your-production-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-production-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-production-service-key

# ============================================================================
# EMAIL CONFIGURATION
# ============================================================================
EMAIL_PROVIDER=smtp                              # or: sendgrid, ses, mailgun
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-production-email@gmail.com
SMTP_PASSWORD=your-app-specific-password         # Use app password, not account password
EMAIL_FROM_ADDRESS=noreply@hv-consultores.com
EMAIL_FROM_NAME=HV-Consultores

# Optional: SendGrid (if using)
SENDGRID_API_KEY=SG.your-sendgrid-key

# Optional: AWS SES (if using)
AWS_SES_ACCESS_KEY=your-aws-access-key
AWS_SES_SECRET_KEY=your-aws-secret-key
AWS_SES_REGION=us-east-1

# Optional: Mailgun (if using)
MAILGUN_DOMAIN=mg.yourdomain.com
MAILGUN_API_KEY=your-mailgun-key

# ============================================================================
# SLACK CONFIGURATION
# ============================================================================
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/T00000000/B00000000/XXXX
SLACK_NOTIFICATIONS_ENABLED=true

# ============================================================================
# JOB QUEUE CONFIGURATION
# ============================================================================
QUEUE_PROCESSOR_INTERVAL=10                      # Process jobs every 10 seconds
QUEUE_PROCESSOR_BATCH_SIZE=100                   # Process up to 100 jobs at once
QUEUE_JOB_TIMEOUT=300000                         # 5 minutes timeout per job
QUEUE_JOB_MAX_RETRIES=3
QUEUE_JOB_BACKOFF_BASE=60                        # Start backoff at 60 seconds

# ============================================================================
# SCHEDULER CONFIGURATION
# ============================================================================
SCHEDULER_ENABLED=true
SCHEDULER_CHECK_INTERVAL=60000                   # Check for scheduled jobs every 60 seconds

# ============================================================================
# LOGGING CONFIGURATION
# ============================================================================
LOG_LEVEL=info                                   # or: debug, warn, error
LOG_FILE=/var/log/hv-consultores/application.log
LOG_MAX_SIZE=10m                                 # Max log file size
LOG_MAX_FILES=30                                 # Keep 30 days of logs

# ============================================================================
# MONITORING & ALERTS
# ============================================================================
MONITORING_ENABLED=true
ALERTS_EMAIL=ops@hv-consultores.com
ALERT_THRESHOLD_QUEUE_SIZE=1000                  # Alert if queue grows > 1000 jobs
ALERT_THRESHOLD_ERROR_RATE=5                     # Alert if error rate > 5%
ALERT_THRESHOLD_RESPONSE_TIME=1000               # Alert if response time > 1 second

# ============================================================================
# SECURITY
# ============================================================================
JWT_SECRET=your-production-jwt-secret            # 32+ character random string
ENCRYPTION_KEY=your-production-encryption-key    # For sensitive data
RATE_LIMIT_ENABLED=true
RATE_LIMIT_REQUESTS_PER_MINUTE=60

# ============================================================================
# BACKUP & RECOVERY
# ============================================================================
BACKUP_ENABLED=true
BACKUP_SCHEDULE=0 2 * * *                        # 2 AM daily
BACKUP_RETENTION_DAYS=30
BACKUP_STORAGE=s3                                # or: local, gcs
AWS_S3_BACKUP_BUCKET=hv-consultores-backups

# ============================================================================
# FEATURE FLAGS
# ============================================================================
FEATURE_AUTOMATION_RULES=true
FEATURE_JOB_QUEUE=true
FEATURE_SCHEDULER=true
FEATURE_NOTIFICATIONS=true
FEATURE_EMAIL_INTEGRATION=true
FEATURE_SLACK_INTEGRATION=true
FEATURE_WEBHOOK_INTEGRATION=true
FEATURE_BATCH_OPERATIONS=true
```

### Verify Configuration

```bash
# Check all required variables are set
./scripts/verify-env.sh

# Expected output:
# ✓ NODE_ENV is set
# ✓ DATABASE_URL is set
# ✓ EMAIL_PROVIDER is set
# ... all variables present
```

### Secure Configuration Storage

- [ ] Store `.env.production` in secure vault (not in git)
  ```bash
  # Add to .gitignore
  .env.production
  .env.*.local
  ```

- [ ] Use environment management tool (GitHub Secrets, Vercel Env, etc.)
  ```bash
  # If using Vercel
  vercel env add EMAIL_PROVIDER
  vercel env add SMTP_HOST
  # ... etc
  ```

- [ ] Rotate API keys and secrets before deployment
  - [ ] Supabase keys rotated
  - [ ] Email provider credentials updated
  - [ ] Slack webhook refreshed
  - [ ] JWT secret regenerated

---

## Database Preparation

### Backup Current Database

```bash
# Create full backup
pg_dump -U postgres -h localhost hv_consultores > backup_2026-01-11.sql

# Or using Supabase CLI
supabase db pull --file backup_2026-01-11.sql
```

### Apply Phase 6 Migrations

```bash
# Method 1: Using Supabase CLI
supabase db push --dry-run              # Preview changes
supabase db push                         # Apply migrations

# Method 2: Manual SQL execution
psql -U postgres -h localhost -d hv_consultores \
  -f src/migrations/add_queue_system.sql

# Method 3: Using application startup
# Migrations auto-run on application boot
npm run start
```

### Verify Database Schema

```bash
# Check tables created
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

# Expected new tables:
# - queue_jobs
# - scheduled_jobs
# - (other Phase 6 tables if any)

# Verify columns
\d queue_jobs
\d scheduled_jobs

# Verify indexes
SELECT indexname FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY indexname;

# Expected indexes:
# - idx_queue_jobs_estado
# - idx_queue_jobs_proxima
# - idx_queue_jobs_creado
# - idx_scheduled_jobs_activo
# - idx_scheduled_jobs_proxima

# Verify functions
SELECT proname FROM pg_proc
WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
ORDER BY proname;

# Expected functions:
# - contar_trabajos_por_estado
# - obtener_trabajos_pendientes
# - reintentar_trabajos_fallidos
# - limpiar_trabajos_antiguos
# - actualizar_timestamp_queue
```

### Set RLS Policies

```bash
# Verify RLS policies are enabled on all tables
SELECT tablename FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

# For each table, verify RLS
ALTER TABLE queue_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_jobs ENABLE ROW LEVEL SECURITY;

# Check policies exist
SELECT tablename, policyname FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

### Initialize Queue System

```bash
# Create initial scheduled jobs configuration
INSERT INTO scheduled_jobs (nombre, descripcion, cron_expression, tipo, activo)
VALUES
  ('check-expired-documents', 'Check for expired documents daily', '0 2 * * *', 'expire_check', true),
  ('execute-automation-rules', 'Execute all automation rules daily', '0 3 * * *', 'automation', true),
  ('send-daily-summaries', 'Send daily summary emails', '0 8 * * *', 'summary', true),
  ('weekly-cleanup', 'Weekly cleanup of old jobs', '0 1 * * 0', 'cleanup', true)
ON CONFLICT (nombre) DO NOTHING;

# Verify insertion
SELECT COUNT(*) FROM scheduled_jobs;
# Expected: 4
```

### Database Performance Tuning

```bash
# Analyze tables for query optimizer
ANALYZE queue_jobs;
ANALYZE scheduled_jobs;
ANALYZE queue_stats;

# Check table sizes
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

# Set up auto-vacuum parameters (if needed)
ALTER TABLE queue_jobs SET (autovacuum_vacuum_scale_factor = 0.05);
ALTER TABLE queue_jobs SET (autovacuum_analyze_scale_factor = 0.02);
```

---

## Security Hardening

### API Security

- [ ] Rate limiting enabled
  ```bash
  # In middleware
  RATE_LIMIT_ENABLED=true
  RATE_LIMIT_REQUESTS_PER_MINUTE=60
  ```

- [ ] CORS properly configured
  ```typescript
  // Verify only trusted origins allowed
  const allowedOrigins = ['https://hv-consultores.com']
  ```

- [ ] Authentication required on all API endpoints
  ```bash
  # Verify no public endpoints without auth
  grep -r "auth:" src/app/api --include="*.ts"
  ```

- [ ] Input validation on all endpoints
  ```bash
  # Check all server actions have validation
  grep -r "schema.parse\|zod\|validate" src/app --include="*.ts"
  ```

### Database Security

- [ ] All connections use TLS/SSL
  ```bash
  # In connection string
  SUPABASE_URL should use https://
  ```

- [ ] Service role key stored securely
  ```bash
  # Never expose in client code
  SUPABASE_SERVICE_ROLE_KEY only in .env
  ```

- [ ] RLS policies enforce data isolation
  ```sql
  -- Verify user-specific policies
  SELECT * FROM pg_policies
  WHERE tablename = 'queue_jobs';
  ```

### Secret Management

- [ ] No secrets in code
  ```bash
  # Scan for hardcoded secrets
  grep -r "password\|api_key\|secret" src --include="*.ts" \
    --exclude="*.example" | grep -v "env\."
  ```

- [ ] All secrets rotated for production
  - [ ] JWT secret
  - [ ] Database password
  - [ ] API keys
  - [ ] Encryption keys

- [ ] Secrets backup encrypted
  ```bash
  # Verify backup encryption
  file backup_2026-01-11.sql
  # Should be encrypted if sensitive
  ```

### Network Security

- [ ] HTTPS enforced
  ```bash
  # In next.config.js
  # Verify redirects to https
  ```

- [ ] HSTS header configured
  ```bash
  # In response headers
  Strict-Transport-Security: max-age=31536000; includeSubDomains
  ```

- [ ] CSP header configured
  ```bash
  Content-Security-Policy: default-src 'self'; ...
  ```

- [ ] CORS headers set correctly
  ```bash
  Access-Control-Allow-Origin: https://hv-consultores.com
  ```

---

## Performance Optimization

### Frontend Optimization

- [ ] Build output size optimized
  ```bash
  npm run build
  # Check output size
  # Should be < 5MB total
  ```

- [ ] Code splitting verified
  ```bash
  # Verify chunks created
  ls -la .next/static/chunks/
  ```

- [ ] Images optimized
  ```bash
  # Check image sizes
  find public -name "*.jpg" -o -name "*.png" | xargs ls -lh
  ```

### Backend Optimization

- [ ] Database indexes verified
  ```sql
  SELECT indexname FROM pg_indexes
  WHERE schemaname = 'public' AND tablename = 'queue_jobs';
  # Should have: estado, proxima_tentativa, creado_en
  ```

- [ ] Query performance analyzed
  ```sql
  -- Check slow queries
  SELECT query, mean_exec_time
  FROM pg_stat_statements
  WHERE mean_exec_time > 100
  ORDER BY mean_exec_time DESC;
  ```

- [ ] Caching configured
  ```bash
  # Redis or memory cache enabled if needed
  CACHE_PROVIDER=redis   # or 'memory'
  REDIS_URL=redis://...
  ```

### Queue Performance

- [ ] Batch size optimized
  ```bash
  QUEUE_PROCESSOR_BATCH_SIZE=100
  # Tune based on job complexity
  ```

- [ ] Interval timing optimized
  ```bash
  QUEUE_PROCESSOR_INTERVAL=10
  # More frequent = lower latency but higher CPU
  # Less frequent = lower CPU but higher latency
  ```

- [ ] Job timeout appropriate
  ```bash
  QUEUE_JOB_TIMEOUT=300000
  # 5 minutes for most jobs, adjust as needed
  ```

---

## Monitoring & Logging

### Logging Setup

- [ ] Application logs configured
  ```bash
  LOG_LEVEL=info
  LOG_FILE=/var/log/hv-consultores/application.log
  ```

- [ ] Log rotation configured
  ```bash
  LOG_MAX_SIZE=10m
  LOG_MAX_FILES=30
  # Keep 30 days of logs, rotate weekly
  ```

- [ ] Structured logging in place
  ```typescript
  // Log format: timestamp | level | component | message
  logger.info('Queue processing started', { job_count: 100 })
  ```

### Metrics & Monitoring

- [ ] Prometheus metrics enabled
  ```bash
  # Or Datadog/New Relic if preferred
  MONITORING_ENABLED=true
  ```

- [ ] Key metrics tracked
  - [ ] Queue size (pending, processing, failed)
  - [ ] Job processing time
  - [ ] Email delivery success rate
  - [ ] Slack delivery success rate
  - [ ] API response times
  - [ ] Database query times
  - [ ] Memory usage
  - [ ] CPU usage

- [ ] Dashboards created
  - [ ] Queue status dashboard
  - [ ] Job performance dashboard
  - [ ] Error rates dashboard
  - [ ] System health dashboard

### Alerting

- [ ] Alert rules configured
  - [ ] Queue size > 1000 jobs
  - [ ] Job failure rate > 5%
  - [ ] API response time > 1 second
  - [ ] Email delivery failure > 10%
  - [ ] Database connection errors
  - [ ] Memory usage > 80%
  - [ ] Disk space < 10% free

- [ ] Notification channels set up
  - [ ] Email alerts to ops team
  - [ ] Slack alerts to #alerts channel
  - [ ] PagerDuty for critical alerts

### Log Aggregation

- [ ] Central log collection (ELK, Loki, etc.)
  ```bash
  # Configure log shipping
  LOG_AGGREGATION_ENABLED=true
  LOG_AGGREGATION_ENDPOINT=https://logs.company.com
  ```

- [ ] Search and filtering available
- [ ] Log retention policy set (30+ days)

---

## Backup & Recovery

### Backup Strategy

- [ ] Database backups automated
  ```bash
  BACKUP_ENABLED=true
  BACKUP_SCHEDULE=0 2 * * *      # Daily at 2 AM
  BACKUP_RETENTION_DAYS=30        # Keep 30 days
  ```

- [ ] Backups encrypted
  ```bash
  BACKUP_ENCRYPTION=true
  BACKUP_ENCRYPTION_KEY=...
  ```

- [ ] Backups tested regularly
  ```bash
  # Monthly restore test
  # Restore to staging and verify
  ```

- [ ] Off-site backup storage
  ```bash
  BACKUP_STORAGE=s3
  AWS_S3_BACKUP_BUCKET=hv-consultores-backups
  ```

### Disaster Recovery Plan

- [ ] Recovery procedures documented
  ```bash
  # Document includes:
  # - RTO (Recovery Time Objective): 1 hour
  # - RPO (Recovery Point Objective): 1 hour
  # - Step-by-step recovery procedures
  ```

- [ ] Backup restoration tested
  ```bash
  # Test restore procedure
  ./scripts/restore-from-backup.sh backup_2026-01-11.sql
  ```

- [ ] Application startup verified
  ```bash
  npm run build
  npm start
  # Verify all features working
  ```

---

## Deployment Steps

### Pre-Deployment (Day Before)

- [ ] Schedule deployment window
  ```
  Date: [DATE]
  Time: [TIME] UTC
  Duration: 1-2 hours
  Maintenance window announced to users
  ```

- [ ] Notify stakeholders
  - [ ] Product team
  - [ ] Support team
  - [ ] Operations team

- [ ] Create deployment checklist copy for execution
- [ ] Prepare rollback plan
- [ ] Brief deployment team

### Deployment Day - Pre-Deployment (1 hour before)

- [ ] Final code verification
  ```bash
  git log --oneline -10
  npm run build
  npm test
  ```

- [ ] Database backup created
  ```bash
  pg_dump -U postgres hv_consultores > pre-deployment-backup.sql
  ```

- [ ] Staging deployment verified
  ```bash
  npm run build
  npm start
  # Test all features on staging
  ```

- [ ] Team ready and on call
  - [ ] DevOps engineer available
  - [ ] Database admin available
  - [ ] Application owner available
  - [ ] Deployment lead designated

### Deployment - Execution

**Step 1: Database Migration (2-3 minutes)**
```bash
# If new migrations exist
supabase db push

# Or manually:
psql -U postgres -d hv_consultores \
  -f src/migrations/add_queue_system.sql
```

**Step 2: Application Deployment (5-10 minutes)**
```bash
# Build application
npm run build

# Stop current instance
pm2 stop hv-consultores

# Deploy new code
git pull origin main
npm install --production

# Start new instance
pm2 start hv-consultores

# Verify health
curl http://localhost:3000/health
```

**Step 3: Feature Flag Rollout (Optional - 5 minutes)**
```bash
# Enable Phase 6 features in database
UPDATE feature_flags
SET enabled = true
WHERE name IN (
  'automation_rules',
  'job_queue',
  'scheduler',
  'notifications',
  'email_integration',
  'slack_integration',
  'webhook_integration',
  'batch_operations'
);
```

**Step 4: Smoke Testing (10 minutes)**
```bash
# Test critical paths
curl http://localhost:3000/api/health
curl http://localhost:3000/api/queue/stats
curl http://localhost:3000/api/scheduler/jobs

# Test UI
# - Load dashboard
# - Create test automation rule
# - Execute rule manually
# - Check notifications
# - Verify queue processing
```

**Step 5: Monitor Health (15 minutes)**
```bash
# Watch logs for errors
tail -f /var/log/hv-consultores/application.log | grep -i error

# Check queue metrics
curl http://localhost:3000/api/queue/stats

# Check database connections
psql -U postgres -c "SELECT count(*) FROM pg_stat_activity;"

# Monitor CPU and memory
top -p $(pgrep -f "node.*hv-consultores")
```

### Post-Deployment (1-2 hours)

- [ ] Monitor application metrics
  - [ ] No spike in error rate
  - [ ] Response times normal
  - [ ] Queue processing smoothly
  - [ ] Memory/CPU stable

- [ ] Check external services
  - [ ] Email sending working
  - [ ] Slack integration active
  - [ ] Webhook delivery successful

- [ ] Verify data integrity
  ```sql
  -- Check queue tables
  SELECT estado, COUNT(*) FROM queue_jobs GROUP BY estado;

  -- Check scheduled jobs
  SELECT COUNT(*) FROM scheduled_jobs WHERE activo = true;
  ```

- [ ] Notify stakeholders of successful deployment
  - [ ] Product team
  - [ ] Support team
  - [ ] Customers (if applicable)

---

## Post-Deployment Verification

### Automated Verification

```bash
# Run post-deployment tests
npm run test:smoke

# Expected: All smoke tests pass
# Duration: < 5 minutes
```

### Manual Verification Checklist

- [ ] **Automation Rules**
  - [ ] Create new rule
  - [ ] Edit existing rule
  - [ ] Delete rule
  - [ ] Execute rule manually
  - [ ] History shows execution

- [ ] **Job Queue**
  - [ ] Jobs queue properly
  - [ ] Jobs process successfully
  - [ ] Failed jobs retry
  - [ ] Stats endpoint responds

- [ ] **External Services**
  - [ ] Test email sent successfully
  - [ ] Slack message posted
  - [ ] Webhook delivered with signature
  - [ ] Notifications created

- [ ] **Batch Operations**
  - [ ] Batch job created
  - [ ] Progress updates displayed
  - [ ] Batch completes successfully
  - [ ] Results accurate

- [ ] **Scheduler**
  - [ ] Scheduled jobs appear
  - [ ] Can trigger manually
  - [ ] Next execution times correct
  - [ ] Jobs execute on schedule

- [ ] **Notifications**
  - [ ] Notifications display in UI
  - [ ] Can mark as read
  - [ ] Unread count correct
  - [ ] Deletion works

### Performance Verification

```bash
# Check response times
curl -w "@curl-format.txt" http://localhost:3000/dashboard/documentos/automation

# Expected:
# - First Load Time: < 2 seconds
# - Total Time: < 2 seconds
# - Connect Time: < 500ms
```

### Error Checking

```bash
# Check logs for errors
grep ERROR /var/log/hv-consultores/application.log | tail -20

# Expected: 0 errors related to Phase 6
```

---

## Rollback Procedures

### When to Rollback

- [ ] Critical feature broken
- [ ] Database corruption detected
- [ ] Performance degradation > 50%
- [ ] Data loss or corruption
- [ ] Security vulnerability discovered

### Quick Rollback (< 5 minutes)

```bash
# Stop current instance
pm2 stop hv-consultores

# Revert code to previous version
git revert HEAD
npm install

# Start previous version
pm2 start hv-consultores

# Verify
curl http://localhost:3000/health
```

### Database Rollback

```bash
# If database migration caused issues
psql -U postgres -d hv_consultores \
  -f pre-deployment-backup.sql

# Or drop Phase 6 tables if needed
DROP TABLE IF EXISTS queue_jobs CASCADE;
DROP TABLE IF EXISTS scheduled_jobs CASCADE;
```

### Full Rollback

```bash
# If issues are severe
1. Stop application
2. Restore database from backup
3. Restore application code to previous commit
4. Restart application
5. Verify all systems operational
```

### Communication

- [ ] Notify customers of rollback
- [ ] Update status page
- [ ] Post-mortem analysis
- [ ] Root cause documentation

---

## Deployment Sign-Off

### Pre-Deployment

- [ ] Code review completed by: _________________ Date: _______
- [ ] Testing verified by: _________________ Date: _______
- [ ] Security review passed by: _________________ Date: _______
- [ ] Performance verified by: _________________ Date: _______
- [ ] Database backup created by: _________________ Date: _______

### Deployment Authorization

- [ ] Deployment approved by: _________________ Date: _______
- [ ] Deployment window confirmed: _______________ UTC
- [ ] Stakeholders notified by: _________________ Date: _______

### Post-Deployment

- [ ] Deployment completed successfully at: _______________ UTC
- [ ] Smoke tests passed by: _________________ Date: _______
- [ ] Monitoring stable for 1 hour by: _________________ Date: _______
- [ ] Full verification completed by: _________________ Date: _______
- [ ] Deployment complete notification sent by: _________________ Date: _______

---

## Troubleshooting During Deployment

### Issue: Database Migration Fails

```bash
# Check migration errors
psql -U postgres -d hv_consultores -c \
  "SELECT * FROM schema_migrations ORDER BY version DESC LIMIT 5;"

# Resolve by:
1. Identify failed migration
2. Check migration script for syntax errors
3. Verify database permissions
4. Retry migration
```

### Issue: Application Won't Start

```bash
# Check logs
pm2 logs hv-consultores

# Common causes:
# - Missing environment variables
# - Port already in use
# - Database not accessible
# - Migrations not completed

# Solution:
# 1. Verify .env.production
# 2. Check port availability: lsof -i :3000
# 3. Test database: psql -U postgres
# 4. Re-run migrations
```

### Issue: Queue Not Processing Jobs

```bash
# Check queue processor status
curl http://localhost:3000/api/queue/stats

# Check database
SELECT COUNT(*) FROM queue_jobs WHERE estado = 'pending';

# Check logs for processing errors
tail -f /var/log/hv-consultores/application.log | grep -i queue

# Restart queue processor:
# 1. Restart application
# 2. Or manually trigger: curl -X POST .../api/queue/process
```

### Issue: Performance Degradation

```bash
# Check slow queries
SELECT query, mean_exec_time
FROM pg_stat_statements
WHERE mean_exec_time > 1000
ORDER BY mean_exec_time DESC;

# Check queue size
SELECT estado, COUNT(*) FROM queue_jobs GROUP BY estado;

# If queue backing up:
# - Increase QUEUE_PROCESSOR_BATCH_SIZE
# - Decrease QUEUE_PROCESSOR_INTERVAL
# - Check job processing logic for issues
```

---

## Success Criteria

Deployment is considered **SUCCESSFUL** when:

✅ **Functionality**
- [ ] All Phase 6 features working
- [ ] No broken features from previous phases
- [ ] All API endpoints responding

✅ **Performance**
- [ ] Response times < 1 second (95th percentile)
- [ ] Queue processing latency < 60 seconds
- [ ] No memory leaks detected
- [ ] CPU usage stable

✅ **Reliability**
- [ ] No errors in logs related to Phase 6
- [ ] Database healthy and responsive
- [ ] External service integrations working
- [ ] Notifications delivering reliably

✅ **Security**
- [ ] No security issues detected
- [ ] All authentication/authorization working
- [ ] RLS policies enforced
- [ ] Secrets secure and rotated

✅ **Monitoring**
- [ ] All metrics flowing correctly
- [ ] Alerts configured and tested
- [ ] Logs aggregating properly
- [ ] Dashboards displaying data

---

**Deployment Completed**: _______________
**Signed by**: ________________________
**Date**: _______________
**Time**: _______________
**Duration**: _______________

