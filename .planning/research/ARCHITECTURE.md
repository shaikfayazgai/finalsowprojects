# Architecture Patterns: Turborepo Multi-Portal Next.js Monorepo

**Project:** GlimmoraTeam Frontend Monorepo
**Researched:** 2026-02-26
**Overall confidence:** HIGH (version data verified via npm registry; architectural patterns based on training knowledge of Turborepo, Next.js App Router, and Tailwind CSS -- marked where verification was limited)

---

## Version Decision: Tailwind v3 vs v4, Next.js 14 vs 15

Before the folder tree, a critical version decision that shapes the entire architecture.

### Tailwind CSS: Use v3.4.x (NOT v4)

**Recommendation: `tailwindcss@3.4.19`**

| Factor | Tailwind v3.4.x | Tailwind v4.x |
|--------|-----------------|---------------|
| Config model | `tailwind.config.ts` (JS object) | CSS-first (`@theme` in CSS files) |
| Monorepo content paths | Explicit `content: [...]` in config | Auto-detection via `@source` directives |
| Radix UI compatibility | Fully battle-tested | MEDIUM confidence -- likely works but less community validation in monorepo setups |
| Storybook support | Fully supported with standard PostCSS | MEDIUM confidence -- Storybook 8 + TW v4 integration less documented |
| Shared config across apps | Well-established `preset` pattern | New `@import` pattern -- fewer monorepo examples |
| Community ecosystem | Mature, extensive documentation | Released early 2025, still maturing |

**Rationale:** Tailwind v4 is a significant architectural shift (CSS-first config, no `tailwind.config.js`, new `@theme` directive system). For a monorepo with 5 apps sharing a design system, the v3 `preset` pattern for sharing config is well-proven. Tailwind v4's monorepo story with shared packages is still being refined. Starting on v3.4.x is the safer path; migration to v4 can happen later as a discrete effort when the ecosystem matures.

**Confidence:** HIGH for this recommendation. Version numbers verified via npm. Tailwind v4 architectural changes are well-documented in their blog/docs from my training data.

### Next.js: Use v15.x (NOT v14)

**Recommendation: `next@15.5.12` (latest stable)**

| Factor | Next.js 14 | Next.js 15 |
|--------|-----------|-----------|
| App Router | Stable | Stable + improvements |
| Turbopack dev | Experimental | Stable for dev mode |
| React 19 | Not supported | Full support |
| `next/form` | Not available | Available (enhanced form handling) |
| Async request APIs | Sync | Async (breaking change -- but greenfield so no migration cost) |
| Security | Maintenance only | Active development |
| Turborepo integration | Good | Better (improved bundling, workspace awareness) |

**Rationale:** The project spec says "Next.js 14+" which means 14 or later. Since this is greenfield (no migration), Next.js 15 gives us Turbopack stable in dev mode (significantly faster HMR across 5 apps), React 19 support, and active security patches. The async request API change (`cookies()`, `headers()` now async) is a non-issue for a greenfield project. Next.js 14 is essentially in maintenance mode.

**Confidence:** HIGH. Version numbers verified. Next.js 15 has been stable since late 2024.

---

## Recommended Monorepo Folder Structure

