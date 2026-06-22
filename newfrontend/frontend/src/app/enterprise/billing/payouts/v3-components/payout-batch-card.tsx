"use client";

import * as React from "react";
import { Send, Users } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { DASH_CARD } from "@/app/admin/_shell/aurora";
import {
  Chip,
  type Tone,
  primaryBtnClass,
  primaryStyle,
  secondaryBtnClass,
} from "@/app/admin/_shell/aurora-ui";
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

const STATE_TONE: Record<PayoutBatchState, Tone> = {
  preparing: "neutral",
  ready: "ai",
  in_flight: "ai",
  completed: "success",
  failed: "error",
  on_hold: "warning",
};

export const PayoutBatchCard: React.FC<PayoutBatchCardProps> = ({
  batch,
  onSend,
}) => {
  const contributorCount = new Set(
    batch.entries.map((e) => e.contributorName),
  ).size;
  const readyEntries = batch.entries.filter((e) => e.state === "ready");
  const blockedEntries = batch.entries.filter(
    (e) => e.state === "failed" || e.state === "on_hold",
  );
  const canSend = batch.state === "ready" && readyEntries.length > 0;

  return (
    <article className={cn(DASH_CARD, "overflow-hidden")}>
      <header className="px-5 py-3.5 border-b border-stroke-subtle flex items-start justify-between gap-3 flex-wrap">
        <div>
          <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.12em] text-text-tertiary">
            Payout batch
          </p>
          <h3 className="font-display text-[15px] font-semibold text-foreground leading-tight mt-0.5 tabular-nums">
            {batch.label}
          </h3>
          <p className="font-body text-[11.5px] text-text-tertiary mt-1">
            Created{" "}
            {new Date(batch.createdAt).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </p>
        </div>
        <Chip tone={STATE_TONE[batch.state]} dot={false}>
          {STATE_LABEL[batch.state]}
        </Chip>
      </header>

      <div className="px-5 py-4 grid grid-cols-3 divide-x divide-stroke-subtle">
        <BatchStat label="Contributors" value={String(contributorCount)} icon={Users} />
        <div className="pl-4">
          <BatchStat label="Entries" value={String(batch.entries.length)} />
        </div>
        <div className="pl-4">
          <BatchStat label="Total" value={formatMoney(batch.totalCents)} />
        </div>
      </div>

      {blockedEntries.length > 0 && (
        <div className="px-5 py-2.5 border-t border-stroke-subtle bg-warning-subtle/40 flex items-center gap-2">
          <span
            aria-hidden
            className="h-1.5 w-1.5 rounded-full bg-[var(--color-warning-solid)]"
          />
          <p className="font-body text-[11.5px] text-foreground">
            {blockedEntries.length} entr
            {blockedEntries.length === 1 ? "y" : "ies"} blocked — will skip on
            send
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
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus",
            canSend
              ? cn(primaryBtnClass, "h-8 px-3 text-[12px]")
              : cn(
                  secondaryBtnClass,
                  "h-8 px-3 text-[12px] opacity-55 cursor-not-allowed",
                ),
          )}
          style={canSend ? primaryStyle : undefined}
        >
          <Send className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
          {batch.state === "completed" ? "Sent" : "Send batch"}
        </button>
      </footer>
    </article>
  );
};

const BatchStat: React.FC<{
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
