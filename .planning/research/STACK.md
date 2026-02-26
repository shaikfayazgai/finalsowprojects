# Technology Stack

**Project:** GlimmoraTeam -- Multi-Portal Frontend Monorepo
**Researched:** 2026-02-26
**Overall confidence:** HIGH (all versions verified via npm registry)

---

## Version Decision Summary

| Decision Point | Recommendation | Rationale |
|---|---|---|
| Next.js 15 or 16? | **Next.js 15.5.x** | 16 is `latest` on npm but only 4 months old. 15.5.x is battle-tested and `backport`-tagged. Storybook 10 supports both. Upgrade to 16 once the project is past scaffolding. |
| Tailwind 3 or 4? | **Tailwind CSS v4.x** | v4 has been stable since Jan 2025 (13 months). CSS-first config replaces `tailwind.config.js`. PostCSS plugin (`@tailwindcss/postcss`) works with Next.js. Major DX improvement for shared design tokens. |
| Storybook 8 or 10? | **Storybook 10.x** | 10 is `latest`, released Oct 2025, now at 10.2.12. `@storybook/nextjs@10` supports Next.js 14/15/16. Test utilities bundled into main `storybook` package. |
| framer-motion or motion? | **`motion` v12.x** | `motion` is the current package (v12.34.3). `framer-motion` publishes the same version. Use `motion` for new projects -- it is the canonical name going forward. |
| React 18 or 19? | **React 19.x** | Next.js 15.5 supports both React 18 and 19. React 19 is 14+ months old. All libraries in our stack support it. No reason to start a new project on React 18. |
| Package manager? | **pnpm** | Turborepo's recommended package manager for workspaces. Strict dependency isolation prevents phantom dependencies between portal apps. |
| Node.js? | **Node.js 22 LTS** | Current LTS line. All packages in the stack support it. |

---

## Recommended Stack

### Core Framework

| Technology | Version | Purpose | Confidence | Why This Version |
|---|---|---|---|---|
| Next.js | `15.5.12` | App Router portal framework | HIGH | Stable `backport` tag on npm. 15.5.x is the mature line (released Aug 2025, patched through Feb 2026). 16 is only 4 months into its stable cycle -- safer to not be on the bleeding edge for a 5-portal monorepo. |
| React | `19.2.4` | UI runtime | HIGH | Latest stable. All libraries in the stack declare `^19.0.0` peer compatibility. |
| React DOM | `19.2.4` | DOM rendering | HIGH | Must match React version. |
| TypeScript | `5.9.3` | Type safety | HIGH | Latest stable. Required by MSW (`>= 4.8.x`), next-intl (`^5.0.0`). |

### Build Infrastructure

| Technology | Version | Purpose | Confidence | Why This Version |
|---|---|---|---|---|
| Turborepo (`turbo`) | `2.8.11` | Monorepo orchestration, caching, task pipeline | HIGH | Latest stable. No peer dependencies. Provides `turbo.json` pipeline config for cross-workspace builds. |
| pnpm | `10.30.2` | Package manager with workspace support | HIGH | Latest stable. Turborepo works best with pnpm workspaces. Strict hoisting prevents portal A from accidentally importing portal B's dependencies. |
| ESLint | `10.0.2` | Linting | HIGH | Latest stable (ESLint 10 uses flat config by default). |
| eslint-config-next | `15.5.12` | Next.js-specific lint rules | HIGH | Must match Next.js major version. |
| Prettier | `3.8.1` | Code formatting | HIGH | Latest stable. |
| prettier-plugin-tailwindcss | `0.7.2` | Auto-sort Tailwind classes | HIGH | Latest stable. Critical for consistent class ordering across 5 portals. |

### Styling

| Technology | Version | Purpose | Confidence | Why This Version |
|---|---|---|---|---|
| Tailwind CSS | `4.2.1` | Utility-first CSS | HIGH | Latest stable (released Feb 2026). v4 is a full rewrite: CSS-first configuration (no `tailwind.config.js`), uses `@theme` directive in CSS, built-in CSS cascade layers, ~10x faster. Stable for 13+ months. |
| `@tailwindcss/postcss` | `4.2.1` | PostCSS integration for Next.js | HIGH | Next.js uses PostCSS internally. This replaces the old `tailwindcss` PostCSS plugin. Required for v4. |
| class-variance-authority | `0.7.1` | Component variant API (cva) | HIGH | Enables type-safe variant definitions for `@glimmora/ui` components. Works with any CSS approach. |
| clsx | `2.1.1` | Conditional class joining | HIGH | Lightweight, standard utility. Used by cva internally and directly in components. |
| tailwind-merge | `3.5.0` | Merge Tailwind classes without conflicts | HIGH | Ensures overrides work correctly when composing `@glimmora/ui` components with portal-specific classes. |

