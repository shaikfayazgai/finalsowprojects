/**
 * Admin operations shell — UX-first visual tokens.
 * Semantic colors for wayfinding; white surfaces for work; mesh for atmosphere.
 */

import type { CSSProperties } from "react";

export const AURORA_ACCENT =
  "linear-gradient(120deg, var(--c-violet-500) 0%, var(--c-blue-500) 48%, var(--c-cyan-500) 100%)";

export const AURORA_WASH =
  "linear-gradient(90deg, rgba(124,92,246,0.45) 0%, rgba(56,122,246,0.38) 50%, rgba(20,184,200,0.38) 100%)";

/** Workspace canvas — soft mesh, stays behind content. */
export const MESH_CANVAS: CSSProperties = {
  backgroundColor: "var(--color-bg-subtle)",
  backgroundImage: [
    "radial-gradient(ellipse 80% 55% at 0% 0%, rgba(124, 92, 246, 0.11), transparent 55%)",
    "radial-gradient(ellipse 70% 50% at 100% 0%, rgba(56, 122, 246, 0.09), transparent 52%)",
    "radial-gradient(ellipse 60% 45% at 80% 100%, rgba(20, 184, 200, 0.08), transparent 55%)",
    "linear-gradient(180deg, var(--color-bg) 0%, var(--color-bg-subtle) 100%)",
  ].join(", "),
};

export const AURORA_MESH = MESH_CANVAS;

/* ─── Shell chrome ─── */

/** Solid sidebar — readable nav, no glass noise. */
export const SHELL_SIDEBAR = "bg-surface border-r border-stroke-subtle";

export const SHELL_TOPBAR = "bg-surface/95 backdrop-blur-md border-b border-stroke-subtle";

export const SHELL_TOPBAR_SHADOW: CSSProperties = {
  boxShadow: "0 1px 0 0 rgba(255,255,255,0.8) inset, 0 1px 3px rgba(30,41,59,0.06)",
};

/** Legacy glass tokens — other admin pages may still import these. */
export const GLASS_SHELL = SHELL_TOPBAR;
export const GLASS_SHELL_SHADOW: CSSProperties = {};
export const GLASS_TOPBAR_SHADOW = SHELL_TOPBAR_SHADOW;

export const GLASS_CARD = "rounded-xl border border-stroke-subtle bg-surface shadow-sm";
export const GLASS_INNER = "rounded-xl border border-stroke-subtle bg-bg-subtle";

export const GLASS_SHADOW: CSSProperties = {
  boxShadow: "var(--shadow-sm)",
};

export const GLASS_SHADOW_LIFT: CSSProperties = {
  boxShadow: "var(--shadow-md)",
};

export const GRADIENT_HAIRLINE: CSSProperties = {
  background: AURORA_WASH,
  opacity: 0.35,
  height: 1,
};

export const ACCENT_TEXT: CSSProperties = {
  backgroundImage: AURORA_ACCENT,
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
};

export const BTN_PRIMARY: CSSProperties = {
  background: "var(--color-brand)",
  boxShadow: "0 1px 2px rgba(30,41,59,0.08), 0 4px 14px -4px rgba(58,107,244,0.35)",
};

export const BTN_GLOW: CSSProperties = {
  backgroundImage: AURORA_ACCENT,
  boxShadow: "0 4px 14px -4px rgba(58,107,244,0.4), 0 1px 0 0 rgba(255,255,255,0.2) inset",
};

export const HERO_GLOW: CSSProperties = {
  backgroundImage: AURORA_ACCENT,
  opacity: 0.2,
};

/* ─── Dashboard surfaces ─── */

export const DASH_CARD =
  "rounded-xl border border-stroke-subtle bg-surface shadow-[0_10px_24px_-12px_rgba(30,41,59,0.10)]";

export const DASH_CARD_ELEVATED =
  "rounded-xl border border-stroke-subtle bg-surface shadow-[0_1px_0_0_rgba(255,255,255,0.85)_inset,0_28px_70px_-30px_rgba(30,41,59,0.12)]";

