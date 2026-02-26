---
phase: 04-mentor-portal
plan: 04
subsystem: ui
tags: [react, nextjs, tanstack-query, msw, mentor-portal, profile, messaging, settings]

# Dependency graph
requires:
  - phase: 04-02
    provides: Review queue, SLA timer, dialog patterns, GradientCard KPI cards, Button variant="secondary"

provides:
  - Mentor profile page with tier badge, GradientCard KPIs, TierProgressCard, ImpactMetricsCard, expertise tags
  - SkillTagVerificationRequest queue with anonymous contributor seeds, verify/dispute actions
  - DisputeDialog with required reason validation
  - MentorMessagesPage: reply-only async messaging with senderRole display
  - Settings hub with 3 sub-pages: capacity (Slider + Switch), skills (checkboxes + tag input), notifications (4x2 grid)
  - MSW handlers: profile, skill-verification, conversations, notification-preferences

affects:
  - 05-enterprise-portal
  - 06-admin-panel

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Mentor notification categories use custom keys (review_assignments/sla_reminders/decision_outcomes/platform_updates) not @glimmora/types NotificationCategory
    - Reply-only messaging: no compose button, senderRole displayed as 'You'/'Platform'
    - TierProgressCard: computes next tier requirements from TIER_REQUIREMENTS lookup map
    - SkillTagVerificationRequest uses contributorSeed (anonymous identifier) not contributor name

key-files:
  created:
    - apps/mentor-portal/src/app/(app)/profile/page.tsx
    - apps/mentor-portal/src/app/(app)/skill-verification/page.tsx
    - apps/mentor-portal/src/app/(app)/messages/page.tsx
    - apps/mentor-portal/src/app/(app)/settings/page.tsx
    - apps/mentor-portal/src/app/(app)/settings/capacity/page.tsx
    - apps/mentor-portal/src/app/(app)/settings/skills/page.tsx
    - apps/mentor-portal/src/app/(app)/settings/notifications/page.tsx
    - apps/mentor-portal/src/components/profile/mentor-profile-page.tsx
    - apps/mentor-portal/src/components/profile/tier-progress-card.tsx
    - apps/mentor-portal/src/components/profile/impact-metrics-card.tsx
    - apps/mentor-portal/src/components/profile/index.ts
    - apps/mentor-portal/src/components/skill-verification/verification-queue.tsx
    - apps/mentor-portal/src/components/skill-verification/verification-item-card.tsx
    - apps/mentor-portal/src/components/skill-verification/dispute-dialog.tsx
    - apps/mentor-portal/src/components/skill-verification/index.ts
    - apps/mentor-portal/src/components/messages/mentor-messages-page.tsx
    - apps/mentor-portal/src/components/messages/index.ts
    - apps/mentor-portal/src/components/settings/capacity-settings-form.tsx
    - apps/mentor-portal/src/components/settings/skills-settings-form.tsx
    - apps/mentor-portal/src/components/settings/notification-prefs-form.tsx
    - apps/mentor-portal/src/components/settings/index.ts
    - apps/mentor-portal/src/lib/msw/handlers/profile.ts
    - apps/mentor-portal/src/lib/msw/handlers/skill-verification.ts
    - apps/mentor-portal/src/lib/msw/handlers/conversations.ts
    - apps/mentor-portal/src/lib/msw/handlers/notifications.ts
  modified:
    - apps/mentor-portal/src/lib/msw/handlers/index.ts
    - apps/mentor-portal/src/lib/msw/handlers/reviews.ts
    - apps/mentor-portal/src/components/dashboard/mentor-kpi-row.tsx
    - apps/mentor-portal/src/components/review-detail/review-layout.tsx

key-decisions:
  - "Mentor notification categories are portal-specific (review_assignments/sla_reminders/decision_outcomes/platform_updates) -- @glimmora/types NotificationCategory is for contributors"
  - "Removed duplicate /api/mentor/profile GET handler from reviews.ts (was only returning dashboard counts, now replaced by full profile handler)"
  - "Dashboard MentorKPIRow query key changed from ['mentor','profile'] to ['mentor','profile','full'] to match new full profile shape"
  - "autoSaveId prop removed from ResizablePanelGroup (react-resizable-panels v4 does not support this prop -- was causing type error)"
  - "Badge status values: 'done' for Verified, 'normal' for Pending, 'atrisk' for Disputed (Badge has no 'complete' or 'pending' variants)"

