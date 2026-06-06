/* Shared Framer Motion variants for consistent page animations */

/**
 * Returns "show" when the page was hidden at mount time (background tab load).
 * Prevents Framer Motion's opacity:0 initial state from inflating LCP
 * because background tabs throttle animation frames.
 */
export function getInitialVariant(): "hidden" | "show" {
  if (typeof document === "undefined") return "hidden";
  return document.hidden ? "show" : "hidden";
}

export const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

export const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
};

export const fadeIn = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { duration: 0.3, ease: "easeOut" as const },
  },
};

export const slideInRight = {
  hidden: { opacity: 0, x: 20 },
  show: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
};

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.95 },
  show: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] as const },
  },
};
