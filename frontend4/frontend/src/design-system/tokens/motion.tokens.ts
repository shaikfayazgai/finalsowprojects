/**
 * Meridian motion tokens.
 *
 * Restrained editorial motion: no bounce, no parallax. Three durations,
 * three easings. Hover, modal, drawer, workflow — all compose from
 * this single set so the system moves in rhythm.
 */

export const duration = {
  /** Pointer interactions: button press feedback, focus rings */
  instant: "120ms",
  /** Standard UI: hover, chip transitions, tab swap */
  fast: "180ms",
  /** Calm reveal: page mount, panel open */
  base: "240ms",
  /** Slow reveal: modal in, drawer slide */
  slow: "320ms",
  /** Editorial reveal: hero, large layout shifts */
  xslow: "480ms",
} as const;

export const easing = {
  /** Calm in, calm out — the editorial curve */
  standard: "cubic-bezier(0.16, 1, 0.3, 1)",
  /** Symmetric in-out — for sustained motion */
  inOut: "cubic-bezier(0.45, 0, 0.25, 1)",
  /** Emphasized — for one-off micro-presses (use sparingly) */
  emphasized: "cubic-bezier(0.34, 1.56, 0.64, 1)",
  /** Linear — for progress bars, loaders */
  linear: "linear",
} as const;

/** Reusable semantic motion presets. */
export const motionPreset = {
  hover: `background-color ${duration.fast} ${easing.standard}, border-color ${duration.fast} ${easing.standard}, color ${duration.fast} ${easing.standard}`,
  pressFeedback: `transform ${duration.instant} ${easing.standard}`,
  shadowLift: `box-shadow ${duration.base} ${easing.standard}, transform ${duration.base} ${easing.standard}`,
  pageMount: `opacity ${duration.base} ${easing.standard}, transform ${duration.base} ${easing.standard}`,
  modalIn: `opacity ${duration.slow} ${easing.standard}, transform ${duration.slow} ${easing.standard}`,
  drawerSlide: `transform ${duration.slow} ${easing.inOut}`,
} as const;

export type DurationToken = keyof typeof duration;
export type EasingToken = keyof typeof easing;
export type MotionPresetToken = keyof typeof motionPreset;
