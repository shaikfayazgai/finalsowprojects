/**
 * Meridian semantic → Tailwind utility class map.
 *
 * Each entry maps a semantic role to the CSS variable from tokens.css.
 * This file is the contract that lets components write
 *   `bg-surface text-primary border-default shadow-md`
 * and have the right Meridian value resolve at runtime, regardless of
 * theme.
 *
 * The Tailwind preset (tailwind.preset.ts) consumes this map and
 * generates the utilities. Components NEVER reference raw CSS vars
 * inline — they use the semantic class names.
 */

export const semanticColorMap = {
  // Surfaces
  bg: "var(--color-bg)",
  "bg-subtle": "var(--color-bg-subtle)",
  surface: "var(--color-surface)",
  "surface-raised": "var(--color-surface-raised)",
  "surface-sunken": "var(--color-surface-sunken)",
  "surface-hover": "var(--color-surface-hover)",
  "surface-inverse": "var(--color-surface-inverse)",
  overlay: "var(--color-overlay)",

  // Text
  primary: "var(--color-text)", // semantic text — primary content
  "text-primary": "var(--color-text)",
  "text-secondary": "var(--color-text-secondary)",
  "text-tertiary": "var(--color-text-tertiary)",
  "text-disabled": "var(--color-text-disabled)",
  "text-inverse": "var(--color-text-inverse)",
  "text-link": "var(--color-text-link)",
  "text-on-primary": "var(--color-text-on-primary)",
  "text-on-warm": "var(--color-text-on-warm)",

  // Stroke
  "stroke-subtle": "var(--color-stroke-subtle)",
  stroke: "var(--color-stroke)",
  "stroke-strong": "var(--color-stroke-strong)",
  "stroke-focus": "var(--color-stroke-focus)",

  // Brand — Primary
  brand: "var(--color-primary)",
  "brand-hover": "var(--color-primary-hover)",
  "brand-active": "var(--color-primary-active)",
  "brand-subtle": "var(--color-primary-subtle)",
  "brand-subtle-text": "var(--color-primary-subtle-text)",
  "on-brand": "var(--color-on-primary)",

  // Brand — Secondary
  "brand-secondary": "var(--color-secondary)",
  "brand-secondary-hover": "var(--color-secondary-hover)",
  "brand-secondary-subtle": "var(--color-secondary-subtle)",
  "brand-secondary-subtle-text": "var(--color-secondary-subtle-text)",
  "on-brand-secondary": "var(--color-on-secondary)",

  // Brand — Tertiary
  "brand-tertiary": "var(--color-tertiary)",
  "brand-tertiary-strong": "var(--color-tertiary-strong)",
  "brand-tertiary-hover": "var(--color-tertiary-hover)",
  "brand-tertiary-subtle": "var(--color-tertiary-subtle)",
  "brand-tertiary-subtle-text": "var(--color-tertiary-subtle-text)",
  "on-brand-tertiary": "var(--color-on-tertiary)",

  // Status — Success
  success: "var(--color-success)",
  "success-solid": "var(--color-success-solid)",
  "success-subtle": "var(--color-success-subtle)",
  "success-text": "var(--color-success-text)",
  "success-border": "var(--color-success-border)",

  // Status — Warning
  warning: "var(--color-warning)",
  "warning-solid": "var(--color-warning-solid)",
  "warning-subtle": "var(--color-warning-subtle)",
  "warning-text": "var(--color-warning-text)",
  "warning-border": "var(--color-warning-border)",

  // Status — Error
  error: "var(--color-error)",
  "error-solid": "var(--color-error-solid)",
  "error-subtle": "var(--color-error-subtle)",
  "error-text": "var(--color-error-text)",
  "error-border": "var(--color-error-border)",

  // Status — Info
  info: "var(--color-info)",
  "info-solid": "var(--color-info-solid)",
  "info-subtle": "var(--color-info-subtle)",
  "info-text": "var(--color-info-text)",
  "info-border": "var(--color-info-border)",

  // State layers (apply as background or border-ring)
  "state-hover": "var(--state-hover)",
  "state-pressed": "var(--state-pressed)",
  "state-selected": "var(--state-selected)",
  "state-focus-ring": "var(--state-focus-ring)",
} as const;

export const semanticShadowMap = {
  xs: "var(--shadow-xs)",
  sm: "var(--shadow-sm)",
  md: "var(--shadow-md)",
  lg: "var(--shadow-lg)",
  xl: "var(--shadow-xl)",
  "2xl": "var(--shadow-2xl)",
  inner: "var(--shadow-inner)",
  "glow-primary": "var(--shadow-glow-primary)",
  "glow-ink": "var(--shadow-glow-ink)",
} as const;

export const semanticRadiusMap = {
  none: "var(--radius-none)",
  xs: "var(--radius-xs)",
  sm: "var(--radius-sm)",
  md: "var(--radius-md)",
  lg: "var(--radius-lg)",
  xl: "var(--radius-xl)",
  "2xl": "var(--radius-2xl)",
  "3xl": "var(--radius-3xl)",
  "4xl": "var(--radius-4xl)",
  full: "var(--radius-full)",
} as const;

export const semanticGradientMap = {
  primary: "var(--gradient-primary)",
  secondary: "var(--gradient-secondary)",
  meridian: "var(--gradient-meridian)",
  mesh: "var(--gradient-mesh)",
  head: "var(--gradient-head)",
} as const;

export const semanticFontMap = {
  display: "var(--font-display)",
  body: "var(--font-body)",
  mono: "var(--font-mono)",
} as const;
