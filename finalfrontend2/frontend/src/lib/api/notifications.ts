/**
 * Notifications client — MOCK MODE.
 * See src/lib/enterprise/mocks/notifications.ts.
 */

import type { NotificationSummary } from "@/lib/notifications";
import {
  listNotificationsMock,
  markAllNotificationsReadMock,
  markNotificationReadMock,
} from "@/lib/enterprise/mocks/notifications";

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

function tick<T>(value: T, ms = 80): Promise<T> {
  return new Promise((r) => setTimeout(() => r(value), ms));
}

export async function fetchMyNotifications(options?: {
  unreadOnly?: boolean;
  limit?: number;
}): Promise<NotificationsListResponse> {
  return tick(listNotificationsMock(options));
}

export async function markNotificationReadApi(notificationId: string): Promise<MarkReadResponse> {
  return tick(markNotificationReadMock(notificationId));
}

export async function markAllNotificationsReadApi(): Promise<MarkAllReadResponse> {
  return tick(markAllNotificationsReadMock());
}