```
glimmora-team/
|
|-- turbo.json                          # Turborepo pipeline configuration
|-- package.json                        # Root workspace configuration (pnpm)
|-- pnpm-workspace.yaml                 # Workspace definition
|-- .npmrc                              # pnpm configuration (shamefully-hoist=false)
|-- .gitignore
|-- .env.example                        # Template for all env vars
|-- .eslintrc.js                        # Root ESLint (extends @glimmora/config)
|-- tsconfig.json                       # Root TypeScript config (references)
|
|-- apps/
|   |
|   |-- women-portal/                   # Next.js 15 App Router
|   |   |-- next.config.ts
|   |   |-- tailwind.config.ts          # Extends @glimmora/config/tailwind
|   |   |-- postcss.config.js
|   |   |-- tsconfig.json               # Extends @glimmora/config/typescript
|   |   |-- package.json                # name: "@glimmora/women-portal"
|   |   |-- .env.local                  # Portal-specific env vars
|   |   |-- public/
|   |   |   |-- fonts/                  # Miller Display + Avenir LT Std
|   |   |   |-- images/
|   |   |   `-- mockServiceWorker.js    # MSW service worker (generated)
|   |   |
|   |   `-- src/
|   |       |-- app/                    # Next.js App Router (routes)
|   |       |   |-- layout.tsx          # Root layout: fonts, providers, language context
|   |       |   |-- globals.css         # Tailwind directives + custom properties
|   |       |   |-- not-found.tsx
|   |       |   |
|   |       |   |-- (public)/           # Route group: pre-auth pages
|   |       |   |   |-- layout.tsx      # Public layout (no sidebar, no auth)
|   |       |   |   |-- page.tsx        # Landing page
|   |       |   |   |-- how-it-works/
|   |       |   |   |-- trust-safety/
|   |       |   |   `-- faq/
|   |       |   |
|   |       |   |-- (onboarding)/       # Route group: onboarding wizard
|   |       |   |   |-- layout.tsx      # Onboarding layout (progress bar, no nav)
|   |       |   |   |-- language/       # Step 0: Language selection (FIRST SCREEN)
|   |       |   |   |-- trust/          # Step 1: Trust explainer
|   |       |   |   |-- register/       # Step 2: Soft registration
|   |       |   |   |-- skills/         # Step 3: Skill discovery
|   |       |   |   |-- orientation/    # Step 4: Orientation & consent
|   |       |   |   |-- verification/   # Step 5: ID verification
|   |       |   |   |-- payment-setup/  # Step 6: Payment setup
|   |       |   |   `-- welcome/        # Step 7: Welcome & first task
|   |       |   |
|   |       |   `-- (app)/              # Route group: authenticated app
|   |       |       |-- layout.tsx      # App layout: sidebar, topbar, notifications
|   |       |       |-- dashboard/      # Home dashboard
|   |       |       |-- tasks/          # My Tasks
|   |       |       |   |-- page.tsx    # Task list
|   |       |       |   `-- [taskId]/   # Task detail
|   |       |       |       |-- page.tsx
|   |       |       |       `-- submit/ # Evidence submission
|   |       |       |-- profile/        # My Profile (private)
|   |       |       |   |-- skill-genome/
|   |       |       |   |-- badges/
|   |       |       |   `-- podl/
|   |       |       |-- earnings/       # Earnings & Payments
|   |       |       |-- learning/       # Learning modules
|   |       |       |-- community/      # Women's Circle
|   |       |       `-- settings/       # Settings (language, privacy, etc.)
|   |       |
|   |       |-- components/            # Portal-specific components
|   |       |   |-- onboarding/         # Onboarding wizard components
|   |       |   |-- tasks/              # Task-related components
|   |       |   |-- earnings/           # Earnings-specific components
|   |       |   `-- community/          # Community components
|   |       |
|   |       |-- hooks/                  # Portal-specific hooks
|   |       |   |-- use-language.ts     # Language context hook
|   |       |   `-- use-onboarding.ts   # Onboarding state machine
|   |       |
|   |       |-- lib/                    # Portal-specific utilities
|   |       |   |-- api.ts              # TanStack Query keys + fetch functions
|   |       |   `-- constants.ts
|   |       |
|   |       |-- providers/             # React context providers
|   |       |   |-- language-provider.tsx  # Language context wrapper
|   |       |   |-- query-provider.tsx     # TanStack Query provider
|   |       |   |-- auth-provider.tsx      # Mock auth provider
|   |       |   `-- msw-provider.tsx       # MSW initialization
|   |       |
|   |       `-- mocks/                 # MSW handlers for THIS portal
|   |           |-- handlers/
|   |           |   |-- tasks.ts
|   |           |   |-- earnings.ts
|   |           |   |-- profile.ts
|   |           |   `-- community.ts
|   |           |-- data/              # Fixture data
|   |           |   |-- tasks.ts
|   |           |   |-- earnings.ts
|   |           |   `-- profile.ts
|   |           |-- browser.ts         # MSW browser setup
|   |           `-- index.ts           # Handler aggregation
|   |
|   |-- university-portal/             # Same structure as women-portal
|   |   `-- src/
|   |       |-- app/
|   |       |   |-- (public)/
|   |       |   |-- (onboarding)/
|   |       |   `-- (app)/
|   |       |       |-- dashboard/
|   |       |       |-- tasks/
|   |       |       |-- podl/           # PoDL credentials (key differentiator)
|   |       |       |-- teams/          # Anonymous team awareness
|   |       |       |-- learning/
|   |       |       |-- (governor)/     # Route group: University Strategic Governor views
|   |       |       |   |-- layout.tsx  # Governor-specific layout
|   |       |       |   |-- overview/
|   |       |       |   |-- programs/
|   |       |       |   `-- reports/
|   |       |       `-- settings/
|   |       |-- components/
|   |       |-- hooks/
|   |       |-- lib/
|   |       |-- providers/
|   |       `-- mocks/
|   |
|   |-- enterprise-portal/             # Desktop-first, complex layouts
|   |   `-- src/
|   |       |-- app/
|   |       |   |-- (public)/
|   |       |   |-- (onboarding)/
|   |       |   `-- (app)/
|   |       |       |-- layout.tsx      # Complex layout: sidebar + main + slide-out panel
|   |       |       |-- dashboard/
|   |       |       |-- sow/            # SOW Management
|   |       |       |   |-- upload/
|   |       |       |   |-- [sowId]/
|   |       |       |   |   |-- intelligence/  # SOW Intelligence output
|   |       |       |   |   `-- blueprint/     # Blueprint editor (4-panel)
|   |       |       |   `-- archive/
|   |       |       |-- projects/
|   |       |       |   |-- page.tsx    # Active projects
|   |       |       |   `-- [projectId]/
|   |       |       |       |-- page.tsx        # Overview tab (default)
|   |       |       |       |-- timeline/       # Milestone timeline / Gantt
|   |       |       |       |-- evidence/       # Evidence packs
|   |       |       |       |-- rework/         # Rework requests
|   |       |       |       |-- escalations/    # Escalation centre
|   |       |       |       |-- payments/       # Payment release
|   |       |       |       `-- team/           # Team summary (anonymized)
|   |       |       |-- compliance/     # Evidence & compliance
|   |       |       |-- payments/       # Payment management
|   |       |       `-- settings/
|   |       |-- components/
|   |       |   |-- sow/                # SOW upload, intelligence display
|   |       |   |-- blueprint/          # Blueprint editor components
|   |       |   |-- projects/           # Project detail tab components
|   |       |   `-- payments/
|   |       |-- hooks/
|   |       |-- lib/
|   |       |-- providers/
|   |       `-- mocks/
|   |
|   |-- mentor-portal/                 # 3-panel layout is the signature feature
|   |   `-- src/
|   |       |-- app/
|   |       |   |-- (public)/
|   |       |   |-- (onboarding)/
|   |       |   `-- (app)/
|   |       |       |-- layout.tsx
|   |       |       |-- dashboard/
|   |       |       |-- reviews/
|   |       |       |   |-- page.tsx           # Review queue (3 tabs)
|   |       |       |   `-- [reviewId]/
|   |       |       |       `-- page.tsx       # 3-panel review detail
|   |       |       |-- conversations/         # Mentor conversations
|   |       |       |   |-- page.tsx
|   |       |       |   `-- [threadId]/
|   |       |       |-- skill-tags/            # Skill tag verification
|   |       |       |-- profile/               # Mentor profile + tier
|   |       |       `-- settings/
|   |       |-- components/
|   |       |   |-- review/             # 3-panel layout components
|   |       |   |   |-- review-layout.tsx       # Resizable 3-panel container
|   |       |   |   |-- task-context-panel.tsx  # Left panel
|   |       |   |   |-- evidence-viewer.tsx     # Center panel
|   |       |   |   `-- review-form.tsx         # Right panel
|   |       |   |-- conversations/
|   |       |   `-- skill-tags/
|   |       |-- hooks/
|   |       |-- lib/
|   |       |-- providers/
|   |       `-- mocks/
|   |
|   `-- admin-panel/                   # Desktop-only, high-density
|       `-- src/
|           |-- app/
|           |   |-- login/              # No public pages -- straight to login
|           |   `-- (app)/
|           |       |-- layout.tsx      # Admin layout: collapsible sidebar + breadcrumbs
|           |       |-- dashboard/      # Platform overview
|           |       |-- users/          # User management (6 user types)
|           |       |   |-- women/
|           |       |   |-- students/
|           |       |   |-- alumni/
|           |       |   |-- enterprise/
|           |       |   |-- mentors/
|           |       |   |-- governors/
|           |       |   `-- [userId]/   # User detail (6-tab shared layout)
|           |       |-- projects/       # Project management
|           |       |   |-- page.tsx
|           |       |   `-- [projectId]/ # Admin project detail (10 tabs)
|           |       |-- disputes/       # Dispute resolution
|           |       |   |-- page.tsx
|           |       |   `-- [disputeId]/
|           |       |-- approvals/      # Onboarding approvals
|           |       |-- content/        # Content management
|           |       |-- reports/        # Reports & analytics
|           |       `-- settings/       # Platform settings (Super Admin)
|           |-- components/
|           |   |-- tables/             # High-density data tables
|           |   |-- charts/             # Dashboard chart components
|           |   |-- disputes/
|           |   `-- approvals/
|           |-- hooks/
|           |-- lib/
|           |-- providers/
|           `-- mocks/
|
|-- packages/
|   |
|   |-- ui/                             # @glimmora/ui -- Shared design system
|   |   |-- package.json                # name: "@glimmora/ui"
|   |   |-- tsconfig.json               # Extends @glimmora/config/typescript
|   |   |-- .storybook/                 # Storybook configuration
|   |   |   |-- main.ts
|   |   |   |-- preview.tsx
|   |   |   `-- manager.ts
|   |   |
|   |   `-- src/
|   |       |-- index.ts                # Barrel export (all components)
|   |       |
|   |       |-- primitives/             # Radix UI primitive wrappers
|   |       |   |-- button.tsx          # "use client" -- Radix-based
|   |       |   |-- dialog.tsx          # "use client" -- Radix Dialog
|   |       |   |-- dropdown-menu.tsx   # "use client" -- Radix DropdownMenu
|   |       |   |-- select.tsx          # "use client" -- Radix Select
|   |       |   |-- tabs.tsx            # "use client" -- Radix Tabs
|   |       |   |-- tooltip.tsx         # "use client" -- Radix Tooltip
|   |       |   |-- accordion.tsx       # "use client" -- Radix Accordion
|   |       |   |-- popover.tsx         # "use client" -- Radix Popover
|   |       |   |-- checkbox.tsx        # "use client" -- Radix Checkbox
|   |       |   |-- radio-group.tsx     # "use client" -- Radix RadioGroup
|   |       |   |-- switch.tsx          # "use client" -- Radix Switch
|   |       |   |-- slider.tsx          # "use client" -- Radix Slider
|   |       |   |-- progress.tsx        # "use client" -- Radix Progress
|   |       |   |-- avatar.tsx          # "use client" -- Radix Avatar
|   |       |   |-- badge.tsx           # Pure CSS -- no "use client" needed
|   |       |   |-- separator.tsx       # Pure CSS -- no "use client" needed
|   |       |   `-- index.ts            # Re-exports all primitives
|   |       |
|   |       |-- composites/            # Higher-level composed components
|   |       |   |-- data-table.tsx      # "use client" -- sortable, filterable table
|   |       |   |-- form-field.tsx      # "use client" -- label + input + error
|   |       |   |-- stepper.tsx         # "use client" -- multi-step wizard indicator
|   |       |   |-- file-upload.tsx     # "use client" -- drag-and-drop upload
|   |       |   |-- kpi-card.tsx        # Gradient KPI card (can be server component)
|   |       |   |-- sidebar.tsx         # "use client" -- collapsible sidebar
|   |       |   |-- topbar.tsx          # "use client" -- app top navigation
|   |       |   |-- empty-state.tsx     # Illustration + message (server component)
|   |       |   |-- status-badge.tsx    # Colored status indicator (server component)
|   |       |   |-- timeline.tsx        # Vertical timeline (server component)
|   |       |   `-- index.ts
|   |       |
|   |       |-- layout/                # Layout primitives
|   |       |   |-- page-header.tsx     # Page title + breadcrumbs (server component)
|   |       |   |-- page-shell.tsx      # Page content wrapper (server component)
|   |       |   |-- card.tsx            # Card container (server component)
|   |       |   |-- grid.tsx            # Responsive grid (server component)
|   |       |   |-- stack.tsx           # Vertical/horizontal stack (server component)
|   |       |   |-- resizable-panels.tsx # "use client" -- wraps react-resizable-panels
|   |       |   `-- index.ts
|   |       |
|   |       |-- feedback/              # User feedback components
|   |       |   |-- toast.tsx           # "use client" -- notification toasts
|   |       |   |-- alert.tsx           # Alert banners (server component)
|   |       |   |-- skeleton.tsx        # Loading skeleton (server component)
|   |       |   |-- spinner.tsx         # Loading spinner (server component)
|   |       |   `-- index.ts
|   |       |
|   |       `-- icons/                  # Custom icon components
|   |           |-- index.ts
|   |           `-- ...                 # SVG icon components (server components)
|   |
|   |-- types/                          # @glimmora/types -- Shared TypeScript types
|   |   |-- package.json                # name: "@glimmora/types"
|   |   |-- tsconfig.json
|   |   `-- src/
|   |       |-- index.ts                # Barrel export
|   |       |-- user.ts                 # User types (all roles)
|   |       |-- task.ts                 # Task, Evidence, Submission types
|   |       |-- project.ts              # Project, SOW, Blueprint types
|   |       |-- skill.ts                # SkillGenome, SkillTag, PoDL types
|   |       |-- review.ts               # Review, ReviewDecision types
|   |       |-- payment.ts              # Payment, Earning, Invoice types
|   |       |-- notification.ts         # Notification types
|   |       |-- apg.ts                  # APG action types (governance events)
|   |       |-- api.ts                  # API response wrappers, pagination
|   |       `-- enums.ts                # Shared enums (status, roles, tiers)
|   |
|   `-- config/                         # @glimmora/config -- Shared configuration
|       |-- package.json                # name: "@glimmora/config"
|       |-- tailwind.config.ts          # Base Tailwind config (design tokens)
|       |-- eslint/
|       |   |-- base.js                 # Base ESLint rules
|       |   |-- next.js                 # Next.js-specific ESLint rules
|       |   `-- react.js                # React-specific ESLint rules
|       `-- typescript/
|           |-- base.json               # Base tsconfig
|           |-- next.json               # Next.js tsconfig
|           `-- react-library.json      # Library tsconfig (for packages/ui)
|
|-- tooling/                            # Build tooling (optional, for scripts)
|   `-- scripts/
|       |-- generate-msw-worker.sh      # Generate mockServiceWorker.js for all apps
|       `-- check-types.sh              # Type-check all workspaces
|
`-- docs/                               # Development documentation (optional)
    `-- ARCHITECTURE.md                 # This document (symlinked or referenced)
