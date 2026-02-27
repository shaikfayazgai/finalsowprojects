# GlimmoraTeam™ Roadmap

## Overview

GlimmoraTeam is a 5-portal frontend monorepo (Women's, University, Enterprise, Mentor, Admin) sharing a Radix-based design system, TypeScript contracts, and Tailwind configuration. This roadmap delivers the complete frontend in 6 phases: monorepo infrastructure and foundational design system first, then the full component library, then portals ordered by shared-component reuse (Women's + University together), governance complexity (Mentor, Enterprise), and finally the Admin Panel which depends on all entity types existing. All 162 v1 requirements are mapped. All data is mocked via MSW; Storybook is the backend handoff artifact.

## Phases

- [x] **Phase 1: Monorepo Infrastructure + Design System Foundation** - Working monorepo with 5 app shells, shared packages, and core UI primitives verified end-to-end
- [x] **Phase 2: Design System Completion** - Full component library covering layout, governance, and data visualization components
- [x] **Phase 3: Women's Portal + University Portal** - Two contributor portals with onboarding, task delivery, evidence submission, and credential flows
- [x] **Phase 4: Mentor Portal** - 3-panel review layout, evidence viewer, review queue, and skill tag verification
- [x] **Phase 5: Enterprise Portal** - SOW upload, 4-panel Blueprint Editor, Gantt timeline, evidence review, and payment flows
- [x] **Phase 6: Admin Panel** - Platform oversight, user management, dispute resolution, reports, and APG configuration

## Phase Details

### Phase 1: Monorepo Infrastructure + Design System Foundation
**Goal**: A developer can run all 5 portal dev servers, view the Storybook with foundational components, and see a canary page in each portal consuming shared UI, types, and mock data -- proving the entire toolchain works end-to-end before feature development begins.
**Depends on**: Nothing (first phase)
**Requirements**: INFRA-01, INFRA-02, INFRA-03, INFRA-04, INFRA-05, INFRA-06, INFRA-07, INFRA-08, INFRA-09, INFRA-10, INFRA-11, INFRA-12, DS-01, DS-02, DS-03, DS-04, DS-05, DS-06, DS-07, DS-08, DS-09, DS-10
**Success Criteria** (what must be TRUE):
  1. Running `pnpm dev` starts all 5 portal dev servers on ports 3001-3005 and each renders a page consuming at least one `@glimmora/ui` component styled with the correct brand tokens (terracotta primary, Miller Display headings, Avenir body text)
  2. Storybook launches at port 6006 showing stories for Button, Input, Select, Checkbox, Radio, Switch, Dialog, Tooltip with correct warm-earth styling and accessibility audit passing via a11y addon
  3. A canary page in any portal fetches mock data through TanStack Query backed by MSW (both browser and server-side), displays it using a shared UI component, and survives a hard refresh without connection errors
  4. `@glimmora/types` exports TypeScript interfaces (UserRole, Task, Project, SOW, Evidence, PoDL, SkillGenome) that are consumed by both MSW handlers and portal pages without type errors
  5. `pnpm turbo build` completes successfully across all workspaces with zero type-check and lint errors
**Plans**: 4 plans

Plans:
- [ ] 01-01-PLAN.md -- Monorepo scaffold + @glimmora/config + 5 portal app shells (Wave 1)
- [ ] 01-02-PLAN.md -- @glimmora/types interfaces + MSW v2 dual-runtime + TanStack Query + Zustand (Wave 2)
- [ ] 01-03-PLAN.md -- @glimmora/ui DS-01 through DS-10 components + Storybook 10 (Wave 2)
- [ ] 01-04-PLAN.md -- Canary validation across all 5 portals (Wave 3)