### UI Primitives

| Technology | Version | Purpose | Confidence | Why This Version |
|---|---|---|---|---|
| @radix-ui/react-dialog | `1.1.15` | Modal dialogs | HIGH | All Radix primitives at v1.x. Unstyled, accessible, composable. |
| @radix-ui/react-select | `2.2.6` | Select dropdowns | HIGH | |
| @radix-ui/react-dropdown-menu | `2.1.16` | Dropdown menus | HIGH | |
| @radix-ui/react-tabs | `1.1.13` | Tab interfaces | HIGH | |
| @radix-ui/react-toast | `1.2.15` | Toast notifications | HIGH | |
| @radix-ui/react-tooltip | `1.2.8` | Tooltips | HIGH | |
| @radix-ui/react-popover | `1.1.15` | Popovers | HIGH | |
| @radix-ui/react-accordion | `1.2.12` | Accordions | HIGH | |
| @radix-ui/react-switch | `1.2.6` | Toggle switches | HIGH | |
| @radix-ui/react-checkbox | `1.3.3` | Checkboxes | HIGH | |
| @radix-ui/react-avatar | `1.1.11` | User avatars | HIGH | |
| @radix-ui/react-alert-dialog | `1.1.15` | Confirmation dialogs | HIGH | |
| @radix-ui/react-navigation-menu | `1.2.14` | Navigation | HIGH | |
| @radix-ui/react-scroll-area | `1.2.10` | Custom scrollbars | HIGH | |
| @radix-ui/react-progress | `1.1.8` | Progress bars | HIGH | |
| @radix-ui/react-separator | `1.1.8` | Visual dividers | HIGH | |
| @radix-ui/react-slot | `1.2.4` | Polymorphic component slots | HIGH | The `asChild` pattern. Critical for `@glimmora/ui` component composition. |
| @radix-ui/react-label | `2.1.8` | Form labels | HIGH | |
| @radix-ui/react-visually-hidden | `1.2.4` | Accessible hidden text | HIGH | |

**Note:** All Radix primitives support React 16/17/18/19. They are unstyled by design -- we apply our own Tailwind-based design system on top. This is NOT shadcn/ui (which pre-applies opinionated styles). We own the styling layer completely.

### State Management

| Technology | Version | Purpose | Confidence | Why This Version |
|---|---|---|---|---|
| @tanstack/react-query | `5.90.21` | Server state (API cache, mutations, optimistic updates) | HIGH | v5 is mature (90+ minor releases). Handles all data fetching. |
| @tanstack/react-query-devtools | `5.91.3` | Query debugging in dev | HIGH | Must match major version of react-query. |
| Zustand | `5.0.11` | Client state (UI state, local preferences) | HIGH | v5 stable. Tiny (~1KB), no boilerplate, works with React 19. Used for state that does NOT come from the API (sidebar open/close, language preference, theme). |

### Forms

| Technology | Version | Purpose | Confidence | Why This Version |
|---|---|---|---|---|
| React Hook Form | `7.71.2` | Form state management | HIGH | v7 is the long-standing stable line. Uncontrolled by default (performant for complex forms like SOW upload). |
| Zod | `4.3.6` | Schema validation | HIGH | v4 stable. Used for form validation schemas AND API type contracts. One schema generates both runtime validation and TypeScript types. |
| @hookform/resolvers | `5.2.2` | Bridges Zod schemas to React Hook Form | HIGH | Latest stable. Provides `zodResolver()`. |

### Animation

| Technology | Version | Purpose | Confidence | Why This Version |
|---|---|---|---|---|
| motion | `12.34.3` | Animation library | HIGH | Formerly `framer-motion`, renamed to `motion`. Same maintainer (Matt Perry), same API. v12 supports React 18/19. Use `motion` for new projects. |

### Internationalization

| Technology | Version | Purpose | Confidence | Why This Version |
|---|---|---|---|---|
| next-intl | `4.8.3` | i18n for Next.js App Router | HIGH | v4 stable. Supports Next.js 12-16. App Router native (middleware-based locale detection, server component support). Critical for language-select-first UX in Women's Portal. |

### Icons

| Technology | Version | Purpose | Confidence | Why This Version |
|---|---|---|---|---|
| Lucide React | `0.575.0` | Icon library | HIGH | MIT-licensed fork of Feather Icons with 1500+ icons. Tree-shakeable. Consistent stroke style. |

### Testing

