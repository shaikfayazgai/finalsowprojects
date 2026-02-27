# GlimmoraTeam™ — Project

## What This Is

GlimmoraTeam™ is an AGI-native, AI-governed project delivery platform by Baarez Technology Solutions. It converts enterprise Statements of Work (SOWs) into governed, outcome-based delivery — using AI to decompose SOWs, instantly form verified skill-matched teams, govern all delivery milestones, and trigger payments only on accepted outcomes.

This is **not** a freelancing marketplace. No resumes, no bidding, no public rankings, no open gig listings. Payment only flows when outcomes are accepted.

## Core Value

The ONE thing that must work: **An enterprise uploads a SOW → APG decomposes it into tasks → verified contributors complete and submit evidence → enterprise reviews and releases payment — all without manual team recruitment or project management overhead.**

## Who It's For

Three distinct user segments, each with their own portal:

1. **IT-skilled women (housewives)** — primary segment. Privacy-first, trust-deficit, scam-wary. Enter via WhatsApp referral. Anonymized. No public profiles ever.
2. **University students** — want real credentials. Authenticity-focused. Want PoDL (Proof-of-Delivery Ledger) for career proof.
3. **Enterprise requesters** — compliance-driven. SOW interpretation is the trust fulcrum. Need audit trails, ESG exports, payment controls.

Supporting roles: Community Support Lead, Mentor/Reviewer, University Strategic Governor (faculty), Platform Administrator.

## Personas

- **Fatima Al-Hassan** — IT-skilled housewife, Karachi, Pakistan. Privacy-first, 72-hour activation target.
- **Arjun Mehta** — University student, Bangalore, India. PoDL credential is the primary value prop.
- **Priya Nair** — Enterprise procurement lead, Mumbai. Compliance + SOW interpretation = trust.

## 7 Core Platform Pillars

1. **SOW Intelligence** — AI parses and structures uploaded SOWs
2. **Project Decomposition** — APG breaks SOW into typed tasks with skill requirements
3. **Instant Team Formation** — Skill Genome matching, no manual recruitment
4. **APG (Autonomous Project Governor)** — Central AI backbone governing delivery
5. **Learning-by-Delivery Engine** — Contributors grow skills through real work
6. **Skill Genome** — Evidence-backed capability profile (private, not gamified)
7. **PoDL (Proof-of-Delivery Ledger)** — Immutable delivery record / credential

## 5 Portals

| Portal | Users | Key Function |
|--------|-------|-------------|
| Women's Portal | Women Contributors + Community Support Lead | Onboarding, tasks, evidence submission, income |
| University Portal | Students + Alumni + Strategic Governor (faculty) | Student task delivery, PoDL credentials, faculty oversight |
| Enterprise Portal | Enterprise Requesters | SOW upload, project oversight, evidence review, payment release |
| Mentor Portal | Mentors / Reviewers | Evidence review queue, skill tag verification |
| Admin Panel | Platform Administrators | Full platform oversight, dispute resolution, APG config |

## Scope — This Project

**Design + Frontend only.** Backend handoff to a separate developer.

- Build all 5 portals as Next.js apps within a Turborepo monorepo
- Use MSW (Mock Service Worker) for all data — mock shapes become the API contract for backend
- Deliver Storybook component library as the handoff artifact for backend integration
- Design system implemented as Tailwind config + Radix UI primitive components

**Not in scope:**
- Backend implementation (NestJS, FastAPI, PostgreSQL, Keycloak, BullMQ, Redis, S3)
- Real authentication (mock auth flows only)
- Real payment processing
- WhatsApp Business API integration (design the UX, not the integration)
- Deployment infrastructure

## Tech Stack

### Frontend (this project)
- **Monorepo:** Turborepo
  - `/apps/women-portal` — Next.js 15.5.x App Router + TypeScript
  - `/apps/university-portal` — Next.js 15.5.x App Router + TypeScript
  - `/apps/enterprise-portal` — Next.js 15.5.x App Router + TypeScript
  - `/apps/mentor-portal` — Next.js 15.5.x App Router + TypeScript
  - `/apps/admin-panel` — Next.js 15.5.x App Router + TypeScript
  - `/packages/ui` — Shared design system (47 components, Radix UI primitives + Tailwind v4)
  - `/packages/types` — Shared TypeScript types (API contracts for backend)
  - `/packages/config` — Shared Tailwind v4 config, ESLint, TSConfig
