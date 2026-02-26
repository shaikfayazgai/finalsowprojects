# GlimmoraTeam Research Summary

**Project:** GlimmoraTeam Frontend Monorepo
**Domain:** Multi-portal AGI-governed SaaS (5 Next.js apps + shared design system)
**Researched:** 2026-02-26
**Confidence:** HIGH (stack), MEDIUM (features/architecture patterns), MEDIUM (pitfalls)

---

## Executive Summary

GlimmoraTeam is a 5-portal Next.js monorepo sharing a single Radix-based design system (`@glimmora/ui`), a TypeScript types contract (`@glimmora/types`), and shared configuration (`@glimmora/config`). The recommended approach is a Turborepo + pnpm workspace with internal packages exporting raw TypeScript source (no pre-build step), consumed and transpiled by each Next.js app at build time. All data fetching during the frontend build phase is driven by MSW mocks whose response shapes double as the API contract handed to the backend team.

The single most consequential architectural decision is **Tailwind CSS version** — STACK.md recommends v4 (CSS-first `@theme` config) while ARCHITECTURE.md recommends v3.4.x (JS preset pattern). Both researchers cite valid rationale. This choice shapes every shared theme file, every app's CSS entry point, and Storybook configuration. The team must resolve this before monorepo scaffold begins; a wrong choice at hour one compounds through every subsequent phase. See the Key Decision section below.

The primary risk cluster is integration complexity: five separate Next.js runtime environments, MSW requiring dual browser + Node.js initialization, Radix UI components requiring precise `"use client"` boundary placement, and Storybook needing its own separate Tailwind configuration. Every one of these has caused project-level debugging spirals in similar monorepos. They are all solved by establishing a single "canary" — one Button component, one Story, one portal page, all wired together and verified green — before any feature development begins.

---

## Key Decision: Tailwind v3 vs v4

This conflict between STACK.md and ARCHITECTURE.md must be resolved before Phase 1 begins. Both versions are currently viable; the choice is a tradeoff, not a clear winner.

### Tailwind v3.4.19 (ARCHITECTURE.md recommendation)

**Pros:**
- Preset pattern for sharing config across 5 apps is extensively documented and battle-tested in Turborepo monorepos
- Storybook 8/10 + Tailwind v3 integration is fully proven
- Explicit `content: [...]` paths make it obvious which files Tailwind scans (no surprise omissions)
- Every community example, Turborepo template, and shadcn guide uses v3 patterns

**Cons:**
- v3 is effectively EOL as of Dec 2025 (last release 3.4.19); no new features, security patches only
- Sharing config requires a `preset` export in `@glimmora/config/tailwind.config.ts` plus content path duplication in each app
- `tailwind.config.js` files in 5 apps = 5 places to maintain content paths when packages are added

### Tailwind v4.2.1 (STACK.md recommendation)

**Pros:**
- CSS-first `@theme` directive makes monorepo token sharing trivially simple: one `@import` in each app's globals.css, no JS config files
- v4 has been stable since Jan 2025 (13+ months); the STACK.md researcher verified it on npm on 2026-02-26
- ~10x faster build times due to Rust-based engine
- Forward-looking: v3 will not receive new features; v4 is where Tailwind development is happening

**Cons:**
- Monorepo examples with v4 + Turborepo + multiple Next.js apps are less prevalent in community documentation
- ARCHITECTURE.md researcher rated Storybook 10 + Tailwind v4 integration as MEDIUM confidence
- `@source` auto-detection behavior in monorepos needs explicit validation — wrong setup causes silent style omissions (same underlying problem as CRITICAL-2, just different mechanics)
- PITFALLS.md's CRITICAL-2 (content path detection failure) was written assuming v3; the v4 equivalent failure mode (`@source` mis-configuration) is less documented

### Recommendation

**Use Tailwind v4.** The STACK.md researcher verified v4.2.1 against the npm registry and confirmed 13 months of stability. The CSS-import model is a genuine architectural improvement for a monorepo of this scale — sharing tokens across 5 apps via `@import "@glimmora/config/tailwind/theme.css"` is materially simpler than the v3 preset chain. The risk is manageable: validate v4 + Storybook 10 integration with a single Button component before building anything else. If that validation fails within day one, fall back to v3.4.19 without having committed significant work.

