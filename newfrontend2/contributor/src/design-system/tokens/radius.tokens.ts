/**
 * Meridian radius scale.
 *
 * Editorial-grade rounding — never childish, never sharp. The 2xl
 * (16px) is the canonical card radius; xs (4px) is for chips +
 * badges; full is for pills + circular icons.
 */

export const radius = {
  none: "0px",
  xs: "4px",
  sm: "6px",
  md: "8px",
  lg: "10px",
  xl: "12px",
  "2xl": "16px",
  "3xl": "20px",
  "4xl": "28px",
  full: "9999px",
} as const;

export type RadiusToken = keyof typeof radius;
