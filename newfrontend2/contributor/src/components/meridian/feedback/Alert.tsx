/**
 * Meridian — Alert
 *
 * Inline messaging. Four tones (info / success / warning / error)
 * plus AI. Each carries a leading icon ring and an optional
 * dismissible affordance.
 */

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { AlertCircle, AlertTriangle, CheckCircle2, Info, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const alertVariants = cva("rounded-xl border p-3.5 flex items-start gap-3", {
  variants: {
    tone: {
      info: "bg-info-subtle text-info-text border-info-border",
      success: "bg-success-subtle text-success-text border-success-border",
      warning: "bg-warning-subtle text-warning-text border-warning-border",
      error: "bg-error-subtle text-error-text border-error-border",
      ai: "bg-ai-surface text-ai-text border-ai-border",
    },
  },
  defaultVariants: { tone: "info" },
});

const defaultIcon: Record<NonNullable<AlertProps["tone"]>, React.ReactNode> = {
  info: <Info className="h-4 w-4" aria-hidden />,
  success: <CheckCircle2 className="h-4 w-4" aria-hidden />,
  warning: <AlertTriangle className="h-4 w-4" aria-hidden />,
  error: <AlertCircle className="h-4 w-4" aria-hidden />,
  ai: <Sparkles className="h-4 w-4" aria-hidden />,
};

interface AlertProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title">,
    VariantProps<typeof alertVariants> {
  title?: React.ReactNode;
  icon?: React.ReactNode;
  onDismiss?: () => void;
}

export const Alert: React.FC<AlertProps> = ({
  className,
  tone = "info",
  title,
  icon,
  onDismiss,
  children,
  ...props
}) => {
  return (
    <div className={cn(alertVariants({ tone }), className)} role="status" {...props}>
      <span className="shrink-0 mt-[1px]">{icon ?? defaultIcon[tone ?? "info"]}</span>
      <div className="min-w-0 flex-1">
        {title && (
          <p className="font-body text-body-sm font-semibold text-primary leading-tight">
            {title}
          </p>
        )}
        {children && (
          <div className="font-body text-body-sm leading-relaxed mt-0.5">
            {children}
          </div>
        )}
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className="p-0.5 rounded text-text-tertiary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
};
