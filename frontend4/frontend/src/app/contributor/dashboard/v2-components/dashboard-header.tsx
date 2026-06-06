"use client";

import * as React from "react";
import { useSession } from "next-auth/react";
import { Search, Bell, Sparkles, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { AiGlyph } from "@/app/contributor/_shared/primitives";
import { isActive, isUrgent } from "@/mocks/data/contributor-workspace";
import { useContributorTaskList } from "@/lib/contributor/use-contributor-tasks";

/**
 * Contributor Dashboard Header — welcoming, productivity-oriented entry point.
 *
 * Greets by name, surfaces today's headline counts in plain language,
 * provides search + notifications + AI assistant entry. Deliberately
 * different from the mentor portal's operational page header — softer,
 * more spacious, more inviting.
 */
export function DashboardHeader() {
  const { data: session } = useSession();
  const contributorTasks = useContributorTaskList();
  const name =
    session?.user?.name?.split(" ")[0] ||
    (session?.user?.email as string | undefined)?.split("@")[0] ||
    "there";

  const active = contributorTasks.filter(isActive).length;
  const urgent = contributorTasks.filter(isUrgent).length;
  const revisions = contributorTasks.filter((t) => t.state === "revision_requested").length;

  const today = new Date();
  const greeting = greetingFor(today);
  const dateLabel = today.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="rounded-3xl bg-gradient-to-br from-beige-50 via-white to-teal-50/30 border border-beige-200 px-6 py-5 md:px-8 md:py-7">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-5">
        {/* Greeting + headline */}
        <div className="flex-1 min-w-0">
          <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-teal-700">
            <CalendarDays className="h-3 w-3" />
            {dateLabel}
          </p>
          <h1 className="font-heading text-[28px] md:text-[32px] font-semibold text-brown-950 leading-tight mt-1.5">
            {greeting}, {name} 👋
          </h1>
          <p className="text-[13.5px] text-beige-700 mt-2 max-w-2xl leading-relaxed">
            <ProductivityHeadline active={active} urgent={urgent} revisions={revisions} />
          </p>
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-beige-200 bg-white px-3 text-[12.5px] text-beige-700 hover:border-beige-300 hover:bg-beige-50/40 transition-colors"
            title="Search tasks, projects, submissions"
          >
            <Search className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Search work</span>
            <kbd className="hidden md:inline-flex items-center rounded border border-beige-200 bg-beige-50 px-1.5 py-0.5 text-[10px] font-mono text-beige-600">
              /
            </kbd>
          </button>
          <button
            type="button"
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-beige-200 bg-white text-beige-700 hover:bg-beige-50/60 transition-colors"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute top-2 right-2 inline-flex h-1.5 w-1.5 rounded-full bg-teal-500" />
          </button>
          <button
            type="button"
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-teal-200 bg-teal-50 px-3 text-[12.5px] font-semibold text-teal-800 hover:bg-teal-100 transition-colors"
            title="Open AI assistant"
          >
            <AiGlyph />
            Ask AI
          </button>
        </div>
      </div>

      {/* Sub-line counts */}
      <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-[12px] text-beige-700">
        <SubMetric Icon={Sparkles} label="Active work" value={active} highlight />
        <span className="text-beige-300">·</span>
        <SubMetric label="Due in the next 24h" value={urgent} tone={urgent > 0 ? "warn" : "default"} />
        <span className="text-beige-300">·</span>
        <SubMetric label="Revisions to address" value={revisions} tone={revisions > 0 ? "warn" : "default"} />
        <span className="text-beige-300">·</span>
        <SubMetric label="Streak" value="6 clean accepts" tone="positive" />
      </div>
    </div>
  );
}

function ProductivityHeadline({
  active,
  urgent,
  revisions,
}: {
  active: number;
  urgent: number;
  revisions: number;
}) {
  if (urgent === 0 && revisions === 0) {
    return (
      <>
        You have <strong className="text-brown-900">{active} active task{active === 1 ? "" : "s"}</strong>{" "}
        on your plate today — nothing urgent, momentum looks strong.
      </>
    );
  }
  if (urgent > 0 && revisions === 0) {
    return (
      <>
        <strong className="text-brown-900">{urgent} task{urgent === 1 ? "" : "s"}</strong> due in the next 24 hours.
        Let's focus there first.
      </>
    );
  }
  if (urgent === 0 && revisions > 0) {
    return (
      <>
        <strong className="text-brown-900">{revisions} revision{revisions === 1 ? "" : "s"}</strong> waiting for your
        attention — quick fixes today will keep things moving.
      </>
    );
  }
  return (
    <>
      <strong className="text-brown-900">{urgent} due soon</strong> ·{" "}
      <strong className="text-brown-900">{revisions} revision{revisions === 1 ? "" : "s"} to address</strong>. Together
      they should clear in a focused morning.
    </>
  );
}

function SubMetric({
  Icon,
  label,
  value,
  highlight,
  tone = "default",
}: {
  Icon?: React.ElementType;
  label: string;
  value: string | number;
  highlight?: boolean;
  tone?: "default" | "warn" | "positive";
}) {
  const toneClass =
    tone === "warn"
      ? "text-gold-700"
      : tone === "positive"
      ? "text-teal-700"
      : highlight
      ? "text-brown-950"
      : "text-beige-700";
  return (
    <span className="inline-flex items-center gap-1.5">
      {Icon && <Icon className={cn("h-3 w-3", toneClass)} />}
      <span className={cn("font-semibold tabular-nums", toneClass)}>{value}</span>
      <span className="text-beige-600">{label}</span>
    </span>
  );
}

function greetingFor(d: Date): string {
  const h = d.getHours();
  if (h < 5) return "Working late";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  if (h < 21) return "Good evening";
  return "Hey";
}
