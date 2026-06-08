"use client";

/**
 * SOW intake Step 3 — submit for approval (production model).
 *
 * Shared by Upload / Author / Generate intake modes. Per spec §5.C.3:
 *   - 5-stage pipeline with per-stage approver selection
 *   - Commercial auto-assigned to Glimmora (read-only)
 *   - SLA from policy defaults · notify toggle · optional cover note
 *   - Block submit when any required approver is missing
 */

import * as React from "react";
import { Bell, Clock, Lock, Send, ShieldCheck } from "lucide-react";
import {
  defaultApproversByStage,
  listApproversForStage,
  STAGE_LABEL,
  STAGE_SLA_HOURS,
  type ApproverCandidate,
  type SowApprovalStageKey,
} from "@/lib/api/enterprise-approvers";
import { cn } from "@/lib/utils/cn";

// Order must match APPROVAL_STAGE_ORDER in lib/sow/types: Glimmora's Commercial
// gate is the very last step, after the enterprise's Final sign-off.
const STAGES: SowApprovalStageKey[] = ["business", "legal", "security", "final", "commercial"];

const selectCls = cn(
  "w-full h-9 px-3 rounded-md bg-surface border font-body text-[13px] text-foreground",
  "focus-visible:outline-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/25",
);

export interface SubmissionConfig {
  approvers: Record<SowApprovalStageKey, ApproverCandidate>;
  notify: boolean;
  coverNote: string;
  /** Enterprise reviewer assigned at intake (optional — reviewer is NOT a stage). */
  reviewer?: { id: string; email?: string; name?: string };
}

interface ReviewerOption {
  id: string;
  email?: string;
  name?: string;
}

export interface CommitArgs {
  kind: "draft" | "submit";
  config: SubmissionConfig;
}

interface Props {
  title: string;
  saving: "draft" | "submit" | null;
  error: string | null;
  onBack: () => void;
  onCancel: () => void;
  onCommit: (args: CommitArgs) => void;
}

function candidateById(stage: SowApprovalStageKey, id: string): ApproverCandidate | undefined {
  return listApproversForStage(stage).find((c) => c.id === id);
}

function buildApproversRecord(
  selectedIds: Record<SowApprovalStageKey, string>,
): Record<SowApprovalStageKey, ApproverCandidate> {
  const result = {} as Record<SowApprovalStageKey, ApproverCandidate>;
  for (const stage of STAGES) {
    const picked = candidateById(stage, selectedIds[stage]);
    result[stage] = picked ?? defaultApproversByStage()[stage];
  }
  return result;
}

function missingRequiredStages(selectedIds: Record<SowApprovalStageKey, string>): SowApprovalStageKey[] {
  return STAGES.filter((stage) => {
    const candidates = listApproversForStage(stage);
    const auto = candidates.some((c) => c.auto);
    if (auto) return false;
    const id = selectedIds[stage];
    return !id || !candidateById(stage, id);
  });
}