| Technology | Version | Purpose | Confidence | Why This Version |
|---|---|---|---|---|
| MSW | `2.12.10` | API mocking (browser + node) | HIGH | v2 (complete rewrite from v1). Uses `http.get()` / `http.post()` handler API. Exports `msw/browser` and `msw/node`. See integration notes below. |
| Vitest | `4.0.18` | Unit/integration test runner | HIGH | Vite-native, ESM-first. Faster than Jest for modern stacks. Works with Testing Library. |
| @testing-library/react | `16.3.2` | Component testing | HIGH | Standard for testing React components by user behavior rather than implementation. |
| Storybook | `10.2.12` | Component documentation + visual testing | HIGH | v10 (released Oct 2025). Bundles test utilities at `storybook/test`. `@storybook/nextjs@10.2.12` supports Next.js 14/15/16. |
| @storybook/nextjs | `10.2.12` | Storybook framework adapter for Next.js | HIGH | Handles `next/image`, `next/font`, `next/navigation` mocking automatically. |
| @storybook/addon-a11y | `10.2.12` | Accessibility audit in Storybook | HIGH | Runs axe-core checks on every story. Non-negotiable for a platform serving women contributors with diverse abilities. |
| @storybook/addon-themes | `10.2.12` | Theme/dark-mode switching in Storybook | HIGH | Allows toggling between light/dark/RTL modes in the Storybook toolbar. |

---

## Monorepo Workspace Structure

```
glimmora-team/
  turbo.json                     # Pipeline config
  pnpm-workspace.yaml            # Workspace definitions
  package.json                   # Root scripts + shared devDependencies

  packages/
    ui/                          # @glimmora/ui -- Radix + Tailwind design system
      package.json
      src/
        components/              # Button, Input, Dialog, Card, etc.
        primitives/              # Thin Radix wrappers with Tailwind styling
        tokens/                  # Design tokens as CSS custom properties
      .storybook/                # Storybook config (lives here, documents this package)

    types/                       # @glimmora/types -- Shared TypeScript interfaces
      package.json
      src/
        api/                     # API contract types (become backend handoff)
        domain/                  # Domain models (Project, Deliverable, Skill, etc.)
        ui/                      # Shared component prop types

    config/                      # @glimmora/config -- Shared configuration
      package.json
      tailwind/                  # Shared Tailwind CSS theme file (v4 CSS-based)
      eslint/                    # Shared ESLint flat config
      tsconfig/                  # Shared TSConfig bases

  apps/
    women-portal/                # Next.js app -- Women's contributor portal
    university-portal/           # Next.js app -- Student + Faculty portal
    enterprise-portal/           # Next.js app -- Enterprise requester portal
    mentor-portal/               # Next.js app -- Mentor/reviewer portal
    admin-panel/                 # Next.js app -- Platform admin panel
```

### pnpm-workspace.yaml

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

### Root package.json (scripts)

```json
{
  "name": "glimmora-team",
  "private": true,
  "scripts": {
    "dev": "turbo dev",
    "build": "turbo build",
    "lint": "turbo lint",
    "test": "turbo test",
    "storybook": "turbo storybook",
    "type-check": "turbo type-check",
    "clean": "turbo clean"
  },
  "devDependencies": {
    "turbo": "^2.8.11"
  },
  "packageManager": "pnpm@10.30.2"
}
```

### turbo.json

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^build"]
    },
    "test": {
      "dependsOn": ["^build"]
    },
    "type-check": {
      "dependsOn": ["^build"]
    },
    "storybook": {
      "cache": false,
      "persistent": true
    },
    "clean": {
      "cache": false
    }
  }
}
```

**Why `dependsOn: ["^build"]` for lint/test/type-check:** These tasks in portal apps depend on `@glimmora/ui` and `@glimmora/types` being built first. The `^` means "build my dependencies before running this task." Without this, TypeScript will fail to resolve types from internal packages.

---

## Key Integration Notes

### 1. Tailwind CSS v4 -- CSS-First Configuration (Critical Change)

Tailwind v4 replaces `tailwind.config.js` with CSS-based configuration using `@theme` and `@import` directives. This is a fundamental change from v3.

**Shared theme in `packages/config/tailwind/theme.css`:**

```css
@theme {
  /* Typography */
  --font-serif: "Miller Display", Georgia, serif;
  --font-sans: "Avenir LT Std", system-ui, sans-serif;

  /* Brand Colors */
  --color-primary-50: #f0f4ff;
  --color-primary-100: #dbe4ff;
  --color-primary-500: #4c6ef5;
  --color-primary-600: #3b5bdb;
  --color-primary-700: #364fc7;
  --color-primary-900: #1b2559;

  /* Semantic Colors */
  --color-surface: #ffffff;
  --color-surface-elevated: #f8f9fa;
  --color-text-primary: #1a1a2e;
  --color-text-secondary: #6c757d;
  --color-border: #dee2e6;

  /* Trust & Safety Palette (unique to Glimmora) */
  --color-trust-green: #2b8a3e;
  --color-caution-amber: #e67700;
  --color-privacy-shield: #5c7cfa;

  /* Spacing Scale */
  --spacing-page: 1.5rem;
  --spacing-section: 2rem;

  /* Border Radius */
  --radius-sm: 0.375rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  --radius-full: 9999px;

  /* Breakpoints */
  --breakpoint-sm: 640px;
  --breakpoint-md: 768px;
  --breakpoint-lg: 1024px;
  --breakpoint-xl: 1280px;
}
```

**Each portal's `app/globals.css` imports the shared theme:**

```css
@import "tailwindcss";
@import "@glimmora/config/tailwind/theme.css";

