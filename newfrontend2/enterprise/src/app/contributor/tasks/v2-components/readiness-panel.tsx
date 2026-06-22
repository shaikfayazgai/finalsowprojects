"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Inbox,
  CheckCircle2,
  Circle,
  AlertCircle,
  ArrowUpRight,
  MessageSquare,
  Heart,
  Upload,
  PlayCircle,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import {
  ContributorCard,
  ContributorStateChip,
  DeadlinePill,
  PriorityChip,
  ReadinessBar,
  AiGlyph,
} from "@/app/contributor/_shared/primitives";
import {
  type ContributorTask,
} from "@/mocks/data/contributor-workspace";

interface ReadinessPanelProps {
  task: ContributorTask | null;
}

/**
 * Readiness Preview Panel — right rail.
 *
 * When a row in the workload table is selected, surfaces the operational
 * readiness context: dependencies, required evidence, mentor guidance,
 * blockers, AI recommendations. Open-workroom CTA in the footer.
 *
 * Tone is supportive and forward-looking — not a judgment panel.
 */
export function ReadinessPanel({ task }: ReadinessPanelProps) {
  const router = useRouter();

  if (!task) {
    return (
      <ContributorCard className="sticky top-2 self-start h-fit text-center">
        <div className="py-8">
          <div className="mx-auto h-10 w-10 rounded-xl border border-beige-200 bg-beige-50/60 flex items-center justify-center text-beige-700">
            <Inbox className="h-5 w-5" />
          </div>
          <p className="mt-3 text-[13px] font-semibold text-brown-950">Select a task to preview</p>
          <p className="mt-1 text-[11.5px] text-beige-700 leading-snug">
            Pick any row to see readiness, dependencies, mentor guidance, and the next operational step
            in one place.
          </p>
        </div>
      </ContributorCard>
    );
  }

  return (
    <ContributorCard padded={false} className="sticky top-2 self-start h-fit overflow-hidden">
      <Header task={task} />
      <div className="px-4 py-4 space-y-4">
        <SummaryBlock task={task} />
        <ReadinessChecklist task={task} />
        <RequiredEvidence task={task} />
        {(task.state === "blocked" || task.state === "awaiting_clarification") && (
          <BlockerBlock task={task} />
        )}
        {task.mentorFeedback?.received && <MentorGuidance task={task} />}
        {task.aiNextAction && <AiSuggestion task={task} />}
      </div>
      <Footer
        task={task}
        onOpen={() =>
          router.push(
            task.state === "revision_requested"
              ? `/contributor/tasks/${task.id}/revision`
              : `/contributor/tasks/${task.id}`,
          )
        }
      />
    </ContributorCard>
  );
}

function Header({ task }: { task: ContributorTask }) {
  return (
    <div className="px-4 pt-4 pb-3 border-b border-beige-200 bg-white">
      <p className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-teal-700">
        Task · {task.id}
      </p>
      <h3 className="font-heading text-[16px] font-semibold text-brown-950 leading-tight mt-1">
        {task.title}
      </h3>
      <div className="mt-2 flex items-center gap-1.5 flex-wrap">
        <ContributorStateChip state={task.state} size="sm" />
        <PriorityChip priority={task.priority} />
        <span className="text-[11px] text-beige-700">
          {task.skill} {task.skillLevel}
        </span>
      </div>
    </div>
  );
}

function SummaryBlock({ task }: { task: ContributorTask }) {
  return (
    <section>
      <p className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-beige-700">At a glance</p>
      <div className="mt-2 grid grid-cols-2 gap-2 text-[11.5px]">
        <Cell label="Deadline"><DeadlinePill hoursRemaining={task.deadlineHoursRemaining} /></Cell>
        <Cell label="Payout"><span className="font-semibold text-brown-950 tabular-nums">{task.payoutAmount}</span></Cell>
        <Cell label="Progress"><span className="font-semibold text-brown-950 tabular-nums">{task.progressPct}%</span></Cell>
        <Cell label="Time left">
          <span className="font-semibold text-brown-950 tabular-nums">
            ~{Math.round(task.estimatedMinutesRemaining / 60 * 10) / 10}h
          </span>
        </Cell>
      </div>
      <div className="mt-3">
        <p className="text-[10px] font-bold uppercase tracking-wider text-beige-700 mb-1">Submission readiness</p>
        <ReadinessBar value={task.readinessScore} />
      </div>
    </section>
  );
}

