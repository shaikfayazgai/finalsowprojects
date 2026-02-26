# Domain Pitfalls: Next.js App Router + Turborepo + Radix UI + MSW + Storybook

**Project:** GlimmoraTeam
**Researched:** 2026-02-26
**Overall Confidence:** MEDIUM (based on training data; WebSearch/WebFetch unavailable for verification. These are well-known integration pain points extensively discussed in the ecosystem, but exact API details should be verified against current docs before implementation.)

---

## Critical Pitfalls

Mistakes that cause rewrites, multi-hour debugging sessions, or fundamentally broken setups.

---

### CRITICAL-1: MSW v2 + Next.js App Router -- Dual Runtime Initialization

**What goes wrong:** MSW is set up only for the browser (service worker), but Next.js App Router runs React Server Components on the Node.js server. API calls made from server components (e.g., inside `fetch()` in a server component or `generateMetadata`) bypass the browser service worker entirely. The developer sees mocks working for client-interactive pages but getting real 404s or connection refused errors for any data fetching that happens server-side.

**Why it happens:** Next.js App Router has two runtimes: the Node.js server (for RSC rendering, route handlers, middleware) and the browser. MSW v2 has two separate integration modes -- `setupWorker` for browser and `setupServer` for Node.js -- and they are completely different modules. Most MSW tutorials only show one or the other. The App Router blurs the line because the same component tree spans both runtimes.

**Symptoms:**
- Mock data appears on client-navigated pages but not on initial server-rendered page loads
- `fetch` calls in server components return 404 or ECONNREFUSED
- MSW handlers work in Storybook/tests but not in the actual Next.js dev server
- The MSW service worker initializes (you see the "[MSW] Mocking enabled" console log in the browser) but server-side fetches are unmocked

**Consequences:** If not caught early, the entire mocking strategy falls apart. Since MSW mock shapes ARE the API contract for backend handoff, this is existential for the project.

**Prevention:**

1. Set up BOTH MSW integrations from day one:

```typescript
// src/mocks/browser.ts -- for client components
import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';
export const worker = setupWorker(...handlers);

// src/mocks/server.ts -- for server components / Node.js
import { setupServer } from 'msw/node';
import { handlers } from './handlers';
export const server = setupServer(...handlers);
```

2. For the browser worker, MSW v2 requires running the CLI to generate the service worker file:

```bash
npx msw init ./public --save
```

This creates `public/mockServiceWorker.js`. Each of the 5 Next.js apps needs this file in its own `/public` directory.

3. The handler definitions (`handlers.ts`) must be shared across both integrations. Place them in a shared package (`@glimmora/mocks` or similar) so all 5 portals and tests use the same mock shapes.

4. For the Node.js server integration (server components), MSW v2 uses the `server.listen()` / `server.close()` lifecycle. In Next.js, this needs to be initialized before the server starts handling requests. The recommended pattern is to use `instrumentation.ts` (Next.js instrumentation hook):

```typescript
// instrumentation.ts (at project root, next to next.config.js)
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { server } = await import('./src/mocks/server');
    server.listen({ onUnhandledRequest: 'bypass' });
  }
}
```

Enable instrumentation in `next.config.js`:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    instrumentationHook: true, // Required in Next.js 14; may be stable in 15+
  },
};
```

5. For the browser worker, conditionally start in a client component or layout:

```typescript
// src/components/MSWProvider.tsx
'use client';

import { useEffect, useState } from 'react';

export function MSWProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      import('../mocks/browser').then(({ worker }) => {
        worker.start({ onUnhandledRequest: 'bypass' }).then(() => {
          setReady(true);
        });
      });
    } else {
      setReady(true);
    }
  }, []);

  if (!ready) return null; // or a loading spinner
  return <>{children}</>;
}
```

**Detection:** If any page works on client navigation but shows different/missing data on hard refresh, MSW server-side is not configured.

**Phase relevance:** Phase 1 (monorepo infrastructure setup). Must be solved before any portal page development begins.

**Confidence:** MEDIUM -- The dual-runtime pattern is well-established. The exact `instrumentation.ts` API should be verified against current Next.js docs (it was experimental in 14, may have stabilized in 15).

---

### CRITICAL-2: Tailwind CSS Content Paths Fail to Detect Shared Package Classes

**What goes wrong:** The `@glimmora/ui` package exports components that use Tailwind classes (e.g., `className="rounded-lg bg-primary-500 px-4"`), but when those components render inside an app like `apps/women-portal`, the Tailwind classes from the UI package are missing from the generated CSS. Components render with zero styling -- raw unstyled HTML.

**Why it happens:** Tailwind CSS generates its output by scanning files listed in the `content` array of `tailwind.config.js`. Each Next.js app has its own Tailwind config. By default, the content paths only cover `./src/**/*.{ts,tsx}` and `./app/**/*.{ts,tsx}` -- files within that app. The shared `@glimmora/ui` package lives in `../../packages/ui/` and its files are NOT in the default content glob. Tailwind never sees those component files, never finds their class names, and never generates the CSS for them.

**Symptoms:**
- Components from `@glimmora/ui` render but appear completely unstyled
- Same components look perfect in Storybook (which has its own Tailwind config)
- Adding a class directly in the app's own code works fine
- The class exists in the package source but is missing from the app's generated CSS

**Consequences:** Every component from the shared design system appears broken. This looks like a component library bug when it is actually a Tailwind configuration issue. Teams can waste days debugging component code when the fix is a single config line.

**Prevention:**

In each app's `tailwind.config.ts`, explicitly include the UI package's source files:

```typescript
// apps/women-portal/tailwind.config.ts
import type { Config } from 'tailwindcss';
import sharedConfig from '@glimmora/config/tailwind';

const config: Config = {
  presets: [sharedConfig],
  content: [
    './src/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    // THIS IS THE CRITICAL LINE:
    '../../packages/ui/src/**/*.{ts,tsx}',
    // Also include any other packages that use Tailwind classes:
    '../../packages/types/**/*.{ts,tsx}',
  ],
};

