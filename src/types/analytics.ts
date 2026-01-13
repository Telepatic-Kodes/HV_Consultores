/**
 * Analytics Type Definitions
 * Phase 7: Advanced Analytics & Business Intelligence
 * Created: 2026-01-11
 */

// ============================================================================
// DOCUMENT ANALYTICS TYPES
// ============================================================================

export interface DocumentMetricsDaily {
  id: string;
  date: Date;
  organizationId: string;

  // Document counts
  totalDocuments: number;
  activeDocuments: number;
  archivedDocuments: number;
  deletedDocuments: number;

  // Document age metrics
  documents0To30Days: number;
  documents31To90Days: number;
  documents91To365Days: number;
  documentsOver1Year: number;

  // Upload metrics
  uploadCount: number;
  uploadVolumeMB: number;

  // Expiration
  expiringByDate: number;

  // Storage metrics
  storageUsedMB: number;
  storageUsedGB: number;

  // Document types
  documentTypes: Record<string, number>;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

export interface DocumentMetricsSummary {
  totalDocuments: number;
  activeDocuments: number;
  averageDocumentAge: number;
  storageUsedGB: number;
  uploadTrendLast7Days: Array<{
    date: Date;
    uploads: number;
  }>;
  documentsByType: Array<{
    type: string;
    count: number;
    percentage: number;
  }>;
  documentsByAge: Array<{
    ageGroup: string;
    count: number;
    percentage: number;
  }>;
  documentsByStatus: Array<{
    status: 'active' | 'archived' | 'deleted';
    count: number;
  }>;
}

// ============================================================================
// AUTOMATION ANALYTICS TYPES
// ============================================================================

export interface AutomationMetricsDaily {
  id: string;
  date: Date;
  organizationId: string;

  // Rule metrics
  totalRules: number;
  activeRules: number;
  disabledRules: number;

  // Execution metrics
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  skippedExecutions: number;

  // Success rate
  successRate: number; // 0-100

  // Performance
  averageExecutionTimeMs: number;
  minExecutionTimeMs: number;
  maxExecutionTimeMs: number;

  // Time saved
  hoursSaved: number;

  // Errors
  errorsByType: Record<string, number>;

  // Documents processed
  documentsProcessed: number;
  documentsArchived: number;
  documentsDeleted: number;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

export interface AutomationMetricsSummary {
  totalRules: number;
  activeRules: number;
  overallSuccessRate: number;
  averageExecutionTimeMs: number;
  hoursPerMonthSaved: number;
  topPerformingRules: Array<{
    ruleId: string;
    ruleName: string;
    executionCount: number;
    successRate: number;
  }>;
  worstPerformingRules: Array<{
    ruleId: string;
    ruleName: string;
    failureRate: number;
    lastError: string;
  }>;
  executionTrendLast7Days: Array<{
    date: Date;
    executions: number;
    successCount: number;
    failureCount: number;
  }>;
  errorTrendAnalysis: Array<{
    errorType: string;
    count: number;
    percentage: number;
  }>;
}

// ============================================================================
// TEAM ANALYTICS TYPES
// ============================================================================

export interface TeamMetricsDaily {
  id: string;
  date: Date;
  organizationId: string;

  // Team counts
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;

  // Activity metrics
  totalUserActions: number;
  documentUploads: number;
  documentDownloads: number;
  documentShares: number;
  automationRuleCreates: number;

  // Top performer
  topPerformerId?: string;
  topPerformerActions: number;

  // Time metrics
  peakActivityHour: number; // 0-23
  averageSessionDurationMin: number;

  // Collaboration
  collaborationScore: number; // 0-100
  sharedDocuments: number;
  teamComments: number;

  // Departments
  departmentsData: Record<string, number>;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

export interface TeamMetricsSummary {
  totalUsers: number;
  activeUsers: number;
  activityTrendLast7Days: Array<{
    date: Date;
    actions: number;
    activeUsers: number;
  }>;
  topPerformers: Array<{
    userId: string;
    userName: string;
    actionCount: number;
    department: string;
  }>;
  departmentBreakdown: Array<{
    department: string;
    userCount: number;
    activityScore: number;
  }>;
  collaborationMetrics: {
    averageCollaborationScore: number;
    sharedDocumentsLast30Days: number;
    totalComments: number;
  };
  peakActivityHour: number;
  averageSessionDuration: number;
}

// ============================================================================
// QUEUE ANALYTICS TYPES
// ============================================================================

export interface QueueMetricsDaily {
  id: string;
  date: Date;
  organizationId: string;

  // Queue status
  pendingJobs: number;
  processingJobs: number;
  completedJobs: number;
  failedJobs: number;

  // Processing metrics
  jobsCompletedToday: number;
  jobsFailedToday: number;
  jobSuccessRate: number; // 0-100

  // Latency metrics (ms)
  avgLatencyMs: number;
  p50LatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
  maxLatencyMs: number;

