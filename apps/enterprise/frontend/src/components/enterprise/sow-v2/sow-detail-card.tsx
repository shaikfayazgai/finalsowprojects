"use client";

import * as React from "react";
import type {
  SowApprovalSummary,
  SowDetail,
  SowVersionDetail,
} from "@/lib/sow/types";
import { Badge } from "@/components/ui/badge";
import { SowStageBadge, SowStatusBadge, stageLabel } from "./sow-status-badge";

function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function decisionVariant(
  decision: SowApprovalSummary["decision"],
): React.ComponentProps<typeof Badge>["variant"] {
  switch (decision) {
    case "approved":
      return "forest";
    case "rejected":
      return "danger";
    case "send_back":
      return "gold";
    case "pending":
    default:
      return "beige";
  }
}

const DECISION_LABEL: Record<SowApprovalSummary["decision"], string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  send_back: "Sent back",
};

export function SowDetailCard({ sow }: { sow: SowDetail }) {
  return (
    <div className="space-y-5">
      <Header sow={sow} />
      <ActiveVersionCard version={sow.activeVersionDetail} />
      <ApprovalTrailCard approvals={sow.approvals} />
    </div>
  );
}

function Header({ sow }: { sow: SowDetail }) {
  return (
    <div className="rounded-xl bg-surface ring-1 ring-stroke-subtle p-5 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-display text-[18px] font-semibold text-foreground">
            {sow.title}
          </h1>
          <p className="mt-1 font-mono text-[11.5px] text-text-tertiary truncate">
            {sow.id}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 shrink-0">
          <SowStatusBadge status={sow.status} />
          <SowStageBadge stage={sow.stage} />
        </div>
      </div>
      <dl className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[12px]">
        <Field label="Active version" value={`v${sow.activeVersion}`} />
        <Field label="Confidentiality" value={sow.confidentiality} />
        <Field
          label="Submitted"
          value={formatDateTime(sow.submittedForApprovalAt)}
        />
        <Field label="Approved" value={formatDateTime(sow.approvedAt)} />
        <Field label="Rejected" value={formatDateTime(sow.rejectedAt)} />
        <Field label="Withdrawn" value={formatDateTime(sow.withdrawnAt)} />
        <Field label="Archived" value={formatDateTime(sow.archivedAt)} />
        <Field label="Last updated" value={formatDateTime(sow.updatedAt)} />
      </dl>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-body text-[10.5px] uppercase tracking-wide text-text-tertiary">
        {label}
      </dt>
      <dd className="mt-0.5 font-body text-foreground">{value}</dd>
    </div>
  );
}

function ActiveVersionCard({
  version,
}: {
  version: SowVersionDetail | null;
}) {
  if (!version) {
    return (
      <div className="rounded-xl bg-surface ring-1 ring-stroke-subtle p-5">
        <p className="font-body text-[12.5px] text-text-tertiary">
          No active version data
        </p>
      </div>
    );
  }
  return (
    <div className="rounded-xl bg-surface ring-1 ring-stroke-subtle p-5 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <h2 className="font-display text-[14px] font-semibold text-foreground">
          Active version v{version.version}
        </h2>
        <span className="font-body text-[11.5px] text-text-tertiary">
          {formatDateTime(version.createdAt)}
        </span>
      </div>
      {version.changeNote && (
        <p className="font-body text-[12.5px] text-text-secondary">
          <span className="text-text-tertiary">Change note · </span>
          {version.changeNote}
        </p>
      )}
      {version.body && (
        <pre className="whitespace-pre-wrap rounded-lg bg-surface-muted/30 p-3 font-mono text-[11.5px] text-foreground">
          {version.body}
        </pre>
      )}
      <details className="text-[12px]">
        <summary className="cursor-pointer font-body text-[11.5px] font-semibold uppercase tracking-wide text-text-tertiary">
          Payload
        </summary>
        <pre className="mt-2 whitespace-pre-wrap rounded-lg bg-surface-muted/30 p-3 font-mono text-[11px] text-foreground">
          {JSON.stringify(version.payload, null, 2)}
        </pre>
      </details>
    </div>
  );
}

function ApprovalTrailCard({
  approvals,
}: {
  approvals: SowApprovalSummary[];
}) {
  return (
    <div className="rounded-xl bg-surface ring-1 ring-stroke-subtle p-5 space-y-3">
      <h2 className="font-display text-[14px] font-semibold text-foreground">
        Approval trail
      </h2>
      {approvals.length === 0 ? (
        <p className="font-body text-[12.5px] text-text-tertiary">
          Not yet submitted for approval.
        </p>
      ) : (
        <ol className="space-y-2">
          {approvals.map((a) => (
            <li
              key={a.id}
              className="rounded-lg ring-1 ring-stroke-subtle bg-surface-muted/20 p-3 space-y-1"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="font-body text-[12.5px] font-semibold text-foreground">
                  {stageLabel(a.stage)} · v{a.sowVersion}
                </div>
                <Badge variant={decisionVariant(a.decision)} size="sm">
                  {DECISION_LABEL[a.decision]}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-0.5 font-body text-[11.5px] text-text-tertiary">
                <span>Created · {formatDateTime(a.createdAt)}</span>
                <span>Decided · {formatDateTime(a.decidedAt)}</span>
                {a.approverId && <span>By · {a.approverId}</span>}
              </div>
              {a.comment && (
                <p className="font-body text-[12px] text-text-secondary mt-1">
                  {a.comment}
                </p>
              )}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