export default config;
```

Additional prevention:
- Create the shared Tailwind config as a preset in `packages/config/tailwind.ts` that defines the design tokens (colors, fonts, spacing). Each app extends this preset.
- NEVER rely on the package being transpiled to include Tailwind classes in the output -- Tailwind scans source files for class names as strings, it does not execute the code.
- If using `tailwind.config.ts` (TypeScript), ensure the config package exports the config correctly and the app resolves it.

**The Turborepo-specific trap:** Turborepo's internal packages (using `"main": "./src/index.ts"` in package.json, no build step) mean the source `.tsx` files are the actual consumed files. This is actually GOOD for Tailwind scanning -- you want to scan the source. But the content paths must still explicitly include them.

**Detection:** After setting up the first shared component, render it in an app. If it appears unstyled, check the app's Tailwind content paths immediately.

**Phase relevance:** Phase 1 (monorepo infrastructure setup). Must be solved when configuring the design system package. Create a "canary" test: one shared Button component rendered in one app, verified styled, before building more.

**Confidence:** HIGH -- This is the single most common Turborepo + Tailwind issue. Extensively documented in Turborepo's own examples and Tailwind documentation.

---

### CRITICAL-3: Radix UI Components Require "use client" but App Router Defaults to Server Components

**What goes wrong:** A developer creates a component in `@glimmora/ui` using Radix UI primitives (Dialog, Dropdown, Accordion, etc.). They import it into an App Router page. Next.js throws:

```
Error: useState/useEffect/useRef is not allowed in Server Components.
```

Or more cryptically, Radix context providers fail silently, and interactive components render but don't respond to clicks.

**Why it happens:** Radix UI primitives use React hooks internally (`useState`, `useEffect`, `useRef`, `useContext`). These hooks only work in Client Components. Next.js App Router treats every component as a Server Component by default unless it has the `"use client"` directive. The error occurs because Radix's internal hooks are called in a server context.

**Symptoms:**
- Build errors mentioning `useState` or `useContext` in Server Components
- Interactive components render but clicking does nothing (no state updates)
- Hydration mismatch warnings in console
- Works in Storybook (which is always client-side) but breaks in Next.js

**Consequences:** If the `"use client"` boundary is placed incorrectly (too high or too low), you either lose Server Component benefits entirely (putting it at the layout level) or have to refactor component composition patterns later.

**Prevention:**

The correct pattern is to mark the `"use client"` boundary at the individual component level in the UI package, NOT at the page level in apps:

```typescript
// packages/ui/src/components/dialog.tsx
'use client';  // <-- HERE, at the component level

import * as DialogPrimitive from '@radix-ui/react-dialog';

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogContent = ({ children, ...props }) => (
  <DialogPrimitive.Portal>
    <DialogPrimitive.Overlay className="fixed inset-0 bg-black/40" />
    <DialogPrimitive.Content {...props}>
      {children}
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
);
// ... etc
```

```typescript
// packages/ui/src/components/button.tsx
// NO "use client" needed if Button is purely presentational (no hooks)
// This can remain a Server Component

export function Button({ children, ...props }) {
  return <button {...props}>{children}</button>;
}
```

Key rules:
1. Every Radix-based component file in `@glimmora/ui` gets `"use client"` at the top
2. Purely presentational components (no hooks, no event handlers beyond what the consumer provides) do NOT need `"use client"`
3. The app pages remain Server Components. They import and compose `"use client"` components:

```typescript
// apps/women-portal/app/dashboard/page.tsx
// This is a Server Component (no directive) -- it CAN import client components
import { Dialog, DialogTrigger, DialogContent } from '@glimmora/ui';
import { TaskCard } from '@glimmora/ui'; // also "use client"

export default async function DashboardPage() {
  // Can do server-side work here (fetch, db, etc.)
  return (
    <div>
      <h1>Dashboard</h1>  {/* This renders on server */}
      <TaskCard />          {/* Client boundary starts here */}
      <Dialog>              {/* Client boundary */}
        <DialogTrigger>Open</DialogTrigger>
        <DialogContent>...</DialogContent>
      </Dialog>
    </div>
  );
}
```

4. Do NOT add `"use client"` to the barrel export file (`packages/ui/src/index.ts`). Mark each component file individually. Adding it to the barrel file forces ALL consumers into client mode.

**Detection:** Run `next build` early and often. Server Component violations show at build time, not just runtime.

**Phase relevance:** Phase 1 (design system package setup). Establish the `"use client"` convention before building any components.

**Confidence:** HIGH -- This is a fundamental Next.js App Router concept documented extensively in Next.js official docs.

---

### CRITICAL-4: Storybook Cannot Resolve Turborepo Internal Packages

**What goes wrong:** Storybook is configured in `packages/ui` (or at root). Stories import components from `@glimmora/ui`. Storybook starts but shows errors:

```
Module not found: Can't resolve '@glimmora/ui'
```

Or alternatively, components load but Tailwind styles are completely missing.

**Why it happens:** Storybook uses its own Webpack/Vite bundler, separate from Next.js. This bundler does not automatically understand Turborepo's internal package resolution (the `"main": "./src/index.ts"` pattern). Additionally, Storybook's Tailwind setup is completely independent from the app's Tailwind -- it needs its own PostCSS configuration.

**Symptoms:**
- `Module not found` errors for `@glimmora/*` imports
- Storybook starts but components render unstyled
- Storybook works for components defined locally but not imported packages
- TypeScript path aliases (`@/*`) not resolved
- Tailwind `@apply` directives fail in Storybook

**Consequences:** Storybook is the PRIMARY handoff artifact for this project. If it doesn't work, there's no component documentation, and the backend developer has no visual reference for integration.

**Prevention:**

1. **Place Storybook in the right location.** For a shared UI package, Storybook should live in `packages/ui/.storybook/`. Stories co-locate with components.

2. **Configure Storybook's Vite/Webpack to resolve monorepo packages.** In `.storybook/main.ts`:

```typescript
// packages/ui/.storybook/main.ts
import type { StorybookConfig } from '@storybook/react-vite';
// or '@storybook/nextjs' if using the Next.js framework

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  framework: {
    name: '@storybook/react-vite', // or '@storybook/nextjs'
    options: {},
  },
  addons: [
    '@storybook/addon-essentials',
    // If using @storybook/nextjs framework, Tailwind may work automatically
  ],
  // For Vite-based Storybook, add alias resolution:
  async viteFinal(config) {
    return {
      ...config,
      resolve: {
        ...config.resolve,
        alias: {
          ...config.resolve?.alias,
          // Add any path aliases your components use
        },
      },
    };
  },
};

export default config;
```

3. **Tailwind in Storybook needs its own CSS import.** Create a preview file that imports a global CSS file with Tailwind directives:

```typescript
// packages/ui/.storybook/preview.ts
import '../src/globals.css'; // Must contain @tailwind directives

const preview = {
  parameters: {
    // ...
  },
};

export default preview;
```

```css
/* packages/ui/src/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;
```

4. **Storybook's Tailwind config must have correct content paths** (same issue as CRITICAL-2 but for Storybook's context):

```typescript
// packages/ui/tailwind.config.ts
import sharedConfig from '@glimmora/config/tailwind';
import type { Config } from 'tailwindcss';

const config: Config = {
  presets: [sharedConfig],
  content: [
    './src/**/*.{ts,tsx}',  // Component source files
    './.storybook/**/*.{ts,tsx}', // Storybook decorator files
  ],
};

