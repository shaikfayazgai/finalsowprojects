import type { StatusChipProps } from "@/components/meridian/primitives/StatusChip";
import type { PayoutDetail, PayoutStatus } from "@/lib/payouts/types";
import { MOCK_PAYOUTS } from "@/mocks/contributor/payouts";
import { MOCK_TASKS } from "@/mocks/contributor/tasks";

type StatusChipVariant = NonNullable<StatusChipProps["status"]>;

const TITLE_BY_TASK_ID = new Map<string, string>();
for (const p of MOCK_PAYOUTS) TITLE_BY_TASK_ID.set(p.taskId, p.taskTitle);
for (const t of MOCK_TASKS) TITLE_BY_TASK_ID.set(t.id, t.title);

export const MIN_WITHDRAWAL_MINOR = 50_000;

export function fmtINR(minor: number): string {
  return `₹${Math.round(minor / 100).toLocaleString("en-IN")}`;
}

export function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function fmtRelative(iso: string | null): string {
  if (!iso) return "—";
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 60_000) return "just now";
  if (ms < 3_600_000) return `${Math.floor(ms / 60_000)}m ago`;
  if (ms < 86_400_000) return `${Math.floor(ms / 3_600_000)}h ago`;
  return `${Math.floor(ms / 86_400_000)}d ago`;
}

function humanizeTaskId(id: string | null | undefined): string {
  if (!id) return "Task";
  return id
    .replace(/^t-/, "")
    .replace(/^task[-_]?/i, "")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function payoutTaskTitle(p: PayoutDetail): string {
  // Prefer the real backend title; fall back to mock map, then humanized id.
  return (
    p.taskTitle ||
    TITLE_BY_TASK_ID.get(p.taskDefinitionId) ||
    humanizeTaskId(p.taskDefinitionId)
  );
}

export function payoutStatusLabel(status: PayoutStatus): string {
  switch (status) {
    case "eligible":
      return "Ready to withdraw";
    case "requested":
      return "Requested";
    case "processing":
      return "Processing";
    case "sent":
      return "Paid";
    case "failed":
      return "Failed";
    case "on_hold":
      return "On hold";
    default:
      return String(status).replace(/_/g, " ");
  }
}

export function payoutStatusChip(status: PayoutStatus): StatusChipVariant {
  switch (status) {
    case "sent":
      return "success";
    case "eligible":
      return "info";
    case "requested":
    case "processing":
      return "pending";
    case "on_hold":
      return "warning";
    case "failed":
      return "error";
    default:
      return "neutral";
  }
}

export function payoutActivityDate(p: PayoutDetail): string | null {
  return p.sentAt ?? p.processingAt ?? p.requestedAt ?? p.eligibleAt ?? p.updatedAt;
}

export function payoutMetaLine(p: PayoutDetail): string {
  const parts: string[] = [];
  const hours = p.computation.hoursBilled;
  if (hours > 0) parts.push(`${hours}h billed`);

  if (p.status === "sent" && p.sentAt) {
    parts.push(`Paid ${fmtRelative(p.sentAt)}`);
  } else if (p.status === "eligible" && p.eligibleAt) {
    parts.push(`Eligible ${fmtRelative(p.eligibleAt)}`);
  } else if (p.status === "failed" && p.failureReason) {
    parts.push(p.failureReason);
  } else if (p.status === "on_hold" && p.failureReason) {
    parts.push(p.failureReason);
  } else {
    const when = payoutActivityDate(p);
    if (when) parts.push(fmtRelative(when));
  }

  if (p.externalRef) parts.push(p.externalRef);
  return parts.join(" · ");
}

export function isAttentionStatus(status: PayoutStatus): boolean {
  return status === "failed" || status === "on_hold";
}
