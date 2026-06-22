/**
 * Meridian typography tokens.
 *
 * Three families:
 *   - Fraunces       — editorial display (headings, KPIs, hero numbers)
 *   - Hanken Grotesk — operational UI (body, labels, controls)
 *   - JetBrains Mono — technical metadata (timestamps, IDs, code)
 *
 * The scale is built around an 11-step semantic hierarchy. Each step
 * carries size + lineHeight + letterSpacing + weight. Use semantic
 * names (`display-xl`, `body-md`, `mono-xs`) in components — never raw
 * px values.
 */

export const fontFamily = {
  display: '"Fraunces", Georgia, "Times New Roman", serif',
  body: '"Hanken Grotesk", system-ui, -apple-system, sans-serif',
  mono: '"JetBrains Mono", ui-monospace, Menlo, Consolas, monospace',
} as const;

export const fontWeight = {
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
} as const;

export interface TypographyScaleStep {
  fontSize: string;
  lineHeight: string;
  letterSpacing: string;
  fontWeight: number;
  fontFamily: string;
}

/* The 11-step semantic typography scale. Sizes are clamp() in fluid
 * tiers so the system scales gracefully from 1024px → 1920px. */
export const typographyScale = {
  // Display — for marketing-grade hero numbers and section openers
  "display-xl": {
    fontSize: "clamp(48px, 5.4vw, 72px)",
    lineHeight: "1.02",
    letterSpacing: "-0.018em",
    fontWeight: fontWeight.semibold,
    fontFamily: fontFamily.display,
  },
  "display-lg": {
    fontSize: "clamp(36px, 4vw, 56px)",
    lineHeight: "1.04",
    letterSpacing: "-0.014em",
    fontWeight: fontWeight.semibold,
    fontFamily: fontFamily.display,
  },

  // Headings — editorial section anchors
  "heading-xl": {
    fontSize: "28px",
    lineHeight: "1.18",
    letterSpacing: "-0.012em",
    fontWeight: fontWeight.semibold,
    fontFamily: fontFamily.display,
  },
  "heading-lg": {
    fontSize: "22px",
    lineHeight: "1.22",
    letterSpacing: "-0.010em",
    fontWeight: fontWeight.semibold,
    fontFamily: fontFamily.display,
  },
  "heading-md": {
    fontSize: "17px",
    lineHeight: "1.28",
    letterSpacing: "-0.006em",
    fontWeight: fontWeight.semibold,
    fontFamily: fontFamily.display,
  },
  "heading-sm": {
    fontSize: "14px",
    lineHeight: "1.32",
    letterSpacing: "0",
    fontWeight: fontWeight.semibold,
    fontFamily: fontFamily.body,
  },

  // Body — operational rhythm
  "body-lg": {
    fontSize: "15px",
    lineHeight: "1.55",
    letterSpacing: "0",
    fontWeight: fontWeight.regular,
    fontFamily: fontFamily.body,
  },
  "body-md": {
    fontSize: "13.5px",
    lineHeight: "1.55",
    letterSpacing: "0",
    fontWeight: fontWeight.regular,
    fontFamily: fontFamily.body,
  },
  "body-sm": {
    fontSize: "12.5px",
    lineHeight: "1.5",
    letterSpacing: "0",
    fontWeight: fontWeight.regular,
    fontFamily: fontFamily.body,
  },

  // Caption + uppercase labels — for KPI labels, eyebrow chips, table headers
  caption: {
    fontSize: "11px",
    lineHeight: "1.45",
    letterSpacing: "0.015em",
    fontWeight: fontWeight.medium,
    fontFamily: fontFamily.body,
  },
  "label-xs": {
    fontSize: "10.5px",
    lineHeight: "1.3",
    letterSpacing: "0.14em",
    fontWeight: fontWeight.semibold,
    fontFamily: fontFamily.body,
  },

  // Mono — technical metadata
  "mono-sm": {
    fontSize: "12.5px",
    lineHeight: "1.45",
    letterSpacing: "0",
    fontWeight: fontWeight.medium,
    fontFamily: fontFamily.mono,
  },
  "mono-xs": {
    fontSize: "10.5px",
    lineHeight: "1.35",
    letterSpacing: "0",
    fontWeight: fontWeight.medium,
    fontFamily: fontFamily.mono,
  },

  // Editorial italic — for the gradient-text hero (e.g. "Meridian")
  "display-italic": {
    fontSize: "inherit",
    lineHeight: "inherit",
    letterSpacing: "-0.014em",
    fontWeight: fontWeight.medium,
    fontFamily: fontFamily.display,
  },
} as const satisfies Record<string, TypographyScaleStep>;

export type TypographyToken = keyof typeof typographyScale;