export default config;
```

5. **Font loading in Storybook.** `next/font` does NOT work in Storybook (it's a Next.js compiler feature). You must load fonts differently for Storybook -- typically via CSS `@font-face` in the Storybook preview's CSS file. This means the font files need to be available to Storybook's static asset serving.

**Detection:** Run Storybook immediately after setting up the first component. Don't wait until you have 20 components -- debug the infrastructure with one Button story.

**Phase relevance:** Phase 1 (infrastructure). Storybook must be validated working with one component before component development begins.

**Confidence:** HIGH -- This is well-documented in both Storybook and Turborepo documentation.

---

### CRITICAL-5: Custom Fonts (Miller Display, Avenir LT Std) with next/font/local

**What goes wrong:** The developer tries to use `next/font/google` for Miller Display or Avenir LT Std and discovers these are NOT Google Fonts. They are commercial/licensed typefaces. Then they try `next/font/local` but the font doesn't apply, or it applies on some pages but not others, or it causes a FOUT (Flash of Unstyled Text), or the font variable CSS custom property is not available in Tailwind.

**Why it happens:** `next/font` has two submodules:
- `next/font/google` -- only works with Google Fonts
- `next/font/local` -- for self-hosted font files (.woff2, .woff, .ttf, .otf)

Miller Display and Avenir LT Std are commercial fonts requiring license and manual font file management. The developer must:
1. Obtain the font files (licensed)
2. Place them in the project
3. Configure `next/font/local` correctly
4. Wire the CSS variable into Tailwind
5. Make it work across 5 portals
6. Make it work in Storybook (where `next/font` doesn't exist)

Each of these steps has its own pitfalls.

**Symptoms:**
- `Module not found: Can't resolve 'miller-display'` in next/font/google
- Font loads on some routes but not others
- Flash of system font before custom font loads
- Tailwind `font-display` or `font-body` class does nothing
- Font works in app but not in Storybook
- Different font weights render as the same weight (wrong file mapping)

**Prevention:**

1. **Font file organization.** Place font files in a shared location accessible to all apps:

```
packages/config/fonts/
  miller-display-regular.woff2
  miller-display-bold.woff2
  avenir-lt-std-book.woff2
  avenir-lt-std-medium.woff2
  avenir-lt-std-bold.woff2
```

2. **Define fonts with next/font/local in a shared file.** Create a font definition module:

```typescript
// packages/config/src/fonts.ts
import localFont from 'next/font/local';

export const millerDisplay = localFont({
  src: [
    {
      path: '../fonts/miller-display-regular.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../fonts/miller-display-bold.woff2',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-miller-display',
  display: 'swap',
});

export const avenirLTStd = localFont({
  src: [
    {
      path: '../fonts/avenir-lt-std-book.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../fonts/avenir-lt-std-medium.woff2',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../fonts/avenir-lt-std-bold.woff2',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-avenir',
  display: 'swap',
});
```

**IMPORTANT CAVEAT:** `next/font/local` may not work when imported from an external package because it relies on Next.js compiler transforms that expect the font definition to be in a Next.js app. If this fails, the fallback is to define the fonts in each app's root layout and pass the CSS variable classes down. This is a known friction point.

3. **Apply font CSS variables in root layout of each app:**

