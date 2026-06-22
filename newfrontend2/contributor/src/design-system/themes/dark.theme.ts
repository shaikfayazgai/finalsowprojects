/**
 * Azure Night — Glimmora dark theme.
 *
 * Cinematic navy/slate (NOT pure black, NOT cyberpunk). Cobalt primary
 * remains the action color (steps brighter for legibility); violet
 * carries the AI/orchestration layer; cyan provides data freshness.
 *
 * Semantic tokens resolve to Azure primitives via CSS variables defined
 * in styles/themes.css. Migrated from the prior warm-ink Nocturne
 * mapping (saffron/bone/verdigris). The exported symbol name
 * (`darkTheme`) is preserved.
 */

import type { SemanticTokens } from "./meridian.theme";

export const darkTheme: SemanticTokens = {
  surface: {
    bg: "#0b0f17",
    bgSubtle: "#080c12",
    surface: "#121826",
    surfaceRaised: "#1a2233",
    surfaceSunken: "#0b0f17",
    surfaceHover: "#1a2233",
    surfaceInverse: "var(--c-slate-50)",
    overlay: "rgba(2,4,8,.66)",
  },
  text: {
    primary: "#e8edf6",
    secondary: "#aab6cc",
    tertiary: "#76839b",
    disabled: "#495569",
    inverse: "#121826",
    link: "var(--c-blue-300)",
    onPrimary: "#ffffff",
    onWarm: "var(--c-slate-900)",
  },
  stroke: {
    subtle: "rgba(255,255,255,.06)",
    base: "rgba(255,255,255,.10)",
    strong: "rgba(255,255,255,.16)",
    focus: "var(--c-blue-400)",
  },
  brand: {
    primary: "var(--c-blue-500)",
    primaryHover: "var(--c-blue-400)",
    primaryActive: "var(--c-blue-600)",
    primarySubtle: "rgba(58,107,244,.16)",
    primarySubtleText: "var(--c-blue-300)",
    onPrimary: "#ffffff",
    secondary: "var(--c-violet-400)",
    secondaryHover: "var(--c-violet-300)",
    secondarySubtle: "rgba(132,79,230,.18)",
    secondarySubtleText: "var(--c-violet-200)",
    onSecondary: "var(--c-slate-950)",
    tertiary: "var(--c-cyan-400)",
    tertiaryStrong: "var(--c-cyan-300)",
    tertiaryHover: "var(--c-cyan-300)",
    tertiarySubtle: "rgba(12,155,176,.18)",
    tertiarySubtleText: "var(--c-cyan-200)",
    onTertiary: "var(--c-slate-950)",
  },
  status: {
    success: {
      base: "var(--c-green-300)",
      solid: "var(--c-green-600)",
      subtle: "rgba(20,145,80,.16)",
      text: "#7bd6a4",
      border: "rgba(20,145,80,.34)",
    },
    warning: {
      base: "var(--c-amber-300)",
      solid: "var(--c-amber-400)",
      subtle: "rgba(196,125,20,.18)",
      text: "var(--c-amber-200)",
      border: "rgba(196,125,20,.36)",
    },
    error: {
      base: "var(--c-red-300)",
      solid: "var(--c-red-500)",
      subtle: "rgba(217,55,69,.18)",
      text: "var(--c-red-200)",
      border: "rgba(217,55,69,.36)",
    },
    info: {
      base: "var(--c-sky-300)",
      solid: "var(--c-sky-500)",
      subtle: "rgba(22,131,214,.18)",
      text: "var(--c-sky-200)",
      border: "rgba(22,131,214,.36)",
    },
  },
  state: {
    hover: "rgba(255,255,255,.05)",
    pressed: "rgba(255,255,255,.09)",
    selected: "rgba(94,139,251,.20)",
    focusRing: "rgba(94,139,251,.50)",
  },
  ai: {
    surface: "rgba(132,79,230,0.10)",
    highlight: "rgba(132,79,230,0.20)",
    border: "rgba(132,79,230,0.40)",
    text: "var(--c-violet-300)",
    glow:
      "0 0 0 1px rgba(132,79,230,.32),0 12px 36px -8px rgba(132,79,230,.45)",
  },
  workflow: {
    reviewPending: "var(--c-amber-300)",
    reviewPendingSubtle: "rgba(196,125,20,.18)",
    reviewPendingText: "var(--c-amber-200)",
    reviewApproved: "var(--c-green-300)",
    reviewApprovedSubtle: "rgba(20,145,80,.16)",
    reviewApprovedText: "#7bd6a4",
    reviewRejected: "var(--c-red-300)",
    reviewRejectedSubtle: "rgba(217,55,69,.18)",
    reviewRejectedText: "var(--c-red-200)",
    reviewEscalated: "var(--c-violet-400)",
    reviewEscalatedSubtle: "rgba(132,79,230,.18)",
    reviewEscalatedText: "var(--c-violet-200)",
  },
  gradient: {
    primary: "linear-gradient(135deg,var(--c-blue-500),var(--c-blue-300))",
    secondary: "linear-gradient(135deg,var(--c-violet-500),var(--c-violet-300))",
    meridian:
      "linear-gradient(115deg,var(--c-blue-400) 0%,var(--c-violet-400) 55%,var(--c-cyan-300) 100%)",
    mesh:
      "radial-gradient(58% 88% at 12% 8%,rgba(58,107,244,.30),transparent 60%)," +
      "radial-gradient(54% 80% at 88% 16%,rgba(132,79,230,.24),transparent 62%)," +
      "radial-gradient(70% 90% at 72% 98%,rgba(12,155,176,.20),transparent 60%)," +
      "#0b0f17",
    head: "linear-gradient(100deg,var(--c-blue-300),var(--c-violet-300))",
  },
  shadow: {
    xs: "0 1px 2px rgba(0,0,0,.45)",
    sm: "0 1px 3px rgba(0,0,0,.55),0 1px 2px rgba(0,0,0,.45)",
    md: "0 4px 10px -2px rgba(0,0,0,.60),inset 0 1px 0 rgba(255,255,255,.04)",
    lg: "0 14px 26px -6px rgba(0,0,0,.66),inset 0 1px 0 rgba(255,255,255,.05)",
    xl: "0 28px 44px -10px rgba(0,0,0,.74),inset 0 1px 0 rgba(255,255,255,.06)",
    "2xl": "0 48px 72px -18px rgba(0,0,0,.82)",
    inner: "inset 0 1px 2px rgba(0,0,0,.50)",
    dropdown:
      "0 14px 30px -10px rgba(0,0,0,.70),inset 0 1px 0 rgba(255,255,255,.06)",
    modal:
      "0 48px 96px -28px rgba(0,0,0,.86),inset 0 1px 0 rgba(255,255,255,.07)",
    glowPrimary:
      "0 0 0 1px rgba(58,107,244,.42),0 12px 36px -8px rgba(58,107,244,.55)",
    glowInk:
      "0 0 0 1px rgba(255,255,255,.14),0 12px 36px -8px rgba(0,0,0,.60)",
    glowAi:
      "0 0 0 1px rgba(132,79,230,.32),0 14px 42px -10px rgba(132,79,230,.45)",
  },
};