```

---

## Component Boundaries: What Packages Export, What Apps Consume

### @glimmora/ui -- Design System Package

**Package type:** Internal package (Just-in-Time transpilation by consuming Next.js apps)

**What it exports:**

```typescript
// packages/ui/src/index.ts
// Primitives
export { Button, type ButtonProps } from './primitives/button';
export { Dialog, DialogTrigger, DialogContent, ... } from './primitives/dialog';
export { Select, SelectItem, ... } from './primitives/select';
export { Tabs, TabsList, TabsTrigger, TabsContent } from './primitives/tabs';
// ... all Radix wrappers

// Composites
export { DataTable, type DataTableProps } from './composites/data-table';
export { FormField, type FormFieldProps } from './composites/form-field';
export { Stepper, type StepperProps } from './composites/stepper';
export { FileUpload, type FileUploadProps } from './composites/file-upload';
export { KPICard, type KPICardProps } from './composites/kpi-card';
export { Sidebar, type SidebarProps } from './composites/sidebar';
// ...

// Layout
export { PageHeader, PageShell, Card, Grid, Stack } from './layout';
export { ResizablePanels, Panel, PanelResizeHandle } from './layout/resizable-panels';

// Feedback
export { Toast, Alert, Skeleton, Spinner } from './feedback';
```

**What it does NOT export:**
- Page layouts (those live in each app's `(app)/layout.tsx`)
- Business logic components (task cards, review forms -- those are portal-specific)
- Mock data or API functions
- Providers (each app manages its own provider tree)

### @glimmora/types -- TypeScript Types Package

**Package type:** Internal package (types only -- zero runtime, zero bundle impact)

**What it exports:**

```typescript
// packages/types/src/index.ts
export type { User, WomanContributor, Student, EnterpriseRequester, Mentor, Admin } from './user';
export type { Task, TaskBrief, Evidence, Submission, TaskStatus } from './task';
export type { Project, SOW, Blueprint, Milestone, Phase } from './project';
export type { SkillGenome, SkillTag, PoDLEntry, PoDLCredential } from './skill';
export type { Review, ReviewDecision, ReviewCriteria } from './review';
export type { Payment, Earning, Invoice, PaymentMethod } from './payment';
export type { Notification, NotificationPreferences } from './notification';
export type { APGAction, APGAlert, GovernanceEvent } from './apg';
export type { ApiResponse, PaginatedResponse, ApiError } from './api';
export { UserRole, TaskStatus, ReviewDecision, PaymentStatus, MentorTier } from './enums';
```

**Critical role:** These types become the API contract for backend handoff. When a backend developer reads `Task` type, they know exactly what shape the API must return. MSW handlers in each portal use these same types to generate mock responses.

### @glimmora/config -- Shared Configuration

**Package type:** Internal package (consumed at build time)

**What it exports:**

```typescript
// Tailwind preset (not a full config -- a preset to be extended)
// packages/config/tailwind.config.ts
import type { Config } from 'tailwindcss';