```typescript
// apps/women-portal/app/layout.tsx
import { millerDisplay, avenirLTStd } from './fonts'; // local to app if shared fails

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${millerDisplay.variable} ${avenirLTStd.variable}`}
    >
      <body className="font-body">{children}</body>
    </html>
  );
}
```

4. **Wire CSS variables into Tailwind config:**

```typescript
// packages/config/tailwind.ts
const config = {
  theme: {
    fontFamily: {
      display: ['var(--font-miller-display)', 'Georgia', 'serif'],
      body: ['var(--font-avenir)', 'system-ui', 'sans-serif'],
    },
  },
};
```

5. **Storybook font loading (separate path).** Since `next/font` is not available in Storybook, load fonts via CSS `@font-face`:

```css
/* packages/ui/.storybook/fonts.css */
@font-face {
  font-family: 'Miller Display';
  src: url('../fonts/miller-display-regular.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: 'Miller Display';
  src: url('../fonts/miller-display-bold.woff2') format('woff2');
  font-weight: 700;
  font-style: normal;
  font-display: swap;
}

/* Same for Avenir LT Std variants */

:root {
  --font-miller-display: 'Miller Display', Georgia, serif;
  --font-avenir: 'Avenir LT Std', system-ui, sans-serif;
}
```

Import this in `.storybook/preview.ts`.

6. **Configure Storybook's static file serving to find font files:**

```typescript
// packages/ui/.storybook/main.ts
const config = {
  // ...
  staticDirs: ['../fonts'], // Serve font files
};
```

**Detection:** After font setup, verify: (a) fonts render in Next.js dev server on hard refresh, (b) fonts render in Storybook, (c) `font-display` and `font-body` Tailwind classes work. If any of these three fail, the wiring is incomplete.

**Phase relevance:** Phase 1 (design system setup). Fonts are foundational -- every component and page depends on them. Don't defer.

**Confidence:** MEDIUM -- The `next/font/local` API is well-documented, but the cross-package sharing pattern (fonts defined in a shared package vs. each app) has edge cases that depend on the exact Next.js version and its compiler behavior. Test this early.

---

### CRITICAL-6: MSW Handler Shapes Diverge Across Portals

**What goes wrong:** Each portal team (or the solo developer at different times) creates slightly different MSW handlers for the same API endpoints. The Women's Portal mock for `/api/tasks` returns `{ tasks: [...] }` while the Enterprise Portal mock for the same endpoint returns `{ data: { tasks: [...] } }`. When the backend developer builds the real API, the "contract" is ambiguous.

**Why it happens:** With 5 portals, there are 5 opportunities to write mock handlers. Without a single source of truth, copy-paste drift is inevitable -- especially over weeks of development.

**Consequences:** The entire value proposition of "MSW mocks as API contract" collapses. Backend developer receives contradictory type definitions. Integration phase becomes a debugging nightmare.

**Prevention:**

1. **Single shared handlers package.** Create `packages/mocks/` with:
   - `handlers/auth.ts` -- all auth-related handlers
   - `handlers/tasks.ts` -- all task-related handlers
   - `handlers/projects.ts` -- etc.
   - `handlers/index.ts` -- aggregates all handlers
   - `data/` -- mock data factories (use a library like `@faker-js/faker` or hand-crafted fixtures)

2. **All 5 portals import from the SAME handlers:**

```typescript
// apps/women-portal/src/mocks/browser.ts
import { setupWorker } from 'msw/browser';
import { handlers } from '@glimmora/mocks';
export const worker = setupWorker(...handlers);
```

3. **Types package as the source of truth.** `@glimmora/types` defines the API response shapes. MSW handlers must satisfy these types:

```typescript
// packages/types/src/api/tasks.ts
export interface TaskListResponse {
  tasks: Task[];
  pagination: PaginationMeta;
}

// packages/mocks/src/handlers/tasks.ts
import { http, HttpResponse } from 'msw';
import type { TaskListResponse } from '@glimmora/types';

export const taskHandlers = [
  http.get('/api/tasks', () => {
    const response: TaskListResponse = {
      tasks: mockTasks,
      pagination: { page: 1, total: 10 },
    };
    return HttpResponse.json(response);
  }),
];
```

4. **Enforce with TypeScript.** The `HttpResponse.json(response)` pattern combined with explicit typing means TypeScript catches any shape divergence at build time.

**Detection:** Run `tsc --noEmit` across the entire monorepo regularly. Any handler that doesn't satisfy the type contract will fail type-checking.

**Phase relevance:** Phase 1 (infrastructure) for package setup. Ongoing discipline throughout all phases.

**Confidence:** HIGH -- This is an architecture decision, not a technology-specific pitfall. The pattern is well-established.

---

## Moderate Pitfalls

Mistakes that cause hours of debugging or accumulated technical debt.

---

### MODERATE-1: Framer Motion Components in Server Components

**What goes wrong:** A developer wraps a page section in a Framer Motion `<motion.div>` for an entrance animation. Next.js throws a Server Component error because Framer Motion uses hooks internally.

**Why it happens:** Same root cause as CRITICAL-3 (Radix). Framer Motion's `motion` components use `useRef`, `useEffect`, and internal state. They are client-only.

**Symptoms:**
- `useState is not allowed in Server Components` error mentioning framer-motion internals
- Animation works in isolation but breaks when added to a page component

**Prevention:**

Create animation wrapper components in `@glimmora/ui` with `"use client"`:

```typescript
// packages/ui/src/components/animated.tsx
'use client';

import { motion, type HTMLMotionProps } from 'framer-motion';

export function FadeIn({ children, ...props }: HTMLMotionProps<'div'>) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      {...props}
    >
      {children}
    </motion.div>
  );
}
```

Then in pages (Server Components), use the wrapper:

```typescript
// Server Component -- this works
import { FadeIn } from '@glimmora/ui';

export default function Page() {
  return (
    <FadeIn>
      <h1>Dashboard</h1>
    </FadeIn>
  );
}
```

**Rule:** Never import directly from `framer-motion` in app page files. Always go through `@glimmora/ui` wrappers.

**Phase relevance:** Phase 2+ (when adding animations to pages). Not a Phase 1 blocker.

**Confidence:** HIGH -- well-understood Server/Client Component boundary issue.

---

### MODERATE-2: TanStack Query v5 Hydration Pattern with App Router

**What goes wrong:** The developer sets up TanStack Query with a `QueryClientProvider` in the root layout. Server-fetched data is not available to client components, causing double-fetching. Or worse, hydration mismatches cause the page to flash between server-rendered content and client-refetched content.

**Why it happens:** TanStack Query v5 changed its hydration API. The old `Hydrate` component from v4 is replaced with `HydrationBoundary` and `dehydrate`. Additionally, with MSW mocking both server and client, the hydration pattern must ensure mock data flows correctly from server render to client hydrate.

**Symptoms:**
- Loading spinners flash briefly on every page navigation
- Data appears, disappears, then reappears
- Console warnings about hydration mismatches
- `useQuery` makes a new fetch on mount despite data being server-rendered

**Prevention:**

1. Create a proper provider setup:

```typescript
// packages/ui/src/providers/query-provider.tsx
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

