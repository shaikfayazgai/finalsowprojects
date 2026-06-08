"use client";

import * as React from "react";
import Link from "next/link";
import { AlertTriangle, ArrowRight, Ban } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { formatMoney } from "@/mocks/data/enterprise-v2-orchestration";
import type { PayoutEntry } from "@/types/billing";

type IssueKind = "failed" | "onHold";

interface PayoutIssueListProps {
  kind: IssueKind;
  entries: PayoutEntry[];
}

const TITLE: Record<IssueKind, string> = {
  failed: "Failed transfers",
  onHold: "Compliance holds",
};

const SUBTITLE: Record<IssueKind, string> = {
  failed: "Bank errors and beneficiary mismatches",
  onHold: "KYC, tax, and policy holds",
};

export const PayoutIssueList: React.FC<PayoutIssueListProps> = ({ kind, entries }) => {
  const Icon = kind === "failed" ? Ban : AlertTriangle;
  const tone =
    kind === "failed"
      ? "bg-error-subtle text-error-text ring-[color-mix(in_oklab,var(--color-error)_22%,transparent)]"
      : "bg-warning-subtle text-warning-text ring-[color-mix(in_oklab,var(--color-warning)_22%,transparent)]";

  return (
    <section className="rounded-xl bg-surface ring-1 ring-stroke-subtle overflow-hidden">
      <header className="px-5 py-3.5 border-b border-stroke-subtle flex items-start justify-between gap-3">
        <div>
          <h2 className="font-body text-[14px] font-semibold text-foreground leading-tight">
            {TITLE[kind]} · {entries.length}
          </h2>
          <p className="font-body text-[12px] text-text-tertiary mt-0.5 leading-snug">
            {SUBTITLE[kind]}
          </p>
        </div>
        <span
          className={cn(
            "inline-flex h-7 w-7 items-center justify-center rounded-md ring-1 shrink-0",
            tone,
          )}
        >
          <Icon className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
        </span>
      </header>

      {entries.length === 0 ? (
        <div className="px-5 py-8 text-center">
          <p className="font-body text-[13px] font-semibold text-foreground">
            None right now
          </p>
          <p className="font-body text-[11.5px] text-text-tertiary mt-1">
            {kind === "failed"
              ? "All transfers succeeded this cycle."
              : "No contributors blocked by compliance."}
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-stroke-subtle">
          {entries.slice(0, 6).map((e) => (
            <li
              key={e.id}
              className="px-5 py-3 flex items-center gap-3 hover:bg-[var(--state-hover)] transition-colors duration-150"
            >
              <span
                aria-hidden
                className="grid place-items-center h-7 w-7 rounded-full bg-bg-subtle text-text-secondary font-body text-[10px] font-bold leading-none shrink-0"
              >
                {e.contributorInitials}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-body text-[12.5px] font-semibold text-foreground leading-tight truncate">
                  {e.contributorName}
                </p>
                <p className="font-body text-[11px] text-text-tertiary mt-0.5 leading-snug truncate">
                  {e.holdReason ?? "Reason not recorded"}
                </p>
              </div>
              <p className="font-body text-[12.5px] font-semibold text-foreground tabular-nums shrink-0">
                {formatMoney(e.amountCents)}
              </p>
              <Link
                href="/enterprise/review"
                className="inline-flex items-center gap-1 px-2 py-1 rounded-md font-body text-[10.5px] font-semibold text-[var(--color-brand)] hover:bg-[var(--state-hover)] transition-colors duration-150 shrink-0"
              >
                Source <ArrowRight className="h-3 w-3" strokeWidth={2} aria-hidden />
              </Link>
            </li>
          ))}
          {entries.length > 6 && (
            <li className="px-5 py-2 font-body text-[11px] text-text-tertiary text-center">
              +{entries.length - 6} more
            </li>
          )}
        </ul>
      )}
    </section>
  );
};
