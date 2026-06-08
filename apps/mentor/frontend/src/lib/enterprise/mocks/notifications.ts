/**
 * Notifications mock — 15+ entries covering SOW approvals, payouts,
 * mentor decisions, compliance reminders, system messages.
 *
 * Backend handoff:
 *   GET   /api/notifications?unread=&limit=    → NotificationsListResponse
 *   PATCH /api/notifications/:id/read           → MarkReadResponse
 *   POST  /api/notifications/mark-all-read      → MarkAllReadResponse
 */

import type { NotificationSummary } from "@/lib/notifications/types";
import { applyOverlay, createOverlayStore } from "./overlay";

function iso(daysAgo: number, hours = 9): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - daysAgo);
  d.setUTCHours(hours, 0, 0, 0);
  return d.toISOString();
}

function mk(a: {
  id: string;
  kind: string;
  severity: "info" | "warning" | "success" | "critical";
  title: string;
  body: string;
  daysAgo: number;
  hoursAgo?: number;
  read?: boolean;
  actionUrl?: string;
  actionLabel?: string;
  resourceType?: string;
  resourceId?: string;
}): NotificationSummary {
  const dispatched = iso(a.daysAgo, a.hoursAgo ?? 9);
  return {
    id: a.id,
    kind: a.kind,
    severity: a.severity,
    title: a.title,
    body: a.body,
    actionUrl: a.actionUrl ?? null,
    actionLabel: a.actionLabel ?? null,
    resourceType: a.resourceType ?? null,
    resourceId: a.resourceId ?? null,
    channels: ["in_app", "email"],
    dispatchedAt: dispatched,
    readAt: a.read ? iso(a.daysAgo, (a.hoursAgo ?? 9) + 1) : null,
  };
}

