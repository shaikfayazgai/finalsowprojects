"use client";

import * as React from "react";
import {
  Lock,
  ShieldAlert,
  AlertTriangle,
  FileWarning,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

export type BannerTone = "hold" | "blocked" | "policy" | "compliance";

const tone: Record<
  BannerTone,
  { Icon: React.ElementType; ring: string; text: string; chipBg: string; rail: string }
> = {
  hold:       { Icon: Lock,        ring: "border-red-300 bg-red-50/60",   text: "text-red-800",   chipBg: "bg-red-100",  rail: "bg-red-500" },
  blocked:    { Icon: ShieldAlert, ring: "border-brown-300 bg-brown-50/60", text: "text-brown-800", chipBg: "bg-brown-100", rail: "bg-brown-500" },
  policy:     { Icon: FileWarning, ring: "border-gold-300 bg-gold-50/60", text: "text-gold-800",  chipBg: "bg-gold-100", rail: "bg-gold-500" },
  compliance: { Icon: AlertTriangle, ring: "border-teal-300 bg-teal-50/60", text: "text-teal-800",  chipBg: "bg-teal-100", rail: "bg-teal-500" },
};

/**
 * GovernanceBanner — top-of-workspace banner for hold / blocked / policy /
 * compliance states. Read at a glance: rail + icon tile + label + detail +
 * meta + action. Sits above the workspace content; the rest of the page
 * acts as if the banner is the operative system message.
 */
export function GovernanceBanner({
  tone: bannerTone,
  label,
  title,
  detail,
  meta,
  action,
}: {
  tone: BannerTone;
  label: string;
  title: string;
  detail?: string;
  meta?: React.ReactNode;
  action?: { label: string; onClick?: () => void };
}) {
  const t = tone[bannerTone];
  const Icon = t.Icon;
  return (
    <div
      className={cn(
        "relative rounded-xl border pl-5 pr-4 py-3 flex items-start gap-3",
        t.ring
      )}
    >
      <span aria-hidden className={cn("absolute left-0 top-3 bottom-3 w-[3px] rounded-r-full", t.rail)} />
      <span className={cn("shrink-0 inline-flex h-9 w-9 items-center justify-center rounded-lg", t.chipBg, t.text)}>
        <Icon className="h-4 w-4" />
      </span>
      <div className="flex-1 min-w-0">
        <p className={cn("text-[10px] font-bold uppercase tracking-wider", t.text)}>{label}</p>
        <p className={cn("text-[13.5px] font-semibold mt-0.5", t.text)}>{title}</p>
        {detail && <p className="text-[12px] text-gray-700 mt-0.5 leading-snug">{detail}</p>}
        {meta && <div className="mt-1.5">{meta}</div>}
      </div>
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className={cn(
            "shrink-0 inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-semibold hover:bg-white",
            "border-gray-200 bg-white/60 text-gray-700"
          )}
        >
          {action.label}
          <ChevronRight className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}
