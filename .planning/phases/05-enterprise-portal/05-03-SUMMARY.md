---
phase: 05-enterprise-portal
plan: 03
subsystem: ui, api
tags: [enterprise, dashboard, projects, gradient-card, apg-feed, tabs, anonymized-team, msw]

# Dependency graph
requires:
  - phase: 01-monorepo-infrastructure-ds-foundation
    provides: Monorepo, @glimmora/ui components (GradientCard, APGFeed, Tabs, AnonymizedTeamCard, Card, Badge, Progress, PageHeader), @glimmora/types (Project, ProjectMilestone, APGActivity)
  - phase: 02-design-system-completion
    provides: GradientCard variants (primary/nature), APGFeed timeline component, AnonymizedTeamCard with skill overflow, Tabs with Radix
  - phase: 05-enterprise-portal
    plan: 01
    provides: Enterprise AppShell layout, auth store, MSW handler infrastructure, enterprise types
provides:
  - Enterprise dashboard with 4 GradientCard KPIs and APG Activity Feed
  - Active projects list with ProjectCard grid
  - 7-tab project detail (Overview + Team Summary fully functional, 5 placeholder tabs)
  - MSW handlers for dashboard and project endpoints
affects: [05-04-timeline-gantt, 05-05-evidence-payment-compliance, 05-06-gap-fixes]

# Tech tracking
tech-stack:
  added: []
  patterns: [hash-based tab state for bookmarkable client-side tabs, dashboard KPI grid with GradientCard variants]

key-files:
  created:
    - apps/enterprise-portal/src/app/(app)/dashboard/page.tsx
    - apps/enterprise-portal/src/app/(app)/projects/page.tsx
    - apps/enterprise-portal/src/app/(app)/projects/[projectId]/page.tsx
    - apps/enterprise-portal/src/components/dashboard/active-projects-widget.tsx
    - apps/enterprise-portal/src/components/dashboard/pending-actions-widget.tsx
    - apps/enterprise-portal/src/components/dashboard/budget-widget.tsx
    - apps/enterprise-portal/src/components/dashboard/health-metrics-widget.tsx
    - apps/enterprise-portal/src/components/dashboard/index.ts
    - apps/enterprise-portal/src/components/projects/project-card.tsx
    - apps/enterprise-portal/src/components/projects/project-detail-tabs.tsx
    - apps/enterprise-portal/src/components/projects/project-overview.tsx
    - apps/enterprise-portal/src/components/projects/team-summary-grid.tsx
    - apps/enterprise-portal/src/components/projects/index.ts
    - apps/enterprise-portal/src/lib/msw/factories/project.ts
    - apps/enterprise-portal/src/lib/msw/handlers/dashboard.ts
    - apps/enterprise-portal/src/lib/msw/handlers/projects.ts
  modified:
    - apps/enterprise-portal/src/lib/msw/handlers/index.ts

key-decisions:
  - "3rd GradientCard uses inline style={{ background: 'linear-gradient(135deg, #4A6741 0%, #3A8FA0 100%)' }} per prior decision"
  - "URL hash-based tab state: window.location.hash read on mount + hashchange listener for bookmarkable tabs"
  - "AnonymizedTeamCard with tier Badge overlay -- no real contributor names shown"
  - "MSW /projects/completed route defined BEFORE /projects/:id to prevent path shadowing"

patterns-established:
  - "Dashboard KPI pattern: 4 GradientCard in responsive grid (1/2/4 cols) with variant cycling"
  - "7-tab project detail: client-side Tabs with hash state, placeholder content for future plans"
  - "Project list with ProjectCard: health dot + status badge + completion progress + timeline"
  - "Team display: AnonymizedTeamCard grid with tier badges, no identity leakage"

# Metrics
duration: 7min
completed: 2026-02-27
---

# Phase 5 Plan 3: Enterprise Dashboard and Project Detail Summary

**Enterprise dashboard with 4 GradientCard KPIs (primary/primary/inline-forest-teal/nature) + APG Activity Feed, projects list with health-status cards, and 7-tab project detail with hash-based tab state (Overview + Team Summary functional, 5 placeholder tabs for Plans 05-04/05-05)**

## Performance

- **Duration:** 7 min
- **Started:** 2026-02-27T05:01:22Z
- **Completed:** 2026-02-27T05:08:24Z
- **Tasks:** 2
- **Files modified:** 17

