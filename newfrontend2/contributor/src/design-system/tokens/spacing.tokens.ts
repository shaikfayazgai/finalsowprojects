/**
 * Meridian spacing scale — strict, no arbitrary values.
 *
 * Components must consume named steps (`spacing-4`, `spacing-12`,
 * `spacing-24`) instead of writing arbitrary px values. The scale is
 * built around a 4px base unit so it composes cleanly across grids,
 * card paddings, and section rhythm.
 *
 * Mapping to Tailwind utilities is in tailwind.preset.ts.
 */

export const spacing = {
  0: "0px",
  px: "1px",
  0.5: "2px",
  1: "4px",
  1.5: "6px",
  2: "8px",
  2.5: "10px",
  3: "12px",
  3.5: "14px",
  4: "16px",
  5: "20px",
  6: "24px",
  7: "28px",
  8: "32px",
  9: "36px",
  10: "40px",
  12: "48px",
  14: "56px",
  16: "64px",
  20: "80px",
  24: "96px",
  28: "112px",
  32: "128px",
  36: "144px",
  40: "160px",
  48: "192px",
  56: "224px",
  64: "256px",
  72: "288px",
  80: "320px",
} as const;

/** Container max-widths — for page-level wrappers. */
export const container = {
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1180px", // Meridian editorial wrap
  "2xl": "1280px",
  "3xl": "1440px",
  prose: "65ch",
} as const;

export type SpacingToken = keyof typeof spacing;