export function QueryProvider({ children }: { children: React.ReactNode }) {
  // Create QueryClient INSIDE component to avoid sharing between requests
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false, // Important for mock-driven dev
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
```

2. **Do NOT create a single global `QueryClient` outside of a component.** This causes data leaking between server-side requests (request A's cached data appears in request B's render).

3. For this project (mock-driven, no real server data), the simplest approach is to NOT do server-side data fetching at all. Let all data fetching happen client-side via TanStack Query + MSW browser mocking. This avoids the entire hydration complexity:

```typescript
// Server Component page -- no data fetching
export default function DashboardPage() {
  return <DashboardContent />; // Client component does the fetching
}
```

```typescript
// Client Component
'use client';

import { useQuery } from '@tanstack/react-query';

function DashboardContent() {
  const { data, isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => fetch('/api/tasks').then(r => r.json()),
  });
  // ...
}
```

This is a pragmatic choice: since there's no real backend, the server-side fetch optimization doesn't matter. When the backend developer integrates, they can add server-side prefetching with `HydrationBoundary`.

**Phase relevance:** Phase 1 (infrastructure) for provider setup. Phase 2+ for data fetching patterns in pages.

**Confidence:** MEDIUM -- TanStack Query v5 API is known, but the exact best practice for mock-only projects may vary.

---

### MODERATE-3: Turborepo Task Dependencies and Build Order

**What goes wrong:** Running `turbo build` succeeds, but `turbo dev` has race conditions. The UI package isn't compiled before the app tries to import it. Or `turbo lint` runs on the app before the types package is built, causing TypeScript errors.

**Why it happens:** Turborepo uses a `turbo.json` pipeline to define task dependencies. If `dependsOn` is not configured correctly, tasks run in the wrong order. For internal packages (no build step), this matters less, but for any package that has a build step or type generation, ordering is critical.

**Symptoms:**
- `turbo dev` works on second run but not first
- TypeScript errors in the app about missing types from `@glimmora/types`
- Build succeeds locally but fails in CI
- Intermittent "module not found" errors that go away on retry

**Prevention:**

1. For internal packages with NO build step (recommended for `@glimmora/ui`, `@glimmora/types`, `@glimmora/config`), set up `package.json` to export source directly:

```json
{
  "name": "@glimmora/ui",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts",
    "./*": "./src/*.ts"
  }
}
```

This eliminates the build-order problem entirely because there's no build step for these packages. The consuming Next.js apps transpile them via `transpilePackages` in `next.config.js`:

```javascript
// next.config.js (each app)
const nextConfig = {
  transpilePackages: ['@glimmora/ui', '@glimmora/types', '@glimmora/config', '@glimmora/mocks'],
};
```

2. In `turbo.json`, configure dependencies correctly:

```json
{
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**"]
    },
    "dev": {
      "dependsOn": ["^build"],
      "persistent": true,
      "cache": false
    },
    "lint": {
      "dependsOn": ["^build"]
    },
    "type-check": {
      "dependsOn": ["^build"]
    }
  }
}
```

The `^build` means "run the `build` task in all dependencies first." For internal packages with no build script, Turborepo skips them, which is correct.

**Detection:** If any `turbo` command fails on first run but succeeds on retry, you have a dependency ordering issue.

**Phase relevance:** Phase 1 (monorepo setup). Get this right before adding any code.

**Confidence:** HIGH -- Turborepo's documentation covers this extensively.

---

### MODERATE-4: Port Conflicts with 5 Next.js Dev Servers

**What goes wrong:** Running `turbo dev` starts all 5 Next.js apps simultaneously. They all try to bind to port 3000. Four of them fail or auto-increment to random ports. The developer doesn't know which portal is on which port.

**Why it happens:** Next.js defaults to port 3000. Turborepo runs all `dev` scripts in parallel. Without explicit port configuration, it's chaos.

**Symptoms:**
- Terminal output shows port-in-use warnings
- Portals randomly appear on ports 3001, 3002, etc., different every restart
- Browser bookmarks stop working
- MSW service worker scope may not match the port

**Prevention:**

Assign explicit ports in each app's `package.json`:

```json
// apps/women-portal/package.json
{
  "scripts": {
    "dev": "next dev --port 3001"
  }
}

// apps/university-portal/package.json
{
  "scripts": {
    "dev": "next dev --port 3002"
  }
}

// apps/enterprise-portal/package.json
{
  "scripts": {
    "dev": "next dev --port 3003"
  }
}

// apps/mentor-portal/package.json
{
  "scripts": {
    "dev": "next dev --port 3004"
  }
}

