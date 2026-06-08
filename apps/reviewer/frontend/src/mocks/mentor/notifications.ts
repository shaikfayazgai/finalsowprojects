/**
 * Mentor notifications — spec doc 03 §5.I.
 *
 * Categories mirror the notification-preferences matrix in §5.H.4:
 *   review_assigned, sla_approaching, mentorship_reminder, escalation, digest.
 */

export type MentorNotificationKind =
  | "review_assigned"
  | "sla_approaching"
  | "mentorship_reminder"
  | "escalation"
  | "digest";

export interface MockMentorNotification {
  id: string;
  kind: MentorNotificationKind;
  title: string;
  body: string;
  at: string;
  unread: boolean;
  link: string;
}

const minutesAgo = (m: number) => new Date(Date.now() - m * 60_000).toISOString();
const hoursAgo = (h: number) => new Date(Date.now() - h * 3600_000).toISOString();
const daysAgo = (d: number) => new Date(Date.now() - d * 86_400_000).toISOString();

export const MOCK_MENTOR_NOTIFICATIONS: MockMentorNotification[] = [];
