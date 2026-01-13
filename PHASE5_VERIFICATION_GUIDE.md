# Phase 5: Compliance & Reporting - Verification & Testing Guide

**Document Version**: 1.0
**Date**: 2026-01-11
**Status**: Complete Testing Guide

---

## Table of Contents

1. [Pre-Deployment Verification](#pre-deployment-verification)
2. [Database Verification](#database-verification)
3. [Server Actions Verification](#server-actions-verification)
4. [UI/Dashboard Verification](#uidashboard-verification)
5. [Integration Verification](#integration-verification)
6. [Security Verification](#security-verification)
7. [Performance Testing](#performance-testing)
8. [End-to-End Workflows](#end-to-end-workflows)
9. [Troubleshooting](#troubleshooting)
10. [Sign-Off Checklist](#sign-off-checklist)

---

## Pre-Deployment Verification

### 1. Code Files Present

Verify all required files exist:

```bash
# Database migration
✓ src/migrations/add_compliance_reporting.sql (700 lines)

# Server actions
✓ src/app/dashboard/documentos/compliance-actions.ts (600 lines)

# UI pages
✓ src/app/dashboard/documentos/compliance/page.tsx (500 lines)

# Navigation updates
✓ src/app/dashboard/documentos/page.tsx (updated with Compliance button)

# Documentation
✓ docs/PHASE5_COMPLIANCE.md
✓ PHASE5_DELIVERY_SUMMARY.txt
✓ COMPLETE_PROJECT_DELIVERY.md (updated)
```

**Action Items:**
- [ ] Verify all files exist in repository
- [ ] Verify file sizes are reasonable
- [ ] Check for any merge conflicts in git

### 2. Environment Configuration

Verify required environment variables:

```bash
# Required variables (should already exist from previous phases)
SUPABASE_URL=your_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Optional: Email configuration (for report distribution)
SMTP_HOST=your_smtp_host
SMTP_PORT=587
SMTP_USER=your_email
SMTP_PASSWORD=your_password
SMTP_FROM=noreply@company.com
```

**Action Items:**
- [ ] Verify all SUPABASE variables are set
- [ ] Test connection to Supabase
- [ ] Check SMTP configuration (if using email reports)

### 3. Dependencies Check

Verify required npm packages:

```bash
npm list @supabase/supabase-js
npm list recharts
npm list next
npm list react
npm list typescript
```

Expected versions:
- `@supabase/supabase-js`: ^2.38.0+
- `recharts`: ^2.10+
- `next`: ^14.0+
- `react`: ^18.0+
- `typescript`: ^5.0+

**Action Items:**
- [ ] Run `npm list` to verify all packages
- [ ] Run `npm install` if any packages missing
- [ ] Check for security vulnerabilities with `npm audit`

---

## Database Verification

### 1. Migration Execution

Verify migration was applied successfully:

```sql
-- Check all 7 new tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
  'audit_logs_extended',
  'document_retention_policies',
  'document_lifecycle',
  'compliance_reports',
  'report_schedules',
  'compliance_checklists',
  'data_governance'
)
ORDER BY table_name;

-- Expected: 7 rows returned
```

**Action Items:**
- [ ] Execute table existence check
- [ ] Verify 7 rows returned
- [ ] Check column counts match expected schema

### 2. Table Structure Verification

Verify each table has correct columns:

```sql
-- Verify audit_logs_extended columns (20 expected)
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'audit_logs_extended'
ORDER BY ordinal_position;

-- Should include:
-- id, cliente_id, usuario_id, tabla, accion, registro_id
-- datos_anteriores, datos_nuevos, ip_address, user_agent
-- navegador, dispositivo, ubicacion, requiere_justificacion
-- justificacion, requiere_confirmacion, confirmacion_enviada_en
-- confirmacion_completada_en, creado_en, actualizado_en

-- Verify document_retention_policies columns (12 expected)
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'document_retention_policies'
ORDER BY ordinal_position;

-- Verify document_lifecycle columns (15 expected)
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'document_lifecycle'
ORDER BY ordinal_position;

-- Verify compliance_reports columns (21 expected)
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'compliance_reports'
ORDER BY ordinal_position;

-- Verify report_schedules columns (19 expected)
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'report_schedules'
ORDER BY ordinal_position;

-- Verify compliance_checklists columns (11 expected)
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'compliance_checklists'
ORDER BY ordinal_position;

-- Verify data_governance columns (15 expected)
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'data_governance'
ORDER BY ordinal_position;
```

**Action Items:**
- [ ] Check audit_logs_extended (20 columns)
- [ ] Check document_retention_policies (12 columns)
- [ ] Check document_lifecycle (15 columns)
- [ ] Check compliance_reports (21 columns)
- [ ] Check report_schedules (19 columns)
- [ ] Check compliance_checklists (11 columns)
- [ ] Check data_governance (15 columns)

### 3. Index Verification

Verify all indexes were created:

```sql
-- Check audit_logs_extended indexes (5 expected)
SELECT indexname
FROM pg_indexes
WHERE tablename = 'audit_logs_extended'
ORDER BY indexname;

-- Should include:
-- idx_audit_logs_cliente
-- idx_audit_logs_usuario
-- idx_audit_logs_tabla
-- idx_audit_logs_accion
-- idx_audit_logs_fecha

-- Check document_retention_policies indexes (3 expected)
SELECT indexname
FROM pg_indexes
WHERE tablename = 'document_retention_policies'
ORDER BY indexname;

-- Check document_lifecycle indexes (3 expected)
SELECT indexname
FROM pg_indexes
WHERE tablename = 'document_lifecycle'
ORDER BY indexname;

-- Check compliance_reports indexes (4 expected)
SELECT indexname
FROM pg_indexes
WHERE tablename = 'compliance_reports'
ORDER BY indexname;

-- Check report_schedules indexes (3 expected)
SELECT indexname
FROM pg_indexes
WHERE tablename = 'report_schedules'
ORDER BY indexname;

-- Check compliance_checklists indexes (3 expected)
SELECT indexname
FROM pg_indexes
WHERE tablename = 'compliance_checklists'
ORDER BY indexname;

-- Check data_governance indexes (1 expected)
SELECT indexname
FROM pg_indexes
WHERE tablename = 'data_governance'
ORDER BY indexname;
```

**Expected Total Indexes**: 18 across 7 tables

**Action Items:**
- [ ] Verify all 18 indexes created
- [ ] Check index size with `SELECT pg_size_pretty(pg_relation_size('idx_name'));`
- [ ] Test index usage with EXPLAIN queries

### 4. Function Verification

Verify database functions:

```sql
-- Check verificar_documentos_vencidos function
SELECT routine_name
FROM information_schema.routines
WHERE routine_name = 'verificar_documentos_vencidos'
AND routine_schema = 'public';

-- Should return 1 row

-- Check obtener_resumen_cumplimiento function
SELECT routine_name
FROM information_schema.routines
WHERE routine_name = 'obtener_resumen_cumplimiento'
AND routine_schema = 'public';

-- Should return 1 row

-- Test verificar_documentos_vencidos
SELECT * FROM verificar_documentos_vencidos('550e8400-e29b-41d4-a716-446655440000'::uuid);
-- Should return no errors

-- Test obtener_resumen_cumplimiento
SELECT * FROM obtener_resumen_cumplimiento(
  '550e8400-e29b-41d4-a716-446655440000'::uuid,
  '2026-01-01'::date,
  '2026-12-31'::date
);
-- Should return compliance summary
```

**Action Items:**
- [ ] Verify both functions exist
- [ ] Execute test function calls
- [ ] Check function definitions are correct

### 5. RLS Policies Verification

Verify Row-Level Security policies:

```sql
-- Check all RLS policies (8 expected)
SELECT
  tablename,
  policyname,
  permissive
FROM pg_policies
WHERE tablename IN (
  'audit_logs_extended',
  'document_retention_policies',
  'document_lifecycle',
  'compliance_reports',
  'report_schedules',
  'compliance_checklists',
  'data_governance'
)
ORDER BY tablename, policyname;

-- Expected: 8 policies across 7 tables

-- Verify RLS is enabled on all tables
SELECT tablename
FROM pg_tables
WHERE tablename IN (
  'audit_logs_extended',
  'document_retention_policies',
  'document_lifecycle',
  'compliance_reports',
  'report_schedules',
  'compliance_checklists',
  'data_governance'
)
AND rowsecurity = true
ORDER BY tablename;

-- Should return all 7 table names
```

**Action Items:**
- [ ] Verify 8 RLS policies created
- [ ] Verify RLS enabled on all 7 tables
- [ ] Test policy enforcement (see Security Verification section)

### 6. Trigger Verification

Verify automatic triggers:

```sql
-- Check all triggers (3 expected)
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE event_object_schema = 'public'
AND trigger_name LIKE 'trigger_actualizar_timestamp%'
ORDER BY event_object_table;

-- Should return:
-- trigger_actualizar_timestamp_audit (audit_logs_extended)
-- trigger_actualizar_timestamp_compliance (compliance_reports)
-- trigger_actualizar_timestamp_schedules (report_schedules)
```

**Action Items:**
- [ ] Verify 3 triggers created
- [ ] Test trigger functionality (update timestamp on insert)

### 7. Constraints Verification

Verify unique and foreign key constraints:

```sql
-- Check unique constraints
SELECT constraint_name, table_name
FROM information_schema.table_constraints
WHERE constraint_type = 'UNIQUE'
AND table_name IN (
  'audit_logs_extended',
  'document_retention_policies',
  'document_lifecycle',
  'compliance_reports',
  'report_schedules',
  'compliance_checklists',
  'data_governance'
)
ORDER BY table_name;

-- Check foreign key constraints
SELECT constraint_name, table_name
FROM information_schema.table_constraints
WHERE constraint_type = 'FOREIGN KEY'
AND table_name IN (
  'audit_logs_extended',
  'document_retention_policies',
  'document_lifecycle',
  'compliance_reports',
  'report_schedules',
  'compliance_checklists',
  'data_governance'
)
ORDER BY table_name;
```

**Action Items:**
- [ ] Verify unique constraints on appropriate columns
- [ ] Verify foreign key references to clientes and auth.users

---

## Server Actions Verification

### 1. File Structure Check

Verify `compliance-actions.ts` has all required functions:

```typescript
// Expected functions (20+)

// Retention Policies
✓ obtenerPoliticasRetencion
✓ crearPoliticaRetencion
✓ actualizarPoliticaRetencion

// Compliance Reports
✓ obtenerReportesComplianza
✓ crearReporteComplianza
✓ aprobarReporteComplianza
✓ distribuirReporteComplianza

// Report Schedules
✓ obtenerProgramasReportes
✓ crearProgramaReporte
✓ alternarProgramaReporte

// Compliance Checklists
✓ obtenerListasVerificacion
✓ crearListaVerificacion
✓ actualizarElementoListaVerificacion

// Audit & Summary
✓ obtenerRegistrosAuditoria
✓ obtenerResumenAuditoria
✓ obtenerResumenComplianza
✓ obtenerDocumentosVencidos
```

**Action Items:**
- [ ] Verify file exists at correct path
- [ ] Check all 20+ functions are defined
- [ ] Verify 'use server' directive at top
- [ ] Check all imports are correct

### 2. Type Safety Check

Verify TypeScript compilation:

```bash
# Run TypeScript compiler
npx tsc --noEmit

# Should complete without errors
# Expected output: no errors found
```

**Action Items:**
- [ ] Run TypeScript compilation
- [ ] Fix any type errors
- [ ] Verify strict mode enabled

### 3. Function Execution Test

Test each server action works:

```typescript
// Test obtenerPoliticasRetencion
const policies = await obtenerPoliticasRetencion(testClientId);
// Expected: array of retention policies

// Test crearPoliticaRetencion
const newPolicy = await crearPoliticaRetencion(testClientId, {
  nombre: 'Test Policy',
  tipo_documento: 'factura',
  anos_retener: 7,
  accion_vencimiento: 'ARCHIVE'
});
// Expected: { id: 'policy-id' }

// Test obtenerResumenComplianza
const summary = await obtenerResumenComplianza(
  testClientId,
  '2026-01-01',
  '2026-12-31'
);
// Expected: compliance summary object

// Test obtenerDocumentosVencidos
const expired = await obtenerDocumentosVencidos(testClientId);
// Expected: array of expiring documents
```

**Action Items:**
- [ ] Test 5+ core server actions
- [ ] Verify return types match expected
- [ ] Check error handling works
- [ ] Verify authentication checks

### 4. Error Handling Test

Verify error handling:

```typescript
// Test with invalid client ID
try {
  await obtenerPoliticasRetencion('invalid-uuid');
  // Should throw error
} catch (error) {
  // Expected: error caught
}

// Test with unauthorized user
// (using token from different client)
try {
  await crearPoliticaRetencion('other-client-id', {...});
  // Should throw error
} catch (error) {
  // Expected: unauthorized error
}

// Test with missing required fields
try {
  await crearPoliticaRetencion(testClientId, {
    nombre: 'Test'
    // Missing other required fields
  });
  // Should throw validation error
} catch (error) {
  // Expected: validation error
}
```

**Action Items:**
- [ ] Test invalid inputs
- [ ] Test unauthorized access
- [ ] Test missing required fields
- [ ] Verify error messages are clear

---

## UI/Dashboard Verification

### 1. Page Load Test

```bash
# Start development server
npm run dev

# Navigate to compliance dashboard
# URL: /dashboard/documentos/compliance?cliente_id={clienteId}

# Expected:
# ✓ Page loads without errors
# ✓ 5 tabs visible (Overview, Retention, Audit, Reports, Checklists)
# ✓ Summary cards displayed with data
# ✓ No console errors
```

**Action Items:**
- [ ] Load page successfully
- [ ] Check browser console for errors
- [ ] Verify page responds to user interactions
- [ ] Test on different browsers

### 2. Tab Navigation Test

Test each tab:

```typescript
// Overview Tab
✓ Compliance score card visible
✓ Expired documents alert displayed
✓ Critical findings count shown
✓ Pending actions summary displayed
✓ Incomplete checklists listed

// Retention Tab
✓ Retention policies list loaded
✓ Policy details visible (type, duration, action)
✓ Active/inactive status shown
✓ Create new policy button works
✓ Edit/delete actions available

// Audit Tab
✓ Audit summary loaded (30-day)
✓ Action breakdown displayed
✓ User activity summary shown
✓ Recent audit logs table loaded
✓ Critical action highlighting visible

// Reports Tab
✓ Compliance reports list loaded
✓ Report status tracking visible
✓ Scheduled reports list shown
✓ Next execution dates displayed
✓ Create new report button works

// Checklists Tab
✓ Compliance checklists loaded
✓ Progress tracking visible
✓ Item completion interface works
✓ Type categorization displayed
```

**Action Items:**
- [ ] Test each tab loads correctly
- [ ] Verify data displayed matches database
- [ ] Check all interactive elements work
- [ ] Test tab switching speed

### 3. Data Display Test

Verify data rendering:

```bash
# Insert test data
INSERT INTO document_retention_policies
VALUES (...)

# Navigate to Retention tab
# Expected: test data visible in list

# Insert test audit log
INSERT INTO audit_logs_extended
VALUES (...)

# Navigate to Audit tab
# Expected: test audit log visible in recent logs

# Verify sorting and filtering
✓ Audit logs can be filtered by action
✓ Audit logs can be filtered by user
✓ Audit logs can be sorted by date
✓ Retention policies can be sorted by type
```

**Action Items:**
- [ ] Insert test data into each table
- [ ] Verify data displays correctly
- [ ] Test sorting and filtering
- [ ] Check pagination if implemented

### 4. Form Submission Test

Test creating new records:

```typescript
// Test create retention policy form
Fill form with:
- Name: "Test Retention Policy"
- Document Type: "factura"
- Years to Retain: 7
- Expiration Action: "ARCHIVE"
- Require SII Confirmation: checked

Submit form
Expected:
✓ Form validates inputs
✓ API call successful
✓ Success message displayed
✓ New policy appears in list
✓ Form clears for next entry
```

**Action Items:**
- [ ] Test policy creation form
- [ ] Test report creation form
- [ ] Test checklist creation form
- [ ] Verify validation messages
- [ ] Check success/error feedback

### 5. Responsive Design Test

Test on different screen sizes:

```bash
# Mobile (375px)
✓ Tabs stack vertically
✓ Cards display full width
✓ Table scrolls horizontally
✓ All buttons accessible

# Tablet (768px)
✓ Two-column layout if applicable
✓ Cards display properly
✓ Navigation works

# Desktop (1920px)
✓ Full multi-column layout
✓ All elements visible
✓ No horizontal scrolling
```

**Action Items:**
- [ ] Test on mobile viewport
- [ ] Test on tablet viewport
- [ ] Test on desktop viewport
- [ ] Test responsive images/charts

---

## Integration Verification

### 1. Navigation Integration

Verify Compliance button in main documents page:

```bash
# Navigate to /dashboard/documentos
# Expected:
✓ Compliance button visible in top right
✓ Intelligence button visible
✓ Templates button visible
✓ All buttons have correct icons
✓ Buttons pass clienteId parameter

# Click Compliance button
✓ Navigates to /dashboard/documentos/compliance?cliente_id={id}
✓ Correct client data loads
```

**Action Items:**
- [ ] Verify button visible on documents page
- [ ] Test button click navigation
- [ ] Verify clienteId parameter passing
- [ ] Check button styling matches other buttons

### 2. Data Integration with Existing Tables

Verify integration with documento_cargas:

```sql
-- Test document_lifecycle references documento_cargas
SELECT COUNT(*) FROM document_lifecycle
WHERE documento_carga_id IN (
  SELECT id FROM documento_cargas LIMIT 10
);
-- Should return > 0

-- Test audit_logs_extended references clientes
SELECT COUNT(*) FROM audit_logs_extended
WHERE cliente_id IN (
  SELECT id FROM clientes LIMIT 10
);
-- Should return > 0 (if audit logs created)

-- Verify foreign key integrity
-- Try to insert invalid documento_carga_id
INSERT INTO document_lifecycle
(documento_carga_id, cliente_id, estado_actual)
VALUES (
  'invalid-uuid'::uuid,
  (SELECT id FROM clientes LIMIT 1),
  'pendiente'
);
-- Expected: foreign key constraint error
```

**Action Items:**
- [ ] Verify documento_cargas integration
- [ ] Verify clientes integration
- [ ] Verify foreign key constraints work
- [ ] Test cascading deletes if applicable

### 3. API Route Integration

Verify webhook and API routes still work:

```bash
# Test existing webhook endpoint
curl -X POST http://localhost:3000/api/webhooks/nubox \
  -H "X-Nubox-Signature: ..." \
  -d '{"evento": "documento.creado", ...}'

# Expected: 200 OK response

# Test document upload still works
# Navigate to upload tab
✓ File upload works
✓ Metadata fields functional
✓ Document gets created
✓ Entry appears in list
```

**Action Items:**
- [ ] Test webhook endpoint
- [ ] Test document upload
- [ ] Test document approval flow
- [ ] Verify Phase 1-4 features unaffected

### 4. User Role Integration

Verify compliance features work for different roles:

```typescript
// Test with accountant role
// Navigate to compliance dashboard
✓ Can view audit logs
✓ Can view compliance reports
✓ Can create checklists
✓ Cannot modify data governance

// Test with admin role
✓ Can view everything
✓ Can modify all settings
✓ Can configure data governance
✓ Can approve/distribute reports

// Test with viewer role (if exists)
✓ Can view reports
✓ Cannot modify policies
✓ Cannot edit checklists
```

**Action Items:**
- [ ] Test with accountant role
- [ ] Test with admin role
- [ ] Test permission enforcement
- [ ] Verify audit trail of actions

---

## Security Verification

### 1. RLS Policy Enforcement

```sql
-- Test as user from client A
SET SESSION AUTHORIZATION 'user-a-uuid';

SELECT * FROM compliance_reports
WHERE cliente_id = 'client-b-uuid';
-- Expected: 0 rows (user cannot see other client data)

SELECT * FROM compliance_reports
WHERE cliente_id = 'client-a-uuid';
-- Expected: rows visible (user can see own client data)

-- Reset to default
RESET SESSION AUTHORIZATION;
```

**Action Items:**
- [ ] Test RLS prevents cross-client access
- [ ] Verify admin can access all data
- [ ] Test insert/update/delete policies
- [ ] Verify audit logs capture RLS violations

### 2. Authentication Check

```typescript
// Test without authentication token
fetch('/api/compliance-actions', {
  // No auth header
});
// Expected: 401 Unauthorized

// Test with invalid token
fetch('/api/compliance-actions', {
  headers: {
    'Authorization': 'Bearer invalid-token'
  }
});
// Expected: 401 Unauthorized

// Test with valid token but expired
// Expected: 401 Unauthorized or redirect to login
```

**Action Items:**
- [ ] Test unauthenticated requests rejected
- [ ] Test invalid token rejected
- [ ] Test expired token handled
- [ ] Verify redirect to login works

### 3. Data Validation

```typescript
// Test input validation
const invalidData = {
  nombre: '', // Empty
  anos_retener: -5, // Invalid
  accion_vencimiento: 'INVALID' // Invalid enum
};

try {
  await crearPoliticaRetencion(clienteId, invalidData);
  // Expected: validation error thrown
} catch (error) {
  // Should catch validation error
}
```

**Action Items:**
- [ ] Test empty string validation
- [ ] Test numeric bounds validation
- [ ] Test enum value validation
- [ ] Test UUID format validation
- [ ] Test email format validation

### 4. Injection Prevention

```typescript
// Test SQL injection prevention
const maliciousInput = "'; DROP TABLE compliance_reports; --";

const result = await obtenerReportesComplianza(
  clienteId,
  maliciousInput // As type filter
);

// Expected: safe handling (no SQL injection)
// Tables should still exist

// Test XSS prevention
const xssInput = "<script>alert('xss')</script>";

const checklist = await crearListaVerificacion(clienteId, {
  nombre: xssInput
});

// Navigate to checklist
// Expected: script not executed, text displayed as-is
```

**Action Items:**
- [ ] Test SQL injection prevention
- [ ] Test XSS prevention
- [ ] Test CSRF token validation
- [ ] Test rate limiting

### 5. Audit Trail Validation

```sql
-- Verify audit logs created for operations
SELECT COUNT(*) FROM audit_logs_extended
WHERE cliente_id = 'test-client-id'
AND creado_en > NOW() - INTERVAL '1 hour';

-- Expected: > 0 (operations logged)

-- Verify user attribution
SELECT DISTINCT usuario_id FROM audit_logs_extended
WHERE cliente_id = 'test-client-id'
AND creado_en > NOW() - INTERVAL '1 hour';

-- Expected: current user ID present

-- Verify before/after data capture
SELECT COUNT(*) FROM audit_logs_extended
WHERE cliente_id = 'test-client-id'
AND datos_anteriores IS NOT NULL
AND datos_nuevos IS NOT NULL;

-- Expected: update operations captured
```

**Action Items:**
- [ ] Verify audit logs created
- [ ] Verify user attribution correct
- [ ] Verify data capture complete
- [ ] Check timestamp accuracy

---

## Performance Testing

### 1. Load Time Tests

```bash
# Measure dashboard load time
# Open browser DevTools → Network tab
# Navigate to compliance dashboard

# Expected load times:
# - Initial page load: < 2 seconds
# - First contentful paint: < 1.2 seconds
# - Largest contentful paint: < 1.8 seconds
# - Cumulative layout shift: < 0.1

# Test with slow network (DevTools throttling)
# Set to Slow 4G
# Expected: still loads reasonably (< 5 seconds)
```

**Action Items:**
- [ ] Measure initial page load
- [ ] Measure tab switch speed
- [ ] Test with slow network simulation
- [ ] Measure data refresh speed

### 2. Database Query Performance

```sql
-- Test audit log retrieval
EXPLAIN ANALYZE
SELECT * FROM audit_logs_extended
WHERE cliente_id = 'test-client'
ORDER BY creado_en DESC
LIMIT 50;
-- Expected: < 100ms, uses idx_audit_logs_cliente

-- Test compliance report retrieval
EXPLAIN ANALYZE
SELECT * FROM compliance_reports
WHERE cliente_id = 'test-client'
AND tipo_reporte = 'AUDIT'
ORDER BY creado_en DESC;
-- Expected: < 200ms, uses idx_compliance_reports_tipo

-- Test document lifecycle with joins
EXPLAIN ANALYZE
SELECT dl.*, dc.tipo_documento, drp.accion_vencimiento
FROM document_lifecycle dl
JOIN documento_cargas dc ON dl.documento_carga_id = dc.id
JOIN document_retention_policies drp ON dl.politica_retencion_id = drp.id
WHERE dl.cliente_id = 'test-client'
AND dl.dias_restantes <= 30;
-- Expected: < 150ms
```

**Action Items:**
- [ ] Run EXPLAIN ANALYZE on key queries
- [ ] Verify index usage
- [ ] Check query execution times
- [ ] Add indexes if needed

### 3. Concurrent User Load Test

```bash
# Simulate multiple concurrent users
# Using Apache JMeter or similar

# Test parameters:
# - 10 concurrent users
# - Each making 20 requests
# - Total: 200 requests

# Endpoints to test:
# - GET /dashboard/documentos/compliance
# - POST compliance actions
# - GET audit logs

# Expected:
# - All requests complete
# - Average response time < 500ms
# - 99th percentile < 2000ms
# - No errors or timeouts
```

**Action Items:**
- [ ] Set up load testing tool
- [ ] Run concurrent user test
- [ ] Document results
- [ ] Identify bottlenecks if any

### 4. Bundle Size Analysis

```bash
# Analyze bundle size
npm run build

# Check output:
# Expected total bundle increase from Phase 5: ~38KB

# Test page speed
npx lighthouse https://localhost:3000/dashboard/documentos/compliance

# Expected scores:
# - Performance: > 80
# - Accessibility: > 90
# - Best Practices: > 90
# - SEO: > 90
```

**Action Items:**
- [ ] Run build analysis
- [ ] Check bundle size growth
- [ ] Run Lighthouse audit
- [ ] Optimize if needed

---

## End-to-End Workflows

### 1. Complete Retention Policy Workflow

**Scenario**: Create and manage document retention policy

```
Step 1: Create Retention Policy
- Navigate to Compliance → Retention tab
- Click "Create Policy"
- Fill in policy details:
  * Name: "Annual Invoices"
  * Document Type: "factura"
  * Years to Retain: 1
  * Expiration Action: "ARCHIVE"
- Submit form

Expected Result:
✓ Policy created successfully
✓ Success message displayed
✓ Policy appears in list
✓ Audit log created

Step 2: Apply to Documents
- Assign policy to document_lifecycle entries
- Verify dias_restantes calculated
- Verify porcentaje_retencion calculated

Expected Result:
✓ Policy applied
✓ Lifecycle dates updated
✓ Documents trackable

Step 3: Monitor Expiration
- Check "Overview" tab
- View "Expired Documents" alert
- See documents approaching expiration

Expected Result:
✓ Alert displays correctly
✓ Pending actions count updated
✓ Audit trail recorded

Step 4: Execute Expiration
- Documents reach expiration date
- System (or user) executes action
- Verify documento_lifecycle.fecha_destruido updated
- Verify audit log created

Expected Result:
✓ Action executed
✓ Dates updated
✓ Audit trail complete
```

**Action Items:**
- [ ] Execute full workflow
- [ ] Document any issues
- [ ] Verify audit trail
- [ ] Check all data updated

### 2. Complete Compliance Reporting Workflow

**Scenario**: Generate and distribute compliance report

```
Step 1: Create Report
- Navigate to Compliance → Reports tab
- Click "Create Report"
- Select report type: "AUDIT"
- Select date range: Last 90 days
- Enter report name and description
- Submit

Expected Result:
✓ Report created in DRAFT status
✓ Report appears in list
✓ Audit log created

Step 2: Generate Content
- System gathers data from audit_logs_extended
- Calculate summary statistics
- Generate findings and recommendations
- Verify resumen_ejecutivo and datos_completos populated

Expected Result:
✓ Report content generated
✓ Data accurate
✓ Formatting correct

Step 3: Review and Approve
- View report details
- Click "Approve"
- Select approver (should be admin or manager)
- Verify status changed to "APPROVED"

Expected Result:
✓ Status updated to APPROVED
✓ aprobado_por and aprobado_en set
✓ Audit log recorded

Step 4: Distribution
- Click "Distribute"
- Enter recipient emails
- Select format (PDF)
- Submit

Expected Result:
✓ Report distributed
✓ distribuido_a populated
✓ Email sent (if SMTP configured)
✓ Status updated to DISTRIBUTED
✓ Audit log recorded

Step 5: Track Read Status
- Recipients receive email
- Recipients open/download report
- System tracks reads (if implemented)
- Navigate to Reports tab
- See "Read By" information

Expected Result:
✓ Read tracking works
✓ Read times recorded
✓ Completion visibility
```

**Action Items:**
- [ ] Execute full reporting workflow
- [ ] Test report generation
- [ ] Test approval process
- [ ] Test distribution
- [ ] Document any issues

### 3. Complete Audit Log Workflow

**Scenario**: Monitor and review audit logs

```
Step 1: Generate Activity
- User uploads document
- Document approved
- Document submitted to Nubox
- Policy updated
- Report created
- All operations trigger audit logs

Expected Result:
✓ Audit logs created for each action
✓ User attribution correct
✓ Operation details captured
✓ Before/after data recorded

Step 2: Review Audit Logs
- Navigate to Compliance → Audit tab
- View "Recent Audit Logs" (50 entries)
- Verify all recent operations visible

Expected Result:
✓ All operations logged
✓ Correct user shown
✓ Action descriptions clear
✓ Timestamps accurate

Step 3: Filter Audit Logs
- Filter by action type (INSERT, UPDATE, DELETE)
- Filter by table
- Filter by user
- Verify results correct

Expected Result:
✓ Filters work correctly
✓ Results accurate
✓ Performance acceptable

Step 4: Review Summary
- View "Audit Summary (30-day)"
- See action breakdown by table
- See user activity summary

Expected Result:
✓ Summary accurate
✓ Breakdown detailed
✓ User activity correct

Step 5: Export Audit Log
- Click export button
- Select format (CSV, Excel)
- Download file

Expected Result:
✓ Export works
✓ All data included
✓ Format correct
✓ File readable in Excel
```

**Action Items:**
- [ ] Generate test activity
- [ ] Review audit logs
- [ ] Test filtering
- [ ] Test export
- [ ] Document findings

---

## Troubleshooting

### Common Issues and Solutions

#### 1. Migration Not Applied

**Problem**: Tables not found in database

**Solution**:
```bash
# Check migration status
supabase migration list

# Apply migration
supabase db push

# Or manually apply SQL:
psql -U postgres -d your_db -f src/migrations/add_compliance_reporting.sql

# Verify
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name LIKE 'compliance_%' OR table_name = 'audit_logs_extended';
```

**Action Items:**
- [ ] Check migration status
- [ ] Apply migration if needed
- [ ] Verify tables created

#### 2. RLS Policies Not Enforced

**Problem**: User sees data from other clients

**Solution**:
```sql
-- Check RLS enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename IN ('compliance_reports', 'audit_logs_extended');
-- All should have rowsecurity = true

-- If not:
ALTER TABLE compliance_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs_extended ENABLE ROW LEVEL SECURITY;

-- Verify policies exist
SELECT tablename, policyname
FROM pg_policies
WHERE tablename = 'compliance_reports';
```

**Action Items:**
- [ ] Check RLS status
- [ ] Enable RLS if disabled
- [ ] Verify policies exist

#### 3. Server Actions Not Found

**Problem**: "Server action not found" error

**Solution**:
```bash
# Verify file exists
ls -la src/app/dashboard/documentos/compliance-actions.ts

# Check 'use server' directive
head -5 src/app/dashboard/documentos/compliance-actions.ts
# Should start with 'use server'

# Check TypeScript errors
npx tsc --noEmit

# Rebuild
npm run build

# Restart dev server
npm run dev
```

**Action Items:**
- [ ] Verify file exists
- [ ] Check 'use server' directive
- [ ] Fix TypeScript errors
- [ ] Restart server

#### 4. Dashboard Won't Load

**Problem**: Compliance page blank or showing errors

**Solution**:
```bash
# Check browser console
# Open DevTools → Console tab
# Look for specific error messages

# Check Network tab
# Verify API calls successful
# Verify no CORS errors

# Check server logs
# Ensure no 500 errors

# Test individual server actions
# Open browser console and run:
await fetch('/dashboard/documentos', {method: 'POST'})
// Should show specific error

# Rebuild page
npm run build
npm start
```

**Action Items:**
- [ ] Check browser console
- [ ] Check network requests
- [ ] Check server logs
- [ ] Test API calls individually

#### 5. Data Not Saving

**Problem**: Create policy/report, but data not saved

**Solution**:
```sql
-- Check if RLS is blocking INSERT
-- User should have INSERT permission on table

-- Verify user's client_id
SELECT id FROM clientes WHERE contador_asignado_id = 'user-id';

-- Check insert policy
SELECT * FROM pg_policies
WHERE tablename = 'compliance_reports'
AND permissive = true
AND policyname LIKE '%insert%';

-- Verify policy definition
-- User should be able to insert to their client

-- Test insert directly
INSERT INTO compliance_reports
(cliente_id, tipo_reporte, nombre, periodo_inicio, periodo_fin, creado_por)
VALUES (
  'user-client-id',
  'AUDIT',
  'Test Report',
  '2026-01-01',
  '2026-12-31',
  'user-id'
);
-- Should succeed
```

**Action Items:**
- [ ] Check RLS policies
- [ ] Verify user's client assignment
- [ ] Test insert directly
- [ ] Check for validation errors

---

## Sign-Off Checklist

### Database Verification
- [ ] All 7 tables created successfully
- [ ] All 18 indexes created and working
- [ ] All 2 functions callable and tested
- [ ] All 3 triggers functioning
- [ ] All 8 RLS policies active
- [ ] No migration errors

### Server Actions
- [ ] All 20+ functions present
- [ ] TypeScript compilation successful
- [ ] All functions tested and working
- [ ] Error handling verified
- [ ] Authentication checks verified
- [ ] Input validation working

### UI/Dashboard
- [ ] Page loads without errors
- [ ] All 5 tabs render correctly
- [ ] Data displays accurately
- [ ] Forms submit successfully
- [ ] Responsive design verified
- [ ] No console errors

### Integration
- [ ] Navigation button visible and working
- [ ] Client ID parameter passing correctly
- [ ] Data integration with existing tables verified
- [ ] Existing features (Phase 1-4) unaffected
- [ ] User roles integration verified

### Security
- [ ] RLS policies enforced
- [ ] Authentication required
- [ ] Authorization working
- [ ] Input validation working
- [ ] Audit trail complete
- [ ] No security vulnerabilities

### Performance
- [ ] Page load time < 2 seconds
- [ ] Database queries < 200ms
- [ ] Bundle size reasonable (~38KB addition)
- [ ] Lighthouse score > 80
- [ ] No performance bottlenecks

### Documentation
- [ ] PHASE5_COMPLIANCE.md complete
- [ ] PHASE5_DELIVERY_SUMMARY.txt complete
- [ ] COMPLETE_PROJECT_DELIVERY.md updated
- [ ] API documentation clear
- [ ] Setup instructions complete

### Testing
- [ ] End-to-end workflows verified
- [ ] All user roles tested
- [ ] Edge cases handled
- [ ] Error scenarios tested
- [ ] Load testing passed

---

## Final Approval

**Tested By**: _____________________

**Date**: _____________________

**Status**: [ ] APPROVED [ ] NEEDS FIXES

**Notes**:
```
[Space for tester notes]
```

---

## Additional Resources

- **Documentation**: docs/PHASE5_COMPLIANCE.md
- **Migration File**: src/migrations/add_compliance_reporting.sql
- **Server Actions**: src/app/dashboard/documentos/compliance-actions.ts
- **Dashboard Page**: src/app/dashboard/documentos/compliance/page.tsx
- **Deployment Guide**: COMPLETE_PROJECT_DELIVERY.md

---

**Version**: 1.0
**Last Updated**: 2026-01-11
**Status**: COMPLETE
