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

export const MOCK_NOTIFICATIONS: MockNotification[] = [];

export function unreadNotifCount(): number {
  return MOCK_NOTIFICATIONS.filter((n) => !n.read).length;
}
