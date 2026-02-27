# Requirements: GlimmoraTeam™

**Defined:** 2026-02-27
**Milestone:** v1.1 Frontend Polish
**Core Value:** Enterprise uploads SOW → APG decomposes → verified contributors deliver evidence → enterprise reviews and releases payment — all without manual recruitment or PM overhead.

---

## v1 Requirements

Requirements for v1.1 milestone. Each maps to roadmap phases (7-13).

### TEST — Component Test Coverage

- [ ] **TEST-01**: Every @glimmora/ui component (DS-01 through DS-47) has a Vitest + Testing Library test file that verifies: renders without errors, all variant props render, and critical ARIA attributes are present
- [ ] **TEST-02**: Governance components have behavioral privacy tests — EvidenceViewer renders no contributor identity fields, SkillGenomePanel renders no ranking or comparison UI, AnonymizedTeamCard rejects name/photo/initials props at the type level and renders only anonymous seed-based avatar
- [ ] **TEST-03**: Core interactive components (Button, Input, Select, DataTable, FileUpload, AppShell, Avatar) have interaction tests covering all variants, disabled/loading states, and keyboard event handling
- [ ] **TEST-04**: All 5 portals (women, university, enterprise, mentor, admin) have smoke tests — every registered route renders without throwing
- [ ] **TEST-05**: Form components (Input, Select, Checkbox, Radio, Switch) have validation error state tests and ARIA attribute coverage (aria-invalid, aria-describedby on error message)
- [ ] **TEST-06**: DataTable has tests for: column rendering, sort-on-header-click, pagination controls, row selection toggle, and empty state
- [ ] **TEST-07**: Avatar anonymous mode is deterministic — given the same seed string, the component always renders the same SVG shape and color combination
- [ ] **TEST-08**: MSW mock factory functions have type-correctness tests — factory outputs are validated against @glimmora/types interfaces to confirm mock shapes match the API contract

### A11Y — Accessibility