const config: Partial<Config> = {
  theme: {
    extend: {
      colors: {
        brand: {
          terracotta: '#A0614A',
          sand: '#C9A882',
          forest: '#4A6741',
          teal: '#3A8FA0',
          gold: '#C4A23A',
        },
        surface: {
          background: '#FAF7F4',
          card: '#FFFFFF',
          border: '#EAD9CC',
        },
        text: {
          heading: '#2C1F1A',
          body: '#6B4C3B',
        },
      },
      fontFamily: {
        display: ['Miller Display', 'Georgia', 'serif'],
        body: ['Avenir LT Std', 'Avenir', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-kpi': 'linear-gradient(135deg, #A0614A, #C4A23A)',
        'gradient-milestone': 'linear-gradient(135deg, #4A6741, #3A8FA0)',
        'gradient-cta': 'linear-gradient(135deg, #A0614A, #C9A882)',
      },
    },
  },
};

export default config;
```

---

## Critical Architecture Decision: "use client" Boundary Strategy for Radix UI in App Router

### The Problem

Radix UI primitives use React context, refs, and event handlers internally. They **require** client-side JavaScript. In Next.js App Router, all components are Server Components by default. Radix components must be explicitly marked as Client Components.

### The Strategy: "use client" at the Primitive Wrapper Level

```
                    SERVER COMPONENT BOUNDARY
                    (default in App Router)
                           |
    +----------------------|----------------------+
    |  app/(app)/dashboard/page.tsx               |
    |  (Server Component -- fetches data,         |
    |   renders static structure)                 |
    |                                             |
    |  import { KPICard } from '@glimmora/ui';    |
    |  import { PageShell } from '@glimmora/ui';  |
    |  import { TaskSummary } from '../components |
    |    /tasks/task-summary';                    |
    |                                             |
    |  <PageShell>        <-- Server Component    |
    |    <KPICard />      <-- Server Component    |
    |    <TaskSummary />  <-- Client Component    |
    |  </PageShell>          (interactive)        |
    +---------------------------------------------+
```

**Rule 1: Every Radix-based component in `@glimmora/ui` that uses interactivity gets `"use client"` at the TOP of its file.**

```typescript
// packages/ui/src/primitives/button.tsx
"use client";

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cn } from '../lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(
          'inline-flex items-center justify-center rounded-lg font-body font-medium transition-colors',
          // variant classes, size classes...
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
```

**Rule 2: Layout and presentational components that need NO interactivity remain Server Components (no `"use client"`).**

```typescript
// packages/ui/src/layout/card.tsx
// NO "use client" directive -- this is a Server Component

import { cn } from '../lib/utils';

export interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className }: CardProps) {
  return (
    <div className={cn('rounded-xl bg-surface-card border border-surface-border p-6', className)}>
      {children}
    </div>
  );
}
```

**Rule 3: When a Server Component page needs to compose Client Components, the `"use client"` boundary propagates downward, NOT upward.**

```typescript
// app/(app)/tasks/[taskId]/page.tsx -- SERVER Component
import { TaskBrief } from '@/components/tasks/task-brief';       // Server
import { EvidenceSubmission } from '@/components/tasks/evidence'; // Client (has form)
import { MentorChat } from '@/components/tasks/mentor-chat';     // Client (interactive)

export default async function TaskDetailPage({ params }: { params: { taskId: string } }) {
  // In production: fetch task data server-side
  // In MSW phase: this will be a client component wrapper or use TanStack Query
  return (
    <PageShell>
      <TaskBrief taskId={params.taskId} />
      <EvidenceSubmission taskId={params.taskId} />
      <MentorChat taskId={params.taskId} />
    </PageShell>
  );
}
```

### Component Classification Table

| Component | "use client"? | Why |
|-----------|:------------:|-----|
| Button, Dialog, Select, Tabs | YES | Radix internals require client JS |
| DataTable (sortable) | YES | Sort state, column resize, pagination |
| FormField | YES | Controlled inputs, validation |
| Stepper | YES | Step navigation state |
| FileUpload | YES | Drag-and-drop, file API |
| Sidebar (collapsible) | YES | Collapse state, animations |
| Toast | YES | Timer, dismiss interaction |
| ResizablePanels | YES | Drag resize, mouse events |
| Card, Grid, Stack | NO | Pure layout, CSS only |
| PageHeader, PageShell | NO | Static structure |
| KPICard | NO | Static display (gradient via CSS) |
| Badge, Separator | NO | Pure CSS |
| StatusBadge, Timeline | NO | Static display |
| Skeleton, Spinner, Alert | NO | CSS animations, no JS state |
| Icons | NO | SVG, no interaction |

**Confidence:** HIGH. This pattern is well-established in Next.js App Router documentation and the wider React Server Components ecosystem.

---

## Tailwind CSS Across Packages: The Content Path Strategy

### The Problem

Tailwind v3 uses a JIT compiler that scans files for class names. It needs to know which files to scan via the `content` array in `tailwind.config.ts`. In a monorepo, apps must scan BOTH their own files AND the shared `@glimmora/ui` package files.

### The Solution: Shared Preset + Content Path Extension

**Step 1: Base config in `@glimmora/config` is a PRESET (not a standalone config)**

```typescript
// packages/config/tailwind.config.ts
import type { Config } from 'tailwindcss';

const config: Partial<Config> = {
  theme: {
    extend: {
      // All design tokens (colors, fonts, gradients, spacing)
    },
  },
  plugins: [
    // Shared plugins (e.g., tailwindcss/forms if needed)
  ],
};

export default config;
```

**Step 2: Each app extends the preset AND adds content paths including the UI package**

```typescript
// apps/women-portal/tailwind.config.ts
import type { Config } from 'tailwindcss';
import sharedConfig from '@glimmora/config/tailwind.config';

const config: Config = {
  presets: [sharedConfig],
  content: [
    // This app's source files
    './src/**/*.{ts,tsx}',
    // The shared UI package source files (CRITICAL)
    '../../packages/ui/src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      // Portal-specific overrides (if any -- rare)
    },
  },
};

export default config;
```

**Step 3: The `@glimmora/ui` package itself does NOT have its own Tailwind build.**

The UI package is an Internal Package using Just-in-Time (JIT) transpilation. It exports raw TypeScript/TSX source code. The consuming Next.js app compiles it AND processes its Tailwind classes through the app's own Tailwind build.

This means:
- UI package components use Tailwind classes freely
- Those classes are resolved at the consuming app's build time
- Design tokens from the shared preset are available everywhere
- No duplicate CSS, no conflicting builds

### PostCSS Configuration

Each app needs its own `postcss.config.js`:

```javascript
// apps/women-portal/postcss.config.js
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

### Globals CSS

Each app imports Tailwind's base layers plus custom properties:

```css
/* apps/women-portal/src/app/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  @font-face {
    font-family: 'Miller Display';
    src: url('/fonts/MillerDisplay-Roman.woff2') format('woff2');
    font-weight: 400;
    font-display: swap;
  }
  @font-face {
    font-family: 'Avenir LT Std';
    src: url('/fonts/AvenirLTStd-Book.woff2') format('woff2');
    font-weight: 400;
    font-display: swap;
  }
  /* Additional font weights... */
}
```

**Confidence:** HIGH. Tailwind v3 preset pattern in monorepos is extensively documented and battle-tested.

---

## Next.js `transpilePackages` Configuration

For internal packages to work with Just-in-Time compilation, each Next.js app must tell Next.js to transpile the workspace packages:

```typescript
// apps/women-portal/next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@glimmora/ui', '@glimmora/types', '@glimmora/config'],
  // other config...
};

export default nextConfig;
```

This tells Next.js: "When you encounter imports from these packages, run them through the same compilation pipeline as my own source code." This is what makes the JIT internal package strategy work -- no separate build step for `@glimmora/ui`.

**Confidence:** HIGH. `transpilePackages` has been stable in Next.js since 13.1.

---

## MSW Architecture: Multi-Portal Mock Strategy

### Decision: Shared Types + Per-Portal Handlers

MSW mock data lives in each portal's `src/mocks/` directory, NOT in a shared package. Here is why:

| Approach | Pros | Cons |
|----------|------|------|
| **Shared MSW package** | DRY handlers, single source | Different portals see different data shapes; handler logic becomes a tangled mess of role-based conditionals |
| **Per-portal handlers (RECOMMENDED)** | Clean, portal-specific mock data; easy to reason about | Some duplication of common entity shapes |

**The hybrid approach:** Types are shared (`@glimmora/types`), handlers are per-portal, factory functions for common mock data are shared.

### Architecture

```
packages/types/src/
  |-- task.ts               # Task type definition (shared)
  |-- user.ts               # User type definition (shared)
  |-- api.ts                # ApiResponse<T> wrapper (shared)

apps/women-portal/src/mocks/
  |-- handlers/
  |   |-- tasks.ts          # Women's task endpoints (simplified view)
  |   `-- earnings.ts       # Women's earnings endpoints
  |-- data/
  |   |-- tasks.ts          # Fixture: tasks as a woman contributor sees them
  |   `-- user.ts           # Fixture: Fatima persona mock data
  |-- browser.ts            # setupWorker(...)
  `-- index.ts              # Aggregate all handlers

