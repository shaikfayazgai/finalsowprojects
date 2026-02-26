---
phase: 04-mentor-portal
plan: 02
subsystem: ui
tags: [react, tanstack-query, msw, sla-timer, review-queue, dialog, gradient-card, next-link]

requires:
  - phase: 04-01
    provides: mentor auth flow, application/onboarding, MSW handler infrastructure, auth store
  - phase: 02-design-system-completion
    provides: AppShell, Sidebar, TopBar, GradientCard, Badge, Tag, Dialog, Tabs, Skeleton, EmptyState

provides:
  - AppShell layout for mentor portal with 5-item sidebar navigation
  - Review queue page with 3 tabs (Pending/In Progress/Completed)
  - SLA timer with hydration-safe mounted state pattern
  - Skip dialog with required reason (min 20 chars)
  - SLA extension dialog returning pending_admin_approval state
  - 3 GradientCard KPI summary cards
  - MSW review handlers (queue, skip, extend, profile, activities)

affects: [04-03, 04-04]

tech-stack:
  added: []
  patterns:
    - "SLA timer hydration safety: useState(false) + useEffect mount guard, renders '--' on server"
    - "Dialog-in-card pattern: SkipDialog/SLAExtensionDialog embedded directly in ReviewQueueItemCard"
    - "Link wrapper for clickable cards: pending/in_progress items are Next.js Link, completed are not"

key-files:
  created:
    - apps/mentor-portal/src/app/(app)/layout.tsx
    - apps/mentor-portal/src/app/(app)/queue/page.tsx
    - apps/mentor-portal/src/components/layout/mentor-sidebar.tsx
    - apps/mentor-portal/src/components/review-queue/sla-timer.tsx
    - apps/mentor-portal/src/components/review-queue/review-queue-item-card.tsx
    - apps/mentor-portal/src/components/review-queue/review-queue-tabs.tsx
    - apps/mentor-portal/src/components/review-queue/skip-dialog.tsx
    - apps/mentor-portal/src/components/review-queue/sla-extension-dialog.tsx
    - apps/mentor-portal/src/components/review-queue/index.ts
    - apps/mentor-portal/src/components/dashboard/mentor-kpi-row.tsx
    - apps/mentor-portal/src/lib/msw/handlers/reviews.ts
  modified:
    - apps/mentor-portal/src/lib/msw/handlers/index.ts

key-decisions:
  - "Button variant='secondary' used for dialog cancel buttons (no 'outline' variant in DS)"
  - "Dialogs embedded directly in ReviewQueueItemCard rather than controlled from parent tabs"
  - "SLA timer updates every 60 seconds (appropriate for hour-scale deadlines)"
  - "3rd GradientCard uses inline style override for custom forest-to-teal gradient"

patterns-established:
  - "SLA timer: mounted-state hydration pattern for time-dependent UI"
  - "Review queue item: Link wrapper for actionable items, plain div for completed"
  - "Dialog-in-card: embed dialog components with button triggers inside card actions"

duration: 5min
completed: 2026-02-26
---

# Phase 4 Plan 02: Review Queue Management Summary

**Review queue with 3-tab layout (Pending/In Progress/Completed), SLA countdown timers with hydration safety, skip/extend dialogs, and GradientCard KPI row -- all wired to MSW mock data**

## Performance

- **Duration:** 5 min
- **Started:** 2026-02-26T15:17:58Z
- **Completed:** 2026-02-26T15:23:29Z
- **Tasks:** 1
- **Files modified:** 12

## Accomplishments

- AppShell layout with 5-item sidebar (Queue, Skill Verification, Profile, Messages, Settings) and avatar
- Review queue page with 3 tabs showing filtered MSW data via TanStack Query
- SLA timer renders "--" on server, starts 60-second interval countdown on client mount with color-coded urgency (normal/warning/urgent/overdue)
- Skip dialog with textarea requiring min 20 characters, POSTs to /reviews/:id/skip
- SLA extension dialog POSTs to /reviews/:id/sla-extension, shows pending_admin_approval confirmation for 2 seconds
- hasSLAExtensionPending flag drives "Extension Requested" badge on queue item card
- Pending and In Progress items are Next.js Link components navigating to /queue/[id]; completed items are not clickable
- 3 GradientCard KPI cards: pending reviews (primary), completed this week (nature), avg SLA days (custom gradient)
- MSW handlers for queue filtering, skip, extend, profile metrics, and APG activities

## Task Commits

Each task was committed atomically:

1. **Task 1: AppShell + review queue with all components** - `f5a6d26` (feat)

## Files Created/Modified

- `apps/mentor-portal/src/app/(app)/layout.tsx` - AppShell layout with Sidebar + TopBar
- `apps/mentor-portal/src/app/(app)/queue/page.tsx` - Queue page with KPI row and tabs
- `apps/mentor-portal/src/components/layout/mentor-sidebar.tsx` - Extracted sidebar component
- `apps/mentor-portal/src/components/review-queue/sla-timer.tsx` - Hydration-safe SLA countdown
- `apps/mentor-portal/src/components/review-queue/review-queue-item-card.tsx` - Queue item with Link/badges/dialogs
- `apps/mentor-portal/src/components/review-queue/review-queue-tabs.tsx` - 3-tab layout with TanStack Query
- `apps/mentor-portal/src/components/review-queue/skip-dialog.tsx` - Skip review dialog (reason required)
- `apps/mentor-portal/src/components/review-queue/sla-extension-dialog.tsx` - SLA extension request dialog
- `apps/mentor-portal/src/components/review-queue/index.ts` - Barrel export
- `apps/mentor-portal/src/components/dashboard/mentor-kpi-row.tsx` - 3 GradientCard KPI cards
- `apps/mentor-portal/src/lib/msw/handlers/reviews.ts` - MSW handlers for queue + actions
- `apps/mentor-portal/src/lib/msw/handlers/index.ts` - Added reviewHandlers import

## Decisions Made

- Button variant="secondary" used for dialog Cancel buttons (DS has no "outline" variant -- primary/secondary/ghost/destructive only)
- Dialogs (SkipDialog, SLAExtensionDialog) embedded directly inside ReviewQueueItemCard with DialogTrigger wrapping the button, rather than controlled from parent component via callbacks
- onClick stopPropagation on dialog action buttons prevents Link navigation when clicking dialog triggers inside cards
- SLA timer uses 60-second interval (not real-time) since deadlines are measured in hours

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed Button variant="outline" to variant="secondary"**
- **Found during:** Task 1 (build verification)
- **Issue:** Plan used variant="outline" but @glimmora/ui Button only supports primary/secondary/ghost/destructive
- **Fix:** Changed to variant="secondary" in both SkipDialog and SLAExtensionDialog
- **Files modified:** skip-dialog.tsx, sla-extension-dialog.tsx
- **Verification:** pnpm turbo build passes cleanly
- **Committed in:** f5a6d26 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Minor variant name correction. No scope creep.

## Issues Encountered

None beyond the variant name fix above.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Review queue fully operational with MSW data
- Queue item cards link to /queue/[id] -- ready for 04-03 (Review Detail view with 3-panel layout)
- MSW reviews handler already includes GET /reviews/:id endpoint stub for detail view
- APG activities endpoint ready for future dashboard integration

---
*Phase: 04-mentor-portal*
*Completed: 2026-02-26*
