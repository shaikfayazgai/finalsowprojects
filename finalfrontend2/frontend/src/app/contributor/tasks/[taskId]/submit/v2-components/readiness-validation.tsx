"use client";

import * as React from "react";
import {
  CheckCircle2,
  Circle,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Heart,
  MessageSquare,
  Pause,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import {
  ContributorCard,
  ContributorSectionHeader,
  ReadinessBar,
  AiGlyph,
} from "@/app/contributor/_shared/primitives";
import {
  deliverableProgress,
  type ReadinessSignal,
  type WorkroomTask,
} from "@/mocks/data/contributor-workroom-detail";

interface ReadinessValidationProps {
  task: WorkroomTask;
}

/**
 * Readiness Validation — the contributor's confidence-building checkpoint.
 *
 * Surfaces everything that contributes to a confident submission, framed
 * supportively rather than as a gate. Three blocks:
 *   - Overall readiness with signal counts (ready / partial / missing)
 *   - Required deliverables checklist
 *   - Acceptance criteria coverage
 *   - Open polish items (from mentor feedback) when applicable
 *   - Blocker context when applicable
 */
export function ReadinessValidation({ task }: ReadinessValidationProps) {
  const r = task.submissionReadiness;
  const okCount = r.signals.filter((s) => s.status === "ok").length;
  const partialCount = r.signals.filter((s) => s.status === "partial").length;
  const missingCount = r.signals.filter((s) => s.status === "missing").length;
  const deliv = deliverableProgress(task);
  const addressedCriteria = task.acceptanceCriteria.filter((c) => c.addressed).length;
  const openCorrections = task.mentorFeedback?.requiredCorrections?.filter((c) => !c.addressed) ?? [];

  return (
    <ContributorCard padded={false} className="p-6">
      <ContributorSectionHeader
        title="Submission readiness"
        caption="A friendly checklist — soft pressure, no hard block. Submit when you're confident."
        trailing={
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-2 py-[1px] text-[10.5px] font-semibold",
              r.overall >= 90
                ? "border-forest-200 bg-forest-50 text-forest-700"
                : r.overall >= 70
                ? "border-teal-200 bg-teal-50 text-teal-700"
                : r.overall >= 40
                ? "border-gold-200 bg-gold-50 text-gold-800"
                : "border-beige-200 bg-beige-50 text-beige-700"
            )}
          >
            <ReadinessBubble pct={r.overall} />
            {r.overall}% ready
          </span>
        }
      />

      {/* Readiness bar */}
      <div className="mb-4">
        <ReadinessBar value={r.overall} />
        <div className="mt-2 flex items-center gap-4 text-[11.5px]">
          <span className="inline-flex items-center gap-1.5">
            <CheckCircle2 className="h-3 w-3 text-forest-600" />
            <span className="tabular-nums font-semibold text-brown-950">{okCount}</span>
            <span className="text-beige-700">ready</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <AlertCircle className="h-3 w-3 text-gold-600" />
            <span className="tabular-nums font-semibold text-brown-950">{partialCount}</span>
            <span className="text-beige-700">partial</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Circle className="h-3 w-3 text-beige-400" />
            <span className="tabular-nums font-semibold text-brown-950">{missingCount}</span>
            <span className="text-beige-700">missing</span>
          </span>
        </div>
      </div>

      {/* Signals checklist */}
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {r.signals.map((s) => (
          <li key={s.id}>
            <SignalRow signal={s} />
          </li>
        ))}
      </ul>

      {/* Sub-trackers */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-2">
        <SubTracker
          label="Required deliverables"
          value={`${deliv.done} / ${deliv.total}`}
          pct={deliv.pct}
        />
        <SubTracker
          label="Acceptance criteria"
          value={`${addressedCriteria} / ${task.acceptanceCriteria.length}`}
          pct={Math.round((addressedCriteria / task.acceptanceCriteria.length) * 100)}
        />
        <SubTracker
          label="Evidence completeness"
          value={`${Math.round((task.evidence.completeCount / task.evidence.requiredCount) * 100)}%`}
          pct={Math.round((task.evidence.completeCount / task.evidence.requiredCount) * 100)}
        />
      </div>

      {/* Open polish items (from mentor) */}
      {openCorrections.length > 0 && <OpenPolish items={openCorrections} />}

      {/* Blocker / awaiting context */}
      {(task.state === "blocked" || task.state === "awaiting_clarification") && (
        <ContextBlock state={task.state} />
      )}

      {/* AI confidence note */}
      <div className="mt-4 flex items-start gap-2 text-[11.5px] text-brown-800">
        <AiGlyph className="mt-0.5 shrink-0" />
        <span className="leading-relaxed">
          {r.overall >= 80 ? (
            <>
              <span className="font-semibold text-teal-800">You're in good shape. </span>
              Most contributors submit confidently at this readiness — the rest is polish.
            </>
          ) : r.overall >= 50 ? (
            <>
              <span className="font-semibold text-teal-800">Almost there. </span>
              The partial signals above are the quickest wins to get above 80%.
            </>
          ) : (
            <>
              <span className="font-semibold text-teal-800">Plenty of progress so far. </span>
              You can submit at any readiness — but the workroom still has time if you want to polish.
            </>
          )}
        </span>
      </div>
    </ContributorCard>
  );
}

