"use client";

import { cn } from "@/lib/utils/cn";
import { Info, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { TONE, type Tone } from "@/app/admin/_shell/aurora-ui";

type BannerVariant = "info" | "warning" | "success" | "error";

const variantConfig: Record<BannerVariant, { tone: Tone; icon: typeof Info }> = {
  info: { tone: "info", icon: Info },
  warning: { tone: "warning", icon: AlertTriangle },
  success: { tone: "success", icon: CheckCircle2 },
  error: { tone: "error", icon: XCircle },
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
  const tone = TONE[cfg.tone];
  const Icon = cfg.icon;

  return (
    <div
      className={cn("rounded-2xl border px-5 py-4 flex items-start gap-3 backdrop-blur", className)}
      style={{ background: tone.soft, borderColor: tone.border }}
    >
      <Icon className="w-5 h-5 shrink-0 mt-0.5" style={{ color: tone.text }} />
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold" style={{ color: tone.text }}>{title}</p>
        {description && <p className="text-[12px] mt-0.5 opacity-80" style={{ color: tone.text }}>{description}</p>}
      </div>
      {action && (
        <button
          onClick={action.onClick}
          className="text-[11px] font-semibold px-3 py-1.5 rounded-lg border shrink-0 transition-all hover:opacity-80"
          style={{ borderColor: tone.border, color: tone.text }}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