**If using v4**, the CRITICAL-2 pitfall equivalent is mis-configuring `@source` directives. Each app's globals.css must explicitly include the UI package path:
```css
@import "tailwindcss";
@import "@glimmora/config/tailwind/theme.css";
@source "../../packages/ui/src";
```

**If using v3**, use the preset pattern from ARCHITECTURE.md and add `'../../packages/ui/src/**/*.{ts,tsx}'` to every app's `content` array.

---

## Recommended Stack (with Versions)

All versions verified against npm registry on 2026-02-26 by STACK.md researcher.

### Runtime

| Package | Version | Purpose |
|---------|---------|---------|
| `next` | `15.5.12` | App Router framework (stable `backport` tag; Next.js 16 is only 4 months old) |
| `react` | `19.2.4` | UI runtime |
| `react-dom` | `19.2.4` | DOM rendering |
| `typescript` | `5.9.3` | Type safety |
| `node` | `22 LTS` | Runtime |

### Build Infrastructure

| Package | Version | Purpose |
|---------|---------|---------|
| `turbo` | `2.8.11` | Monorepo orchestration + caching |
| `pnpm` | `10.30.2` | Package manager (strict hoisting prevents phantom deps) |
| `eslint` | `10.0.2` | Linting (flat config) |
| `eslint-config-next` | `15.5.12` | Next.js rules (must match Next.js major) |
| `prettier` | `3.8.1` | Formatting |
| `prettier-plugin-tailwindcss` | `0.7.2` | Class order normalization |

### Styling (if v4 chosen)

| Package | Version | Purpose |
|---------|---------|---------|
| `tailwindcss` | `4.2.1` | Utility CSS (CSS-first `@theme` config) |
| `@tailwindcss/postcss` | `4.2.1` | PostCSS integration for Next.js |

### Styling (if v3 chosen)

| Package | Version | Purpose |
|---------|---------|---------|
| `tailwindcss` | `3.4.19` | Utility CSS (JS `tailwind.config.ts` preset) |
| `autoprefixer` | latest | PostCSS companion |

### Styling Utilities (version-agnostic)

| Package | Version | Purpose |
|---------|---------|---------|
| `class-variance-authority` | `0.7.1` | Type-safe component variants (`cva`) |
| `clsx` | `2.1.1` | Conditional class joining |
| `tailwind-merge` | `3.5.0` | Conflict-free class merging |

### UI Primitives

All Radix packages are at their current v1/v2 stable releases (verified). Install all Phase 1 packages:

`@radix-ui/react-dialog`, `@radix-ui/react-select`, `@radix-ui/react-dropdown-menu`, `@radix-ui/react-tabs`, `@radix-ui/react-tooltip`, `@radix-ui/react-popover`, `@radix-ui/react-checkbox`, `@radix-ui/react-radio-group`, `@radix-ui/react-switch`, `@radix-ui/react-accordion`, `@radix-ui/react-toast`, `@radix-ui/react-scroll-area`, `@radix-ui/react-progress`, `@radix-ui/react-label`, `@radix-ui/react-separator`, `@radix-ui/react-alert-dialog`, `@radix-ui/react-slot`, `@radix-ui/react-avatar`, `@radix-ui/react-collapsible`, `@radix-ui/react-visually-hidden`, `@radix-ui/react-aspect-ratio`

Defer to Phase 2: `@radix-ui/react-context-menu`, `@radix-ui/react-slider`, `@radix-ui/react-navigation-menu`, `@radix-ui/react-hover-card`, `@radix-ui/react-toggle`, `@radix-ui/react-toggle-group`

### State Management

| Package | Version | Purpose |
|---------|---------|---------|
| `@tanstack/react-query` | `5.90.21` | Server state (API cache, mutations, optimistic updates) |
| `@tanstack/react-query-devtools` | `5.91.3` | Dev debugging |
| `zustand` | `5.0.11` | Client UI state (sidebar open/closed, language preference) |

### Forms