- [ ] **A11Y-01**: All 47 @glimmora/ui Storybook stories pass axe-core audit (via @storybook/addon-a11y) with zero critical or serious violations
- [ ] **A11Y-02**: All interactive components support full keyboard navigation — Tab moves focus, Enter/Space activate buttons and form controls, Arrow keys work in compound widgets (Tabs, Accordion, Select, RadioGroup)
- [ ] **A11Y-03**: All form inputs across all 5 portals have properly associated labels — no placeholder-as-label anti-pattern, no orphaned inputs
- [ ] **A11Y-04**: Color contrast meets WCAG 2.1 AA (4.5:1 for normal text, 3:1 for large text) — body text on warm cream (#FAF7F4), text on terracotta (#A0614A), white text on gradient cards
- [ ] **A11Y-05**: All icon-only buttons across all 5 portals have aria-label — no unlabeled interactive elements
- [ ] **A11Y-06**: Focus rings are visible on all interactive elements across all 5 portals — outline-none is not used without a visible alternative
- [ ] **A11Y-07**: Women's Portal onboarding flow (language select → welcome → 4-step onboarding) has correct heading hierarchy (h1 → h2 → h3) and is navigable by screen reader in logical order

### MOB — Mobile Responsive

- [ ] **MOB-01**: All 5 portals render correctly at 375px viewport (iPhone SE) — no horizontal overflow, no clipped or hidden content, all primary actions reachable
- [ ] **MOB-02**: AppShell Sidebar collapses to a mobile-friendly navigation pattern at viewports < 768px — hamburger menu, slide-over, or bottom navigation bar
- [ ] **MOB-03**: 3-panel ResizablePanelGroup layouts (Mentor review detail, Enterprise blueprint editor, Admin dispute detail) stack vertically at viewports < 1024px — panels become full-width stacked sections
- [ ] **MOB-04**: DataTable is usable on mobile — either horizontal scroll with a sticky first column, or a responsive card layout that preserves all data
- [ ] **MOB-05**: Women's Portal onboarding flow (language select, WhatsApp-style welcome, 4-step onboarding) is fully functional and visually correct at 375px
- [ ] **MOB-06**: Enterprise Portal Gantt timeline supports touch-scrollable horizontal scroll on mobile without layout breaking
- [ ] **MOB-07**: KPI card grids wrap responsively — 4-column on desktop, 2-column on tablet (768px), 1-column on mobile (375px)
- [ ] **MOB-08**: All form inputs across all portals have minimum 44×44px touch targets; the mobile keyboard does not obscure the active input field

### POL — Polish + Missing Features

- [ ] **POL-01**: Admin Panel adds "PoDL Ledger" as a 6th report type — generates a platform-wide credential audit table filterable by date range, project, and user type (Women/Student/Alumni)
- [ ] **POL-02**: Enterprise portal MSW evidence factory (`apps/enterprise-portal/src/lib/msw/factories/evidence.ts`) no longer populates `contributorId` — factory models the correct API contract that the backend will deliver to enterprise clients
- [ ] **POL-03**: Miller Display and Avenir LT Std font files are sourced and integrated via `next/font/local` in all 5 portal `layout.tsx` files — fonts render correctly in portal runtimes (not just Storybook)
- [ ] **POL-04**: All 4 `OTPConfirmationDialog` import sites in enterprise-portal are standardized to the barrel import (`@/components/shared`) instead of direct file paths
- [ ] **POL-05**: `PoDL.verifiedByMentorId` is removed from the contributor-facing `@glimmora/types` PoDL interface; Women's Portal and University Portal MSW credential factories no longer populate this field
- [ ] **POL-06**: Admin Panel MSW settings routes (GET/PATCH/POST `/api/admin/settings/admins`) are extracted from `audit-log.ts` into a dedicated `settings.ts` handler file, registered as `settingsHandlers` in `handlers/index.ts`

---

## v2 Requirements (Deferred)

### Real-Time Features
- **RT-01**: Real-time notifications via WebSockets — currently simulated with TanStack Query polling
- **RT-02**: Live APG activity feed updates without page refresh

### Advanced Testing
- **ADV-TEST-01**: E2E testing with Playwright — full user journey flows (requires backend integration)
- **ADV-TEST-02**: Visual regression testing with Chromatic or Percy

### Community & Content
- **COMM-01**: In-app video recording for evidence submission (v1.0 supports video URL only)
- **COMM-02**: Rich text editor for evidence text submissions (Tiptap vs plain textarea)
- **COMM-03**: Evidence commenting and annotation

### Analytics
- **ANALYTICS-01**: Advanced Skill Genome visualizations (radar charts, growth trajectory graphs)
- **ANALYTICS-02**: Advanced custom report builder with drag-and-drop for Admin

### Internationalization
- **I18N-01**: Multi-language content management — CMS-backed i18n string implementation (v1.0 designs for it; v1.1 doesn't implement it)

### Mobile Native
- **MOBILE-01**: PWA service worker + push notifications
- **MOBILE-02**: Mobile-optimized component variants for Women's Portal (mobile-first component redesign)

---

## Out of Scope (v1.1)

| Feature | Reason |
|---------|--------|
| Backend implementation | Separate developer; MSW mocks + @glimmora/types are the contract |
| Real authentication (Keycloak) | Backend scope — mock auth stays for this milestone |
| WhatsApp Business API integration | Backend scope — UX is designed, integration is not frontend |
| Real payment processing | Backend scope — UI only |
| Deployment pipeline / CI | Out of scope for frontend dev phase |
| Dark mode | Doubles token QA effort; warm earthy palette is designed for light mode only |
| Public profiles / leaderboards | Architecture constraint — never build |
| Contributor identity in review UI | Architecture constraint — always blind |
| E2E testing with real backend | Requires backend integration — v2+ |
| Advanced report builder (drag-and-drop) | v2 — basic custom builder exists from v1.0 |

---

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| TEST-01 | Phase 8 | Pending |
| TEST-02 | Phase 9 | Pending |
| TEST-03 | Phase 9 | Pending |
| TEST-04 | Phase 10 | Pending |
| TEST-05 | Phase 9 | Pending |
| TEST-06 | Phase 9 | Pending |
| TEST-07 | Phase 8 | Pending |
| TEST-08 | Phase 10 | Pending |
| A11Y-01 | Phase 11 | Pending |
| A11Y-02 | Phase 11 | Pending |
| A11Y-03 | Phase 12 | Pending |
| A11Y-04 | Phase 12 | Pending |
| A11Y-05 | Phase 12 | Pending |
| A11Y-06 | Phase 12 | Pending |
| A11Y-07 | Phase 12 | Pending |
| MOB-01 | Phase 13 | Pending |
| MOB-02 | Phase 13 | Pending |
| MOB-03 | Phase 13 | Pending |
| MOB-04 | Phase 13 | Pending |
| MOB-05 | Phase 13 | Pending |
| MOB-06 | Phase 13 | Pending |
| MOB-07 | Phase 13 | Pending |
| MOB-08 | Phase 13 | Pending |
| POL-01 | Phase 7 | Pending |
| POL-02 | Phase 7 | Pending |
| POL-03 | Phase 7 | Pending |
| POL-04 | Phase 7 | Pending |
| POL-05 | Phase 7 | Pending |
| POL-06 | Phase 7 | Pending |

**Coverage:**
- v1 requirements: 29 total
- Mapped to phases: 29/29
- Unmapped: 0

---
*Requirements defined: 2026-02-27*
*Last updated: 2026-02-27 — traceability populated by roadmapper (phases 7-13)*