/* Portal-specific overrides (if any) */
```

**Why v4 over v3:** The CSS-first approach is dramatically better for a monorepo with shared design tokens. In v3, sharing a `tailwind.config.js` across workspaces required complex `preset` chains and content path configuration. In v4, it is just a CSS import. One file, zero JavaScript configuration, and every portal inherits the exact same tokens.

### 2. MSW v2 + Next.js App Router Integration

This is the most integration-sensitive piece of the stack. MSW v2 has a completely different API from v1, and Next.js App Router creates specific challenges.

**The core problem:** Next.js App Router renders Server Components on the server and Client Components in the browser. MSW needs to intercept requests in BOTH environments:
- **Browser:** For Client Components making `fetch()` calls via TanStack Query
- **Node.js:** For Server Components making `fetch()` calls during SSR

**Setup architecture:**

```
packages/
  mocks/                         # @glimmora/mocks -- Shared MSW handlers
    package.json
    src/
      handlers/                  # API mock handlers (shared across all portals)
        auth.ts
        projects.ts
        deliverables.ts
        users.ts
      browser.ts                 # Browser worker setup
      node.ts                    # Node.js server setup
      index.ts                   # Re-exports handlers
```

**Handler definition (`packages/mocks/src/handlers/projects.ts`):**

```typescript
import { http, HttpResponse } from 'msw'
import type { Project } from '@glimmora/types'

export const projectHandlers = [
  http.get('/api/projects', () => {
    return HttpResponse.json<Project[]>([
      { id: '1', title: 'SOW Analysis Engine', status: 'active' },
    ])
  }),

  http.post('/api/projects', async ({ request }) => {
    const body = await request.json()
    return HttpResponse.json<Project>(
      { id: '2', ...body, status: 'draft' },
      { status: 201 }
    )
  }),
]
```

**Browser setup (`packages/mocks/src/browser.ts`):**

```typescript
import { setupWorker } from 'msw/browser'
import { handlers } from './handlers'

export const worker = setupWorker(...handlers)
```

**Node setup (`packages/mocks/src/node.ts`):**

```typescript
import { setupServer } from 'msw/node'
import { handlers } from './handlers'

export const server = setupServer(...handlers)
```

**Next.js App Router integration -- the critical pattern:**

In each portal app, create an MSW initialization component that runs ONLY in development:

```typescript
// apps/women-portal/src/components/msw-provider.tsx
'use client'

import { useEffect, useState } from 'react'

export function MSWProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') {
      setReady(true)
      return
    }

    async function init() {
      const { worker } = await import('@glimmora/mocks/browser')
      await worker.start({
        onUnhandledRequest: 'bypass',  // Don't intercept Next.js internal requests
      })
      setReady(true)
    }

    init()
  }, [])

  if (!ready) return null  // Prevent rendering until MSW is ready
  return <>{children}</>
}
```

**Mount in layout.tsx:**

```typescript
// apps/women-portal/src/app/layout.tsx
import { MSWProvider } from '@/components/msw-provider'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        <MSWProvider>
          {children}
        </MSWProvider>
      </body>
    </html>
  )
}
```

**For Server Component mocking (SSR):**

```typescript
// apps/women-portal/src/instrumentation.ts
// Next.js instrumentation hook -- runs once on server startup
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs' && process.env.NODE_ENV === 'development') {
    const { server } = await import('@glimmora/mocks/node')
    server.listen({ onUnhandledRequest: 'bypass' })
  }
}
```

**Critical MSW caveats for Next.js App Router:**

1. **Service worker file:** Run `npx msw init public/` in each portal app to generate `mockServiceWorker.js`. This file must be in each app's `public/` directory.
2. **`onUnhandledRequest: 'bypass'`** is essential -- Next.js makes many internal requests (HMR, RSC payloads, static assets) that MSW should NOT intercept.
3. **Conditional loading:** MSW must ONLY load in development. Use dynamic `import()` behind `process.env.NODE_ENV` checks. Next.js will tree-shake these in production builds.
4. **The `instrumentation.ts` hook** is the official Next.js way to run setup code once on server startup. This is how we initialize MSW for Server Component data fetching.
5. **`useState` guard:** The `MSWProvider` must block rendering until the worker is started, otherwise Client Components may fire requests before MSW intercepts them.

### 3. Storybook 10 + Next.js + Tailwind + Monorepo Integration

**Architecture decision:** Storybook lives in `packages/ui/`, NOT in each portal app. It documents the shared design system. Portal-specific pages are tested with Vitest + Testing Library, not Storybook.

**Storybook config (`packages/ui/.storybook/main.ts`):**

```typescript
import type { StorybookConfig } from '@storybook/nextjs'

