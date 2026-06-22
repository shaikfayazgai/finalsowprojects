# Meridian — Design System Foundation

**Status:** Phase 1 (Foundation Layer) — shipped.
**Phases 2–5** (primitives, data display, workflow, portal migration) are scoped but not yet executed.

The Meridian design system is the single source of truth for color, typography, spacing, elevation, motion, and theme in the GlimmoraTeam platform. It is governed (no arbitrary values), token-driven (everything resolves through CSS variables), and theme-aware (Daybook ↔ Nocturne via a single attribute swap on `<html>`).

---

## What shipped in Phase 1

| Layer | File | Role |
|---|---|---|
| **Primitives** | `tokens/primitive.tokens.ts` | Raw Meridian ramps — bone, saffron, ink, verdigris, leaf, amber, claret, steel + data-viz palette. Never consumed directly by components. |
| **Semantic tokens** | `tokens/semantic.tokens.ts` | The layer components consume. Surface · Text · Stroke · Brand (primary/secondary/tertiary) · Status (success/warning/error/info × base/solid/subtle/text/border) · Interaction state · Gradient · Shadow. Both themes defined. |
| **Typography** | `tokens/typography.tokens.ts` | 13-step scale: display-xl/lg, heading-xl/lg/md/sm, body-lg/md/sm, caption, label-xs, mono-sm/xs, display-italic. Fluid clamp() at the display tier. Three families: Fraunces / Hanken Grotesk / JetBrains Mono. |
| **Spacing** | `tokens/spacing.tokens.ts` | 4px-base scale (0 → 80) + container widths (sm → 3xl + prose). |
| **Radius** | `tokens/radius.tokens.ts` | xs (4) → 4xl (28) + full. 2xl = canonical card. |
| **Shadow** | `tokens/shadow.tokens.ts` | Semantic elevation roles. Theme-aware values live in `semantic.tokens.ts`. |
| **Motion** | `tokens/motion.tokens.ts` | 5 durations × 4 easings + 6 named presets (hover, pressFeedback, shadowLift, pageMount, modalIn, drawerSlide). |
| **z-index** | `tokens/zindex.tokens.ts` | Named stacking roles (below → critical) — no raw `z-50`. |
| **Theme system** | `themes/provider.tsx` | React `<ThemeProvider>` + `useTheme()` hook. Persists to localStorage. Respects OS `prefers-color-scheme` on first visit. |
| **CSS variables** | `styles/tokens.css` | Runtime source of truth — primitives + Daybook + Nocturne. Theme swap = `<html data-theme="dark">`. |
| **Tailwind preset** | `tailwind/tailwind.preset.ts` | Semantic utility surface (`bg-surface`, `text-primary`, `border-stroke`, `shadow-md`, etc.) for tooling/IDE plugins. Runtime utilities come from the `@theme` block in `globals.css`. |
| **Semantic mapping** | `tailwind/semantic-mapping.ts` | The contract between semantic class names and CSS variables. |
| **Utility helpers** | `tailwind/utilities.ts` | `color()`, `shadow()`, `radius()`, `gradient()`, `space()`, `transition()` for runtime composition (chart libs, canvas, animation keyframes). |

---

## How components consume the system

### Preferred — Tailwind utilities

```tsx
<div className="bg-surface text-primary border border-stroke rounded-2xl shadow-md p-6">
  <h2 className="font-display text-heading-lg text-primary">Workforce utilization</h2>
  <p className="font-body text-body-md text-text-secondary mt-2">
    Active contributors across 12 SOW pipelines
  </p>
  <button className="bg-brand text-on-brand rounded-lg px-4 py-2 shadow-glow-primary
                     hover:bg-brand-hover transition-colors duration-fast ease-standard">
    Form team
  </button>
</div>
```

### When utilities aren't enough — TypeScript helpers

```tsx
import { color, shadow, transition } from "@/design-system";

<canvas style={{
  background: color("surface"),
  boxShadow: shadow("md"),
  transition: transition(["transform", "opacity"], "base", "standard"),
}} />
```

### Theme awareness

```tsx
"use client";
import { useTheme } from "@/design-system";

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <button onClick={toggleTheme} className="bg-surface border border-stroke">
      {theme === "light" ? "Nocturne" : "Daybook"}
    </button>
  );
}
```

Wrap your root layout once:

```tsx
import { ThemeProvider } from "@/design-system";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
```

---

## Hard rules

These are governance — violations should be PR-blocked.

