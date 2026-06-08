"use client";

/**
 * Meridian — Modal
 *
 * Lightweight modal dialog. Renders inside a portal-style fixed
 * overlay with the canonical Meridian overlay scrim + modal shadow.
 * Closes on Escape + backdrop click. Focus management is minimal
 * (focuses the dialog on open); for full focus-trap semantics swap
 * to Radix in Phase 3 — the public API stays identical.
 */

import * as React from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { IconButton } from "../primitives/IconButton";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  /** Footer (action bar). */
  footer?: React.ReactNode;
  /** Width — defaults to md (520px). */
  size?: "sm" | "md" | "lg" | "xl";
  /** Hide the default close button (use when footer has its own). */
  hideCloseButton?: boolean;
  className?: string;
  children?: React.ReactNode;
}

const sizeClass: Record<NonNullable<ModalProps["size"]>, string> = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
};

export const Modal: React.FC<ModalProps> = ({
  open,
  onClose,
  title,
  description,
  footer,
  size = "md",
  hideCloseButton,
  className,
  children,
}) => {
  const [mounted, setMounted] = React.useState(false);
  const dialogRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    dialogRef.current?.focus();
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!mounted || !open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-modal flex items-center justify-center px-4"
      role="presentation"
    >
      <div
        aria-hidden
        onClick={onClose}
        className="absolute inset-0 bg-overlay"
        style={{
          animation: "meridian-fade-in var(--duration-slow) var(--ease-standard)",
        }}
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "meridian-modal-title" : undefined}
        tabIndex={-1}
        className={cn(
          "relative w-full",
          sizeClass[size],
          "rounded-2xl bg-surface border border-stroke shadow-modal",
          "max-h-[calc(100vh-3rem)] overflow-hidden flex flex-col",
          "focus:outline-none",
          className,
        )}
        style={{
          animation: "meridian-scale-in var(--duration-slow) var(--ease-standard)",
        }}
      >
        {(title || !hideCloseButton) && (
          <header className="px-5 py-3.5 border-b border-stroke-subtle flex items-start gap-3">
            <div className="min-w-0 flex-1">
              {title && (
                <h2
                  id="meridian-modal-title"
                  className="font-body text-[15.5px] font-semibold text-foreground tracking-[-0.01em] leading-tight"
                >
                  {title}
                </h2>
              )}
              {description && (
                <p className="font-body text-[11.5px] text-text-secondary mt-1 leading-relaxed">
                  {description}
                </p>
              )}
            </div>
            {!hideCloseButton && (
              <IconButton
                aria-label="Close"
                icon={<X className="h-4 w-4" />}
                onClick={onClose}
                variant="ghost"
                size="sm"
              />
            )}
          </header>
        )}
        <div className="overflow-y-auto p-5 flex-1">{children}</div>
        {footer && (
          <footer className="px-5 py-3 border-t border-stroke-subtle bg-bg-subtle/40 flex items-center justify-end gap-2">
            {footer}
          </footer>
        )}
      </div>
    </div>,
    document.body,
  );
};