// apps/admin-panel/package.json
{
  "scripts": {
    "dev": "next dev --port 3005"
  }
}
```

Also assign Storybook a dedicated port:

```json
// packages/ui/package.json
{
  "scripts": {
    "storybook": "storybook dev -p 6006"
  }
}
```

Document the port assignments in a root README or `.env.example`:

```
Women's Portal:     http://localhost:3001
University Portal:  http://localhost:3002
Enterprise Portal:  http://localhost:3003
Mentor Portal:      http://localhost:3004
Admin Panel:        http://localhost:3005
Storybook:          http://localhost:6006
```

**Additional tip:** For solo development, you likely don't need all 5 portals running simultaneously. Use Turborepo's `--filter` flag:

```bash
turbo dev --filter=women-portal --filter=@glimmora/ui
```

This starts only the Women's Portal and watches the UI package for changes.

**Phase relevance:** Phase 1 (monorepo setup). Trivial to configure upfront, annoying to debug later.

**Confidence:** HIGH -- standard Next.js / Turborepo configuration.

---

### MODERATE-5: TypeScript Path Aliases Inconsistency Across Packages and Tools

**What goes wrong:** Path aliases like `@/components/Button` work in Next.js apps but break in Storybook, Vitest, or when importing across packages. Or `@glimmora/ui` resolves in apps but not in tests.

**Why it happens:** TypeScript path aliases (`paths` in `tsconfig.json`) are resolved by different tools using different mechanisms:
- Next.js: Uses its own module resolution (understands `tsconfig.json` paths)
- Storybook (Vite): Uses Vite's `resolve.alias`
- Vitest: Uses Vite's resolution or its own config
- TypeScript compiler (`tsc`): Uses `tsconfig.json` paths but needs `baseUrl`

If these are not aligned, the same import resolves differently (or fails) depending on which tool is processing it.

**Symptoms:**
- Import works in Next.js dev but TypeScript shows red squiggles in IDE
- Import works in IDE but fails in Vitest
- Import works everywhere except Storybook
- `Cannot find module '@/...'` errors in some tools but not others

**Prevention:**

1. Use a shared `tsconfig.json` base in `packages/config/`:

```json
// packages/config/tsconfig.base.json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "module": "esnext",
    "moduleResolution": "bundler",
    "jsx": "preserve",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "incremental": true
  }
}
```

2. Each app extends the base and adds its own path aliases:

```json
// apps/women-portal/tsconfig.json
{
  "extends": "@glimmora/config/tsconfig.base.json",
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
}
```

3. For Vitest, mirror the aliases in `vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

4. For Storybook (Vite), mirror in `.storybook/main.ts` `viteFinal`.

**Rule of thumb:** Minimize path aliases. Use `@/*` for intra-app imports only. For cross-package imports, always use the package name (`@glimmora/ui`, `@glimmora/types`). Package names resolve via Node.js module resolution and don't need alias configuration.

**Phase relevance:** Phase 1 (monorepo setup). Get the shared tsconfig right before adding code.

**Confidence:** HIGH -- this is standard monorepo TypeScript configuration.

---

### MODERATE-6: Storybook's Next.js Framework Adapter vs. React-Vite

**What goes wrong:** The developer chooses `@storybook/react-vite` (faster, simpler) for the UI package Storybook. Components that use `next/link`, `next/image`, or `next/font` break because these are Next.js-specific modules not available outside a Next.js context.

**Why it happens:** Storybook has a dedicated `@storybook/nextjs` framework adapter that mocks Next.js-specific modules (router, image optimization, navigation, font loading). If you use `@storybook/react-vite` instead, none of these mocks exist.

**Symptoms:**
- `Module not found: next/image` in Storybook
- `useRouter` throws "not inside a Next.js context" error
- `next/link` renders as a plain `<a>` without client-side navigation
- `next/font` CSS variables are undefined (fonts fall back to system fonts)

**Decision point for GlimmoraTeam:**

Since the UI package (`@glimmora/ui`) is supposed to be framework-agnostic primitives (Radix-based), it ideally should NOT use `next/link`, `next/image`, or `next/font` directly. This is the cleanest architecture:

- `@glimmora/ui` components are pure React + Radix + Tailwind. No Next.js imports.
- Apps (portals) compose UI components with Next.js features (wrapping Button in Link, using next/image, etc.)
- Storybook for `@glimmora/ui` uses `@storybook/react-vite` (fast, no Next.js dependency)

If components MUST use Next.js features (e.g., Image component for optimized images in cards), use `@storybook/nextjs`:

```typescript
// .storybook/main.ts
const config: StorybookConfig = {
  framework: {
    name: '@storybook/nextjs',
    options: {},
  },
};
```

**Recommendation:** Start with `@storybook/react-vite`. Keep `@glimmora/ui` Next.js-free. If you later need Next.js features in shared components, migrate to `@storybook/nextjs`.

**Phase relevance:** Phase 1 (Storybook setup decision).

**Confidence:** HIGH -- both Storybook frameworks are well-documented.

---

### MODERATE-7: Radix UI Styling Approach Without shadcn

**What goes wrong:** The developer spends excessive time building basic styled components (Button, Input, Dialog, Select, etc.) from Radix primitives + Tailwind because they chose "not shadcn." They effectively rebuild shadcn by hand, slower and with more bugs.

**Why it happens:** Radix UI primitives are intentionally unstyled. They provide accessibility and behavior, not appearance. shadcn/ui exists specifically to bridge this gap. Without it, every component requires: Radix primitive import, Tailwind styling, variant system (sizes, colors, states), focus/disabled states, and dark mode support. This is significant work.

**This is NOT a technical pitfall but a productivity pitfall.** The decision to skip shadcn is valid (it gives full design control, which this project needs for the warm/earthy brand), but the team must budget significant time for component development.

**Symptoms:**
- Phase 1 takes 3x longer than expected
- Components have inconsistent APIs (some use `variant` prop, others use `size`, naming varies)
- Accessibility gaps in custom implementations vs. what shadcn provides out of the box
- Focus rings, disabled states, loading states forgotten on some components

**Prevention:**

1. **Create a variant system upfront.** Use `class-variance-authority` (CVA) or `tailwind-variants` for consistent component API patterns:

```typescript
// packages/ui/src/components/button.tsx
'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from '@radix-ui/react-slot';
import { forwardRef } from 'react';

const buttonVariants = cva(
  // Base styles always applied
  'inline-flex items-center justify-center rounded-md font-body font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-primary-500 text-white hover:bg-primary-600 focus-visible:ring-primary-500',
        secondary: 'bg-sand-200 text-heading hover:bg-sand-300 focus-visible:ring-sand-400',
        ghost: 'hover:bg-sand-100 text-body',
        destructive: 'bg-red-600 text-white hover:bg-red-700',
      },
      size: {
        sm: 'h-8 px-3 text-sm',
        md: 'h-10 px-4 text-sm',
        lg: 'h-12 px-6 text-base',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={buttonVariants({ variant, size, className })}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';
```

