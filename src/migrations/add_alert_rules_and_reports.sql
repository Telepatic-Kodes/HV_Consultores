-- Phase 7 Week 3: Alert Rules & Report Scheduling
-- Database Schema for Alert Rules, Report Schedules, and Execution History
-- Created: 2026-01-11
-- Purpose: Create tables for alert rule management, report scheduling, and execution tracking

-- ============================================================================
-- ALERT RULES TABLE
-- ============================================================================
-- Stores user-defined alert rules with conditions, thresholds, and notification actions
CREATE TABLE IF NOT EXISTS alert_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,

  -- Rule identification
  name TEXT NOT NULL,
  description TEXT,
  enabled BOOLEAN DEFAULT true,

  -- Condition configuration (JSON for flexibility)
  condition JSONB NOT NULL,
  -- Structure: {
  --   "metric": "queueDepth|errorRate|latency|cpuUsage|complianceScore",
  --   "operator": ">|<|=|>=|<=",
  --   "threshold": 500,
  --   "duration": 5  -- Minutes the condition must be met to trigger
  -- }

  -- Notification actions (multiple channels)
  actions JSONB NOT NULL,
  -- Structure: {
  --   "email": ["admin@example.com"],
  --   "slack": "https://hooks.slack.com/services/...",
  --   "inApp": true,
  --   "webhook": "https://api.example.com/alerts"
  -- }

  -- Notification frequency (prevent alert fatigue)
  notify_frequency VARCHAR(20) DEFAULT 'immediate',  -- immediate|once_per_hour|once_per_day
  last_triggered_at TIMESTAMP,
  last_notified_at TIMESTAMP,

  -- Tracking
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  CONSTRAINT fk_alert_rules_org
    FOREIGN KEY (organization_id)
    REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT ck_alert_rules_enabled
    CHECK (enabled IN (true, false))
);

CREATE INDEX IF NOT EXISTS idx_alert_rules_org
  ON alert_rules(organization_id);
CREATE INDEX IF NOT EXISTS idx_alert_rules_org_enabled
  ON alert_rules(organization_id, enabled);
CREATE INDEX IF NOT EXISTS idx_alert_rules_created_at
  ON alert_rules(created_at DESC);

-- ============================================================================
-- ALERT EXECUTION HISTORY TABLE
-- ============================================================================
-- Tracks when alert rules are triggered and notifications are sent
CREATE TABLE IF NOT EXISTS alert_execution_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  alert_rule_id UUID NOT NULL,

  -- Trigger details
  triggered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  metric_name TEXT NOT NULL,
  metric_value NUMERIC(10, 2),
  threshold_value NUMERIC(10, 2),
  condition_met BOOLEAN DEFAULT true,

  -- Alert state
  status VARCHAR(20) DEFAULT 'triggered',  -- triggered|notifying|notified|failed
  duration_met BOOLEAN,  -- Whether duration requirement was satisfied

  -- Notification tracking
  notifications_sent INTEGER DEFAULT 0,
  notification_details JSONB,
  -- Structure: {
  --   "email": {"status": "sent", "recipients": 2},
  --   "slack": {"status": "sent"},
  --   "webhook": {"status": "failed", "error": "timeout"}
  -- }

  -- Error tracking
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,

  -- Audit
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_alert_exec_org
    FOREIGN KEY (organization_id)
    REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT fk_alert_exec_rule
    FOREIGN KEY (alert_rule_id)
    REFERENCES alert_rules(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_alert_execution_org
  ON alert_execution_history(organization_id);
CREATE INDEX IF NOT EXISTS idx_alert_execution_rule
  ON alert_execution_history(alert_rule_id);
CREATE INDEX IF NOT EXISTS idx_alert_execution_triggered_at
  ON alert_execution_history(triggered_at DESC);
CREATE INDEX IF NOT EXISTS idx_alert_execution_status
  ON alert_execution_history(status);
CREATE INDEX IF NOT EXISTS idx_alert_execution_org_rule_time
  ON alert_execution_history(organization_id, alert_rule_id, triggered_at DESC);

-- ============================================================================
-- REPORT SCHEDULES TABLE
-- ============================================================================
-- Stores scheduled report generation and delivery configurations
CREATE TABLE IF NOT EXISTS report_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,

  -- Schedule identification
  name TEXT NOT NULL,
  description TEXT,
  enabled BOOLEAN DEFAULT true,

  -- Schedule frequency
  schedule_type VARCHAR(20) NOT NULL,  -- daily|weekly|monthly
  schedule_config JSONB NOT NULL,
  -- Structure: {
  --   "time": "08:00",
  --   "dayOfWeek": 1,  -- 0-6 for weekly (0=Sunday)
  --   "dayOfMonth": 1  -- 1-31 for monthly
  -- }

  -- Dashboard selection
  dashboards JSONB NOT NULL,
  -- Structure: ["documents", "automation", "team", "queue", "compliance"]

  -- Report format and options
  format VARCHAR(20) NOT NULL,  -- pdf|excel|html
  include_charts BOOLEAN DEFAULT true,
  include_data_table BOOLEAN DEFAULT true,

  -- Recipients
  recipients JSONB NOT NULL,
  -- Structure: {
  --   "email": ["user@example.com"],
  --   "slack": "https://hooks.slack.com/services/...",
  --   "webhook": "https://api.example.com/reports"
  -- }

  -- Notification frequency (when to repeat delivery)
  delivery_frequency VARCHAR(20) DEFAULT 'per_schedule',  -- per_schedule|also_email|also_slack

  -- Tracking
  last_generated_at TIMESTAMP,
  last_sent_at TIMESTAMP,
  next_scheduled_at TIMESTAMP,

  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  CONSTRAINT fk_report_schedules_org
    FOREIGN KEY (organization_id)
    REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT ck_report_format
    CHECK (format IN ('pdf', 'excel', 'html')),
  CONSTRAINT ck_report_type
    CHECK (schedule_type IN ('daily', 'weekly', 'monthly'))
);

