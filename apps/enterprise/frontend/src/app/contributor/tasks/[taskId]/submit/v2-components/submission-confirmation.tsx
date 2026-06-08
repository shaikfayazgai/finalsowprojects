"use client";

import * as React from "react";
import {
  MessageSquare,
  Clock,
  Heart,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import {
  ContributorCard,
  ContributorSectionHeader,
} from "@/app/contributor/_shared/primitives";
import type { WorkroomTask } from "@/mocks/data/contributor-workroom-detail";

interface SubmissionConfirmationProps {
  task: WorkroomTask;
  note: string;
  onNoteChange: (v: string) => void;
  declarationChecked: boolean;
  onDeclarationChange: (checked: boolean) => void;
  shareWorkingNotes: boolean;
  onShareNotesChange: (checked: boolean) => void;
}

/**
 * Submission Confirmation block — the final personal layer the contributor
 * adds before sending. Note to mentor (optional) + a soft declaration that
 * lives without judgment.
 *
 * This is the contributor's "I'm sending this, with intent" moment.
 */
export function SubmissionConfirmation({
  task,
  note,
  onNoteChange,
  declarationChecked,
  onDeclarationChange,
  shareWorkingNotes,
  onShareNotesChange,
}: SubmissionConfirmationProps) {
  return (
    <div className="space-y-4">
      <NoteToMentor note={note} onChange={onNoteChange} mentorName={task.mentor.name} />
      <ShareNotesToggle
        share={shareWorkingNotes}
        onChange={onShareNotesChange}
        hasNotes={task.draft.notes.length > 30}
      />
      <Declaration
        checked={declarationChecked}
        onChange={onDeclarationChange}
      />
      <WhatHappensNext task={task} />
    </div>
  );
}

/* ─────────────────────── Note to mentor ─────────────────────── */

function NoteToMentor({
  note,
  onChange,
  mentorName,
}: {
  note: string;
  onChange: (v: string) => void;
  mentorName: string;
}) {
  return (
    <ContributorCard padded={false} className="p-6">
      <ContributorSectionHeader
        title="A short note for your mentor (optional)"
        caption="One or two sentences about what you focused on, any tradeoffs, or what you'd love feedback on."
        trailing={
          <span className="inline-flex items-center gap-1 rounded-full border border-teal-200 bg-teal-50 px-2 py-[1px] text-[10px] font-semibold text-teal-700">
            <MessageSquare className="h-3 w-3" />
            To {mentorName.split(" ")[0]}
          </span>
        }
      />
      <textarea
        value={note}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        placeholder="e.g., I focused on the focus-trap implementation and tested with VoiceOver and NVDA. Would love your eye on the JAWS recording quality and whether the RTL polish should land here or in a follow-up."
        className="w-full rounded-xl border border-beige-200 bg-white px-4 py-3 text-[12.5px] text-brown-900 leading-relaxed placeholder:text-beige-500 outline-none focus:border-teal-300 focus:ring-2 focus:ring-teal-100"
      />
      <p className="mt-2 text-[10.5px] text-beige-600">
        {note.length} char{note.length === 1 ? "" : "s"} · mentor sees this alongside the submission
      </p>
    </ContributorCard>
  );
}

/* ─────────────────────── Share working notes toggle ─────────────────────── */

function ShareNotesToggle({
  share,
  onChange,
  hasNotes,
}: {
  share: boolean;
  onChange: (checked: boolean) => void;
  hasNotes: boolean;
}) {
  if (!hasNotes) return null;
  return (
    <ContributorCard padded={false} className="p-4 md:p-5">
      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={share}
          onChange={(e) => onChange(e.target.checked)}
          className="mt-1 h-4 w-4 accent-teal-600"
        />
        <div className="flex-1">
          <p className="text-[12.5px] font-semibold text-brown-900">
            Include your working notes from the workroom
          </p>
          <p className="text-[11px] text-beige-700 mt-0.5 leading-snug">
            Mentors often find context-from-the-craft helpful. They see what you saw while working — the
            decisions, the tradeoffs, the things you came back to.
          </p>
        </div>
      </label>
    </ContributorCard>
  );
}

/* ─────────────────────── Declaration ─────────────────────── */

function Declaration({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <ContributorCard padded={false} className="p-4 md:p-5">
      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="mt-1 h-4 w-4 accent-teal-600"
        />
        <div className="flex-1">
          <p className="text-[12.5px] font-semibold text-brown-900">
            I'm sending this with care
          </p>
          <p className="text-[11.5px] text-beige-700 mt-0.5 leading-snug">
            The work is mine, the evidence is honest, and I'm comfortable for my mentor to review and pay
            out based on what's here. (No surprises — same standard every time.)
          </p>
        </div>
      </label>
    </ContributorCard>
  );
}

/* ─────────────────────── What happens next ─────────────────────── */

function WhatHappensNext({ task }: { task: WorkroomTask }) {
  const reviewHours = task.reviewWindowHours ?? 24;
  const steps: {
    label: string;
    detail: string;
    Icon: React.ElementType;
    accent: "now" | "next" | "later";
  }[] = [
    {
      label: "Your submission is queued",
      detail: `Estimated mentor review window: ~${reviewHours}h based on current pool capacity.`,
      Icon: Clock,
      accent: "now",
    },
    {
      label: "Your mentor reviews",
      detail: `${task.mentor.name} typically responds with feedback in plain language — what worked, what to polish.`,
      Icon: Heart,
      accent: "next",
    },
    {
      label: "Outcome lands quietly",
      detail:
        "If accepted, payout starts and a portfolio credential is issued. If a revision is requested, you'll see it in your workroom with anchored guidance — no surprises.",
      Icon: CheckCircle2,
      accent: "later",
    },
  ];

  return (
    <ContributorCard padded={false} className="p-6">
      <ContributorSectionHeader
        title="What happens next"
        caption="Plain-language preview of the review lifecycle — predictable every time."
      />
      <ol className="space-y-3">
        {steps.map((s, idx) => {
          const tone =
            s.accent === "now"
              ? { border: "border-teal-200", bg: "bg-teal-50/40", iconWrap: "border-teal-200 bg-teal-50 text-teal-700" }
              : s.accent === "next"
              ? { border: "border-beige-200", bg: "bg-beige-50/40", iconWrap: "border-beige-200 bg-beige-50 text-beige-700" }
              : { border: "border-forest-200", bg: "bg-forest-50/30", iconWrap: "border-forest-200 bg-forest-50 text-forest-700" };
          return (
            <li
              key={s.label}
              className={cn("relative flex items-start gap-3 rounded-xl border px-4 py-3", tone.border, tone.bg)}
            >
              <span className={cn("shrink-0 inline-flex h-8 w-8 items-center justify-center rounded-xl border", tone.iconWrap)}>
                <s.Icon className="h-4 w-4" />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-beige-700">
                  Step {idx + 1}
                </p>
                <p className="text-[13px] font-semibold text-brown-950 leading-tight mt-0.5">
                  {s.label}
                </p>
                <p className="mt-1 text-[12px] text-brown-800 leading-relaxed">{s.detail}</p>
              </div>
              {idx < steps.length - 1 && (
                <span aria-hidden className="hidden md:block absolute -bottom-3 left-7 w-px h-3 bg-beige-200" />
              )}
            </li>
          );
        })}
      </ol>
      <p className="mt-3 text-[11px] text-beige-600 inline-flex items-center gap-1.5">
        <ArrowRight className="h-3 w-3" />
        You stay in control — you can keep working in other tasks while this one is under review.
      </p>
    </ContributorCard>
  );
}