const config: StorybookConfig = {
  framework: '@storybook/nextjs',
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  addons: [
    '@storybook/addon-a11y',
    '@storybook/addon-themes',
  ],
  // Storybook 10 bundles essentials (controls, actions, viewport) into the
  // main `storybook` package. No need for @storybook/addon-essentials.
}

export default config
```

**Tailwind in Storybook -- the preview CSS import (`packages/ui/.storybook/preview.ts`):**

```typescript
import type { Preview } from '@storybook/react'
import '../src/styles/globals.css'  // This file imports Tailwind + shared theme

const preview: Preview = {
  parameters: {
    controls: { expanded: true },
  },
}

export default preview
```

**The CSS file (`packages/ui/src/styles/globals.css`):**

```css
@import "tailwindcss";
@import "@glimmora/config/tailwind/theme.css";
```

**Key Storybook 10 changes from Storybook 8:**
- `@storybook/addon-essentials` is gone -- controls, actions, viewport, docs are built into the `storybook` package
- Test utilities are at `storybook/test` (not `@storybook/test`)
- Interaction testing uses `storybook/test` imports:
  ```typescript
  import { expect, fn, userEvent, within } from 'storybook/test'
  ```

**Storybook + Radix component story example:**

```typescript
// packages/ui/src/components/Button/Button.stories.tsx
import type { Meta, StoryObj } from '@storybook/react'
import { expect, userEvent, within } from 'storybook/test'
import { Button } from './Button'

const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'ghost', 'danger'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
  },
}

export default meta
type Story = StoryObj<typeof Button>

export const Primary: Story = {
  args: {
    variant: 'primary',
    children: 'Submit Deliverable',
  },
}

export const WithInteraction: Story = {
  args: {
    variant: 'primary',
    children: 'Click me',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const button = canvas.getByRole('button')
    await userEvent.click(button)
    await expect(button).toHaveFocus()
  },
}
```

### 4. Custom Font Loading Strategy (Miller Display + Avenir LT Std)

**The constraint:** Miller Display and Avenir LT Std are commercial/licensed fonts -- NOT available via Google Fonts. They must be self-hosted.

**Step 1: Font files in a shared package**

```
packages/
  config/
    fonts/
      miller-display/
        MillerDisplay-Regular.woff2
        MillerDisplay-Bold.woff2
        MillerDisplay-Italic.woff2
      avenir-lt-std/
        AvenirLTStd-Book.woff2
        AvenirLTStd-Medium.woff2
        AvenirLTStd-Heavy.woff2
        AvenirLTStd-Light.woff2
```

**Step 2: Use `next/font/local` for each portal**

Next.js `next/font` handles automatic font optimization (preloading, `font-display: swap`, eliminating layout shift). For custom (non-Google) fonts, use `next/font/local`.

```typescript
// packages/config/src/fonts.ts
// NOTE: next/font/local must be called at the module scope of a layout or page.
// This file exports the configuration, but the actual font declarations
// must live in each portal's layout.tsx.

export const millerDisplayConfig = {
  src: [
    { path: './fonts/miller-display/MillerDisplay-Regular.woff2', weight: '400', style: 'normal' },
    { path: './fonts/miller-display/MillerDisplay-Bold.woff2', weight: '700', style: 'normal' },
    { path: './fonts/miller-display/MillerDisplay-Italic.woff2', weight: '400', style: 'italic' },
  ],
  variable: '--font-miller-display',
  display: 'swap' as const,
}

