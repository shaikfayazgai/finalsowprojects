---
phase: 03-womens-portal-university-portal
plan: 02
subsystem: ui
tags: [react, next.js, msw, tanstack-query, app-shell, dashboard, tasks, evidence, i18n]

requires:
  - phase: 02-design-system-completion
    provides: AppShell, Sidebar, TopBar, GradientCard, KPIStatCard, APGFeed, Tabs, FileUpload, Badge, Tag, PageHeader
  - phase: 03-01
    provides: "@glimmora/types (Task, Evidence, APGActivity), next-intl config, MSW setup, pre-auth pages"
provides:
  - AppShell layout with 8-item sidebar navigation for authenticated Women's Portal
  - Dashboard page with gradient KPI cards, APG Activity Feed, active tasks summary
  - Task list with 5 status-filtered tabs (All, Open, In Progress, Under Review, Completed)
  - Task detail page with APG guidance, skill tags, and evidence submission CTA
  - Evidence submission form with 5 input types (File, URL, Code, Video URL, Text)
  - Submission status tracker with pipeline visualization
  - Rework request view with structured mentor feedback and resubmit flow
  - MSW handlers/factories for tasks, evidence, and APG activities
affects: [03-03, 03-04, 03-05]

tech-stack:
  added: []
  patterns:
    - "Route group (app) for authenticated pages wrapping AppShell"
    - "Dashboard = GradientCard KPIs + APGFeed widget + ActiveTasksSummary"
    - "Task status tabs using Radix Tabs with MSW-driven TanStack Query data"
    - "Evidence submission via tabbed interface (File/URL/Code/Video/Text)"
    - "APGActivity type mapping: hyphenated types from @glimmora/types mapped to underscored types for APGFeed component"

key-files:
  created:
    - apps/women-portal/src/app/(app)/layout.tsx
    - apps/women-portal/src/app/(app)/dashboard/page.tsx
    - apps/women-portal/src/app/(app)/tasks/page.tsx
    - apps/women-portal/src/app/(app)/tasks/[taskId]/page.tsx
    - apps/women-portal/src/app/(app)/tasks/[taskId]/submit/page.tsx
    - apps/women-portal/src/app/(app)/tasks/[taskId]/rework/page.tsx
    - apps/women-portal/src/app/(app)/submissions/page.tsx
    - apps/women-portal/src/components/dashboard/kpi-row.tsx
    - apps/women-portal/src/components/dashboard/apg-activity-widget.tsx
    - apps/women-portal/src/components/dashboard/active-tasks-summary.tsx
    - apps/women-portal/src/components/tasks/task-list-with-tabs.tsx
    - apps/women-portal/src/components/tasks/task-detail-view.tsx
    - apps/women-portal/src/components/tasks/evidence-submission-form.tsx
    - apps/women-portal/src/components/tasks/submission-status-tracker.tsx
    - apps/women-portal/src/components/tasks/rework-request-view.tsx
    - apps/women-portal/src/lib/msw/factories/task.ts
    - apps/women-portal/src/lib/msw/factories/evidence.ts
    - apps/women-portal/src/lib/msw/factories/apg.ts
    - apps/women-portal/src/lib/msw/factories/common.ts
    - apps/women-portal/src/lib/msw/handlers/tasks.ts
    - apps/women-portal/src/lib/msw/handlers/evidence.ts
    - apps/women-portal/src/lib/msw/handlers/apg.ts
  modified:
    - apps/women-portal/src/lib/msw/handlers/index.ts
    - apps/women-portal/src/messages/en.json

key-decisions:
  - "APGActivity type mapping: @glimmora/types uses hyphens (task-assigned), APGFeed component uses underscores (task_assigned) -- mapped via TYPE_MAP object"
  - "Evidence rework pack pre-seeded in MSW handlers for task-005 so rework view has data immediately"
  - "Common MSW factory helper (randomId, isoNow) created for reuse across task/evidence/apg factories"
  - "Pipeline visualization in submission tracker uses simple div bars rather than TimelineBar component (simpler, fits inline card layout)"

patterns-established:
  - "AppShell layout: AppShell wraps Sidebar + TopBar + main content, sidebar items use active prop from usePathname()"
  - "Dashboard pattern: KPIRow (gradient cards) + 2-column grid (ActiveTasksSummary + APGActivityWidget)"
  - "Task list pattern: Tabs filtering via query param to MSW, status badge mapping via STATUS_BADGE_MAP record"
  - "Evidence form pattern: Tabs for type selection, separate state per type, single submit endpoint"
  - "Rework flow: fetch evidence pack -> show feedback + rework items -> link to /submit for resubmission"

duration: 5min
completed: 2026-02-26
---

# Phase 03 Plan 02: Women's Portal Dashboard, Tasks, Evidence Submission Summary

**AppShell-wrapped authenticated portal with gradient KPI dashboard, 5-tab task list, APG-guided task detail, 5-type evidence submission, pipeline-tracked submissions, and rework/resubmit flow -- all driven by MSW mock data via TanStack Query**

## Performance

- **Duration:** 5 min
- **Started:** 2026-02-26T13:27:14Z
- **Completed:** 2026-02-26T13:32:28Z
- **Tasks:** 2
- **Files modified:** 26

