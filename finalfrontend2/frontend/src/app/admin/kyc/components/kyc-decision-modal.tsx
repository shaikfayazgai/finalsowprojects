"use client";

/**
 * KYC decision modal — approve / request more info / reject.
 *
 * "Approve" and "Reject" POST to the real backend via
 * /api/superadmin/kyc/[accountId]/decision.
 *
 * "Request more info" is a UI-only action at this time — the backend
 * POST /api/superadmin/kyc/{id}/decision only accepts approve | reject.
 * When "more_info" is selected, the submission is skipped and the admin
 * is informed that contacting the contributor directly is required.
 */

import * as React from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Gavel } from "lucide-react";
import { useActiveAdmin } from "@/lib/hooks/use-active-admin";
import { invalidateKycCache } from "@/lib/hooks/use-admin-kyc";
import type { MockKycCase } from "@/mocks/admin/kyc";
import { cn } from "@/lib/utils/cn";
import { AdminModal, TONE, primaryBtnClass, primaryStyle, secondaryBtnClass } from "../../_shell/aurora-ui";

export type KycDecisionOutcome = "approved" | "rejected" | "more_info";

const OUTCOMES: Array<{ value: KycDecisionOutcome; label: string; hint: string; tone: "success" | "info" | "error" }> = [
  { value: "approved", label: "Approve", hint: "Identity verified — unblock onboarding", tone: "success" },
  { value: "more_info", label: "Request more info", hint: "Ask the contributor to re-upload or clarify (contact contributor directly)", tone: "info" },
  { value: "rejected", label: "Reject", hint: "Documents fail verification", tone: "error" },
];

const TEXTAREA = cn(
  "w-full min-h-[96px] px-3 py-2.5 rounded-lg border border-stroke-subtle bg-surface",
  "font-body text-[13px] text-foreground placeholder:text-text-disabled resize-y transition-colors",
  "focus-visible:outline-none focus-visible:border-[var(--c-violet-400)] focus-visible:ring-2 focus-visible:ring-[rgba(124,92,246,0.18)]",
);

/** Extract the numeric account ID from a KYC case id like "KYC-42". */
function extractAccountId(caseId: string): string {
  return caseId.replace(/^KYC-/i, "");
}

export function KycDecisionModal({
  kycCase: c,
  open,
  onClose,
}: {
  kycCase: MockKycCase;
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const { profile } = useActiveAdmin();

  const [decision, setDecision] = React.useState<KycDecisionOutcome | "">("");
  const [note, setNote] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      setDecision("");
      setNote("");
      setSubmitting(false);
      setError(null);
    }
  }, [open]);

  const canSubmit =
    !submitting &&
    decision !== "" &&
    (decision === "approved" || decision === "more_info" || note.trim().length > 4);

  async function handleSubmit() {
    if (!canSubmit || !decision) return;

    // "more_info" has no backend endpoint — just close and inform.
    if (decision === "more_info") {
      onClose();
      router.push("/admin/kyc?decided=1");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const accountId = extractAccountId(c.id);
      const res = await fetch(`/api/superadmin/kyc/${accountId}/decision`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decision: decision === "approved" ? "approve" : "reject",
          note: note.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string; detail?: string };
        throw new Error(body.error ?? body.detail ?? `Server error ${res.status}`);
      }

      // Invalidate the KYC cache so the list refreshes on return.
      invalidateKycCache();

      onClose();
      router.push("/admin/kyc?decided=1");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit decision");
      setSubmitting(false);
    }
  }

  return (
    <AdminModal
      open={open}
      onClose={onClose}
      icon={Gavel}
      tone="info"
      title="Record KYC decision"
      description="Approve, request more info, or reject this submission."
      footer={
        <>
          <button type="button" onClick={onClose} className={secondaryBtnClass} disabled={submitting}>
            Cancel
          </button>
          <button
            type="button"
            disabled={!canSubmit}
            onClick={() => void handleSubmit()}
            className={cn(primaryBtnClass, "px-5")}
            style={primaryStyle}
          >
            <CheckCircle2 className="h-4 w-4" strokeWidth={2.4} aria-hidden />
            {submitting ? "Submitting…" : "Submit decision"}
          </button>
        </>
      }
    >
      <div className="rounded-lg border border-stroke-subtle bg-bg-subtle/40 px-3.5 py-2.5">
        <p className="font-body text-[10.5px] font-semibold uppercase tracking-[0.1em] text-text-tertiary">Applicant</p>
        <p className="mt-0.5 font-body text-[13px] font-semibold text-foreground leading-snug">
          {c.contributorName}
          <span className="ml-2 font-mono text-[11px] font-normal text-text-tertiary">{c.id}</span>
        </p>
      </div>

      <fieldset className="mt-4 space-y-2">
        <legend className="font-body text-[10.5px] font-semibold uppercase tracking-[0.1em] text-text-tertiary mb-2">
          Outcome
        </legend>
        {OUTCOMES.map((o) => {
          const checked = decision === o.value;
          return (
            <label
              key={o.value}
              className="flex items-start gap-2.5 rounded-lg border px-3.5 py-3 cursor-pointer transition-colors hover:bg-bg-subtle/40"
              style={checked ? { background: TONE[o.tone].soft, borderColor: TONE[o.tone].border } : undefined}
            >
              <input
                type="radio"
                name="kyc-decision"
                checked={checked}
                onChange={() => setDecision(o.value)}
                className="mt-0.5 h-4 w-4 accent-[var(--c-violet-500)]"
              />
              <span className="min-w-0">
                <span className="block font-body text-[13px] font-semibold text-foreground">{o.label}</span>
                <span className="block mt-0.5 font-body text-[11.5px] text-text-tertiary leading-relaxed">{o.hint}</span>
              </span>
            </label>
          );
        })}
      </fieldset>

      <div className="mt-4">
        <label htmlFor="kyc-decision-note" className="block font-body text-[12.5px] font-semibold text-foreground mb-1.5">
          Note
          {decision !== "" && decision !== "approved" && decision !== "more_info" ? (
            <span style={{ color: TONE.error.text }}> *</span>
          ) : null}
        </label>
        <p className="mb-2 font-body text-[11.5px] text-text-tertiary">
          {decision === "approved"
            ? "Optional · added to audit trail"
            : decision === "more_info"
              ? "Optional · for your own record (not sent to backend)"
              : "Required · audit + visible to contributor on the outcome"}
        </p>
        <textarea
          id="kyc-decision-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={4}
          placeholder={
            decision === "rejected"
              ? "Explain why the documents failed verification…"
              : decision === "more_info"
                ? "Specify what the contributor needs to provide (for your record)…"
                : "Add a note for the audit trail…"
          }
          className={TEXTAREA}
        />
      </div>

      {error ? (
        <p className="mt-2 font-body text-[12px] text-error-text">{error}</p>
      ) : null}

      {decision === "" ? (
        <p className="mt-3 flex items-center gap-1.5 font-body text-[11.5px] text-text-tertiary">
          <Gavel className="h-3.5 w-3.5 shrink-0" strokeWidth={2} aria-hidden />
          Select an outcome to record this decision.
        </p>
      ) : null}
    </AdminModal>
  );
}
