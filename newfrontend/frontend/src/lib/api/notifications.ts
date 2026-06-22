/**
 * Notifications client — REAL backend (Postgres `contributor_notifications`,
 * account-scoped so it serves every role's bell). Proxies:
 *   GET   /api/notifications                 → { notifications, unreadCount }
 *   PATCH /api/notifications/:id/read         → { updated, alreadyRead }
 *   POST  /api/notifications/mark-all-read    → { updatedCount }
 */

import type { NotificationSummary } from "@/lib/notifications";

export type { NotificationSummary };

export interface NotificationsListResponse {
  notifications: NotificationSummary[];
  unreadCount: number;
}

export interface MarkReadResponse {
  updated: boolean;
  alreadyRead: boolean;
}

export interface MarkAllReadResponse {
  updatedCount: number;
}

export class NotificationsApiError extends Error {
  constructor(public status: number, public reason?: string) {
    super(`Notifications API error: ${status}${reason ? ` (${reason})` : ""}`);
    this.name = "NotificationsApiError";
  }
}

export async function fetchMyNotifications(options?: {
  unreadOnly?: boolean;
  limit?: number;
}): Promise<NotificationsListResponse> {
  const qs = new URLSearchParams();
  if (options?.limit) qs.set("limit", String(options.limit));
  if (options?.unreadOnly) qs.set("unreadOnly", "true");
  const res = await fetch(`/api/notifications${qs.toString() ? `?${qs.toString()}` : ""}`, {
    cache: "no-store",
    credentials: "same-origin",
  });
  if (!res.ok) throw new NotificationsApiError(res.status);
  const body = (await res.json().catch(() => ({}))) as Partial<NotificationsListResponse>;
  return {
    notifications: Array.isArray(body.notifications) ? body.notifications : [],
    unreadCount: typeof body.unreadCount === "number" ? body.unreadCount : 0,
  };
}

export async function markNotificationReadApi(notificationId: string): Promise<MarkReadResponse> {
  const res = await fetch(`/api/notifications/${encodeURIComponent(notificationId)}/read`, {
    method: "PATCH",
    credentials: "same-origin",
  });
  if (!res.ok) throw new NotificationsApiError(res.status);
  return (await res.json().catch(() => ({ updated: false, alreadyRead: false }))) as MarkReadResponse;
}

export async function markAllNotificationsReadApi(): Promise<MarkAllReadResponse> {
  const res = await fetch(`/api/notifications/mark-all-read`, {
    method: "POST",
    credentials: "same-origin",
  });
  if (!res.ok) throw new NotificationsApiError(res.status);
  return (await res.json().catch(() => ({ updatedCount: 0 }))) as MarkAllReadResponse;
}