- **Styling:** Tailwind CSS v4 (CSS-first @theme, warm earthy design tokens)
- **Components:** Radix UI primitives (unstyled, accessibility foundation) — NOT shadcn
- **State:** Zustand v5 (client state) + TanStack Query v5 (server state / mock data)
- **Forms:** React Hook Form + Zod validation
- **Animation:** Framer Motion (subtle, no heavy animations)
- **Mocking:** MSW v2 (Mock Service Worker) — dual-runtime (browser + server-side)
- **Component docs:** Storybook 10 with @storybook/addon-a11y
- **Resizable panels:** react-resizable-panels v4 (Mentor review, Enterprise blueprint editor, Admin disputes)

### Backend (handoff — not this project)
NestJS + PostgreSQL + BullMQ/Redis + FastAPI (APG) + Keycloak/OIDC + S3 + Prometheus+Grafana

## Design System

### Typography
- **PRIMARY:** Miller Display (serif) — hero headings, page titles, KPI numbers, portal names
- **SECONDARY:** Avenir LT Std (sans) — body text, labels, navigation, badges, inputs

### Color Palette
```
Primary Brown/Terracotta:  #A0614A  (THE primary brand color)
Sand/Warm Beige:           #C9A882
Forest/Olive Green:        #4A6741
Ocean Teal:                #3A8FA0
Gold/Mustard:              #C4A23A

App background:            #FAF7F4
Card background:           #FFFFFF
Border/divider:            #EAD9CC
Heading text:              #2C1F1A
Body text:                 #6B4C3B
```

### Key Design Rules
- Gradients on all dashboards — KPI cards use `#A0614A → #C4A23A`, milestone bars use `#4A6741 → #3A8FA0`
- Warm neutrals only — no cold greys
- Miller Display must appear on all key headings
- No public profiles, no leaderboards, no peer comparison in UI — ever
- 3rd gradient KPI card on all dashboards uses inline `style={{ background: 'linear-gradient(135deg, #4A6741 0%, #3A8FA0 100%)' }}`

## UX Research (Complete)

All portal flows fully documented in `/ux-research/portal-flows/`:
- `P0-portal-interconnections.md` — Cross-portal architecture + APG central nervous system
- `P3-enterprise-portal.md` — Full Enterprise Portal (SOW upload → PoDL)
- `P4-mentor-portal.md` — Full Mentor Portal (review queue, 3-panel review detail)
- `P5-admin-panel.md` — Full Admin Panel (dispute resolution, APG config)
- `/ux-research/flows/` — All 7 role-specific flow documents

## Critical Non-Negotiables

1. No public profiles — ever (architecture, not policy)
2. No leaderboards, no peer comparison — ever
3. Language selection as FIRST interactive element on Women's Portal
4. WhatsApp as primary entry point for women — design supports this flow
5. 72-hour activation target for women contributors (emotional, not operational)
6. Private by default throughout — anonymization built in from day 1
7. APG actions always visible to users (transparency) but not configurable by them
8. PoDL is immutable — no editing after issue
9. Evidence review by mentors is blind to contributor identity
10. Payment release only on accepted outcomes — never automatic without evidence

## Current State (v1.0)

**Shipped:** 2026-02-27
**Version:** v1.0 Frontend MVP

- 5 portals fully implemented: Women's, University, Enterprise, Mentor, Admin
- 47 design system components (DS-01..DS-47) in @glimmora/ui
- 162/162 v1 requirements delivered
- 38,565 lines of TypeScript across 162 files
- All 6 phases verified (gsd-verifier, all passed)
- MSW mocks + @glimmora/types = API contract for backend developer
- Storybook = component documentation and handoff artifact
- `pnpm turbo build` passes cleanly across all 5 portals + packages

**Known tech debt entering v1.1:**
- Enterprise evidence factory populates `contributorId` in mock data (medium — resolves at backend integration)
- Admin Panel missing `podl_audit` report type (medium — add to v1.1 requirements)
- Font files not active in portal runtime — need font license files (low)
- OTPConfirmationDialog import path inconsistency in enterprise-portal (low)

