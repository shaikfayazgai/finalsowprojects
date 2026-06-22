# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Run from **repository root** (npm workspaces):

```bash
npm install      # Installs frontend + backend workspaces; generates Prisma client
npm run dev      # Start Next.js dev server (frontend/)
npm run build    # Production build
npm run lint     # ESLint via Next.js
```

No test runner is configured. There is no `test` script.

## Repository layout

```
frontend/   Next.js app — pages, API routes, prisma/ schema + migrations, dev scripts
backend/    Backend team scaffold — implement proxied /api/v1/* (see backend/README.md)
docs/       Specs and guides
```

Environment lives in `frontend/.env.local` (copy from `frontend/.env.example`).

**Proxied routes:** `frontend/src/lib/api/backend-service.ts` forwards to `BACKEND_SERVICE_URL` (default `http://localhost:4000`). Run `npm run dev:all` when testing against the backend scaffold.

## Architecture Overview

**GlimmoraTeam** is an AI-Governed Global Workforce Platform built with:
- **Next.js 16** (App Router, React 19, TypeScript)
- **Zustand 5** for client-side state (with `persist` middleware to localStorage)
- **Prisma + PostgreSQL** for persistence (minimal schema currently; most data is mocked)
- **NextAuth v5** (JWT, 30-day sessions) with Google OAuth, Microsoft Entra ID, and email/password providers
- **Tailwind CSS 4** + **Radix UI** for styling/components
- **Framer Motion** for animations, **Recharts** + **Gantt charts** for charts, **Zod** for validation
- **TanStack Query v5** for data-heavy pages (server state, caching, mutations)
- **Razorpay** for payment processing, **Nodemailer** + **React Email** for email, **pdf-lib** + **mammoth** for document processing

## Routing & Role Structure

The app has five portals under `src/app/`:

| Path prefix | Role | Purpose |
|---|---|---|
| `/enterprise/` | Enterprise admin | SOW management, team formation, project delivery, analytics, billing, compliance |
| `/contributor/` | Contributor | Tasks, earnings, credentials, portfolio, community, support |
| `/mentor/` | Mentor | Review queue, mentorship, escalation, history |
| `/admin/` | Platform admin | Email templates, roles, settings, SOW oversight |
| `/analytics/` | Cross-role | Economic and governance analytics overview |
| `/public/` | Unauthenticated | Public credential sharing via share link |
| `/auth/` | Public | Login, register, MFA, OTP, password reset |
| `/api/` | Backend | NextAuth, contributor, SOW, reviewer, settings, payment, email endpoints |

User role (`contributor`, `enterprise`, `admin`, `reviewer`) is stored in the JWT session via `src/auth.ts`. Session also carries `glimmoraAccessToken` / `glimmoraRefreshToken` for the Glimmora backend API.

## Key Directory Map

```
frontend/src/
  app/                    # Next.js App Router pages
    admin/                # Platform admin portal (dashboard, email-templates, roles, settings, sow)
    analytics/            # Cross-role analytics (overview)
    enterprise/           # Enterprise portal (see Enterprise Routes below)
    contributor/          # Contributor portal (see Contributor Routes below)
    mentor/               # Mentor portal (dashboard, queue, mentorship, escalation, history, profile, settings)
    public/               # Unauthenticated pages (credentials/[shareId])
    auth/                 # Auth pages (login, register, MFA, OTP, password reset)
    api/                  # API routes (see API Routes below)
  components/
    ui/                   # Shared primitives (buttons, dialogs, etc.)
    layout/               # App shell: Sidebar, TopBar, AI chat widget, add-reviewer-modal
    enterprise/           # Enterprise-specific complex components (decomposition, SOW, etc.)
    providers/            # React context providers (QueryProvider wraps TanStack Query)
  lib/
    api/                  # Centralized API client layer (auth, contributor, sow, teams, reviewer, settings, etc.)
    stores/               # Zustand stores (see below)
    actions/              # Next.js Server Actions (registration, SOW upload/generation)
    hooks/                # Custom React hooks (auth, decomposition, SOW wizard, pricing, role-guard, teams)
    config/               # Navigation config (role-based sidebar items)
    validations/          # Zod schemas (sow-generate, sow-upload-details, etc.)
    utils/                # cn() helper, Framer Motion variants, base-url, request-dedupe
    email/                # Email sending utilities
  emails/                 # React Email templates (SOW workflows, welcome, OTP, reviewer invitation)
  types/                  # TypeScript interfaces — contributor.ts, enterprise.ts, next-auth.d.ts
  mocks/data/             # Mock data (analytics, billing, dashboard, projects, reviewer, SOW detail, wizard)
  generated/prisma/       # Auto-generated Prisma client (do not edit)
backend/
  prisma/                 # schema.prisma + migrations
  scripts/                # smoke tests and local dev helpers
```

