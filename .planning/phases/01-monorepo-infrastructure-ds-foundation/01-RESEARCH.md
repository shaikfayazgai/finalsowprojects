# Phase 1: Monorepo Infrastructure + Design System Foundation - Research

**Researched:** 2026-02-26
**Domain:** Turborepo monorepo, Tailwind CSS v4, Radix UI, MSW v2, Storybook 10, Next.js 15.5, TanStack Query v5, Zustand v5
**Confidence:** HIGH (versions verified via npm registry; integration patterns verified via official docs and WebSearch)

## Summary

This research covers the complete technology stack and integration patterns needed to scaffold a Turborepo monorepo with 5 Next.js 15.5 portal apps sharing a Radix-based design system (`@glimmora/ui`), TypeScript contracts (`@glimmora/types`), and configuration (`@glimmora/config`). The research resolves 9 specific integration questions, each with verified code patterns.

The critical integration points are: (1) Tailwind v4's CSS-first `@theme` config with `@source` directives for monorepo class scanning, (2) MSW v2 dual-runtime initialization using both `instrumentation.ts` (server) and an `MSWProvider` client component (browser), (3) Storybook 10's ESM-only configuration with built-in essentials, (4) the `radix-ui` unified package as a cleaner alternative to individual `@radix-ui/react-*` packages, and (5) `next/font/local` requiring font declarations in each portal's layout.tsx with relative paths to a shared font directory.

**Primary recommendation:** Follow the build order -- root scaffold with Turborepo + pnpm, then `@glimmora/config` (Tailwind theme + ESLint + TSConfig), then `@glimmora/types`, then `@glimmora/ui` + Storybook, then one portal canary, then remaining 4 portals. Each layer validates the previous before proceeding.

## Standard Stack

All versions verified via npm registry on 2026-02-26.

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | `15.5.12` | App Router portal framework | Stable `backport` tag. 15.5.x is mature (Aug 2025+). |
| React | `19.2.4` | UI runtime | Latest stable. All stack libraries support it. |
| TypeScript | `5.9.3` | Type safety | Latest stable. Required by all packages. |
| Turborepo (`turbo`) | `2.8.11` | Monorepo orchestration + caching | Latest stable. Recommended with pnpm workspaces. |
| pnpm | `10.30.2` | Package manager | Strict hoisting prevents phantom deps in monorepo. |
| Tailwind CSS | `4.2.1` | CSS-first utility framework | Stable 13+ months. `@theme` directive enables shared tokens via CSS imports. |
| `@tailwindcss/postcss` | `4.2.1` | PostCSS integration for Next.js + Storybook | Required for Tailwind v4 with PostCSS-based tooling. |
| `radix-ui` | `1.4.3` | Unified accessible UI primitives | New unified package. Tree-shakeable. Replaces individual `@radix-ui/react-*` packages. |
| Storybook | `10.2.12` | Component documentation + visual testing | ESM-only. Essentials built-in. `@storybook/nextjs` supports Next.js 14/15/16. |
| MSW | `2.12.10` | API mocking (browser + node) | Dual-runtime `msw/browser` + `msw/node`. |
| `@tanstack/react-query` | `5.90.21` | Server state management | Mature v5 (90+ minors). Handles data fetching + caching. |
| Zustand | `5.0.11` | Client state management | v5 stable. ~1KB. Works with React 19. |
| `motion` | `12.34.3` | Animation library | Renamed from framer-motion. Import from `motion/react`. |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `class-variance-authority` | `0.7.1` | Type-safe component variant API (cva) | Every `@glimmora/ui` component with variants |
| `clsx` | `2.1.1` | Conditional class joining | Combining conditional classes |
| `tailwind-merge` | `3.5.0` | Merge Tailwind classes without conflicts | Composing UI components with overridable styles |
| `lucide-react` | `0.575.0` | Icon library (1500+ icons) | All icon usage across portals |
| `react-hook-form` | `7.71.2` | Form state management | All form pages |
| `zod` | `4.3.6` | Schema validation | Form validation + type contracts |
| `@hookform/resolvers` | `5.2.2` | Bridges Zod to React Hook Form | `zodResolver()` in forms |
| ESLint | `10.0.2` | Linting | Flat config only (eslintrc removed). |
| `eslint-config-next` | `15.5.12` | Next.js-specific lint rules | Must match Next.js major version. |
| Prettier | `3.8.1` | Code formatting | Consistent formatting across 5 portals. |
| `prettier-plugin-tailwindcss` | `0.7.2` | Auto-sort Tailwind classes | Critical for class ordering consistency. |
| `@storybook/addon-a11y` | `10.2.12` | Accessibility audit in Storybook | axe-core checks on every story. |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `radix-ui` unified | Individual `@radix-ui/react-*` packages | Either works. Unified is cleaner in package.json. Individual gives finer version control. |
| Tailwind v4 CSS-first | Tailwind v3 preset pattern | v3 is EOL. v4 `@theme` + `@source` is simpler for monorepo shared tokens. |
| MSWProvider component | `instrumentation-client.ts` for browser MSW | `instrumentation-client.ts` (introduced Next.js 15.3) has race conditions with service worker init. MSWProvider is proven safe. |
| ESLint 10 | ESLint 9 | ESLint 10 locates config from linted file dir (better for monorepo). eslintrc fully removed. |

**Installation:**

```bash
# Root
pnpm add -Dw turbo

# packages/config
pnpm add tailwindcss@^4.2.1 @tailwindcss/postcss@^4.2.1
pnpm add -D eslint@^10.0.2 eslint-config-next@^15.5.12 prettier@^3.8.1 prettier-plugin-tailwindcss@^0.7.2

# packages/ui
pnpm add radix-ui class-variance-authority clsx tailwind-merge motion lucide-react
pnpm add -D storybook@^10.2.12 @storybook/nextjs@^10.2.12 @storybook/addon-a11y@^10.2.12

# Each portal app
pnpm add next@^15.5.12 react@^19.2.4 react-dom@^19.2.4
pnpm add @tanstack/react-query@^5.90.21 zustand@^5.0.11
pnpm add react-hook-form@^7.71.2 zod@^4.3.6 @hookform/resolvers@^5.2.2
pnpm add -D typescript@^5.9.3 msw@^2.12.10
```