## Accomplishments
- Enterprise dashboard page with 4 GradientCard KPIs: Tasks Complete % (primary), Evidence Packs Pending (primary), Payments Released (inline forest-to-teal gradient), Timeline Health (nature)
- APG Activity Feed on dashboard using APGFeed from @glimmora/ui with 6 mock actions (team_formed, milestone_completed, evidence_submitted, payment_triggered, task_completed, risk_mitigated)
- Dashboard widgets: ActiveProjectsWidget, PendingActionsWidget, BudgetWidget, HealthMetricsWidget
- Projects list page with ProjectCard grid showing status badges, health indicator dots, completion progress bars, and timeline dates
- 7-tab project detail page using client-side Tabs from @glimmora/ui with URL hash-based state for bookmarkability
- Overview tab fully functional: milestone progress list, budget summary (released/pending/remaining), APGFeed for project-specific activity
- Team Summary tab fully functional: AnonymizedTeamCard grid with tier badges -- no contributor names, privacy enforced at component level
- 5 placeholder tabs (Timeline, Evidence Packs, Rework Requests, Escalation Centre, Payment Release) ready for Plans 05-04 and 05-05
- MSW handlers for dashboard summary, projects list, project detail, timeline, APG activity, team, and project hold endpoints
- MSW factories for projects, milestones, team members, and APG activity

## Task Commits

Each task was committed atomically:

1. **Task 1: Enterprise dashboard with GradientCard KPIs and APG activity feed** - `346780a` (feat)
2. **Task 2: Projects list, 7-tab project detail (Overview + Team Summary), MSW handlers** - `c2b9594` (feat)

## Files Created/Modified
- `apps/enterprise-portal/src/app/(app)/dashboard/page.tsx` - Enterprise dashboard with 4 KPI cards and APG feed
- `apps/enterprise-portal/src/components/dashboard/active-projects-widget.tsx` - Active projects card with health dots and progress
- `apps/enterprise-portal/src/components/dashboard/pending-actions-widget.tsx` - Pending actions with icons and links
- `apps/enterprise-portal/src/components/dashboard/budget-widget.tsx` - Budget overview with released/pending/remaining
- `apps/enterprise-portal/src/components/dashboard/health-metrics-widget.tsx` - On-time delivery, rework rate, avg review time
- `apps/enterprise-portal/src/components/dashboard/index.ts` - Barrel export for dashboard widgets
- `apps/enterprise-portal/src/app/(app)/projects/page.tsx` - Active projects list with ProjectCard grid
- `apps/enterprise-portal/src/app/(app)/projects/[projectId]/page.tsx` - Project detail page with breadcrumb, status badge, health indicator
- `apps/enterprise-portal/src/components/projects/project-card.tsx` - Project card with status, health, completion, timeline
- `apps/enterprise-portal/src/components/projects/project-detail-tabs.tsx` - 7-tab layout with hash-based state
- `apps/enterprise-portal/src/components/projects/project-overview.tsx` - Milestones, budget summary, APGFeed
- `apps/enterprise-portal/src/components/projects/team-summary-grid.tsx` - AnonymizedTeamCard grid with tier badges
- `apps/enterprise-portal/src/components/projects/index.ts` - Barrel export for project components
- `apps/enterprise-portal/src/lib/msw/factories/project.ts` - Mock factories for projects, milestones, team, APG activity
- `apps/enterprise-portal/src/lib/msw/handlers/dashboard.ts` - GET /api/enterprise/dashboard handler
- `apps/enterprise-portal/src/lib/msw/handlers/projects.ts` - 7 project endpoint handlers
- `apps/enterprise-portal/src/lib/msw/handlers/index.ts` - Updated to register dashboard + project handlers

## Decisions Made
- **3rd GradientCard inline gradient:** Used `style={{ background: 'linear-gradient(135deg, #4A6741 0%, #3A8FA0 100%)' }}` per prior decision from 04-02, overriding the CVA `nature` variant for this specific card
- **Hash-based tab state:** `window.location.hash` read on mount with `hashchange` event listener for bookmarkable tab navigation without route changes
- **MSW route ordering:** `/projects/completed` defined before `/projects/:id` in handler array to prevent path parameter shadowing
- **AnonymizedTeamCard tier display:** Tier badge placed below the card as overlay, mapping tier names to Badge status variants (emerging=normal, developing=inprogress, proficient=done, expert=atrisk)

## Deviations from Plan

None - plan executed exactly as written.

Note: A partially completed 05-02 plan had left untracked blueprint editor files in the working directory. These files were already present and did not affect this plan's execution. The `handlers/index.ts` already included `blueprintHandlers` from the partial 05-02 execution.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Dashboard and project detail pages are fully functional with MSW mock data
- 5 placeholder tabs in project detail ready for:
  - Plan 05-04: Timeline tab (Gantt view)
  - Plan 05-05: Evidence Packs, Rework Requests, Escalation Centre, Payment Release tabs
- Project MSW factories and handlers available for reuse by subsequent plans
- No blockers for 05-04 or 05-05

---
*Phase: 05-enterprise-portal*
*Completed: 2026-02-27*
