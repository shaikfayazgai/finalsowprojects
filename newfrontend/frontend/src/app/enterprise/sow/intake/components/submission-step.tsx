"use client";

/**
 * SOW intake — submit for approval (two-gate model).
 *   1. Glimmora Commercial (platform)
 *   2. Enterprise admin sign-off
 */

import * as React from "react";
import { Bell, Building2, Clock, Send, ShieldCheck } from "lucide-react";
import { APPROVAL_STAGE_ORDER, STAGE_LABEL, STAGE_SLA_HOURS } from "@/lib/sow/approval-pipeline";
import type { SowStage } from "@/lib/sow/types";
import type { SowPricing } from "@/lib/pricing";
import { defaultApproversByStage, type ApproverCandidate } from "@/lib/api/enterprise-approvers";
import { cn } from "@/lib/utils/cn";
import { DASH_CARD, AURORA_ACCENT } from "@/app/admin/_shell/aurora";
import { GLASS_FIELD_STYLE, secondaryBtnClass, primaryBtnClass, primaryStyle } from "@/app/admin/_shell/aurora-ui";
import { PricingSection } from "./pricing-section";

export interface SubmissionConfig {
  approvers: Record<SowStage, ApproverCandidate>;
  notify: boolean;
  coverNote: string;
  pricing: SowPricing | null;
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

export function SubmissionStep({ title, saving, error, onBack, onCancel, onCommit }: Props) {
  const [notify, setNotify] = React.useState(true);
  const [coverNote, setCoverNote] = React.useState("");
  const [pricing, setPricing] = React.useState<SowPricing | null>(null);

  const slaHours = STAGE_SLA_HOURS.finance;
  const approvers = React.useMemo(() => defaultApproversByStage(), []);

  // Pricing is required to submit (clientPrice > 0), but a draft can be saved
  // without it.
  const canSubmit = pricing != null && pricing.clientPrice > 0;

  const commit = (kind: "draft" | "submit") => {
    onCommit({
      kind,
      config: { approvers, notify, coverNote, pricing },
    });
  };

  return (
    <section className={cn(DASH_CARD, "overflow-hidden")}>
      <header className="px-5 sm:px-6 pt-4 pb-3.5 border-b border-stroke-subtle">
        <h2 className="font-display text-[15px] font-semibold text-foreground tracking-[-0.01em]">
          Submit for approval
        </h2>
        <p className="mt-0.5 font-body text-[12.5px] text-text-secondary">
          Enterprise gates run (Security → Finance → Legal → Tenant admin), then the Super admin signs off.
        </p>
      </header>

      <div className="px-5 sm:px-6 py-5 space-y-5">
        <div className="rounded-lg border border-stroke-subtle bg-bg-subtle px-3 py-2 flex items-center gap-2">
          <span className="font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary">
            SOW
          </span>
          <span className="font-body text-[13px] font-medium text-foreground truncate" title={title}>
            {title || "Untitled SOW"}
          </span>
        </div>

        <PricingSection value={pricing} onChange={setPricing} />

        <div>
          <div className="mb-2 flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-brand-emphasis" strokeWidth={2} aria-hidden />
            <h3 className="font-display text-[12.5px] font-semibold text-foreground">
              Approval gates
            </h3>
          </div>

          <ol className="space-y-2">
            {APPROVAL_STAGE_ORDER.map((stage, i) => (
              <li
                key={stage}
                className="flex items-start gap-3 rounded-lg border border-stroke-subtle bg-bg-subtle px-3 py-2.5 transition-colors duration-fast hover:bg-bg-subtle"
              >
                <span
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white font-mono text-[11px] font-bold"
                  style={{ backgroundImage: AURORA_ACCENT }}
                >
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-body text-[13px] font-semibold text-foreground">
                    {STAGE_LABEL[stage]}
                  </p>
                  <p className="font-body text-[11.5px] text-text-tertiary mt-0.5">
                    {stage === "platform"
                      ? "Glimmora platform performs the final approval before delivery."
                      : "Enterprise reviewer signs off this internal gate (not the author)."}
                  </p>
                </div>
                {stage === "platform" ? (
                  <Building2 className="h-4 w-4 text-text-tertiary shrink-0" strokeWidth={2} aria-hidden />
                ) : null}
              </li>
            ))}
          </ol>

          <p className="mt-2.5 flex items-center gap-1.5 font-body text-[11px] text-text-tertiary">
            <Clock className="h-3 w-3 shrink-0" strokeWidth={2} aria-hidden />
            SLA: {slaHours}h per gate (from policy templates)
          </p>
        </div>

        <label className="flex items-start gap-2.5 cursor-pointer group">
          <input
            type="checkbox"
            checked={notify}
            onChange={(e) => setNotify(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-stroke-subtle text-brand focus-visible:ring-2 focus-visible:ring-[rgba(124,92,246,0.32)]"
          />
          <span className="font-body text-[12.5px] text-text-secondary group-hover:text-foreground transition-colors">
            <span className="inline-flex items-center gap-1 font-medium text-foreground">
              <Bell className="h-3.5 w-3.5 text-brand-emphasis" strokeWidth={2} aria-hidden />
              Notify on status changes
            </span>
            <span className="block mt-0.5 text-[11px] text-text-tertiary">
              You are notified when Glimmora Commercial completes review and when the SOW is fully approved.
            </span>
          </span>
        </label>

        <div>
          <label className="block font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary mb-1.5">
            Cover note{" "}
            <span className="font-normal normal-case tracking-normal text-text-tertiary">
              · optional
            </span>
          </label>
          <textarea
            value={coverNote}
            onChange={(e) => setCoverNote(e.target.value)}
            rows={4}
            placeholder="Context for Glimmora Commercial and your admin approver…"
            style={GLASS_FIELD_STYLE}
            className="w-full px-3 py-2.5 rounded-lg resize-y font-body text-[13px] text-foreground placeholder:text-text-disabled focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(124,92,246,0.18)]"
          />
        </div>
      </div>

      <footer className="px-5 sm:px-6 py-3.5 border-t border-stroke-subtle flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBack}
            className={secondaryBtnClass}
          >
            Back
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center justify-center h-10 px-3.5 rounded-lg font-body text-[13.5px] font-semibold text-text-tertiary hover:text-foreground transition-colors duration-fast"
          >
            Cancel
          </button>
        </div>
        <div className="flex flex-col sm:items-end gap-1.5">
          {error && (
            <p className="font-body text-[12px] text-error-text text-right max-w-sm">{error}</p>
          )}
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={saving !== null}
              onClick={() => commit("draft")}
              className={secondaryBtnClass}
            >
              {saving === "draft" ? "Saving…" : "Save as draft"}
            </button>
            <button
              type="button"
              disabled={saving !== null || !canSubmit}
              onClick={() => commit("submit")}
              title={canSubmit ? undefined : "Enter commercial pricing above to submit."}
              className={primaryBtnClass}
              style={primaryStyle}
            >
              {saving === "submit" ? (
                "Submitting…"
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                  Submit for approval
                </>
              )}
            </button>
          </div>
        </div>
      </footer>
    </section>
  );
}
