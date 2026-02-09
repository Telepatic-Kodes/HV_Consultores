---
phase: 01-convex-migration
plan: 02
subsystem: backend-data-layer
tags: [convex, queries, mutations, typescript, type-safety]

requires:
  - 01-01: Convex schema definitions for all tables

provides:
  - Complete Convex API layer with 103+ queries and mutations
  - Type-safe data access patterns for all core entities
  - CRUD operations compatible with existing Supabase patterns

affects:
  - 01-03: Frontend migration can now consume Convex functions
  - 01-04: Auth integration will use profile queries
  - 01-05: Data migration will use bulk import mutations

tech-stack:
  added:
    - "Convex queries and mutations"
    - "convex/values validation schemas"
  patterns:
    - "Index-optimized queries"
    - "Bulk operation mutations"
    - "Soft delete patterns"
    - "Relationship traversal in queries"

key-files:
  created:
    - convex/documents.ts
    - convex/clients.ts
    - convex/f29.ts
    - convex/bots.ts
    - convex/notifications.ts
    - convex/chat.ts
    - convex/banks.ts
    - convex/profiles.ts
    - convex/audit.ts
  modified: []

decisions:
  - id: filter-in-memory
    what: Apply multiple filters in memory after indexed query
    why: Convex doesn't support compound indexes for all filter combinations
    impact: Works well for small-to-medium datasets, may need optimization for large tables
    alternatives: ["Add more compound indexes", "Implement pagination earlier"]

  - id: soft-delete-default
    what: Default to soft delete (activo=false) with optional hard delete
    why: Preserve audit trail and allow data recovery
    impact: Queries need to filter by activo status
    alternatives: ["Hard delete only", "Separate archive table"]

  - id: relation-traversal
    what: Manually traverse relationships in queries (e.g., getProfileWithRoles)
    why: Convex doesn't have SQL-style joins
    impact: More code but explicit data fetching
    alternatives: ["Use edges pattern", "Denormalize data"]

metrics:
  duration: 83
  completed: 2026-02-09

commit: 6055924
---

# Phase 01 Plan 02: Convex Queries and Mutations Summary

**One-liner:** Implemented 103+ type-safe Convex queries and mutations across 9 modules, providing complete CRUD API layer for documents, clients, F29, bots, notifications, chat, banks, profiles, and audit logs.

## What Was Delivered

Created comprehensive Convex data access layer with all operations needed to replace existing Supabase database calls:

### Documents Module (11 functions)
- **Queries:** listDocuments, getDocument, getDocumentsByStatus, searchDocuments, getDocumentStats, getDocumentsByPeriodo
- **Mutations:** createDocument, updateDocument, classifyDocument, deleteDocument, bulkImportDocuments
- **Features:** ML classification tracking, status workflow, period-based filtering

### Clients Module (10 functions)
- **Queries:** listClients, getClient, getClientByRut, searchClients, getClientsByContador, getClientStats
- **Mutations:** createClient, updateClient, deleteClient, assignContador
- **Features:** RUT-based lookup, contador assignment, regime tracking, soft delete

### F29 Tax Forms Module (14 functions)
- **Queries:** listSubmissions, getSubmission, getSubmissionsByPeriodo, getSubmissionsByStatus, getF29Stats, getF29Codigos, getF29Validaciones, getSubmissionValidations
- **Mutations:** createSubmission, updateSubmissionStatus, updateSubmission, createValidation, createF29Codigo, deleteSubmission
- **Features:** Tax calculation tracking, validation system, status workflow, SII submission tracking

### Bots (RPA) Module (14 functions)
- **Queries:** listBotDefiniciones, getBotDefinicion, listJobs, getJob, getActiveJobs, getJobSteps, getBotLogs, getBotStats
- **Mutations:** createJob, updateJobStatus, addExecutionStep, completeJob, failJob, cancelJob
- **Features:** Job lifecycle management, execution logging, retry logic, success rate tracking

### Notifications Module (10 functions)
- **Queries:** listNotifications, getUnreadCount, getNotification, getNotificationsByType
- **Mutations:** createNotification, markAsRead, markAllAsRead, deleteNotification, deleteAllRead, bulkCreateNotifications
- **Features:** Read/unread tracking, bulk operations, type-based filtering

### Chat Module (11 functions)
- **Queries:** listChatSesiones, getChatSesion, getChatMensajes, listMessages, searchMessages
- **Mutations:** createChatSesion, sendMessage, sendChatMensaje, updateSesionTitulo, deleteMessage, deleteChatSesion, archiveChatSesion
- **Features:** Session management, message history, RAG-ready structure, auto-title generation

### Bank Transactions Module (13 functions)
- **Queries:** listTransactions, getTransaction, getTransactionsByDateRange, getTransactionStats, getUnreconciledTransactions
- **Mutations:** createTransaction, updateTransaction, categorizeTransaction, reconcileTransaction, bulkImportTransactions, deleteTransaction, bulkReconcileTransactions
- **Features:** Date range filtering, reconciliation tracking, categorization, bulk import for CSV uploads

