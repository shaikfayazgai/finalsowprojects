"use client";

import * as React from "react";
import {
  Sparkles,
  User,
  Settings2,
  Scale,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { GovernanceEvent } from "@/mocks/data/mentor-rework-escalation";

const tone: Record<
  GovernanceEvent["category"],
  { Icon: React.ElementType; bg: string; iconClass: string; label: string }
> = {
  ai:         { Icon: Sparkles,    bg: "ring-forest-100 bg-forest-50", iconClass: "text-forest-700", label: "AI" },
  human:      { Icon: User,        bg: "ring-brown-100 bg-brown-50",   iconClass: "text-brown-700",  label: "Human" },
  system:     { Icon: Settings2,   bg: "ring-gray-100 bg-gray-50",     iconClass: "text-gray-600",   label: "System" },
  policy:     { Icon: Scale,       bg: "ring-gold-100 bg-gold-50",     iconClass: "text-gold-700",   label: "Policy" },
  governance: { Icon: ShieldCheck, bg: "ring-teal-100 bg-teal-50",     iconClass: "text-teal-700",   label: "Governance" },
};

/**
 * Canonical governance timeline. Reused for rework / escalation / hold /
 * audit views. Each entry is read as: tone-icon + timestamp + actor +
 * action + detail. Vertical rail connects entries.
 */
export function GovernanceTimeline({
  events,
  dense = false,
  emptyLabel = "No governance events recorded yet.",
}: {
  events: GovernanceEvent[];
  dense?: boolean;
  emptyLabel?: string;
}) {
  if (events.length === 0) {
    return (
      <p className="text-[12px] text-gray-500 italic px-1 py-2">{emptyLabel}</p>
    );
  }

  return (
    <ol className="relative">
      <span
        aria-hidden
        className={cn(
          "absolute left-[14px] w-px bg-gray-200",
          dense ? "top-2 bottom-2" : "top-3 bottom-3"
        )}
      />
      {events.map((event) => {
        const t = tone[event.category];
        const Icon = t.Icon;
        return (
          <li
            key={event.id}
            className={cn(
              "relative flex items-start gap-3",
              dense ? "py-1.5" : "py-2.5"
            )}
          >
            <span
              className={cn(
                "relative z-10 shrink-0 inline-flex h-7 w-7 items-center justify-center rounded-full ring-4 ring-white",
                t.bg
              )}
            >
              <Icon className={cn("h-3.5 w-3.5", t.iconClass)} />
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-[12.5px] font-semibold text-brown-950 truncate">
                  {event.actor}
                </p>
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  {t.label}
                </span>
                <span className="text-[10.5px] font-mono text-gray-400 tabular-nums ml-auto">
                  {event.timestamp}
                </span>
              </div>
              <p className="text-[12px] font-medium text-gray-800 mt-0.5">{event.action}</p>
              <p className="text-[11.5px] text-gray-600 leading-snug">{event.detail}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
