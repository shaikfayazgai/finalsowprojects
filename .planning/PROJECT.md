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
  - `/apps/women-portal` — Next.js 14+ App Router + TypeScript
  - `/apps/university-portal` — Next.js 14+ App Router + TypeScript
  - `/apps/enterprise-portal` — Next.js 14+ App Router + TypeScript
  - `/apps/mentor-portal` — Next.js 14+ App Router + TypeScript
  - `/apps/admin-panel` — Next.js 14+ App Router + TypeScript
  - `/packages/ui` — Shared design system (Radix UI primitives + Tailwind)
  - `/packages/types` — Shared TypeScript types (become API contracts)
  - `/packages/config` — Shared Tailwind config, ESLint, TSConfig
- **Styling:** Tailwind CSS (warm earthy design tokens)
- **Components:** Radix UI primitives (unstyled, accessibility foundation) — NOT shadcn
- **State:** Zustand (client state) + TanStack Query (server state / mock data)
- **Forms:** React Hook Form + Zod validation
- **Animation:** Framer Motion (subtle, no heavy animations)
- **Mocking:** MSW (Mock Service Worker) — all API calls mocked
- **Component docs:** Storybook
- **Testing:** Vitest + Testing Library (component tests)

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

## UX Research (Complete)

All portal flows fully documented in `/ux-research/portal-flows/`:
- `P0-portal-interconnections.md` — Cross-portal architecture + APG central nervous system
- `P3-enterprise-portal.md` — Full Enterprise Portal (SOW upload → PoDL)
- `P4-mentor-portal.md` — Full Mentor Portal (review queue, 3-panel review detail)
- `P5-admin-panel.md` — Full Admin Panel (dispute resolution, APG config)
- `/ux-research/flows/` — All 7 role-specific flow documents

**13 priority screens identified** (from `/ux-research/04-information-architecture.md`).

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

## Requirements

### Validated

(None yet — no code shipped)

### Active

**Infrastructure**
- [ ] Turborepo monorepo configured with 5 Next.js apps + 3 shared packages
- [ ] Tailwind design tokens (colors, typography, spacing) matching confirmed design system
- [ ] Shared `@glimmora/ui` package with Radix UI primitive components
- [ ] Shared `@glimmora/types` package with TypeScript interfaces
- [ ] MSW configured for all portals — handlers for all mock data
- [ ] Storybook configured in `/packages/ui` — documents all components

**Women's Portal**
- [ ] Pre-auth flow (language select → WhatsApp-style welcome → register/login)
- [ ] 4-step onboarding (profile, devices/connectivity, skill assessment, activation)
- [ ] Dashboard (active tasks, earnings meter, APG activity feed)
- [ ] Task detail page (brief, evidence submission, APG guidance)
- [ ] Evidence submission (multi-type: file, link, code, video, text)
- [ ] My Skill Genome page (private capability profile, progress)
- [ ] Earnings & Payments page (withdrawal history, pending, PoDL)
- [ ] Conversation with Community Support Lead (async, not live chat)
- [ ] Settings (5 sections: profile, privacy, language, devices, notifications)

**University Portal**
- [ ] Student dashboard (active tasks, PoDL count, earnings)
- [ ] Task delivery flow (same evidence patterns as Women's Portal)
- [ ] PoDL Credentials page (view, share, export)
- [ ] Team collaboration view (anonymous peer awareness, not direct comms)
- [ ] University Strategic Governor view (aggregated metrics, no individual identifiers)
- [ ] Alumni reactivation flow

**Enterprise Portal**
- [ ] SOW upload + APG intelligence display (decomposition preview)
- [ ] Blueprint editor (4-panel: SOW context, task tree, team pool preview, settings)
- [ ] Project dashboard (KPI cards with gradients, progress, APG activity)
- [ ] Project detail 7 tabs (Overview, Timeline Gantt, Evidence Packs, Rework Requests, Escalation Centre, Payment Release, Team Summary anonymized)
- [ ] Evidence Pack review (evidence viewer, approve/request rework/escalate)
- [ ] Payment release flows (manual, auto, APG-silent)
- [ ] Completed projects + PoDL/ESG export
- [ ] Settings (5 sections)

**Mentor Portal**
- [ ] Review queue (Pending / In Progress / Completed tabs with SLA timers)
- [ ] 3-panel review detail (task context + evidence viewer + review form)
- [ ] Approve / Rework / Reject flows with structured feedback forms
- [ ] Mentor profile (tier: Bronze/Silver/Gold/Elite, impact metrics)
- [ ] Skill Tag Verification queue
- [ ] Settings (5 sections)

**Admin Panel**
- [ ] Platform overview dashboard (live stats + system health)
- [ ] User management (all 6 user types, verification flows)
- [ ] Project management (10-tab admin view, freeze/intervene)
- [ ] Dispute resolution (5 types, Safety Case protocol)
- [ ] Onboarding approvals queue
- [ ] Reports & Analytics (5 report types + custom builder)
- [ ] Platform settings (APG config — Super Admin only)

### Out of Scope (v1)

- Real backend implementation — handoff artifact is MSW mocks + Storybook
- Real authentication — mock auth with Zustand
- WhatsApp Business API — design the UX, not the integration
- Payment processor integration — UI only, no real transactions
- Real-time features (WebSockets) — mock with polling simulation
- Mobile apps — responsive web only (mobile-first breakpoints)
- Internationalization implementation — design for it (RTL-aware), don't implement
- E2E testing — unit + component tests only
- Deployment pipeline — local dev only for this phase

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Turborepo monorepo | 5 portals share design system, types, config — monorepo prevents drift | Confirmed |
| Radix UI primitives (not shadcn) | Unstyled accessibility foundation — we apply our own design system on top, not someone else's defaults | Confirmed |
| MSW for mocking | Mock shapes become API contracts — backend developer gets typed interfaces from our types package | Confirmed |
| No wireframes — go direct to code | Full portal flows + confirmed design system = all wireframe info already captured in docs | Confirmed |
| Design + frontend scope only | Backend handoff to separate developer — Storybook + MSW mocks are the handoff artifacts | Confirmed |
| Miller Display + Avenir LT Std | Confirmed from mood board — editorial serif + geometric sans = warm premium feel | Confirmed |
| Gradients on dashboards | Client expectation — KPI cards, milestone bars, CTAs all use brand gradients | Confirmed |
| Private-by-default architecture | Non-negotiable — no public profiles, no leaderboards, anonymization built in from first component | Confirmed |
| Language select as first element | Women's Portal trust requirement — not an afterthought | Confirmed |

---
*Last updated: 2026-02-26 after initialization*
