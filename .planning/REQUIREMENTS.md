# GlimmoraTeam™ — v1 Requirements

## How to Read This

- **REQ-ID format:** `[CATEGORY]-[NUMBER]`
- **v1 requirements** = must be implemented in this project
- **v2 requirements** = validated ideas, deferred to next milestone
- **Out of scope** = explicit exclusions with rationale

---

## v1 Requirements

### INFRA — Monorepo Infrastructure

- [x] **INFRA-01**: Turborepo monorepo initialized with pnpm workspaces containing `/apps` and `/packages` directories
- [x] **INFRA-02**: `@glimmora/config` package exports shared Tailwind v4 theme (CSS-first `@theme` config with all brand tokens), shared ESLint config, shared TypeScript base config
- [x] **INFRA-03**: `@glimmora/types` package exports all shared TypeScript interfaces — UserRole, Task, Project, SOW, Evidence, PoDL, SkillGenome, APIResponse wrapper — serving as backend API contracts
- [x] **INFRA-04**: `@glimmora/ui` package exports all design system components (built on Radix UI primitives + Tailwind), with each Radix-based component file marked `"use client"` individually (not the barrel export)
- [x] **INFRA-05**: Storybook 10.x configured in `@glimmora/ui` with correct Tailwind v4 PostCSS integration — all components documented with stories
- [x] **INFRA-06**: MSW v2 configured with dual-runtime support — browser service worker in each portal's `/public`, plus `instrumentation.ts` for server-side interception in each Next.js app
- [x] **INFRA-07**: All 5 Next.js 15.5.x apps scaffolded in `/apps` — each consuming `@glimmora/config`, `@glimmora/types`, `@glimmora/ui`
- [x] **INFRA-08**: Custom fonts configured — Miller Display and Avenir LT Std via `next/font/local` in Next.js apps, `@font-face` CSS in Storybook
- [x] **INFRA-09**: TanStack Query v5 provider configured per app — all data fetching goes through TanStack Query hooks backed by MSW handlers
- [x] **INFRA-10**: Zustand v5 store configured per app for client-side state (mock auth, UI state, locale)
- [x] **INFRA-11**: Turborepo build pipeline configured — `build`, `dev`, `storybook`, `lint`, `type-check` tasks with correct dependencies
- [x] **INFRA-12**: Canary validation — one complete component (Button) verified working in Storybook + Next.js page + MSW mock before proceeding to full build

### DS — Design System (`@glimmora/ui`)

**Foundation**
- [x] **DS-01**: Design tokens implemented in Tailwind v4 `@theme` — all brand colors, typography scale, spacing, border radius, shadow, gradient definitions
- [x] **DS-02**: Typography components — `Heading` (Miller Display), `Body` (Avenir LT Std), `Label`, `Caption` with correct weight and size variants
- [x] **DS-03**: Color palette accessible as Tailwind utility classes — `bg-brand-primary`, `text-espresso`, `border-sand`, etc.

**Interactive Components**
- [x] **DS-04**: Button — Primary (terracotta fill), Secondary (sand bg), Ghost, Destructive, Loading state, Icon variant; all sizes; Radix `Slot` for polymorphic rendering
- [x] **DS-05**: Input — Text, Textarea, Password (toggle show/hide), all with label, helper text, error state
- [x] **DS-06**: Select — Radix Select primitive, styled with warm design system
- [x] **DS-07**: Checkbox + Radio — Radix primitives, styled
- [x] **DS-08**: Switch/Toggle — Radix Switch primitive
- [x] **DS-09**: Dialog/Modal — Radix Dialog, slide-in animation via Framer Motion, overlay, focus trap
- [x] **DS-10**: Tooltip — Radix Tooltip, warm styling
- [ ] **DS-11**: Dropdown Menu — Radix DropdownMenu, warm styling
- [ ] **DS-12**: Context Menu — Radix ContextMenu
- [ ] **DS-13**: Popover — Radix Popover
- [ ] **DS-14**: Tabs — Radix Tabs, terracotta active indicator
- [ ] **DS-15**: Accordion — Radix Accordion
- [ ] **DS-16**: Slider — Radix Slider (for capacity/rating inputs)
- [ ] **DS-17**: Avatar — with fallback initials, size variants, anonymous mode (shows generated shape instead of initials for blind review)
- [ ] **DS-18**: Badge/Status Chip — Urgent, Normal, InProgress, Done, AtRisk; pill shape, 11px Avenir uppercase; all 5 status semantic colors
- [ ] **DS-19**: Tag — dismissible, non-dismissible; skill tags; category tags
- [ ] **DS-20**: Toast/Notification — Radix Toast, success/warning/error/info variants
- [ ] **DS-21**: Progress Bar — determinate, indeterminate; gradient variant for featured milestones
- [ ] **DS-22**: Spinner/Loader — ring spinner, Avenir label below
- [ ] **DS-23**: Skeleton — warm `#F0E4DA` shimmer (not grey) for loading states
- [ ] **DS-24**: File Upload — drag-and-drop zone, file type validation, progress indicator, multi-file support
- [ ] **DS-25**: Date Picker — via react-day-picker, warm calendar styling
- [ ] **DS-26**: Stepper — horizontal step indicator for multi-step onboarding flows
- [ ] **DS-27**: Combobox / Command Palette — Radix + cmdk, for search and command interfaces