| Package | Version | Purpose |
|---------|---------|---------|
| `react-hook-form` | `7.71.2` | Form state (uncontrolled, performant for SOW upload) |
| `zod` | `4.3.6` | Schema validation + TypeScript type inference |
| `@hookform/resolvers` | `5.2.2` | Zod-to-RHF bridge (`zodResolver()`) |

### Animation + Icons + i18n

| Package | Version | Purpose |
|---------|---------|---------|
| `motion` | `12.34.3` | Animation (formerly `framer-motion`; same API, new canonical name) |
| `lucide-react` | `0.575.0` | Icons (MIT, tree-shakeable, 1500+) |
| `next-intl` | `4.8.3` | i18n for App Router (critical: language selection is first UX touch) |

### Testing

| Package | Version | Purpose |
|---------|---------|---------|
| `msw` | `2.12.10` | API mocking — browser service worker + Node.js server |
| `vitest` | `4.0.18` | Unit/integration test runner |
| `@testing-library/react` | `16.3.2` | Component behavior testing |
| `storybook` | `10.2.12` | Component docs + visual testing |
| `@storybook/nextjs` | `10.2.12` | Next.js framework adapter (handles `next/image`, `next/font`, `next/navigation`) |
| `@storybook/addon-a11y` | `10.2.12` | Axe-core accessibility audits on every story |
| `@storybook/addon-themes` | `10.2.12` | Light/dark/RTL mode switching in Storybook |

---

## Component Landscape

Full detail in `.planning/research/FEATURES.md`.

### Table Stakes (Build First — Cannot Ship Without These)

**Foundation (no complexity, everything depends on them):**
- Color token system with semantic names (surface, muted, accent, destructive, success, warning) + earthy brand palette (`#A0614A` terracotta primary)
- Typography scale (display, heading, body, caption, overline, code)
- Icon system — Lucide React only, no mixing icon libraries
- Focus ring system (accessibility, keyboard navigation)

**Core interactive primitives (Tier 4, 1-2 days each):**
Button, Input, Textarea, Select, Checkbox, RadioGroup, Switch, Label, Separator, Badge, Tag, Avatar (initials only, never photos for contributors), Tooltip, Accordion, AlertDialog, Toast, Progress, Separator

**Layout system (Tier 3, 3-5 days each):**
AppShell, Sidebar (collapsible), Header (portal-color-coded), Breadcrumbs, Card, EmptyState, Skeleton/LoadingState, ErrorState

**Data and forms (Tier 2, 1-2 weeks each):**
DataTable (TanStack Table v8 headless), FileUpload (react-dropzone), Stepper (onboarding flows), SlideOutPanel (used heavily across all portals), FormField wrapper, NotificationCenter, KPI/Stat Card

### Differentiators (Build After Core)

**Governance-specific (no existing library covers these):**
- 3-Panel Review Layout (Left: task context + criteria / Center: evidence viewer / Right: review form) — the highest-value single component; 80% of mentor time is here
- Evidence Viewer (tabbed: Code / Document / Link / Video) with blind review enforcement — never exposes contributor identity
- Criteria Evaluation Grid (per-criterion Met / Partially Met / Not Met with inline comments)
- SOW Blueprint Editor (4-panel: original SOW + AI interpretation + diff view + questions) — highest complexity single screen

**Timeline and tracking:**
- Milestone Timeline / Gantt (horizontal, zoom levels, status color overlays)
- Kanban Board (@dnd-kit for drag-and-drop; NOT react-beautiful-dnd, which is deprecated)
- Progress Ring (SVG arc + motion animation)

