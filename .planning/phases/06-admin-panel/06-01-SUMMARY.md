---
phase: 06-admin-panel
plan: 01
subsystem: admin-panel
tags: [admin-types, auth-store, dashboard, msw, gradient-card, tanstack-query]
depends_on:
  requires: [01-monorepo-infrastructure-ds-foundation, 02-design-system-completion]
  provides: [admin-types, admin-auth-store, admin-dashboard, admin-msw-foundation]
  affects: [06-02, 06-03, 06-04, 06-05]
tech-stack:
  added: ["@tanstack/react-table@^8.21.3", "lucide-react@^0.575.0", "date-fns@^4.1.0", "recharts@^2.15.4", "@react-pdf/renderer@^4.3.2"]
  patterns: [msw-handler-directory, zustand-persist-auth, tanstack-query-polling, gradient-card-kpi]
key-files:
  created:
    - packages/types/src/admin.ts
    - apps/admin-panel/src/store/auth-store.ts
    - apps/admin-panel/src/components/dev/role-switcher.tsx
    - apps/admin-panel/src/app/(pre-auth)/layout.tsx
    - apps/admin-panel/src/app/(pre-auth)/login/page.tsx
    - apps/admin-panel/src/app/(app)/layout.tsx
    - apps/admin-panel/src/app/(app)/dashboard/page.tsx
    - apps/admin-panel/src/components/dashboard/stats-grid.tsx
    - apps/admin-panel/src/components/dashboard/pending-actions-card.tsx
    - apps/admin-panel/src/components/dashboard/system-alert-feed.tsx
    - apps/admin-panel/src/components/dashboard/index.ts
    - apps/admin-panel/src/lib/msw/factories/common.ts
    - apps/admin-panel/src/lib/msw/factories/system-alert.ts
    - apps/admin-panel/src/lib/msw/handlers/auth.ts
    - apps/admin-panel/src/lib/msw/handlers/dashboard.ts
    - apps/admin-panel/src/lib/msw/handlers/index.ts
  modified:
    - packages/types/src/index.ts
    - apps/admin-panel/package.json
    - apps/admin-panel/src/app/page.tsx
    - apps/admin-panel/src/lib/msw/handlers.ts
    - pnpm-lock.yaml
decisions:
  - id: "06-01-01"
    decision: "Login page at (pre-auth)/login/page.tsx (not (pre-auth)/page.tsx) to avoid route conflict with root page.tsx redirect"
    reason: "Root page.tsx redirects to /login; (pre-auth)/page.tsx would also map to / causing Next.js route collision"
metrics:
  duration: "6 min"
  completed: "2026-02-27"
---

# Phase 6 Plan 1: Admin Types, Auth Store, Dashboard, MSW Foundation Summary

Admin-specific types covering all 23 admin domain entities (AP-01 through AP-23), auth store with zustand persist and super_admin/standard_admin role switching, AppShell layout with 8-nav sidebar, platform overview dashboard with 6 GradientCard KPIs (30s TanStack Query polling + manual refresh), system alert feed with severity indicators and dismiss, pending actions card with deep-links, DevTools role-switcher overlay, and MSW handler directory structure.

## Tasks Completed

| # | Task | Commit | Key Files |
|---|------|--------|-----------|
| 1 | Create admin types, install dependencies, create auth store and DevTools role-switcher | c4261e0 | admin.ts, auth-store.ts, role-switcher.tsx, package.json |
| 2 | Build pre-auth login, AppShell layout, dashboard, and MSW handlers | 1ba271d | layout.tsx, dashboard/page.tsx, stats-grid.tsx, pending-actions-card.tsx, system-alert-feed.tsx, handlers/ |

## Decisions Made

1. **Login page at (pre-auth)/login/page.tsx** -- Plan specified `(pre-auth)/page.tsx` but root `page.tsx` already maps to `/` with a redirect to `/login`. Placing login at `(pre-auth)/login/page.tsx` follows the enterprise portal pattern and avoids Next.js route group collision.

## Deviations from Plan

### Minor Adjustments

**1. [Login route path]** Plan listed `apps/admin-panel/src/app/(pre-auth)/page.tsx` as the login page file. Created at `(pre-auth)/login/page.tsx` instead to avoid conflict with root `page.tsx` redirect. This matches the established enterprise portal pattern.

No other deviations. Plan executed as written.

## Verification Results

- `pnpm --filter @glimmora/admin-panel build` passes cleanly (7 static routes generated)
- Type-check (`tsc --noEmit`) passes with zero errors
- All 5 direct dependencies installed: @tanstack/react-table, lucide-react, date-fns, recharts, @react-pdf/renderer
- AdminRole type exists in admin.ts and exported from index.ts
- Auth store has setAdminRole method with AdminRole enum
- AppShell layout has 8 nav items with lucide-react icons
- Dashboard has refetchInterval: 30_000 and manual refresh button
- 6 GradientCards: 2 primary, 1 inline Forest->Teal gradient, 2 nature, 1 primary
- RoleSwitcherOverlay included in app layout
- MSW handlers directory structure: auth.ts, dashboard.ts, index.ts

## Next Phase Readiness

All admin foundation types, auth store, and dashboard are in place. Ready for:
- 06-02: User management pages (AdminUserListItem, VerificationQueueItem types ready)
- 06-03: Dispute resolution (Dispute, DisputeEvidence, DisputeDecision types ready)
- 06-04: Reports and content management (PlatformReportData, SkillTaxonomyTag types ready)
- 06-05: APG config and audit log (APGConfigEntry, PlatformAuditEntry types ready)