## Requirements

### Validated (v1.0)

- ✓ Turborepo monorepo with 5 Next.js apps + 3 shared packages — v1.0
- ✓ Tailwind v4 design tokens (colors, typography, spacing) — v1.0
- ✓ @glimmora/ui — 47 components (DS-01..DS-47), Radix UI + Tailwind — v1.0
- ✓ @glimmora/types — TypeScript interfaces serving as API contracts — v1.0
- ✓ MSW v2 dual-runtime — all portals, all mock data — v1.0
- ✓ Storybook 10 with a11y addon — component documentation — v1.0
- ✓ Women's Portal — full journey (language select → onboarding → tasks → evidence → earnings → PoDL) — v1.0
- ✓ University Portal — student + alumni + governor flows — v1.0
- ✓ Enterprise Portal — SOW upload → blueprint → oversight → evidence review → payment → compliance — v1.0
- ✓ Mentor Portal — application → onboarding → blind review → skill verification — v1.0
- ✓ Admin Panel — oversight → user mgmt → disputes → reports → APG config — v1.0
- ✓ All 162 INFRA/DS/WP/UP/EP/MP/AP requirements — v1.0 (archived in milestones/v1.0-REQUIREMENTS.md)

### Active (v1.1 — to be defined)

*(Fresh requirements defined via /gsd:new-milestone)*

### Out of Scope

- Real backend implementation — handoff artifact is MSW mocks + Storybook
- Real authentication — mock auth with Zustand (Keycloak integration is backend scope)
- WhatsApp Business API — design the UX, not the integration
- Payment processor integration — UI only
- Real-time features (WebSockets) — simulated with TanStack Query polling
- Mobile apps — responsive web only
- Internationalization string implementation — design for it (RTL-aware), i18n strings v2
- E2E testing (Playwright/Cypress) — post-backend-integration
- Deployment pipeline — local dev only

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Turborepo monorepo | 5 portals share design system, types, config — monorepo prevents drift | ✓ Validated — worked cleanly |
| Radix UI primitives (not shadcn) | Unstyled accessibility foundation — our design system on top | ✓ Validated — warm earthy theme applied consistently |
| MSW v2 for mocking | Mock shapes become API contracts — backend developer gets typed interfaces | ✓ Validated — dual-runtime (browser + server) works |
| No wireframes — direct to code | Full portal flows + confirmed design system already captured in docs | ✓ Validated — 162 requirements shipped without wireframe phase |
| Design + frontend scope only | Backend handoff to separate developer | ✓ Confirmed — Storybook + MSW are the handoff artifacts |
| Miller Display + Avenir LT Std | Editorial serif + geometric sans = warm premium feel | ✓ Validated in code, font files pending license |
| Gradients on dashboards | Client expectation — KPI cards, milestone bars, CTAs all brand gradients | ✓ Validated — consistent across all 5 portals |
| Private-by-default architecture | Non-negotiable — no public profiles, no leaderboards, anonymization from day 1 | ✓ Validated — 9/9 privacy checks passed in audit |
| Language select as first element | Women's Portal trust requirement | ✓ Validated — FIRST interactive element implemented |
| Tailwind v4 CSS-first @theme | Simpler monorepo token sharing than v3 approach | ✓ Validated — all portals consume tokens consistently |
| EvidenceViewer blind review at type level | Contributor identity absent from ReviewEvidence type structurally | ✓ Validated — zero identity leakage in UI |
| ResizablePanels v4 | react-resizable-panels v4 API — elementRef not forwardRef | ✓ Validated — used across Mentor, Enterprise, Admin |
| PDF exports via dynamic import | Prevents SSR crashes from @react-pdf/renderer | ✓ Validated — pattern used in all 4 PDF export sites |
| SuperAdminGate visible-but-locked | Shows blocked screen rather than hiding pages (better UX + security messaging) | ✓ Validated |
| 3rd GradientCard inline style | GradientCard component has only 2 gradient variants; 3rd uses inline override | ✓ Validated — consistent across all 5 portal dashboards |

---
*Last updated: 2026-02-27 after v1.0 milestone completion*
