-- Phase 7: Advanced Analytics & Business Intelligence
-- Database Schema for Analytics Tables
-- Created: 2026-01-11
-- Purpose: Create analytics tables for document, automation, team, and queue metrics

-- ============================================================================
-- ANALYTICS DOCUMENT METRICS TABLE
-- ============================================================================
-- Stores daily document statistics and metrics
CREATE TABLE IF NOT EXISTS analytics_document_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL UNIQUE,
  organization_id UUID NOT NULL,

  -- Document counts
  total_documents INTEGER DEFAULT 0,
  active_documents INTEGER DEFAULT 0,
  archived_documents INTEGER DEFAULT 0,
  deleted_documents INTEGER DEFAULT 0,

  -- Document age metrics
  documents_0_30_days INTEGER DEFAULT 0,      -- Created in last 30 days
  documents_31_90_days INTEGER DEFAULT 0,     -- Created 31-90 days ago
  documents_91_365_days INTEGER DEFAULT 0,    -- Created 91-365 days ago
  documents_over_1year INTEGER DEFAULT 0,     -- Created over 1 year ago

  -- Upload metrics
  upload_count INTEGER DEFAULT 0,             -- Documents uploaded today
  upload_volume_mb BIGINT DEFAULT 0,         -- Total upload volume in MB

  -- Document expiration
  expiring_soon INTEGER DEFAULT 0,            -- Documents expiring within 30 days

  -- Storage metrics
  storage_used_mb BIGINT DEFAULT 0,          -- Total storage used in MB
  storage_used_gb NUMERIC(10, 2) DEFAULT 0,  -- Total storage used in GB

  -- Document types
  document_types JSONB DEFAULT '{}',         -- { "pdf": 100, "docx": 50, ... }

  -- Audit
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_analytics_document_org
    FOREIGN KEY (organization_id)
    REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_analytics_document_daily_date
  ON analytics_document_daily(date DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_document_daily_org
  ON analytics_document_daily(organization_id, date DESC);

-- ============================================================================
-- ANALYTICS AUTOMATION METRICS TABLE
-- ============================================================================
-- Stores automation rule performance and execution metrics
CREATE TABLE IF NOT EXISTS analytics_automation_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  organization_id UUID NOT NULL,

  -- Rule metrics
  total_rules INTEGER DEFAULT 0,
  active_rules INTEGER DEFAULT 0,
  disabled_rules INTEGER DEFAULT 0,

  -- Execution metrics
  total_executions INTEGER DEFAULT 0,
  successful_executions INTEGER DEFAULT 0,
  failed_executions INTEGER DEFAULT 0,
  skipped_executions INTEGER DEFAULT 0,

  -- Success rate
  success_rate NUMERIC(5, 2) DEFAULT 0,      -- Percentage 0-100

  -- Performance
  average_execution_time_ms INTEGER DEFAULT 0,  -- Average execution time in ms
  min_execution_time_ms INTEGER DEFAULT 0,
  max_execution_time_ms INTEGER DEFAULT 0,

  -- Time saved
  hours_saved NUMERIC(10, 2) DEFAULT 0,      -- Estimated hours saved by automation

  -- Error metrics
  errors_by_type JSONB DEFAULT '{}',         -- { "timeout": 5, "network": 2, ... }

  -- Documents processed
  documents_processed INTEGER DEFAULT 0,
  documents_archived INTEGER DEFAULT 0,
  documents_deleted INTEGER DEFAULT 0,

  -- Audit
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(date, organization_id),
  CONSTRAINT fk_analytics_automation_org
    FOREIGN KEY (organization_id)
    REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_analytics_automation_daily_date
  ON analytics_automation_daily(date DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_automation_daily_org
  ON analytics_automation_daily(organization_id, date DESC);

-- ============================================================================
-- ANALYTICS TEAM METRICS TABLE
-- ============================================================================
-- Stores team activity, productivity, and performance metrics
CREATE TABLE IF NOT EXISTS analytics_team_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  organization_id UUID NOT NULL,

  -- Team counts
  total_users INTEGER DEFAULT 0,
  active_users INTEGER DEFAULT 0,
  inactive_users INTEGER DEFAULT 0,

  -- Activity metrics
  total_user_actions INTEGER DEFAULT 0,       -- All user actions (uploads, views, etc.)
  document_uploads INTEGER DEFAULT 0,
  document_downloads INTEGER DEFAULT 0,
  document_shares INTEGER DEFAULT 0,
  automation_rule_creates INTEGER DEFAULT 0,

  -- Top performers
  top_performer_id UUID,                      -- User ID of top performer
  top_performer_actions INTEGER DEFAULT 0,    -- Actions by top performer

  -- Time metrics
  peak_activity_hour INTEGER DEFAULT 0,       -- Hour of day with most activity (0-23)
  average_session_duration_min INTEGER DEFAULT 0,

  -- Collaboration metrics
  collaboration_score NUMERIC(5, 2) DEFAULT 0, -- 0-100 score
  shared_documents INTEGER DEFAULT 0,
  team_comments INTEGER DEFAULT 0,

  -- Department breakdown
  departments_data JSONB DEFAULT '{}',        -- { "sales": 50, "ops": 30, ... }

  -- Audit
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(date, organization_id),
  CONSTRAINT fk_analytics_team_org
    FOREIGN KEY (organization_id)
    REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT fk_analytics_team_user
    FOREIGN KEY (top_performer_id)
    REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_analytics_team_daily_date
  ON analytics_team_daily(date DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_team_daily_org
  ON analytics_team_daily(organization_id, date DESC);

-- ============================================================================
-- ANALYTICS QUEUE METRICS TABLE
-- ============================================================================
-- Stores job queue performance and system health metrics
CREATE TABLE IF NOT EXISTS analytics_queue_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  organization_id UUID NOT NULL,

  -- Queue status counts
  pending_jobs INTEGER DEFAULT 0,
  processing_jobs INTEGER DEFAULT 0,
  completed_jobs INTEGER DEFAULT 0,
  failed_jobs INTEGER DEFAULT 0,

  -- Processing metrics
  jobs_completed_today INTEGER DEFAULT 0,
  jobs_failed_today INTEGER DEFAULT 0,
  job_success_rate NUMERIC(5, 2) DEFAULT 0,  -- Percentage 0-100

  -- Latency metrics (milliseconds)
  avg_latency_ms INTEGER DEFAULT 0,           -- Average processing latency
  p50_latency_ms INTEGER DEFAULT 0,           -- 50th percentile
  p95_latency_ms INTEGER DEFAULT 0,           -- 95th percentile
  p99_latency_ms INTEGER DEFAULT 0,           -- 99th percentile
  max_latency_ms INTEGER DEFAULT 0,

  -- Job type breakdown
  email_jobs INTEGER DEFAULT 0,
  webhook_jobs INTEGER DEFAULT 0,
  archive_jobs INTEGER DEFAULT 0,
  delete_jobs INTEGER DEFAULT 0,
  notification_jobs INTEGER DEFAULT 0,
  report_jobs INTEGER DEFAULT 0,

  -- External service health
  external_services_health JSONB DEFAULT '{}', -- { "sendgrid": "healthy", "slack": "healthy" }

  -- System metrics
  system_cpu_usage NUMERIC(5, 2) DEFAULT 0,   -- CPU percentage 0-100
  system_memory_usage NUMERIC(5, 2) DEFAULT 0, -- Memory percentage 0-100
  database_connections INTEGER DEFAULT 0,

  -- Capacity
  queue_depth INTEGER DEFAULT 0,              -- Current queue depth
  hourly_throughput INTEGER DEFAULT 0,        -- Jobs per hour

  -- Audit
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(date, organization_id),
  CONSTRAINT fk_analytics_queue_org
    FOREIGN KEY (organization_id)
    REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_analytics_queue_daily_date
  ON analytics_queue_daily(date DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_queue_daily_org
  ON analytics_queue_daily(organization_id, date DESC);

-- ============================================================================
-- ANALYTICS COMPLIANCE METRICS TABLE
-- ============================================================================
-- Stores compliance and audit-related metrics
CREATE TABLE IF NOT EXISTS analytics_compliance_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  organization_id UUID NOT NULL,

  -- Compliance status
  gdpr_compliant BOOLEAN DEFAULT true,
  hipaa_compliant BOOLEAN DEFAULT true,
  soc2_compliant BOOLEAN DEFAULT true,
  iso27001_compliant BOOLEAN DEFAULT true,

  -- Data retention metrics
  documents_at_retention_limit INTEGER DEFAULT 0,
  documents_past_retention_date INTEGER DEFAULT 0,
  compliant_deletions INTEGER DEFAULT 0,

  -- Access control metrics
  users_with_proper_permissions INTEGER DEFAULT 0,
  users_with_excessive_permissions INTEGER DEFAULT 0,

  -- Audit trail metrics
  audit_log_entries INTEGER DEFAULT 0,        -- Audit log entries created
  suspicious_activities INTEGER DEFAULT 0,    -- Potential security issues

  -- Compliance violations
  violations JSONB DEFAULT '[]',              -- Array of violations detected

  -- Last audit
  last_audit_date DATE,
  days_since_last_audit INTEGER DEFAULT 0,

  -- Audit
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(date, organization_id),
  CONSTRAINT fk_analytics_compliance_org
    FOREIGN KEY (organization_id)
    REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_analytics_compliance_daily_date
  ON analytics_compliance_daily(date DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_compliance_daily_org
  ON analytics_compliance_daily(organization_id, date DESC);

-- ============================================================================
-- MATERIALIZED VIEWS FOR FAST AGGREGATION
-- ============================================================================

-- Document metrics aggregation (last 90 days)
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_document_metrics_90d AS
SELECT
  organization_id,
  DATE_TRUNC('day', created_at)::DATE as date,
  COUNT(*) as total_documents,
  SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_documents,
  SUM(CASE WHEN status = 'archived' THEN 1 ELSE 0 END) as archived_documents,
  SUM(CASE WHEN status = 'deleted' THEN 1 ELSE 0 END) as deleted_documents,
  SUM(file_size) as total_size_bytes
FROM documents
WHERE created_at >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY organization_id, DATE_TRUNC('day', created_at)
ORDER BY organization_id, date DESC;

CREATE INDEX IF NOT EXISTS idx_mv_document_metrics_90d_org_date
  ON mv_document_metrics_90d(organization_id, date DESC);

-- Automation execution metrics (last 90 days)
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_automation_metrics_90d AS
SELECT
  organization_id,
  DATE_TRUNC('day', executed_at)::DATE as date,
  automation_rule_id,
  COUNT(*) as total_executions,
  SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as successful_executions,
  SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_executions,
  AVG(execution_time_ms) as avg_execution_time_ms,
  MAX(execution_time_ms) as max_execution_time_ms,
  MIN(execution_time_ms) as min_execution_time_ms
FROM automation_executions
WHERE executed_at >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY organization_id, DATE_TRUNC('day', executed_at), automation_rule_id
ORDER BY organization_id, date DESC;

CREATE INDEX IF NOT EXISTS idx_mv_automation_metrics_90d_org_date
  ON mv_automation_metrics_90d(organization_id, date DESC);

-- User activity metrics (last 30 days)
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_user_activity_30d AS
SELECT
  organization_id,
  DATE_TRUNC('day', created_at)::DATE as date,
  user_id,
  action_type,
  COUNT(*) as action_count
FROM audit_logs
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
  AND organization_id IS NOT NULL
GROUP BY organization_id, DATE_TRUNC('day', created_at), user_id, action_type
ORDER BY organization_id, date DESC, action_count DESC;

CREATE INDEX IF NOT EXISTS idx_mv_user_activity_30d_org_user_date
  ON mv_user_activity_30d(organization_id, user_id, date DESC);

-- ============================================================================
-- REFRESH SCHEDULE FOR MATERIALIZED VIEWS
-- ============================================================================

-- Create refresh function for materialized views
CREATE OR REPLACE FUNCTION refresh_analytics_views()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_document_metrics_90d;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_automation_metrics_90d;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_user_activity_30d;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Calculate document age distribution
CREATE OR REPLACE FUNCTION get_document_age_distribution(p_org_id UUID)
RETURNS TABLE (
  age_group TEXT,
  count INTEGER,
  percentage NUMERIC
) AS $$
DECLARE
  total_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_count
  FROM documents
  WHERE organization_id = p_org_id
    AND status != 'deleted';

  IF total_count = 0 THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    age_group,
    COUNT(*)::INTEGER as count,
    ROUND((COUNT(*)::NUMERIC / total_count) * 100, 2) as percentage
  FROM (
    SELECT
      CASE
        WHEN CURRENT_DATE - created_at::DATE <= 30 THEN '0-30 days'
        WHEN CURRENT_DATE - created_at::DATE <= 90 THEN '31-90 days'
        WHEN CURRENT_DATE - created_at::DATE <= 365 THEN '91-365 days'
        ELSE 'Over 1 year'
      END as age_group
    FROM documents
    WHERE organization_id = p_org_id
      AND status != 'deleted'
  ) age_groups
  GROUP BY age_group
  ORDER BY
    CASE age_group
      WHEN '0-30 days' THEN 1
      WHEN '31-90 days' THEN 2
      WHEN '91-365 days' THEN 3
      WHEN 'Over 1 year' THEN 4
    END;
END;
$$ LANGUAGE plpgsql;

-- Get top document types by count
CREATE OR REPLACE FUNCTION get_top_document_types(
  p_org_id UUID,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  file_type TEXT,
  count INTEGER,
  total_size_mb NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(file_extension, 'unknown'::TEXT) as file_type,
    COUNT(*)::INTEGER as count,
    ROUND(SUM(file_size)::NUMERIC / 1048576, 2) as total_size_mb
  FROM documents
  WHERE organization_id = p_org_id
    AND status != 'deleted'
  GROUP BY file_extension
  ORDER BY count DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Calculate automation ROI (hours saved)
CREATE OR REPLACE FUNCTION calculate_automation_roi(
  p_org_id UUID,
  p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
  metric_name TEXT,
  metric_value NUMERIC,
  metric_unit TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    'Documents Processed by Automation'::TEXT,
    COUNT(*)::NUMERIC,
    'documents'::TEXT
  FROM automation_executions
  WHERE organization_id = p_org_id
    AND executed_at >= CURRENT_TIMESTAMP - (p_days || ' days')::INTERVAL
    AND status = 'success'
  UNION ALL
  SELECT
    'Estimated Hours Saved'::TEXT,
    ROUND(COUNT(*)::NUMERIC * 0.5 / 60, 2),
    'hours'::TEXT
  FROM automation_executions
  WHERE organization_id = p_org_id
    AND executed_at >= CURRENT_TIMESTAMP - (p_days || ' days')::INTERVAL
    AND status = 'success'
  UNION ALL
  SELECT
    'Average Execution Time'::TEXT,
    ROUND(AVG(execution_time_ms)::NUMERIC, 0),
    'milliseconds'::TEXT
  FROM automation_executions
  WHERE organization_id = p_org_id
    AND executed_at >= CURRENT_TIMESTAMP - (p_days || ' days')::INTERVAL;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS FOR AUTO-UPDATE TIMESTAMPS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_analytics_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_analytics_document_daily_update
  BEFORE UPDATE ON analytics_document_daily
  FOR EACH ROW
  EXECUTE FUNCTION update_analytics_timestamp();

CREATE TRIGGER tr_analytics_automation_daily_update
  BEFORE UPDATE ON analytics_automation_daily
  FOR EACH ROW
  EXECUTE FUNCTION update_analytics_timestamp();

CREATE TRIGGER tr_analytics_team_daily_update
  BEFORE UPDATE ON analytics_team_daily
  FOR EACH ROW
  EXECUTE FUNCTION update_analytics_timestamp();

CREATE TRIGGER tr_analytics_queue_daily_update
  BEFORE UPDATE ON analytics_queue_daily
  FOR EACH ROW
  EXECUTE FUNCTION update_analytics_timestamp();

CREATE TRIGGER tr_analytics_compliance_daily_update
  BEFORE UPDATE ON analytics_compliance_daily
  FOR EACH ROW
  EXECUTE FUNCTION update_analytics_timestamp();

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE analytics_document_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_automation_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_team_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_queue_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_compliance_daily ENABLE ROW LEVEL SECURITY;

-- Users can only see analytics for their organization
CREATE POLICY rls_analytics_org_isolation
  ON analytics_document_daily
  FOR SELECT
  USING (organization_id = auth.uid());

CREATE POLICY rls_automation_org_isolation
  ON analytics_automation_daily
  FOR SELECT
  USING (organization_id = auth.uid());

CREATE POLICY rls_team_org_isolation
  ON analytics_team_daily
  FOR SELECT
  USING (organization_id = auth.uid());

CREATE POLICY rls_queue_org_isolation
  ON analytics_queue_daily
  FOR SELECT
  USING (organization_id = auth.uid());

CREATE POLICY rls_compliance_org_isolation
  ON analytics_compliance_daily
  FOR SELECT
  USING (organization_id = auth.uid());

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Created analytics tables for Phase 7 Advanced Analytics
-- Tables: 5 main tables + 3 materialized views + helper functions
-- Status: Ready for data collection and aggregation
