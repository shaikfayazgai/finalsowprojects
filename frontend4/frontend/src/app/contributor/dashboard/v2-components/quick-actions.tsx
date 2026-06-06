"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  PlayCircle,
  FolderOpen,
  Upload,
  Send,
  RotateCcw,
  MessageSquare,
  Pause,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { ContributorCard } from "@/app/contributor/_shared/primitives";

interface QuickAction {
  label: string;
  icon: LucideIcon;
  href?: string;
  tone?: "primary" | "default";
  caption?: string;
}

const actions: QuickAction[] = [
  { label: "Continue work", icon: PlayCircle, tone: "primary", href: "/contributor/tasks", caption: "Resume your last task" },
  { label: "Open workroom", icon: FolderOpen, href: "/contributor/tasks" },
  { label: "Upload evidence", icon: Upload, href: "/contributor/tasks" },
  { label: "Submit work", icon: Send, href: "/contributor/tasks" },
  { label: "View revisions", icon: RotateCcw, href: "/contributor/tasks" },
  { label: "Contact mentor", icon: MessageSquare, href: "/contributor/messages" },
  { label: "Resume blocked task", icon: Pause, href: "/contributor/tasks" },
];

/**
 * Quick Actions — a row of operational shortcuts.
 * Calm and chunky; contributor portal favors clear buttons over icon-only.
 */
export function QuickActions() {
  const router = useRouter();
  return (
    <ContributorCard padded={false} className="p-4 md:p-5">
      <div className="flex items-center gap-3 mb-3">
        <h2 className="text-[12px] font-semibold uppercase tracking-[0.14em] text-beige-700">
          Quick actions
        </h2>
        <span className="text-[11px] text-beige-600">— jump straight to what you need</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {actions.map((a) => (
          <button
            key={a.label}
            type="button"
            onClick={() => a.href && router.push(a.href)}
            title={a.caption}
            className={cn(
              "inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-[12.5px] font-semibold transition-colors",
              a.tone === "primary"
                ? "border-teal-300 bg-teal-50 text-teal-800 hover:bg-teal-100"
                : "border-beige-200 bg-white text-brown-900 hover:border-beige-300 hover:bg-beige-50/40"
            )}
          >
            <a.icon className="h-4 w-4" />
            {a.label}
          </button>
        ))}
      </div>
    </ContributorCard>
  );
}