**Layout & Structure**
- [ ] **DS-28**: Card — white `#FFFFFF`, 12px radius, warm shadow `0 2px 8px rgba(44,31,26,0.08)`, optional warm border `#EAD9CC`, padding 20-24px
- [ ] **DS-29**: Gradient Card — KPI hero card with primary gradient `#A0614A → #C4A23A`, white text; secondary card with nature gradient `#4A6741 → #3A8FA0`
- [ ] **DS-30**: Sidebar — collapsible ~240px, warm off-white `#FBF8F5`, logo top, avatar+name bottom, active item terracotta left-border accent
- [ ] **DS-31**: Top Action Bar — breadcrumb, search, avatar stack, primary CTA
- [ ] **DS-32**: AppShell — composed layout: Sidebar + TopBar + main content area
- [ ] **DS-33**: Slide-Out Panel — ~380px right panel, white `#FFFFFF`, `1px solid #EAD9CC` left border, slide-in 200ms ease-out animation
- [ ] **DS-34**: Page Header — Miller Display title, subtitle, optional breadcrumb, action area right
- [ ] **DS-35**: Empty State — illustration area, headline, body, CTA; warm styling
- [ ] **DS-36**: Table — column definitions, sorting, row selection, pagination; warm header background `#F5EDE6`
- [ ] **DS-37**: KPI Stat Card — Miller Display 36-48px number, label, trend indicator, optional sparkline

**Governance-Specific Components**
- [ ] **DS-38**: Evidence Viewer — tabbed multi-type display: Code (syntax highlighted), Document (PDF/image preview), Link (URL preview card), Video (embed/preview), Text; contributor identity hidden
- [ ] **DS-39**: PoDL Credential Card — immutable delivery record display, shareable, exportable; Miller Display headline, chain-verified indicator
- [ ] **DS-40**: APG Activity Feed — timestamped AI governor actions, icon per action type, expandable detail
- [ ] **DS-41**: Skill Genome Panel — private capability profile, evidence-backed tags, tier indicator, progress visualization; explicitly NO public comparison
- [ ] **DS-42**: Anonymized Team Member Card — avatar (generated, not photo), role label, skill tags visible, no name, no profile link
- [ ] **DS-43**: Timeline Bar — gradient milestone bar with 8px radius, hover shows date tooltip; featured (primary gradient), secondary (nature gradient), standard (`#EAD9CC`)

**Data Visualization**
- [ ] **DS-44**: Bar Chart — Recharts; terracotta fill, `#F0E4DA` unfilled track, `#EAD9CC` grid lines, `#9C8578` axis labels
- [ ] **DS-45**: Progress Ring — circular progress indicator; terracotta stroke on warm grey track
- [ ] **DS-46**: Sparkline — mini line chart for KPI cards; terracotta line
- [ ] **DS-47**: Activity Heatmap — contribution-style grid for productivity visualization

### WP — Women's Portal

**Pre-Auth & Onboarding**
- [ ] **WP-01**: User can select language as the FIRST interactive element (Urdu, English, Arabic — with RTL layout support for Urdu/Arabic)
- [ ] **WP-02**: User can see a WhatsApp-style welcome screen explaining the platform in culturally appropriate tone before any registration
- [ ] **WP-03**: User can register with email + password (no phone number required, no social login)
- [ ] **WP-04**: User can complete 4-step onboarding: (1) Basic Profile (name optional, display name required), (2) Devices & Connectivity (device type, internet stability), (3) Skill Assessment (self-reported skills, APG-guided), (4) Activation confirmation screen with next steps
- [ ] **WP-05**: User can see privacy guarantee messaging throughout onboarding — no public profile, no leaderboards, no peer comparison ever stated explicitly

