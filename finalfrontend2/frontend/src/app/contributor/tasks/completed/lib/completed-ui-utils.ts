import type { StatusChipProps } from "@/components/meridian/primitives/StatusChip";

type StatusChipVariant = NonNullable<StatusChipProps["status"]>;

export function fmtINR(minor: number): string {
  return `₹${Math.round(minor / 100).toLocaleString("en-IN")}`;
}

export function fmtAcceptedDate(iso: string | null): string {
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

export function payoutStatusLabel(status: string): string {
  switch (status) {
    case "paid":
      return "Paid";
    case "pending":
      return "Pending";
    case "eligible":
      return "Eligible";
    case "failed":
      return "Failed";
    case "reversed":
      return "Reversed";
    default:
      return status.replace(/_/g, " ");
  }
}

export function payoutStatusChip(status: string): StatusChipVariant {
  switch (status) {
    case "paid":
      return "success";
    case "pending":
    case "eligible":
      return "pending";
    case "failed":
    case "reversed":
      return "error";
    default:
      return "neutral";
  }
}

export function fmtSize(bytes: number | null): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