1. **No raw hex values inside components.** If a color isn't in the semantic layer, it doesn't exist.
2. **No arbitrary Tailwind colors** (`bg-zinc-500`, `text-slate-700`). All color utilities must resolve to a Meridian semantic token.
3. **No raw px spacing.** Use spacing-scale steps (`p-4`, `mt-12`, etc., mapped to the Meridian scale).
4. **No raw `box-shadow:` declarations.** Use the shadow token (`shadow-md`, `shadow-glow-primary`).
5. **No raw `z-index:` numbers.** Use named z-index tokens.
6. **No raw animation durations/easings.** Use `duration-fast` / `ease-standard` etc.
7. **Components consume semantic tokens, never primitives.** `bg-brand` not `bg-saffron-400`.
8. **One canonical card radius.** `rounded-2xl` everywhere. Other radii are for specific roles (chips, pills).
9. **Three font families, no exceptions.** Fraunces (display) · Hanken Grotesk (body) · JetBrains Mono (technical).

---

## Migration strategy from the existing palette

The existing platform uses `brown / beige / teal / forest / gold` Tailwind colors. These remain functional during the migration window. New components should use Meridian semantic tokens. Legacy mappings:

| Legacy class | Meridian replacement | Notes |
|---|---|---|
| `bg-brown-600` | `bg-brand-active` or `bg-saffron-600` (primitive) | Brown was the saffron accent at lower steps |
| `bg-beige-50` | `bg-bg-subtle` or `bg-bone-50` | Beige is the bone family |
| `text-brown-700` | `text-text-secondary` or `text-saffron-700` | Match the role |
| `border-beige-200` | `border-stroke` | Canonical default stroke |
| `text-teal-700` | `text-brand-tertiary-strong` | Teal = verdigris in Meridian |
| `text-forest-700` | `text-success-text` | Forest was used as success accent |
| `text-gold-700` | `text-warning-text` | Gold was used as warning accent |
| `bg-white` | `bg-surface` | Theme-aware (becomes warm ink in Nocturne) |
| `bg-black/55` | `bg-overlay` | Modal scrim |
| `shadow-[0_2px_8px_-4px_rgba(166,119,99,0.25)]` | `shadow-md` | One canonical mid elevation |

Migration is **per-component, not per-page** — extract a primitive once, use it everywhere.

---

## Phase 2–5 (next)

The next phases build on this foundation. None of them require new design tokens.

| Phase | Scope | Effort |
|---|---|---|
| **Phase 2** | Primitives (Button, Input, Select, Card, Modal, Drawer, Sheet, Popover, Toast, EmptyState, Skeleton) using CVA + the semantic mapping | ~1-2 wk |
| **Phase 3** | Data display (EnterpriseTable, DataGrid, KPI cards, Timeline, ActivityFeed, AuditLog) | ~1-2 wk |
| **Phase 4** | Workflow + AI components (multi-step shell, stage indicators, approval rail, diff viewer, AIRecommendationCard, AIConfidenceIndicator, AIReasoningPanel) | ~1-2 wk |
| **Phase 5** | Portal-by-portal migration (Enterprise → Contributor → Mentor → Reviewer) onto the new primitives | ~3-4 wk |

---

## File map

```
src/design-system/
├── index.ts                       # Public surface
├── README.md                      # This file
├── tokens/
│   ├── index.ts                   # Barrel
│   ├── primitive.tokens.ts        # Meridian ramps
│   ├── semantic.tokens.ts         # Daybook + Nocturne semantic maps
│   ├── typography.tokens.ts       # 13-step type scale
│   ├── spacing.tokens.ts          # 4px-base scale + containers
│   ├── radius.tokens.ts           # Radius scale
│   ├── shadow.tokens.ts           # Semantic elevation roles
│   ├── motion.tokens.ts           # Duration + easing + presets
│   └── zindex.tokens.ts           # Named stacking
├── themes/
│   ├── index.ts                   # Barrel
│   └── provider.tsx               # <ThemeProvider> + useTheme()
├── tailwind/
│   ├── tailwind.preset.ts         # JS preset for IDE tooling
│   ├── semantic-mapping.ts        # Semantic name → CSS var contract
│   └── utilities.ts               # color(), shadow(), transition() helpers
└── styles/
    └── tokens.css                 # Primitive + Daybook + Nocturne CSS variables
```

Source of truth: `glimmora-meridian-color-system.html` v1.0.