apps/enterprise-portal/src/mocks/
  |-- handlers/
  |   |-- projects.ts       # Enterprise project endpoints (full project view)
  |   |-- sow.ts            # SOW upload + intelligence endpoints
  |   `-- payments.ts       # Payment release endpoints
  |-- data/
  |   |-- projects.ts       # Fixture: projects as enterprise requester sees them
  |   `-- user.ts           # Fixture: Priya persona mock data
  |-- browser.ts
  `-- index.ts
```

### Shared Mock Factories (Optional Enhancement)

If significant duplication emerges, create factory functions in `@glimmora/types` or a lightweight `@glimmora/mocks` package:

```typescript
// packages/types/src/factories/task.ts (or packages/mocks/src/factories/)
import type { Task } from '../task';

export function createMockTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'task-001',
    title: 'Review API documentation',
    status: 'active',
    // ... sensible defaults
    ...overrides,
  };
}
```

This keeps mock data DRY without coupling handler logic across portals.

### MSW Browser Setup Pattern

```typescript
// apps/women-portal/src/mocks/browser.ts
import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

export const worker = setupWorker(...handlers);
```

```typescript
// apps/women-portal/src/providers/msw-provider.tsx
"use client";

import { useEffect, useState } from 'react';

export function MSWProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_MSW_ENABLED === 'true') {
      import('../mocks/browser').then(({ worker }) => {
        worker.start({ onUnhandledRequest: 'bypass' }).then(() => {
          setReady(true);
        });
      });
    } else {
      setReady(true);
    }
  }, []);

  if (!ready) return null; // Or a loading state
  return <>{children}</>;
}
```

**Confidence:** HIGH for the per-portal handler pattern. MSW 2.x browser setup patterns are well-established. The `MSWProvider` pattern is standard for Next.js App Router.

---

## Storybook Integration Point

### Where Storybook Lives: In `packages/ui/`

Storybook is configured inside the UI package because it documents the shared component library. It is the primary handoff artifact for backend developers.

```
packages/ui/
  |-- .storybook/
  |   |-- main.ts           # Storybook config
  |   |-- preview.tsx        # Global decorators, Tailwind CSS import
  |   `-- manager.ts         # Storybook UI customization
  |-- src/
  |   |-- primitives/
  |   |   |-- button.tsx
  |   |   `-- button.stories.tsx    # Co-located stories
  |   |-- composites/
  |   |   |-- data-table.tsx
  |   |   `-- data-table.stories.tsx
  |   `-- ...
  `-- package.json
```

### Storybook + Tailwind Integration

```typescript
// packages/ui/.storybook/main.ts
import type { StorybookConfig } from '@storybook/nextjs';

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-a11y',       // Accessibility checks (critical for this project)
  ],
  framework: {
    name: '@storybook/nextjs',     // Use Next.js framework for accurate rendering
    options: {},
  },
};

export default config;
```

```typescript
// packages/ui/.storybook/preview.tsx
import type { Preview } from '@storybook/react';
import '../src/storybook.css';  // Tailwind CSS for Storybook

const preview: Preview = {
  parameters: {
    backgrounds: {
      default: 'glimmora',
      values: [
        { name: 'glimmora', value: '#FAF7F4' },
        { name: 'white', value: '#FFFFFF' },
        { name: 'dark', value: '#2C1F1A' },
      ],
    },
  },
};

export default preview;
```

```css
/* packages/ui/src/storybook.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Font imports for Storybook standalone mode */
@font-face {
  font-family: 'Miller Display';
  src: url('./fonts/MillerDisplay-Roman.woff2') format('woff2');
  font-weight: 400;
  font-display: swap;
}
/* ... */
```

**Critical:** Storybook needs its OWN Tailwind build because it runs independently of Next.js. The `@storybook/nextjs` framework adapter handles PostCSS processing. The UI package needs a `tailwind.config.ts` that extends the shared preset AND points `content` at its own `src/` directory:

```typescript
// packages/ui/tailwind.config.ts
import type { Config } from 'tailwindcss';
import sharedConfig from '@glimmora/config/tailwind.config';

const config: Config = {
  presets: [sharedConfig],
  content: ['./src/**/*.{ts,tsx}'],
};

