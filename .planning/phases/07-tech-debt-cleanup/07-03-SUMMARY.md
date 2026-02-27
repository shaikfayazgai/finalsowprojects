---
phase: 07-tech-debt-cleanup
plan: 03
subsystem: admin-panel
tags: [msw-handlers, reports, podl-ledger, refactor]
depends_on:
  requires: [07-01]
  provides: [settings-handler-extraction, podl-ledger-report]
  affects: []
tech-stack:
  added: []
  patterns: [handler-per-domain, per-credential-report-data]
key-files:
  created:
    - apps/admin-panel/src/lib/msw/handlers/settings.ts
  modified:
    - apps/admin-panel/src/lib/msw/handlers/audit-log.ts
    - apps/admin-panel/src/lib/msw/handlers/index.ts
    - packages/types/src/admin.ts
    - apps/admin-panel/src/app/(app)/reports/page.tsx
    - apps/admin-panel/src/components/reports/report-builder-form.tsx
    - apps/admin-panel/src/lib/msw/factories/report.ts
    - apps/admin-panel/src/components/reports/report-pdf-document.tsx
decisions: []
metrics:
  duration: 6 min
  completed: 2026-02-27
---

# Phase 7 Plan 3: Extract Settings Handlers & Add PoDL Ledger Report Summary

**One-liner:** Extracted settings MSW handlers into dedicated file and added PoDL Ledger as 6th admin report type with per-credential audit table data across the full 5-step pipeline.

## What Was Done

### Task 1: Extract settings handlers from audit-log.ts into settings.ts (f85ab52)

Moved the `mockAdmins` array (5 admin user objects) and 3 settings-related route handlers (GET/PATCH/POST `/api/admin/settings/admins`) from `audit-log.ts` into a new `settings.ts` file. The `audit-log.ts` file now contains only the single audit log GET handler. Updated the barrel `index.ts` to import and spread `settingsHandlers` alongside `auditLogHandlers`.

**Before:** audit-log.ts was 88 lines mixing audit log and settings concerns.
**After:** audit-log.ts is 11 lines (audit only), settings.ts is 81 lines (settings only).

### Task 2: Add PoDL Ledger as 6th report type (c7f9932)

Added `podl_ledger` across the complete 5-step report pipeline:

1. **Type union** (`packages/types/src/admin.ts`): Added `'podl_ledger'` to `ReportType`
2. **Report page card** (`reports/page.tsx`): Added PoDL Ledger card with `Award` icon
3. **Builder form** (`report-builder-form.tsx`): Added option + `PODL_USER_TYPE_FILTERS` (All/Women/Students/Alumni)
4. **MSW factory** (`report.ts`): Added `podlLedgerData()` with 8 per-credential rows containing credential_id, anonymized contributor, user_type, project, task, skills, issued date, and verification status
5. **PDF export** (`report-pdf-document.tsx`): Added `'PoDL Credential Ledger Report'` title

The PoDL Ledger uses per-credential flat rows (not monthly aggregates like the other 5 reports), which the existing DataTable and chart rendering handle automatically via dynamic column detection.

## Deviations from Plan

None -- plan executed exactly as written.

## Verification Results

- `pnpm turbo build` passes with 5/5 tasks successful, zero errors
- `grep -c "http\." audit-log.ts` returns 1 (only audit log route)
- `wc -l settings.ts` shows 81 lines (non-empty file)
- All 5 pipeline files contain `podl_ledger`
- Factory has 8 per-credential rows with credential_id, contributor, user_type, project, task, skills, issued, status
- ReportType union has 6 types

## Commits

| Hash | Type | Description |
|------|------|-------------|
| f85ab52 | refactor | Extract settings handlers from audit-log.ts into settings.ts |
| c7f9932 | feat | Add PoDL Ledger as 6th report type across full report pipeline |
