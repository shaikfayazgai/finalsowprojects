"use client";

/**
 * Meridian — Drawer
 *
 * Side panel for evidence review, lineage drill-ins, settings detail.
 * Slides in from right (default) or left. Same scrim + Escape handling
 * as Modal.
 *
 * `appearance="gradient-glass"` — sidebar-style canvas:
 *   1. `--gradient-sidebar` mesh gradient (base layer)
 *   2. `.drawer-glass-pane` frosted white glass (overlay)
 *   3. Header / content / footer (relative, above glass)
 */

import * as React from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { IconButton } from "../primitives/IconButton";

type DrawerAppearance = "default" | "gradient-glass";

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  /** Small caps label above title (gradient-glass drawers). */
  eyebrow?: React.ReactNode;
  footer?: React.ReactNode;
  /** "right" (default) or "left". */
  side?: "right" | "left";
  /** Width — defaults to md (440px). */
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  /** Inline style applied to the panel — merged with gradient when `appearance="gradient-glass"`. */
  panelStyle?: React.CSSProperties;
  /**
   * Visual canvas for the panel.
   * - `default` — solid surface
   * - `gradient-glass` — sidebar mesh gradient + frosted glass overlay
   */
  appearance?: DrawerAppearance;
  /**
   * @deprecated Prefer `appearance="gradient-glass"`. When true, renders the
   * frosted glass overlay; combine with `panelStyle={{ background: "var(--gradient-sidebar)" }}`.
   */
  glass?: boolean;
  children?: React.ReactNode;
}

const sizeClass: Record<NonNullable<DrawerProps["size"]>, string> = {
  sm: "w-80",
  md: "w-[440px]",
  lg: "w-[560px]",
  xl: "w-[720px]",
};

export const Drawer: React.FC<DrawerProps> = ({
  open,
  onClose,
  title,
  description,
  eyebrow,
  footer,
  side = "right",
  size = "md",
  className,
  panelStyle,
  appearance = "default",
  glass = false,
  children,
}) => {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!mounted || !open || typeof document === "undefined") return null;

  const gradientGlass = appearance === "gradient-glass" || glass;
  const resolvedPanelStyle: React.CSSProperties | undefined = gradientGlass
    ? { background: "var(--gradient-sidebar)", ...panelStyle }
    : panelStyle;

  const slideKeyframe =
    side === "right" ? "meridian-slide-right" : "meridian-slide-right";

  return createPortal(
    <div className="fixed inset-0 z-drawer flex" role="presentation">
      <div
        aria-hidden
        onClick={onClose}
        className="absolute inset-0 bg-overlay"
        style={{ animation: "meridian-fade-in var(--duration-slow) var(--ease-standard)" }}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "meridian-drawer-title" : undefined}
        className={cn(
          "relative h-full shadow-modal flex flex-col overflow-hidden",
          gradientGlass ? "border-stroke" : "border-stroke",
          !resolvedPanelStyle && "bg-surface",
          side === "right" ? "ml-auto border-l" : "mr-auto border-r",
          sizeClass[size],
          className,
        )}
        style={{
          animation: `${slideKeyframe} var(--duration-slow) var(--ease-in-out)`,
          ...resolvedPanelStyle,
        }}
      >
        {gradientGlass && (
          <div aria-hidden className="drawer-glass-pane absolute inset-0 pointer-events-none" />
        )}
        {title && (
          <header
            className={cn(
              "relative z-[1] px-5 py-4 flex items-start gap-3",
              gradientGlass ? "border-b border-stroke-subtle" : "border-b border-stroke-subtle",
            )}
          >
            <div className="min-w-0 flex-1">
              {gradientGlass && eyebrow && (
                <p className="font-body text-[10px] font-bold uppercase tracking-[0.14em] text-text-tertiary mb-1">
                  {eyebrow}
                </p>
              )}
              <h2
                id="meridian-drawer-title"
                className={cn(
                  gradientGlass
                    ? "font-body text-[15.5px] font-semibold text-foreground tracking-[-0.01em]"
                    : "font-display text-heading-md font-semibold text-primary",
                )}
              >
                {title}
              </h2>
              {description && (
                <p
                  className={cn(
                    "mt-1 leading-snug",
                    gradientGlass
                      ? "font-body text-[12px] text-text-secondary"
                      : "font-body text-body-sm text-text-tertiary",
                  )}
                >
                  {description}
                </p>
              )}
            </div>
            <IconButton
              aria-label="Close"
              icon={<X className="h-4 w-4" strokeWidth={2} />}
              onClick={onClose}
              variant="ghost"
              size="sm"
            />
          </header>
        )}
        <div
          className={cn(
            "relative z-[1] overflow-y-auto flex-1",
            gradientGlass ? "px-5 py-4" : "p-5",
          )}
        >
          {children}
        </div>
        {footer && (
          <footer
            className={cn(
              "relative z-[1] px-5 py-3 flex items-center justify-end gap-2",
              gradientGlass
                ? "border-t border-stroke-subtle"
                : "border-t border-stroke-subtle bg-bg-subtle/40",
            )}
          >
            {footer}
          </footer>
        )}
      </div>
    </div>,
    document.body,
  );
};
