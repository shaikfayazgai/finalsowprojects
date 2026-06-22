/**
 * Glimmora primitive color tokens — the lowest layer of the design system.
 *
 * These are RAW values. They are NOT consumed directly by components.
 * Components consume semantic tokens (semantic.tokens.ts) which map to
 * these primitives. Renaming a primitive must never break a component;
 * only the semantic layer should be edited.
 *
 * Source of truth: glimmora-azure-color-system.html v1.0.
 *
 * Ramps:
 *   - slate       — cool, faintly blue-tinted neutrals (the neutral family)
 *   - blue        — primary action, cobalt SaaS blue
 *   - violet      — secondary, premium AI / orchestration accent
 *   - cyan        — tertiary, fresh accent for data / workforce intelligence
 *   - green       — success
 *   - amber       — warning
 *   - red         — error
 *   - sky         — info (kept clearly distinct from cobalt primary)
 *
 * Renamed from the prior Meridian warm-editorial palette:
 *   bone → slate · saffron → blue · ink → folded into slate dark
 *   verdigris → cyan · leaf → green · claret → red · steel → sky
 *
 * The `Meridian` prefix is preserved on the TypeScript symbol so the
 * existing import surface (`meridianPrimitive`, `MeridianPrimitive`)
 * stays stable across the migration.
 */

export const meridianPrimitive = {
  white: "#ffffff",
  black: "#000000",

  // Slate — cool, faintly blue-tinted neutrals (14 stops, includes 0 and 1000
  // for extended editorial depth in dark mode).
  slate: {
    0: "#ffffff",
    50: "#f6f8fb",
    100: "#eef1f6",
    200: "#e0e5ee",
    300: "#c8d0de",
    400: "#9aa6bd",
    500: "#6c7891",
    600: "#515c74",
    700: "#3b4458",
    800: "#28303f",
    850: "#1f2632",
    900: "#161c26",
    950: "#0e131b",
    1000: "#080b10",
  },

  // Blue — primary action, cobalt SaaS blue
  blue: {
    50: "#eef3ff",
    100: "#dbe5ff",
    200: "#bdd0ff",
    300: "#92b2ff",
    400: "#5e8bfb",
    500: "#3a6bf4",
    600: "#2353e0",
    700: "#1c41b8",
    800: "#1b3893",
    900: "#1b3375",
    950: "#111e47",
  },

  // Violet — secondary, premium AI / orchestration accent
  violet: {
    50: "#f3eefe",
    100: "#e7dcfd",
    200: "#d0bcfb",
    300: "#b491f7",
    400: "#9a6bf0",
    500: "#844fe6",
    600: "#6f3bd1",
    700: "#5a2faa",
    800: "#4a2887",
    900: "#3e236d",
    950: "#28154a",
  },

  // Cyan — tertiary, fresh accent for data / workforce intelligence
  cyan: {
    50: "#e8fbfd",
    100: "#c4f4f9",
    200: "#8ee7f1",
    300: "#4fd3e3",
    400: "#20b8cd",
    500: "#0c9bb0",
    600: "#0a7d92",
    700: "#0c6475",
    800: "#0f505e",
    900: "#11424e",
    950: "#052831",
  },

  // Green — success
  green: {
    50: "#e7f7ee",
    100: "#c5ecd5",
    200: "#92dbb0",
    300: "#57c487",
    400: "#2fac65",
    500: "#149150",
    600: "#0d7942",
    700: "#0b5e34",
    800: "#0a4b2c",
    900: "#093e26",
  },

  // Amber — warning
  amber: {
    50: "#fdf3e0",
    100: "#f9e1b3",
    200: "#f3c570",
    300: "#edab38",
    400: "#e0951d",
    500: "#c47d14",
    600: "#9d6310",
    700: "#794d10",
    800: "#613e10",
    900: "#503310",
  },

  // Red — error
  red: {
    50: "#fdecec",
    100: "#fbd2d4",
    200: "#f5a6aa",
    300: "#ee787f",
    400: "#e5505a",
    500: "#d93745",
    600: "#c02436",
    700: "#9d1c2e",
    800: "#7d1927",
    900: "#681622",
  },

  // Sky — info (clearly distinct from cobalt primary)
  sky: {
    50: "#e6f4fe",
    100: "#c4e6fc",
    200: "#92d2f9",
    300: "#57b6f3",
    400: "#2f9ae8",
    500: "#1683d6",
    600: "#0f6ab4",
    700: "#105690",
    800: "#124675",
    900: "#123a61",
  },

  // Data-visualization palette — eight harmonized hues for analytics &
  // workforce-intelligence dashboards. Drawn from the Azure system + one
  // off-system pink to round out chart distinction.
  dataViz: {
    1: "#2353e0", // blue-600
    2: "#0c9bb0", // cyan-500
    3: "#844fe6", // violet-500
    4: "#149150", // green-500
    5: "#e0951d", // amber-400
    6: "#d93745", // red-500
    7: "#1683d6", // sky-500
    8: "#e1568f", // pink (chart-only, off-system)
  },
} as const;

export type MeridianPrimitive = typeof meridianPrimitive;
