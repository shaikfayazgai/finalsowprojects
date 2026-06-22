/**
 * Azure Day — Glimmora light theme.
 *
 * Cool slate neutrals + cobalt primary + violet secondary + cyan tertiary.
 * Semantic tokens resolve to Azure primitives via CSS variables defined in
 * styles/themes.css.
 *
 * Migrated from the prior warm-editorial Daybook mapping (bone/saffron/ink).
 * The exported symbol name (`lightTheme`) is preserved so consumers don't
 * need to update imports.
 */

import type { SemanticTokens } from "./meridian.theme";

export const lightTheme: SemanticTokens = {
  surface: {
    bg: "var(--c-slate-50)",
    bgSubtle: "var(--c-slate-100)",
    surface: "#ffffff",
    surfaceRaised: "#ffffff",
    surfaceSunken: "var(--c-slate-100)",
    surfaceHover: "var(--c-slate-50)",
    surfaceInverse: "var(--c-slate-900)",
    overlay: "rgba(14,19,27,.55)",
  },
  text: {
    primary: "var(--c-slate-900)",
    secondary: "var(--c-slate-600)",
    tertiary: "var(--c-slate-500)",
    disabled: "var(--c-slate-400)",
    inverse: "var(--c-slate-50)",
    link: "var(--c-blue-600)",
    onPrimary: "#ffffff",
    onWarm: "var(--c-slate-900)",
  },
  stroke: {
    subtle: "var(--c-slate-100)",
    base: "var(--c-slate-200)",
    strong: "var(--c-slate-300)",
    focus: "var(--c-blue-500)",
  },
  brand: {
    primary: "var(--c-blue-600)",
    primaryHover: "var(--c-blue-700)",
    primaryActive: "var(--c-blue-800)",
    primarySubtle: "var(--c-blue-50)",
    primarySubtleText: "var(--c-blue-700)",
    onPrimary: "#ffffff",
    secondary: "var(--c-violet-600)",
    secondaryHover: "var(--c-violet-700)",
    secondarySubtle: "var(--c-violet-50)",
    secondarySubtleText: "var(--c-violet-700)",
    onSecondary: "#ffffff",
    tertiary: "var(--c-cyan-600)",
    tertiaryStrong: "var(--c-cyan-700)",
    tertiaryHover: "var(--c-cyan-700)",
    tertiarySubtle: "var(--c-cyan-50)",
    tertiarySubtleText: "var(--c-cyan-700)",
    onTertiary: "#ffffff",
  },
  status: {
    success: {
      base: "var(--c-green-600)",
      solid: "var(--c-green-700)",
      subtle: "var(--c-green-50)",
      text: "var(--c-green-700)",
      border: "var(--c-green-200)",
    },
    warning: {
      base: "var(--c-amber-500)",
      solid: "var(--c-amber-300)",
      subtle: "var(--c-amber-50)",
      text: "var(--c-amber-700)",
      border: "var(--c-amber-200)",
    },
    error: {
      base: "var(--c-red-500)",
      solid: "var(--c-red-600)",
      subtle: "var(--c-red-50)",
      text: "var(--c-red-700)",
      border: "var(--c-red-200)",
    },
    info: {
      base: "var(--c-sky-500)",
      solid: "var(--c-sky-600)",
      subtle: "var(--c-sky-50)",
      text: "var(--c-sky-700)",
      border: "var(--c-sky-200)",
    },
  },
  state: {
    hover: "rgba(14,19,27,.04)",
    pressed: "rgba(14,19,27,.08)",
    selected: "rgba(35,83,224,.10)",
    focusRing: "rgba(58,107,244,.40)",
  },
  // AI surfaces — violet-derived (premium orchestration layer).
  // Lower saturation to signal "suggested, not decided." Composes
  // cleanly over surface or bg-subtle.
  ai: {
    surface: "rgba(132,79,230,0.06)",
    highlight: "rgba(132,79,230,0.16)",
    border: "rgba(132,79,230,0.30)",
    text: "var(--c-violet-700)",
    glow:
      "0 0 0 1px rgba(132,79,230,.20),0 8px 24px -6px rgba(132,79,230,.32)",
  },
  // Workflow / review semantic tokens — derived from status palette but
  // named for governance lifecycle stages. Escalated pivots to violet so
  // it reads as orchestrator-flagged attention, visually distinct from
  // amber pending / overdue.
  workflow: {
    reviewPending: "var(--c-amber-500)",
    reviewPendingSubtle: "var(--c-amber-50)",
    reviewPendingText: "var(--c-amber-700)",
    reviewApproved: "var(--c-green-600)",
    reviewApprovedSubtle: "var(--c-green-50)",
    reviewApprovedText: "var(--c-green-700)",
    reviewRejected: "var(--c-red-500)",
    reviewRejectedSubtle: "var(--c-red-50)",
    reviewRejectedText: "var(--c-red-700)",
    reviewEscalated: "var(--c-violet-600)",
    reviewEscalatedSubtle: "var(--c-violet-50)",
    reviewEscalatedText: "var(--c-violet-700)",
  },
  gradient: {
    primary: "linear-gradient(135deg,var(--c-blue-600),var(--c-blue-400))",
    secondary: "linear-gradient(135deg,var(--c-violet-600),var(--c-violet-400))",
    // `meridian` field name preserved for contract stability — value is
    // the Azure signature sweep (blue → violet → cyan).
    meridian:
      "linear-gradient(115deg,var(--c-blue-500) 0%,var(--c-violet-500) 55%,var(--c-cyan-400) 100%)",
    mesh:
      "radial-gradient(58% 88% at 12% 8%,rgba(58,107,244,.26),transparent 60%)," +
      "radial-gradient(54% 80% at 88% 16%,rgba(132,79,230,.20),transparent 62%)," +
      "radial-gradient(70% 90% at 72% 98%,rgba(12,155,176,.18),transparent 60%)," +
      "var(--c-slate-50)",
    head: "linear-gradient(100deg,var(--c-blue-600),var(--c-violet-500))",
  },
  shadow: {
    xs: "0 1px 2px rgba(14,19,27,.06)",
    sm: "0 1px 3px rgba(14,19,27,.09),0 1px 2px rgba(14,19,27,.05)",
    md: "0 4px 8px -2px rgba(14,19,27,.11),0 2px 4px -2px rgba(14,19,27,.06)",
    lg: "0 12px 22px -4px rgba(14,19,27,.13),0 4px 8px -4px rgba(14,19,27,.08)",
    xl: "0 24px 34px -8px rgba(14,19,27,.17),0 8px 16px -8px rgba(14,19,27,.10)",
    "2xl": "0 40px 64px -16px rgba(14,19,27,.22)",
    inner: "inset 0 1px 2px rgba(14,19,27,.08)",
    dropdown:
      "0 8px 24px -8px rgba(14,19,27,.18),0 2px 6px -2px rgba(14,19,27,.10)",
    modal:
      "0 40px 80px -24px rgba(14,19,27,.32),0 12px 28px -12px rgba(14,19,27,.18)",
    glowPrimary:
      "0 0 0 1px rgba(58,107,244,.20),0 10px 30px -8px rgba(58,107,244,.45)",
    glowInk:
      "0 0 0 1px rgba(14,19,27,.16),0 10px 30px -8px rgba(14,19,27,.35)",
    glowAi:
      "0 0 0 1px rgba(132,79,230,.20),0 12px 36px -10px rgba(132,79,230,.35)",
  },
};