## Architecture Patterns

### Recommended Project Structure

```
glimmora-team/
  turbo.json
  pnpm-workspace.yaml
  package.json
  postcss.config.mjs           # Root PostCSS (shared or per-app)

  packages/
    config/                     # @glimmora/config
      package.json
      tailwind/
        theme.css               # @theme tokens (THE source of truth)
      eslint/
        base.js                 # Shared ESLint flat config
      tsconfig/
        base.json               # Base TypeScript config
        nextjs.json             # Next.js-specific extends base
      fonts/
        miller-display/
          MillerDisplay-Regular.woff2
          MillerDisplay-Bold.woff2
        avenir-lt-std/
          AvenirLTStd-Book.woff2
          AvenirLTStd-Medium.woff2
          AvenirLTStd-Heavy.woff2

    types/                      # @glimmora/types
      package.json
      src/
        index.ts                # Barrel export
        domain/                 # UserRole, Task, Project, SOW, etc.
        api/                    # APIResponse wrapper, endpoint types

    ui/                         # @glimmora/ui
      package.json
      postcss.config.mjs        # PostCSS for Storybook
      src/
        styles/
          globals.css            # @import "tailwindcss" + @source + @theme import
        components/
          button/
            button.tsx           # "use client" at top
            button.stories.tsx
            index.ts             # Re-export
          input/
          select/
          ...
        lib/
          utils.ts               # cn() helper (clsx + tailwind-merge)
        index.ts                 # Barrel export (NO "use client" here)
      .storybook/
        main.ts
        preview.ts

  apps/
    women-portal/               # @glimmora/women-portal
    university-portal/          # @glimmora/university-portal
    enterprise-portal/          # @glimmora/enterprise-portal
    mentor-portal/              # @glimmora/mentor-portal
    admin-panel/                # @glimmora/admin-panel
```

### Pattern 1: pnpm-workspace.yaml + turbo.json

**What:** Monorepo workspace and pipeline configuration.

```yaml
# pnpm-workspace.yaml
packages:
  - "apps/*"
  - "packages/*"
```

```json
// turbo.json
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

```json
// Root package.json
{
  "name": "glimmora-team",
  "private": true,
  "scripts": {
    "dev": "turbo dev",
    "build": "turbo build",
    "lint": "turbo lint",
    "type-check": "turbo type-check",
    "storybook": "turbo storybook",
    "clean": "turbo clean"
  },
  "devDependencies": {
    "turbo": "^2.8.11"
  },
  "packageManager": "pnpm@10.30.2"
}
```

**Why `dependsOn: ["^build"]` for lint/type-check:** Portal apps depend on `@glimmora/ui` and `@glimmora/types` being compiled first. The `^` prefix means "build dependencies before running this task."

### Pattern 2: Tailwind v4 @theme Shared Design Tokens (HIGH confidence)

**What:** CSS-first design token sharing across monorepo packages.
**Source:** Official Tailwind v4 docs + Turborepo Tailwind guide

The shared theme file defines ALL brand tokens using `@theme`. Consuming apps and Storybook import this file.

```css
/* packages/config/tailwind/theme.css */
@theme {
  /* === Typography === */
  --font-serif: var(--font-miller-display), Georgia, serif;
  --font-sans: var(--font-avenir), system-ui, sans-serif;

  --text-xs: 0.75rem;
  --text-sm: 0.875rem;
  --text-base: 1rem;
  --text-lg: 1.125rem;
  --text-xl: 1.25rem;
  --text-2xl: 1.5rem;
  --text-3xl: 1.875rem;
  --text-4xl: 2.25rem;

  --font-weight-light: 300;
  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-bold: 700;
  --font-weight-heavy: 800;

  --leading-tight: 1.25;
  --leading-normal: 1.5;
  --leading-relaxed: 1.625;

  /* === Brand Colors === */
  --color-primary: #A0614A;       /* terracotta */
  --color-sand: #C9A882;
  --color-forest: #4A6741;
  --color-teal: #3A8FA0;
  --color-gold: #C4A23A;

  /* === Semantic Surface Colors === */
  --color-surface: #FAF7F4;        /* app background */
  --color-surface-card: #FFFFFF;    /* card background */
  --color-border-warm: #EAD9CC;     /* warm border */

  /* === Text Colors === */
  --color-espresso: #2C1F1A;       /* heading text */
  --color-cocoa: #6B4C3B;          /* body text */

  /* === Feedback Colors === */
  --color-success: #4A6741;
  --color-warning: #C4A23A;
  --color-error: #C0392B;
  --color-info: #3A8FA0;

  /* === Shadows === */
  --shadow-sm: 0 1px 4px rgba(44, 31, 26, 0.06);
  --shadow-md: 0 2px 8px rgba(44, 31, 26, 0.08);
  --shadow-lg: 0 4px 16px rgba(44, 31, 26, 0.12);

  /* === Border Radius === */
  --radius-sm: 6px;               /* badges */
  --radius-md: 8px;               /* inner elements */
  --radius-lg: 12px;              /* cards */
  --radius-full: 9999px;          /* pills */

  /* === Breakpoints === */
  --breakpoint-sm: 640px;
  --breakpoint-md: 768px;
  --breakpoint-lg: 1024px;
  --breakpoint-xl: 1280px;
}
```

This generates utility classes like `bg-primary`, `text-espresso`, `border-sand`, `rounded-lg`, `shadow-md`, `font-serif`, `font-sans`, etc.

**Consuming app globals.css:**

```css
/* apps/women-portal/src/app/globals.css */
@import "tailwindcss";
@import "@glimmora/config/tailwind/theme.css";
@source "../../packages/ui/src/**/*.{ts,tsx}";
```

**Critical: The `@source` directive tells Tailwind to scan `@glimmora/ui` source files for class usage.** Without this, Tailwind will not generate classes used only in the UI package.

### Pattern 3: @source Directive for Monorepo Class Scanning (HIGH confidence)

**What:** Tailwind v4 does not scan `node_modules` or parent directories by default. The `@source` directive explicitly tells Tailwind which directories to scan for utility class usage.
**Source:** Official Tailwind docs + tailwindlabs/tailwindcss#13136

```css
/* In each portal's globals.css */
@import "tailwindcss";
@import "@glimmora/config/tailwind/theme.css";

