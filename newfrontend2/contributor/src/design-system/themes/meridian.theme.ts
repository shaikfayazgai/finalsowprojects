/**
 * Meridian theme contract — the type surface that Daybook + Nocturne
 * must both implement.
 *
 * This file defines WHAT a theme is, not what it looks like. Adding a
 * new theme means implementing this contract and registering it in
 * `index.ts`. Renaming or extending a semantic role here is a system-
 * wide change and must be reviewed deliberately.
 *
 * Roles:
 *   surface    — paper / surface / overlay model
 *   text       — print-grade typographic hierarchy
 *   stroke     — hairline → focus weights
 *   brand      — primary / secondary / tertiary identity
 *   status     — success / warning / error / info
 *   state      — translucent interaction overlays
 *   ai         — AI assistance surface family
 *   workflow   — governance lifecycle (pending / approved / rejected / escalated)
 *   gradient   — signature meridian + supporting gradients
 *   shadow     — elevation family + special glows
 */

export interface StatusRole {
  base: string;
  solid: string;
  subtle: string;
  text: string;
  border: string;
}

export interface SemanticTokens {
  surface: {
    bg: string;
    bgSubtle: string;
    surface: string;
    surfaceRaised: string;
    surfaceSunken: string;
    surfaceHover: string;
    surfaceInverse: string;
    overlay: string;
  };
  text: {
    primary: string;
    secondary: string;
    tertiary: string;
    disabled: string;
    inverse: string;
    link: string;
    onPrimary: string;
    onWarm: string;
  };
  stroke: {
    subtle: string;
    base: string;
    strong: string;
    focus: string;
  };
  brand: {
    primary: string;
    primaryHover: string;
    primaryActive: string;
    primarySubtle: string;
    primarySubtleText: string;
    onPrimary: string;
    secondary: string;
    secondaryHover: string;
    secondarySubtle: string;
    secondarySubtleText: string;
    onSecondary: string;
    tertiary: string;
    tertiaryStrong: string;
    tertiaryHover: string;
    tertiarySubtle: string;
    tertiarySubtleText: string;
    onTertiary: string;
  };
  status: {
    success: StatusRole;
    warning: StatusRole;
    error: StatusRole;
    info: StatusRole;
  };
  state: {
    hover: string;
    pressed: string;
    selected: string;
    focusRing: string;
  };
  /** AI surfaces — violet-derived (premium orchestration layer), lower
   *  saturation to read as "suggested, not decided." */
  ai: {
    surface: string;
    highlight: string;
    border: string;
    text: string;
    glow: string;
  };
  /** Governance lifecycle states — pending / approved / rejected / escalated. */
  workflow: {
    reviewPending: string;
    reviewPendingSubtle: string;
    reviewPendingText: string;
    reviewApproved: string;
    reviewApprovedSubtle: string;
    reviewApprovedText: string;
    reviewRejected: string;
    reviewRejectedSubtle: string;
    reviewRejectedText: string;
    reviewEscalated: string;
    reviewEscalatedSubtle: string;
    reviewEscalatedText: string;
  };
  gradient: {
    primary: string;
    secondary: string;
    /**
     * Signature gradient. Field name preserved for contract stability;
     * its value is the Azure sweep (blue → violet → cyan) in the Azure
     * theme set. Consumers should treat this as "the brand signature
     * gradient," not as a Meridian-specific value.
     */
    meridian: string;
    mesh: string;
    head: string;
  };
  shadow: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    "2xl": string;
    inner: string;
    /** Dropdown / popover elevation — between md and lg, tuned for menus. */
    dropdown: string;
    /** Modal / dialog elevation — deepest editorial shadow. */
    modal: string;
    glowPrimary: string;
    glowInk: string;
    /** AI emphasis glow — softer than glowPrimary, more diffuse. */
    glowAi: string;
  };
}

/** Brand identity metadata — system-wide constants, not theme-specific. */
export const meridianIdentity = {
  name: "Glimmora Azure",
  version: "2.0.0",
  description:
    "Azure enterprise-SaaS design system for the Glimmora Global Workforce Intelligence Platform — cobalt primary, violet AI accent, cyan data accent, on cool slate neutrals.",
  themes: {
    light: { name: "AzureDay", label: "Day" },
    dark: { name: "AzureNight", label: "Night" },
  },
} as const;
