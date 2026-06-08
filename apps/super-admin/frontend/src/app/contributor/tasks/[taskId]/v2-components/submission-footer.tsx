"use client";

import * as React from "react";
import {
  Send,
  Save,
  Upload,
  MessageSquare,
  RotateCcw,
  CheckCircle2,
  Circle,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { ReadinessBar } from "@/app/contributor/_shared/primitives";
import type { WorkroomTask } from "@/mocks/data/contributor-workroom-detail";

interface SubmissionFooterProps {
  task: WorkroomTask;
  onSubmit: () => void;
  onSaveDraft: () => void;
}

/**
 * Sticky submission footer — readiness signals + the single Submit moment.
 *
 * Soft pressure, no hard block. The contributor can submit at any readiness
 * but the score is shown. Confidence is built through transparency, not
 * gatekeeping.
 */
export function SubmissionFooter({ task, onSubmit, onSaveDraft }: SubmissionFooterProps) {
  const [open, setOpen] = React.useState(false);
  const r = task.submissionReadiness;
  const okCount = r.signals.filter((s) => s.status === "ok").length;
  const partialCount = r.signals.filter((s) => s.status === "partial").length;
  const missingCount = r.signals.filter((s) => s.status === "missing").length;

  return (
    <div className="sticky bottom-0 z-30 -mx-8 px-8 py-3 bg-white/95 backdrop-blur-md border-t border-beige-200">
      <div className="flex items-center gap-4 flex-wrap">
        {/* Readiness pill */}
        <button
          type="button"
          onClick={() => setOpen((p) => !p)}
          className="inline-flex items-center gap-3 rounded-xl border border-beige-200 bg-white px-3 py-1.5 hover:border-beige-300 transition-colors"
        >
          <div className="w-32">
            <ReadinessBar value={r.overall} size="sm" />
          </div>
          <span className="text-[10.5px] text-beige-700 hidden sm:inline">
            <CheckCircle2 className="inline h-3 w-3 text-forest-600 mr-1" />
            <span className="tabular-nums font-semibold text-brown-950">{okCount}</span> ready
            <span className="mx-1">·</span>
            <span className="tabular-nums font-semibold text-gold-700">{partialCount}</span> partial
            <span className="mx-1">·</span>
            <span className="tabular-nums font-semibold text-beige-600">{missingCount}</span> missing
          </span>
          <span className="text-[10.5px] font-semibold text-teal-700">
            {open ? "Hide details" : "Show details"}
          </span>
        </button>

        {/* Quick actions */}
        <div className="hidden md:flex items-center gap-1.5">
          <FooterButton icon={Save} label="Save draft" onClick={onSaveDraft} />
          <FooterButton icon={Upload} label="Upload evidence" />
          <FooterButton icon={MessageSquare} label="Clarify" />
        </div>

        {/* Spacer */}
        <span className="flex-1 hidden md:block" />

        {/* Primary actions */}
        <div className="flex items-center gap-2 ml-auto">
          {task.reworkRound && task.reworkRound > 1 && (
            <button
              type="button"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-beige-200 bg-white px-3 text-[12px] font-semibold text-brown-900 hover:bg-beige-50/60"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Compare v{(task.reworkRound ?? 1) - 1} ↔ v{task.reworkRound}
            </button>
          )}
          <button
            type="button"
            onClick={onSubmit}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-teal-600 px-5 text-[13px] font-bold text-white shadow-sm hover:bg-teal-700 hover:shadow-md transition-all"
          >
            <Send className="h-4 w-4" />
            Submit for review
          </button>
        </div>
      </div>

      {/* Expanded readiness drawer */}
      {open && (
        <div className="mt-3 rounded-xl border border-beige-200 bg-beige-50/40 px-4 py-3">
          <p className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-beige-700 mb-2">
            Submission readiness checklist
          </p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {r.signals.map((s) => (
              <li key={s.id} className="flex items-start gap-2 text-[12px]">
                <SignalIcon status={s.status} />
                <div className="flex-1 min-w-0">
                  <p className="text-brown-900">{s.label}</p>
                  {s.detail && <p className="text-[10.5px] text-beige-600 mt-0.5">{s.detail}</p>}
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[10.5px] text-beige-600 italic">
            You can submit at any readiness. The score is here to help — not to block.
          </p>
        </div>
      )}
    </div>
  );
}

function SignalIcon({ status }: { status: "ok" | "partial" | "missing" }) {
  if (status === "ok") return <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 text-forest-600 shrink-0" />;
  if (status === "partial") return <AlertCircle className="h-3.5 w-3.5 mt-0.5 text-gold-600 shrink-0" />;
  return <Circle className="h-3.5 w-3.5 mt-0.5 text-beige-400 shrink-0" />;
}

function FooterButton({
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
      className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-beige-200 bg-white px-2.5 text-[11.5px] font-semibold text-brown-900 hover:bg-beige-50/60"
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}
