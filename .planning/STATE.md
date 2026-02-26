# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-26)

**Core value:** Enterprise uploads SOW -> APG decomposes into tasks -> verified contributors deliver evidence -> enterprise reviews and releases payment -- all without manual recruitment or PM overhead.
**Current focus:** Phase 3 - Women's Portal + University Portal (IN PROGRESS)

## Current Position

Phase: 3 of 6 (Women's Portal + University Portal) -- IN PROGRESS
Plan: 5 of 5 in current phase (03-03 + 03-04 complete, 03-05 remaining)
Status: In progress
Last activity: 2026-02-26 -- Completed 03-03-PLAN.md (Women's Portal Remaining Pages)

Progress: [█████████████░░░░░░░░░░░] 13/24 plans (54%)

## Performance Metrics

**Velocity:**
- Total plans completed: 13
- Average duration: 6.2 min
- Total execution time: 93 min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-monorepo-infrastructure-ds-foundation | 4/4 | 29 min | 7.3 min |
| 02-design-system-completion | 4/4 | 25 min | 6.3 min |
| 03-womens-portal-university-portal | 5/5 | 39 min | 7.8 min |

**Recent Trend:**
- Last 5 plans: 03-01 (8 min), 03-02 (5 min), 03-03-old (10 min), 03-04 (10 min), 03-03 (6 min)
- Trend: stable around 6-10 min for portal plans

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

### Pending Todos

None.

### Blockers/Concerns

- Phase 4: 3-panel resizable layout approach needs research during planning
- Phase 5: SOW Blueprint Editor (4-panel synchronized scroll) has no library equivalent -- needs spike
- Pre-existing: `pnpm turbo build` now passes cleanly across all 5 portals (was previously failing with webpack-runtime TypeError)
- [03-01]: next-intl INSTALLED in both portals (resolved from planning blocker)
- [03-04]: @react-pdf/renderer INSTALLED in university-portal (resolved from blocker)

## Session Continuity

Last session: 2026-02-26
Stopped at: Completed 03-03-PLAN.md (Women's Portal Remaining Pages)
Resume file: None
