"use client";

import * as React from "react";
import {
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronRight,
  Lightbulb,
  Wrench,
  FileSearch,
  Send,
  MessageCircleQuestion,
  History,
  Pause,
  Play,
  Paperclip,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import {
  ContributorCard,
  ContributorSectionHeader,
  AiGlyph,
  AiSuggestionConfidence,
  ReadinessBar,
} from "@/app/contributor/_shared/primitives";
import type {
  ClarificationMessage,
  WorkroomAiSuggestion,
  WorkroomTask,
} from "@/mocks/data/contributor-workroom-detail";

interface ContextPanelProps {
  task: WorkroomTask;
}

/**
 * Workroom Context Panel — the right rail of the cockpit.
 *
 * Five collapsible sections, each answering one question the contributor
 * carries while working:
 *   - Acceptance criteria (am I covering everything?)
 *   - AI helpers (need a starting point?)
 *   - Progress (where am I?)
 *   - Clarification thread (is the mentor waiting on me?)
 *   - History (what happened in earlier rounds?)
 */
export function ContextPanel({ task }: ContextPanelProps) {
  return (
    <div className="space-y-3">
      <AcceptanceCriteria task={task} />
      <AiHelpers task={task} />
      <ProgressContinuity task={task} />
      {task.clarification && <ClarificationThread task={task} />}
      {task.history.length > 0 && <RoundHistory task={task} />}
    </div>
  );
}

/* ─────────────────────── Acceptance criteria ─────────────────────── */

function AcceptanceCriteria({ task }: { task: WorkroomTask }) {
  const addressed = task.acceptanceCriteria.filter((c) => c.addressed).length;
  const total = task.acceptanceCriteria.length;
  return (
    <ContributorCard padded={false} className="p-4">
      <ContributorSectionHeader
        title="Acceptance criteria"
        caption={`${addressed} of ${total} covered`}
      />
      <ul className="space-y-1.5">
        {task.acceptanceCriteria.map((c) => (
          <li key={c.id} className="flex items-start gap-2">
            {c.addressed ? (
              <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 text-forest-600 shrink-0" />
            ) : (
              <Circle className="h-3.5 w-3.5 mt-0.5 text-beige-400 shrink-0" />
            )}
            <span
              className={cn(
                "text-[12px]",
                c.addressed ? "text-beige-700 line-through" : "text-brown-900"
              )}
            >
              {c.label}
            </span>
          </li>
        ))}
      </ul>
    </ContributorCard>
  );
}

/* ─────────────────────── AI helpers (summoned, collapsible) ─────────────────────── */

const aiKindIcon: Record<WorkroomAiSuggestion["kind"], LucideIcon> = {
  next_step: Lightbulb,
  evidence: FileSearch,
  submission_check: Send,
  fix_suggestion: Wrench,
  workflow_tip: Lightbulb,
};

const aiKindLabel: Record<WorkroomAiSuggestion["kind"], string> = {
  next_step: "Next step",
  evidence: "Evidence",
  submission_check: "Submission",
  fix_suggestion: "Fix help",
  workflow_tip: "Tip",
};

function AiHelpers({ task }: { task: WorkroomTask }) {
  const [open, setOpen] = React.useState(true);
  return (
    <ContributorCard padded={false} className="p-4">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center gap-2.5 text-left"
      >
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-teal-200 bg-teal-50 text-teal-700">
          <AiGlyph className="h-3 w-3" />
        </span>
        <div className="flex-1 min-w-0">
          <p className="font-heading text-[13.5px] font-semibold text-brown-950 leading-tight">
            Helpers
          </p>
          <p className="text-[10.5px] text-beige-700">
            {task.aiSuggestions.length} suggestions · summoned, not pushed
          </p>
        </div>
        {open ? (
          <ChevronDown className="h-3.5 w-3.5 text-beige-600" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 text-beige-600" />
        )}
      </button>
      {open && (
        <ul className="mt-3 space-y-2">
          {task.aiSuggestions.map((s) => (
            <li key={s.id}>
              <AiSuggestionCard suggestion={s} />
            </li>
          ))}
        </ul>
      )}
      {open && (
        <p className="mt-2 text-[10px] text-beige-600 italic">
          Each suggestion is a starting point — your call to use or skip.
        </p>
      )}
    </ContributorCard>
  );
}

function AiSuggestionCard({ suggestion }: { suggestion: WorkroomAiSuggestion }) {
  const Icon = aiKindIcon[suggestion.kind];
  return (
    <div className="rounded-lg border border-teal-200 bg-teal-50/30 px-3 py-2.5">
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="inline-flex items-center gap-1 rounded-full border border-teal-200 bg-white px-1.5 py-[1px] text-[9.5px] font-bold uppercase tracking-wider text-teal-700">
          <Icon className="h-2.5 w-2.5" />
          {aiKindLabel[suggestion.kind]}
        </span>
        <AiSuggestionConfidence level={suggestion.confidence} />
      </div>
      <p className="mt-1.5 text-[12px] font-semibold text-brown-950 leading-tight">{suggestion.title}</p>
      <p className="mt-1 text-[11.5px] text-brown-800 leading-relaxed">{suggestion.detail}</p>
      {suggestion.cta && (
        <button
          type="button"
          className="mt-2 inline-flex items-center gap-1 rounded-md bg-teal-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-teal-700"
        >
          {suggestion.cta}
        </button>
      )}
    </div>
  );
}

/* ─────────────────────── Progress continuity ─────────────────────── */

function ProgressContinuity({ task }: { task: WorkroomTask }) {
  return (
    <ContributorCard padded={false} className="p-4">
      <ContributorSectionHeader
        title="Where you are"
        caption={`${task.progressPct}% through · ~${task.estimatedMinutesRemaining}min remaining`}
      />
      <ReadinessBar value={task.progressPct} label="progress" />
      <div className="mt-3 pt-3 border-t border-beige-200/70 grid grid-cols-3 gap-2">
        <MiniStat label="Steps done" value={`${task.instructions.filter((i) => i.status === "done").length}/${task.instructions.length}`} />
        <MiniStat
          label="Deliverables"
          value={`${task.deliverables.filter((d) => d.status === "done").length}/${task.deliverables.length}`}
        />
        <MiniStat
          label="Criteria"
          value={`${task.acceptanceCriteria.filter((c) => c.addressed).length}/${task.acceptanceCriteria.length}`}
        />
      </div>
    </ContributorCard>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-beige-200 bg-beige-50/40 px-2 py-1.5">
      <p className="text-[9.5px] font-bold uppercase tracking-wider text-beige-700">{label}</p>
      <p className="mt-0.5 text-[12px] font-bold text-brown-950 tabular-nums">{value}</p>
    </div>
  );
}

/* ─────────────────────── Clarification thread ─────────────────────── */

function ClarificationThread({ task }: { task: WorkroomTask }) {
  const c = task.clarification!;
  const [open, setOpen] = React.useState(c.status !== "resolved");
  return (
    <ContributorCard padded={false} className="p-4">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center gap-2.5 text-left"
      >
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-beige-200 bg-beige-50 text-beige-700">
          <MessageCircleQuestion className="h-3.5 w-3.5" />
        </span>
        <div className="flex-1 min-w-0">
          <p className="font-heading text-[13.5px] font-semibold text-brown-950 leading-tight">
            Conversation with {task.mentor.name.split(" ")[0]}
          </p>
          <p className="text-[10.5px] text-beige-700">
            {c.status === "pending" && "Awaiting reply"}
            {c.status === "answered" && "Latest reply received"}
            {c.status === "resolved" && "Resolved"}
            {c.pauseSla && (
              <span className="inline-flex items-center gap-0.5 ml-1 text-gold-700">
                <Pause className="h-2.5 w-2.5" /> SLA paused
              </span>
            )}
            {!c.pauseSla && (
              <span className="inline-flex items-center gap-0.5 ml-1 text-beige-600">
                <Play className="h-2.5 w-2.5" /> Deadline running
              </span>
            )}
          </p>
        </div>
        {open ? (
          <ChevronDown className="h-3.5 w-3.5 text-beige-600" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 text-beige-600" />
        )}
      </button>
      {open && (
        <ol className="mt-3 space-y-2 max-h-64 overflow-y-auto">
          {c.messages.map((m) => (
            <li key={m.id}>
              <MessageBubble message={m} />
            </li>
          ))}
        </ol>
      )}
      {open && (
        <textarea
          rows={2}
          placeholder="Reply to your mentor…"
          className="mt-2 w-full rounded-lg border border-beige-200 bg-white px-2.5 py-1.5 text-[11.5px] text-brown-900 placeholder:text-beige-500 outline-none focus:border-teal-300 focus:ring-2 focus:ring-teal-100"
        />
      )}
    </ContributorCard>
  );
}

function MessageBubble({ message }: { message: ClarificationMessage }) {
  const isContributor = message.authorRole === "contributor";
  return (
    <div
      className={cn(
        "rounded-lg border px-2.5 py-1.5",
        isContributor
          ? "border-teal-200 bg-teal-50/40"
          : message.authorRole === "system"
          ? "border-beige-200 bg-beige-50"
          : "border-beige-200 bg-white"
      )}
    >
      <div className="flex items-center gap-1.5 text-[10.5px]">
        <span
          className={cn(
            "inline-flex items-center rounded border px-1 py-[1px] text-[9px] font-bold uppercase tracking-wider",
            isContributor
              ? "border-teal-200 bg-white text-teal-700"
              : "border-brown-200 bg-white text-brown-700"
          )}
        >
          {isContributor ? "You" : message.authorRole === "mentor" ? "Mentor" : "System"}
        </span>
        <span className="font-semibold text-brown-950">{message.author}</span>
        <span className="font-mono text-beige-500 tabular-nums ml-auto">{message.at}</span>
      </div>
      <p className="mt-1 text-[11.5px] text-brown-900 leading-snug">{message.body}</p>
      {message.attachments && message.attachments.length > 0 && (
        <p className="mt-1 inline-flex items-center gap-1 text-[10px] text-beige-600">
          <Paperclip className="h-2.5 w-2.5" />
          {message.attachments.map((a) => a.label).join(", ")}
        </p>
      )}
    </div>
  );
}

/* ─────────────────────── Round history ─────────────────────── */

function RoundHistory({ task }: { task: WorkroomTask }) {
  return (
    <ContributorCard padded={false} className="p-4">
      <ContributorSectionHeader
        title="Earlier rounds"
        caption="What's already happened on this task"
      />
      <ol className="space-y-1.5">
        {task.history.map((h) => (
          <li
            key={h.round}
            className="rounded-lg border border-beige-200 bg-beige-50/40 px-3 py-2"
          >
            <div className="flex items-center gap-2 text-[11px]">
              <History className="h-3 w-3 text-beige-600" />
              <span className="font-semibold text-brown-950">Round {h.round}</span>
              <span className="text-beige-600">·</span>
              <span
                className={cn(
                  "font-semibold uppercase text-[9.5px] tracking-wider",
                  h.outcome === "passed"
                    ? "text-forest-700"
                    : h.outcome === "failed"
                    ? "text-gold-800"
                    : "text-beige-700"
                )}
              >
                {h.outcome}
              </span>
              <span className="ml-auto text-[10.5px] text-beige-600">{h.when}</span>
            </div>
            {h.note && <p className="mt-1 text-[11.5px] text-brown-800 leading-snug">{h.note}</p>}
          </li>
        ))}
      </ol>
    </ContributorCard>
  );
}