export function SubmissionStep({ title, saving, error, onBack, onCancel, onCommit }: Props) {
  const defaults = React.useMemo(() => defaultApproversByStage(), []);
  const [selectedIds, setSelectedIds] = React.useState<Record<SowApprovalStageKey, string>>(() =>
    Object.fromEntries(STAGES.map((s) => [s, defaults[s].id])) as Record<SowApprovalStageKey, string>,
  );
  const [notify, setNotify] = React.useState(true);
  const [coverNote, setCoverNote] = React.useState("");
  const [validationError, setValidationError] = React.useState<string | null>(null);

  // Reviewer is assigned at intake but is NOT a pipeline stage — it routes the
  // SOW's accepted submissions to a specific enterprise reviewer (two-stage QA).
  // Populated from real reviewer accounts; selection is optional.
  const [reviewers, setReviewers] = React.useState<ReviewerOption[]>([]);
  const [reviewerId, setReviewerId] = React.useState("");

  React.useEffect(() => {
    const c = new AbortController();
    void (async () => {
      try {
        const res = await fetch("/api/superadmin/reviewers", {
          signal: c.signal,
          cache: "no-store",
        });
        if (!res.ok) return;
        const data = (await res.json()) as { reviewers?: ReviewerOption[] };
        if (Array.isArray(data.reviewers)) setReviewers(data.reviewers);
      } catch {
        // Reviewer is optional — silently leave the picker empty on failure.
      }
    })();
    return () => c.abort();
  }, []);

  const slaHours = STAGES.map((s) => STAGE_SLA_HOURS[s]);
  const slaUniform = slaHours.every((h) => h === slaHours[0]);
  const slaLabel = slaUniform ? `${slaHours[0]}h per stage` : slaHours.map((h, i) => `${STAGE_LABEL[STAGES[i]!]} ${h}h`).join(" · ");

  const commit = (kind: "draft" | "submit") => {
    if (kind === "submit") {
      const missing = missingRequiredStages(selectedIds);
      if (missing.length > 0) {
        setValidationError(
          `Select an approver for ${missing.map((s) => STAGE_LABEL[s]).join(", ")} before submitting.`,
        );
        return;
      }
    }
    setValidationError(null);
    const reviewer = reviewers.find((r) => r.id === reviewerId);
    onCommit({
      kind,
      config: {
        approvers: buildApproversRecord(selectedIds),
        notify,
        coverNote,
        reviewer: reviewer ? { id: reviewer.id, email: reviewer.email, name: reviewer.name } : undefined,
      },
    });
  };

  const footerError = validationError ?? error;

  return (
    <section className="rounded-lg border border-stroke bg-surface shadow-xs overflow-hidden">
      <header className="px-4 py-2.5 border-b border-stroke-subtle">
        <h2 className="font-body text-[13.5px] font-semibold text-foreground tracking-[-0.005em]">
          Submit for approval
        </h2>
        <p className="font-body text-[11.5px] text-text-tertiary">
          Assign approvers for each stage. Commercial is handled by Glimmora operations.
        </p>
      </header>

      <div className="p-4 space-y-5">
        <div className="rounded-md border border-stroke-subtle bg-bg-subtle/40 px-3 py-2 flex items-center gap-2">
          <span className="font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary">
            SOW
          </span>
          <span className="font-body text-[13px] font-medium text-foreground truncate" title={title}>
            {title || "Untitled SOW"}
          </span>
        </div>

        <div>
          <div className="mb-2 flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-brand-emphasis" strokeWidth={2} aria-hidden />
            <h3 className="font-body text-[12.5px] font-semibold text-foreground">
              Your SOW will go through these 5 stages
            </h3>
          </div>

          <ol className="space-y-2">
            {STAGES.map((stage, i) => (
              <StageApproverRow
                key={stage}
                ordinal={i + 1}
                stage={stage}
                selectedId={selectedIds[stage]}
                onSelect={(id) => {
                  setSelectedIds((prev) => ({ ...prev, [stage]: id }));
                  setValidationError(null);
                }}
                invalid={validationError !== null && missingRequiredStages(selectedIds).includes(stage)}
              />
            ))}
          </ol>

          <p className="mt-2.5 flex items-center gap-1.5 font-body text-[11px] text-text-tertiary">
            <Clock className="h-3 w-3 shrink-0" strokeWidth={2} aria-hidden />
            SLA per stage: {slaLabel} (from policy templates)
          </p>
        </div>

        <div>
          <label
            htmlFor="sow-reviewer"
            className="block font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary mb-1.5"
          >
            Reviewer{" "}
            <span className="font-normal normal-case tracking-normal text-text-tertiary">
              · optional · second-stage QA on delivered work
            </span>
          </label>
          <select
            id="sow-reviewer"
            value={reviewerId}
            onChange={(e) => setReviewerId(e.target.value)}
            className={selectCls}
          >
            <option value="">No reviewer (assign later)</option>
            {reviewers.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name || r.email || r.id}
              </option>
            ))}
          </select>
          <p className="mt-1.5 font-body text-[11px] text-text-tertiary">
            Accepted submissions on this SOW route to the chosen reviewer&apos;s queue.
            The reviewer is not part of the approval pipeline.
          </p>
        </div>

        <label className="flex items-start gap-2.5 cursor-pointer group">
          <input
            type="checkbox"
            checked={notify}
            onChange={(e) => setNotify(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-stroke text-brand focus-visible:ring-2 focus-visible:ring-brand/25"
          />
          <span className="font-body text-[12.5px] text-text-secondary group-hover:text-foreground transition-colors">
            <span className="inline-flex items-center gap-1 font-medium text-foreground">
              <Bell className="h-3.5 w-3.5 text-brand" strokeWidth={2} aria-hidden />
              Notify on stage changes
            </span>
            <span className="block mt-0.5 text-[11px] text-text-tertiary">
              Approvers and the SOW owner receive email when a stage advances or is sent back.
            </span>
          </span>
        </label>

        <div>
          <label className="block font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary mb-1.5">
            Cover note{" "}
            <span className="font-normal normal-case tracking-normal text-text-tertiary">
              · optional, visible to approvers
            </span>
          </label>
          <textarea
            value={coverNote}
            onChange={(e) => setCoverNote(e.target.value)}
            rows={4}
            placeholder="Why this SOW · what's changed since last version · anything to note up front…"
            className={cn(
              "w-full px-3 py-2 rounded-md resize-y",
              "bg-surface border border-stroke",
              "font-body text-[13px] text-foreground placeholder:text-text-disabled",
              "focus-visible:outline-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/25",
            )}
          />
        </div>
      </div>

      <footer className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t border-stroke-subtle bg-bg-subtle/30">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBack}
            disabled={saving !== null}
            className={cn(
              "inline-flex items-center h-9 px-3.5 rounded-md",
              "font-body text-[13px] font-semibold text-text-secondary",
              "hover:bg-bg-subtle hover:text-foreground transition-colors duration-fast",
              "disabled:opacity-60 disabled:cursor-not-allowed",
            )}
          >
            Back
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={saving !== null}
            className={cn(
              "inline-flex items-center h-9 px-3.5 rounded-md",
              "font-body text-[13px] font-semibold text-text-tertiary",
              "hover:text-foreground transition-colors duration-fast",
              "disabled:opacity-60 disabled:cursor-not-allowed",
            )}
          >
            Cancel
          </button>
        </div>

        {footerError && (
          <p role="alert" className="font-body text-[11.5px] text-error-text max-w-md">
            {footerError}
          </p>
        )}

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => commit("draft")}
            disabled={saving !== null}
            className={cn(
              "inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md",
              "bg-surface border border-stroke",
              "font-body text-[13px] font-semibold text-foreground",
              "hover:bg-surface-hover transition-colors duration-fast",
              "disabled:opacity-60 disabled:cursor-not-allowed",
            )}
          >
            {saving === "draft" ? "Saving…" : "Save as draft"}
          </button>
          <button
            type="button"
            onClick={() => commit("submit")}
            disabled={saving !== null}
            className={cn(
              "inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md shadow-xs",
              "bg-brand text-on-brand",
              "font-body text-[13px] font-semibold",
              "hover:bg-brand-hover transition-colors duration-fast",
              "disabled:opacity-60 disabled:cursor-not-allowed",
            )}
          >
            <Send className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
            {saving === "submit" ? "Submitting…" : "Submit for approval"}
          </button>
        </div>
      </footer>
    </section>
  );
}