/* Tell Tailwind to scan UI package source for class names */
@source "../../packages/ui/src/**/*.{ts,tsx}";
```

**Alternative using `source(none)` for explicit control:**

```css
@import "tailwindcss" source(none);
@import "@glimmora/config/tailwind/theme.css";

/* Explicitly register all source directories */
@source "./app/**/*.{ts,tsx}";
@source "./components/**/*.{ts,tsx}";
@source "../../packages/ui/src/**/*.{ts,tsx}";
```

**Important:** The `@source` path is relative to the CSS file location, not the project root. From `apps/women-portal/src/app/globals.css`, the path to `packages/ui/src/` is `../../../../packages/ui/src/` (or if globals.css is at app root, `../../packages/ui/src/`). Verify the exact depth during implementation.

### Pattern 4: Radix "use client" Boundary (HIGH confidence)

**What:** Each Radix-based component file gets `"use client"` at the top. The barrel export does NOT.
**Why:** Next.js App Router treats files without `"use client"` as server components. Radix primitives use React context, refs, and state -- all client-only. The barrel export should remain a plain re-export so tree-shaking works.

```tsx
// packages/ui/src/components/button/button.tsx
"use client";

import { Slot } from "radix-ui";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md font-sans font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-primary text-white hover:bg-primary/90",
        secondary: "bg-sand text-espresso hover:bg-sand/80",
        ghost: "hover:bg-surface hover:text-espresso",
        destructive: "bg-error text-white hover:bg-error/90",
      },
      size: {
        sm: "h-8 px-3 text-sm",
        md: "h-10 px-4 text-base",
        lg: "h-12 px-6 text-lg",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

export function Button({
  className,
  variant,
  size,
  asChild = false,
  loading = false,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <span className="animate-spin mr-2">...</span> : null}
      {children}
    </Comp>
  );
}

export { buttonVariants };
```

```tsx
// packages/ui/src/components/button/index.ts
// NO "use client" here -- just re-export
export { Button, buttonVariants } from "./button";
```

```tsx
// packages/ui/src/index.ts
// Barrel export -- NO "use client" here
export { Button, buttonVariants } from "./components/button";
export { Input } from "./components/input";
export { Select } from "./components/select";
// ... etc
```

**Why this works:** When a Next.js server component imports `Button` from `@glimmora/ui`, the import chain goes: `index.ts` -> `button/index.ts` -> `button.tsx` (which has `"use client"`). Next.js sees the `"use client"` boundary at the leaf file and knows to render `Button` as a client component. The barrel exports remain server-compatible for tree-shaking.

### Pattern 5: Unified radix-ui Package (HIGH confidence)

**What:** Use the single `radix-ui` package instead of individual `@radix-ui/react-*` packages.
**Source:** npm registry (radix-ui@1.4.3)

```tsx
// Instead of:
import * as DialogPrimitive from "@radix-ui/react-dialog";
import * as SelectPrimitive from "@radix-ui/react-select";

// Use:
import { Dialog, Select, Tooltip, Switch, Checkbox } from "radix-ui";

// Then use as:
<Dialog.Root>
  <Dialog.Trigger>Open</Dialog.Trigger>
  <Dialog.Portal>
    <Dialog.Overlay />
    <Dialog.Content>...</Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>
```

The package is tree-shakeable -- only imported components are bundled. Peer dependencies: `react ^16.8-19`, `react-dom ^16.8-19`.

**Decision point:** The unified `radix-ui` package OR individual `@radix-ui/react-*` packages both work. The unified package is cleaner (1 dependency vs 15+). Individual packages give finer version control. **Recommendation: Use unified `radix-ui` for cleaner setup.** If a specific primitive has a bug, you can always pin that one individually.

### Pattern 6: MSW v2 Dual-Runtime Setup (HIGH confidence)

**What:** MSW must intercept requests in BOTH browser (client components via TanStack Query) and Node.js (server components during SSR). This requires two separate initialization paths.
**Source:** MSW official examples + community verification

**Shared handlers:**

```typescript
// Handlers can live in each app or in a shared location
// apps/women-portal/src/mocks/handlers.ts
import { http, HttpResponse } from "msw";
import type { Task, APIResponse } from "@glimmora/types";

export const handlers = [
  http.get("/api/tasks", () => {
    return HttpResponse.json<APIResponse<Task[]>>({
      data: [
        { id: "1", title: "Translate UI copy", status: "open", skillTags: ["translation", "urdu"] },
      ],
      success: true,
    });
  }),

  http.get("/api/user/profile", () => {
    return HttpResponse.json({
      id: "u1",
      role: "woman_contributor",
      name: "Test User",
      locale: "en",
    });
  }),
];
```

**Browser setup:**

```typescript
// apps/women-portal/src/mocks/browser.ts
import { setupWorker } from "msw/browser";
import { handlers } from "./handlers";

export const worker = setupWorker(...handlers);
```

**Node setup:**

```typescript
// apps/women-portal/src/mocks/node.ts
import { setupServer } from "msw/node";
import { handlers } from "./handlers";

export const server = setupServer(...handlers);
```

**MSWProvider client component (RECOMMENDED over instrumentation-client.ts):**

```tsx
// apps/women-portal/src/components/msw-provider.tsx
"use client";

import { useEffect, useState, type PropsWithChildren } from "react";

export function MSWProvider({ children }: PropsWithChildren) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (process.env.NODE_ENV !== "development") {
      setReady(true);
      return;
    }

    async function init() {
      const { worker } = await import("@/mocks/browser");
      await worker.start({ onUnhandledRequest: "bypass" });
      setReady(true);
    }

    init();
  }, []);

  if (!ready) return null;
  return <>{children}</>;
}
```

**Server-side via instrumentation.ts:**

```typescript
// apps/women-portal/instrumentation.ts
// This file is at the app root (not inside src/)
// instrumentation.ts is STABLE in Next.js 15 -- no experimental flag needed
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs" && process.env.NODE_ENV === "development") {
    const { server } = await import("./src/mocks/node");
    server.listen({ onUnhandledRequest: "bypass" });
  }
}
```

**Layout integration:**

```tsx
// apps/women-portal/src/app/layout.tsx
import { MSWProvider } from "@/components/msw-provider";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <MSWProvider>
          {children}
        </MSWProvider>
      </body>
    </html>
  );
}
```

**Generate service worker file in each portal:**

```bash
cd apps/women-portal && npx msw init public/ --save
cd apps/university-portal && npx msw init public/ --save
# ... repeat for all 5 portals
```

### Pattern 7: Storybook 10 Configuration (HIGH confidence)

**What:** Storybook 10 is ESM-only. Essentials (controls, actions, viewport, backgrounds, etc.) are built into the `storybook` package -- no `@storybook/addon-essentials` needed.
**Source:** Storybook 10 blog post + official migration guide

```typescript
// packages/ui/.storybook/main.ts
import type { StorybookConfig } from "@storybook/nextjs";