**Dashboard**
- [ ] **WP-06**: User can view dashboard with gradient KPI cards (active tasks count, pending earnings, completed tasks, Skill Genome level)
- [ ] **WP-07**: User can view APG Activity Feed showing AI governor actions relevant to their work
- [ ] **WP-08**: User can view current active tasks summary with status and due dates

**Task Flow**
- [ ] **WP-09**: User can view task list with status-filtered tabs (Available, In Progress, Submitted, Completed)
- [ ] **WP-10**: User can view task detail page with: task brief, deliverables list, APG guidance, deadline, skill tags required
- [ ] **WP-11**: User can submit evidence for a task via multi-type submission form (File upload, URL link, Code snippet paste, Video URL, Text description) — multiple evidence items per submission
- [ ] **WP-12**: User can view submission status (Submitted → Under Review → Approved / Rework Required)
- [ ] **WP-13**: User can view rework request with mentor feedback and resubmit evidence

**Skill & Growth**
- [ ] **WP-14**: User can view their private Skill Genome (evidence-backed tags, tier, growth over time) — no peer comparison, no public ranking
- [ ] **WP-15**: User can see how each completed task contributed to their Skill Genome

**Earnings & PoDL**
- [ ] **WP-16**: User can view earnings dashboard (pending, released, total earned, withdrawal history)
- [ ] **WP-17**: User can view their PoDL credentials (immutable record per accepted delivery, downloadable)

**Communication**
- [ ] **WP-18**: User can send and receive messages with their assigned Community Support Lead (async, not live chat, no peer-to-peer messaging)

**Settings**
- [ ] **WP-19**: User can update profile settings (display name, bio, preferred language)
- [ ] **WP-20**: User can manage privacy settings (who can see what — defaults to most private)
- [ ] **WP-21**: User can manage notification preferences (in-app only, email)
- [ ] **WP-22**: User can update device/connectivity info (affects task assignment)

### UP — University Portal

