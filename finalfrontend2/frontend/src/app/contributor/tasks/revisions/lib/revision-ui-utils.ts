import type { StatusChipProps } from "@/components/meridian/primitives/StatusChip";

type StatusChipVariant = NonNullable<StatusChipProps["status"]>;

export function fmtRevisionDue(iso: string): { text: string; overdue: boolean; warn: boolean } {
  const diff = new Date(iso).getTime() - Date.now();
  const overdue = diff < 0;
  const warn = !overdue && diff < 24 * 3_600_000;
  const abs = Math.abs(diff);
  const part =
    abs < 3_600_000
      ? `${Math.max(1, Math.floor(abs / 60_000))}m`
      : abs < 86_400_000
        ? `${Math.floor(abs / 3_600_000)}h`
        : `${Math.floor(abs / 86_400_000)}d`;
  return {
    text: overdue ? `Resubmit-by overdue ${part}` : `Resubmit in ${part}`,
    overdue,
    warn,
  };
}

export function fmtRelative(iso: string | null): string {
  if (!iso) return "—";
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 60_000) return "just now";
  if (ms < 3_600_000) return `${Math.floor(ms / 60_000)}m ago`;
  if (ms < 86_400_000) return `${Math.floor(ms / 3_600_000)}h ago`;
  return `${Math.floor(ms / 86_400_000)}d ago`;
}

export function revisionStatusChip(readyToResubmit: boolean): StatusChipVariant {
  return readyToResubmit ? "success" : "warning";
}

export function revisionStatusLabel(readyToResubmit: boolean): string {
  return readyToResubmit ? "Ready to resubmit" : "Addressing feedback";
}