patterns-established:
  - "Settings hub pattern: root settings page shows card grid with Link + icon + description, sub-pages are independent routes"
  - "Mentor messages reply-only: no compose/initiate UI -- senderRole 'mentor'/'platform' maps to 'You'/'Platform'"
  - "SkillTagVerificationRequest contributorSeed displayed as #seed (never contributor name)"
  - "DisputeDialog: always a separate component file, requires non-empty reason before submit enabled"

# Metrics
duration: 21min
completed: 2026-02-26
---

# Phase 4 Plan 4: Profile, Skill Verification, Messaging, Settings Summary

**Mentor portal completed: tier-progress profile page, skill claim verification queue with anonymous contributor seeds, reply-only async messaging, and 3-section settings (capacity slider, skills checkboxes, notification grid)**

## Performance

- **Duration:** 21 min
- **Started:** 2026-02-26T15:38:02Z
- **Completed:** 2026-02-26T15:58:43Z
- **Tasks:** 2
- **Files modified:** 28

## Accomplishments

- Mentor profile with tier badge (tier colors: Bronze=#CD7F32, Silver=#C0C0C0, Gold=#FFD700, Elite=#A0614A), 3 GradientCard KPIs, TierProgressCard showing next-tier requirements per metric with Progress bars, ImpactMetricsCard with color-coded rework/appeals rates
- SkillTagVerificationRequest queue showing anonymous `#contributorSeed` identifiers, Verify (green) and Dispute buttons -- dispute requires reason in DisputeDialog
- MentorMessagesPage: reply-only async messaging, conversation sidebar, senderRole displayed as 'You'/'Platform' (no names, no compose button)
- Settings hub with navigation cards to 3 sub-pages: capacity (Slider 5-40h + isPaused Switch), skills (8 expertise area checkboxes + skill tag input with removal), notifications (4 mentor-specific categories x in_app/email channels grid)
- All 7 MSW handlers wired up including conversations with message threads and notification preferences

## Task Commits

Each task was committed atomically:

1. **Task 1: Mentor profile, tier progress, impact metrics, skill verification queue** - `f6ee81c` (feat)
2. **Task 2: Messaging, settings pages, MSW conversations/notifications handlers** - `1c6f56b` (feat)

**Plan metadata:** (pending docs commit)

## Files Created/Modified

### Created
- `apps/mentor-portal/src/app/(app)/profile/page.tsx` - Server component for profile page (MP-12/13/14)
- `apps/mentor-portal/src/app/(app)/skill-verification/page.tsx` - Server component for skill verification queue (MP-15/16)
- `apps/mentor-portal/src/app/(app)/messages/page.tsx` - Server component for async messaging (MP-17)
- `apps/mentor-portal/src/app/(app)/settings/page.tsx` - Settings hub with 3 navigation cards
- `apps/mentor-portal/src/app/(app)/settings/capacity/page.tsx` - Capacity settings page (MP-18)
- `apps/mentor-portal/src/app/(app)/settings/skills/page.tsx` - Skills settings page (MP-19)
- `apps/mentor-portal/src/app/(app)/settings/notifications/page.tsx` - Notification prefs page (MP-20)
- `apps/mentor-portal/src/components/profile/mentor-profile-page.tsx` - Full profile with KPIs, tier, metrics, tags
- `apps/mentor-portal/src/components/profile/tier-progress-card.tsx` - Next-tier requirements with Progress bars
- `apps/mentor-portal/src/components/profile/impact-metrics-card.tsx` - 5-metric grid with color coding
- `apps/mentor-portal/src/components/skill-verification/verification-queue.tsx` - Queue list with empty state
- `apps/mentor-portal/src/components/skill-verification/verification-item-card.tsx` - Card with verify/dispute buttons
- `apps/mentor-portal/src/components/skill-verification/dispute-dialog.tsx` - Dialog requiring reason for dispute
- `apps/mentor-portal/src/components/messages/mentor-messages-page.tsx` - Reply-only conversation UI
- `apps/mentor-portal/src/components/settings/capacity-settings-form.tsx` - Slider + pause Switch form
- `apps/mentor-portal/src/components/settings/skills-settings-form.tsx` - Expertise checkboxes + tag input
- `apps/mentor-portal/src/components/settings/notification-prefs-form.tsx` - 4x2 Switch grid
- `apps/mentor-portal/src/lib/msw/handlers/profile.ts` - GET/PUT /api/mentor/profile, capacity, skills
- `apps/mentor-portal/src/lib/msw/handlers/skill-verification.ts` - GET list, POST verify/dispute
- `apps/mentor-portal/src/lib/msw/handlers/conversations.ts` - GET list, GET messages, POST reply
- `apps/mentor-portal/src/lib/msw/handlers/notifications.ts` - GET/PUT notification prefs

### Modified
- `apps/mentor-portal/src/lib/msw/handlers/index.ts` - Added all 4 new handler arrays
- `apps/mentor-portal/src/lib/msw/handlers/reviews.ts` - Removed duplicate /api/mentor/profile GET
- `apps/mentor-portal/src/components/dashboard/mentor-kpi-row.tsx` - Updated to use full profile response shape
- `apps/mentor-portal/src/components/review-detail/review-layout.tsx` - Removed unsupported autoSaveId prop

## Decisions Made

- **Mentor notification categories are portal-specific.** The `@glimmora/types` `NotificationCategory` type (`task_updates/payments/messages/platform`) is for contributors. Mentor notification categories (`review_assignments/sla_reminders/decision_outcomes/platform_updates`) are defined inline in the component as a local type -- the types package was not modified.
- **Badge status mapping.** `@glimmora/ui` Badge has no `complete` or `pending` variants. Used `done` for "Verified", `normal` for "Pending", `atrisk` for "Disputed".
- **Dashboard KPIRow adapted.** `MentorKPIRow` used `['mentor','profile']` query key but only returned dashboard-specific counts. Updated to use `['mentor','profile','full']` with actual full profile metrics (totalReviews, averageReviewHours, pendingReviews).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed unsupported `autoSaveId` prop from ResizablePanelGroup**
- **Found during:** Task 1 (first build attempt)
- **Issue:** `react-resizable-panels` v4 `Group` component does not have `autoSaveId` prop -- caused TypeScript type error blocking build
- **Fix:** Removed `autoSaveId="mentor-review-layout"` from `review-layout.tsx`
- **Files modified:** `apps/mentor-portal/src/components/review-detail/review-layout.tsx`
- **Verification:** Build passes with 0 type errors
- **Committed in:** f6ee81c (Task 1 commit)

**2. [Rule 1 - Bug] Removed duplicate conflicting `/api/mentor/profile` GET handler from reviews.ts**
- **Found during:** Task 1 (MSW handler wiring)
- **Issue:** `reviews.ts` had a `/api/mentor/profile` GET returning `{pendingReviews, completedThisWeek, avgSLADaysRemaining}` which conflicted with the new full profile handler and would cause incorrect data for the dashboard
- **Fix:** Removed the handler from reviews.ts, updated `MentorKPIRow` to use new full profile shape
- **Files modified:** `apps/mentor-portal/src/lib/msw/handlers/reviews.ts`, `apps/mentor-portal/src/components/dashboard/mentor-kpi-row.tsx`
- **Verification:** Build passes, dashboard still shows KPI metrics from full profile response
- **Committed in:** f6ee81c (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (2 Rule 1 bugs)
**Impact on plan:** Both fixes necessary for correctness. No scope creep.

## Issues Encountered

- First build run produced `ENOTEMPTY` error on `.next/export` directory -- transient filesystem conflict from parallel plan execution (04-03 running simultaneously). Resolved by deleting `.next` before rebuild.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Mentor Portal is now feature-complete (plans 01-04 all done): application flow, onboarding, review queue with 3-panel layout, profile, skill verification, messaging, and settings
- Phase 5 (Enterprise Portal) can begin -- SOW management and delivery tracking
- Phase 6 (Admin Panel) depends on enterprise and mentor portals being complete (both now done)

---
*Phase: 04-mentor-portal*
*Completed: 2026-02-26*
