/**
 * Modal footer actions — enterprise / admin contract (mark-as-paid, tenant modals).
 *
 * h-9 · text-[13px] · rounded-md · cancel = bordered surface · primary = brand fill.
 */

import * as React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";

/** White label on brand / danger fills — CSS var avoids missing Tailwind token. */
const onBrandText = "text-[var(--color-on-primary)]";

export const modalCancelButtonClass = cn(
  "inline-flex items-center justify-center h-9 px-3.5 rounded-md",
  "bg-surface border border-stroke",
  "font-body text-[13px] font-semibold text-foreground",
  "hover:bg-surface-hover transition-colors duration-fast",
  "disabled:opacity-60 disabled:cursor-not-allowed",
);

export const modalPrimaryButtonClass = cn(
  "inline-flex items-center justify-center gap-1.5 h-9 px-3.5 rounded-md shadow-xs",
  "bg-brand",
  onBrandText,
  "font-body text-[13px] font-semibold",
  "hover:bg-brand-hover transition-colors duration-fast",
  "disabled:opacity-60 disabled:cursor-not-allowed",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30 focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
);

export const modalDangerButtonClass = cn(
  "inline-flex items-center justify-center gap-1.5 h-9 px-3.5 rounded-md shadow-xs",
  "bg-error-solid",
  onBrandText,
  "font-body text-[13px] font-semibold",
  "hover:bg-error transition-colors duration-fast",
  "disabled:opacity-60 disabled:cursor-not-allowed",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error/30 focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
);

export const modalGhostButtonClass = cn(
  "inline-flex items-center justify-center h-9 px-3.5 rounded-md",
  "font-body text-[13px] font-semibold text-text-link",
  "hover:bg-surface-hover transition-colors duration-fast",
  "disabled:opacity-60 disabled:cursor-not-allowed",
);

/** Form labels inside modals — uppercase eyebrow, not body semibold. */
export const modalFieldLabelClass =
  "block font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary mb-1.5";

export const modalInputClass = cn(
  "w-full h-9 px-3 rounded-md",
  "bg-surface border border-stroke",
  "font-body text-[13px] text-foreground placeholder:text-text-disabled",
  "focus-visible:outline-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/25",
);

export const modalTextareaClass = cn(
  "w-full px-3 py-2.5 rounded-md resize-none",
  "bg-surface border border-stroke",
  "font-body text-[13px] text-foreground placeholder:text-text-disabled",
  "focus-visible:outline-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/25",
);

interface ModalActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  leadingIcon?: React.ReactNode;
}

export function ModalCancelButton({
  className,
  children = "Cancel",
  ...props
}: ModalActionButtonProps) {
  return (
    <button type="button" className={cn(modalCancelButtonClass, className)} {...props}>
      {children}
    </button>
  );
}

export function ModalPrimaryButton({
  className,
  children,
  loading,
  leadingIcon,
  disabled,
  ...props
}: ModalActionButtonProps) {
  return (
    <button
      type="button"
      className={cn(modalPrimaryButtonClass, className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
      ) : (
        leadingIcon
      )}
      {children}
    </button>
  );
}

export function ModalDangerButton({
  className,
  children,
  loading,
  leadingIcon,
  disabled,
  ...props
}: ModalActionButtonProps) {
  return (
    <button
      type="button"
      className={cn(modalDangerButtonClass, className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
      ) : (
        leadingIcon
      )}
      {children}
    </button>
  );
}
