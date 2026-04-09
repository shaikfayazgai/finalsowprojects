# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start development server (Next.js + Turbopack)
npm run build    # Production build
npm run lint     # ESLint via Next.js
```

No test runner is configured. There is no `test` script.

## Architecture Overview

**GlimmoraTeam** is an AI-Governed Global Workforce Platform built with:
- **Next.js 16** (App Router, React 19, TypeScript)
- **Zustand 5** for client-side state (with `persist` middleware to localStorage)
- **Prisma + PostgreSQL** for persistence (minimal schema currently; most data is mocked)
- **NextAuth v5** (JWT, 30-day sessions) with Google OAuth, Microsoft Entra ID, and email/password providers
- **Tailwind CSS 4** + **Radix UI** for styling/components
- **Framer Motion** for animations, **Recharts** for charts, **Zod** for validation

## Routing & Role Structure

The app has three portals under `src/app/`:

| Path prefix | Role | Purpose |
|---|---|---|
| `/enterprise/` | Enterprise admin | SOW management, team formation, project delivery, analytics |
| `/contributor/` | Contributor | Tasks, earnings, credentials, portfolio |
| `/mentor/` | Mentor | (in progress) |
| `/auth/` | Public | Login, register, MFA, password reset |
| `/api/` | Backend | NextAuth, NDA document endpoints |

User role (`contributor`, `enterprise`, `admin`, `reviewer`) is stored in the JWT session via `src/auth.ts`.

## Key Directory Map

```
src/
  app/                  # Next.js App Router pages
  components/
    ui/                 # Shared primitives (buttons, dialogs, etc.)
    layout/             # App shell: Sidebar, TopBar, AI chat widget
    enterprise/         # Enterprise-specific complex components
  lib/
    stores/             # Zustand stores (see below)
    actions/            # Next.js Server Actions (registration, SOW upload/generation)
    hooks/              # Custom React hooks
    config/             # Navigation config (role-based sidebar items)
    validations/        # Zod schemas
    utils/              # cn() helper, Framer Motion variants
  types/                # TypeScript interfaces — contributor.ts, enterprise.ts
  mocks/data/           # Mock data used throughout the app (no real DB for most flows)
  generated/prisma/     # Auto-generated Prisma client (do not edit)
prisma/                 # schema.prisma + migrations
```

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

Because stores persist to localStorage, resetting state during development requires clearing `localStorage` in the browser.

## SOW (Statement of Work) Domain

SOWs are the central entity for the enterprise portal. The full lifecycle:

1. **Upload or AI-generate** a SOW document (`/enterprise/sow/generate/`)
2. **Review** parsed content and risk scores (`/enterprise/sow/[sowId]/`)
3. **Submit for approval** — 5-stage pipeline: Business → Glimmora Commercial → Legal → Security → Final
4. **Approval page** (`/enterprise/sow/[sowId]/approve/`) shows per-stage sign-off

Key types in `src/types/enterprise.ts`:
- `SOW` — title, status, stages, risk scores, hallucination flags, confidentiality
- `SowStatus` — `draft | parsing | review | approval | approved | rejected`
- `SOWApprovalStage` — one entry per approval stage
- `RiskScoreBreakdown` — completeness, confidence, compliance, patternMatch, overall

## Data & Mocking Strategy

Most UI flows run off **mock data** in `src/mocks/data/` — there is no real API for the majority of features. Server Actions (`src/lib/actions/`) handle actual mutations for auth and SOW file processing. When adding new features, follow the pattern: define types in `src/types/`, add mock data, wire into a Zustand store, build the UI.

## Auth Flow

- `src/auth.ts` — NextAuth config; Credentials provider validates `passwordHash` via Prisma
- First-time SSO users are redirected to `/contributor/onboarding`
- Session contains `id`, `name`, `email`, `role`, `provider`
- Route handler at `src/app/api/auth/[...nextauth]/route.ts` must use `runtime = "nodejs"` and `dynamic = "force-dynamic"`

## Component Conventions

- Use `"use client"` for any component with state, effects, or event handlers
- Class merging via `cn()` from `src/lib/utils/`
- Navigation structure is centralized in `src/lib/config/navigation.ts` — add new sidebar entries there
- Sidebar badge counts come from `src/lib/hooks/use-sow-badges.ts`
## gitpush
don't include claude co-author while pushing the code in to github