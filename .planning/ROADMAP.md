# Roadmap: GlimmoraTeam™

## Milestones

- ✅ **v1.0 Frontend MVP** - Phases 1-6 (shipped 2026-02-27)
- 🚧 **v1.1 Frontend Polish** - Phases 7-13 (in progress)

## Phases

<details>
<summary>✅ v1.0 Frontend MVP (Phases 1-6) - SHIPPED 2026-02-27</summary>

See `.planning/milestones/v1.0-ROADMAP.md` for full phase details.

- [x] **Phase 1: Monorepo Infrastructure + DS Foundation** — 4 plans
- [x] **Phase 2: Design System Completion** — 4 plans
- [x] **Phase 3: Women's Portal + University Portal** — 5 plans
- [x] **Phase 4: Mentor Portal** — 4 plans
- [x] **Phase 5: Enterprise Portal** — 6 plans
- [x] **Phase 6: Admin Panel** — 5 plans

</details>

### 🚧 v1.1 Frontend Polish (In Progress)

**Milestone Goal:** Harden the frontend with full test coverage, accessibility compliance, mobile responsive polish, and tech debt cleanup — making the codebase production-ready before backend integration.

- [ ] **Phase 7: Tech Debt Cleanup** — 3 plans
- [ ] **Phase 8: Design System Test Foundation** — Vitest setup, render/variant/ARIA tests for all 47 DS components, Avatar determinism
- [ ] **Phase 9: Interactive + Governance Component Tests** — Privacy behavioral tests, interaction tests, form validation tests, DataTable tests
- [ ] **Phase 10: Portal Smoke Tests + Factory Validation** — Route smoke tests for all 5 portals, MSW factory type-correctness tests
- [ ] **Phase 11: Accessibility — Design System** — axe-core audit on all Storybook stories, keyboard navigation for all interactive components
- [ ] **Phase 12: Accessibility — Portal Level** — Form labels, icon-only button labels, focus rings, color contrast, heading hierarchy
- [ ] **Phase 13: Mobile Responsive** — 375px viewport for all portals, AppShell collapse, responsive components, portal-specific mobile flows

## Phase Details

### Phase 7: Tech Debt Cleanup
**Goal**: The codebase has clean API contracts, correct types, properly organized MSW handlers, production fonts, and a complete report suite — eliminating all known tech debt before test and polish work begins
**Depends on**: Phase 6 (v1.0 complete)
**Requirements**: POL-01, POL-02, POL-03, POL-04, POL-05, POL-06
**Success Criteria** (what must be TRUE):
  1. Enterprise portal MSW evidence factory produces mock data that matches the backend API contract — no `contributorId` field present in evidence responses
  2. The PoDL TypeScript interface in @glimmora/types has no `verifiedByMentorId` field, and Women's/University Portal credential factories produce data matching this cleaned interface
  3. Admin Panel has 6 report types (including PoDL Ledger) and the PoDL Ledger renders a filterable credential audit table with date range, project, and user type filters
  4. All 5 portals render Miller Display for headings and Avenir LT Std for body text when running in `next dev` (not just in Storybook)
  5. Admin Panel MSW handler files are organized with settings routes in their own `settings.ts` file, and all enterprise-portal OTPConfirmationDialog imports use the barrel pattern
**Plans:** 3 plans
Plans:
- [ ] 07-01-PLAN.md — Fix PoDL and Evidence types + downstream factories (POL-05, POL-02)
- [ ] 07-02-PLAN.md — Integrate production fonts + fix OTP imports (POL-03, POL-04)
- [ ] 07-03-PLAN.md — Extract settings handlers + add PoDL Ledger report (POL-06, POL-01)

### Phase 8: Design System Test Foundation
**Goal**: Every @glimmora/ui component has a passing test file that proves it renders, respects its variant props, and exposes correct ARIA attributes — establishing the test infrastructure and baseline coverage for the entire design system
**Depends on**: Phase 7 (clean types/contracts needed for accurate test assertions)
**Requirements**: TEST-01, TEST-07
**Success Criteria** (what must be TRUE):
  1. `pnpm vitest run` in the `packages/ui` workspace succeeds with all tests passing — one test file per DS component (DS-01 through DS-47), each verifying render-without-error, all variant props, and critical ARIA attributes
  2. Avatar component test proves determinism — calling render twice with the same seed string produces identical SVG shape and color output; different seeds produce different output
  3. Vitest + Testing Library + jsdom is configured in the monorepo with working coverage reporting
**Plans**: TBD

### Phase 9: Interactive + Governance Component Tests
**Goal**: Critical interactive components have thorough behavioral tests covering user interactions, state transitions, and privacy guarantees — proving the design system components work correctly under real usage patterns
**Depends on**: Phase 8 (test infrastructure and baseline tests in place)
**Requirements**: TEST-02, TEST-03, TEST-05, TEST-06
**Success Criteria** (what must be TRUE):
  1. Governance privacy tests pass — EvidenceViewer test proves no contributor identity fields render; SkillGenomePanel test proves no ranking/comparison UI; AnonymizedTeamCard test proves name/photo/initials props are rejected at the type level and only seed-based anonymous avatars render
  2. Button, Input, Select, DataTable, FileUpload, AppShell, and Avatar have interaction tests covering all variants, disabled states, loading states, and keyboard event handling (Enter, Space, Tab, Escape as applicable)
  3. Form components (Input, Select, Checkbox, Radio, Switch) have validation error state tests that verify `aria-invalid` is set on error and `aria-describedby` links to the rendered error message element
  4. DataTable has focused behavioral tests for column rendering, sort-on-header-click toggling, pagination control navigation, row selection toggle, and empty state rendering