## Enterprise Routes

| Route | Purpose |
|---|---|
| `/enterprise/analytics/economic` `/governance` `/reports` | Analytics sub-sections |
| `/enterprise/audit` | Audit log |
| `/enterprise/billing/` | Budget, history, invoices, pricing, rate-cards, reports |
| `/enterprise/compliance/` | Documents, ESG, evidence, PODL |
| `/enterprise/decomposition/[planId]` `/approval` | SOW decomposition into tasks/milestones |
| `/enterprise/notifications` | Notification centre |
| `/enterprise/onboarding/` | Enterprise onboarding flow (has local `components/` and `hooks/`) |
| `/enterprise/profile` | Enterprise profile |
| `/enterprise/projects/[projectId]` `/completed` `/exceptions` | Project delivery tracking |
| `/enterprise/review/[deliverableId]` `/history` | Deliverable review |
| `/enterprise/reviewer/` | Reviewer sub-portal (mentoring-log, my-metrics, notifications, qa-inbox, review-history, review-queue, task-monitor) |
| `/enterprise/settings/security` | Security settings |
| `/enterprise/sow/` | SOW list, detail, generate, approve |

## Contributor Routes

| Route | Purpose |
|---|---|
| `/contributor/community` | Community |
| `/contributor/credentials/[credentialId]` | Credential detail |
| `/contributor/earnings` | Earnings & payments |
| `/contributor/learning` | Learning recommendations |
| `/contributor/messages` | Messaging |
| `/contributor/onboarding/` | Contributor onboarding (has local `components/` and `hooks/`) |
| `/contributor/profile/digital-twin` `/edit` `/evidence` | Profile management |
| `/contributor/settings` | Settings |
| `/contributor/support` | FAQs, tickets, safety reports, grievances |
| `/contributor/tasks/[taskId]` `/submissions/[submissionId]` | Task detail and submission review |

## Mentor Routes

Mentor portal is fully built:
`/mentor/dashboard`, `/mentor/queue/[reviewId]`, `/mentor/mentorship`, `/mentor/escalation`, `/mentor/history`, `/mentor/profile/edit`, `/mentor/settings`

## API Routes

**Auth** — OTP (email/phone send+verify), forgot-password, MFA confirm, OAuth authorize/exchange, SSO intent, password change, session validate

**Contributor** — credentials (share, verify, certificate, academic-portfolio), credential wallet, learning recommendations, profile (digital-twin history, skills, evidence), submissions (resubmit, latest, feedback), support (FAQs, tickets, grievances, safety-reports), tasks (submissions, review-feedback, latest-submission)

**Other** — `/api/config/contributor-pricing`, `/api/decomposition/proxy`, `/api/email/send`, `/api/public/credentials/[shareId]`, `/api/razorpay/create-order`, `/api/reviewer/create`, `/api/reviewers/invitations`, `/api/settings/contributor-pricing`, `/api/sow/proxy`, `/api/sow/token`

## Zustand Stores (`src/lib/stores/`)

All stores use `persist` with localStorage. Key stores:

| Store | Purpose |
|---|---|
| `sow-store.ts` | SOW list; seeded with 2 demo SOWs on first load |
| `sow-pipeline-store.ts` | SOW approval pipeline stage tracking |
| `sow-upload-store.ts` | File upload workflow state |
| `sow-messages-store.ts` | Message threads for SOW reviews |
| `auth-store.ts` | MFA status, onboarding progress, registration data |
| `onboarding-store.ts` | Step-by-step onboarding flow |
| `notification-store.ts` / `toast-store.ts` | In-app notifications |
| `sidebar-store.ts` | Sidebar expanded/collapsed state |
| `contributor-phone-store.ts` | Phone number persistence across registration → onboarding |
| `email-template-store.ts` | Email template management (SOW stages, welcome, OTP, reviewer invitation) |
| `platform-settings-store.ts` | Dynamic pricing config per contributor segment (student, women, general) with experience-based rate tables |
| `task-store.ts` | Selected task context for detail page |

Because stores persist to localStorage, resetting state during development requires clearing `localStorage` in the browser.

## API Client Layer (`src/lib/api/`)

Centralized fetch wrappers — do not call API endpoints directly from components:

