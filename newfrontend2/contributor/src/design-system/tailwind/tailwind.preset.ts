/**
 * Meridian Tailwind preset — semantic utility surface.
 *
 * Components write `bg-surface`, `text-primary`, `border-default`,
 * `shadow-md`, `rounded-2xl` — and the preset wires those utilities
 * to the Meridian CSS variables. Theme swap is a single attribute
 * change; every utility re-resolves automatically.
 *
 * NOTE: This codebase uses Tailwind 4 (`@theme` directive in CSS).
 * This file mirrors the same semantic surface as a JS preset for any
 * tooling / IDE plugins that read tailwind.config.* statically.
 * Runtime utilities come from the `@theme` block in tokens.css.
 */

import type { Config } from "tailwindcss";
import {
  semanticColorMap,
  semanticShadowMap,
  semanticRadiusMap,
  semanticGradientMap,
} from "./semantic-mapping";
import { spacing, container } from "../tokens/spacing.tokens";
import { typographyScale, fontWeight } from "../tokens/typography.tokens";
import { duration, easing } from "../tokens/motion.tokens";
import { zIndex } from "../tokens/zindex.tokens";

const meridianPreset: Partial<Config> = {
  theme: {
    extend: {
      colors: semanticColorMap,
      boxShadow: semanticShadowMap,
      borderRadius: semanticRadiusMap,
      backgroundImage: semanticGradientMap,
      fontFamily: {
        display: ["var(--font-display)"],
        body: ["var(--font-body)"],
        mono: ["var(--font-mono)"],
        sans: ["var(--font-body)"],
        serif: ["var(--font-display)"],
      },
      fontWeight: fontWeight,
      fontSize: Object.fromEntries(
        Object.entries(typographyScale).map(([key, step]) => [
          key,
          [
            step.fontSize,
            {
              lineHeight: step.lineHeight,
              letterSpacing: step.letterSpacing,
              fontWeight: String(step.fontWeight),
            },
          ],
        ]),
      ),
      spacing: spacing,
      maxWidth: container,
      transitionDuration: {
        instant: duration.instant.replace("ms", ""),
        fast: duration.fast.replace("ms", ""),
        base: duration.base.replace("ms", ""),
        slow: duration.slow.replace("ms", ""),
        xslow: duration.xslow.replace("ms", ""),
      },
      transitionTimingFunction: {
        standard: easing.standard,
        "in-out": easing.inOut,
        emphasized: easing.emphasized,
      },
      zIndex: Object.fromEntries(
        Object.entries(zIndex).map(([key, value]) => [key, String(value)]),
      ),
    },
  },
};

export default meridianPreset;
