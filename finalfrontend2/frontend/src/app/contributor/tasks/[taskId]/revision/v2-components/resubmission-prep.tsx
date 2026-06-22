"use client";

import { AlertCircle, CheckCircle2, FileSearch, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import {
  ContributorCard,
  ContributorSectionHeader,
  ReadinessBar,
} from "@/app/contributor/_shared/primitives";
import type {
  ReadinessSignal,
  WorkroomTask,
} from "@/mocks/data/contributor-workroom-detail";

export function ResubmissionPrep({
  task,
  resolvedCount,
  totalCorrections,
  ready,
}: {
  task: WorkroomTask;
  resolvedCount: number;
  totalCorrections: number;
  ready: boolean;
}) {
  const correctionsCovered = resolvedCount === totalCorrections;

  const overrideSignals: ReadinessSignal[] = task.submissionReadiness.signals.map((s) =>
    s.id === "r4"
      ? {
          ...s,
          status: correctionsCovered ? "ok" : "partial",
          detail: correctionsCovered
            ? "All mentor corrections marked addressed"
            : `${totalCorrections - resolvedCount} correction${totalCorrections - resolvedCount === 1 ? "" : "s"} still open`,
        }
      : s,
  );

  const okCount = overrideSignals.filter((s) => s.status === "ok").length;
  const overallReadiness = Math.round((okCount / overrideSignals.length) * 100);

  const blockers = overrideSignals.filter((s) => s.status === "missing");

  return (
    <div id="resubmit-prep">
    <ContributorCard>
      <ContributorSectionHeader
        title="Resubmission preparation"
        caption="A quick readiness pass before you send v3 back to the mentor."
        trailing={
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold",
              ready
                ? "border-forest-200 bg-forest-50 text-forest-800"
                : "border-gold-200 bg-gold-50 text-gold-800"
            )}
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            {ready ? "Ready to resubmit" : "Not yet ready"}
          </span>
        }
      />

      <div className="space-y-3">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-beige-600">
              Overall readiness
            </p>
            <p className="text-[11px] text-beige-700 tabular-nums">
              {okCount} of {overrideSignals.length} checks pass
            </p>
          </div>
          <ReadinessBar value={overallReadiness} />
        </div>

        <ul className="space-y-1.5">
          {overrideSignals.map((s) => {
            const Icon =
              s.status === "ok" ? CheckCircle2 : s.status === "partial" ? FileSearch : AlertCircle;
            const tone =
              s.status === "ok"
                ? "text-forest-600"
                : s.status === "partial"
                ? "text-gold-700"
                : "text-beige-700";
            return (
              <li
                key={s.id}
                className="flex items-start gap-2.5 rounded-lg border border-beige-100 bg-beige-50/30 px-3 py-2"
              >
                <Icon className={cn("h-4 w-4 shrink-0 mt-0.5", tone)} />
                <div className="min-w-0">
                  <p className="text-[12.5px] font-semibold text-brown-900 leading-tight">
                    {s.label}
                  </p>
                  {s.detail && (
                    <p className="text-[11.5px] text-beige-600 mt-0.5 leading-snug">
                      {s.detail}
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>

        {blockers.length > 0 && (
          <div className="rounded-xl border border-gold-200 bg-gold-50/50 px-3.5 py-2.5">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-gold-800">
              Before you resubmit
            </p>
            <ul className="mt-1 space-y-0.5">
              {blockers.map((b) => (
                <li key={b.id} className="text-[12.5px] text-gold-900 leading-relaxed">
                  · {b.label}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </ContributorCard>
    </div>
  );
}
