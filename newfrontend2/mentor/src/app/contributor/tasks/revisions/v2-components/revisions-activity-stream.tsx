"use client";

import * as React from "react";
import {
  Award,
  CheckCircle2,
  FileText,
  MessageCircle,
  PlayCircle,
  RefreshCw,
  Save,
  Send,
  Upload,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import {
  ContributorCard,
  ContributorSectionHeader,
} from "@/app/contributor/_shared/primitives";
import {
  useContributorTasksStore,
  type ActivityEvent,
  type ActivityKind,
} from "@/lib/stores/contributor-tasks-store";

const kindMeta: Record<
  ActivityKind,
  { Icon: React.ComponentType<{ className?: string }>; ring: string; tint: string; label: string }
> = {
  feedback_received: {
    Icon: FileText,
    ring: "ring-gold-200 bg-gold-50",
    tint: "text-gold-800",
    label: "Mentor feedback received",
  },
  correction_resolved: {
    Icon: CheckCircle2,
    ring: "ring-forest-200 bg-forest-50",
    tint: "text-forest-700",
    label: "Correction resolved",
  },
  clarification_sent: {
    Icon: MessageCircle,
    ring: "ring-teal-200 bg-teal-50",
    tint: "text-teal-700",
    label: "Clarification sent",
  },
  clarification_replied: {
    Icon: MessageCircle,
    ring: "ring-teal-200 bg-teal-50",
    tint: "text-teal-700",
    label: "Mentor replied",
  },
  draft_saved: {
    Icon: Save,
    ring: "ring-beige-200 bg-beige-50",
    tint: "text-beige-700",
    label: "Draft saved",
  },
  evidence_added: {
    Icon: Upload,
    ring: "ring-teal-200 bg-teal-50",
    tint: "text-teal-700",
    label: "Evidence uploaded",
  },
  resubmitted: {
    Icon: Send,
    ring: "ring-forest-200 bg-forest-50",
    tint: "text-forest-700",
    label: "Resubmitted for review",
  },
  accepted: {
    Icon: PlayCircle,
    ring: "ring-teal-200 bg-teal-50",
    tint: "text-teal-700",
    label: "Task accepted",
  },
  submitted: {
    Icon: Send,
    ring: "ring-teal-200 bg-teal-50",
    tint: "text-teal-700",
    label: "Submitted for review",
  },
  approved: {
    Icon: Award,
    ring: "ring-forest-200 bg-forest-50",
    tint: "text-forest-700",
    label: "Mentor accepted",
  },
};

export function RevisionsActivityStream({
  onJumpToRow,
}: {
  onJumpToRow: (taskId: string) => void;
}) {
  const activity = useContributorTasksStore((s) => s.activity);
  const events: ActivityEvent[] = React.useMemo(() => activity.slice(0, 12), [activity]);

  return (
    <ContributorCard>
      <ContributorSectionHeader
        title="Recent revision activity"
        caption="What's moved across all your revisions — live from the contributor workflow."
        trailing={
          <span className="inline-flex items-center gap-1 rounded-full border border-beige-200 bg-beige-50 px-2 py-[1px] text-[10.5px] font-semibold text-beige-700">
            <RefreshCw className="h-3 w-3" />
            {events.length} events
          </span>
        }
      />
      <ol className="relative space-y-2 before:absolute before:left-[15px] before:top-2 before:bottom-2 before:w-px before:bg-beige-200">
        {events.length === 0 && (
          <li className="text-[12px] text-beige-700 italic px-3 py-4">
            No activity yet — actions you take across the contributor workflow will appear here.
          </li>
        )}
        {events.map((e) => {
          const meta = kindMeta[e.kind];
          const { Icon } = meta;
          return (
            <li key={e.id} className="relative pl-10">
              <span
                className={cn(
                  "absolute left-0 top-0 inline-flex h-8 w-8 items-center justify-center rounded-full ring-2 ring-white",
                  meta.ring,
                )}
              >
                <Icon className={cn("h-3.5 w-3.5", meta.tint)} />
              </span>
              <button
                type="button"
                onClick={() => onJumpToRow(e.taskId)}
                className="w-full text-left rounded-xl border border-beige-200 bg-white px-3 py-2 hover:border-teal-200 hover:bg-teal-50/30 transition-colors"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <p className={cn("text-[10.5px] font-bold uppercase tracking-[0.14em]", meta.tint)}>
                    {meta.label}
                  </p>
                  <p className="text-[10.5px] text-beige-600 tabular-nums">{e.at}</p>
                </div>
                <p className="text-[12px] text-brown-900 mt-1 leading-snug">{e.detail}</p>
                {e.mentor && (
                  <p className="text-[10.5px] text-beige-600 mt-0.5">with {e.mentor}</p>
                )}
              </button>
            </li>
          );
        })}
      </ol>
    </ContributorCard>
  );
}