function ReadinessChecklist({ task }: { task: ContributorTask }) {
  const addressed = task.acceptanceCriteria.filter((c) => c.addressed).length;
  const total = task.acceptanceCriteria.length;
  return (
    <section>
      <div className="flex items-center justify-between">
        <p className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-beige-700">
          Acceptance criteria
        </p>
        <span className="text-[10.5px] tabular-nums text-beige-700">
          {addressed} of {total} covered
        </span>
      </div>
      <ul className="mt-2 space-y-1">
        {task.acceptanceCriteria.slice(0, 6).map((c) => (
          <li key={c.id} className="flex items-start gap-2">
            {c.addressed ? (
              <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 text-forest-600 shrink-0" />
            ) : (
              <Circle className="h-3.5 w-3.5 mt-0.5 text-beige-400 shrink-0" />
            )}
            <span className={cn("text-[12px]", c.addressed ? "text-beige-700 line-through" : "text-brown-900")}>
              {c.label}
            </span>
          </li>
        ))}
        {task.acceptanceCriteria.length > 6 && (
          <li className="text-[10.5px] text-beige-600 italic px-1">
            + {task.acceptanceCriteria.length - 6} more in the workroom
          </li>
        )}
      </ul>
    </section>
  );
}

function RequiredEvidence({ task }: { task: ContributorTask }) {
  return (
    <section>
      <p className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-beige-700">
        Evidence completeness
      </p>
      <div className="mt-2 rounded-lg border border-beige-200 bg-beige-50/40 px-3 py-2 text-[11.5px]">
        <div className="flex items-center gap-2 mb-1.5">
          {task.evidenceCompleteness >= 80 ? (
            <CheckCircle2 className="h-3.5 w-3.5 text-forest-600 shrink-0" />
          ) : task.evidenceCompleteness >= 40 ? (
            <AlertCircle className="h-3.5 w-3.5 text-gold-600 shrink-0" />
          ) : (
            <Circle className="h-3.5 w-3.5 text-beige-400 shrink-0" />
          )}
          <span className="font-semibold text-brown-900">
            {task.evidenceCompleteness}% of required artifacts attached
          </span>
        </div>
        <p className="text-beige-700">
          {task.evidenceCompleteness >= 80
            ? "You've covered the essentials. Polish anything missing before submit."
            : task.evidenceCompleteness >= 40
            ? "Getting there — keep gathering artifacts as you work."
            : "Start collecting artifacts as you complete each deliverable."}
        </p>
      </div>
    </section>
  );
}

function BlockerBlock({ task }: { task: ContributorTask }) {
  if (task.state === "awaiting_clarification") {
    return (
      <section>
        <p className="inline-flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.14em] text-gold-700">
          <MessageSquare className="h-3 w-3" />
          Awaiting mentor reply
        </p>
        <div className="mt-1.5 rounded-lg border border-gold-200 bg-gold-50/40 px-3 py-2 text-[11.5px] text-brown-900">
          You asked a clarifying question. The deadline is still ticking — but if it gets tight, we can pause
          it for you. Open the workroom to follow up.
        </div>
      </section>
    );
  }
  if (task.state === "blocked") {
    return (
      <section>
        <p className="inline-flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.14em] text-beige-700">
          Paused
        </p>
        <div className="mt-1.5 rounded-lg border border-beige-200 bg-beige-50 px-3 py-2 text-[11.5px] text-beige-900">
          <p className="font-semibold text-brown-900">
            {task.blockers?.[0]?.reason ?? "Outside your control"}
          </p>
          {task.blockers?.[0]?.expectedResolution && (
            <p className="text-beige-700 mt-0.5">
              Expected back {task.blockers[0].expectedResolution}.
            </p>
          )}
          <p className="text-beige-700 mt-1">
            Not your fault — your work is safely saved. We'll reach out when this unblocks.
          </p>
        </div>
      </section>
    );
  }
  return null;
}