CREATE INDEX IF NOT EXISTS idx_report_schedules_org
  ON report_schedules(organization_id);
CREATE INDEX IF NOT EXISTS idx_report_schedules_org_enabled
  ON report_schedules(organization_id, enabled);
CREATE INDEX IF NOT EXISTS idx_report_schedules_next_scheduled
  ON report_schedules(next_scheduled_at) WHERE enabled = true;
CREATE INDEX IF NOT EXISTS idx_report_schedules_created_at
  ON report_schedules(created_at DESC);

-- ============================================================================
-- REPORT DELIVERY HISTORY TABLE
-- ============================================================================
-- Tracks report generation and delivery for audit and troubleshooting
CREATE TABLE IF NOT EXISTS report_delivery_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  report_schedule_id UUID NOT NULL,

  -- Report generation
  generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  generation_time_ms INTEGER,
  file_size_bytes BIGINT,
  file_storage_path TEXT,

  -- Report metrics included
  metrics JSONB,
  -- Structure: {
  --   "documents": {...},
  --   "automation": {...},
  --   "team": {...},
  --   "queue": {...},
  --   "compliance": {...}
  -- }

  -- Delivery tracking
  status VARCHAR(20) DEFAULT 'generated',  -- generated|delivering|delivered|failed|partial
  delivery_start_at TIMESTAMP,
  delivery_end_at TIMESTAMP,

  -- Delivery details per channel
  delivery_details JSONB,
  -- Structure: {
  --   "email": {
  --     "status": "delivered",
  --     "recipients": 3,
  --     "failed_recipients": []
  --   },
  --   "slack": {
  --     "status": "delivered",
  --     "message_ts": "1234567890.123456"
  --   },
  --   "webhook": {
  --     "status": "failed",
  --     "error": "connection timeout"
  --   }
  -- }

  -- Success tracking
  successful_deliveries INTEGER DEFAULT 0,
  failed_deliveries INTEGER DEFAULT 0,
  total_recipients INTEGER DEFAULT 0,

  -- Error tracking
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,

  -- Audit
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_report_delivery_org
    FOREIGN KEY (organization_id)
    REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT fk_report_delivery_schedule
    FOREIGN KEY (report_schedule_id)
    REFERENCES report_schedules(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_report_delivery_org
  ON report_delivery_history(organization_id);
CREATE INDEX IF NOT EXISTS idx_report_delivery_schedule
  ON report_delivery_history(report_schedule_id);
CREATE INDEX IF NOT EXISTS idx_report_delivery_generated_at
  ON report_delivery_history(generated_at DESC);
CREATE INDEX IF NOT EXISTS idx_report_delivery_status
  ON report_delivery_history(status);
CREATE INDEX IF NOT EXISTS idx_report_delivery_org_schedule_time
  ON report_delivery_history(organization_id, report_schedule_id, generated_at DESC);

-- ============================================================================
-- COMPLIANCE VIOLATIONS TABLE
-- ============================================================================
-- Tracks detected compliance violations and remediation status
CREATE TABLE IF NOT EXISTS compliance_violations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,

  -- Violation details
  violation_type TEXT NOT NULL,  -- access_control|data_encryption|retention|audit_trail|etc
  framework TEXT NOT NULL,  -- GDPR|HIPAA|SOC2|ISO27001
  severity VARCHAR(20) NOT NULL,  -- critical|high|medium|low

  -- Description
  title TEXT NOT NULL,
  description TEXT,
  affected_resources JSONB,  -- Array of affected resource IDs

  -- Detection and remediation
  detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  remediated_at TIMESTAMP,
  status VARCHAR(20) DEFAULT 'open',  -- open|investigating|remediated|waived

  -- Remediation details
  remediation_plan TEXT,
  remediation_owner UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  remediation_deadline DATE,

  -- Audit
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_compliance_violations_org
    FOREIGN KEY (organization_id)
    REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT ck_violation_status
    CHECK (status IN ('open', 'investigating', 'remediated', 'waived'))
);