| File | Covers |
|---|---|
| `client.ts` | Base API client config (`base-url.ts` provides the URL) |
| `auth.ts` | Session and user endpoints |
| `contributor.ts` | All contributor-domain APIs |
| `sow.ts` | SOW CRUD; `sow-transformers.ts` for data shaping |
| `decomposition.ts` / `decomposition-plans.ts` | SOW decomposition APIs |
| `teams.ts` | Team management |
| `reviewer.ts` | Reviewer role APIs |
| `settings.ts` | Platform settings |
| `portfolio.ts` | Portfolio/credentials |
| `backend-service.ts` | Proxy helper for migrated `/api/*` → backend `/api/v1/*` |
| `oauth-login.ts` | OAuth flow utilities |

## TanStack Query Usage

`src/components/providers/query-provider.tsx` wraps the app with `QueryClientProvider` (5-min stale time, 15-min GC, no refetch on focus/reconnect). Use TanStack Query for data-heavy or cached pages; use plain `fetch` for simple one-off calls.

Key hooks using TanStack Query: `use-auth.ts`, `use-decomposition.ts`, `use-manual-sow.ts`, `use-sow-wizard.ts`, `use-teams.ts`, `usePricingConfig.ts`.

`src/lib/utils/request-dedupe.ts` prevents double fetches in React Strict Mode.

## SOW (Statement of Work) Domain

SOWs are the central entity for the enterprise portal. The full lifecycle:

1. **Upload or AI-generate** a SOW document (`/enterprise/sow/generate/`)
2. **Review** parsed content and risk scores (`/enterprise/sow/[sowId]/`)
3. **Submit for approval** — 5-stage pipeline: Business → Glimmora Commercial → Legal → Security → Final
4. **Approval page** (`/enterprise/sow/[sowId]/approve/`) shows per-stage sign-off
5. **Decomposition** — approved SOWs are broken into milestones/tasks (`/enterprise/decomposition/[planId]`)

Key types in `src/types/enterprise.ts`:
- `SOW` — title, status, stages, risk scores, hallucination flags, confidentiality
- `SowStatus` — `draft | parsing | review | approval | approved | rejected`
- `SOWApprovalStage` — one entry per approval stage
- `RiskScoreBreakdown` — completeness, confidence, compliance, patternMatch, overall

## Data & Mocking Strategy

Most UI flows run off **mock data** in `src/mocks/data/` — there is no real API for the majority of features. Server Actions (`src/lib/actions/`) handle actual mutations for auth and SOW file processing. When adding new features, follow the pattern: define types in `src/types/`, add mock data, wire into a Zustand store, build the UI.

Key mock files: `enterprise-analytics.ts`, `enterprise-billing.ts`, `enterprise-dashboard.ts`, `enterprise-projects.ts`, `enterprise-reviewer.ts`, `enterprise-sow.ts`, `enterprise-sow-detail.ts`, `sow-wizard-data.ts`.

## Auth Flow

- `src/auth.ts` — NextAuth config; Credentials provider validates `passwordHash` via Prisma
- First-time SSO users are redirected to `/contributor/onboarding`
- Session contains `id`, `name`, `email`, `role`, `provider`, `accessToken`, `isNewSsoUser`
- JWT also carries `glimmoraAccessToken`, `glimmoraRefreshToken`, `glimmoraExpiresAt` for backend API calls
- Route handler at `src/app/api/auth/[...nextauth]/route.ts` must use `runtime = "nodejs"` and `dynamic = "force-dynamic"`

## Component Conventions

- Use `"use client"` for any component with state, effects, or event handlers
- Class merging via `cn()` from `src/lib/utils/`
- Navigation structure is centralized in `src/lib/config/navigation.ts` — add new sidebar entries there
- Sidebar badge counts come from `src/lib/hooks/use-sow-badges.ts`
- Role-based access control via `src/lib/hooks/use-role-guard.ts`
- Page-level skeleton loaders live in a local `components/` subdirectory alongside the page (e.g. `dashboard/components/dashboard-skeleton.tsx`)

## new features
Never add a new feature without the user's explicit instruction. Only implement what is asked — nothing more.

## gitpush
don't include claude co-author while pushing the code in to github

## api integration
For API integration use the built-in `fetch` function for normal pages and use TanStack Query for data-heavy pages and pages that require data caching. Don't integrate multiple APIs at a time — integrate one, test it, then move to the next. Always go through `src/lib/api/` client layer, not raw fetch calls in components.

## loading
Use skeleton UI loader for all pages based on that page's structure and use loading spinner for table data.

## ui development
While developing new UI features use the color combination that matches the current color scheme.