export const avenirConfig = {
  src: [
    { path: './fonts/avenir-lt-std/AvenirLTStd-Light.woff2', weight: '300', style: 'normal' },
    { path: './fonts/avenir-lt-std/AvenirLTStd-Book.woff2', weight: '400', style: 'normal' },
    { path: './fonts/avenir-lt-std/AvenirLTStd-Medium.woff2', weight: '500', style: 'normal' },
    { path: './fonts/avenir-lt-std/AvenirLTStd-Heavy.woff2', weight: '800', style: 'normal' },
  ],
  variable: '--font-avenir',
  display: 'swap' as const,
}
```

**Step 3: Declare fonts in each portal's root layout**

```typescript
// apps/women-portal/src/app/layout.tsx
import localFont from 'next/font/local'

const millerDisplay = localFont({
  src: [
    { path: '../../../packages/config/fonts/miller-display/MillerDisplay-Regular.woff2', weight: '400', style: 'normal' },
    { path: '../../../packages/config/fonts/miller-display/MillerDisplay-Bold.woff2', weight: '700', style: 'normal' },
  ],
  variable: '--font-miller-display',
  display: 'swap',
})

const avenir = localFont({
  src: [
    { path: '../../../packages/config/fonts/avenir-lt-std/AvenirLTStd-Book.woff2', weight: '400', style: 'normal' },
    { path: '../../../packages/config/fonts/avenir-lt-std/AvenirLTStd-Medium.woff2', weight: '500', style: 'normal' },
    { path: '../../../packages/config/fonts/avenir-lt-std/AvenirLTStd-Heavy.woff2', weight: '800', style: 'normal' },
  ],
  variable: '--font-avenir',
  display: 'swap',
})

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html className={`${millerDisplay.variable} ${avenir.variable}`}>
      <body className="font-sans">
        {children}
      </body>
    </html>
  )
}
```

**Step 4: Connect to Tailwind v4 theme**

In the shared theme CSS (`packages/config/tailwind/theme.css`):

```css
@theme {
  --font-serif: var(--font-miller-display), Georgia, serif;
  --font-sans: var(--font-avenir), system-ui, sans-serif;
}
```

Then in components: `className="font-serif"` renders Miller Display, `className="font-sans"` renders Avenir.

**Step 5: Fonts in Storybook**

Storybook's `@storybook/nextjs` framework handles `next/font` automatically -- it mocks the font loading and applies the CSS variables. However, for visual fidelity in Storybook, you should also load the actual font files in the Storybook preview:

```css
/* packages/ui/.storybook/fonts.css */
@font-face {
  font-family: "Miller Display";
  src: url("../../../packages/config/fonts/miller-display/MillerDisplay-Regular.woff2") format("woff2");
  font-weight: 400;
  font-display: swap;
}

@font-face {
  font-family: "Avenir LT Std";
  src: url("../../../packages/config/fonts/avenir-lt-std/AvenirLTStd-Book.woff2") format("woff2");
  font-weight: 400;
  font-display: swap;
}

/* Add more weights as needed */
```

Import in `.storybook/preview.ts`:
```typescript
import './fonts.css'
import '../src/styles/globals.css'
```

**Important font caveats:**
- **WOFF2 only.** Do not include WOFF, TTF, or OTF. WOFF2 has 97%+ browser support and is 30% smaller.
- **`font-display: swap`** prevents invisible text during load (critical for the 72-hour activation experience in Women's Portal).
- **`next/font/local` path resolution:** Paths are relative to the file where `localFont()` is called, NOT relative to the project root. This is a common gotcha in monorepos.
- **License:** Ensure the font license permits web embedding. Miller Display requires a web license from Carter & Cone. Avenir LT Std requires a license from Linotype/Monotype.

### 5. Shared Package Configuration

**`packages/ui/package.json`:**

```json
{
  "name": "@glimmora/ui",
  "version": "0.0.0",
  "private": true,
  "exports": {
    ".": "./src/index.ts",
    "./styles": "./src/styles/globals.css"
  },
  "scripts": {
    "build": "tsc --build",
    "storybook": "storybook dev -p 6006",
    "build-storybook": "storybook build",
    "lint": "eslint src/",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "@radix-ui/react-dialog": "^1.1.15",
    "@radix-ui/react-select": "^2.2.6",
    "@radix-ui/react-slot": "^1.2.4",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "tailwind-merge": "^3.5.0",
    "motion": "^12.34.3",
    "lucide-react": "^0.575.0"
  },
  "peerDependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "storybook": "^10.2.12",
    "@storybook/nextjs": "^10.2.12",
    "@storybook/addon-a11y": "^10.2.12",
    "@storybook/addon-themes": "^10.2.12",
    "@glimmora/config": "workspace:*",
    "typescript": "^5.9.3"
  }
}
```

**`packages/types/package.json`:**

```json
{
  "name": "@glimmora/types",
  "version": "0.0.0",
  "private": true,
  "exports": {
    ".": "./src/index.ts",
    "./api": "./src/api/index.ts",
    "./domain": "./src/domain/index.ts"
  },
  "scripts": {
    "build": "tsc --build",
    "type-check": "tsc --noEmit"
  },
  "devDependencies": {
    "typescript": "^5.9.3",
    "@glimmora/config": "workspace:*"
  }
}
```

**`packages/config/package.json`:**

```json
{
  "name": "@glimmora/config",
  "version": "0.0.0",
  "private": true,
  "exports": {
    "./tailwind/theme": "./tailwind/theme.css",
    "./eslint": "./eslint/index.js",
    "./tsconfig/base": "./tsconfig/base.json",
    "./tsconfig/nextjs": "./tsconfig/nextjs.json"
  }
}
```

**Each portal app's `package.json` references shared packages:**

```json
{
  "name": "@glimmora/women-portal",
  "dependencies": {
    "@glimmora/ui": "workspace:*",
    "@glimmora/types": "workspace:*",
    "@glimmora/config": "workspace:*",
    "next": "^15.5.12",
    "react": "^19.2.4",
    "react-dom": "^19.2.4",
    "@tanstack/react-query": "^5.90.21",
    "zustand": "^5.0.11",
    "react-hook-form": "^7.71.2",
    "zod": "^4.3.6",
    "@hookform/resolvers": "^5.2.2",
    "next-intl": "^4.8.3"
  }
}
```

### 6. Internal Package Transpilation in Next.js

Next.js needs to know about internal monorepo packages to transpile them correctly.

**`next.config.ts` in each portal app:**

```typescript
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: ['@glimmora/ui', '@glimmora/types'],

  experimental: {
    instrumentationHook: true,  // Required for MSW server-side setup
  },
}

