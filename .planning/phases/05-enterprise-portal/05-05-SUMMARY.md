---
phase: 05-enterprise-portal
plan: 05
subsystem: ui, api
tags: [enterprise, evidence-review, blind-review, rework, escalation, payment-release, otp, bulk-payment, apg-silent, tanstack-table]

# Dependency graph
requires:
  - phase: 01-monorepo-infrastructure-ds-foundation
    provides: Monorepo, @glimmora/ui components (EvidenceViewer, DataTable, SlideOutPanel, Badge, Card, Dialog, Select, Button), @glimmora/types (Evidence, EvidencePack, PaymentRecord, PaymentPreferences)
  - phase: 02-design-system-completion
    provides: EvidenceViewer with blind-review Evidence types, DataTable with TanStack ColumnDef, OTPInput
  - phase: 05-enterprise-portal
    plan: 02
    provides: OTPConfirmationDialog in components/shared/ for reuse
  - phase: 05-enterprise-portal
    plan: 03
    provides: 7-tab project detail with placeholder tabs for evidence/rework/escalation/payments
  - phase: 05-enterprise-portal
    plan: 04
    provides: Timeline tab functional, 4 placeholder tabs remaining
provides:
  - EvidencePackReview with blind evidence display (contributorId stripped via toViewerEvidence mapping)
  - ReworkRequestForm with required reason + items-to-address dual validation
  - EscalationForm with required reason and priority selector for mentor escalation
  - ReworkRequestsList and EscalationsList card-based views
  - PaymentReleaseCard with OTP confirmation for manual payment release
  - BulkPaymentRelease with TanStack useReactTable direct usage (external rowSelection state)
  - Auto-Payment Settings with manual/auto-on-approval/apg-silent mode selector
  - APG-Silent Approvals Log showing auto-approved payments with thresholds
  - All 7 project detail tabs now fully functional (0 placeholders)
  - MSW evidence and payment factories and handlers
affects: [05-06-gap-fixes]

# Tech tracking
tech-stack:
  added: []
  patterns: [Blind review via toViewerEvidence mapping that strips contributorId, TanStack useReactTable direct usage with external rowSelection for bulk selection, OTP confirmation dialog reuse pattern]

key-files:
  created:
    - apps/enterprise-portal/src/components/projects/evidence-pack-review.tsx
    - apps/enterprise-portal/src/components/projects/rework-request-form.tsx
    - apps/enterprise-portal/src/components/projects/escalation-form.tsx
    - apps/enterprise-portal/src/components/projects/rework-requests-list.tsx
    - apps/enterprise-portal/src/components/projects/escalations-list.tsx
    - apps/enterprise-portal/src/components/projects/payment-release-card.tsx
    - apps/enterprise-portal/src/components/projects/bulk-payment-release.tsx
    - apps/enterprise-portal/src/lib/msw/factories/evidence.ts
    - apps/enterprise-portal/src/lib/msw/factories/payment.ts
    - apps/enterprise-portal/src/lib/msw/handlers/evidence.ts
    - apps/enterprise-portal/src/lib/msw/handlers/payments.ts
  modified:
    - apps/enterprise-portal/src/components/projects/project-detail-tabs.tsx
    - apps/enterprise-portal/src/components/projects/index.ts
    - apps/enterprise-portal/src/lib/msw/handlers/index.ts

key-decisions:
  - "Evidence contributorId stripped in toViewerEvidence mapping function -- blind review enforced at runtime since Evidence from @glimmora/types includes contributorId (unlike ReviewEvidence from mentor portal which structurally excludes it)"
  - "BulkPaymentRelease uses TanStack useReactTable directly with external rowSelection state because DataTable from @glimmora/ui encapsulates rowSelection internally and does not expose it"
  - "OTPConfirmationDialog reused from 05-02 components/shared/ for both PaymentReleaseCard single release and BulkPaymentRelease bulk release"
  - "enableRowSelection conditionally enables only pending payments for checkbox selection in bulk table"
  - "Auto-payment settings support 3 modes: manual (OTP required), auto-on-approval, apg-silent (with configurable threshold)"

patterns-established:
  - "Blind review mapping: toViewerEvidence function strips contributorId from Evidence type before passing to EvidenceViewer"
  - "Direct TanStack useReactTable: when DataTable internal state is insufficient, use useReactTable directly with matching table markup and pagination"
  - "OTP reuse: OTPConfirmationDialog composable for any action requiring OTP confirmation"
  - "Dual-field required validation: manual error state tracking with inline error messages below each field"

# Metrics
duration: 6min
completed: 2026-02-27
---

# Phase 5 Plan 5: Evidence Pack Review, Payment Release, and Operational Workflows Summary

**Blind evidence review with EvidenceViewer (contributorId stripped), rework/escalation forms, OTP-confirmed manual and bulk payment release via TanStack useReactTable, auto-payment mode settings, and APG-silent approvals log -- all 7 project detail tabs now fully functional**

## Performance

- **Duration:** 6 min
- **Started:** 2026-02-27T05:20:29Z
- **Completed:** 2026-02-27T05:27:10Z
- **Tasks:** 2
- **Files modified:** 14

