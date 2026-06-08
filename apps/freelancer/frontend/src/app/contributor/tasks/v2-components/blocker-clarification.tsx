"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Pause,
  MessageCircleQuestion,
  ChevronRight,
  Bell,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import {
  ContributorCard,
  ContributorSectionHeader,
  ContributorStateChip,
  DeadlinePill,
} from "@/app/contributor/_shared/primitives";
import type { ContributorTask } from "@/mocks/data/contributor-workspace";
import { useContributorTaskList } from "@/lib/contributor/use-contributor-tasks";

/**
 * Blocker & Clarification panel — supportive, contributor-friendly.
 *
 * Surfaces every paused task and every awaiting-clarification thread. The
 * tone explicitly assigns cause to the platform or to a pending mentor
 * reply — never to the contributor. CTA is "I'll let you know" subscription
 * rather than urgency.
 */
export function BlockerClarificationPanel({
  onSelect,
}: {
  onSelect: (task: ContributorTask) => void;
}) {
  const router = useRouter();
  const tasks = useContributorTaskList();
  const blocked = tasks.filter((t) => t.state === "blocked");
  const awaiting = tasks.filter((t) => t.state === "awaiting_clarification");

  if (blocked.length === 0 && awaiting.length === 0) {
    return null;
  }

  return (
    <section>
      <ContributorSectionHeader
        title="What we're waiting on"
        caption="Tasks paused or awaiting a reply — nothing here is your fault, and your work is safe."
      />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {blocked.map((t) => (
          <WaitingCard
            key={t.id}
            task={t}
            kind="blocked"
            icon={Pause}
            label="Paused"
            primaryLabel={t.blockers?.[0]?.reason ?? "Outside your control"}
            secondaryLabel={
              t.blockers?.[0]?.expectedResolution
                ? `Expected back ${t.blockers[0].expectedResolution}.`
                : "We'll reach out when this unblocks."
            }
            cta="Notify me when ready"
            onSelect={() => onSelect(t)}
            onOpen={() => router.push(`/contributor/tasks/${t.id}`)}
          />
        ))}
        {awaiting.map((t) => (
          <WaitingCard
            key={t.id}
            task={t}
            kind="awaiting"
            icon={MessageCircleQuestion}
            label="Awaiting reply"
            primaryLabel={`Conversation with your mentor`}
            secondaryLabel="The deadline is still ticking — pause it from inside the workroom if it gets tight."
            cta="Open conversation"
            onSelect={() => onSelect(t)}
            onOpen={() => router.push(`/contributor/tasks/${t.id}`)}
          />
        ))}
      </div>
    </section>
  );
}

function WaitingCard({
  task,
  kind,
  icon: Icon,
  label,
  primaryLabel,
  secondaryLabel,
  cta,
  onSelect,
  onOpen,
}: {
  task: ContributorTask;
  kind: "blocked" | "awaiting";
  icon: LucideIcon;
  label: string;
  primaryLabel: string;
  secondaryLabel: string;
  cta: string;
  onSelect: () => void;
  onOpen: () => void;
}) {
  const tone =
    kind === "blocked"
      ? { iconWrap: "border-beige-200 bg-beige-50 text-beige-700", border: "border-beige-200", bg: "bg-beige-50/30" }
      : { iconWrap: "border-gold-200 bg-gold-50 text-gold-700", border: "border-gold-200", bg: "bg-gold-50/30" };

  return (
    <ContributorCard padded={false} className={cn("p-4", tone.border)}>
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "shrink-0 inline-flex h-9 w-9 items-center justify-center rounded-xl border",
            tone.iconWrap
          )}
        >
          <Icon className="h-4 w-4" />
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className={cn(
                "inline-flex items-center rounded-full border px-2 py-[1px] text-[10px] font-bold uppercase tracking-wider",
                kind === "blocked"
                  ? "border-beige-300 bg-white text-beige-800"
                  : "border-gold-300 bg-white text-gold-800"
              )}
            >
              {label}
            </span>
            <ContributorStateChip state={task.state} size="sm" />
          </div>
          <p className="mt-1.5 text-[13px] font-semibold text-brown-950 truncate">{task.title}</p>
          <p className="text-[11px] text-beige-700 truncate mt-0.5">
            {task.project} · {task.skill} {task.skillLevel}
          </p>
        </div>
        <DeadlinePill hoursRemaining={task.deadlineHoursRemaining} />
      </div>

      <div className={cn("mt-3 rounded-lg px-3 py-2 text-[12px]", tone.bg)}>
        <p className="font-semibold text-brown-900">{primaryLabel}</p>
        <p className="mt-0.5 text-[11.5px] text-beige-700">{secondaryLabel}</p>
      </div>

      <div className="mt-3 flex items-center justify-between text-[10.5px] text-beige-600">
        <button
          type="button"
          onClick={onSelect}
          className="inline-flex items-center gap-1 font-semibold text-brown-700 hover:text-brown-900"
        >
          Preview details
          <ChevronRight className="h-3 w-3" />
        </button>
        <div className="flex items-center gap-3">
          <button className="inline-flex items-center gap-1 font-semibold text-brown-700 hover:text-brown-900">
            <Bell className="h-3 w-3" />
            {kind === "blocked" ? "Notify when ready" : "Pause SLA"}
          </button>
          <button
            type="button"
            onClick={onOpen}
            className="inline-flex items-center gap-1 font-semibold text-teal-700 hover:text-teal-800"
          >
            {cta}
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      </div>
    </ContributorCard>
  );
}