**Students**
- [ ] **UP-01**: Student can complete onboarding with university email verification + student ID
- [ ] **UP-02**: Student can view dashboard with active tasks, PoDL count, earnings, academic year context
- [ ] **UP-03**: Student can discover and accept available tasks (filtered to skill level)
- [ ] **UP-04**: Student can submit evidence using the same multi-type evidence submission as Women's Portal
- [ ] **UP-05**: Student can view their PoDL Credentials page — display, share via link, export as PDF
- [ ] **UP-06**: Student can view team collaboration context (anonymous peer awareness — know others are on the same project, no names)
- [ ] **UP-07**: Student can view their private Skill Genome (same component as Women's Portal)

**Alumni Reactivation**
- [ ] **UP-08**: Alumni user can reactivate account with updated employment/career context
- [ ] **UP-09**: Alumni user's PoDL history is preserved and visible upon reactivation

**University Strategic Governor (Faculty)**
- [ ] **UP-10**: Governor can view aggregated platform metrics for their institution (students active, tasks completed, total PoDLs issued, earnings distributed) — NO individual student identifiers
- [ ] **UP-11**: Governor can view anonymized cohort performance trends (percentages, not names)
- [ ] **UP-12**: Governor can configure which task categories students from their institution can participate in

### EP — Enterprise Portal

**SOW Management**
- [ ] **EP-01**: User can upload SOW document (PDF, DOCX) and see APG intelligence display — decomposition preview showing extracted tasks, skill requirements, timeline estimates
- [ ] **EP-02**: User can use the 4-panel Blueprint Editor: (Panel 1) SOW context + highlighted clauses, (Panel 2) Task tree (APG-generated, editable), (Panel 3) Team pool preview (anonymized, skill-matched), (Panel 4) Project settings — all 4 panels synchronized
- [ ] **EP-03**: User can approve the blueprint and receive OTP confirmation before project goes live
- [ ] **EP-04**: User can view SOW version history (each iteration tracked)
- [ ] **EP-05**: User can archive completed SOWs

**Project Dashboard & Oversight**
- [ ] **EP-06**: User can view project dashboard with gradient KPI cards (tasks complete %, evidence packs pending review, payments released vs pending, timeline health)
- [ ] **EP-07**: User can view APG Activity Feed for their project (AI governor actions, auto-approvals, flags)
- [ ] **EP-08**: User can view Project Detail with 7 tabs: Overview, Timeline (Gantt + List toggle), Evidence Packs, Rework Requests, Escalation Centre, Payment Release, Team Summary (anonymized)

**Timeline / Gantt**
- [ ] **EP-09**: User can view project timeline as horizontal Gantt chart with gradient milestone bars, date ruler, today indicator
- [ ] **EP-10**: User can toggle between Gantt view and List view
- [ ] **EP-11**: User can see milestone health status (on-track, at-risk, delayed) via color indicators

**Evidence Review**
- [ ] **EP-12**: User can view Evidence Packs submitted by the team (contributor identity hidden in review mode)
- [ ] **EP-13**: User can approve an evidence pack (triggers payment calculation)
- [ ] **EP-14**: User can request rework with structured feedback form (required: rework reason, specific items to address)
- [ ] **EP-15**: User can escalate to Mentor review if unsure of quality

**Payment Release**
- [ ] **EP-16**: User can release payment manually per evidence pack (with confirmation)
- [ ] **EP-17**: User can view auto-payment settings (configure APG-triggered payment on approval)
- [ ] **EP-18**: User can view APG-silent approvals log (payments auto-released without manual intervention)
- [ ] **EP-19**: User can view bulk payment release for multiple packs simultaneously

**Compliance & Exports**
- [ ] **EP-20**: User can export PoDL report (immutable delivery record for audit)
- [ ] **EP-21**: User can export ESG compliance report
- [ ] **EP-22**: User can view completed projects archive with full PoDL trail

**Settings**
- [ ] **EP-23**: User can manage organization profile (company name, logo, billing)
- [ ] **EP-24**: User can manage team members who have access to the enterprise portal
- [ ] **EP-25**: User can configure payment release preferences (manual vs auto vs APG-silent threshold)
- [ ] **EP-26**: User can manage notification preferences

### MP — Mentor Portal

**Onboarding**
- [ ] **MP-01**: Mentor applicant can submit application (expertise areas, credentials, availability)
- [ ] **MP-02**: Mentor applicant can see APG review status (application under review → approved / rejected with reason)
- [ ] **MP-03**: Approved mentor can complete 4-step onboarding: (1) Mentor Profile, (2) Expertise + Skill Tags, (3) Capacity (weekly review hours), (4) Orientation + Code of Conduct acceptance

**Review Queue**
- [ ] **MP-04**: Mentor can view review queue with 3 tabs: Pending (SLA timer per item), In Progress (auto-saved drafts), Completed (final decisions + appeal status)
- [ ] **MP-05**: Mentor can skip a task in their queue (reassigned to next mentor, reason required)
- [ ] **MP-06**: Mentor can request SLA extension (reason required, Admin approval needed)

**Review Detail (3-Panel Layout)**
- [ ] **MP-07**: Mentor can view review detail in 3-panel layout: (Left Panel ~320px) Task context — brief, deliverables, skill tags required; (Center Panel ~flexible) Evidence Viewer — tabbed by evidence type, contributor identity hidden; (Right Panel ~320px) Review Form — structured feedback, decision
- [ ] **MP-08**: Mentor can switch evidence type tabs in the Evidence Viewer (Code, Document, Link, Video, Text)
- [ ] **MP-09**: Mentor can submit Approve decision with optional feedback comment
- [ ] **MP-10**: Mentor can submit Rework Required decision with: required field for specific items to address, optional guidance notes
- [ ] **MP-11**: Mentor can submit Reject decision with: required field for rejection reason, evidence of deliberate non-compliance required for rejection

**Mentor Profile & Growth**
- [ ] **MP-12**: Mentor can view their profile with tier status (Bronze / Silver / Gold / Elite) and tier progression requirements
- [ ] **MP-13**: Mentor can view impact metrics (total reviews, average review time, rework rate, appeals overturned rate)
- [ ] **MP-14**: Mentor can view their expertise skill tags and verification status

**Skill Tag Verification**
- [ ] **MP-15**: Mentor can view skill tag verification queue (contributor skill claims pending mentor verification)
- [ ] **MP-16**: Mentor can verify or dispute a skill tag claim with evidence assessment

**Communication**
- [ ] **MP-17**: Mentor can respond to platform messages (no initiation — mentors cannot contact contributors directly)

**Settings**
- [ ] **MP-18**: Mentor can update capacity settings (weekly review hours, temporary pause)
- [ ] **MP-19**: Mentor can manage expertise areas and skill tags
- [ ] **MP-20**: Mentor can manage notification preferences

### AP — Admin Panel

**Dashboard**
- [ ] **AP-01**: Admin can view platform overview dashboard with live-style stats (TanStack Query polling): total active users, active projects, pending reviews, disputes open, payments held, system health indicators
- [ ] **AP-02**: Admin can view system alert feed (flagged events requiring attention)

**User Management**
- [ ] **AP-03**: Admin can view and filter all users across 6 user types (Women Contributor, Community Support Lead, Student, Alumni, Enterprise Requester, Mentor)
- [ ] **AP-04**: Admin can view user detail with 6 tabs (Profile, Activity, Projects, Earnings/Payments, Skill Genome, Audit Log)
- [ ] **AP-05**: Admin can manage onboarding verification queue — approve/reject pending users with reason
- [ ] **AP-06**: Admin can suspend or reactivate a user account with reason (logged to audit trail)
- [ ] **AP-07**: Admin can view and process ID/credential verification submissions

**Project Management**
- [ ] **AP-08**: Admin can view all projects with 10-tab admin view: Overview, Timeline, Evidence Packs, Rework Requests, Escalation Centre, Payment Release, Team Summary, APG Activity Log, Admin Interventions, Freeze/Unfreeze
- [ ] **AP-09**: Admin can freeze a project (pauses all activity, sends notifications)
- [ ] **AP-10**: Admin can record admin interventions on a project (logged, immutable)

**Dispute Resolution**
- [ ] **AP-11**: Admin can view dispute queue with 5 dispute types (Payment, Quality, Conduct, Technical, Safety)
- [ ] **AP-12**: Admin can process a dispute with 5 decision types (Approve, Reject, Rework, Escalate, Safety Case)
- [ ] **AP-13**: Admin can initiate Safety Case protocol (highest severity — full privacy protection, evidence preservation)
- [ ] **AP-14**: Admin can view dispute history with full audit trail

**Reports & Analytics**
- [ ] **AP-15**: Admin can view 5 report types: Platform Health, User Growth, Delivery Performance, Payment Flow, Dispute Analytics
- [ ] **AP-16**: Admin can use custom report builder (select metrics, date range, export)
- [ ] **AP-17**: Admin can export any report as CSV or PDF

**Content & Configuration**
- [ ] **AP-18**: Admin can manage skill taxonomy (add/edit/merge skill tags)
- [ ] **AP-19**: Admin can manage resource library (onboarding guides, policy docs)
- [ ] **AP-20**: Admin can create and publish platform announcements
- [ ] **AP-21**: Super Admin can view and modify APG configuration (thresholds, auto-approval rules, escalation triggers) — Standard Admin cannot see this section

**Settings**
- [ ] **AP-22**: Admin can manage admin user roles (Standard Admin vs Super Admin) — Super Admin only
- [ ] **AP-23**: Admin can view full platform audit log (all admin actions, immutable)

---

## v2 Requirements (Deferred)

- Real-time notifications via WebSockets (v1 uses TanStack Query polling)
- In-app video recording for evidence submission (v1 supports video URL only)
- Advanced Skill Genome visualizations (radar charts, growth trajectory graphs)
- Multi-language content management (v1 designs for it, v2 implements CMS-backed i18n)
- Mobile-optimized component variants for Women's Portal (v1 is responsive web, v2 is mobile-first component redesign)
- Push notifications (PWA service worker)
- Advanced custom report builder with drag-and-drop
- Bulk user import/export for enterprise
- API webhook configuration for enterprise integrations
- SOW template library (v1 is upload-only, v2 adds curated templates)
- Tiptap rich text editor for evidence text submissions (v1 uses plain textarea)
- Evidence commenting / annotation (v1 is view + decision only)

---

## Out of Scope (v1)

| Exclusion | Reason |
|-----------|--------|
| Backend implementation | Handoff to separate developer — MSW mocks + @glimmora/types are the contract |
| Real authentication | Mock auth via Zustand store — Keycloak integration is backend scope |
| Real payment processing | UI only — actual payment gateway is backend scope |
| WhatsApp Business API integration | Design the UX flow, not the API — backend scope |
| Real-time features (WebSockets) | Simulated with TanStack Query polling — architecture supports upgrade |
| Mobile apps (React Native) | Responsive web only — mobile-first breakpoints, not native |
| Internationalization implementation | Design with RTL-awareness, language selector works — i18n strings are v2 |
| E2E testing (Playwright/Cypress) | Unit + component tests only — E2E post-backend-integration |
| Deployment pipeline (CI/CD) | Local dev environment only for this phase |
| Public profiles / leaderboards | **Architecture constraint, not scope decision — never build** |
| Contributor identity in review UI | **Architecture constraint — evidence viewer always hides contributor identity** |

---

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| INFRA-01 | Phase 1 | Complete |
| INFRA-02 | Phase 1 | Complete |
| INFRA-03 | Phase 1 | Complete |
| INFRA-04 | Phase 1 | Complete |
| INFRA-05 | Phase 1 | Complete |
| INFRA-06 | Phase 1 | Complete |
| INFRA-07 | Phase 1 | Complete |
| INFRA-08 | Phase 1 | Complete |
| INFRA-09 | Phase 1 | Complete |
| INFRA-10 | Phase 1 | Complete |
| INFRA-11 | Phase 1 | Complete |
| INFRA-12 | Phase 1 | Complete |
| DS-01 | Phase 1 | Complete |
| DS-02 | Phase 1 | Complete |
| DS-03 | Phase 1 | Complete |
| DS-04 | Phase 1 | Complete |
| DS-05 | Phase 1 | Complete |
| DS-06 | Phase 1 | Complete |
| DS-07 | Phase 1 | Complete |
| DS-08 | Phase 1 | Complete |
| DS-09 | Phase 1 | Complete |
| DS-10 | Phase 1 | Complete |
| DS-11 | Phase 2 | Complete |
| DS-12 | Phase 2 | Complete |
| DS-13 | Phase 2 | Complete |
| DS-14 | Phase 2 | Complete |
| DS-15 | Phase 2 | Complete |
| DS-16 | Phase 2 | Complete |
| DS-17 | Phase 2 | Complete |
| DS-18 | Phase 2 | Complete |
| DS-19 | Phase 2 | Complete |
| DS-20 | Phase 2 | Complete |
| DS-21 | Phase 2 | Complete |
| DS-22 | Phase 2 | Complete |
| DS-23 | Phase 2 | Complete |
| DS-24 | Phase 2 | Complete |
| DS-25 | Phase 2 | Complete |
| DS-26 | Phase 2 | Complete |
| DS-27 | Phase 2 | Complete |
| DS-28 | Phase 2 | Complete |
| DS-29 | Phase 2 | Complete |
| DS-30 | Phase 2 | Complete |
| DS-31 | Phase 2 | Complete |
| DS-32 | Phase 2 | Complete |
| DS-33 | Phase 2 | Complete |
| DS-34 | Phase 2 | Complete |
| DS-35 | Phase 2 | Complete |
| DS-36 | Phase 2 | Complete |
| DS-37 | Phase 2 | Complete |
| DS-38 | Phase 2 | Complete |
| DS-39 | Phase 2 | Complete |
| DS-40 | Phase 2 | Complete |
| DS-41 | Phase 2 | Complete |
| DS-42 | Phase 2 | Complete |
| DS-43 | Phase 2 | Complete |
| DS-44 | Phase 2 | Complete |
| DS-45 | Phase 2 | Complete |
| DS-46 | Phase 2 | Complete |
| DS-47 | Phase 2 | Complete |
| WP-01 | Phase 3 | Pending |
| WP-02 | Phase 3 | Pending |
| WP-03 | Phase 3 | Pending |
| WP-04 | Phase 3 | Pending |
| WP-05 | Phase 3 | Pending |
| WP-06 | Phase 3 | Pending |
| WP-07 | Phase 3 | Pending |
| WP-08 | Phase 3 | Pending |
| WP-09 | Phase 3 | Pending |
| WP-10 | Phase 3 | Pending |
| WP-11 | Phase 3 | Pending |
| WP-12 | Phase 3 | Pending |
| WP-13 | Phase 3 | Pending |
| WP-14 | Phase 3 | Pending |
| WP-15 | Phase 3 | Pending |
| WP-16 | Phase 3 | Pending |
| WP-17 | Phase 3 | Pending |
| WP-18 | Phase 3 | Pending |
| WP-19 | Phase 3 | Pending |
| WP-20 | Phase 3 | Pending |
| WP-21 | Phase 3 | Pending |
| WP-22 | Phase 3 | Pending |
| UP-01 | Phase 3 | Pending |
| UP-02 | Phase 3 | Pending |
| UP-03 | Phase 3 | Pending |
| UP-04 | Phase 3 | Pending |
| UP-05 | Phase 3 | Pending |
| UP-06 | Phase 3 | Pending |
| UP-07 | Phase 3 | Pending |
| UP-08 | Phase 3 | Pending |
| UP-09 | Phase 3 | Pending |
| UP-10 | Phase 3 | Pending |
| UP-11 | Phase 3 | Pending |
| UP-12 | Phase 3 | Pending |
| EP-01 | Phase 5 | Pending |
| EP-02 | Phase 5 | Pending |
| EP-03 | Phase 5 | Pending |
| EP-04 | Phase 5 | Pending |
| EP-05 | Phase 5 | Pending |
| EP-06 | Phase 5 | Pending |
| EP-07 | Phase 5 | Pending |
| EP-08 | Phase 5 | Pending |
| EP-09 | Phase 5 | Pending |
| EP-10 | Phase 5 | Pending |
| EP-11 | Phase 5 | Pending |
| EP-12 | Phase 5 | Pending |
| EP-13 | Phase 5 | Pending |
| EP-14 | Phase 5 | Pending |
| EP-15 | Phase 5 | Pending |
| EP-16 | Phase 5 | Pending |
| EP-17 | Phase 5 | Pending |
| EP-18 | Phase 5 | Pending |
| EP-19 | Phase 5 | Pending |
| EP-20 | Phase 5 | Pending |
| EP-21 | Phase 5 | Pending |
| EP-22 | Phase 5 | Pending |
| EP-23 | Phase 5 | Pending |
| EP-24 | Phase 5 | Pending |
| EP-25 | Phase 5 | Pending |
| EP-26 | Phase 5 | Pending |
| MP-01 | Phase 4 | Pending |
| MP-02 | Phase 4 | Pending |
| MP-03 | Phase 4 | Pending |
| MP-04 | Phase 4 | Pending |
| MP-05 | Phase 4 | Pending |
| MP-06 | Phase 4 | Pending |
| MP-07 | Phase 4 | Pending |
| MP-08 | Phase 4 | Pending |
| MP-09 | Phase 4 | Pending |
| MP-10 | Phase 4 | Pending |
| MP-11 | Phase 4 | Pending |
| MP-12 | Phase 4 | Pending |
| MP-13 | Phase 4 | Pending |
| MP-14 | Phase 4 | Pending |
| MP-15 | Phase 4 | Pending |
| MP-16 | Phase 4 | Pending |
| MP-17 | Phase 4 | Pending |
| MP-18 | Phase 4 | Pending |
| MP-19 | Phase 4 | Pending |
| MP-20 | Phase 4 | Pending |
| AP-01 | Phase 6 | Pending |
| AP-02 | Phase 6 | Pending |
| AP-03 | Phase 6 | Pending |
| AP-04 | Phase 6 | Pending |
| AP-05 | Phase 6 | Pending |
| AP-06 | Phase 6 | Pending |
| AP-07 | Phase 6 | Pending |
| AP-08 | Phase 6 | Pending |
| AP-09 | Phase 6 | Pending |
| AP-10 | Phase 6 | Pending |
| AP-11 | Phase 6 | Pending |
| AP-12 | Phase 6 | Pending |
| AP-13 | Phase 6 | Pending |
| AP-14 | Phase 6 | Pending |
| AP-15 | Phase 6 | Pending |
| AP-16 | Phase 6 | Pending |
| AP-17 | Phase 6 | Pending |
| AP-18 | Phase 6 | Pending |
| AP-19 | Phase 6 | Pending |
| AP-20 | Phase 6 | Pending |
| AP-21 | Phase 6 | Pending |
| AP-22 | Phase 6 | Pending |
| AP-23 | Phase 6 | Pending |

---

*Last updated: 2026-02-26 -- roadmap traceability added*
