/**
 * Meridian design system — public surface.
 *
 *   import { ThemeProvider, useTheme } from "@/design-system";
 *   import { meridianPrimitive, daybook, nocturne } from "@/design-system";
 *   import { color, shadow, transition } from "@/design-system";
 */

export * from "./tokens";
// `themes` re-exports a narrower ThemeName ("light" | "dark") for component
// consumption; the broader semantic ThemeName from tokens is internal.
export { ThemeProvider, useTheme } from "./themes";
export type { ThemeName } from "./themes";
// `utilities` helpers — avoid namespace collision on `radius` from tokens.
export {
  color,
  shadow,
  gradient,
  space,
  transition,
  type SemanticColorToken,
  type SemanticShadowToken,
  type SemanticRadiusToken,
  type SemanticGradientToken,
  type SemanticSpacingToken,
} from "./tailwind/utilities";
export * from "./tailwind/semantic-mapping";
export { default as meridianTailwindPreset } from "./tailwind/tailwind.preset";