const config: StorybookConfig = {
  framework: "@storybook/nextjs",
  stories: ["../src/**/*.stories.@(ts|tsx)"],
  addons: [
    "@storybook/addon-a11y",
  ],
  staticDirs: ["../../../packages/config/fonts"],
};

export default config;
```

```typescript
// packages/ui/.storybook/preview.ts
import type { Preview } from "@storybook/react";
import "./fonts.css";           // @font-face declarations for Storybook
import "../src/styles/globals.css"; // Tailwind + theme

const preview: Preview = {
  parameters: {
    controls: { expanded: true },
    layout: "centered",
  },
};

export default preview;
```

```css
/* packages/ui/.storybook/fonts.css */
@font-face {
  font-family: "Miller Display";
  src: url("/miller-display/MillerDisplay-Regular.woff2") format("woff2");
  font-weight: 400;
  font-display: swap;
}
@font-face {
  font-family: "Miller Display";
  src: url("/miller-display/MillerDisplay-Bold.woff2") format("woff2");
  font-weight: 700;
  font-display: swap;
}
@font-face {
  font-family: "Avenir LT Std";
  src: url("/avenir-lt-std/AvenirLTStd-Book.woff2") format("woff2");
  font-weight: 400;
  font-display: swap;
}
@font-face {
  font-family: "Avenir LT Std";
  src: url("/avenir-lt-std/AvenirLTStd-Medium.woff2") format("woff2");
  font-weight: 500;
  font-display: swap;
}
@font-face {
  font-family: "Avenir LT Std";
  src: url("/avenir-lt-std/AvenirLTStd-Heavy.woff2") format("woff2");
  font-weight: 800;
  font-display: swap;
}
```

```css
/* packages/ui/src/styles/globals.css */
@import "tailwindcss";
@import "@glimmora/config/tailwind/theme.css";

