"use client";

import { cn } from "@/lib/utils/cn";
import { Info, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";

type BannerVariant = "info" | "warning" | "success" | "error";

const variantConfig: Record<BannerVariant, { bg: string; border: string; icon: typeof Info; iconColor: string; textColor: string }> = {
  info: { bg: "bg-teal-50", border: "border-teal-200", icon: Info, iconColor: "text-teal-500", textColor: "text-teal-800" },
  warning: { bg: "bg-gold-50", border: "border-gold-200", icon: AlertTriangle, iconColor: "text-gold-500", textColor: "text-gold-800" },
  success: { bg: "bg-forest-50", border: "border-forest-200", icon: CheckCircle2, iconColor: "text-forest-500", textColor: "text-forest-800" },
  error: { bg: "bg-red-50", border: "border-red-200", icon: XCircle, iconColor: "text-red-500", textColor: "text-red-800" },
};

interface StatusBannerProps {
  variant: BannerVariant;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  className?: string;
}

export function StatusBanner({ variant, title, description, action, className }: StatusBannerProps) {
  const cfg = variantConfig[variant];
  const Icon = cfg.icon;

  return (
    <div className={cn("rounded-2xl border px-5 py-4 flex items-start gap-3", cfg.bg, cfg.border, className)}>
      <Icon className={cn("w-5 h-5 shrink-0 mt-0.5", cfg.iconColor)} />
      <div className="flex-1 min-w-0">
        <p className={cn("text-[13px] font-semibold", cfg.textColor)}>{title}</p>
        {description && <p className={cn("text-[12px] mt-0.5 opacity-80", cfg.textColor)}>{description}</p>}
      </div>
      {action && (
        <button
          onClick={action.onClick}
          className={cn("text-[11px] font-semibold px-3 py-1.5 rounded-lg border shrink-0 transition-all hover:opacity-80", cfg.border, cfg.textColor)}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