### Profiles Module (13 functions)
- **Queries:** listProfiles, getProfile, getProfileWithRoles, searchProfiles, listRoles, getRole, getUserRoles
- **Mutations:** createProfile, updateProfile, deleteProfile, assignRole, removeRole
- **Features:** Role-based access control, user management, role assignment

### Audit Logs Module (8 functions)
- **Queries:** listAuditLogs, getAuditLog, getRecordAuditLogs, getAuditStats, getUserActivity
- **Mutations:** createAuditLog, bulkCreateAuditLogs, deleteOldAuditLogs
- **Features:** Comprehensive change tracking, user activity monitoring, cleanup utilities

## Technical Implementation

### Convex Patterns Used
```typescript
// Index-optimized queries
export const listDocuments = query({
  args: { clienteId: v.optional(v.id("clientes")) },
  handler: async (ctx, args) => {
    let q = ctx.db.query("documentos");
    if (args.clienteId) {
      q = q.withIndex("by_cliente", q => q.eq("cliente_id", args.clienteId!));
    }
    return await q.collect();
  },
});

// Type-safe mutations with validation
export const createDocument = mutation({
  args: {
    cliente_id: v.id("clientes"),
    tipo_documento: v.string(),
    folio: v.string(),
    // ... full schema validation
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    return await ctx.db.insert("documentos", {
      ...args,
      status: "pendiente",
      created_at: now,
    });
  },
});
```

### Argument Validation
Every function uses Convex's `v` validators for type safety:
- `v.id()` for foreign key references
- `v.optional()` for nullable fields
- `v.union()` for enum values
- `v.array()` and `v.object()` for complex types

### Index Strategy
Queries leverage schema indexes for performance:
- `by_cliente` - Client-scoped queries
- `by_periodo` - Period-based filtering
- `by_status` - Status workflow queries
- `by_usuario` - User-scoped data
- `by_created` - Chronological sorting

## Task Commits

| Task | Description | Commit | Files |
|------|-------------|--------|-------|
| 1-3 | Create all Convex query/mutation modules | 6055924 | 9 files: documents.ts, clients.ts, f29.ts, bots.ts, notifications.ts, chat.ts, banks.ts, profiles.ts, audit.ts |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added bulk operation mutations**
- **Found during:** Task 1 - Creating documents.ts
- **Issue:** Plan didn't specify bulk import operations, but CSV import feature requires them
- **Fix:** Added `bulkImportDocuments`, `bulkImportTransactions`, `bulkCreateNotifications`, `bulkCreateAuditLogs`
- **Files modified:** documents.ts, banks.ts, notifications.ts, audit.ts
- **Commit:** 6055924

**2. [Rule 2 - Missing Critical] Added relationship traversal queries**
- **Found during:** Task 2 - Creating profiles.ts
- **Issue:** Frontend needs profiles with their roles in single query to avoid waterfalls
- **Fix:** Added `getProfileWithRoles` that fetches user + roles in one call
- **Files modified:** profiles.ts
- **Commit:** 6055924

**3. [Rule 2 - Missing Critical] Added stats queries for dashboard**
- **Found during:** Task 1 - Creating documents.ts
- **Issue:** Dashboard requires aggregated stats (matching existing Supabase queries)
- **Fix:** Added `getDocumentStats`, `getClientStats`, `getF29Stats`, `getBotStats`, `getTransactionStats`, `getAuditStats`
- **Files modified:** documents.ts, clients.ts, f29.ts, bots.ts, banks.ts, audit.ts
- **Commit:** 6055924

**4. [Rule 2 - Missing Critical] Added soft delete support**
- **Found during:** Task 2 - Creating clients.ts
- **Issue:** Production systems need data recovery capability
- **Fix:** Implemented soft delete pattern (set `activo=false`) with optional hard delete
- **Files modified:** clients.ts, profiles.ts
- **Commit:** 6055924

## Success Criteria Met

- ✅ 103 Convex queries and mutations deployed (exceeds 35+ requirement)
- ✅ All CRUD operations match existing Supabase patterns
- ✅ Functions are type-safe with proper argument validation
- ✅ Indexes defined for all common query patterns
- ✅ Return shapes compatible with current frontend expectations

## Next Phase Readiness

**Ready for:**
- ✅ Frontend migration (01-03) - All data access functions available
- ✅ Auth integration (01-04) - Profile and role queries ready
- ✅ Data migration (01-05) - Bulk import mutations ready

**No blockers for next phase.**

## Performance Notes

- Functions use indexed queries where possible for O(log n) lookups
- In-memory filtering used for compound conditions (works well for <10k records per table)
- Bulk operations reduce round-trips for CSV imports and notifications
- Stats queries cache-friendly (can be paginated if needed)

## Migration Strategy

Frontend components can migrate incrementally:
1. Replace Supabase client imports with Convex hooks
2. Change `supabase.from('table').select()` → `useQuery(api.module.listItems)`
3. Change server actions to Convex mutations
4. Test each page before moving to next

Example migration:
```typescript
// Before (Supabase)
const { data } = await supabase.from('documentos').select('*').eq('cliente_id', clientId)

// After (Convex)
const documents = useQuery(api.documents.listDocuments, { clienteId })
```

## Self-Check: PASSED

All files and commits verified.