CREATE INDEX IF NOT EXISTS idx_compliance_violations_org
  ON compliance_violations(organization_id);
CREATE INDEX IF NOT EXISTS idx_compliance_violations_framework
  ON compliance_violations(organization_id, framework);
CREATE INDEX IF NOT EXISTS idx_compliance_violations_status
  ON compliance_violations(status);
CREATE INDEX IF NOT EXISTS idx_compliance_violations_severity
  ON compliance_violations(severity);
CREATE INDEX IF NOT EXISTS idx_compliance_violations_detected_at
  ON compliance_violations(detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_compliance_violations_deadline
  ON compliance_violations(remediation_deadline) WHERE status = 'open';

-- ============================================================================
-- UPDATE TIMESTAMP TRIGGERS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_alert_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_alert_rules_update
  BEFORE UPDATE ON alert_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_alert_timestamp();

CREATE TRIGGER tr_alert_execution_history_update
  BEFORE UPDATE ON alert_execution_history
  FOR EACH ROW
  EXECUTE FUNCTION update_alert_timestamp();

CREATE TRIGGER tr_report_schedules_update
  BEFORE UPDATE ON report_schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_alert_timestamp();

CREATE TRIGGER tr_report_delivery_history_update
  BEFORE UPDATE ON report_delivery_history
  FOR EACH ROW
  EXECUTE FUNCTION update_alert_timestamp();

CREATE TRIGGER tr_compliance_violations_update
  BEFORE UPDATE ON compliance_violations
  FOR EACH ROW
  EXECUTE FUNCTION update_alert_timestamp();

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS on all new tables
ALTER TABLE alert_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_execution_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_delivery_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_violations ENABLE ROW LEVEL SECURITY;

-- Alert Rules: Users can only see their organization's rules
CREATE POLICY rls_alert_rules_org_isolation
  ON alert_rules
  FOR ALL
  USING (organization_id = auth.uid())
  WITH CHECK (organization_id = auth.uid());

-- Alert Execution History: Users can only see their organization's history
CREATE POLICY rls_alert_execution_org_isolation
  ON alert_execution_history
  FOR SELECT
  USING (organization_id = auth.uid());

-- Report Schedules: Users can only see their organization's schedules
CREATE POLICY rls_report_schedules_org_isolation
  ON report_schedules
  FOR ALL
  USING (organization_id = auth.uid())
  WITH CHECK (organization_id = auth.uid());

-- Report Delivery History: Users can only see their organization's history
CREATE POLICY rls_report_delivery_org_isolation
  ON report_delivery_history
  FOR SELECT
  USING (organization_id = auth.uid());

-- Compliance Violations: Users can only see their organization's violations
CREATE POLICY rls_compliance_violations_org_isolation
  ON compliance_violations
  FOR ALL
  USING (organization_id = auth.uid())
  WITH CHECK (organization_id = auth.uid());

-- ============================================================================
-- HELPER FUNCTIONS FOR ALERT MANAGEMENT
-- ============================================================================

-- Get all active alert rules for an organization
CREATE OR REPLACE FUNCTION get_active_alert_rules(p_org_id UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  metric_name TEXT,
  threshold_value NUMERIC,
  is_triggered BOOLEAN,
  last_triggered_at TIMESTAMP
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ar.id,
    ar.name,
    ar.condition->>'metric',
    (ar.condition->>'threshold')::NUMERIC,
    (ar.last_triggered_at IS NOT NULL)::BOOLEAN,
    ar.last_triggered_at
  FROM alert_rules ar
  WHERE ar.organization_id = p_org_id
    AND ar.enabled = true
  ORDER BY ar.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Get recent alert triggers for an organization (last 24 hours)
CREATE OR REPLACE FUNCTION get_recent_alerts(
  p_org_id UUID,
  p_hours INTEGER DEFAULT 24
)
RETURNS TABLE (
  alert_name TEXT,
  metric_name TEXT,
  metric_value NUMERIC,
  triggered_at TIMESTAMP,
  times_triggered INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ar.name,
    aeh.metric_name,
    aeh.metric_value,
    aeh.triggered_at,
    COUNT(*)::INTEGER
  FROM alert_execution_history aeh
  JOIN alert_rules ar ON ar.id = aeh.alert_rule_id
  WHERE aeh.organization_id = p_org_id
    AND aeh.triggered_at >= CURRENT_TIMESTAMP - (p_hours || ' hours')::INTERVAL
  GROUP BY ar.name, aeh.metric_name, aeh.metric_value, aeh.triggered_at
  ORDER BY aeh.triggered_at DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- HELPER FUNCTIONS FOR REPORT MANAGEMENT
-- ============================================================================

-- Get all scheduled reports due in next N hours
CREATE OR REPLACE FUNCTION get_due_report_schedules(p_hours INTEGER DEFAULT 1)
RETURNS TABLE (
  id UUID,
  name TEXT,
  schedule_type TEXT,
  next_scheduled_at TIMESTAMP,
  dashboards TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    rs.id,
    rs.name,
    rs.schedule_type,
    rs.next_scheduled_at,
    (rs.dashboards->'dashboards')::TEXT[] -- Extract dashboard array
  FROM report_schedules rs
  WHERE rs.enabled = true
    AND rs.next_scheduled_at IS NOT NULL
    AND rs.next_scheduled_at <= CURRENT_TIMESTAMP + (p_hours || ' hours')::INTERVAL
    AND rs.next_scheduled_at > CURRENT_TIMESTAMP
  ORDER BY rs.next_scheduled_at ASC;
END;
$$ LANGUAGE plpgsql;

-- Get report delivery summary
CREATE OR REPLACE FUNCTION get_report_delivery_summary(p_org_id UUID)
RETURNS TABLE (
  total_reports_generated INTEGER,
  successfully_delivered INTEGER,
  failed_deliveries INTEGER,
  partial_deliveries INTEGER,
  avg_generation_time_ms INTEGER,
  last_generated_at TIMESTAMP
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::INTEGER,
    SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END)::INTEGER,
    SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END)::INTEGER,
    SUM(CASE WHEN status = 'partial' THEN 1 ELSE 0 END)::INTEGER,
    ROUND(AVG(generation_time_ms))::INTEGER,
    MAX(generated_at)
  FROM report_delivery_history
  WHERE organization_id = p_org_id
    AND generated_at >= CURRENT_TIMESTAMP - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Created tables:
--   1. alert_rules - Alert rule definitions
--   2. alert_execution_history - Alert trigger history
--   3. report_schedules - Report schedule definitions
--   4. report_delivery_history - Report generation and delivery history
--   5. compliance_violations - Compliance issue tracking
--
-- Features:
--   - Full RLS enforcement for organization isolation
--   - JSON columns for flexible configuration storage
--   - Comprehensive indexes for query performance
--   - Auto-update timestamps via triggers
--   - Helper functions for common operations
--
-- Status: Ready for Phase 7 Week 3 implementation
