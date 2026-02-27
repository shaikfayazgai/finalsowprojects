---
phase: 05-enterprise-portal
plan: 01
subsystem: ui, auth, api
tags: [enterprise, sow, otp, onboarding, msw, zustand, radix-otp, file-upload, intelligence]

# Dependency graph
requires:
  - phase: 01-monorepo-infrastructure-ds-foundation
    provides: Monorepo, @glimmora/ui components (FileUpload, Stepper, DataTable, AppShell, Sidebar), @glimmora/types base types
  - phase: 02-design-system-completion
    provides: Badge, Progress, Card, PageHeader, Spinner, GradientCard components
provides:
  - Enterprise domain types in @glimmora/types (Blueprint, SOWIntelligence, PaymentRecord, ESGReportData, TeamMember, etc.)
  - OTPInput component in @glimmora/ui wrapping Radix unstable_OneTimePasswordField
  - Enterprise Portal pre-auth login and 4-step onboarding flow
  - AppShell layout with enterprise sidebar navigation
  - SOW upload with version-aware upload (existingSOWId) and processing animation
  - APG intelligence display showing extracted clauses, deliverables, timeline, budget, compliance, ambiguities
  - SOW version history and archive pages
  - Enterprise auth store with Zustand persist
  - MSW handlers for auth, onboarding, and SOW endpoints
affects: [05-02-blueprint-editor, 05-03-project-dashboard, 05-04-evidence-payment, 05-05-compliance-settings, 05-06-gap-fixes]

# Tech tracking
tech-stack:
  added: [lucide-react (enterprise-portal), @react-pdf/renderer (enterprise-portal), date-fns (enterprise-portal), @tanstack/react-table (enterprise-portal)]
  patterns: [enterprise onboarding 4-step flow, SOW version-aware upload with existingSOWId, APG intelligence display, MSW handlers/ directory for enterprise]

key-files:
  created:
    - packages/types/src/enterprise.ts
    - packages/ui/src/components/otp-input/otp-input.tsx
    - apps/enterprise-portal/src/app/(pre-auth)/login/page.tsx
    - apps/enterprise-portal/src/app/(app)/layout.tsx
    - apps/enterprise-portal/src/app/(app)/sow/upload/page.tsx
    - apps/enterprise-portal/src/app/(app)/sow/[sowId]/intelligence/page.tsx
    - apps/enterprise-portal/src/app/(app)/sow/[sowId]/versions/page.tsx
    - apps/enterprise-portal/src/app/(app)/sow/archive/page.tsx
    - apps/enterprise-portal/src/components/sow/sow-upload-form.tsx
    - apps/enterprise-portal/src/components/sow/intelligence-display.tsx
    - apps/enterprise-portal/src/components/sow/version-history-list.tsx
    - apps/enterprise-portal/src/components/sow/sow-archive-table.tsx
    - apps/enterprise-portal/src/store/auth-store.ts
    - apps/enterprise-portal/src/lib/msw/handlers/auth.ts
    - apps/enterprise-portal/src/lib/msw/handlers/onboarding.ts
    - apps/enterprise-portal/src/lib/msw/handlers/sow.ts
    - apps/enterprise-portal/src/lib/msw/factories/sow.ts
  modified:
    - packages/types/src/index.ts
    - packages/types/src/sow.ts
    - packages/ui/src/index.ts
    - apps/enterprise-portal/src/lib/msw/handlers.ts
    - apps/enterprise-portal/package.json

key-decisions:
  - "@tanstack/react-table added as direct dependency to enterprise-portal for ColumnDef type import (pnpm strict mode requires it)"
  - "SOW upload form checks existingSOWId from URL search params -- if present shows version banner and passes in FormData"
  - "MSW handlers migrated from flat canary file to handlers/ directory structure (auth, onboarding, sow)"
  - "Pre-auth login at (pre-auth)/login/page.tsx, root page.tsx redirects to /login"

patterns-established:
  - "Enterprise onboarding: 4-step Stepper (Company, Billing, Team, First SOW) with skip option on Team and First SOW"
  - "SOW version-aware upload: existingSOWId query param triggers version banner and passes ID in FormData"
  - "APG intelligence display: structured sections (objective, confidence, clauses, deliverables, timeline, budget, compliance, ambiguities)"
  - "SOW archive DataTable with Upload New Version action passing existingSOWId"

# Metrics
duration: 7min
completed: 2026-02-27
---

# Phase 5 Plan 1: Enterprise Portal Foundation Summary

**Enterprise types in @glimmora/types, OTPInput in @glimmora/ui, pre-auth login, 4-step onboarding, AppShell with enterprise sidebar, SOW upload with APG processing animation, intelligence display, version history, and SOW archive -- all with MSW handlers**

## Performance

- **Duration:** 7 min
- **Started:** 2026-02-27T04:47:37Z
- **Completed:** 2026-02-27T04:55:27Z
- **Tasks:** 3
- **Files modified:** 42