### Phase 2: Design System Completion
**Goal**: The full `@glimmora/ui` component library is complete in Storybook -- every layout shell, governance-specific component, data table, file upload, chart, and visualization needed by any portal is documented, styled, and accessible, ready for portal pages to compose.
**Depends on**: Phase 1
**Requirements**: DS-11, DS-12, DS-13, DS-14, DS-15, DS-16, DS-17, DS-18, DS-19, DS-20, DS-21, DS-22, DS-23, DS-24, DS-25, DS-26, DS-27, DS-28, DS-29, DS-30, DS-31, DS-32, DS-33, DS-34, DS-35, DS-36, DS-37, DS-38, DS-39, DS-40, DS-41, DS-42, DS-43, DS-44, DS-45, DS-46, DS-47
**Success Criteria** (what must be TRUE):
  1. A developer browsing Storybook can see and interact with every component needed by portal pages -- AppShell with collapsible Sidebar, DataTable with sorting and pagination, FileUpload with drag-and-drop, Stepper for onboarding flows, SlideOutPanel, and all form inputs -- each rendering with warm-earth design tokens
  2. Governance-specific components are visible in Storybook: Evidence Viewer (tabbed Code/Document/Link/Video/Text with contributor identity hidden), PoDL Credential Card, APG Activity Feed, Skill Genome Panel, Anonymized Team Member Card, and Timeline Bar -- each demonstrating their unique behavioral constraints
  3. Data visualization components (Bar Chart, Progress Ring, Sparkline, Activity Heatmap) render in Storybook with terracotta/brand color fills and warm grid lines
  4. Gradient KPI Cards render the primary gradient (#A0614A to #C4A23A) and nature gradient (#4A6741 to #3A8FA0) correctly, with Miller Display numbers at 36-48px
  5. All Storybook stories pass the accessibility addon audit (axe-core) with zero critical violations
**Plans**: 4 plans

Plans:
- [ ] 02-01-PLAN.md -- Interactive components: DS-11..DS-27 (Dropdown, ContextMenu, Popover, Tabs, Accordion, Slider, Avatar, Badge, Tag, Toast, Progress, Spinner, Skeleton, DatePicker, FileUpload, Stepper, Combobox) (Wave 1)
- [ ] 02-02-PLAN.md -- Layout and structure: DS-28..DS-37 (Card, GradientCard, Sidebar, TopBar, AppShell, SlideOutPanel, PageHeader, EmptyState, DataTable, KPIStatCard) (Wave 2)
- [ ] 02-03-PLAN.md -- Governance components: DS-38..DS-43 (EvidenceViewer, PoDLCard, APGFeed, SkillGenomePanel, AnonymizedTeamCard, TimelineBar) (Wave 3)
- [ ] 02-04-PLAN.md -- Data visualization: DS-44..DS-47 (BarChart, ProgressRing, Sparkline, ActivityHeatmap) (Wave 1)

### Phase 3: Women's Portal + University Portal
**Goal**: Women contributors can complete the full journey from language selection through onboarding, task delivery, evidence submission, earnings tracking, and community support -- and university students can do the same plus PoDL credential management and faculty governor oversight -- all with mock data driving realistic flows.
**Depends on**: Phase 2
**Requirements**: WP-01, WP-02, WP-03, WP-04, WP-05, WP-06, WP-07, WP-08, WP-09, WP-10, WP-11, WP-12, WP-13, WP-14, WP-15, WP-16, WP-17, WP-18, WP-19, WP-20, WP-21, WP-22, UP-01, UP-02, UP-03, UP-04, UP-05, UP-06, UP-07, UP-08, UP-09, UP-10, UP-11, UP-12
**Success Criteria** (what must be TRUE):
  1. A person can open the Women's Portal, select a language (Urdu/English/Arabic) as the FIRST interaction, see a WhatsApp-style welcome screen, register, and complete 4-step onboarding with privacy guarantees visible throughout -- arriving at a dashboard with gradient KPI cards and APG activity feed within a believable flow
  2. A person can navigate to a task, view its brief with APG guidance and skill tags, submit evidence (file upload, URL, code paste, video URL, or text), track submission status through review stages, view rework feedback from a mentor, and resubmit -- all driven by MSW mock data
  3. A person can view their private Skill Genome (no peer comparison visible anywhere), see how completed tasks contributed to skill growth, view earnings with pending/released/withdrawal history, and access PoDL credentials
  4. A university student can complete onboarding with university email verification, discover and accept tasks, view anonymous team collaboration context, and export PoDL credentials as PDF -- and an alumni user can reactivate with preserved PoDL history
  5. A University Strategic Governor (faculty) can view aggregated institutional metrics and anonymized cohort trends with zero individual student identifiers visible, and configure which task categories their institution participates in
**Plans**: 5 plans

Plans:
- [ ] 03-01-PLAN.md -- Foundation: @glimmora/types extensions + next-intl i18n + Women's Portal pre-auth/onboarding (Wave 1)
- [ ] 03-02-PLAN.md -- Women's Portal AppShell + dashboard + task flow + evidence submission (Wave 2)
- [ ] 03-03-PLAN.md -- Women's Portal Skill Genome, earnings, PoDL, messages, settings (Wave 3)
- [ ] 03-04-PLAN.md -- University Portal pre-auth + all student authenticated pages (Wave 2)
- [ ] 03-05-PLAN.md -- University Portal alumni reactivation + Strategic Governor views (Wave 3)

### Phase 4: Mentor Portal
**Goal**: Mentors can manage their review queue, conduct blind evidence reviews in the 3-panel layout, deliver structured approve/rework/reject decisions, verify contributor skill tags, and track their own tier progression and impact metrics.
**Depends on**: Phase 3 (evidence submission flows must exist for review to be meaningful)
**Requirements**: MP-01, MP-02, MP-03, MP-04, MP-05, MP-06, MP-07, MP-08, MP-09, MP-10, MP-11, MP-12, MP-13, MP-14, MP-15, MP-16, MP-17, MP-18, MP-19, MP-20
**Success Criteria** (what must be TRUE):
  1. A mentor applicant can submit an application, see APG review status, and upon approval complete 4-step onboarding (profile, expertise/skill tags, capacity hours, orientation/code of conduct) -- arriving at the review queue
  2. A mentor can view their review queue with Pending (SLA timers visible), In Progress (auto-saved drafts), and Completed (final decisions with appeal status) tabs -- and can skip a task (with reason) or request an SLA extension
  3. A mentor can open a review in the 3-panel layout -- task context on the left, evidence viewer (tabbed by type with contributor identity hidden) in the center, review form on the right -- and submit an Approve, Rework Required (with specific items to address), or Reject (with required rejection reason and non-compliance evidence) decision
  4. A mentor can view their tier status (Bronze/Silver/Gold/Elite), impact metrics (total reviews, average time, rework rate, appeals overturned), and manage their expertise skill tags and capacity settings
  5. A mentor can process skill tag verification requests from the verification queue, verifying or disputing contributor skill claims with evidence assessment
**Plans**: 4 plans

Plans:
- [x] 04-01-PLAN.md -- Mentor types + react-resizable-panels + pre-auth application + 4-step onboarding (Wave 1)
- [x] 04-02-PLAN.md -- AppShell layout + review queue with 3 tabs, SLA timers, skip/extend (Wave 2)
- [x] 04-03-PLAN.md -- 3-panel review detail layout with evidence viewer and decision forms (Wave 3)
- [x] 04-04-PLAN.md -- Mentor profile, skill tag verification, messaging, and settings (Wave 3)

### Phase 5: Enterprise Portal
**Goal**: Enterprise requesters can upload SOWs and see APG decomposition, edit project blueprints in the 4-panel editor, monitor projects via Gantt timeline and KPI dashboards, review evidence packs, manage payment release flows, and export PoDL/ESG compliance reports.
**Depends on**: Phase 3 (contributor evidence flows), Phase 4 (mentor review flows -- enterprise sees review outcomes)
**Requirements**: EP-01, EP-02, EP-03, EP-04, EP-05, EP-06, EP-07, EP-08, EP-09, EP-10, EP-11, EP-12, EP-13, EP-14, EP-15, EP-16, EP-17, EP-18, EP-19, EP-20, EP-21, EP-22, EP-23, EP-24, EP-25, EP-26
**Success Criteria** (what must be TRUE):
  1. A person can upload a SOW document (PDF/DOCX), see the APG intelligence display with extracted tasks, skill requirements, and timeline estimates, then use the 4-panel Blueprint Editor (SOW context, task tree, team pool preview, project settings) with all panels synchronized -- and approve the blueprint with OTP confirmation
  2. A person can view their project dashboard with gradient KPI cards (completion %, evidence packs pending, payments released vs pending, timeline health), APG activity feed, and navigate the 7-tab project detail (Overview, Timeline, Evidence Packs, Rework Requests, Escalation Centre, Payment Release, Team Summary with anonymized contributors)
  3. A person can view the project timeline as a horizontal Gantt chart with gradient milestone bars, toggle to list view, and see milestone health status (on-track/at-risk/delayed) via color indicators
  4. A person can review evidence packs (contributor identity hidden), approve packs (triggering payment calculation), request rework with structured feedback, or escalate to mentor review -- and can release payments manually, configure auto-payment, view APG-silent approvals log, and process bulk payment release
  5. A person can export PoDL audit reports and ESG compliance reports, view completed project archives, manage organization profile and team access, and configure payment release preferences
**Plans**: 6 plans

Plans:
- [x] 05-01-PLAN.md -- SOW upload and APG intelligence display (Wave 1)
- [x] 05-02-PLAN.md -- 4-panel Blueprint Editor (Wave 2)
- [x] 05-03-PLAN.md -- Project dashboard and 7-tab project detail (Wave 2)
- [x] 05-04-PLAN.md -- Timeline/Gantt view (Wave 3)
- [x] 05-05-PLAN.md -- Evidence review and payment release flows (Wave 4)
- [x] 05-06-PLAN.md -- Compliance exports and enterprise settings (Wave 5)

### Phase 6: Admin Panel
**Goal**: Platform administrators can oversee the entire platform -- monitoring live stats, managing all user types, intervening in projects, resolving disputes (including Safety Case protocol), generating reports, managing the skill taxonomy and content, and configuring APG behavior (Super Admin only).
**Depends on**: Phase 5 (all entity types, user roles, and project states must exist)
**Requirements**: AP-01, AP-02, AP-03, AP-04, AP-05, AP-06, AP-07, AP-08, AP-09, AP-10, AP-11, AP-12, AP-13, AP-14, AP-15, AP-16, AP-17, AP-18, AP-19, AP-20, AP-21, AP-22, AP-23
**Success Criteria** (what must be TRUE):
  1. An admin can view the platform overview dashboard with live-style stats (active users, projects, pending reviews, disputes, payments held, system health) and a system alert feed -- all refreshing via TanStack Query polling against MSW mocks
  2. An admin can browse all users across 6 types with filtering, view any user's 6-tab detail (Profile, Activity, Projects, Earnings/Payments, Skill Genome, Audit Log), process the onboarding verification queue (approve/reject with reason), suspend/reactivate accounts, and review ID/credential verification submissions
  3. An admin can view all projects in the 10-tab admin view (including APG Activity Log, Admin Interventions, Freeze/Unfreeze), freeze a project (pausing all activity), and record immutable admin interventions
  4. An admin can process disputes across 5 types (Payment, Quality, Conduct, Technical, Safety) with 5 decision types (Approve, Reject, Rework, Escalate, Safety Case), initiate Safety Case protocol with full privacy protection, and view dispute history with audit trail
  5. An admin can generate 5 report types (Platform Health, User Growth, Delivery Performance, Payment Flow, Dispute Analytics), build custom reports, export as CSV/PDF, manage the skill taxonomy, publish platform announcements, and -- as Super Admin only -- modify APG configuration and manage admin roles, with a full immutable audit log of all admin actions
**Plans**: 5 plans

Plans:
- [x] 06-01-PLAN.md -- Admin foundation: types, auth store, AppShell, dashboard, MSW (Wave 1)
- [x] 06-02-PLAN.md -- User management: list, 6-tab detail, verification queue (Wave 2)
- [x] 06-03-PLAN.md -- Project management: list, 10-tab detail, freeze, interventions (Wave 2)
- [x] 06-04-PLAN.md -- Dispute resolution: queue, 3-panel detail, Safety Case protocol (Wave 2)
- [x] 06-05-PLAN.md -- Reports, content, APG config, audit log, settings (Wave 4)

## Coverage

| Phase | Requirements | Count |
|-------|-------------|-------|
| 1. Monorepo Infrastructure + DS Foundation | INFRA-01 through INFRA-12, DS-01 through DS-10 | 22 |
| 2. Design System Completion | DS-11 through DS-47 | 37 |
| 3. Women's Portal + University Portal | WP-01 through WP-22, UP-01 through UP-12 | 34 |
| 4. Mentor Portal | MP-01 through MP-20 | 20 |
| 5. Enterprise Portal | EP-01 through EP-26 | 26 |
| 6. Admin Panel | AP-01 through AP-23 | 23 |
| **Total** | | **162** |

All 162 v1 requirements mapped. No orphans. No duplicates.

## Progress

**Execution Order:** 1 -> 2 -> 3 -> 4 -> 5 -> 6

| Phase | Plans Complete | Status | Completed |
|-------|---------------|--------|-----------|
| 1. Monorepo Infrastructure + DS Foundation | 4/4 | Complete ✓ | 2026-02-26 |
| 2. Design System Completion | 4/4 | Complete ✓ | 2026-02-26 |
| 3. Women's Portal + University Portal | 5/5 | Complete ✓ | 2026-02-26 |
| 4. Mentor Portal | 4/4 | Complete ✓ | 2026-02-27 |
| 5. Enterprise Portal | 6/6 | Complete ✓ | 2026-02-27 |
| 6. Admin Panel | 5/5 | Complete ✓ | 2026-02-27 |