/* Scan this package's own components for class usage */
@source "../components/**/*.{ts,tsx}";
```

**PostCSS config for ui package (needed by Storybook):**

```js
// packages/ui/postcss.config.mjs
export default {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
```

**Storybook 10 key differences from Storybook 8:**
- `@storybook/addon-essentials` is gone -- controls, actions, viewport, docs are built-in
- Test utilities import from `storybook/test`: `import { expect, fn, userEvent, within } from "storybook/test";`
- All config files must be valid ESM (no CommonJS)
- Node 20.19+ or 22.12+ required
- New `sb.mock` for module mocking (replaces vitest mock pattern)

### Pattern 8: Custom Fonts (Miller Display + Avenir LT Std) (HIGH confidence)

**What:** Font files live in `packages/config/fonts/`. Each portal declares fonts via `next/font/local` in its layout.tsx. Storybook uses `@font-face` CSS.
**Source:** Next.js docs + WebSearch verification

**Critical finding:** `next/font/local` resolves paths relative to the file where `localFont()` is called. You CANNOT export a configured font object from a shared package and import it -- the font loader must be called in the consuming app's layout file. This is a Next.js compiler constraint.

```tsx
// apps/women-portal/src/app/layout.tsx
import localFont from "next/font/local";

const millerDisplay = localFont({
  src: [
    { path: "../../../../packages/config/fonts/miller-display/MillerDisplay-Regular.woff2", weight: "400", style: "normal" },
    { path: "../../../../packages/config/fonts/miller-display/MillerDisplay-Bold.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-miller-display",
  display: "swap",
});

const avenir = localFont({
  src: [
    { path: "../../../../packages/config/fonts/avenir-lt-std/AvenirLTStd-Book.woff2", weight: "400", style: "normal" },
    { path: "../../../../packages/config/fonts/avenir-lt-std/AvenirLTStd-Medium.woff2", weight: "500", style: "normal" },
    { path: "../../../../packages/config/fonts/avenir-lt-std/AvenirLTStd-Heavy.woff2", weight: "800", style: "normal" },
  ],
  variable: "--font-avenir",
  display: "swap",
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${millerDisplay.variable} ${avenir.variable}`}>
      <body className="font-sans bg-surface text-cocoa">
        {children}
      </body>
    </html>
  );
}
```

**How it connects to Tailwind:** The `localFont()` call generates CSS variables `--font-miller-display` and `--font-avenir` on the `<html>` element. The Tailwind `@theme` references these:

```css
@theme {
  --font-serif: var(--font-miller-display), Georgia, serif;
  --font-sans: var(--font-avenir), system-ui, sans-serif;
}
```

Then `font-serif` in a component uses Miller Display, and `font-sans` uses Avenir.

**Path depth verification needed:** The relative path from `apps/women-portal/src/app/layout.tsx` to `packages/config/fonts/` depends on exact directory structure. During implementation, count the `../` segments carefully. If layout.tsx is at `apps/women-portal/src/app/layout.tsx`, the path to `packages/config/fonts/` is `../../../../packages/config/fonts/`.

### Pattern 9: TanStack Query v5 Provider (HIGH confidence)

**What:** QueryClientProvider must wrap the app in a client component. Create a singleton QueryClient per request on server, reuse on client.
**Source:** TanStack Query v5 official docs

```tsx
// apps/women-portal/src/lib/get-query-client.ts
import { QueryClient } from "@tanstack/react-query";

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined = undefined;

export function getQueryClient() {
  if (typeof window === "undefined") {
    // Server: always make a new query client
    return makeQueryClient();
  } else {
    // Browser: reuse singleton
    if (!browserQueryClient) browserQueryClient = makeQueryClient();
    return browserQueryClient;
  }
}
```

```tsx
// apps/women-portal/src/components/providers.tsx
"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { getQueryClient } from "@/lib/get-query-client";

export function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

### Pattern 10: Zustand v5 Store (HIGH confidence)

**What:** Zustand v5 API is nearly identical to v4 for basic usage. Key breaking change: `create()` no longer accepts a custom equality function. Use `useShallow` for shallow comparisons.
**Source:** Zustand v5 migration docs + npm

```tsx
// apps/women-portal/src/stores/auth-store.ts
import { create } from "zustand";

interface AuthState {
  user: { id: string; role: string; name: string; locale: string } | null;
  isAuthenticated: boolean;
  setUser: (user: AuthState["user"]) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  logout: () => set({ user: null, isAuthenticated: false }),
}));
```

```tsx
// apps/women-portal/src/stores/ui-store.ts
import { create } from "zustand";

interface UIState {
  sidebarOpen: boolean;
  locale: string;
  toggleSidebar: () => void;
  setLocale: (locale: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  locale: "en",
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setLocale: (locale) => set({ locale }),
}));
```

**Using with selectors (v5 pattern):**

```tsx
import { useShallow } from "zustand/shallow";
import { useAuthStore } from "@/stores/auth-store";

// Select multiple values without infinite re-renders
const { user, isAuthenticated } = useAuthStore(
  useShallow((state) => ({
    user: state.user,
    isAuthenticated: state.isAuthenticated,
  }))
);
```

**Zustand v5 breaking changes summary:**
- `create()` no longer accepts equality function as second arg -- use `createWithEqualityFn` from `zustand/traditional` if needed
- `useShallow` from `zustand/shallow` is the recommended way to select multiple values
- React 18+ required (we use React 19)
- `use-sync-external-store` is now a peer dependency for `zustand/traditional`
- Default exports dropped -- use named imports only
- `persist` middleware no longer stores initial state on creation

### Pattern 11: motion (framer-motion) with Next.js App Router (HIGH confidence)

**What:** Import from `motion/react` with `"use client"` on the file. Alternative: import from `motion/react-client` to skip `"use client"`.
**Source:** motion.dev official docs

```tsx
// Option A: Standard import (requires "use client" on the file)
"use client";
import { motion, AnimatePresence } from "motion/react";

// Option B: Client-optimized import (no "use client" needed on the import,
// but the component using it must still be a client component)
import * as m from "motion/react-client";
```

Since ALL `@glimmora/ui` component files that use animation already have `"use client"` (because they use Radix primitives), use Option A (standard `motion/react` import). No extra configuration needed.

```tsx
// Example: Dialog with slide-in animation
"use client";

import { Dialog } from "radix-ui";
import { motion, AnimatePresence } from "motion/react";

export function GlimmoraDialog({ open, onOpenChange, children }) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div
                className="fixed inset-0 bg-espresso/40"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              />
            </Dialog.Overlay>
            <Dialog.Content asChild>
              <motion.div
                className="fixed top-1/2 left-1/2 bg-surface-card rounded-lg shadow-lg p-6"
                initial={{ opacity: 0, scale: 0.95, x: "-50%", y: "-50%" }}
                animate={{ opacity: 1, scale: 1, x: "-50%", y: "-50%" }}
                exit={{ opacity: 0, scale: 0.95, x: "-50%", y: "-50%" }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                {children}
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
```

### Pattern 12: next.config.ts for Each Portal App

```typescript
// apps/women-portal/next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@glimmora/ui", "@glimmora/types"],
  // instrumentation.ts is STABLE in Next.js 15 -- no experimental flag needed
};

export default nextConfig;
```

### Pattern 13: Shared Package package.json Configurations

```json
// packages/config/package.json
{
  "name": "@glimmora/config",
  "version": "0.0.0",
  "private": true,
  "exports": {
    "./tailwind/theme.css": "./tailwind/theme.css",
    "./eslint": "./eslint/base.js",
    "./tsconfig/base": "./tsconfig/base.json",
    "./tsconfig/nextjs": "./tsconfig/nextjs.json"
  }
}
```

```json
// packages/types/package.json
{
  "name": "@glimmora/types",
  "version": "0.0.0",
  "private": true,
  "exports": {
    ".": "./src/index.ts"
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

```json
// packages/ui/package.json
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
    "radix-ui": "^1.4.3",
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
    "@glimmora/config": "workspace:*",
    "@glimmora/types": "workspace:*",
    "typescript": "^5.9.3",
    "tailwindcss": "^4.2.1",
    "@tailwindcss/postcss": "^4.2.1"
  }
}
```

### Pattern 14: ESLint 10 Flat Config (HIGH confidence)

```javascript
// packages/config/eslint/base.js
import nextPlugin from "eslint-config-next";

export default [
  ...nextPlugin,
  {
    rules: {
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    },
  },
  {
    ignores: ["node_modules/", ".next/", "dist/", "storybook-static/"],
  },
];
```

```javascript
// apps/women-portal/eslint.config.js
import baseConfig from "@glimmora/config/eslint";

export default [
  ...baseConfig,
  // Portal-specific overrides if needed
];
```

**ESLint 10 key change:** Config is located starting from the linted file's directory, not CWD. This is better for monorepos -- each app/package can have its own `eslint.config.js` that extends the shared base.

### Anti-Patterns to Avoid

- **"use client" on barrel exports:** Breaks tree-shaking and forces ALL imported components to be client-bundled. Put `"use client"` on individual component files only.
- **Single QueryClient instance shared across server requests:** Causes data leakage between users. Use the `getQueryClient()` pattern that creates new clients on server.
- **`onUnhandledRequest: 'error'` in MSW:** Next.js makes many internal requests (HMR, RSC payloads, `_next/static`, etc.). Using `'error'` will throw on every internal request. Always use `'bypass'`.
- **Storybook `@storybook/addon-essentials` in Storybook 10:** This package is empty and will not be published. Remove it.
- **`tailwind.config.js` with Tailwind v4:** Tailwind v4 uses CSS-first configuration. There is no JavaScript config file.
- **Font declarations in a shared package:** `next/font/local` must be called in the consuming layout file. Cannot be pre-configured and exported.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Component variant API | Custom className logic | `class-variance-authority` (cva) | Type-safe variants with defaults. Tested edge cases. |
| Tailwind class merging | String concatenation | `tailwind-merge` via `cn()` helper | Handles conflicting utilities (e.g., `p-4` vs `px-2`) correctly. |
| Accessible dialog/modal | Custom overlay + focus trap | `radix-ui` Dialog primitive | Focus trap, scroll lock, esc handling, portal rendering all built-in. |
| Accessible select | Custom dropdown | `radix-ui` Select primitive | Keyboard navigation, ARIA, typeahead built-in. |
| API request mocking | Custom fetch wrapper | MSW v2 | Intercepts at network level. Works in browser + Node.js. |
| Form state management | useState per field | React Hook Form | Uncontrolled by default (performant). Validation integration with Zod. |
| Server state caching | Custom state + useEffect | TanStack Query v5 | Handles stale-while-revalidate, deduplication, retry, garbage collection. |
| Font optimization | Manual @font-face everywhere | `next/font/local` | Automatic preloading, font-display, zero layout shift. |
| PostCSS Tailwind setup | Manual PostCSS plugin chain | `@tailwindcss/postcss` | The official PostCSS plugin for Tailwind v4. |

**Key insight:** Every "simple" problem in this list has at least 3-5 edge cases that the established library handles and a custom solution will miss. The monorepo amplifies this -- a bug in hand-rolled utility logic breaks 5 portals simultaneously.

## Common Pitfalls

### Pitfall 1: Tailwind v4 Not Generating Classes from UI Package
**What goes wrong:** Styles defined in `@glimmora/ui` components don't appear when used in portal apps. Buttons render unstyled.
**Why it happens:** Tailwind v4 auto-detects source files by scanning down from the CSS file's directory. It does NOT scan `node_modules` or parent directories. The UI package is in a sibling directory (`packages/ui/`) which Tailwind cannot discover automatically.
**How to avoid:** Add `@source` directive in each portal's `globals.css` pointing to the UI package source.
**Warning signs:** Components render with no Tailwind classes applied. Inspect element shows raw class names but no matching CSS rules.

### Pitfall 2: MSW Not Intercepting Server Component Requests
**What goes wrong:** Mock data appears on client-navigated pages but not on initial server-rendered page loads. Hard refresh shows no data or connection errors.
**Why it happens:** MSW browser service worker only intercepts browser `fetch()`. Server Components run on Node.js and their `fetch()` calls bypass the service worker.
**How to avoid:** Implement BOTH `instrumentation.ts` (server-side `setupServer`) AND `MSWProvider` (browser-side `setupWorker`). Use `onUnhandledRequest: "bypass"` in both.
**Warning signs:** Data loads after client navigation but fails on hard refresh.

### Pitfall 3: MSWProvider Renders Children Before Worker Ready
**What goes wrong:** Components fire API requests before MSW service worker is fully initialized. Requests go to real server (which doesn't exist) and fail.
**Why it happens:** `worker.start()` is async. If the provider renders children immediately, TanStack Query hooks fire before interception is active.
**How to avoid:** The MSWProvider must return `null` until `worker.start()` resolves. Only then render children.
**Warning signs:** Intermittent "Failed to fetch" errors on first page load that disappear on subsequent navigations.

### Pitfall 4: next/font/local Path Resolution in Monorepo
**What goes wrong:** Font files not found. Build error: "Could not find font file."
**Why it happens:** `next/font/local` resolves `src` paths relative to the file where `localFont()` is called, NOT relative to project root or any tsconfig paths. In a monorepo, the path from `apps/portal/src/app/layout.tsx` to `packages/config/fonts/` requires multiple `../` segments.
**How to avoid:** Count directory levels carefully. From `apps/women-portal/src/app/layout.tsx` to `packages/config/fonts/` is 4 levels up (`../../../../packages/config/fonts/`). Test with a single font weight first.
**Warning signs:** Build-time error mentioning font file not found.

### Pitfall 5: "use client" on Barrel Export Kills Tree-Shaking
**What goes wrong:** Every component from `@glimmora/ui` is bundled into the client bundle, even pure display components that could be server-rendered.
**Why it happens:** Adding `"use client"` to `packages/ui/src/index.ts` marks the entire module boundary as client. Everything exported becomes client-only.
**How to avoid:** `"use client"` goes on individual component files (e.g., `button.tsx`), NEVER on barrel exports (`index.ts`).
**Warning signs:** Unexpectedly large client bundle. All UI components appear in client chunk even when used in server components.

### Pitfall 6: Storybook 10 + CommonJS Config Files
**What goes wrong:** Storybook fails to start with cryptic module loading errors.
**Why it happens:** Storybook 10 is ESM-only. If `.storybook/main.ts` or `preview.ts` use `module.exports` or `require()`, it breaks.
**How to avoid:** Use `export default` syntax only. All `.storybook/` config files must be valid ES modules.
**Warning signs:** Error messages about "require is not defined" or "module is not defined."

### Pitfall 7: Zustand v5 Infinite Re-render Loop
**What goes wrong:** Component re-renders infinitely when selecting multiple values from a Zustand store.
**Why it happens:** In Zustand v5, `useStore(state => ({ a: state.a, b: state.b }))` creates a new object reference on every render, causing React to re-render. Zustand v5 removed the built-in equality function from `create()`.
**How to avoid:** Use `useShallow` from `zustand/shallow` to wrap selectors that return objects.
**Warning signs:** "Maximum update depth exceeded" error.

### Pitfall 8: Turborepo Cache Hiding Build Errors
**What goes wrong:** A broken build succeeds because Turborepo returns cached output from a previous successful build.
**Why it happens:** Turborepo's remote/local cache is aggressive. If inputs haven't changed (according to turbo), it replays cached output.
**How to avoid:** During initial setup, run `turbo build --force` to bypass cache. After the monorepo is stable, let caching work naturally.
**Warning signs:** Build succeeds locally but fails in CI (different cache state).

## Code Examples

### cn() Utility (clsx + tailwind-merge)

```typescript
// packages/ui/src/lib/utils.ts
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

### Complete Button Component with Story

See Pattern 4 above for Button component.

```typescript
// packages/ui/src/components/button/button.stories.tsx
import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, within } from "storybook/test";
import { Button } from "./button";

const meta: Meta<typeof Button> = {
  title: "Components/Button",
  component: Button,
  argTypes: {
    variant: {
      control: "select",
      options: ["primary", "secondary", "ghost", "destructive"],
    },
    size: {
      control: "select",
      options: ["sm", "md", "lg"],
    },
    loading: { control: "boolean" },
    disabled: { control: "boolean" },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = {
  args: { variant: "primary", children: "Submit Deliverable" },
};

export const Secondary: Story = {
  args: { variant: "secondary", children: "Cancel" },
};

export const Ghost: Story = {
  args: { variant: "ghost", children: "Learn More" },
};

export const Loading: Story = {
  args: { variant: "primary", loading: true, children: "Submitting..." },
};

export const AllSizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
    </div>
  ),
};

export const WithInteraction: Story = {
  args: { variant: "primary", children: "Click me" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole("button");
    await userEvent.click(button);
    await expect(button).toHaveFocus();
  },
};
```

### TypeScript Interfaces (@glimmora/types)

```typescript
// packages/types/src/domain/index.ts
export type UserRole =
  | "woman_contributor"
  | "student_contributor"
  | "faculty_governor"
  | "enterprise_requester"
  | "mentor_reviewer"
  | "platform_admin"
  | "super_admin";

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: "open" | "assigned" | "in_progress" | "submitted" | "under_review" | "approved" | "rework" | "rejected";
  skillTags: string[];
  projectId: string;
  assigneeId?: string;
  deadline?: string;
  priority: "low" | "medium" | "high" | "critical";
}

export interface Project {
  id: string;
  title: string;
  status: "draft" | "blueprint" | "active" | "completed" | "archived";
  sowId: string;
  progress: number;
  taskCount: number;
  createdAt: string;
}

export interface SOW {
  id: string;
  title: string;
  uploadedBy: string;
  status: "uploaded" | "processing" | "analyzed" | "blueprint_ready";
  fileName: string;
  fileSize: number;
  uploadedAt: string;
}

export interface Evidence {
  id: string;
  taskId: string;
  type: "code" | "document" | "link" | "video" | "text";
  url?: string;
  content?: string;
  submittedAt: string;
  status: "pending" | "approved" | "rejected" | "rework_requested";
}

export interface PoDL {
  id: string;
  userId: string;
  projectId: string;
  taskId: string;
  skill: string;
  level: "beginner" | "intermediate" | "advanced" | "expert";
  verifiedAt: string;
  verifiedBy: string;
}

export interface SkillGenome {
  userId: string;
  skills: Array<{
    name: string;
    level: number;
    podlCount: number;
    lastVerified: string;
  }>;
  totalCredentials: number;
}

// packages/types/src/api/index.ts
export interface APIResponse<T> {
  data: T;
  success: boolean;
  error?: {
    code: string;
    message: string;
  };
  meta?: {
    page?: number;
    pageSize?: number;
    total?: number;
  };
}

// packages/types/src/index.ts
export * from "./domain";
export * from "./api";
```

### Canary Page (End-to-End Validation)

```tsx
// apps/women-portal/src/app/canary/page.tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import { Button } from "@glimmora/ui";
import type { Task, APIResponse } from "@glimmora/types";

export default function CanaryPage() {
  const { data, isLoading, error } = useQuery<APIResponse<Task[]>>({
    queryKey: ["canary-tasks"],
    queryFn: () => fetch("/api/tasks").then((res) => res.json()),
  });

  return (
    <div className="min-h-screen bg-surface p-8">
      <h1 className="font-serif text-4xl text-espresso mb-6">
        Canary Validation
      </h1>
      <p className="font-sans text-cocoa mb-4">
        This page validates: UI package, types package, TanStack Query, MSW mocking, and Tailwind theming.
      </p>

      {isLoading && <p className="text-cocoa">Loading mock data...</p>}
      {error && <p className="text-error">Error: {String(error)}</p>}

      {data?.data?.map((task) => (
        <div key={task.id} className="bg-surface-card rounded-lg shadow-md p-4 mb-3 border border-warm">
          <h2 className="font-sans font-medium text-espresso">{task.title}</h2>
          <p className="text-cocoa text-sm">Status: {task.status}</p>
          <div className="flex gap-2 mt-2">
            {task.skillTags.map((tag) => (
              <span key={tag} className="bg-sand/30 text-cocoa text-xs px-2 py-1 rounded-sm">
                {tag}
              </span>
            ))}
          </div>
        </div>
      ))}

      <div className="flex gap-3 mt-6">
        <Button variant="primary">Primary Button</Button>
        <Button variant="secondary">Secondary Button</Button>
        <Button variant="ghost">Ghost Button</Button>
      </div>
    </div>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `tailwind.config.js` (JS) | `@theme` in CSS files | Tailwind v4 (Jan 2025) | No JS config. Tokens are CSS. Simpler monorepo sharing. |
| `content: [...]` in TW config | `@source` directive in CSS | Tailwind v4 (Jan 2025) | Explicit class scanning per CSS file. Critical for monorepos. |
| `@storybook/addon-essentials` | Built into `storybook` package | Storybook 10 (Oct 2025) | Remove addon-essentials from deps and addons array. |
| `@storybook/test` | `storybook/test` | Storybook 10 (Oct 2025) | Import from package directly, not scoped addon. |
| `framer-motion` | `motion` (import from `motion/react`) | motion v11+ (2024) | Package renamed. Same API. Import path changed. |
| Individual `@radix-ui/react-*` | Unified `radix-ui` package | radix-ui 1.x (2025) | Single dependency, tree-shakeable. Cleaner imports. |
| `create()` with equality fn | `create()` + `useShallow` | Zustand v5 (2024) | Equality function removed from `create()`. Use `useShallow` wrapper. |
| `experimental.instrumentationHook` | `instrumentation.ts` (stable) | Next.js 15 (Oct 2024) | No experimental flag needed. Just create the file. |
| `instrumentation-client.ts` | MSWProvider component | Next.js 15.3+ (2025) | `instrumentation-client.ts` has race conditions with service worker. Stick with MSWProvider. |
| ESLint `.eslintrc` | `eslint.config.js` (flat config) | ESLint 10 (Feb 2026) | eslintrc completely removed. Flat config only. Config resolved from linted file's dir. |

**Deprecated/outdated:**
- `@storybook/addon-essentials`: Empty package in Storybook 10. Remove.
- `tailwind.config.js`: Does not exist in Tailwind v4. Use CSS-based `@theme`.
- `framer-motion` package name: Still works (same version), but `motion` is canonical.
- `experimental.instrumentationHook` in next.config: No longer needed in Next.js 15+.
- `@storybook/addon-interactions`: Merged into core `storybook` package.
- `module.exports` in Storybook config: ESM-only in Storybook 10.

## Open Questions

Things that could not be fully resolved during research:

1. **Exact `@source` path depth from portal globals.css to UI package**
   - What we know: `@source` paths are relative to the CSS file. The pattern is `@source "../../packages/ui/src/**/*.{ts,tsx}"` (from app root) or deeper.
   - What's unclear: Exact `../` count depends on where `globals.css` lives in each portal. If at `apps/women-portal/src/app/globals.css`, the path is 4 levels up.
   - Recommendation: Validate during scaffolding by checking if Tailwind generates a class known to exist only in `@glimmora/ui`.

2. **Storybook 10 font loading via staticDirs**
   - What we know: `staticDirs` in `main.ts` serves static files. `@font-face` in CSS can reference them.
   - What's unclear: Whether `@storybook/nextjs` automatically mocks `next/font/local` and applies the CSS variables, or if manual `@font-face` is always needed.
   - Recommendation: Start with manual `@font-face` via `staticDirs` pointing to font directory. This is reliable. Test if `@storybook/nextjs` provides additional font mocking.

3. **ESLint 10 + eslint-config-next flat config integration**
   - What we know: ESLint 10 uses flat config exclusively. eslint-config-next supports flat config.
   - What's unclear: Exact import syntax for spreading eslint-config-next into a flat config array. May need `@next/eslint-plugin-next` directly instead.
   - Recommendation: Start with a minimal ESLint config and add Next.js rules incrementally. The exact API should be validated during implementation.

4. **Turborepo `ui:` prefix pattern for shared components**
   - What we know: Turborepo's official Tailwind guide uses a `ui:` prefix via `@import "tailwindcss" prefix(ui)` to avoid specificity conflicts.
   - What's unclear: Whether this prefix is necessary for our setup where the UI package doesn't compile its own CSS separately, but rather relies on consuming apps to generate CSS.
   - Recommendation: Do NOT use the prefix pattern. Our approach has each portal's `globals.css` generate CSS for both the portal and UI package classes (via `@source`). Prefixing adds unnecessary complexity.

5. **`instrumentation-client.ts` stability in Next.js 15.5**
   - What we know: Introduced in 15.3 as experimental. May require `experimental.clientInstrumentationHook: true`. In 15.4.6, the experimental flag disappeared from types.
   - What's unclear: Whether it's stable, removed, or renamed in 15.5.x.
   - Recommendation: Do NOT use `instrumentation-client.ts` for MSW. The MSWProvider client component pattern is proven and avoids race conditions. Use `instrumentation.ts` (server-side only) which IS stable.

## Sources

### Primary (HIGH confidence)
- npm registry -- All package versions verified via `npm view` on 2026-02-26
- [Next.js instrumentation-client docs](https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation-client) -- v15.3+ introduced, confirmed via official docs
- [Next.js instrumentation docs](https://nextjs.org/docs/app/guides/instrumentation) -- Stable in Next.js 15
- [Tailwind CSS @theme docs](https://tailwindcss.com/docs/theme) -- Complete @theme namespace reference
- [Tailwind CSS @source docs](https://tailwindcss.com/docs/detecting-classes-in-source-files) -- Source detection and @source directive
- [Turborepo Tailwind guide](https://turborepo.dev/docs/guides/tools/tailwind) -- Official shared-styles.css + @source monorepo pattern
- [Storybook 10 blog post](https://storybook.js.org/blog/storybook-10/) -- ESM-only, essentials built-in
- [Storybook 10 migration guide](https://storybook.js.org/docs/releases/migration-guide) -- Config format changes
- [Storybook essentials docs](https://storybook.js.org/docs/essentials) -- Built-in, zero config

### Secondary (MEDIUM confidence)
- [MSW Next.js App Router example PR](https://github.com/mswjs/examples/pull/101) -- Official MSW example, dual-runtime pattern
- [MSW + Next.js tutorial (dev.to)](https://dev.to/ajth-in/mock-client-side-server-side-api-requests-using-nextjs-and-mswjs-9f1) -- Complete code examples verified against official docs
- [tailwindlabs/tailwindcss#13136](https://github.com/tailwindlabs/tailwindcss/issues/13136) -- Official team response on @source for monorepos
- [Zustand v5 migration (GitHub)](https://github.com/pmndrs/zustand/releases/tag/v5.0.0) -- Breaking changes confirmed via release notes
- [motion.dev installation docs](https://motion.dev/docs/react-installation) -- Import paths and Next.js setup

### Tertiary (LOW confidence)
- ESLint 10 flat config + eslint-config-next integration -- Based on ESLint 10 release blog + Next.js docs, but exact spreading syntax not verified with a working example
- Storybook 10 + `@storybook/nextjs` font mocking behavior -- Based on Storybook 8 behavior, not verified for Storybook 10 specifically

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- All versions verified via npm registry
- Architecture (monorepo structure): HIGH -- Based on Turborepo official guide + verified patterns
- Tailwind v4 integration: HIGH -- Official docs + official GitHub issue with team response
- MSW v2 dual-runtime: HIGH -- Official examples + multiple verified community implementations
- Storybook 10 configuration: HIGH -- Official migration guide + blog post
- Font loading strategy: MEDIUM -- next/font/local behavior known, but cross-workspace relative paths need runtime validation
- ESLint 10 flat config: MEDIUM -- New release (Feb 2026), exact Next.js integration pattern needs validation
- Zustand v5 changes: HIGH -- Official migration docs verified via GitHub

**Research date:** 2026-02-26
**Valid until:** 2026-03-28 (30 days -- stable ecosystem, all libraries mature)
