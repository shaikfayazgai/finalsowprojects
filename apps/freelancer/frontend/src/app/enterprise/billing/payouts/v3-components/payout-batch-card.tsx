"use client";

import * as React from "react";
import { Send, Users } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { formatMoney } from "@/mocks/data/enterprise-v2-orchestration";
import type { PayoutBatch, PayoutBatchState } from "@/types/billing";

interface PayoutBatchCardProps {
  batch: PayoutBatch;
  onSend: (batch: PayoutBatch) => void;
}

const STATE_LABEL: Record<PayoutBatchState, string> = {
  preparing: "Preparing",
  ready: "Ready to send",
  in_flight: "In flight",
  completed: "Completed",
  failed: "Needs attention",
  on_hold: "On hold",
};

const STATE_CHIP: Record<PayoutBatchState, string> = {
  preparing: "bg-bg-subtle text-text-secondary",
  ready: "bg-[color-mix(in_oklab,var(--color-brand)_10%,transparent)] text-[var(--color-brand)]",
  in_flight: "bg-[color-mix(in_oklab,var(--color-brand)_10%,transparent)] text-[var(--color-brand)]",
  completed: "bg-success-subtle text-success-text",
  failed: "bg-error-subtle text-error-text",
  on_hold: "bg-warning-subtle text-warning-text",
};

export const PayoutBatchCard: React.FC<PayoutBatchCardProps> = ({ batch, onSend }) => {
  const contributorCount = new Set(batch.entries.map((e) => e.contributorName)).size;
  const readyEntries = batch.entries.filter((e) => e.state === "ready");
  const blockedEntries = batch.entries.filter((e) => e.state === "failed" || e.state === "on_hold");
  const canSend = batch.state === "ready" && readyEntries.length > 0;

  return (
    <article className="rounded-xl bg-surface ring-1 ring-stroke-subtle overflow-hidden">
      <header className="px-5 py-3.5 border-b border-stroke-subtle flex items-start justify-between gap-3 flex-wrap">
        <div>
          <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.12em] text-text-tertiary">
            Payout batch
          </p>
          <h3 className="font-body text-[15px] font-semibold text-foreground leading-tight mt-0.5 tabular-nums">
            {batch.label}
          </h3>
          <p className="font-body text-[11.5px] text-text-tertiary mt-1">
            Created {new Date(batch.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
          </p>
        </div>
        <span
          className={cn(
            "inline-flex items-center px-2 py-0.5 rounded-full",
            "font-body text-[11px] font-semibold uppercase tracking-wide",
            STATE_CHIP[batch.state],
          )}
        >
          {STATE_LABEL[batch.state]}
        </span>
      </header>

      <div className="px-5 py-4 grid grid-cols-3 divide-x divide-stroke-subtle">
        <Stat label="Contributors" value={String(contributorCount)} icon={Users} />
        <div className="pl-4">
          <Stat label="Entries" value={String(batch.entries.length)} />
        </div>
        <div className="pl-4">
          <Stat label="Total" value={formatMoney(batch.totalCents)} />
        </div>
      </div>

      {blockedEntries.length > 0 && (
        <div className="px-5 py-2.5 border-t border-stroke-subtle bg-warning-subtle/40 flex items-center gap-2">
          <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-[var(--color-warning)]" />
          <p className="font-body text-[11.5px] text-foreground">
            {blockedEntries.length} entr{blockedEntries.length === 1 ? "y" : "ies"} blocked — will skip on send
          </p>
        </div>
      )}

      <footer className="px-5 py-3 border-t border-stroke-subtle flex items-center justify-between gap-3">
        <p className="font-body text-[11.5px] text-text-secondary">
          {readyEntries.length} of {batch.entries.length} ready
        </p>
        <button
          type="button"
          onClick={() => onSend(batch)}
          disabled={!canSend}
          className={cn(
            "inline-flex items-center gap-1.5 h-8 px-3 rounded-md",
            "font-body text-[12px] font-semibold",
            "transition-colors duration-150",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus",
            canSend
              ? "bg-[var(--color-brand)] text-text-inverse hover:bg-[var(--color-brand-hover)]"
              : "bg-bg-subtle text-text-tertiary cursor-not-allowed",
          )}
        >
          <Send className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
          {batch.state === "completed" ? "Sent" : "Send batch"}
        </button>
      </footer>
    </article>
  );
};

const Stat: React.FC<{
  label: string;
  value: string;
  icon?: React.ComponentType<{ className?: string; strokeWidth?: number }>;
}> = ({ label, value, icon: Icon }) => (
  <div className="first:pr-4">
    <p className="inline-flex items-center gap-1.5 font-body text-[10px] font-bold uppercase tracking-[0.12em] text-text-tertiary mb-1">
      {Icon && <Icon className="h-3 w-3" strokeWidth={2} aria-hidden />}
      {label}
    </p>
    <p className="font-body text-[15px] font-semibold text-foreground tabular-nums leading-none">
      {value}
    </p>
  </div>
);
