# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-26)

**Core value:** Enterprise uploads SOW -> APG decomposes into tasks -> verified contributors deliver evidence -> enterprise reviews and releases payment -- all without manual recruitment or PM overhead.
**Current focus:** Phase 5 (Enterprise Portal) -- COMPLETE. Ready for Phase 6 (Admin Portal).

## Current Position

Phase: 5 of 6 (Enterprise Portal)
Plan: 6 of 6 in current phase
Status: Phase complete
Last activity: 2026-02-27 -- Completed 05-06-PLAN.md

Progress: [████████████████████████] 6/6 phase 5 plans (100%), 24/24 overall (100% of phases 1-5)

## Performance Metrics

**Velocity:**
- Total plans completed: 24
- Average duration: 6.3 min
- Total execution time: 175 min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-monorepo-infrastructure-ds-foundation | 4/4 | 29 min | 7.3 min |
| 02-design-system-completion | 4/4 | 25 min | 6.3 min |
| 03-womens-portal-university-portal | 5/5 | 52 min | 10.4 min |
| 04-mentor-portal | 4/4 | 47 min | 11.8 min |
| 05-enterprise-portal | 6/6 | 30 min | 5.0 min |

**Recent Trend:**
- Last 5 plans: 05-03 (7 min), 05-04 (3 min), 05-05 (6 min), 05-06 (7 min)
- Trend: Phase 5 complete. Enterprise portal averaging 5 min/plan with mature patterns and component reuse

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [Roadmap]: Tailwind v4 chosen over v3 (CSS-first @theme for simpler monorepo token sharing; validated empirically)
- [Roadmap]: MSW hybrid approach (types in @glimmora/types, handlers per-portal, shared factory functions extracted only if needed)
- [Roadmap]: DS-01 through DS-10 in Phase 1 (not Phase 2) to enable canary validation with real styled components
- [01-01]: tailwindcss added as @glimmora/config devDep for pnpm strict mode CSS resolution
- [01-01]: type:module added to all packages for clean ESM support under Node 25
- [01-01]: Port assignments: women=3001, university=3002, enterprise=3003, mentor=3004, admin=3005
- [01-02]: MSW build scripts approved via pnpm.onlyBuiltDependencies in root package.json (pnpm v10 strict mode)
- [01-02]: Provider nesting: MSWProvider (outer) -> QueryProvider (inner) ensures mock intercepts before queries
- [01-02]: MSW workerDirectory configured as array of all 5 portal public dirs in root package.json
- [01-03]: Radix UI unified package exports namespaces -- use SlotPrimitive.Slot not bare Slot for asChild pattern
- [01-03]: Storybook 10 ESM-only config: no addon-essentials, only @storybook/addon-a11y
- [01-03]: Component pattern established: 'use client' per file, CVA variants, cn() utility, Radix primitives, forwardRef
- [01-04]: Home pages are Server Components -- @glimmora/ui components have 'use client' per-file so they compose safely
- [01-04]: Canary pages identical across all 5 portals -- proves toolchain uniformity, not portal differentiation
- [01-04]: Tailwind v4 + Storybook 10 + full toolchain VALIDATED -- pnpm turbo build zero errors, browser verified
- [02-04]: react-is override ^19.1.0 in root pnpm.overrides for recharts React 19 compatibility
- [02-04]: Custom SVG for simple shapes (ProgressRing/Sparkline/ActivityHeatmap), Recharts only for complex charts (BarChart)
- [02-04]: Data viz CSS variable pattern: all chart colors via var(--color-*), never hardcoded hex
- [02-01]: react-day-picker v9 classNames API for full Tailwind control (no separate CSS theming needed)
- [02-01]: cmdk v1.1.1 for Combobox -- no duplicate @radix-ui/react-dialog created
- [02-01]: Avatar anonymous mode uses deterministic SVG shapes from seed hash (6 shapes x 6 colors)
- [02-01]: Skeleton shimmer uses bg-hover (#F0E4DA warm earth) not grey
- [02-02]: AppShell uses React context (createContext + useAppShell hook) for sidebar state sharing between Sidebar/TopBar
- [02-02]: DataTable<T> generic type parameter with TanStack ColumnDef for type-safe columns
- [02-02]: KPIStatCard value is string|number to support formatted values like '92%' or '3.2d'
- [02-02]: Sidebar active indicator uses border-l-2 border-brand-primary (terracotta left accent)
- [02-03]: Evidence types have no contributor field -- blind review enforced at TypeScript interface level
- [02-03]: Skill Genome Panel sorted by tier then evidence count -- private progress only, no comparison/ranking
- [02-03]: Anonymized Team Card max 4 visible skills with +N overflow
- [02-03]: APG Feed uses inline expandable details rather than nested Accordion
- [03-01]: Cookie-based locale (NEXT_LOCALE) for next-intl instead of URL-prefix routing
- [03-01]: MSW handlers migrated from flat file to handlers/ directory (auth, onboarding, canary)
- [03-01]: lucide-react added as direct dependency to women-portal for Shield/CheckCircle icons
- [03-01]: Pre-auth route group pattern: app/(pre-auth)/ for all unauthenticated pages
- [03-02]: APGActivity type mapping: hyphens in types -> underscores for APGFeed component via TYPE_MAP
- [03-02]: Evidence rework pack pre-seeded in MSW handlers for task-005 so rework view has data
- [03-02]: Common MSW factory helper (randomId, isoNow) in factories/common.ts for reuse
- [03-02]: Pipeline visualization in submission tracker uses simple div bars (not TimelineBar component)
- [03-04]: Task discovery uses Available/My Tasks/Completed tabs (students choose tasks, not assigned)
- [03-04]: PDF export uses dynamic import (await import('@react-pdf/renderer')) to avoid SSR crashes
- [03-04]: University Portal auth store uses zustand persist with localStorage for session continuity
- [03-04]: lucide-react added as direct dependency to university-portal for sidebar icons
- [03-03]: SkillNode level mapped to SkillGenomePanel tier enum (beginner->emerging, intermediate->developing, advanced->proficient, expert->expert)
- [03-03]: Messages use senderRole display ('You'/'Support Lead') not names -- privacy-preserving async messaging
- [03-03]: Privacy defaults set to maximum restriction (profileVisibleToTeam=false, earningsVisible=false)
- [03-03]: Settings root page uses sidebar navigation linking to sub-routes (/privacy, /notifications, /devices)
- [03-03]: Notification prefs grid uses actual @glimmora/types channels (in_app/email) and categories (task_updates/payments/messages/platform)
- [03-05]: Governor views use type-level privacy enforcement -- GovernorMetrics/CohortTrend structurally cannot contain individual identifiers
- [03-05]: Governor sub-navigation uses Link + usePathname active state pattern (same-layout tabs)
- [03-05]: TaskCategory uses isEnabled (actual type field) not isActive; factory data adapted to match actual types throughout
- [03-gap]: @glimmora/ui Label is a <p> element NOT a <label> -- does NOT accept htmlFor; use native <label> HTML element for form associations
- [03-gap]: GradientCard gap: all 3 KPI cards must use GradientCard (not KPIStatCard); 3rd card uses inline style gradient
- [03-gap]: PoDLPDFDocument must NOT be barrel-exported; use await import('./podl-pdf-document') inside event handlers only
- [04-01]: MentorProfile renamed to MentorOnboardingProfile in mentor.ts (avoids conflict with MentorProfile from user.ts which extends User)
- [04-01]: react-resizable-panels v4 uses plain functions (not forwardRef) -- Group/Panel/Separator use elementRef prop
- [04-01]: Mentor auth store has 3 roles: applicant, pending_onboarding, mentor (zustand persist)
- [04-01]: Application status polling via TanStack Query refetchInterval: 5000 (stops on approved/rejected)
- [04-02]: Button variant="secondary" for dialog cancel (DS has no "outline" variant)
- [04-02]: Dialogs embedded directly in ReviewQueueItemCard (SkipDialog/SLAExtensionDialog with DialogTrigger)
- [04-02]: SLA timer: 60-second interval, mounted-state guard prevents hydration mismatch
- [04-02]: 3rd GradientCard uses inline style={{ background: 'linear-gradient(135deg, #4A6741 0%, #3A8FA0 100%)' }}
- [04-03]: autoSaveId prop on ResizablePanelGroup abstracts useDefaultLayout hook from v4 (react-resizable-panels v4 removed autoSaveId prop; wrapper added it back)
- [04-03]: ReviewEvidence type (mentor-facing) has NO contributor identity fields -- blind review enforced at TypeScript type level
- [04-03]: ReviewEvidence -> ViewerEvidence mapping in evidence-center-panel.tsx is explicit privacy boundary
- [04-03]: Auto-save pattern: useEffect+setTimeout(1500ms)+Zustand persist keyed by reviewId, cleared in useMutation.onSuccess
- [04-04]: Mentor notification categories are portal-specific (review_assignments/sla_reminders/decision_outcomes/platform_updates) -- not from @glimmora/types
- [04-04]: Badge status values: 'done'=Verified, 'normal'=Pending, 'atrisk'=Disputed (no 'complete'/'pending' Badge variants)
- [04-04]: Mentor messages use senderRole 'mentor'/'platform' mapped to 'You'/'Platform' -- no contributor names ever shown
- [04-04]: autoSaveId prop removed from ResizablePanelGroup in review-layout.tsx (v4 does not support this prop)
- [05-01]: @tanstack/react-table added as direct dependency to enterprise-portal for ColumnDef type import (pnpm strict mode)
- [05-01]: SOW upload form checks existingSOWId from URL search params -- if present shows version banner and passes in FormData
- [05-01]: MSW handlers migrated from flat canary file to handlers/ directory (auth, onboarding, sow)
- [05-01]: Pre-auth login at (pre-auth)/login/page.tsx, root page.tsx redirects to /login
- [05-02]: Blueprint factory uses deterministic clause IDs (clause-001..006) matching task clauseIds for cross-panel synchronization
- [05-02]: All 4 editor panels use Zustand selectors (useEditorStore((s) => s.field)) -- never full store subscription
- [05-02]: OTPConfirmationDialog in components/shared/ is reusable for blueprint approval and payment release
- [05-02]: MilestoneSettingsCard is private sub-component within ProjectSettingsPanel for per-milestone editing
- [05-03]: 3rd GradientCard uses inline style={{ background: 'linear-gradient(135deg, #4A6741 0%, #3A8FA0 100%)' }} per prior decision
- [05-03]: URL hash-based tab state for bookmarkable 7-tab project detail (window.location.hash + hashchange listener)
- [05-03]: AnonymizedTeamCard with tier Badge overlay -- no real contributor names shown
- [05-03]: MSW /projects/completed route defined BEFORE /projects/:id to prevent path shadowing
- [05-04]: recharts added as direct dependency to enterprise-portal (pnpm strict mode requires explicit dep, not transitive via @glimmora/ui)
- [05-04]: Gantt uses stacked Bar trick: invisible offset bar + visible duration bar, both with stackId='gantt'
- [05-04]: Health status colors use CSS variables: completed=status-success, in-progress=brand-primary, pending=border, overdue=status-urgent
- [05-04]: Milestone health in list view derived from status: completed/in-progress='On Track', pending='Pending', overdue='Delayed'
- [05-05]: Evidence contributorId stripped in toViewerEvidence mapping function -- blind review enforced at runtime (Evidence from @glimmora/types includes contributorId)
- [05-05]: BulkPaymentRelease uses TanStack useReactTable directly with external rowSelection state (DataTable from @glimmora/ui encapsulates rowSelection internally)
- [05-05]: OTPConfirmationDialog reused from 05-02 for both single and bulk payment release
- [05-05]: enableRowSelection conditionally enables only pending payments for checkbox selection
- [05-05]: Auto-payment settings support 3 modes: manual (OTP required), auto-on-approval, apg-silent (with configurable threshold)
- [05-06]: PoDL report PDF includes SHA-256 verification hashes and cryptographic signature indicator for audit trail
- [05-06]: ESG report references specific GRI standards (GRI 405 Diversity, GRI 404 Training)
- [05-06]: PDF documents NOT barrel-exported -- only dynamically imported inside event handlers
- [05-06]: Enterprise notification categories are portal-specific (6 categories: sow_updates, project_updates, evidence_reviews, payment_updates, team_activity, platform_announcements)
- [05-06]: Organization Tax ID is read-only after verification (enforced in UI)

### Pending Todos

None.

### Blockers/Concerns

- Phase 5: SOW Blueprint Editor 4-panel synchronized selection COMPLETE using Zustand selectors + ResizablePanelGroup (resolved)
- Pre-existing: `pnpm turbo build` now passes cleanly across all portals
- [03-01]: next-intl INSTALLED in both portals (resolved from planning blocker)
- [03-04]: @react-pdf/renderer INSTALLED in university-portal (resolved from blocker)
- [05-01]: @react-pdf/renderer INSTALLED in enterprise-portal (resolved)

## Session Continuity

Last session: 2026-02-27T05:38:19Z
Stopped at: Completed 05-06-PLAN.md (Compliance Reports, Payments Hub, Settings) -- Phase 5 COMPLETE
Resume file: None