**Premium UX:**
- Language Selector First-Touch (full-screen card-based, not a dropdown — trust-building moment for Women's Portal)
- Gradient KPI Cards (visual signature of the platform)
- Animated Skeleton Loaders (content-shape-aware shimmer)
- PoDL Credential Card (must be screenshot-worthy for WhatsApp + LinkedIn share)
- Role Switcher (explicit confirmation + full app-shell theme change)

**Data visualization:**
Sparkline, Bar Chart, Skill Heatmap (unique to University Governor), Deployment Funnel, Donut Chart — all via Recharts

### Anti-Features (Never Build)

| Anti-Feature | Why |
|---|---|
| Public contributor profiles | Private-by-default is architectural, not a toggle |
| Leaderboards / rankings | Contradicts the platform's core safety promise |
| Star ratings shown to contributors | Creates performance anxiety; forbidden by UX research |
| Competitive bidding interface | APG assigns tasks; bidding is the exclusion mechanism being eliminated |
| Photo/avatar upload for contributors | Safety risk in conservative contexts; initials only |
| Real-time "who's online" indicators | Surveillance pressure; contributors work in fragmented time |
| Dark mode (MVP) | Doubles token QA effort; warm earthy palette is designed for light mode only |
| Nested modals | UX anti-pattern; use slide-out panels for drill-down |
| Gamification points / XP | Trivializes professional work; PoDL credentials replace gamification |
| Infinite scroll in tables | Admin tables need pagination for URL-shareability and accountability |

---

## Architecture Decisions

Full detail in `.planning/research/ARCHITECTURE.md`.

### Monorepo Structure

```
glimmora-team/
  turbo.json                   # Pipeline: build, dev, lint, test, type-check
  pnpm-workspace.yaml
  package.json                 # Root scripts + turbo devDep

  packages/
    ui/                        # @glimmora/ui — Radix + Tailwind design system + Storybook
    types/                     # @glimmora/types — TypeScript interfaces (API contract)
    config/                    # @glimmora/config — Tailwind theme, ESLint, TSConfig bases

  apps/
    women-portal/              # Next.js 15 — Women's contributor portal (port 3001)
    university-portal/         # Next.js 15 — Student + Faculty portal (port 3002)
    enterprise-portal/         # Next.js 15 — Enterprise requester portal (port 3003)
    mentor-portal/             # Next.js 15 — Mentor / reviewer portal (port 3004)
    admin-panel/               # Next.js 15 — Platform admin panel (port 3005)
```

Internal packages export raw TypeScript source (no pre-build step). Each Next.js app transpiles them via `transpilePackages` in `next.config.ts`. This eliminates build-order race conditions entirely.

### "use client" Boundary Rule

**Rule: Mark `"use client"` at the individual component file level in `@glimmora/ui`, never at the barrel export (`index.ts`).**

- Every Radix-based component file gets `"use client"` at the top
- Purely presentational components (Card, PageShell, Badge, Skeleton, Icons) do NOT get `"use client"` — they remain Server Components
- App pages remain Server Components; they compose client components without propagating the boundary upward

Components requiring `"use client"`: Button, Dialog, Select, Tabs, Tooltip, Accordion, DataTable, FormField, Stepper, FileUpload, Sidebar, Toast, ResizablePanels, all motion wrappers

Components that stay Server Components: Card, Grid, Stack, PageHeader, KPICard, Badge, Separator, StatusBadge, Timeline, Skeleton, Spinner, Alert, Icons

### MSW Architecture Decision

**ARCHITECTURE.md recommendation:** Per-portal handlers with shared types (types package is source of truth, handlers are portal-specific). Each portal has its own `src/mocks/` with handlers tailored to what that role sees.

**STACK.md recommendation:** Fully shared `@glimmora/mocks` package with all handlers centralized.

**Synthesis:** Use the hybrid approach. Types in `@glimmora/types` are the ground truth. Handler logic lives per-portal (cleaner, avoids role-conditional spaghetti). If common mock factory functions emerge (e.g., `createMockTask()`), extract those to a lightweight `@glimmora/mocks` package. Do not extract handler routing logic.

### Build Order (6 Layers)

Build these in strict sequence. Each layer depends on the previous.

1. **Monorepo scaffold** — `turbo.json`, `pnpm-workspace.yaml`, root `package.json`, explicit port assignments, `.npmrc` (`shamefully-hoist=false`)
2. **Shared configuration** — `@glimmora/config`: Tailwind theme (v3 preset OR v4 `@theme` CSS file), ESLint flat config, TSConfig bases
3. **Type contracts** — `@glimmora/types`: all domain models (`Task`, `Project`, `SOW`, `SkillGenome`, `PoDLEntry`, `Review`, `Payment`, enums). These become the API handoff document.
4. **Design system + Storybook** — `@glimmora/ui`: all Tier 4 primitives + foundation tokens + Storybook wired. Validate with one Button story before proceeding.
5. **MSW + providers** — per-portal: `MSWProvider` component, `instrumentation.ts` for server-side, `QueryProvider`, `AuthProvider`, explicit dev ports. Validate with one mocked page.
6. **Portal pages** — feature development begins with routing structure, onboarding flows, dashboard shells, then feature-specific screens

### Portal Complexity Ranking

1. Mentor Portal — 3-Panel Review Layout + Criteria Grid + Evidence Viewer (build this well; it's the governance heart)
2. Enterprise Portal — SOW Blueprint Editor (4-panel, highest complexity single screen) + Milestone Timeline
3. Admin Panel — highest table density, every chart type, APG override panel
4. Women's Portal — technically simpler but emotionally complex; onboarding + community + kanban
5. University Portal (Contributors) — shares most with Women's Portal; PoDL Credential Card is unique
6. University Portal (Governor) — dashboards + analytics; Skill Heatmap is unique

---

## Top 5 Pitfalls

Full detail with code samples in `.planning/research/PITFALLS.md`.

### CRITICAL-1: MSW Dual-Runtime Initialization

**What breaks:** MSW initialized only for the browser. Server Component `fetch()` calls during SSR return 404s. Client pages show mock data; hard-refreshed pages show connection errors.

**Prevention:** Initialize BOTH `setupWorker` (browser, via `MSWProvider` with `"use client"`) AND `setupServer` (Node.js, via `instrumentation.ts` with `NEXT_RUNTIME === 'nodejs'` guard). Set `onUnhandledRequest: 'bypass'` on both to avoid intercepting Next.js internal requests. Run `npx msw init ./public --save` in each of the 5 portal apps to generate `mockServiceWorker.js`.

### CRITICAL-2: Tailwind Content Paths Miss Shared Package

**What breaks:** Components from `@glimmora/ui` render as completely unstyled HTML in the apps. Tailwind generates no CSS for their classes because it never scanned the UI package source.

**Prevention (v3):** In each app's `tailwind.config.ts`, add `'../../packages/ui/src/**/*.{ts,tsx}'` to the `content` array. **Prevention (v4):** Add `@source "../../packages/ui/src";` to each app's `globals.css`. Validate immediately after setting up the first shared component — one unstyled Button reveals the problem before it hides in 50 components.

### CRITICAL-3: Radix Components Require "use client"

**What breaks:** Importing Radix components into App Router pages without `"use client"` causes `useState is not allowed in Server Components` build errors. Or worse, components render silently but clicks do nothing.

**Prevention:** Add `"use client"` to every Radix-wrapping file in `@glimmora/ui` individually. Never add it to the barrel export. Establish this convention before the first component is written.

### CRITICAL-4: Storybook Cannot Resolve Monorepo Packages

**What breaks:** Storybook's bundler (separate from Next.js) cannot resolve `@glimmora/ui` imports or apply Tailwind styles. Components appear unstyled or fail to load entirely.

**Prevention:** Place Storybook in `packages/ui/.storybook/`. Import a CSS file in `preview.ts` that contains the Tailwind directives. Configure `staticDirs` for font files. For fonts: use `@font-face` CSS declarations in Storybook (not `next/font/local`, which is a Next.js compiler feature). Validate Storybook with one story before building more components.

### CRITICAL-5: Custom Font Wiring (Miller Display + Avenir LT Std)

**What breaks:** These are commercial fonts — not on Google Fonts. `next/font/google` will not find them. `next/font/local` path resolution in monorepos is relative to the calling file, not the project root, causing silent failures where fonts load on some routes but not others.

**Prevention:** Place `.woff2` files in `packages/config/fonts/`. Define `localFont()` calls in each portal's own `app/layout.tsx` (not in a shared package — `next/font` compiler transforms may not work cross-package). Wire CSS variables (`--font-miller-display`, `--font-avenir`) into the Tailwind theme. For Storybook, load fonts via `@font-face` in `.storybook/preview.css`. Verify the font renders in the app AND in Storybook before proceeding.

---

## Implications for Roadmap

### Phase 1: Monorepo Infrastructure + Design System Foundation

**Rationale:** All 5 portals and ~230 screens depend on a working monorepo scaffold and a validated design system. Building features before the infrastructure is verified is the single most common source of project-level rewrites. The "canary" pattern (one component, one story, one portal page, all green) must gate Phase 2.

**Delivers:**
- Turborepo + pnpm workspace with 5 app slots and 3 package slots
- `@glimmora/config` with Tailwind theme (v3 or v4 — decided before day 1 of build)
- `@glimmora/types` with all domain models and API response shapes
- `@glimmora/ui` with all Tier 4 primitives + Storybook running with a11y addon
- Per-portal MSW setup (browser + server) validated on one mocked route per portal
- Explicit dev ports (3001-3005, 6006 for Storybook)
- `"use client"` convention documented and applied

**Must avoid:** CRITICAL-1, CRITICAL-2, CRITICAL-3, CRITICAL-4, CRITICAL-5 — all are Phase 1 problems

**Research flag:** Tailwind v4 + Storybook 10 integration needs empirical validation (MEDIUM confidence from ARCHITECTURE.md). If it fails within a day, fall back to v3.

### Phase 2: Shared Design System — Tier 3 + Tier 2 Components

**Rationale:** The shared component library is the dependency for all portal feature work. Completing it before portal-specific development eliminates context switching and prevents duplicated work.

**Delivers:**
- AppShell + Sidebar + Header (portal-color-coded variants)
- DataTable (TanStack Table v8 headless engine)
- FileUpload, Stepper, SlideOutPanel
- FormField wrapper pattern
- KPI/Stat Cards, Gradient KPI Card
- Skeleton/LoadingState, EmptyState, ErrorState
- NotificationCenter, Toast

**Uses:** `@tanstack/react-query`, `@dnd-kit`, `react-dropzone`, `motion`

**Research flag:** Standard patterns — skip `/gsd:research-phase` for this phase.

### Phase 3: Women's Portal + University Portal (Contributors)

**Rationale:** These two portals share the most components and have the most similar user flows. Building them together maximizes reuse discovery and minimizes double work on onboarding, task flows, and community features.

**Delivers:**
- Language-selector-first onboarding flow (Women's Portal — trust-building, not a settings toggle)
- 7-step Women's onboarding + 5-step Student onboarding
- Task list + Kanban view + Evidence submission form
- Community feed, Message thread
- PoDL Credential Card (University differentiator)
- Skill Genome visualization

**Implements:** Language selector, Trust-first information display, Onboarding stepper with illustrations, Community feed, CodeEditor/Viewer

### Phase 4: Mentor Portal

**Rationale:** The 3-Panel Review Layout is the most technically complex component in the platform. It should be built as a focused effort with the design system already stable beneath it.

**Delivers:**
- 3-Panel Review Layout (resizable, responsive collapse)
- Evidence Viewer (Code / Document / Link / Video tabs, blind review enforcement)
- Criteria Evaluation Grid
- Review decision form + narrative feedback (RichTextEditor via Tiptap)
- Review queue management
- Skill tag verification flow

**Research flag:** Resizable panels + Framer Motion + Radix ScrollArea integration has non-trivial edge cases. Consider a `/gsd:research-phase` if the review layout is non-obvious during planning.

### Phase 5: Enterprise Portal

**Rationale:** The SOW Blueprint Editor (4-panel) is the single highest-complexity screen. It should come after simpler portals establish patterns.

**Delivers:**
- SOW upload + AI intelligence display
- SOW Blueprint Editor (original SOW / AI interpretation / diff view / questions panel)
- Blueprint Decomposition Preview (tree/hierarchy view)
- Milestone Timeline / Gantt (horizontal, zoom levels)
- Project overview tabs (timeline, evidence packs, rework, escalations, payments, team)
- Evidence Pack Viewer + Rework Request flow

**Research flag:** The 4-panel Blueprint Editor has no existing component library equivalent. Plan a research or spike phase for synchronized scroll, diff highlighting, and version history before committing to an implementation approach.

### Phase 6: Admin Panel

**Rationale:** Admin builds last because it depends on having all entity types, states, and API shapes defined by the other portals.

**Delivers:**
- Platform health dashboard (all chart types)
- User management tables (6 user types, 6-tab detail layout)
- APG override panel
- Dispute resolution flow
- Onboarding approval queue
- Custom report builder
- Super Admin settings

**University Governor Console** can be built alongside Admin Panel — it shares data-density and analytics patterns.

### Phase Ordering Rationale

- Phases 1-2 are non-negotiable infrastructure. No portal work begins before the canary passes.
- Phases 3-5 are ordered by component reuse: Women/University share components, Mentor introduces 3-panel complexity, Enterprise introduces 4-panel complexity.
- Admin comes last intentionally: it needs all entity types and states to exist before the management interfaces are meaningful to build.
- MSW mocks per portal must be written alongside portal development — they define the API contract incrementally.

### Research Flags

**Needs research or spike during planning:**
- Phase 1: Tailwind v4 + Storybook 10 monorepo integration (validate empirically, not from docs alone)
- Phase 4: 3-panel resizable layout with `react-resizable-panels` or custom drag-handle approach
- Phase 5: SOW Blueprint Editor synchronized scroll + diff highlighting approach (no library covers this)

**Standard patterns — skip research-phase:**
- Phase 2: All Tier 3/Tier 2 shared components use established Radix + Tailwind patterns
- Phase 3: Women's / University portals use standard Next.js App Router + TanStack Query patterns
- Phase 6: Admin Panel is a data-table-heavy dashboard; well-covered by TanStack Table + Recharts

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All versions verified against npm registry on 2026-02-26. Peer dependencies checked. |
| Features | MEDIUM | Component inventory is comprehensive and grounded in UX research, but complexity estimates are based on training data through ~May 2025. Implementation time may vary. |
| Architecture | HIGH (structure) / MEDIUM (integrations) | Monorepo structure and `"use client"` rules are well-established. MSW + App Router dual-runtime pattern is known but has version-specific nuances. |
| Pitfalls | HIGH | CRITICAL-1 through CRITICAL-5 are the most-reported pain points in this exact stack combination across community documentation. |

**Overall confidence:** HIGH for Phase 1 decisions. MEDIUM for Phases 4-5 complex component implementation details.

### Gaps to Address

- **Tailwind v4 + Storybook 10 empirical validation:** ARCHITECTURE.md rates this MEDIUM confidence. Must be tested before building the design system. Allocate half a day to validate the integration is working before committing to v4.
- **`next/font/local` cross-package path resolution:** Both STACK.md and PITFALLS.md flag this as a known gotcha. The fallback (define fonts in each app's layout.tsx rather than a shared package) is well-understood, but which approach works must be discovered during scaffold.
- **MSW `instrumentation.ts` stability in Next.js 15:** PITFALLS.md notes this was experimental in Next.js 14. Next.js 15 may have stabilized it. Verify before relying on server-side MSW mocking.
- **SOW Blueprint Editor approach:** No research was conducted on synchronized multi-panel scroll with diff highlighting. A focused technical spike is needed before this component is planned in Phase 5.

---

## Sources

### Primary (HIGH confidence)
- npm registry — all package versions, peer dependencies, dist-tags verified 2026-02-26
- STACK.md (`.planning/research/STACK.md`) — stack decisions with npm verification
- ARCHITECTURE.md (`.planning/research/ARCHITECTURE.md`) — monorepo structure, `"use client"` patterns, Tailwind content paths
- PITFALLS.md (`.planning/research/PITFALLS.md`) — integration failure modes

### Secondary (MEDIUM confidence)
- FEATURES.md (`.planning/research/FEATURES.md`) — component inventory, complexity tiers, portal dependency map
- UX research foundation (`ux-research/01-ux-research-foundation.md`) — persona constraints (privacy, language-first UX)
- UX information architecture (`ux-research/04-information-architecture.md`) — ~230 screens, portal sitemap depth

### Tertiary (LOW confidence — needs validation during implementation)
- Tailwind v4 `@source` directive behavior in Turborepo monorepos — not empirically tested; inferred from v4 documentation patterns
- SOW Blueprint Editor implementation approach — no existing library covers 4-panel synchronized scroll with diff highlighting
- `next/font/local` cross-package resolution behavior in Next.js 15.5 monorepos

---

*Research completed: 2026-02-26*
*Ready for roadmap: yes*