function MentorGuidance({ task }: { task: ContributorTask }) {
  const fb = task.mentorFeedback!;
  return (
    <section>
      <p className="inline-flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.14em] text-forest-700">
        <Heart className="h-3 w-3" />
        Mentor guidance
      </p>
      {fb.whatWorked && (
        <div className="mt-1.5 rounded-lg border border-forest-200 bg-forest-50/40 px-3 py-2 text-[11.5px] text-brown-900 italic">
          &ldquo;{fb.whatWorked}&rdquo;
        </div>
      )}
      {fb.requiredCorrections && fb.requiredCorrections.length > 0 && (
        <p className="mt-2 text-[10.5px] text-beige-700">
          <strong className="tabular-nums">
            {fb.requiredCorrections.filter((c) => !c.addressed).length} polish item
            {fb.requiredCorrections.filter((c) => !c.addressed).length === 1 ? "" : "s"}
          </strong>{" "}
          still to address — open the workroom to walk through them.
        </p>
      )}
    </section>
  );
}

function AiSuggestion({ task }: { task: ContributorTask }) {
  return (
    <section>
      <p className="inline-flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.14em] text-teal-700">
        <AiGlyph className="h-3 w-3" />
        Suggested next step
      </p>
      <div className="mt-1.5 rounded-lg border border-teal-200 bg-teal-50/40 px-3 py-2 text-[12px] text-brown-900">
        {task.aiCue && <p className="leading-snug">{task.aiCue}</p>}
        {task.aiNextAction && (
          <p className="mt-1 font-semibold text-teal-800">→ {task.aiNextAction}</p>
        )}
      </div>
    </section>
  );
}

function Footer({ task, onOpen }: { task: ContributorTask; onOpen: () => void }) {
  const primaryLabel =
    task.state === "ready_for_submission"
      ? "Review and submit"
      : task.state === "revision_requested"
      ? "Open revision"
      : task.state === "blocked"
      ? "View task"
      : task.state === "awaiting_clarification"
      ? "Open conversation"
      : task.state === "assigned"
      ? "Review task"
      : task.state === "under_review"
      ? "View submission"
      : "Open workroom";

  return (
    <div className="border-t border-beige-200 bg-white px-4 py-3 space-y-2">
      <button
        type="button"
        onClick={onOpen}
        className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-[13px] font-bold text-white hover:bg-teal-700 transition-colors"
      >
        <PlayCircle className="h-4 w-4" />
        {primaryLabel}
        <ArrowUpRight className="h-3.5 w-3.5" />
      </button>
      <div className="grid grid-cols-3 gap-1.5 text-[11px]">
        <SecondaryAction icon={Upload} label="Upload" />
        <SecondaryAction icon={MessageSquare} label="Clarify" />
        <SecondaryAction icon={ArrowUpRight} label="Open" onClick={onOpen} />
      </div>
    </div>
  );
}

function SecondaryAction({
  icon: Icon,
  label,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center justify-center gap-1.5 rounded-md border border-beige-200 bg-white px-2 py-1.5 text-[11px] font-semibold text-brown-900 hover:bg-beige-50/60"
    >
      <Icon className="h-3 w-3" />
      {label}
    </button>
  );
}

function Cell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-md border border-beige-200 bg-white px-2 py-1.5">
      <p className="text-[9.5px] font-bold uppercase tracking-wider text-beige-700">{label}</p>
      <div className="mt-0.5">{children}</div>
    </div>
  );
}
