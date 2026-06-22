"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Clock,
  GitCompare,
  Heart,
  Lightbulb,
  MessageCircle,
  Quote,
  RefreshCw,
  Save,
  Send,
  Upload,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import {
  AiGlyph,
  AiSuggestionConfidence,
  ContributorCard,
  ContributorSectionHeader,
  ReadinessBar,
} from "@/app/contributor/_shared/primitives";
import {
  correctionStats,
  formatHoursToDue,
  severityTone,
  stateTone as workflowStateTone,
  type RevisionRow,
} from "@/mocks/data/contributor-revision-queue";

interface Props {
  row: RevisionRow | undefined;
  resolvedMap: Record<string, Record<string, boolean>>;
  onToggleResolved: (rowId: string, correctionId: string) => void;
  onAskClarification: (rowId: string) => void;
  onUploadEvidence: (rowId: string) => void;
  onResubmit: (rowId: string) => void;
}

export function RevisionDetailPreview({
  row,
  resolvedMap,
  onToggleResolved,
  onAskClarification,
  onUploadEvidence,
  onResubmit,
}: Props) {
  if (!row) {
    return (
      <ContributorCard variant="soft">
        <div className="py-8 text-center">
          <p className="font-heading text-[14px] font-semibold text-brown-950">
            Select a revision
          </p>
          <p className="text-[12.5px] text-beige-700 mt-1">
            Click a row to see the full mentor context, corrections, and quick actions here.
          </p>
        </div>
      </ContributorCard>
    );
  }

  const local = resolvedMap[row.id] ?? {};
  const correctionsWithLocal = row.corrections.map((c) => ({
    ...c,
    resolved: local[c.id] ?? c.resolved,
  }));
  const stats = {
    total: correctionsWithLocal.length,
    resolved: correctionsWithLocal.filter((c) => c.resolved).length,
  };
  const pct = stats.total === 0 ? 0 : Math.round((stats.resolved / stats.total) * 100);
  const allResolved = stats.resolved === stats.total && stats.total > 0;
  const ready = allResolved && row.readinessScore >= 90;
  const wfTone = workflowStateTone(row.state);

  return (
    <div className="space-y-4">
      {/* Identity card */}
      <ContributorCard>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-teal-700">
              {row.project} · {row.skill}
            </p>
            <h2 className="font-heading text-[16px] font-semibold text-brown-950 leading-tight mt-0.5">
              {row.title}
            </h2>
            <p className="text-[11.5px] text-beige-700 mt-1">{row.shortDescription}</p>
          </div>
          <Link
            href={`/contributor/tasks/${row.taskId}/revision`}
            className="inline-flex items-center gap-1 rounded-lg bg-teal-600 px-2.5 py-1.5 text-[11.5px] font-semibold text-white hover:bg-teal-700 shrink-0"
          >
            Open
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2 py-[1px] text-[10px] font-semibold tracking-wide", wfTone.chip)}>
            <span className={cn("inline-block h-1.5 w-1.5 rounded-full", wfTone.dot)} />
            {wfTone.label}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-beige-200 bg-beige-50 px-2 py-[1px] text-[10px] font-semibold text-beige-700">
            <RefreshCw className="h-2.5 w-2.5" />
            Round {row.reworkRound} of {row.totalRounds}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-beige-200 bg-beige-50 px-2 py-[1px] text-[10px] font-semibold text-beige-700 tabular-nums">
            <Clock className="h-2.5 w-2.5" />
            {formatHoursToDue(row.hoursToDue)}
          </span>
        </div>
      </ContributorCard>

      {/* Mentor feedback */}
      <ContributorCard padded={false} className="overflow-hidden">
        <div className="border-b border-forest-100 bg-gradient-to-br from-forest-50/60 to-white px-4 py-3">
          <div className="flex items-start gap-2.5">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-forest-100 text-forest-700 shrink-0">
              <Heart className="h-3.5 w-3.5" fill="currentColor" />
            </span>
            <div className="min-w-0">
              <p className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-forest-700">
                What worked · {row.mentor.name}
              </p>
              <p className="text-[12.5px] text-brown-900 mt-1 leading-relaxed">
                {row.whatWorked}
              </p>
            </div>
          </div>
        </div>

        <div className="px-4 py-2.5 bg-beige-50/40 border-b border-beige-100 flex items-start gap-2">
          <Quote className="h-3 w-3 text-beige-500 shrink-0 mt-0.5" />
          <p className="text-[11.5px] text-beige-700 leading-relaxed">
            {row.mentorGuidance}
          </p>
        </div>

        {row.optionalSuggestions.length > 0 && (
          <div className="px-4 py-3">
            <div className="flex items-start gap-2">
              <Lightbulb className="h-3.5 w-3.5 text-teal-600 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-teal-700">
                  Optional suggestions
                </p>
                <ul className="mt-1 space-y-0.5">
                  {row.optionalSuggestions.map((s, i) => (
                    <li key={i} className="text-[11.5px] text-brown-900 leading-relaxed">
                      · {s}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </ContributorCard>

      {/* Correction progress + checklist */}
      <ContributorCard>
        <ContributorSectionHeader
          title="Required corrections"
          caption={allResolved ? "All addressed — readiness check below." : `${stats.total - stats.resolved} remaining`}
          trailing={
            <span className="inline-flex items-center gap-1 rounded-full border border-beige-200 bg-beige-50 px-2 py-[1px] text-[10.5px] font-semibold text-beige-700 tabular-nums">
              {stats.resolved} / {stats.total}
            </span>
          }
        />
        <ReadinessBar value={pct} />
        <ul className="mt-3 space-y-2">
          {correctionsWithLocal.map((c) => {
            const sev = severityTone(c.severity);
            const hint = row.aiHints.find((h) => h.correctionId === c.id);
            return (
              <li
                key={c.id}
                className={cn(
                  "rounded-xl border px-3 py-2.5",
                  c.resolved
                    ? "border-forest-200 bg-forest-50/30"
                    : "border-beige-200 bg-white",
                )}
              >
                <div className="flex items-start gap-2.5">
                  <span
                    role="checkbox"
                    aria-checked={c.resolved}
                    tabIndex={0}
                    onClick={() => onToggleResolved(row.id, c.id)}
                    onKeyDown={(e) => {
                      if (e.key === " " || e.key === "Enter") {
                        e.preventDefault();
                        onToggleResolved(row.id, c.id);
                      }
                    }}
                    className={cn(
                      "mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-md border-2 shrink-0 cursor-pointer transition-colors",
                      c.resolved
                        ? "border-forest-500 bg-forest-500 text-white"
                        : "border-beige-300 bg-white hover:border-teal-400",
                    )}
                  >
                    {c.resolved && <Check className="h-3 w-3" strokeWidth={3.5} />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className={cn("inline-flex items-center rounded-full border px-1.5 py-[1px] text-[9.5px] font-semibold tracking-wide", sev.chip)}>
                        {sev.label}
                      </span>
                      <span className="inline-flex items-center rounded-full border border-beige-200 bg-beige-50 px-1.5 py-[1px] text-[9.5px] font-semibold text-beige-700">
                        {c.category}
                      </span>
                      <p className="text-[12px] font-semibold text-brown-950 leading-tight">
                        {c.criterion}
                      </p>
                    </div>
                    <p className="text-[11.5px] text-brown-900 mt-1 leading-relaxed">
                      {c.description}
                    </p>
                    {c.evidenceRef && (
                      <p className="text-[10.5px] text-beige-600 mt-1 inline-flex items-center gap-1">
                        <ArrowRight className="h-2.5 w-2.5" />
                        {c.evidenceRef}
                      </p>
                    )}
                    {c.blockedBy && (
                      <p className="text-[10.5px] text-gold-800 mt-1 inline-flex items-center gap-1">
                        <Clock className="h-2.5 w-2.5" />
                        Blocked: {c.blockedBy}
                      </p>
                    )}
                    {hint && !c.resolved && (
                      <div className="mt-2 rounded-lg border border-teal-200/70 bg-teal-50/40 px-2.5 py-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="inline-flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.14em] text-teal-700">
                            <AiGlyph className="h-2.5 w-2.5" />
                            AI fix hint
                          </span>
                          <AiSuggestionConfidence level={hint.confidence} />
                        </div>
                        <p className="text-[11.5px] font-semibold text-brown-950 mt-1">{hint.title}</p>
                        <p className="text-[11.5px] text-brown-900 leading-relaxed mt-0.5">{hint.detail}</p>
                        <p className="text-[10px] text-teal-700 italic mt-1">Source · {hint.source}</p>
                      </div>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </ContributorCard>

      {/* Evidence delta */}
      <ContributorCard>
        <ContributorSectionHeader
          title="What changed"
          caption="Side-by-side delta vs previous submission."
          trailing={
            <span className="inline-flex items-center gap-1 rounded-full border border-teal-200 bg-teal-50 px-2 py-[1px] text-[10.5px] font-semibold text-teal-800">
              <GitCompare className="h-3 w-3" />
              v{row.reworkRound - 1} → v{row.reworkRound}
            </span>
          }
        />
        <ul className="space-y-1.5">
          {row.evidenceDeltas.map((d) => {
            const prevTone = stateColor(d.previous);
            const updTone = stateColor(d.updated);
            const movement =
              d.previous === d.updated
                ? "Unchanged"
                : d.updated === "present"
                ? "Improved"
                : d.updated === "missing"
                ? "Still open"
                : "Partial";
            const movementTint =
              movement === "Improved"
                ? "text-forest-700"
                : movement === "Still open"
                ? "text-gold-700"
                : movement === "Partial"
                ? "text-teal-700"
                : "text-beige-700";

            return (
              <li
                key={d.id}
                className="rounded-lg border border-beige-100 bg-beige-50/30 px-2.5 py-2"
              >
                <div className="flex items-baseline justify-between gap-2 mb-1">
                  <p className="text-[11.5px] font-semibold text-brown-900 leading-tight truncate">
                    {d.label}
                  </p>
                  <span className={cn("text-[10.5px] font-bold uppercase tracking-wide tabular-nums shrink-0", movementTint)}>
                    {movement}
                  </span>
                </div>
                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                  <span className={cn("inline-flex items-center gap-1.5 text-[10.5px] font-semibold", prevTone.tint)}>
                    <span className={cn("inline-block h-1.5 w-1.5 rounded-full", prevTone.dot)} />
                    {prevTone.label}
                  </span>
                  <ArrowRight className="h-3 w-3 text-beige-400" />
                  <span className={cn("inline-flex items-center gap-1.5 text-[10.5px] font-semibold", updTone.tint)}>
                    <span className={cn("inline-block h-1.5 w-1.5 rounded-full", updTone.dot)} />
                    {updTone.label}
                  </span>
                </div>
                {d.note && (
                  <p className="text-[10.5px] text-beige-700 mt-1 leading-snug">{d.note}</p>
                )}
              </li>
            );
          })}
        </ul>
      </ContributorCard>

      {/* Clarification */}
      {row.clarification && (
        <ContributorCard>
          <ContributorSectionHeader
            title="Clarification thread"
            caption={
              row.clarification.pauseSla
                ? "SLA paused while mentor replies."
                : "SLA running normally."
            }
            trailing={
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-2 py-[1px] text-[10.5px] font-semibold",
                  row.clarification.status === "pending"
                    ? "border-gold-200 bg-gold-50 text-gold-800"
                    : row.clarification.status === "answered"
                    ? "border-teal-200 bg-teal-50 text-teal-800"
                    : "border-forest-200 bg-forest-50 text-forest-800",
                )}
              >
                <MessageCircle className="h-3 w-3" />
                {row.clarification.status === "pending"
                  ? "Awaiting reply"
                  : row.clarification.status === "answered"
                  ? "Mentor replied"
                  : "Resolved"}
              </span>
            }
          />
          <ul className="space-y-2">
            {row.clarification.messages.map((m) => {
              const isMine = m.authorRole === "contributor";
              return (
                <li
                  key={m.id}
                  className={cn(
                    "rounded-lg border px-2.5 py-2",
                    isMine
                      ? "border-teal-200 bg-teal-50/40 ml-4"
                      : "border-beige-200 bg-beige-50/30 mr-4",
                  )}
                >
                  <div className="flex items-baseline justify-between gap-2 mb-0.5">
                    <p className={cn("text-[10.5px] font-bold", isMine ? "text-teal-800" : "text-brown-900")}>
                      {m.author}
                    </p>
                    <p className="text-[10px] text-beige-500">{m.at}</p>
                  </div>
                  <p className="text-[11.5px] text-brown-900 leading-relaxed">{m.body}</p>
                </li>
              );
            })}
          </ul>
        </ContributorCard>
      )}

      {/* Draft + continuity */}
      {row.draftNote && (
        <ContributorCard variant="soft">
          <ContributorSectionHeader
            title="Your draft"
            caption={row.draftSavedAt ? `Saved ${row.draftSavedAt}` : "Unsaved"}
            trailing={
              <span className="inline-flex items-center gap-1 rounded-full border border-forest-200 bg-forest-50 px-2 py-[1px] text-[10.5px] font-semibold text-forest-700">
                <Save className="h-3 w-3" />
                Autosaved
              </span>
            }
          />
          <p className="text-[12px] text-brown-900 leading-relaxed">{row.draftNote}</p>
        </ContributorCard>
      )}

      {/* Resubmission prep */}
      <ContributorCard>
        <ContributorSectionHeader
          title="Resubmission readiness"
          caption={
            ready
              ? "Looks ready — send when you're confident."
              : "Close the items below before resubmitting."
          }
          trailing={
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold",
                ready
                  ? "border-forest-200 bg-forest-50 text-forest-800"
                  : "border-gold-200 bg-gold-50 text-gold-800",
              )}
            >
              {ready ? "Ready" : "Not yet"}
            </span>
          }
        />
        <ReadinessBar value={row.readinessScore} />
        <ul className="mt-3 space-y-1.5">
          <ReadyRow ok={allResolved} label="All corrections addressed" detail={`${stats.resolved} of ${stats.total} resolved`} />
          <ReadyRow ok={row.readinessScore >= 90} label="Evidence complete" detail={`Readiness score ${row.readinessScore} / 100`} />
          <ReadyRow ok={!row.clarification || row.clarification.status !== "pending"} label="No pending clarifications" detail={row.clarification?.status === "pending" ? "Waiting on mentor reply" : "Clear"} />
        </ul>
      </ContributorCard>

      {/* Quick actions */}
      <div className="rounded-2xl border border-beige-200 bg-white px-4 py-3 grid grid-cols-2 gap-2">
        <Link
          href={`/contributor/tasks/${row.taskId}/revision`}
          className="inline-flex items-center gap-1.5 rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-[12px] font-semibold text-teal-800 hover:bg-teal-100 col-span-2"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Continue revision
          <ArrowRight className="h-3 w-3 ml-auto" />
        </Link>
        <Link
          href={`/contributor/tasks/${row.taskId}/revision`}
          className="inline-flex items-center gap-1.5 rounded-lg border border-beige-200 bg-white px-3 py-2 text-[12px] font-semibold text-brown-900 hover:border-beige-300"
        >
          <GitCompare className="h-3.5 w-3.5" />
          Compare changes
        </Link>
        <button
          type="button"
          onClick={() => onUploadEvidence(row.id)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-beige-200 bg-white px-3 py-2 text-[12px] font-semibold text-brown-900 hover:border-beige-300"
        >
          <Upload className="h-3.5 w-3.5" />
          Upload evidence
        </button>
        <button
          type="button"
          onClick={() => onAskClarification(row.id)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-beige-200 bg-white px-3 py-2 text-[12px] font-semibold text-brown-900 hover:border-beige-300"
        >
          <MessageCircle className="h-3.5 w-3.5" />
          Ask mentor
        </button>
        <button
          type="button"
          onClick={() => onResubmit(row.id)}
          disabled={!ready}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[12px] font-semibold transition-colors",
            ready
              ? "bg-forest-600 text-white hover:bg-forest-700"
              : "bg-beige-100 text-beige-500 cursor-not-allowed",
          )}
        >
          <Send className="h-3.5 w-3.5" />
          Resubmit
        </button>
      </div>
    </div>
  );
}

function ReadyRow({ ok, label, detail }: { ok: boolean; label: string; detail: string }) {
  return (
    <li className="flex items-start gap-2 rounded-lg border border-beige-100 bg-beige-50/30 px-2.5 py-1.5">
      <CheckCircle2
        className={cn("h-3.5 w-3.5 shrink-0 mt-0.5", ok ? "text-forest-600" : "text-beige-400")}
      />
      <div className="min-w-0">
        <p className="text-[11.5px] font-semibold text-brown-900 leading-tight">{label}</p>
        <p className={cn("text-[10.5px] mt-0.5 leading-snug", ok ? "text-forest-700" : "text-beige-700")}>
          {detail}
        </p>
      </div>
    </li>
  );
}

function stateColor(s: "missing" | "partial" | "present") {
  switch (s) {
    case "present":
      return { dot: "bg-forest-500", tint: "text-forest-700", label: "Present" };
    case "partial":
      return { dot: "bg-gold-500", tint: "text-gold-700", label: "Partial" };
    case "missing":
      return { dot: "bg-beige-400", tint: "text-beige-700", label: "Missing" };
  }
}
