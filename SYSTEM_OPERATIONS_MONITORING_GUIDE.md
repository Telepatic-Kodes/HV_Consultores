# System Operations & Monitoring Guide
## Phase 6 Production Operations Manual

**Version**: 1.0
**Date**: 2026-01-11
**Audience**: DevOps, Operations, System Administrators
**SLA**: 99.5% uptime

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Monitoring & Metrics](#monitoring--metrics)
3. [Performance Tuning](#performance-tuning)
4. [Scaling Procedures](#scaling-procedures)
5. [Capacity Planning](#capacity-planning)
6. [Incident Response](#incident-response)
7. [Disaster Recovery](#disaster-recovery)
8. [Regular Maintenance](#regular-maintenance)
9. [Optimization Strategies](#optimization-strategies)
10. [Operations Runbook](#operations-runbook)

---

## System Overview

### Architecture

```
┌─────────────────────────────────────┐
│   HV-Consultores Application        │
│   (Next.js 14.1 / Node.js)          │
├─────────────────────────────────────┤
│   Queue Processor                    │
│   (Background Jobs)                  │
├─────────────────────────────────────┤
│   Supabase / PostgreSQL              │
│   (Data & Queue Storage)             │
├─────────────────────────────────────┤
│   External Services                  │
│   (Email, Slack, Webhooks)           │
└─────────────────────────────────────┘
```

### Key Components

| Component | Purpose | Technology | Scalability |
|-----------|---------|-----------|------------|
| Web Server | Serve UI & APIs | Next.js 14 | Horizontal |
| Queue Processor | Background jobs | Node.js | Horizontal |
| Database | Data storage | PostgreSQL | Vertical |
| Cache | Performance | Redis (optional) | Horizontal |
| External Services | Integrations | SMTP/Slack/Webhooks | External |

### Health Checkpoints

```
Web Server → ✓ Responding
Queue Processor → ✓ Processing jobs
Database → ✓ Accepting connections
External Services → ✓ Delivering emails/webhooks
Logs → ✓ Collecting data
Metrics → ✓ Recording stats
```

---

## Monitoring & Metrics

### Key Metrics to Track

#### 1. Application Performance

```
Metric: Request Response Time
Target: < 1 second (95th percentile)
Alert: > 2 seconds sustained for 5 minutes

Metric: Error Rate
Target: < 0.1%
Alert: > 1% sustained for 5 minutes

Metric: Requests Per Second
Target: > 100 RPS capacity
Alert: Approaching 80% capacity
```

#### 2. Queue Performance

```
Metric: Pending Jobs Count
Target: < 10 jobs
Alert: > 100 jobs (system backing up)

Metric: Job Processing Latency
Target: < 30 seconds average
Alert: > 60 seconds sustained

Metric: Job Success Rate
Target: > 99%
Alert: < 95% failure rate too high

Metric: Job Failure Rate
Target: < 1%
Alert: > 5% investigate immediately
```

#### 3. Database Performance

```
Metric: Connection Pool Usage
Target: < 50% of max connections
Alert: > 80% utilization

Metric: Query Latency
Target: < 100ms (95th percentile)
Alert: > 500ms sustained

Metric: Cache Hit Ratio
Target: > 80%
Alert: < 60% indicates configuration issue

Metric: Disk Space Used
Target: < 70% of allocated
Alert: > 85% utilization
```

#### 4. External Services

```
Metric: Email Delivery Success Rate
Target: > 99%
Alert: < 95%

Metric: Email Delivery Time
Target: < 5 seconds
Alert: > 30 seconds

Metric: Slack API Response Time
Target: < 1 second
Alert: > 3 seconds

Metric: Webhook Delivery Success Rate
Target: > 98%
Alert: < 95%
```

### Monitoring Tools

#### Prometheus (Metrics Collection)

```yaml
# prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'hv-consultores'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'postgres'
    static_configs:
      - targets: ['localhost:9187']

  - job_name: 'node'
    static_configs:
      - targets: ['localhost:9100']
```

#### Grafana (Visualization)

Create dashboards for:
- Application Performance
- Queue System Status
- Database Health
- External Service Integrations
- Business Metrics

#### ELK Stack (Logging)

- **Elasticsearch**: Log storage
- **Logstash**: Log processing
- **Kibana**: Log visualization

### Setting Up Monitoring

#### Step 1: Install Prometheus

```bash
# Download
wget https://github.com/prometheus/prometheus/releases/download/v2.40.0/prometheus-2.40.0.linux-amd64.tar.gz

# Extract
tar xvfz prometheus-2.40.0.linux-amd64.tar.gz
cd prometheus-2.40.0.linux-amd64

# Run
./prometheus --config.file=prometheus.yml
```

#### Step 2: Install Grafana

```bash
# Using Docker
docker run -d \
  -p 3000:3000 \
  --name=grafana \
  grafana/grafana

# Access at http://localhost:3000
# Default credentials: admin/admin
```

#### Step 3: Configure Dashboards

```bash
# Import pre-built dashboards
# Node.js app: Dashboard ID 11074
# PostgreSQL: Dashboard ID 7379
# Redis: Dashboard ID 7752
```

#### Step 4: Set Up Alerts

```yaml
# Alert rules in Prometheus
groups:
  - name: hv-consultores
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
        for: 5m
        annotations:
          summary: "High error rate detected"

      - alert: QueueBackup
        expr: queue_jobs_pending > 100
        for: 5m
        annotations:
          summary: "Job queue backing up"

      - alert: DatabaseSlow
        expr: pg_query_latency > 500
        for: 5m
        annotations:
          summary: "Database queries slow"
```

---

## Performance Tuning

### Database Optimization

#### Index Analysis

```sql
-- Find missing indexes
SELECT schemaname, tablename, attname, n_distinct
FROM pg_stats
WHERE schemaname = 'public'
ORDER BY abs(n_distinct) DESC;

-- Check index usage
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
ORDER BY idx_scan ASC;

-- Unused indexes (consider dropping)
SELECT schemaname, tablename, indexname
FROM pg_stat_user_indexes
WHERE idx_scan = 0
ORDER BY pg_relation_size(indexrelid) DESC;
```

#### Query Optimization

```sql
-- Analyze slow queries
SELECT query, mean_exec_time, stddev_exec_time
FROM pg_stat_statements
WHERE mean_exec_time > 100
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Use EXPLAIN to analyze execution plans
EXPLAIN ANALYZE
SELECT * FROM queue_jobs
WHERE estado = 'pending'
AND proxima_tentativa <= NOW()
LIMIT 10;

-- Create indexes for common queries
CREATE INDEX idx_queue_jobs_pending
ON queue_jobs(estado, proxima_tentativa)
WHERE estado = 'pending';
```

#### Connection Pool Tuning

```sql
-- Check current settings
SHOW max_connections;      -- Default: 100
SHOW shared_buffers;       -- Default: 25% RAM
SHOW work_mem;             -- Default: 4MB

-- Recommended for production:
-- max_connections = 200 (for 4-8 app servers)
-- shared_buffers = 25% of system RAM
-- work_mem = 256MB (for large operations)
-- effective_cache_size = 50-75% of RAM

-- Apply settings in postgresql.conf
# postgresql.conf
max_connections = 200
shared_buffers = 8GB
work_mem = 256MB
effective_cache_size = 24GB
```

#### Table Maintenance

```sql
-- Vacuum to reclaim space
VACUUM ANALYZE queue_jobs;
VACUUM ANALYZE scheduled_jobs;

-- Full vacuum (takes lock)
VACUUM FULL;

-- Auto-vacuum configuration
ALTER TABLE queue_jobs SET (
  autovacuum_vacuum_scale_factor = 0.05,
  autovacuum_analyze_scale_factor = 0.02
);

-- Check autovacuum status
SELECT schemaname, tablename, last_vacuum, last_autovacuum
FROM pg_stat_user_tables
ORDER BY last_vacuum DESC;
```

### Application Tuning

#### Node.js Optimization

```javascript
// Set appropriate worker count
const cluster = require('cluster');
const os = require('os');
const numCPUs = os.cpus().length;

// For queue processor: number of workers
const QUEUE_WORKERS = Math.min(numCPUs - 1, 4);

// For web server: one worker per CPU
if (cluster.isMaster) {
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }
}
```

#### Next.js Build Optimization

```bash
# Analyze bundle size
npm run build -- --analyze

# Use dynamic imports
import dynamic from 'next/dynamic'

const AutomationDashboard = dynamic(
  () => import('@/components/automation/Dashboard'),
  { loading: () => <p>Loading...</p> }
)
```

#### Caching Strategies

```typescript
// Cache automation rules (5 minutes)
import { unstable_cache } from 'next/cache'

const getAutomationRules = unstable_cache(
  async () => {
    return await db.query('SELECT * FROM automation_rules')
  },
  ['automation-rules'],
  { revalidate: 300 }
)

// Cache queue stats (1 minute)
const getQueueStats = unstable_cache(
  async () => {
    return await db.query('SELECT * FROM queue_stats')
  },
  ['queue-stats'],
  { revalidate: 60 }
)
```

---

## Scaling Procedures

### Horizontal Scaling (Add More Servers)

#### Before Scaling

```bash
# Check current capacity
curl http://localhost:3000/api/health

# Monitor metrics
# - CPU usage approaching 80%?
# - Memory usage approaching 85%?
# - Request latency increasing?
```

#### Scaling Up

**Step 1: Prepare New Server**
```bash
# Clone application repository
git clone https://github.com/company/hv-consultores.git

# Install dependencies
npm install --production

# Copy environment configuration
cp /prod/.env.production .env

# Build application
npm run build
```

**Step 2: Configure Load Balancer**
```nginx
# nginx configuration
upstream hv_consultores {
  server app1.internal:3000 weight=3;
  server app2.internal:3000 weight=3;
  server app3.internal:3000 weight=3;
  keepalive 32;
}

server {
  listen 80;
  server_name hv-consultores.com;

  location / {
    proxy_pass http://hv_consultores;
    proxy_http_version 1.1;
    proxy_set_header Connection "";
    proxy_set_header Host $host;
  }
}
```

**Step 3: Start Application**
```bash
pm2 start hv-consultores --instances 4 --exec-mode cluster

# Verify
curl http://localhost:3000/health
```

**Step 4: Add to Load Balancer**
```bash
# Reload nginx (graceful)
nginx -s reload

# Verify traffic distribution
# Watch logs to confirm requests routing
```

#### Scaling Down

```bash
# Remove from load balancer first
# (update nginx config)

# Wait for connections to close (60 seconds)
sleep 60

# Stop application
pm2 stop hv-consultores
```

### Vertical Scaling (More Resources on Single Server)

#### CPU Scaling

```bash
# Check current CPU cores
nproc

# Monitor CPU usage
top -o %CPU

# If CPU-bound:
# 1. Upgrade server instance type
# 2. Optimize database queries
# 3. Enable caching layer
```

#### Memory Scaling

```bash
# Check current memory
free -h

# Monitor memory usage
ps aux --sort=-%mem | head -20

# If memory-bound:
# 1. Upgrade server RAM
# 2. Reduce worker processes
# 3. Implement caching strategy
```

#### Storage Scaling

```bash
# Check disk usage
df -h

# Check database size
SELECT pg_size_pretty(pg_database_size('hv_consultores'));

# If storage-bound:
# 1. Add new disk
# 2. Cleanup old logs/backups
# 3. Archive old data
```

---

## Capacity Planning

### Forecasting Growth

#### Current Capacity

```
Web Server:
- Hardware: 4 CPUs, 16GB RAM, 100GB SSD
- Performance: 200 RPS capacity
- Current Load: 50 RPS (25% utilization)

Database:
- Connection Pool: 100 connections
- Current Usage: 30 connections (30%)
- Size: 50GB (30% of 200GB allocated)

Queue System:
- Processing: 100 jobs/minute
- Current Load: 30 jobs/minute (30%)
```

#### Growth Projections (12 months)

```
Conservative (10% growth/month):
Month 6:  Load = 50 * 1.10^3 = 67 RPS (33%)
Month 12: Load = 50 * 1.10^6 = 89 RPS (45%)

Aggressive (20% growth/month):
Month 6:  Load = 50 * 1.20^3 = 104 RPS (52%)
Month 12: Load = 50 * 1.20^6 = 172 RPS (86%)
```

#### Scaling Timeline

```
At 75% Capacity (150 RPS):
- Trigger: Load reaching 150 RPS
- Action: Add 1 more web server (horizontal scale)
- Timeline: Can happen in 3-6 months if growth is 20%/month

At 85% Database Connections:
- Trigger: Connection usage > 85
- Action: Upgrade database instance
- Timeline: After 6-9 months of 20% growth

At 80% Disk Space:
- Trigger: Database > 160GB
- Action: Archive old data, upgrade storage
- Timeline: After 12-18 months
```

#### Pre-Emptive Scaling

```bash
# Monitor every week
Weekly Scaling Review:
- Current RPS load
- Database size growth rate
- Queue job volume
- Error rates and timeouts

# Plan ahead
If trajectory will hit 75% capacity in < 8 weeks:
- Order new servers
- Plan migration
- Schedule change windows
```

---

## Incident Response

### Severity Levels

| Level | Description | Response Time | Escalation |
|-------|-------------|----------------|------------|
| P1 | Complete outage | 15 minutes | VP of Ops |
| P2 | Major degradation | 30 minutes | Manager |
| P3 | Minor issue | 2 hours | Team lead |
| P4 | Non-critical issue | 24 hours | Team |

### Incident Triage

```
1. Assess Severity
   - Is it P1, P2, P3, or P4?
   - How many users affected?
   - Is production data at risk?

2. Gather Information
   - What was the last change?
   - Check recent deployments
   - Review error logs
   - Check metrics dashboard

3. Isolate Problem
   - Is it application, database, or external?
   - Use binary search method
   - Test each component

4. Implement Fix
   - Apply hotfix if available
   - Or roll back recent change
   - Monitor carefully

5. Post-Mortem
   - Document what happened
   - Why did it happen
   - How to prevent in future
```

### Common Issues & Solutions

#### Issue: High Error Rate Spike

**Detection:**
```
Alert: Error rate > 5% sustained for 5 minutes
Dashboard: Sudden spike in HTTP 500 responses
```

**Investigation:**
```bash
# Check application logs
tail -f /var/log/hv-consultores/application.log | grep ERROR

# Check database
psql -U postgres -c "SELECT pg_stat_reset();"
SELECT pg_stat_statements ... (analyze recent queries)

# Check external services
curl https://smtp.gmail.com:587
curl https://hooks.slack.com/...
```

**Solution:**
```bash
# Option 1: Restart application
pm2 restart hv-consultores

# Option 2: Scale horizontally
# Add more web servers to distribute load

# Option 3: Rollback if recent deployment
git revert [commit-hash]
```

#### Issue: Queue Backing Up

**Detection:**
```
Alert: Pending jobs > 100
Dashboard: Queue status shows "RUNNING" for long time
```

**Investigation:**
```sql
-- Check pending jobs
SELECT COUNT(*) FROM queue_jobs WHERE estado = 'pending';

-- Check which job types accumulating
SELECT tipo, COUNT(*) FROM queue_jobs
WHERE estado IN ('pending', 'processing')
GROUP BY tipo;

-- Check for stuck jobs
SELECT id, tipo, creado_en, proxima_tentativa
FROM queue_jobs
WHERE estado = 'processing'
AND creado_en < NOW() - INTERVAL '1 hour';
```

**Solution:**
```bash
# Option 1: Restart queue processor
pm2 restart queue-processor

# Option 2: Increase processing batch size
# Edit: QUEUE_PROCESSOR_BATCH_SIZE=100 → 200

# Option 3: Add more queue workers
# Depends on configuration (horizontal scale)

# Option 4: Investigate slow jobs
# If specific job type stuck, check error logs
SELECT error FROM queue_jobs
WHERE tipo = 'email'
AND estado = 'failed'
LIMIT 10;
```

#### Issue: Database Connection Pool Exhausted

**Detection:**
```
Error: "FATAL: remaining connection slots reserved for non-replication superuser connections"
```

**Investigation:**
```sql
-- Check connection usage
SELECT datname, usename, count(*)
FROM pg_stat_activity
GROUP BY datname, usename;

-- Find long-running queries
SELECT pid, usename, duration, query
FROM pg_stat_statements
WHERE duration > 300000
ORDER BY duration DESC;
```

**Solution:**
```bash
# Option 1: Kill idle connections
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE state = 'idle'
AND query_start < NOW() - INTERVAL '10 minutes';

# Option 2: Increase max_connections
# Edit postgresql.conf:
# max_connections = 200 → 300
# Then restart PostgreSQL

# Option 3: Enable connection pooling (PgBouncer)
docker run -d \
  -e PGBOUNCER_POOL_MODE=transaction \
  -e DATABASES_HOST=postgres.internal \
  pgbouncer/pgbouncer
```

### Incident Communication

```
Template: Incident Notification

Subject: [INCIDENT] Service Degradation - Queue Processing

Start Time: 2026-01-11 14:23 UTC
Duration: ~30 minutes
Severity: P2 (Major)

Impact:
- Automation rules delayed by 1-2 minutes
- Users could not see execution history
- Batch operations affected

Root Cause:
- Database connection pool exhausted
- Slow query on queue_jobs table

Resolution:
- Killed idle connections
- Added index to problematic query
- Restarted application

Status: RESOLVED as of 14:53 UTC
```

---

## Disaster Recovery

### Backup Strategy

#### Automated Backups

```bash
# Daily database backup
0 2 * * * pg_dump hv_consultores | gzip > /backups/db_$(date +\%Y\%m\%d).sql.gz

# Weekly full backup
0 3 * * 0 tar -czf /backups/full_$(date +\%Y\%m\%d).tar.gz /app /data

# Upload to cloud storage
0 4 * * * aws s3 cp /backups/ s3://hv-consultores-backups/ --recursive

# Cleanup old backups (keep 30 days)
0 5 * * * find /backups -mtime +30 -delete
```

#### Backup Verification

```bash
# Weekly: Test restore procedure
Weekly backup validation:

1. Restore to staging database:
   psql -U postgres < /backups/db_20260111.sql.gz

2. Verify data integrity:
   SELECT COUNT(*) FROM queue_jobs;
   SELECT COUNT(*) FROM automation_rules;

3. Test functionality:
   - Create automation rule
   - Execute rule
   - Verify results

4. Document restore time and success
```

### Recovery Procedures

#### Recovery Time Objectives (RTO)

```
RTO Target: 1 hour
- 5 min: Detect failure
- 20 min: Restore database
- 15 min: Restore application
- 10 min: Verify and cutover
- 10 min: Buffer
```

#### Recovery Point Objectives (RPO)

```
RPO Target: 1 hour
- Database: Hourly backups
- Code: Every deployment (5-10x per day)
- Configuration: Real-time (stored in git)
```

#### Database Recovery

```bash
# Step 1: Identify latest backup
ls -lt /backups/db_*.sql.gz | head -1

# Step 2: Create recovery database
psql -U postgres -c "CREATE DATABASE hv_consultores_recover;"

# Step 3: Restore backup
gunzip -c /backups/db_20260111.sql.gz | \
  psql -U postgres -d hv_consultores_recover

# Step 4: Verify recovery
psql -U postgres -d hv_consultores_recover \
  -c "SELECT COUNT(*) FROM queue_jobs;"

# Step 5: Failover
# Update application connection string:
# SUPABASE_URL → recover database
# Test all functionality
# Monitor carefully

# Step 6: Rename database
psql -U postgres -c \
  "ALTER DATABASE hv_consultores RENAME TO hv_consultores_old;"
psql -U postgres -c \
  "ALTER DATABASE hv_consultores_recover RENAME TO hv_consultores;"
```

#### Application Recovery

```bash
# Step 1: Check if application will restart
pm2 logs hv-consultores | tail -50

# Step 2: Restart application
pm2 restart hv-consultores

# Step 3: Verify health
curl http://localhost:3000/health

# Step 4: Monitor metrics
# Watch error rate, response time
# Confirm traffic flowing normally

# Step 5: If still issues, rollback to previous version
git revert HEAD
npm install
npm run build
pm2 restart hv-consultores
```

#### Failover Procedures

```bash
# For redundant database setup

# Step 1: Detect primary failure
Monitoring detects: Cannot connect to primary DB

# Step 2: Promote replica to primary
psql -h replica.internal -U postgres -c \
  "SELECT pg_promote();"

# Step 3: Update application connection
export SUPABASE_URL=replica.internal
# Restart application

# Step 4: Monitor
# Verify replication stopped
# Check data consistency
# Monitor for lag

# Step 5: Restore original primary when ready
# Resync from new primary
# Return to multi-node setup
```

---

## Regular Maintenance

### Daily Tasks

```
7:00 AM - System Health Check
[ ] Check application is running: curl http://localhost:3000/health
[ ] Review error logs: tail -100 /var/log/hv-consultores/application.log
[ ] Check queue status: queue_jobs count
[ ] Verify external services: email, Slack, webhooks

12:00 PM - Midday Check
[ ] CPU/Memory usage normal
[ ] Database responsive
[ ] Response times stable

4:00 PM - End of Day Check
[ ] All batch jobs completed successfully
[ ] No pending alerts
[ ] Prepare for scheduled maintenance if needed
```

### Weekly Tasks

```
Monday 9:00 AM - Full System Review
[ ] Run performance analysis (query analysis, slow logs)
[ ] Check backup completion: ls -lt /backups/ | head -5
[ ] Review capacity metrics:
    - CPU trend (growing?)
    - Memory trend (growing?)
    - Disk trend (growing?)
    - Database size (growing?)
[ ] Test backup restoration on staging
[ ] Review and update monitoring thresholds
[ ] Generate weekly report
```

### Monthly Tasks

```
First Friday 10:00 AM - Monthly Maintenance Window
[ ] Database optimization:
    - VACUUM ANALYZE all tables
    - Reindex if needed
    - Check table statistics

[ ] Security:
    - Rotate API keys and secrets
    - Review access logs
    - Update SSL certificates if within 30 days of expiration

[ ] Capacity review:
    - Project growth for next quarter
    - Identify scaling needs
    - Order hardware if needed

[ ] Documentation update:
    - Update runbooks
    - Review incident logs
    - Update architectural diagrams

[ ] Disaster recovery drill:
    - Full restore test
    - Measure RTO/RPO
    - Document any issues
```

### Quarterly Tasks

```
Q1 Review (Jan-Mar)
[ ] Full system audit
[ ] Security assessment
[ ] Performance benchmarking
[ ] Upgrade evaluation
[ ] Team training & certification
[ ] Capacity planning for next year
```

---

## Optimization Strategies

### Cost Optimization

#### Database

```
Current Cost: $500/month (4 vCPU, 16GB RAM, 200GB)
Optimization:
1. Right-size instance
   - Monitor: CPU < 20%, Memory < 40%
   - Action: Downgrade to 2 vCPU, 8GB RAM
   - Savings: $250/month

2. Storage optimization
   - Archive old logs (> 90 days)
   - Compress backups
   - Savings: $50-100/month
```

#### Application Servers

```
Current Cost: $200/month per server × 3 = $600
Optimization:
1. Consolidate to fewer, larger instances
2. Use auto-scaling (pay only for needed capacity)
3. Implement aggressive caching

Estimated Savings: 20-30%
```

#### External Services

```
Email delivery: $50/month (50k emails)
Optimization: Queue batching reduces emails by 20%
Savings: $10/month

Slack: Free tier
Webhooks: Bandwidth-based $0-10/month
Total External: $50-60/month
```

### Performance Optimization

#### Query Optimization

```sql
-- Before (slow)
SELECT * FROM queue_jobs
WHERE estado = 'pending'
ORDER BY creado_en ASC;
-- Execution time: 450ms

-- After (fast with index)
CREATE INDEX idx_queue_pending ON queue_jobs(estado)
WHERE estado = 'pending';

SELECT * FROM queue_jobs
WHERE estado = 'pending'
ORDER BY creado_en ASC;
-- Execution time: 15ms (30x faster!)
```

#### Caching Strategy

```
Static Content:
- CDN cache: 1 week (never changes)
- Browser cache: 1 day

API Responses:
- Queue stats: 1 minute cache
- Automation rules: 5 minute cache
- User permissions: 30 minute cache

Database:
- Query result cache: 5-60 minutes
- Session cache: 30 minutes
```

#### Compression

```
Enable gzip compression:

web.config (IIS):
<httpCompression>
  <staticCompression directory="%SystemDrive%\inetpub\temp\IIS Temporary Compressed Files">
    <scheme name="gzip" dll="%Windir%\system32\inetsrv\gzip.dll"/>
  </staticCompression>
</httpCompression>

nginx:
gzip on;
gzip_types text/plain text/css text/javascript ...;
gzip_min_length 1024;
```

---

## Operations Runbook

### Morning Startup Checklist

```
6:00 AM - Pre-Business Hours Check

□ System Status
  Command: curl -s http://localhost:3000/health | jq
  Expected: "status": "ok"

□ Database Connection
  Command: psql -U postgres -c "SELECT 1"
  Expected: No errors, response "1"

□ Queue Processor Status
  Command: pm2 list
  Expected: hv-consultores and queue-processor both "online"

□ Error Logs (Last hour)
  Command: grep ERROR /var/log/hv-consultores/application.log | \
            awk 'BEGIN{print strftime("%Y-%m-%d %H:00", systime()-3600)} {print}' | wc -l
  Expected: < 5 errors

□ Queue Status
  Command: psql -U postgres -d hv_consultores \
            -c "SELECT estado, COUNT(*) FROM queue_jobs GROUP BY estado"
  Expected: pending < 50, processing <= 1, completed > 100

□ External Services Health
  Command: Check email, Slack, webhook connectivity
  Expected: All responding

□ Capacity Check
  Command: free -h; df -h; top -bn1 | head -20
  Expected: CPU < 50%, Memory < 70%, Disk < 80%

All checks passed? → System ready for business
Any failures? → Escalate to on-call engineer
```

### End of Day Shutdown Checklist

```
5:00 PM - End of Day Review

□ Final Error Check
  Command: tail -100 /var/log/hv-consultores/application.log | grep ERROR
  Expected: No new critical errors

□ Batch Jobs Completed
  Command: SELECT * FROM batch_jobs WHERE estado = 'RUNNING'
  Expected: No running jobs (all completed)

□ Queue Empty
  Command: SELECT COUNT(*) FROM queue_jobs WHERE estado != 'completed'
  Expected: < 5 pending jobs

□ Alerts Summary
  Command: Check monitoring dashboard
  Expected: Green status, no active alerts

□ Scheduled Jobs Tomorrow
  Command: SELECT * FROM scheduled_jobs WHERE proxima_ejecucion BETWEEN NOW() AND NOW() + INTERVAL '1 day'
  Expected: Review scheduled jobs, confirm times are appropriate

□ Documentation Update
  Expected: Update incident log if any issues occurred
  Expected: Update runbook if procedures changed

All checks passed? → System ready for overnight
Any issues? → Plan morning follow-up
```

---

## SLA & Performance Targets

### Service Level Agreement

```
Uptime Target:        99.5% (21.6 hours/month downtime allowed)
Response Time (95th):  1 second
Error Rate:           < 0.1%
Queue Processing:     < 60 seconds latency
```

### Performance Baselines

```
Web Server:
- Response time: 200-400ms avg
- P95: < 1 second
- P99: < 2 seconds
- Error rate: < 0.05%

Database:
- Query time: < 100ms (95th)
- Connection pool: 30-50 used
- Lock wait: < 100ms

Queue:
- Processing latency: < 30 seconds
- Success rate: > 99%
- Job throughput: 100+ jobs/minute
```

---

## Contact Information

### On-Call Rotation
- **Primary**: [Name] - [Phone]
- **Secondary**: [Name] - [Phone]
- **Escalation**: [Manager] - [Phone]

### External Contacts
- **Supabase Support**: support@supabase.io
- **Email Provider Support**: [Provider contact]
- **Cloud Provider Support**: [AWS/GCP/Azure contact]

### Documentation Links
- **Architecture Diagrams**: [Link]
- **Deployment Guide**: [Link]
- **API Documentation**: [Link]
- **Incident Logs**: [Spreadsheet]

---

**Last Updated**: 2026-01-11
**Next Review**: 2026-02-11
**Maintained By**: DevOps Team