export default nextConfig
```

**Why `transpilePackages`:** Internal packages export raw TypeScript (`.ts` files, not pre-compiled `.js`). `transpilePackages` tells Next.js to run its compiler on these packages. Without this, you get "unexpected token" errors because Next.js tries to serve raw TypeScript to the browser.

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|---|---|---|---|
| Framework | Next.js 15.5 | Next.js 16 | 16 is `latest` on npm but only 4 months old. For a 5-portal monorepo, stability > bleeding edge. Upgrade path is straightforward once 16.x matures. |
| Framework | Next.js 15.5 | Remix / Tanstack Start | Next.js has the deepest monorepo support, the `next/font` system, and the most mature Storybook integration. Remix is excellent but adds friction for multi-app monorepos. |
| Styling | Tailwind v4 | Tailwind v3 | v3 is EOL (last release 3.4.19 in Dec 2025). v4 has been stable for 13 months. CSS-first config is dramatically simpler for monorepo shared themes. |
| Styling | Tailwind v4 | CSS Modules | Utility-first is better for a shared design system consumed by 5 portals. CSS Modules create per-component isolation but poor cross-portal consistency. |
| UI Primitives | Radix UI (unstyled) | shadcn/ui | shadcn pre-applies opinionated Tailwind styles. We need complete control over styling for the Glimmora brand. Radix primitives give us accessible behavior without visual opinions. |
| State (server) | TanStack Query | SWR | TanStack Query v5 has mutations, optimistic updates, infinite queries, and devtools. SWR is simpler but lacks mutation primitives needed for SOW submission, deliverable upload, payment flows. |
| State (client) | Zustand | Jotai / Redux | Zustand is simpler than Redux (no action types, no reducers). Jotai is atomic but adds complexity for the small amount of client state we need. Zustand's `create()` is sufficient. |
| Forms | React Hook Form | Formik | RHF is uncontrolled by default (better performance for large forms like SOW upload). Formik re-renders on every keystroke. |
| Validation | Zod v4 | Yup / Valibot | Zod v4 has TypeScript-first inference. One schema = runtime validation + static types. Yup is older and less TypeScript-ergonomic. Valibot is newer but smaller ecosystem. |
| Animation | motion | React Spring | motion has the best declarative API for layout animations (AnimatePresence, layout prop). React Spring is more physics-based, harder to use for UI transitions. |
| Icons | Lucide | Heroicons / Phosphor | Lucide has 1500+ icons, MIT license, tree-shakeable. Heroicons has fewer icons. Phosphor is excellent but less adopted in the React ecosystem. |
| Testing | Vitest | Jest | Vitest is ESM-native, faster for modern stacks, and uses the same config format as Vite (which Storybook uses internally). Jest requires more configuration for ESM. |
| i18n | next-intl | react-intl / i18next | next-intl is purpose-built for Next.js App Router. It handles server components, middleware locale detection, and ISR natively. Generic i18n libraries require more glue code. |
| Storybook | 10 | 8 | 10 is the current `latest`. 8 is still actively patched (8.6.17) but 10 has better bundling and folded essentials into the core package. |
| Package Manager | pnpm | npm / yarn | pnpm's strict hoisting prevents phantom dependencies -- critical in a monorepo where portal A must not accidentally import portal B's dependency. |

---

## Installation Commands

**Bootstrap the monorepo:**

```bash
# Initialize pnpm workspace
pnpm init