2. **Create a component checklist template** for every new component:
   - [ ] All variants defined (CVA)
   - [ ] Focus visible styles
   - [ ] Disabled state styles
   - [ ] Keyboard navigation (Radix handles this)
   - [ ] ARIA attributes (Radix handles this)
   - [ ] Storybook story with all variants
   - [ ] TypeScript props interface exported

3. **Budget Phase 1 for ~15-20 core components** before any portal pages. This is the real cost of "not shadcn."

**Phase relevance:** Phase 1 (design system). This is the main time investment of Phase 1.

**Confidence:** HIGH -- well-understood tradeoff.

---

## Minor Pitfalls

Mistakes that cause annoyance or require small fixes.

---

### MINOR-1: Turborepo Cache Invalidation Confusion

**What goes wrong:** A developer changes a shared component in `@glimmora/ui` but the consuming app still shows the old version. They refresh, restart the dev server, but the change doesn't appear.

**Why it happens:** Turborepo aggressively caches task outputs. If the cache hash doesn't include the changed file (misconfigured `inputs` in `turbo.json`), Turborepo serves a stale cached result.

**Prevention:**
- For development (`turbo dev`), caching should be disabled (`"cache": false` in turbo.json for the dev task)
- For build, ensure `inputs` are not overly restrictive
- When in doubt: `turbo build --force` to bypass cache
- Turborepo's `--dry` flag shows what would be cached/restored

**Phase relevance:** All phases. Minor annoyance.

**Confidence:** HIGH.

---

### MINOR-2: ESLint Flat Config vs. Legacy Config in Monorepo

**What goes wrong:** Some packages use the new ESLint flat config (`eslint.config.js`) while others use legacy `.eslintrc.js`. ESLint behaves differently depending on which config format it finds. Shared ESLint configs don't load properly.

**Prevention:** Pick ONE format for the entire monorepo. Recommendation: use flat config (`eslint.config.js`) since it is the current standard. Create a shared config in `packages/config/eslint.config.js` that all apps and packages extend.

**Phase relevance:** Phase 1 (tooling setup).

**Confidence:** MEDIUM -- ESLint flat config ecosystem is still maturing.

---

### MINOR-3: Tailwind CSS `@apply` Not Working in Shared Package

**What goes wrong:** A component in `@glimmora/ui` uses `@apply` in a CSS module or inline style. It works in Storybook but fails in the consuming Next.js app.

**Why it happens:** `@apply` requires Tailwind's PostCSS plugin to be processing that CSS file. If the shared package's CSS is not processed by the app's PostCSS pipeline, `@apply` directives are passed through as-is (unknown at-rule).

**Prevention:** Avoid `@apply` in shared packages. Use Tailwind utility classes directly in `className` props. `@apply` is better suited for app-level global styles, not component libraries. The CVA/tailwind-variants approach (MODERATE-7) eliminates the need for `@apply` entirely.

**Phase relevance:** Phase 1 (design system).

**Confidence:** HIGH -- this is well-documented Tailwind behavior.

---

### MINOR-4: React Hook Form + Zod Types Not Inferred Across Package Boundaries

**What goes wrong:** Form schemas defined in `@glimmora/types` using Zod work locally but TypeScript inference breaks when consumed in app components. The `useForm<z.infer<typeof schema>>()` pattern loses type safety.

**Prevention:** Export both the Zod schema AND the inferred TypeScript type from the types package:

```typescript
// packages/types/src/forms/onboarding.ts
import { z } from 'zod';

export const onboardingSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  skills: z.array(z.string()).min(1),
});

export type OnboardingFormData = z.infer<typeof onboardingSchema>;
```

Then in the app:

```typescript
import { onboardingSchema, type OnboardingFormData } from '@glimmora/types';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const form = useForm<OnboardingFormData>({
  resolver: zodResolver(onboardingSchema),
});
```

**Phase relevance:** Phase 2+ (form-heavy portal pages).

**Confidence:** HIGH -- standard React Hook Form + Zod pattern.

---

### MINOR-5: MSW v2 API Syntax Change from v1

**What goes wrong:** Developer copies MSW handler examples from blog posts or Stack Overflow that use v1 syntax. The handlers silently fail or throw unfamiliar errors.

**Why it happens:** MSW v2 changed its API significantly:
- `rest.get()` became `http.get()`
- `req.body` access changed
- Response format changed from `res(ctx.json())` to `HttpResponse.json()`
- Import paths changed

**Prevention:**

MSW v1 (OLD -- DO NOT USE):
```typescript
import { rest } from 'msw';
export const handlers = [
  rest.get('/api/tasks', (req, res, ctx) => {
    return res(ctx.json({ tasks: [] }));
  }),
];
```

MSW v2 (CORRECT):
```typescript
import { http, HttpResponse } from 'msw';
export const handlers = [
  http.get('/api/tasks', () => {
    return HttpResponse.json({ tasks: [] });
  }),
];
```

**Rule:** When copying MSW examples, check for `rest.` vs `http.` -- that's the instant tell for v1 vs v2.

**Phase relevance:** Phase 1 (MSW setup) and ongoing.

**Confidence:** HIGH -- MSW v2 migration guide is well-documented.

---

### MINOR-6: Environment Variables Not Shared Across Turborepo Apps

**What goes wrong:** An environment variable like `NEXT_PUBLIC_API_URL` is set in one app's `.env.local` but not others. Or the developer creates a root `.env` expecting Turborepo to distribute it to all apps.

**Why it happens:** Turborepo does NOT automatically share environment variables across packages. Each Next.js app reads its own `.env*` files from its own directory. A root `.env` is NOT automatically loaded by Next.js apps in subdirectories.

**Prevention:**

