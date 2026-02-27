---
phase: 05-enterprise-portal
plan: 04
subsystem: ui
tags: [enterprise, gantt, timeline, recharts, data-table, milestones]

# Dependency graph
requires:
  - phase: 01-monorepo-infrastructure-ds-foundation
    provides: Monorepo, @glimmora/ui components (DataTable, Badge, Button), @glimmora/types (ProjectMilestone)
  - phase: 02-design-system-completion
    provides: DataTable<T> with TanStack ColumnDef, Badge with status variants, recharts in @glimmora/ui
  - phase: 05-enterprise-portal
    plan: 03
    provides: 7-tab project detail with Timeline placeholder tab, MSW handlers for /projects/:id/timeline, project milestone factories
provides:
  - GanttTimeline component with Recharts vertical bar chart and health-coded milestone bars
  - MilestoneListView with DataTable showing milestone columns (name, status, dates, health, tasks)
  - TimelineView toggle container switching between Gantt and List views
  - Timeline tab fully functional in project detail (placeholder removed)
affects: [05-05-evidence-payment-compliance, 05-06-gap-fixes]

# Tech tracking
tech-stack:
  added: [recharts (direct dep in enterprise-portal for pnpm strict mode)]
  patterns: [Recharts BarChart vertical layout with stacked offset/duration for Gantt visualization, view toggle with useState and Button variant switching]

key-files:
  created:
    - apps/enterprise-portal/src/components/projects/gantt-timeline.tsx
    - apps/enterprise-portal/src/components/projects/milestone-list-view.tsx
    - apps/enterprise-portal/src/components/projects/timeline-view.tsx
  modified:
    - apps/enterprise-portal/src/components/projects/project-detail-tabs.tsx
    - apps/enterprise-portal/src/components/projects/index.ts
    - apps/enterprise-portal/package.json

key-decisions:
  - "recharts added as direct dependency to enterprise-portal (pnpm strict mode requires explicit dep, not just transitive via @glimmora/ui)"
  - "Gantt uses stacked Bar trick: invisible offset bar + visible duration bar, both with stackId='gantt'"
  - "Health status mapped to CSS variables: completed=status-success, in-progress=brand-primary, pending=border, overdue=status-urgent"
  - "Milestone health in list view derived from status: completed/in-progress='On Track', pending='Pending', overdue='Delayed'"

patterns-established:
  - "Recharts Gantt pattern: BarChart layout='vertical' with transparent offset Bar + colored duration Bar stacked via stackId"
  - "View toggle pattern: useState with Button variant='primary' for selected, variant='ghost' for unselected"
  - "ReferenceLine for today indicator: dashed stroke, only rendered when within project date range"

# Metrics
duration: 3min
completed: 2026-02-27
---

# Phase 5 Plan 4: Timeline Gantt Chart and List View Summary

**Recharts-based Gantt timeline with health-coded milestone bars, DataTable list view alternative, Gantt/List toggle, and Timeline tab integration replacing placeholder**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-27T05:13:04Z
- **Completed:** 2026-02-27T05:16:30Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- GanttTimeline component using Recharts BarChart in vertical layout mode with stacked offset/duration bars for horizontal Gantt visualization
- Health-coded milestone bars via Cell component: green (completed), terracotta (in-progress), grey (pending), red (overdue) using CSS variables
- Today indicator as dashed ReferenceLine, conditionally rendered only when within project date range
- XAxis tick labels formatted with date-fns format() showing readable dates (e.g., "Feb 1")
- MilestoneListView with DataTable showing 6 columns: Name, Status badge, Target Date, Completed Date, Health dot + text, Task Count
- TimelineView container with Gantt/List toggle using Button primary/ghost variants
- Timeline tab in project detail now renders TimelineView (placeholder content removed)
- Barrel exports updated to include all 3 new components

## Task Commits

Each task was committed atomically:

1. **Task 1: GanttTimeline with Recharts vertical bar chart, today indicator, and health-coded bars** - `af542fa` (feat)
2. **Task 2: MilestoneListView, TimelineView toggle, and Timeline tab integration** - `74882b9` (feat)

## Files Created/Modified
- `apps/enterprise-portal/src/components/projects/gantt-timeline.tsx` - Recharts BarChart vertical layout Gantt with health-coded bars, today indicator, dynamic height
- `apps/enterprise-portal/src/components/projects/milestone-list-view.tsx` - DataTable with ColumnDef<ProjectMilestone> columns: name, status badge, dates, health, task count
- `apps/enterprise-portal/src/components/projects/timeline-view.tsx` - Container with Gantt/List toggle, TanStack useQuery for milestone data
- `apps/enterprise-portal/src/components/projects/project-detail-tabs.tsx` - Timeline tab now renders TimelineView (placeholder removed)
- `apps/enterprise-portal/src/components/projects/index.ts` - Barrel exports for GanttTimeline, MilestoneListView, TimelineView
- `apps/enterprise-portal/package.json` - Added recharts as direct dependency

## Decisions Made
- **recharts direct dependency:** Added `recharts: ^2.15.4` to enterprise-portal package.json because pnpm strict mode does not hoist transitive dependencies from @glimmora/ui
- **Stacked bar Gantt trick:** Invisible offset Bar (fill="transparent") + visible duration Bar, both sharing `stackId="gantt"`, creates horizontal Gantt bars positioned at correct dates
- **Health-to-CSS-variable mapping:** completed=`var(--color-status-success)`, in-progress=`var(--color-brand-primary)`, pending=`var(--color-border)`, overdue=`var(--color-status-urgent)` for theme consistency
- **List view health derivation:** Milestone status maps to health label (completed/in-progress="On Track", pending="Pending", overdue="Delayed") with colored dot indicator

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added recharts as direct dependency to enterprise-portal**
- **Found during:** Task 1 (GanttTimeline build)
- **Issue:** `import from 'recharts'` failed with "Cannot find module 'recharts'" because pnpm strict mode does not expose transitive deps from @glimmora/ui
- **Fix:** Added `"recharts": "^2.15.4"` to enterprise-portal package.json and ran `pnpm install`
- **Files modified:** apps/enterprise-portal/package.json, pnpm-lock.yaml
- **Verification:** Build passes with recharts imports resolving correctly
- **Committed in:** af542fa (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Required for build to succeed. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Timeline tab fully functional with Gantt and List views
- 4 placeholder tabs remain for Plan 05-05: Evidence Packs, Rework Requests, Escalation Centre, Payment Release
- MSW handlers already serve milestone data at /api/enterprise/projects/:id/timeline
- No blockers for 05-05

---
*Phase: 05-enterprise-portal*
*Completed: 2026-02-27*
