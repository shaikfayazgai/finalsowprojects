/**
 * Meridian utility helpers — runtime composition of token values.
 *
 * For cases where Tailwind utilities aren't enough (animation
 * keyframes, dynamic style props, chart libraries, canvas), use these
 * helpers to look up token values by semantic name.
 */

import {
  semanticColorMap,
  semanticShadowMap,
  semanticRadiusMap,
  semanticGradientMap,
} from "./semantic-mapping";
import { spacing } from "../tokens/spacing.tokens";
import { duration, easing } from "../tokens/motion.tokens";

export type SemanticColorToken = keyof typeof semanticColorMap;
export type SemanticShadowToken = keyof typeof semanticShadowMap;
export type SemanticRadiusToken = keyof typeof semanticRadiusMap;
export type SemanticGradientToken = keyof typeof semanticGradientMap;
export type SemanticSpacingToken = keyof typeof spacing;

/** Resolve a semantic color token to its CSS var() reference. */
export function color(token: SemanticColorToken): string {
  return semanticColorMap[token];
}

/** Resolve a semantic shadow token. */
export function shadow(token: SemanticShadowToken): string {
  return semanticShadowMap[token];
}

/** Resolve a semantic radius token. */
export function radius(token: SemanticRadiusToken): string {
  return semanticRadiusMap[token];
}

/** Resolve a semantic gradient token. */
export function gradient(token: SemanticGradientToken): string {
  return semanticGradientMap[token];
}

/** Resolve a spacing scale step to its px value. */
export function space(token: SemanticSpacingToken): string {
  return spacing[token];
}

/** Compose a transition string from semantic motion tokens. */
export function transition(
  property: string | string[],
  durationToken: keyof typeof duration = "base",
  easingToken: keyof typeof easing = "standard",
): string {
  const props = Array.isArray(property) ? property : [property];
  return props
    .map((p) => `${p} ${duration[durationToken]} ${easing[easingToken]}`)
    .join(", ");
}
