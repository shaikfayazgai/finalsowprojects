"use client";

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { GLASS_GRADIENT } from "../../_shell/aurora";

export function TenantEmptyState({
  icon: Icon,
  title,
  description,
  action,
  compact = false,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  compact?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("px-4 sm:px-5 text-center", compact ? "py-8" : "py-14", className)}>
      <span
        className="grid place-items-center h-11 w-11 mx-auto rounded-xl text-white mb-3"
        style={GLASS_GRADIENT}
        aria-hidden
      >
        <Icon className="h-5 w-5" strokeWidth={1.85} />
      </span>
      <p className="font-body text-[15px] font-semibold text-foreground">{title}</p>
      {description ? (
        <p className="mt-1 font-body text-[13px] text-text-tertiary max-w-md mx-auto">{description}</p>
      ) : null}
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}
