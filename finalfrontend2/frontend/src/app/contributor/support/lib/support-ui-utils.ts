import type { StatusChipProps } from "@/components/meridian/primitives/StatusChip";
import type {
  FaqGroup,
  MockGrievance,
  MockGrievanceType,
  MockSafetyCase,
  MockTicket,
} from "@/mocks/contributor/support";

type StatusChipVariant = NonNullable<StatusChipProps["status"]>;

export function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function fmtDateOnly(value: string | null): string {
  if (!value) return "Not specified";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function fmtUpdatedDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function fmtRelative(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 60_000) return "just now";
  if (ms < 3_600_000) return `${Math.floor(ms / 60_000)}m ago`;
  if (ms < 86_400_000) return `${Math.floor(ms / 3_600_000)}h ago`;
  return `${Math.floor(ms / 86_400_000)}d ago`;
}

export function ticketStatusLabel(status: MockTicket["status"]): string {
  switch (status) {
    case "open":
      return "Open";
    case "in_progress":
      return "In progress";
    case "waiting":
      return "Waiting on you";
    case "resolved":
      return "Resolved";
    default:
      return String(status).replace(/_/g, " ");
  }
}

export function ticketStatusChip(status: MockTicket["status"]): StatusChipVariant {
  switch (status) {
    case "resolved":
      return "success";
    case "in_progress":
      return "info";
    case "waiting":
      return "pending";
    case "open":
      return "warning";
    default:
      return "neutral";
  }
}

export function ticketCategoryLabel(category: MockTicket["category"]): string {
  return category.charAt(0).toUpperCase() + category.slice(1);
}

export function safetyStatusLabel(status: MockSafetyCase["status"]): string {
  switch (status) {
    case "submitted":
      return "Submitted";
    case "in_progress":
      return "In review";
    case "resolved":
      return "Resolved";
    default:
      return String(status).replace(/_/g, " ");
  }
}

export function safetyStatusChip(status: MockSafetyCase["status"]): StatusChipVariant {
  switch (status) {
    case "resolved":
      return "success";
    case "in_progress":
      return "info";
    case "submitted":
      return "warning";
    default:
      return "neutral";
  }
}

export function safetyTypeLabel(type: MockSafetyCase["type"]): string {
  switch (type) {
    case "harassment":
      return "Harassment";
    case "unsafe_task_content":
      return "Unsafe task content";
    case "discrimination":
      return "Discrimination";
    case "other":
      return "Other";
    default:
      return String(type).replace(/_/g, " ");
  }
}

export function grievanceStatusLabel(status: MockGrievance["status"]): string {
  switch (status) {
    case "submitted":
      return "Submitted";
    case "in_progress":
      return "In review";
    case "resolved":
      return "Resolved";
    default:
      return String(status).replace(/_/g, " ");
  }
}

export function grievanceStatusChip(status: MockGrievance["status"]): StatusChipVariant {
  switch (status) {
    case "resolved":
      return "success";
    case "in_progress":
      return "info";
    case "submitted":
      return "warning";
    default:
      return "neutral";
  }
}

export function grievanceTypeLabel(type: MockGrievanceType): string {
  switch (type) {
    case "unfair_rejection":
      return "Unfair rejection";
    case "payment_dispute":
      return "Payment dispute";
    case "process_issue":
      return "Process / fairness issue";
    case "other":
      return "Other";
    default:
      return String(type).replace(/_/g, " ");
  }
}

export function faqEntryHaystack(group: FaqGroup, q: string, a: string): string {
  return [group.title, group.id, q, a].join(" ").toLowerCase();
}

export interface FlatFaqEntry {
  groupId: string;
  groupTitle: string;
  q: string;
  a: string;
}

export function flattenFaqs(faqs: FaqGroup[]): FlatFaqEntry[] {
  return faqs.flatMap((group) =>
    group.entries.map((entry) => ({
      groupId: group.id,
      groupTitle: group.title,
      q: entry.q,
      a: entry.a,
    })),
  );
}