1. Create `.env.local` in each app directory that needs environment variables
2. For shared variables, use a root `.env` file and configure Turborepo's `globalEnv` and `globalPassThroughEnv` in `turbo.json`:

```json
{
  "globalEnv": ["NODE_ENV"],
  "globalPassThroughEnv": ["NEXT_PUBLIC_API_URL"]
}
```

3. For this mock-only project, minimize environment variables. The API URL should be relative (`/api/*`) since MSW intercepts at the network level.

**Phase relevance:** Phase 1 (monorepo setup).

**Confidence:** HIGH -- standard Turborepo behavior.

---

## Phase-Specific Warnings

| Phase | Topic | Likely Pitfall | Severity | Mitigation |
|-------|-------|---------------|----------|------------|
| Phase 1 | Monorepo setup | Tailwind content paths (CRITICAL-2) | Critical | Validate with one Button component immediately |
| Phase 1 | Monorepo setup | Turborepo task dependencies (MODERATE-3) | Moderate | Use internal packages (no build step), configure turbo.json |
| Phase 1 | Monorepo setup | Port conflicts (MODERATE-4) | Moderate | Assign explicit ports in package.json scripts |
| Phase 1 | Design system | `"use client"` boundary placement (CRITICAL-3) | Critical | Mark each Radix component file individually |
| Phase 1 | Design system | Custom font loading (CRITICAL-5) | Critical | Test font rendering in both Next.js AND Storybook early |
| Phase 1 | Design system | Storybook package resolution (CRITICAL-4) | Critical | Validate Storybook with first component before building more |
| Phase 1 | Design system | Building Radix components without shadcn (MODERATE-7) | Moderate | Use CVA, create component checklist, budget adequate time |
| Phase 1 | MSW setup | Dual runtime initialization (CRITICAL-1) | Critical | Set up both browser AND server MSW from day one |
| Phase 1 | MSW setup | Handler shape consistency (CRITICAL-6) | Critical | Single shared handlers package typed against @glimmora/types |
| Phase 1 | MSW setup | v2 syntax (MINOR-5) | Minor | Only use official MSW v2 docs, never copy v1 examples |
| Phase 2+ | Portal pages | Framer Motion in Server Components (MODERATE-1) | Moderate | Use @glimmora/ui animation wrappers |
| Phase 2+ | Portal pages | TanStack Query hydration (MODERATE-2) | Moderate | Client-only fetching for mock phase; add hydration when backend arrives |
| Phase 2+ | Form pages | Zod type inference across packages (MINOR-4) | Minor | Export both schema and inferred type |
| All | Development | Cache invalidation confusion (MINOR-1) | Minor | Disable cache for dev, use --force when confused |
| All | Tooling | ESLint config format (MINOR-2) | Minor | Pick flat config, use it everywhere |
| All | Tooling | TypeScript path aliases (MODERATE-5) | Moderate | Minimize aliases, prefer package names for cross-package imports |

---

## Pre-Flight Checklist: Phase 1 "Smoke Test" Sequence

Before building any portal pages, verify this exact sequence works end-to-end. Each step validates that a critical pitfall has been prevented.

```
1. CREATE a Button component in @glimmora/ui using Radix Slot + Tailwind + CVA
   - Must have "use client" at top
   - Validates: CRITICAL-3 (client boundary), MODERATE-7 (CVA pattern)

2. RENDER Button in packages/ui Storybook
   - Button must appear styled with correct Tailwind classes
   - Button must use Miller Display or Avenir font (if applicable)
   - Validates: CRITICAL-4 (Storybook resolution), CRITICAL-5 (fonts in Storybook)

3. IMPORT Button into apps/women-portal/app/page.tsx
   - Page must render styled Button on hard refresh (not just client nav)
   - Validates: CRITICAL-2 (Tailwind content paths), MODERATE-3 (build order)

4. ADD an MSW handler for GET /api/health that returns { status: "ok" }
   - Create handler in packages/mocks
   - Fetch from a client component in women-portal
   - Verify mock response appears
   - Validates: CRITICAL-1 (MSW dual runtime), CRITICAL-6 (shared handlers)

5. RUN turbo dev and verify women-portal on port 3001
   - Validates: MODERATE-4 (port assignment)

6. RUN turbo build successfully
   - Validates: MODERATE-3 (task dependencies), MODERATE-5 (TS aliases)
```

If all 6 steps pass, the infrastructure is solid and portal development can begin safely.

---

## Sources and Confidence Notes

All findings in this document are based on training data (knowledge cutoff May 2025). WebSearch and WebFetch were unavailable for real-time verification.

**HIGH confidence findings** (well-established, widely documented, unlikely to have changed):
- Tailwind content paths behavior (CRITICAL-2)
- `"use client"` boundary requirements (CRITICAL-3)
- Turborepo internal package patterns (MODERATE-3)
- Port configuration (MODERATE-4)
- MSW v2 API syntax (MINOR-5)
- Environment variable scoping (MINOR-6)

**MEDIUM confidence findings** (established patterns but specific API details may have evolved):
- MSW + Next.js `instrumentation.ts` pattern (CRITICAL-1) -- verify against current Next.js docs whether `instrumentationHook` is still experimental or stable
- `next/font/local` cross-package sharing (CRITICAL-5) -- verify whether `next/font/local` can be imported from an external Turborepo package in the current Next.js version
- Storybook 8 framework adapter specifics (CRITICAL-4, MODERATE-6) -- verify exact `@storybook/nextjs` vs `@storybook/react-vite` configuration syntax
- TanStack Query v5 hydration API (MODERATE-2) -- verify current recommended pattern

**Recommendations for verification:**
- Before Phase 1 implementation, spend 30 minutes checking the official docs for: MSW Next.js recipe, Next.js instrumentation API, Storybook 8 Next.js framework setup, TanStack Query v5 SSR guide
- The Pre-Flight Checklist (above) will empirically validate all critical pitfalls regardless of documentation currency