export default config;
```

**Confidence:** HIGH for the co-located stories pattern. MEDIUM for exact Storybook 8 + `@storybook/nextjs` configuration details (Storybook 8 changed some config patterns; verify against latest docs during implementation).

---

## Data Flow: TanStack Query + MSW

### Pattern: Every API Call Goes Through TanStack Query, MSW Intercepts

```
┌─────────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  React Component     │     │  TanStack Query   │     │  MSW Handler     │
│                     │     │                  │     │                 │
│  useQuery({         │ --> │  queryFn: ()=>   │ --> │  http.get(...)  │
│    queryKey: [...]   │     │    fetch('/api/   │     │  return json()  │
│    queryFn: ...     │     │    tasks')        │     │                 │
│  })                 │     │                  │     │  (intercepts    │
│                     │ <-- │  Returns data    │ <-- │   fetch, returns │
│  Renders with data  │     │  Caches result   │     │   mock data)    │
└─────────────────────┘     └──────────────────┘     └─────────────────┘
```

### TanStack Query Provider Setup

```typescript
// apps/women-portal/src/providers/query-provider.tsx
"use client";

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,       // 1 minute
            refetchOnWindowFocus: false, // For dev convenience with MSW
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

### Provider Composition in Root Layout

```typescript
// apps/women-portal/src/app/layout.tsx
import { LanguageProvider } from '@/providers/language-provider';
import { QueryProvider } from '@/providers/query-provider';
import { AuthProvider } from '@/providers/auth-provider';
import { MSWProvider } from '@/providers/msw-provider';
import './globals.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr">
      <body className="font-body text-text-body bg-surface-background">
        <MSWProvider>
          <QueryProvider>
            <AuthProvider>
              <LanguageProvider>
                {children}
              </LanguageProvider>
            </AuthProvider>
          </QueryProvider>
        </MSWProvider>
      </body>
    </html>
  );
}
```

**Provider nesting order matters:**
1. **MSWProvider** (outermost) -- must be ready before any fetch calls
2. **QueryProvider** -- manages all data fetching
3. **AuthProvider** -- mock auth context (Zustand store)
4. **LanguageProvider** -- language context (Women's Portal specific)

### Query Key Convention

```typescript
// apps/women-portal/src/lib/api.ts
import type { Task, ApiResponse, PaginatedResponse } from '@glimmora/types';

// Query keys follow [entity, scope, params] pattern
export const queryKeys = {
  tasks: {
    all: ['tasks'] as const,
    active: () => [...queryKeys.tasks.all, 'active'] as const,
    detail: (id: string) => [...queryKeys.tasks.all, 'detail', id] as const,
  },
  earnings: {
    all: ['earnings'] as const,
    summary: () => [...queryKeys.earnings.all, 'summary'] as const,
    history: (page: number) => [...queryKeys.earnings.all, 'history', page] as const,
  },
  // ...
};

// Fetch functions (these hit MSW-intercepted endpoints)
export async function fetchActiveTasks(): Promise<ApiResponse<Task[]>> {
  const res = await fetch('/api/tasks?status=active');
  if (!res.ok) throw new Error('Failed to fetch tasks');
  return res.json();
}

export async function fetchTaskDetail(id: string): Promise<ApiResponse<Task>> {
  const res = await fetch(`/api/tasks/${id}`);
  if (!res.ok) throw new Error('Failed to fetch task');
  return res.json();
}
```

**Confidence:** HIGH. TanStack Query v5 patterns are stable and well-documented.

---

## Authentication Mocking Strategy

### Decision: Shared Auth Types, Per-Portal Zustand Store

Each portal has its own auth context because different portals expose different user roles with different data shapes. But the auth types come from `@glimmora/types`.

```typescript
// packages/types/src/user.ts
export interface BaseUser {
  id: string;
  email: string;
  role: UserRole;
  name: string;
  createdAt: string;
}

export interface WomanContributor extends BaseUser {
  role: 'woman_contributor';
  whatsappNumber: string;
  city: string;
  country: string;
  skillGenome: SkillGenome;
  verificationStatus: 'pending' | 'verified' | 'unverified';
  language: string;
}

export interface EnterpriseRequester extends BaseUser {
  role: 'enterprise_requester';
  companyName: string;
  companyId: string;
  subRole: 'primary_admin' | 'project_manager' | 'finance_approver' | 'viewer';
}
// ... other role types
```

```typescript
// apps/women-portal/src/providers/auth-provider.tsx
"use client";

import { create } from 'zustand';
import type { WomanContributor } from '@glimmora/types';

interface AuthState {
  user: WomanContributor | null;
  isAuthenticated: boolean;
  login: (user: WomanContributor) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  login: (user) => set({ user, isAuthenticated: true }),
  logout: () => set({ user: null, isAuthenticated: false }),
}));
```

Each portal's auth store is typed to its specific user role. This prevents accidentally accessing enterprise fields in the women's portal. The mock login flow populates this store with fixture data.

**Confidence:** HIGH. Zustand + TypeScript discriminated union pattern is straightforward.

---

## Environment Variables Across 5 Apps

### Strategy: `.env` Files Per App + Shared Convention

Turborepo does NOT share environment variables across apps. Each app has its own `.env.local`.

```
apps/women-portal/.env.local
apps/university-portal/.env.local
apps/enterprise-portal/.env.local
apps/mentor-portal/.env.local
apps/admin-panel/.env.local
```

### Convention: Shared Variable Names, Different Values

```bash
# apps/women-portal/.env.local
NEXT_PUBLIC_APP_NAME="GlimmoraTeam Women's Program"
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api
NEXT_PUBLIC_MSW_ENABLED=true
NEXT_PUBLIC_PORTAL_TYPE=women

# apps/university-portal/.env.local
NEXT_PUBLIC_APP_NAME="GlimmoraTeam University"
NEXT_PUBLIC_APP_URL=http://localhost:3001
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001/api
NEXT_PUBLIC_MSW_ENABLED=true
NEXT_PUBLIC_PORTAL_TYPE=university

# apps/enterprise-portal/.env.local
NEXT_PUBLIC_APP_NAME="GlimmoraTeam Enterprise"
NEXT_PUBLIC_APP_URL=http://localhost:3002
# ... same pattern
```

### Port Assignment Convention

| Portal | Dev Port |
|--------|----------|
| women-portal | 3000 |
| university-portal | 3001 |
| enterprise-portal | 3002 |
| mentor-portal | 3003 |
| admin-panel | 3004 |
| Storybook | 6006 |

### turbo.json Environment Variable Passthrough

```jsonc
// turbo.json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env.*local"],
  "tasks": {
    "dev": {
      "cache": false,
      "persistent": true,
      "env": [
        "NEXT_PUBLIC_APP_NAME",
        "NEXT_PUBLIC_APP_URL",
        "NEXT_PUBLIC_API_BASE_URL",
        "NEXT_PUBLIC_MSW_ENABLED",
        "NEXT_PUBLIC_PORTAL_TYPE"
      ]
    },
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**"],
      "env": [
        "NEXT_PUBLIC_APP_NAME",
        "NEXT_PUBLIC_APP_URL",
        "NEXT_PUBLIC_API_BASE_URL",
        "NEXT_PUBLIC_MSW_ENABLED",
        "NEXT_PUBLIC_PORTAL_TYPE"
      ]
    },
    "lint": {
      "dependsOn": ["^lint"]
    },
    "type-check": {
      "dependsOn": ["^type-check"]
    },
    "test": {
      "dependsOn": ["^test"]
    },
    "storybook": {
      "cache": false,
      "persistent": true
    }
  }
}
```

**Confidence:** HIGH. Turborepo env passthrough is well-documented.

---

## Portal-Specific Layout Architecture

### Women's Portal: Language Context Wrapping Entire App Tree

The language selection must be the FIRST interactive element. The `LanguageProvider` wraps the entire app and persists the language choice.

```typescript
// apps/women-portal/src/providers/language-provider.tsx
"use client";

import { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'ur' | 'hi' | 'ar' | 'bn';

interface LanguageContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  dir: 'ltr' | 'rtl';
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');

  const dir = ['ur', 'ar'].includes(language) ? 'rtl' : 'ltr';

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = dir;
  }, [language, dir]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, dir }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
```

**Architectural note:** Actual i18n implementation (translations) is out of scope for v1. The language context is designed to support future i18n (the `language` value will drive `next-intl` or similar when implemented). For now, it controls `dir` attribute (RTL support) and surfaces the selection in the UI.

### Enterprise Portal: Nested Layout with Slide-Out Panel

```typescript
// apps/enterprise-portal/src/app/(app)/layout.tsx
"use client";

import { Sidebar } from '@glimmora/ui';
import { SlideOutPanel } from '@/components/layout/slide-out-panel';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen">
      {/* Fixed sidebar */}
      <Sidebar
        items={enterpriseNavItems}
        className="w-64 shrink-0"
      />
      {/* Main content area */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
      {/* Slide-out panel (context-driven, renders when active) */}
      <SlideOutPanel />
    </div>
  );
}
```

The Enterprise Portal's Blueprint Editor (4-panel layout) is a page-level concern, not a layout-level concern. It lives in the blueprint page component using `ResizablePanels` from `@glimmora/ui`.

### Mentor Portal: 3-Panel Resizable Review Layout

The 3-panel review detail is the most complex layout in the system. Use `react-resizable-panels` (v4.6.5 verified) wrapped by `@glimmora/ui`.

```typescript
// apps/mentor-portal/src/components/review/review-layout.tsx
"use client";

import { ResizablePanels, Panel, PanelResizeHandle } from '@glimmora/ui';
import { TaskContextPanel } from './task-context-panel';
import { EvidenceViewer } from './evidence-viewer';
import { ReviewForm } from './review-form';

export function ReviewLayout({ reviewId }: { reviewId: string }) {
  return (
    <div className="h-[calc(100vh-64px)]"> {/* Full height minus topbar */}
      <ResizablePanels direction="horizontal">
        <Panel defaultSize={25} minSize={20}>
          <TaskContextPanel reviewId={reviewId} />
        </Panel>
        <PanelResizeHandle className="w-1 bg-surface-border hover:bg-brand-teal transition-colors" />
        <Panel defaultSize={45} minSize={30}>
          <EvidenceViewer reviewId={reviewId} />
        </Panel>
        <PanelResizeHandle className="w-1 bg-surface-border hover:bg-brand-teal transition-colors" />
        <Panel defaultSize={30} minSize={25}>
          <ReviewForm reviewId={reviewId} />
        </Panel>
      </ResizablePanels>
    </div>
  );
}
```

### Admin Panel: High-Density Data Tables with Polling

The Admin Panel uses `DataTable` from `@glimmora/ui` (built on top of `@tanstack/react-table`) with TanStack Query's `refetchInterval` for simulated real-time updates.

```typescript
// apps/admin-panel/src/app/(app)/dashboard/page.tsx
"use client";

import { useQuery } from '@tanstack/react-query';
import { KPICard } from '@glimmora/ui';

export default function AdminDashboard() {
  const { data: stats } = useQuery({
    queryKey: ['platform-stats'],
    queryFn: fetchPlatformStats,
    refetchInterval: 30_000,  // Poll every 30 seconds for "live" feel
  });

  return (
    <PageShell title="Platform Overview">
      <div className="grid grid-cols-3 gap-4">
        <KPICard title="Active Users" value={stats?.activeUsers} gradient="kpi" />
        <KPICard title="Active Projects" value={stats?.activeProjects} gradient="milestone" />
        {/* ... */}
      </div>
    </PageShell>
  );
}
```

---

## Internal Package Configuration: Just-in-Time Strategy

### Why JIT (Not Compiled)

For the `@glimmora/ui` and `@glimmora/types` packages, use the "Internal Package" (Just-in-Time) strategy, NOT the "Compiled Package" strategy.

| Strategy | How It Works | Pros | Cons |
|----------|-------------|------|------|
| **Just-in-Time (RECOMMENDED)** | Package exports raw TS/TSX source; consuming app's bundler compiles it | Zero build step for packages, instant dev feedback, simpler setup | Consuming apps must be configured to transpile it |
| Compiled | Package has its own build step (tsup/rollup) producing JS output | Works with any consumer | Extra build step, slower iteration, source maps complexity |

**JIT package.json configuration:**

```jsonc
// packages/ui/package.json
{
  "name": "@glimmora/ui",
  "version": "0.0.0",
  "private": true,
  "exports": {
    ".": "./src/index.ts"
  },
  "typesVersions": {
    "*": {
      "*": ["./src/index.ts"]
    }
  },
  "peerDependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "dependencies": {
    "@radix-ui/react-dialog": "^1.1.0",
    "@radix-ui/react-dropdown-menu": "^2.1.0",
    "@radix-ui/react-select": "^2.1.0",
    "@radix-ui/react-tabs": "^1.1.0",
    "@radix-ui/react-tooltip": "^1.1.0",
    "@radix-ui/react-accordion": "^1.2.0",
    "@radix-ui/react-popover": "^1.1.0",
    "@radix-ui/react-checkbox": "^1.1.0",
    "@radix-ui/react-radio-group": "^1.2.0",
    "@radix-ui/react-switch": "^1.1.0",
    "@radix-ui/react-slider": "^1.2.0",
    "@radix-ui/react-progress": "^1.1.0",
    "@radix-ui/react-avatar": "^1.1.0",
    "@radix-ui/react-slot": "^1.1.0",
    "react-resizable-panels": "^4.6.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.6.0"
  },
  "devDependencies": {
    "@glimmora/config": "workspace:*",
    "@storybook/nextjs": "^8.5.0",
    "@storybook/addon-essentials": "^8.5.0",
    "@storybook/addon-a11y": "^8.5.0",
    "storybook": "^8.5.0",
    "typescript": "^5.7.0"
  }
}
```

```jsonc
// packages/types/package.json
{
  "name": "@glimmora/types",
  "version": "0.0.0",
  "private": true,
  "exports": {
    ".": "./src/index.ts"
  },
  "typesVersions": {
    "*": {
      "*": ["./src/index.ts"]
    }
  },
  "devDependencies": {
    "typescript": "^5.7.0"
  }
}
```

**Confidence:** HIGH. Internal package JIT pattern is Turborepo's recommended approach for monorepos where all consumers are your own apps.

---

## Root Workspace Configuration

### pnpm-workspace.yaml

```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

### Root package.json

```jsonc
{
  "name": "glimmora-team",
  "private": true,
  "scripts": {
    "dev": "turbo dev",
    "dev:women": "turbo dev --filter=@glimmora/women-portal",
    "dev:university": "turbo dev --filter=@glimmora/university-portal",
    "dev:enterprise": "turbo dev --filter=@glimmora/enterprise-portal",
    "dev:mentor": "turbo dev --filter=@glimmora/mentor-portal",
    "dev:admin": "turbo dev --filter=@glimmora/admin-panel",
    "build": "turbo build",
    "lint": "turbo lint",
    "type-check": "turbo type-check",
    "test": "turbo test",
    "storybook": "turbo storybook --filter=@glimmora/ui",
    "format": "prettier --write \"**/*.{ts,tsx,md,json}\""
  },
  "devDependencies": {
    "turbo": "^2.8.0",
    "prettier": "^3.4.0"
  },
  "packageManager": "pnpm@9.15.0",
  "engines": {
    "node": ">=20.0.0"
  }
}
```

### .npmrc

```ini
# Strict dependency resolution
shamefully-hoist=false
# Ensure workspace protocol works
link-workspace-packages=true
```

---

## Build Order: What Must Be Done Before What

This is the critical sequencing for Phase 1 (base setup). Each step depends on the previous.

### Layer 0: Root Scaffolding (no dependencies)

```
1. Initialize pnpm workspace
   - pnpm-workspace.yaml
   - Root package.json
   - .npmrc
   - .gitignore
   - turbo.json (initial)

2. Install Turborepo
   - pnpm add -D turbo
```

**Output:** Empty monorepo shell that can run `turbo` commands.

### Layer 1: Configuration Package (no dependencies on other packages)

```
3. Create @glimmora/config
   - packages/config/package.json
   - packages/config/tailwind.config.ts (design tokens)
   - packages/config/typescript/base.json
   - packages/config/typescript/next.json
   - packages/config/typescript/react-library.json
   - packages/config/eslint/base.js
   - packages/config/eslint/next.js
```

**Output:** All shared configs available for other packages to extend.

### Layer 2: Types Package (depends on nothing, but logically follows config)

```
4. Create @glimmora/types
   - packages/types/package.json
   - packages/types/tsconfig.json (extends @glimmora/config)
   - packages/types/src/index.ts
   - packages/types/src/enums.ts (UserRole, TaskStatus, etc.)
   - packages/types/src/user.ts (all role types)
   - packages/types/src/api.ts (ApiResponse, PaginatedResponse)
   - Remaining type files can be added incrementally
```

**Output:** Core types that UI components and apps can import.

### Layer 3: UI Package (depends on @glimmora/config, @glimmora/types)

```
5. Create @glimmora/ui scaffold
   - packages/ui/package.json (with Radix dependencies)
   - packages/ui/tsconfig.json
   - packages/ui/tailwind.config.ts (extends shared config)
   - packages/ui/postcss.config.js
   - packages/ui/src/index.ts (barrel export)
   - packages/ui/src/lib/utils.ts (cn utility with clsx + tailwind-merge)

6. Build foundational UI components (in order):
   a. Button (simplest Radix component -- validates the whole pipeline)
   b. Card, Stack, Grid (layout primitives -- no "use client")
   c. Badge, Separator, StatusBadge (static display)
   d. Dialog, Popover, Tooltip (overlay patterns)
   e. Select, Checkbox, RadioGroup, Switch (form inputs)
   f. Tabs, Accordion (content organization)
   g. FormField (composed: label + input + error)
   h. DataTable (complex: sorting, filtering, pagination)
   i. Sidebar, Topbar (navigation shells)
   j. Stepper (onboarding wizard)
   k. FileUpload (evidence submission)
   l. ResizablePanels (mentor 3-panel layout)
   m. KPICard (gradient dashboard cards)
   n. Toast (notification system)
   o. Skeleton, Spinner (loading states)
   p. PageHeader, PageShell (page structure)

7. Configure Storybook
   - packages/ui/.storybook/main.ts
   - packages/ui/.storybook/preview.tsx
   - packages/ui/src/storybook.css
   - Write stories alongside each component (co-located)
```

**Output:** Working component library with Storybook. This is the longest step in Phase 1.

### Layer 4: First App (depends on all packages)

```
8. Create women-portal (first app -- proves the full pipeline)
   - apps/women-portal/package.json
   - apps/women-portal/next.config.ts (with transpilePackages)
   - apps/women-portal/tailwind.config.ts (extends shared, includes UI content paths)
   - apps/women-portal/postcss.config.js
   - apps/women-portal/tsconfig.json
   - apps/women-portal/src/app/layout.tsx (root layout with all providers)
   - apps/women-portal/src/app/globals.css
   - apps/women-portal/src/providers/ (all providers)

9. Validate the pipeline end-to-end:
   - Import @glimmora/ui components in a page
   - Verify Tailwind design tokens resolve correctly
   - Verify "use client" components render
   - Verify Server Components render
   - Verify MSW intercepts a test endpoint
   - Verify TanStack Query fetches mock data

10. Set up MSW for women-portal
    - Generate mockServiceWorker.js (npx msw init public/)
    - Create handler structure
    - Create MSWProvider
    - Verify mock data renders in a component
```

**Output:** One working portal that proves every architectural assumption.

### Layer 5: Remaining Apps (clone women-portal pattern)

```
11. Create remaining 4 apps (can be parallelized)
    - university-portal
    - enterprise-portal
    - mentor-portal
    - admin-panel
    Each follows the same pattern:
    - Copy women-portal structure
    - Adjust package.json name, port, env vars
    - Create portal-specific route groups
    - Create portal-specific MSW handlers
    - Verify UI imports work
```

**Output:** All 5 apps running, sharing the design system and types.

### Build Order Dependency Graph

```
Layer 0: Root Scaffolding
    |
    v
Layer 1: @glimmora/config
    |
    +---> Layer 2: @glimmora/types
    |         |
    +----+----+
         |
         v
Layer 3: @glimmora/ui + Storybook
         |
         v
Layer 4: women-portal (first app -- full pipeline validation)
         |
         v
Layer 5: university-portal, enterprise-portal, mentor-portal, admin-panel
         (parallelizable)
```

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Shared Layout Components in @glimmora/ui

**What:** Putting portal-specific layouts (e.g., WomenPortalLayout, EnterpriseLayout) in the shared UI package.

**Why bad:** Layouts are portal-specific. They contain portal-specific navigation items, route-specific logic, and role-specific auth checks. Putting them in a shared package creates coupling.

**Instead:** UI package exports layout PRIMITIVES (Sidebar, Topbar, PageShell). Each app composes these into its own layout in `src/app/(app)/layout.tsx`.

### Anti-Pattern 2: One Giant MSW Handler File

**What:** A single `handlers.ts` with hundreds of route handlers for all portals.

**Why bad:** Different portals return different shapes for the same entity. An enterprise requester sees a full Project with budget data; a contributor sees a simplified task assignment. Merging these into one handler file creates unmaintainable conditional logic.

**Instead:** Per-portal handlers in `apps/[portal]/src/mocks/handlers/`. Shared type definitions in `@glimmora/types`. Optional shared factories for common mock data generation.

### Anti-Pattern 3: Importing Between Apps

**What:** `apps/mentor-portal` importing directly from `apps/women-portal`.

**Why bad:** Apps should be independent deployables. Cross-app imports create implicit coupling and break Turborepo's dependency graph.

**Instead:** Any code shared between apps goes into a package (`@glimmora/ui`, `@glimmora/types`, or a new package if needed).

### Anti-Pattern 4: Non-Standard Barrel Exports

**What:** Deep imports like `import { Button } from '@glimmora/ui/src/primitives/button'`.

**Why bad:** Couples consumers to internal file structure. Breaks if you reorganize the package.

**Instead:** Always import from the barrel: `import { Button } from '@glimmora/ui'`. The barrel file (`src/index.ts`) is the public API.

### Anti-Pattern 5: Tailwind Config in @glimmora/ui Without App Content Paths

**What:** Expecting `packages/ui/tailwind.config.ts` to handle all Tailwind processing for all apps.

**Why bad:** Each Next.js app has its own Tailwind build. The UI package's config is only used by Storybook. Apps must configure their OWN content paths to include the UI package source.

**Instead:** Each app's `tailwind.config.ts` extends the shared preset AND includes `../../packages/ui/src/**/*.{ts,tsx}` in its content array.

---

## Scalability Considerations

| Concern | 5 Apps (Now) | 10+ Apps (Future) | Mitigation |
|---------|-------------|-------------------|------------|
| Build time | ~30s total with Turbopack | Could grow linearly | Turborepo remote caching; build only changed apps |
| Dev startup | Run 1-2 apps + Storybook at a time | Same -- never run all 10 simultaneously | `turbo dev --filter=@glimmora/women-portal` |
| UI package size | ~50 components | ~150+ components | Split into sub-packages if needed (`@glimmora/ui-forms`, `@glimmora/ui-data`) |
| Type package size | ~15 type files | ~50+ type files | Already organized by domain; add sub-exports if needed |
| MSW handler count | ~20-30 per portal | Could grow to 100+ per portal | Keep handlers organized by API domain; use factory functions |

---

## Sources and Confidence Assessment

| Claim | Confidence | Source |
|-------|------------|--------|
| Tailwind v4 current version 4.2.1 | HIGH | npm registry (verified 2026-02-26) |
| Tailwind v3 latest is 3.4.19 | HIGH | npm registry (verified 2026-02-26) |
| Next.js 15 latest is 15.5.12 | HIGH | npm registry (verified 2026-02-26) |
| Turborepo latest is 2.8.11 | HIGH | npm registry (verified 2026-02-26) |
| MSW latest is 2.12.10 | HIGH | npm registry (verified 2026-02-26) |
| Storybook latest is 10.2.12 | HIGH | npm registry (verified 2026-02-26) |
| react-resizable-panels latest is 4.6.5 | HIGH | npm registry (verified 2026-02-26) |
| TanStack Query latest is 5.90.21 | HIGH | npm registry (verified 2026-02-26) |
| Zustand latest is 5.0.11 | HIGH | npm registry (verified 2026-02-26) |
| React Hook Form latest is 7.71.2 | HIGH | npm registry (verified 2026-02-26) |
| `transpilePackages` in Next.js | HIGH | Stable since Next.js 13.1, well-established |
| Tailwind v3 preset pattern for monorepos | HIGH | Well-documented in Tailwind docs (training data) |
| Turborepo JIT internal package pattern | HIGH | Turborepo docs recommendation (training data) |
| "use client" boundary strategy | HIGH | Next.js App Router core concept (training data) |
| Storybook 8/10 + @storybook/nextjs config | MEDIUM | Storybook 10.x is latest per npm; exact config may differ from training data. Verify against latest Storybook docs during implementation |
| Tailwind v4 monorepo maturity assessment | MEDIUM | Based on training data about v4 release timeline. v4 may be more mature than assessed -- verify if considering v4 |
| MSW 2.x browser setup pattern in App Router | MEDIUM | Pattern is standard but MSW + App Router has known edge cases with SSR. The `MSWProvider` approach bypasses SSR issues by loading MSW only on client |

---

## Open Questions for Implementation

1. **Storybook version:** npm shows Storybook 10.2.12 as latest. The configuration examples above reference Storybook 8 patterns. Verify Storybook 10 configuration API before implementing. The core concepts (stories, addons, framework) are the same, but config file format may have changed.

2. **Next.js 15 vs 16:** Next.js 16.1.6 is available on npm. The project spec says "14+". Consider whether to use Next.js 15 (stable, well-documented) or Next.js 16 (latest but may have breaking changes from training knowledge). Recommendation: stick with 15.5.x unless there is a specific feature need from 16.

3. **Zustand 5:** Zustand 5.0.11 is the latest. Verify if Zustand 5 has breaking API changes from Zustand 4 (which training data covers well). The `create` function API is likely the same but worth verifying.

4. **Font loading strategy:** Miller Display and Avenir LT Std are commercial fonts. They need to be available as WOFF2 files in `public/fonts/`. Alternatively, use `next/font/local` for optimal loading. Decide during implementation.

5. **Tailwind v3 vs v4 revisited:** If the team is comfortable with v4's CSS-first configuration and has verified monorepo support, v4 could be used. The v3 recommendation is conservative. This decision should be validated early in Layer 1.