/* ─────────────────────── Sub-components ─────────────────────── */

function ReadinessBubble({ pct }: { pct: number }) {
  const tone =
    pct >= 90 ? "bg-forest-500" : pct >= 70 ? "bg-teal-500" : pct >= 40 ? "bg-gold-500" : "bg-beige-400";
  return <span aria-hidden className={cn("inline-block h-1.5 w-1.5 rounded-full", tone)} />;
}

function SignalRow({ signal }: { signal: ReadinessSignal }) {
  const tone =
    signal.status === "ok"
      ? "border-forest-200 bg-forest-50/30"
      : signal.status === "partial"
      ? "border-gold-200 bg-gold-50/30"
      : "border-beige-200 bg-beige-50/40";

  return (
    <div className={cn("flex items-start gap-2.5 rounded-lg border px-3 py-2", tone)}>
      <SignalIcon status={signal.status} />
      <div className="flex-1 min-w-0">
        <p className="text-[12.5px] font-semibold text-brown-900">{signal.label}</p>
        {signal.detail && <p className="text-[11px] text-beige-700 mt-0.5">{signal.detail}</p>}
      </div>
    </div>
  );
}

function SignalIcon({ status }: { status: "ok" | "partial" | "missing" }) {
  if (status === "ok") return <CheckCircle2 className="h-4 w-4 mt-0.5 text-forest-600 shrink-0" />;
  if (status === "partial") return <AlertCircle className="h-4 w-4 mt-0.5 text-gold-600 shrink-0" />;
  return <Circle className="h-4 w-4 mt-0.5 text-beige-400 shrink-0" />;
}

function SubTracker({ label, value, pct }: { label: string; value: string; pct: number }) {
  return (
    <div className="rounded-lg border border-beige-200 bg-white px-3 py-2.5">
      <p className="text-[9.5px] font-bold uppercase tracking-[0.14em] text-beige-700">{label}</p>
      <p className="mt-0.5 text-[14px] font-bold text-brown-950 tabular-nums">{value}</p>
      <div className="mt-2 h-1 rounded-full bg-beige-100 overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full",
            pct >= 90 ? "bg-forest-500" : pct >= 60 ? "bg-teal-500" : pct >= 30 ? "bg-gold-500" : "bg-beige-400"
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function OpenPolish({
  items,
}: {
  items: { id: string; criterion: string; description: string }[];
}) {
  const [open, setOpen] = React.useState(true);
  return (
    <div className="mt-4 rounded-xl border border-gold-200 bg-gold-50/40 px-4 py-3">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center gap-2"
      >
        <Heart className="h-4 w-4 text-gold-700" />
        <p className="text-[12px] font-semibold text-gold-900 flex-1 text-left">
          {items.length} polish item{items.length === 1 ? "" : "s"} still open from mentor feedback
        </p>
        {open ? (
          <ChevronDown className="h-3.5 w-3.5 text-gold-700" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 text-gold-700" />
        )}
      </button>
      {open && (
        <ul className="mt-2 space-y-1.5">
          {items.map((c) => (
            <li
              key={c.id}
              className="rounded-md border border-gold-200 bg-white px-3 py-2 text-[11.5px]"
            >
              <p className="font-semibold text-brown-900">{c.criterion}</p>
              <p className="mt-0.5 text-beige-800 leading-snug">{c.description}</p>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-2 text-[10.5px] text-gold-800 italic">
        You can still submit — but addressing these in the workroom usually leads to a clean accept.
      </p>
    </div>
  );
}

function ContextBlock({ state }: { state: "blocked" | "awaiting_clarification" }) {
  if (state === "blocked") {
    return (
      <div className="mt-4 rounded-xl border border-beige-200 bg-beige-50 px-4 py-3 text-[12px] text-brown-900">
        <p className="inline-flex items-center gap-1.5 font-semibold">
          <Pause className="h-3.5 w-3.5 text-beige-700" />
          This task is currently paused
        </p>
        <p className="mt-1 text-beige-800">
          Outside your control — submission will queue and start review when the pause lifts. Your work is
          safely saved.
        </p>
      </div>
    );
  }
  return (
    <div className="mt-4 rounded-xl border border-gold-200 bg-gold-50/40 px-4 py-3 text-[12px] text-brown-900">
      <p className="inline-flex items-center gap-1.5 font-semibold">
        <MessageSquare className="h-3.5 w-3.5 text-gold-700" />
        You have an open conversation with your mentor
      </p>
      <p className="mt-1 text-gold-800">
        It's totally fine to submit while a question is open — your mentor will see both together.
      </p>
    </div>
  );
}
