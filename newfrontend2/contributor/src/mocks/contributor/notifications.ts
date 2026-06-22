/**
 * Mock notifications — spec §5.P.1.
 *
 * Kinds: revision_requested · reviewer_replied · task_accepted ·
 * payout_sent · safety_update.
 */

export type NotificationKind =
  | "revision_requested"
  | "reviewer_replied"
  | "task_accepted"
  | "task_assigned"
  | "payout_sent"
  | "safety_update";

export interface MockNotification {
  id: string;
  kind: NotificationKind;
  title: string;
  detail: string;
  href: string;
  receivedAt: string;
  read: boolean;
  severity: "info" | "warning" | "success";
}

const hoursAgo = (h: number) => new Date(Date.now() - h * 3_600_000).toISOString();

export const MOCK_NOTIFICATIONS: MockNotification[] = [
  {
    id: "n-001",
    kind: "revision_requested",
    title: "Revision requested · Auth modal UX polish",
    detail: "Priya Iyer requested 2 corrections. Submit-button focus ring needs the Safari fix.",
    href: "/contributor/tasks/revisions/task-006",
    receivedAt: hoursAgo(1),
    read: false,
    severity: "warning",
  },
  {
    id: "n-002",
    kind: "reviewer_replied",
    title: "Reviewer replied · CSV export endpoint",
    detail: "Karthik Iyer answered your clarification.",
    href: "/contributor/tasks/task-003",
    receivedAt: hoursAgo(5),
    read: false,
    severity: "info",
  },
  {
    id: "n-003",
    kind: "task_assigned",
    title: "New task · Date Picker · FocusScope sketch",
    detail: "₹1,500/h · due in 72h",
    href: "/contributor/tasks",
    receivedAt: hoursAgo(3),
    read: false,
    severity: "info",
  },
  {
    id: "n-004",
    kind: "task_accepted",
    title: "Accepted · Decomposition unit tests",
    detail: "Karthik Iyer accepted your delivery. Payout becomes eligible.",
    href: "/contributor/tasks/completed/task-008",
    receivedAt: hoursAgo(14 * 24),
    read: true,
    severity: "success",
  },
  {
    id: "n-005",
    kind: "payout_sent",
    title: "Payout sent · ₹3,600",
    detail: "Sent to HDFC Bank ****1234. Reference TRX-9421.",
    href: "/contributor/earnings/history",
    receivedAt: hoursAgo(20 * 24),
    read: true,
    severity: "success",
  },
  {
    id: "n-006",
    kind: "safety_update",
    title: "Safety case update · GR-1042",
    detail: "Governance has acknowledged your report. Initial response within 24h.",
    href: "/contributor/support",
    receivedAt: hoursAgo(2),
    read: false,
    severity: "warning",
  },
];

export function unreadNotifCount(): number {
  return MOCK_NOTIFICATIONS.filter((n) => !n.read).length;
}