function StageApproverRow({
  ordinal,
  stage,
  selectedId,
  onSelect,
  invalid,
}: {
  ordinal: number;
  stage: SowApprovalStageKey;
  selectedId: string;
  onSelect: (id: string) => void;
  invalid: boolean;
}) {
  const candidates = listApproversForStage(stage);
  const autoCandidate = candidates.find((c) => c.auto);
  const selected = candidates.find((c) => c.id === selectedId) ?? candidates[0];
  const pickerEnabled = !autoCandidate && candidates.length > 1;

  return (
    <li
      className={cn(
        "flex flex-wrap items-center gap-x-3 gap-y-2 rounded-md border px-3 py-2.5",
        invalid ? "border-error-border bg-error-subtle/30" : "border-stroke-subtle bg-bg-subtle/25",
      )}
    >
      <span
        aria-hidden
        className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand text-on-brand font-mono text-[10px] font-semibold tabular-nums"
      >
        {ordinal}
      </span>
      <span className="font-body text-[12.5px] font-semibold text-foreground w-24 shrink-0">
        {STAGE_LABEL[stage]}
      </span>

      <div className="flex-1 min-w-[200px]">
        {autoCandidate ? (
          <div className="inline-flex items-center gap-2 h-9 px-3 rounded-md bg-surface border border-stroke-subtle w-full max-w-md">
            <Lock className="h-3.5 w-3.5 text-text-tertiary shrink-0" strokeWidth={2} aria-hidden />
            <span className="font-body text-[13px] text-foreground truncate">{autoCandidate.name}</span>
            <span className="ml-auto font-body text-[10px] font-semibold uppercase tracking-wide text-text-tertiary shrink-0">
              Auto
            </span>
          </div>
        ) : pickerEnabled ? (
          <select
            id={`approver-${stage}`}
            value={selectedId}
            onChange={(e) => onSelect(e.target.value)}
            aria-invalid={invalid}
            className={cn(selectCls, invalid && "border-error-border")}
          >
            {candidates.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} · {c.role}
              </option>
            ))}
          </select>
        ) : (
          <div className="inline-flex items-center h-9 px-3 rounded-md bg-surface border border-stroke-subtle w-full max-w-md">
            <span className="font-body text-[13px] text-foreground truncate">
              {selected?.name ?? "—"}
            </span>
            {selected?.role && (
              <span className="ml-2 font-body text-[11px] text-text-tertiary truncate">
                · {selected.role}
              </span>
            )}
          </div>
        )}
      </div>
    </li>
  );
}