# Install Turborepo at root
pnpm add -Dw turbo

# Create workspace structure
mkdir -p packages/{ui,types,config} apps/{women-portal,university-portal,enterprise-portal,mentor-portal,admin-panel}
```

**Per portal app:**

```bash
# Core
pnpm add next@^15.5.12 react@^19.2.4 react-dom@^19.2.4

# State + Data
pnpm add @tanstack/react-query@^5.90.21 zustand@^5.0.11

# Forms
pnpm add react-hook-form@^7.71.2 zod@^4.3.6 @hookform/resolvers@^5.2.2

# i18n
pnpm add next-intl@^4.8.3

# Dev
pnpm add -D typescript@^5.9.3 @types/react@latest @types/react-dom@latest
pnpm add -D msw@^2.12.10 vitest@^4.0.18 @testing-library/react@^16.3.2
```

**`packages/ui` (design system):**

```bash
# Radix Primitives (install as needed -- start with core set)
pnpm add @radix-ui/react-dialog @radix-ui/react-select @radix-ui/react-dropdown-menu \
  @radix-ui/react-tabs @radix-ui/react-tooltip @radix-ui/react-popover \
  @radix-ui/react-switch @radix-ui/react-checkbox @radix-ui/react-slot \
  @radix-ui/react-label @radix-ui/react-separator @radix-ui/react-scroll-area \
  @radix-ui/react-avatar @radix-ui/react-progress @radix-ui/react-alert-dialog \
  @radix-ui/react-toast @radix-ui/react-accordion @radix-ui/react-navigation-menu \
  @radix-ui/react-visually-hidden

# Styling utilities
pnpm add class-variance-authority clsx tailwind-merge

# Animation
pnpm add motion

# Icons
pnpm add lucide-react

# Storybook (dev)
pnpm add -D storybook@^10.2.12 @storybook/nextjs@^10.2.12 \
  @storybook/addon-a11y@^10.2.12 @storybook/addon-themes@^10.2.12
```

**`packages/config` (shared config):**

```bash
# Tailwind + PostCSS
pnpm add tailwindcss@^4.2.1 @tailwindcss/postcss@^4.2.1

# Formatting
pnpm add -D prettier@^3.8.1 prettier-plugin-tailwindcss@^0.7.2

# Linting
pnpm add -D eslint@^10.0.2 eslint-config-next@^15.5.12
```

---

## Sources and Verification

All version numbers verified directly from the npm registry (`npm view <package> version`) on 2026-02-26. Release dates verified from `npm view <package> time`. Peer dependency compatibility verified from `npm info <package> peerDependencies`.

| Claim | Source | Confidence |
|---|---|---|
| Next.js 16.1.6 is `latest`, 15.5.12 is `backport` | npm dist-tags | HIGH |
| Next.js 16 released Oct 2025 | npm time field | HIGH |
| Storybook 10 released Oct 2025, at 10.2.12 | npm time + version | HIGH |
| Storybook 10 `@storybook/nextjs` supports Next 14/15/16 | npm peerDependencies | HIGH |
| Tailwind v4 stable since Jan 2025 | npm time (4.0.0: 2025-01-21) | HIGH |
| Tailwind v4 uses CSS-first config | npm exports (index.css, theme.css) | HIGH |
| `motion` v12.34.3 = same as `framer-motion` v12.34.3 | npm version comparison | HIGH |
| MSW v2 exports `msw/browser` and `msw/node` | npm exports field | HIGH |
| All Radix primitives support React 19 | npm peerDependencies | HIGH |
| MSW + Next.js App Router integration pattern | MEDIUM -- based on MSW v2 architecture + Next.js `instrumentation.ts` hook. Specific `onUnhandledRequest: 'bypass'` pattern is well-established but exact code should be validated during implementation. |
| `next/font/local` path resolution in monorepos | MEDIUM -- known behavior but relative paths from layout files to shared font packages need validation during scaffolding. |
| Storybook 10 essentials bundled in main package | HIGH -- confirmed by `storybook@10.2.12` exports including `./test`, `./actions`, `./viewport` |