export const DASH_CARD_INTERACTIVE =
  "rounded-xl border border-stroke-subtle bg-surface shadow-[0_10px_24px_-12px_rgba(30,41,59,0.10)] transition-all duration-base hover:shadow-[0_14px_30px_-12px_rgba(30,41,59,0.14)] hover:border-stroke";

export const DASH_INNER = "rounded-xl border border-stroke-subtle bg-bg-subtle/80";

/* ─── Nav interaction ─── */

export const NAV_ITEM =
  "group relative flex items-center rounded-lg font-body text-[13px] transition-colors duration-fast";

export const NAV_ITEM_ACTIVE =
  "bg-brand-subtle text-brand-emphasis font-semibold";

export const NAV_ITEM_IDLE =
  "text-text-secondary font-medium hover:bg-bg-subtle hover:text-foreground";

/* ─────────────────────────────────────────────────────────────
   AURORA GLASS — trending glassmorphism kit for the admin shell.
   Vivid mesh-gradient ground, frosted translucent surfaces,
   gradient accents, color-tinted shadows. Violet / blue / cyan.
   ───────────────────────────────────────────────────────────── */

/** Top-only gradient ground — colored glow across the top, fading to clean light. */
export const GLASS_MESH: CSSProperties = {
  backgroundColor: "var(--color-bg)",
  backgroundImage: [
    "radial-gradient(ellipse 72% 58% at 0% 0%, rgba(124,92,246,0.22), transparent 56%)",
    "radial-gradient(ellipse 66% 54% at 100% 0%, rgba(56,122,246,0.20), transparent 54%)",
    "linear-gradient(180deg, #fbfcff 0%, #f6f8fd 100%)",
  ].join(", "),
};

/** Frosted glass panel — translucent white + blur + light rim. */
export const GLASS_PANEL = "rounded-xl border border-white/65 bg-white/55 backdrop-blur-xl backdrop-saturate-150";

/** Layered, color-tinted shadow for glass cards. */
export const GLASS_PANEL_SHADOW: CSSProperties = {
  boxShadow:
    "0 1px 0 rgba(255,255,255,0.75) inset, 0 22px 44px -26px rgba(58,107,244,0.40), 0 10px 26px -18px rgba(124,92,246,0.32)",
};

/** Solid white chrome — no glassmorphism on the rail / topbar. */
export const GLASS_RAIL = "bg-surface border-r border-stroke-subtle";
export const GLASS_BAR = "bg-surface border-b border-stroke-subtle";
export const GLASS_BAR_SHADOW: CSSProperties = {
  boxShadow: "0 1px 2px rgba(16,24,40,0.04)",
};

/** Gradient pill surface (active nav, primary buttons). */
export const GLASS_GRADIENT: CSSProperties = {
  backgroundImage: AURORA_ACCENT,
  boxShadow: "0 10px 22px -10px rgba(108,76,230,0.6)",
};

/** Muted header strip inside a glass panel. */
export const GLASS_HEAD = "bg-white/35 border-b border-white/55";

/* ─────────────────────────────────────────────────────────────
   AURORA CHROME — dark gradient sidebar + animated hero card.
   ───────────────────────────────────────────────────────────── */

/** Dark aurora sidebar rail — deep violet→indigo→blue. */
export const AURORA_RAIL: CSSProperties = {
  backgroundColor: "#100c20",
  backgroundImage: "linear-gradient(168deg, #1b1438 0%, #130f28 46%, #0d1230 100%)",
};

/** Rich gradient for the dashboard hero / welcome card. */
export const AURORA_HERO: CSSProperties = {
  backgroundColor: "#1a1336",
  backgroundImage: [
    "radial-gradient(80% 130% at 0% 0%, rgba(124,92,246,0.55), transparent 60%)",
    "radial-gradient(70% 120% at 100% 0%, rgba(56,122,246,0.45), transparent 58%)",
    "radial-gradient(90% 140% at 100% 100%, rgba(20,184,200,0.40), transparent 60%)",
    "linear-gradient(120deg, #211743 0%, #161033 55%, #101a37 100%)",
  ].join(", "),
};
