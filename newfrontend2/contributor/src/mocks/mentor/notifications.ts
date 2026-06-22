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

export const MOCK_MENTOR_NOTIFICATIONS: MockMentorNotification[] = [
  {
    id: "mn-1",
    kind: "review_assigned",
    title: "New review assigned",
    body: "Date Picker · FocusScope (Round 2) — submitted by Sneha M.",
    at: minutesAgo(14),
    unread: true,
    link: "/mentor/queue/rev-001",
  },
  {
    id: "mn-2",
    kind: "sla_approaching",
    title: "SLA approaching",
    body: "CSV export — 5h left",
    at: minutesAgo(45),
    unread: true,
    link: "/mentor/queue/rev-002",
  },
  {
    id: "mn-3",
    kind: "mentorship_reminder",
    title: "Mentorship session in 30 min",
    body: "Sneha M. at 14:00 · Date Picker follow-up",
    at: minutesAgo(60),
    unread: true,
    link: "/mentor/mentorship/sess-001",
  },
  {
    id: "mn-4",
    kind: "escalation",
    title: "Escalation directed to you",
    body: "Dispute on Auth modal · Kavi S.",
    at: minutesAgo(18),
    unread: false,
    link: "/mentor/escalation/esc-001",
  },
  {
    id: "mn-5",
    kind: "digest",
    title: "Weekly mentor digest",
    body: "18 reviews · 22 min avg · 94% SLA · 78% acceptance",
    at: daysAgo(1),
    unread: false,
    link: "/mentor/history/metrics",
  },
  {
    id: "mn-6",
    kind: "review_assigned",
    title: "New review assigned",
    body: "Auth modal — submitted by Kavi S.",
    at: hoursAgo(8),
    unread: false,
    link: "/mentor/queue/rev-003",
  },
];