## Accomplishments
- All enterprise domain types (Blueprint, SOWIntelligence, PaymentRecord, ESGReportData, TeamMember, OrganizationProfile, etc.) available in @glimmora/types for all subsequent plans
- OTPInput component in @glimmora/ui wrapping Radix unstable_OneTimePasswordField with numeric validation -- ready for Plans 05-02 and 05-05
- Complete enterprise pre-auth flow: login page with email/password, 4-step onboarding (Company Verification, Billing & Legal, Team Setup, Upload First SOW)
- AppShell layout with 9-item enterprise sidebar (Dashboard, Upload SOW, SOW Archive, Active Projects, Completed, PoDL Reports, ESG Reports, Payments, Settings)
- SOW upload flow: FileUpload (.pdf,.docx) -> uploading/processing animation -> redirect to APG intelligence display
- Version-aware SOW upload: existingSOWId query param triggers "Uploading as new version" banner
- APG intelligence display showing all SOWIntelligence fields: objective, confidence score, clauses by type, deliverables checklist, timeline table, budget range, compliance flags, and ambiguities
- SOW version history with latest indicator and download links
- SOW archive DataTable with Upload New Version action (navigates to upload with existingSOWId)
- Full MSW handler suite: auth, onboarding, SOW upload/intelligence/versions/archive

## Task Commits

Each task was committed atomically:

1. **Task 1: Enterprise types, OTPInput, portal dependencies** - `07b88fc` (feat)
2. **Task 2: Pre-auth login, 4-step onboarding, AppShell layout, auth store** - `48fef69` (feat)
3. **Task 3: SOW upload, APG intelligence, version history, archive, MSW handlers** - `7ed752f` (feat)

## Files Created/Modified
- `packages/types/src/enterprise.ts` - All enterprise domain types (26 types/interfaces)
- `packages/types/src/index.ts` - Re-exports enterprise types
- `packages/types/src/sow.ts` - Added versionNumber and parentSowId to SOW interface
- `packages/ui/src/components/otp-input/otp-input.tsx` - OTPInput wrapping Radix OneTimePasswordField
- `packages/ui/src/index.ts` - Exports OTPInput
- `apps/enterprise-portal/src/app/(pre-auth)/login/page.tsx` - Enterprise login page
- `apps/enterprise-portal/src/app/(pre-auth)/onboarding/*/page.tsx` - 4 onboarding route pages
- `apps/enterprise-portal/src/components/onboarding/*.tsx` - 4 onboarding step components
- `apps/enterprise-portal/src/app/(app)/layout.tsx` - AppShell with enterprise sidebar
- `apps/enterprise-portal/src/app/(app)/sow/upload/page.tsx` - SOW upload page
- `apps/enterprise-portal/src/app/(app)/sow/[sowId]/intelligence/page.tsx` - APG intelligence page
- `apps/enterprise-portal/src/app/(app)/sow/[sowId]/versions/page.tsx` - Version history page
- `apps/enterprise-portal/src/app/(app)/sow/archive/page.tsx` - SOW archive page
- `apps/enterprise-portal/src/components/sow/*.tsx` - SOW components (upload form, intelligence display, version list, archive table)
- `apps/enterprise-portal/src/store/auth-store.ts` - Zustand persist auth store
- `apps/enterprise-portal/src/lib/msw/handlers/*.ts` - MSW handlers (auth, onboarding, sow)
- `apps/enterprise-portal/src/lib/msw/factories/*.ts` - MSW factories (common, sow)

## Decisions Made
- **@tanstack/react-table as direct dependency:** Enterprise-portal needed ColumnDef type import for SOW archive DataTable; pnpm strict mode requires explicit dependency declaration
- **SOW version-aware upload pattern:** existingSOWId from URL search params triggers version banner in upload form and passes ID in FormData for backend to link versions
- **Login at (pre-auth)/login/page.tsx:** Root page.tsx redirects to /login, keeping pre-auth layout group clean
- **MSW handlers directory migration:** Moved from flat canary handlers.ts to handlers/ directory with auth.ts, onboarding.ts, sow.ts, index.ts

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added @tanstack/react-table as direct dependency**
- **Found during:** Task 3 (SOW archive table)
- **Issue:** ColumnDef type import from @tanstack/react-table failed -- package only in @glimmora/ui, not enterprise-portal
- **Fix:** Installed @tanstack/react-table as direct dependency in enterprise-portal
- **Files modified:** apps/enterprise-portal/package.json, pnpm-lock.yaml
- **Verification:** Build passes with ColumnDef import
- **Committed in:** 7ed752f (Task 3 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Necessary for TypeScript compilation. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Enterprise types available for Plans 05-02 through 05-06 to import
- OTPInput available for blueprint approval (05-02) and payment release (05-05)
- SOW upload flow complete -- blueprint editor (05-02) can link from intelligence display
- AppShell layout and sidebar ready for all subsequent app pages
- Auth store and MSW handler infrastructure established for additional endpoint handlers
- No blockers for 05-02 (Blueprint Editor)

---
*Phase: 05-enterprise-portal*
*Completed: 2026-02-27*
