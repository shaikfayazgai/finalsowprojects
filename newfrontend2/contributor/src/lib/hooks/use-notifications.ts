/**
 * TanStack Query hooks for notifications.
 *
 * - useMyNotifications({ unreadOnly, limit }) — list + unread count
 * - useMarkNotificationRead() — mark one
 * - useMarkAllNotificationsRead() — mark every unread
 *
 * Polls every 60s by default for the unread count when mounted in the
 * topbar bell. Page-level lists rely on the global stale-time.
 */

"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  fetchMyNotifications,
  markNotificationReadApi,
  markAllNotificationsReadApi,
  NotificationsApiError,
  type NotificationsListResponse,
} from "@/lib/api/notifications";

export const notificationsKeys = {
  all: ["notifications"] as const,
  list: (unreadOnly: boolean, limit: number) =>
    [...notificationsKeys.all, "list", { unreadOnly, limit }] as const,
};

function shouldRetry(failureCount: number, error: unknown) {
  if (
    error instanceof NotificationsApiError &&
    [401, 404].includes(error.status)
  ) {
    return false;
  }
  return failureCount < 1;
}

export interface UseMyNotificationsOptions {
  unreadOnly?: boolean;
  limit?: number;
  /** Refetch interval in ms. Pass 0/false to disable polling. */
  refetchInterval?: number | false;
  /** Pass false to suspend the query (e.g., when offline). */
  enabled?: boolean;
}

export function useMyNotifications(
  options: UseMyNotificationsOptions = {},
) {
  const {
    unreadOnly = false,
    limit = 25,
    refetchInterval = 60_000,
    enabled = true,
  } = options;

  return useQuery<NotificationsListResponse, NotificationsApiError>({
    queryKey: notificationsKeys.list(unreadOnly, limit),
    queryFn: () => fetchMyNotifications({ unreadOnly, limit }),
    refetchInterval: refetchInterval || false,
    enabled,
    retry: shouldRetry,
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (notificationId: string) =>
      markNotificationReadApi(notificationId),
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: notificationsKeys.all });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => markAllNotificationsReadApi(),
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: notificationsKeys.all });
    },
  });
}