## Accomplishments
- Complete authenticated Women's Portal experience: AppShell with 8-item sidebar navigation
- Dashboard with 3 gradient KPI cards (Active Tasks, Earnings, Skills Growing), APG Activity Feed (5 action types), and Active Tasks Summary
- Task management flow: list (5 status-filtered tabs) -> detail (APG guidance, skill tags, hours, deadline) -> evidence submission (5 types) -> status tracking (pipeline visualization) -> rework (mentor feedback + resubmit)
- MSW mock data layer: 8 tasks across all statuses, evidence packs with rework items, 5 APG activities
- All user-facing text via next-intl useTranslations() -- zero hardcoded strings

## Task Commits

Each task was committed atomically:

1. **Task 1: AppShell layout + MSW factories/handlers** - `bedb4fd` (feat)
2. **Task 2: Dashboard, task list, evidence submission, status tracking** - `5da0fe7` (feat)

## Files Created/Modified

- `apps/women-portal/src/app/(app)/layout.tsx` - AppShell with 8-item sidebar + TopBar
- `apps/women-portal/src/app/(app)/dashboard/page.tsx` - Dashboard page with KPIs + APG feed + active tasks
- `apps/women-portal/src/app/(app)/tasks/page.tsx` - Task list page with status tabs
- `apps/women-portal/src/app/(app)/tasks/[taskId]/page.tsx` - Task detail page
- `apps/women-portal/src/app/(app)/tasks/[taskId]/submit/page.tsx` - Evidence submission page
- `apps/women-portal/src/app/(app)/tasks/[taskId]/rework/page.tsx` - Rework request page
- `apps/women-portal/src/app/(app)/submissions/page.tsx` - Submission tracking page
- `apps/women-portal/src/components/dashboard/kpi-row.tsx` - 3 gradient KPI cards using GradientCard + KPIStatCard
- `apps/women-portal/src/components/dashboard/apg-activity-widget.tsx` - APG Activity Feed with type mapping
- `apps/women-portal/src/components/dashboard/active-tasks-summary.tsx` - Active tasks with badges
- `apps/women-portal/src/components/tasks/task-list-with-tabs.tsx` - 5-tab filtered task list
- `apps/women-portal/src/components/tasks/task-detail-view.tsx` - Task brief, APG guidance, skills, meta
- `apps/women-portal/src/components/tasks/evidence-submission-form.tsx` - 5-type tabbed evidence form with FileUpload
- `apps/women-portal/src/components/tasks/submission-status-tracker.tsx` - Pipeline visualization tracker
- `apps/women-portal/src/components/tasks/rework-request-view.tsx` - Mentor feedback + rework items + resubmit
- `apps/women-portal/src/lib/msw/factories/task.ts` - 8 mock tasks across all statuses
- `apps/women-portal/src/lib/msw/factories/evidence.ts` - Evidence packs with rework variant
- `apps/women-portal/src/lib/msw/factories/apg.ts` - 5 APG activity types
- `apps/women-portal/src/lib/msw/factories/common.ts` - Shared randomId/isoNow helpers
- `apps/women-portal/src/lib/msw/handlers/tasks.ts` - GET /api/tasks, GET /api/tasks/:id
- `apps/women-portal/src/lib/msw/handlers/evidence.ts` - POST + GET /api/tasks/:id/evidence
- `apps/women-portal/src/lib/msw/handlers/apg.ts` - GET /api/apg/activities
- `apps/women-portal/src/lib/msw/handlers/index.ts` - Added task/evidence/apg handlers
- `apps/women-portal/src/messages/en.json` - Added dashboard/tasks/evidence/submissions/rework keys

## Decisions Made

- **APGActivity type mapping:** @glimmora/types uses hyphens (task-assigned), APGFeed component uses underscores (task_assigned). Created explicit TYPE_MAP to bridge the two.
- **Evidence rework pre-seeding:** Pre-seeded task-005 with rework evidence pack in MSW handlers so rework view always has data to display.
- **Common factory helper:** Created `common.ts` with `randomId` and `isoNow` utilities shared across all MSW factories to avoid duplication.
- **Pipeline visualization:** Used simple colored div bars in submission tracker rather than TimelineBar component, which is designed for milestone timelines and would be overweight for inline card layout.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Created common.ts factory helper**
- **Found during:** Task 1
- **Issue:** Plan references `randomId` and `isoNow` from `./common` but no common.ts existed
- **Fix:** Created `apps/women-portal/src/lib/msw/factories/common.ts` with both helpers
- **Files modified:** `apps/women-portal/src/lib/msw/factories/common.ts`
- **Committed in:** bedb4fd (Task 1 commit)

**2. [Rule 2 - Missing Critical] Added rework evidence pack factory and pre-seeded handler**
- **Found during:** Task 1
- **Issue:** Rework view needs evidence pack with reviewerFeedback and reworkItems to display, but plan's evidence factory only created basic packs without feedback
- **Fix:** Added `createMockReworkEvidencePack()` factory and pre-seeded task-005 in evidence handler
- **Files modified:** `apps/women-portal/src/lib/msw/factories/evidence.ts`, `apps/women-portal/src/lib/msw/handlers/evidence.ts`
- **Committed in:** bedb4fd (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 missing critical)
**Impact on plan:** Both fixes necessary for correctness. Common helper was implied by plan's imports. Rework evidence pack ensures rework view has data to render.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Authenticated portal pages complete, ready for 03-03 (University Portal equivalent)
- AppShell pattern established, reusable for university portal with different navItems
- MSW factory pattern proven, ready for university-specific factories
- Dashboard/task components can be extracted to shared package if university portal needs similar patterns

---
*Phase: 03-womens-portal-university-portal*
*Completed: 2026-02-26*