  // Job type breakdown
  emailJobs: number;
  webhookJobs: number;
  archiveJobs: number;
  deleteJobs: number;
  notificationJobs: number;
  reportJobs: number;

  // External service health
  externalServicesHealth: Record<string, 'healthy' | 'degraded' | 'down'>;

  // System metrics
  systemCpuUsage: number; // 0-100
  systemMemoryUsage: number; // 0-100
  databaseConnections: number;

  // Capacity
  queueDepth: number;
  hourlyThroughput: number;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

export interface QueueMetricsSummary {
  currentQueueDepth: number;
  overallSuccessRate: number;
  averageLatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
  jobsPerHour: number;
  externalServiceStatus: Array<{
    serviceName: string;
    status: 'healthy' | 'degraded' | 'down';
    lastChecked: Date;
  }>;
  latencyTrendLast7Days: Array<{
    date: Date;
    avgLatencyMs: number;
    p95LatencyMs: number;
    jobsThroughput: number;
  }>;
  jobTypeDistribution: Array<{
    jobType: string;
    count: number;
    successRate: number;
  }>;
  systemHealth: {
    cpuUsage: number;
    memoryUsage: number;
    databaseConnections: number;
  };
}

// ============================================================================
// COMPLIANCE ANALYTICS TYPES
// ============================================================================

export interface ComplianceMetricsDaily {
  id: string;
  date: Date;
  organizationId: string;

  // Compliance status
  gdprCompliant: boolean;
  hipaaCompliant: boolean;
  soc2Compliant: boolean;
  iso27001Compliant: boolean;

  // Data retention
  documentsAtRetentionLimit: number;
  documentsPastRetentionDate: number;
  compliantDeletions: number;

  // Access control
  usersWithProperPermissions: number;
  usersWithExcessivePermissions: number;

  // Audit
  auditLogEntries: number;
  suspiciousActivities: number;

  // Violations
  violations: Array<{
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    detectedAt: Date;
  }>;

  // Last audit
  lastAuditDate?: Date;
  daysSinceLastAudit: number;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

export interface ComplianceMetricsSummary {
  overallComplianceStatus: 'compliant' | 'warning' | 'non-compliant';
  complianceByFramework: Array<{
    framework: 'GDPR' | 'HIPAA' | 'SOC2' | 'ISO27001';
    compliant: boolean;
    lastValidated: Date;
    itemsInViolation: number;
  }>;
  violations: Array<{
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    count: number;
    lastOccurrence: Date;
  }>;
  dataRetention: {
    totalDocuments: number;
    documentsExpiring: number;
    documentsPastRetentionDate: number;
    complianceTrend: Array<{
      date: Date;
      compliant: boolean;
    }>;
  };
  accessControl: {
    usersWithProperPermissions: number;
    usersWithExcessivePermissions: number;
    permissionAuditDate: Date;
  };
}

// ============================================================================
// GENERAL ANALYTICS TYPES
// ============================================================================

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface AnalyticsFilter {
  organizationId: string;
  dateRange: DateRange;
  groupBy?: 'day' | 'week' | 'month';
  limit?: number;
  offset?: number;
}

export interface TimeSeriesDataPoint {
  date: Date;
  value: number;
  label?: string;
}

export interface ChartDataset {
  label: string;
  data: number[];
  backgroundColor?: string;
  borderColor?: string;
  fill?: boolean;
}

export interface ChartConfig {
  labels: string[];
  datasets: ChartDataset[];
  title?: string;
  type: 'line' | 'bar' | 'pie' | 'area' | 'scatter';
  options?: Record<string, any>;
}

export interface MetricCard {
  title: string;
  value: number | string;
  unit?: string;
  trend?: {
    direction: 'up' | 'down' | 'stable';
    percentageChange: number;
    period: string;
  };
  icon?: string;
  color?: 'primary' | 'success' | 'warning' | 'danger';
}

export interface DashboardSummary {
  title: string;
  description: string;
  lastUpdated: Date;
  metrics: MetricCard[];
  charts: ChartConfig[];
  alerts?: Array<{
    severity: 'info' | 'warning' | 'error';
    message: string;
    action?: string;
  }>;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface AnalyticsApiResponse<T> {
  success: boolean;
  data: T;
  timestamp: Date;
  totalCount?: number;
  pageInfo?: {
    hasMore: boolean;
    offset: number;
    limit: number;
  };
}

export interface AnalyticsError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

// ============================================================================
// EXPORT TYPES
// ============================================================================

export interface ReportExportOptions {
  format: 'pdf' | 'excel' | 'csv' | 'json';
  includeCharts: boolean;
  includeSummary: boolean;
  dateRange: DateRange;
}

export interface ExportResult {
  filename: string;
  format: string;
  size: number;
  generatedAt: Date;
  expiresAt: Date;
  downloadUrl: string;
}
