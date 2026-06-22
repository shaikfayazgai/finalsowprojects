/**
 * Meridian shadow / elevation scale.
 *
 * The shadow values themselves are theme-dependent — see semantic.tokens.ts
 * for the actual color stops per theme. This file defines the *semantic
 * elevation roles* components should ask for.
 *
 * Mapping (consumed via CSS variables):
 *   xs              — subtle lift (hover hint on rows)
 *   sm              — cards
 *   md              — dropdowns, action chips
 *   lg              — popovers, drawer surfaces
 *   xl              — modals
 *   2xl             — dialogs, full-screen sheets
 *   inner           — sunken surfaces (inputs, sliders)
 *   glow-primary    — saffron emphasis (primary CTAs)
 *   glow-ink        — ink emphasis (secondary surfaces)
 */

export type ShadowToken =
  | "xs"
  | "sm"
  | "md"
  | "lg"
  | "xl"
  | "2xl"
  | "inner"
  | "glow-primary"
  | "glow-ink";

export const shadowVariableName: Record<ShadowToken, string> = {
  xs: "--shadow-xs",
  sm: "--shadow-sm",
  md: "--shadow-md",
  lg: "--shadow-lg",
  xl: "--shadow-xl",
  "2xl": "--shadow-2xl",
  inner: "--shadow-inner",
  "glow-primary": "--shadow-glow-primary",
  "glow-ink": "--shadow-glow-ink",
};