const SEED: NotificationSummary[] = [
  mk({ id: "n-001", kind: "sow.approved", severity: "success", title: "SOW approved",
    body: "Customer onboarding redesign just cleared Final approval.",
    daysAgo: 0, hoursAgo: 8, actionUrl: "/enterprise/sow/sow-acme-2", actionLabel: "Open SOW", resourceType: "sow", resourceId: "sow-acme-2" }),
  mk({ id: "n-002", kind: "review.queued", severity: "info", title: "12 reviews ready to sign off",
    body: "Mentors have cleared 12 submissions awaiting your final acceptance.",
    daysAgo: 0, hoursAgo: 6, actionUrl: "/enterprise/reviewer/queue", actionLabel: "Open queue" }),
  mk({ id: "n-003", kind: "payout.eligible", severity: "info", title: "4 payouts eligible to release",
    body: "Approved contributor work totalling ₹4,800 is ready for batch release.",
    daysAgo: 0, hoursAgo: 4, actionUrl: "/enterprise/billing/payouts", actionLabel: "Release batch", resourceType: "payout" }),
  mk({ id: "n-004", kind: "invoice.due", severity: "warning", title: "INV-3081 is now overdue",
    body: "Helios Q3 invoice of ₹1,80,000 is past its due date. Record payment to clear it.",
    daysAgo: 0, hoursAgo: 2, actionUrl: "/enterprise/billing/invoices/INV-3081", actionLabel: "Open invoice", resourceType: "invoice", resourceId: "INV-3081" }),
  mk({ id: "n-005", kind: "sow.stage_advanced", severity: "info", title: "Helios mobile companion advanced",
    body: "Business approval recorded. Awaiting Commercial review.",
    daysAgo: 1, read: true, actionUrl: "/enterprise/sow/sow-acme-3", resourceType: "sow", resourceId: "sow-acme-3" }),
  mk({ id: "n-006", kind: "compliance.consent_missing", severity: "warning", title: "3 contributors missing consent",
    body: "Some workforce members haven't accepted the latest ToS update.",
    daysAgo: 1, read: true, actionUrl: "/enterprise/compliance/consent", actionLabel: "Review" }),
  mk({ id: "n-007", kind: "project.at_risk", severity: "warning", title: "Reporting V2 flagged at risk",
    body: "Milestone M3 has 2 tasks blocked over 48h. Forecast +2% over budget.",
    daysAgo: 2, read: true, actionUrl: "/enterprise/projects/prj-reporting-v2", resourceType: "project", resourceId: "prj-reporting-v2" }),
  mk({ id: "n-008", kind: "rate_card.activated", severity: "success", title: "Rate card 'Helios Q3 special' activated",
    body: "Effective June 1 → September 30. 14 rows; will price 38 active tasks.",
    daysAgo: 3, read: true, actionUrl: "/enterprise/billing/rate-cards/rc-helios-q3" }),
  mk({ id: "n-009", kind: "payout.batch_sent", severity: "success", title: "Payout batch sent",
    body: "₹52,800 across 3 contributors settled via Razorpay X.",
    daysAgo: 4, read: true, actionUrl: "/enterprise/billing/payouts" }),
  mk({ id: "n-010", kind: "mentor.decision", severity: "info", title: "Mentor accepted 3 submissions",
    body: "Auth modernize: tasks T-3, T-4 ready for your enterprise review.",
    daysAgo: 5, read: true, actionUrl: "/enterprise/reviewer/queue" }),
  mk({ id: "n-011", kind: "audit.export_ready", severity: "info", title: "Audit export ready",
    body: "Your May 2026 audit-log CSV is downloadable for the next 7 days.",
    daysAgo: 6, read: true, actionUrl: "/enterprise/audit/export" }),
  mk({ id: "n-012", kind: "sow.rejected", severity: "critical", title: "Vendor reconciliation SOW rejected",
    body: "Security stage rejected; reason: missing data classification policy.",
    daysAgo: 8, read: true, actionUrl: "/enterprise/sow/sow-acme-6", resourceType: "sow", resourceId: "sow-acme-6" }),
  mk({ id: "n-013", kind: "settings.integration", severity: "warning", title: "Workforce roster update",
    body: "Import or refresh internal employees on the workforce page if assignments look stale.",
    daysAgo: 9, read: true, actionUrl: "/enterprise/workforce" }),
  mk({ id: "n-014", kind: "billing.cycle_close", severity: "info", title: "April billing cycle closed",
    body: "8 invoices issued · ₹14,80,400 invoiced · 1 overdue.",
    daysAgo: 14, read: true, actionUrl: "/enterprise/billing" }),
  mk({ id: "n-015", kind: "security.session", severity: "info", title: "New device signed in",
    body: "macOS · Chrome · Mumbai. If this wasn't you, review your sessions.",
    daysAgo: 18, read: true, actionUrl: "/enterprise/profile", actionLabel: "Review sessions" }),
];

const overlay = createOverlayStore<NotificationSummary>("glimmora.mock.notifications.v1");

function merged(): NotificationSummary[] {
  return applyOverlay<NotificationSummary>(SEED, overlay.read());
}

export function listNotificationsMock(options?: { unreadOnly?: boolean; limit?: number }) {
  let items = merged();
  if (options?.unreadOnly) items = items.filter((n) => !n.readAt);
  items.sort((a, b) => new Date(b.dispatchedAt).getTime() - new Date(a.dispatchedAt).getTime());
  const unreadCount = merged().filter((n) => !n.readAt).length;
  if (options?.limit) items = items.slice(0, options.limit);
  return { notifications: items, unreadCount };
}

export function markNotificationReadMock(id: string) {
  const found = merged().find((n) => n.id === id);
  if (!found) return { updated: false, alreadyRead: false };
  if (found.readAt) return { updated: false, alreadyRead: true };
  overlay.patch(id, { readAt: new Date().toISOString() } as never);
  return { updated: true, alreadyRead: false };
}

export function markAllNotificationsReadMock() {
  const now = new Date().toISOString();
  let count = 0;
  for (const n of merged()) {
    if (!n.readAt) {
      overlay.patch(n.id, { readAt: now } as never);
      count++;
    }
  }
  return { updatedCount: count };
}

export { overlay as notificationOverlay };