**Plans**: TBD

### Phase 10: Portal Smoke Tests + Factory Validation
**Goal**: All 5 portal applications render every route without crashing, and all MSW mock factories produce data that is structurally valid against the @glimmora/types API contract — catching integration-level breakage
**Depends on**: Phase 8 (test infrastructure), Phase 7 (clean factories/types)
**Requirements**: TEST-04, TEST-08
**Success Criteria** (what must be TRUE):
  1. Every registered route in each of the 5 portals (women, university, enterprise, mentor, admin) has a smoke test that renders the route component without throwing — `pnpm vitest run` passes across all portal workspaces
  2. MSW factory functions across all portals have type-correctness tests — each factory's output is validated against the corresponding @glimmora/types interface, confirming mock data shapes match the API contract with no extra or missing fields
**Plans**: TBD

### Phase 11: Accessibility — Design System
**Goal**: The shared @glimmora/ui component library passes automated accessibility audit and supports full keyboard navigation — fixing issues at the source so all 5 portals inherit compliant components
**Depends on**: Phase 9 (interaction tests exist to catch regressions from a11y fixes)
**Requirements**: A11Y-01, A11Y-02
**Success Criteria** (what must be TRUE):
  1. All 47 @glimmora/ui Storybook stories pass axe-core audit via @storybook/addon-a11y with zero critical or serious violations — verified by running Storybook accessibility checks
  2. All interactive components support keyboard navigation — Tab moves focus between elements, Enter/Space activate buttons and form controls, Arrow keys navigate within compound widgets (Tabs, Accordion, Select, RadioGroup)
**Plans**: TBD

### Phase 12: Accessibility — Portal Level
**Goal**: All 5 portals meet WCAG 2.1 AA standards with properly labeled inputs, visible focus indicators, sufficient color contrast, and logical heading structure — users with assistive technology can navigate every portal
**Depends on**: Phase 11 (design system components are accessible first)
**Requirements**: A11Y-03, A11Y-04, A11Y-05, A11Y-06, A11Y-07
**Success Criteria** (what must be TRUE):
  1. Every form input across all 5 portals has a properly associated `<label>` element — no placeholder-as-label anti-pattern, no orphaned inputs without associated labels
  2. Every icon-only button across all 5 portals has an `aria-label` attribute — no interactive elements without accessible names
  3. All interactive elements across all 5 portals have visible focus rings — no instance of `outline-none` without a visible focus alternative (e.g., ring utility, box-shadow, or border change)
  4. Color contrast meets WCAG 2.1 AA — body text (#6B4C3B) on warm cream (#FAF7F4) passes 4.5:1, heading text (#2C1F1A) on cream passes, white text on terracotta (#A0614A) gradient cards passes 3:1 for large text
  5. Women's Portal onboarding flow (language select through 4-step onboarding) has correct heading hierarchy (h1 > h2 > h3, no skipped levels) and reads in logical order for screen readers
**Plans**: TBD

### Phase 13: Mobile Responsive
**Goal**: All 5 portals are fully usable at 375px viewport width with proper navigation, readable content, functional forms, and touch-friendly interactions — no portal is desktop-only
**Depends on**: Phase 12 (accessible components before responsive layout changes), Phase 9 (interaction tests catch regressions)
**Requirements**: MOB-01, MOB-02, MOB-03, MOB-04, MOB-05, MOB-06, MOB-07, MOB-08
**Success Criteria** (what must be TRUE):
  1. All 5 portals render at 375px viewport without horizontal overflow, clipped content, or unreachable primary actions — verified by visual inspection at iPhone SE width
  2. AppShell sidebar collapses to a mobile navigation pattern (hamburger menu, slide-over, or bottom nav) at viewports below 768px — desktop sidebar is not visible on mobile
  3. 3-panel ResizablePanelGroup layouts (Mentor review, Enterprise blueprint, Admin dispute) stack vertically as full-width sections at viewports below 1024px; DataTable either scrolls horizontally with sticky first column or converts to a card layout on mobile
  4. Women's Portal onboarding flow (language select, WhatsApp-style welcome, 4-step wizard) is fully functional and visually correct at 375px; Enterprise Gantt timeline supports touch-scrollable horizontal scroll on mobile
  5. KPI card grids wrap responsively (4-col desktop, 2-col at 768px, 1-col at 375px) and all form inputs have minimum 44x44px touch targets with no mobile keyboard obscuring the active input field
**Plans**: TBD

## Progress

**Execution Order:** Phase 7 → 8 → 9 → 10 → 11 → 12 → 13

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1-6 | v1.0 | 29/29 | Complete | 2026-02-27 |
| 7. Tech Debt Cleanup | v1.1 | 0/3 | Planned | - |
| 8. DS Test Foundation | v1.1 | 0/? | Not started | - |
| 9. Interactive + Governance Tests | v1.1 | 0/? | Not started | - |
| 10. Portal Smoke + Factory Tests | v1.1 | 0/? | Not started | - |
| 11. A11Y — Design System | v1.1 | 0/? | Not started | - |
| 12. A11Y — Portal Level | v1.1 | 0/? | Not started | - |
| 13. Mobile Responsive | v1.1 | 0/? | Not started | - |

---
*Roadmap created: 2026-02-27*
*Last updated: 2026-02-27*
