/**
 * Meridian z-index scale — governed stacking order.
 *
 * Always use these tokens instead of raw `z-50` etc. Each value owns
 * a named role so it's clear what should overlay what.
 */

export const zIndex = {
  /** Below normal flow — for soft-fade decorative elements */
  below: -1,
  /** Default in-flow stacking */
  base: 0,
  /** Sticky surfaces (table headers, section anchors) */
  sticky: 10,
  /** Sidebars, app shell chrome */
  sidebar: 30,
  /** Dropdown menus + select listboxes */
  dropdown: 40,
  /** Header / topbar — always visible above page chrome */
  header: 50,
  /** Popovers + tooltips (above dropdowns when nested) */
  popover: 60,
  /** Drawers + sheets */
  drawer: 70,
  /** Modal scrim + content */
  modal: 80,
  /** Toasts + notifications */
  toast: 90,
  /** Critical system overlays — never use except for full-screen errors */
  critical: 100,
} as const;

export type ZIndexToken = keyof typeof zIndex;