## Accomplishments
- EvidencePackReview component with DataTable listing evidence packs, SlideOutPanel for detail view, and EvidenceViewer rendering evidence items with contributorId stripped for blind review
- ReworkRequestForm with dual required field validation (reason + items-to-address) and inline error messages
- EscalationForm with required reason and priority selector (normal/high/urgent) for mentor escalation
- ReworkRequestsList and EscalationsList card-based views with status badges and timestamps
- PaymentReleaseCard with OTPConfirmationDialog for single manual payment release with amount/fee/net display
- BulkPaymentRelease using TanStack useReactTable directly with external rowSelection state, enabling checkbox selection on pending payments only, bulk action toolbar showing selected count and total amount, and OTP-confirmed bulk release
- Auto-Payment Settings card with manual/auto-on-approval/apg-silent mode selector and configurable APG threshold
- APG-Silent Approvals Log using DataTable showing auto-approved payments with amounts, thresholds, and transaction IDs
- All 7 project detail tabs now render functional components (Overview, Timeline, Evidence Packs, Rework Requests, Escalation Centre, Payment Release, Team Summary -- 0 placeholders remain)
- MSW factories and handlers for evidence packs, rework requests, escalations, payments, bulk release, payment preferences, and silent approvals

## Task Commits

Each task was committed atomically:

1. **Task 1: Evidence pack review with blind review, rework/escalation forms, MSW handlers** - `cf512b3` (feat)
2. **Task 2: Payment release with OTP, bulk release with TanStack useReactTable, auto-payment settings, APG-silent log** - `a869279` (feat)

## Files Created/Modified
- `apps/enterprise-portal/src/components/projects/evidence-pack-review.tsx` - EvidencePackReview with DataTable, SlideOutPanel, blind EvidenceViewer, approve/rework/escalate actions
- `apps/enterprise-portal/src/components/projects/rework-request-form.tsx` - Dialog form with required reason + items-to-address validation
- `apps/enterprise-portal/src/components/projects/escalation-form.tsx` - Dialog form with required reason and priority Select for mentor escalation
- `apps/enterprise-portal/src/components/projects/rework-requests-list.tsx` - Card-based list of rework requests with status badges
- `apps/enterprise-portal/src/components/projects/escalations-list.tsx` - Card-based list of escalations with priority and status badges
- `apps/enterprise-portal/src/components/projects/payment-release-card.tsx` - Single payment card with OTP-confirmed release
- `apps/enterprise-portal/src/components/projects/bulk-payment-release.tsx` - TanStack useReactTable with row selection, bulk toolbar, OTP release, auto-payment settings, APG-silent log
- `apps/enterprise-portal/src/components/projects/project-detail-tabs.tsx` - All 4 placeholder tabs replaced with functional components
- `apps/enterprise-portal/src/components/projects/index.ts` - Barrel exports updated with all 7 new components
- `apps/enterprise-portal/src/lib/msw/factories/evidence.ts` - Mock evidence packs, rework requests, escalations
- `apps/enterprise-portal/src/lib/msw/factories/payment.ts` - Mock payments, preferences, silent approvals
- `apps/enterprise-portal/src/lib/msw/handlers/evidence.ts` - 7 evidence endpoint handlers (GET packs, GET detail, POST approve/rework/escalate, GET rework/escalations)
- `apps/enterprise-portal/src/lib/msw/handlers/payments.ts` - 7 payment endpoint handlers (GET payments, POST release/bulk-release, GET/PATCH preferences, GET silent-approvals, GET history)
- `apps/enterprise-portal/src/lib/msw/handlers/index.ts` - Added evidence and payment handler registrations

## Decisions Made
- **Blind review mapping at runtime:** Evidence from @glimmora/types includes contributorId (unlike mentor portal's ReviewEvidence which structurally excludes it). The toViewerEvidence function strips contributorId before passing to EvidenceViewer, enforcing blind review at the mapping boundary.
- **Direct useReactTable for bulk selection:** @glimmora/ui DataTable encapsulates rowSelection internally with no external access. BulkPaymentRelease uses TanStack useReactTable directly with external rowSelection state to enable checkbox selection and getSelectedRowModel() access.
- **OTPConfirmationDialog reuse:** The dialog from 05-02 is used for both PaymentReleaseCard (single release) and BulkPaymentRelease (bulk release), confirming the shared component pattern works.
- **Conditional row selection:** enableRowSelection uses a function `(row) => row.original.status === 'pending'` to only allow selection of pending payments, preventing released/held/disputed payments from being selected.
- **Three payment modes:** manual (OTP required for each release), auto-on-approval (auto-release when evidence approved), apg-silent (APG auto-approves below threshold).

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All 7 project detail tabs fully functional: Overview, Timeline, Evidence Packs, Rework Requests, Escalation Centre, Payment Release, Team Summary
- Enterprise portal core workflows complete: SOW upload -> blueprint editor -> project monitoring -> evidence review -> payment release
- Evidence, rework, escalation, and payment MSW handlers serve mock data for all endpoints
- OTPConfirmationDialog proven reusable across multiple flows
- Ready for Plan 05-06 (gap fixes and polish)
- No blockers

---
*Phase: 05-enterprise-portal*
*Completed: 2026-02-27*
