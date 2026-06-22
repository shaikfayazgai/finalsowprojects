/**
 * dispatchNotification() — the one entry point code uses to notify users.
 *
 *   1. Resolve severity + channels (preferences + critical-floor)
 *   2. INSERT Notification row (in_app delivery is immediate)
 *   3. Fire email if "email" channel selected (Phase 1: log-only stub
 *      until SendGrid integration lands; Notification row is still
 *      persisted so the in-app view works)
 *   4. Fire SMS if "sms" channel selected (Phase 1: log-only stub
 *      until Twilio/MSG91 integration)
 *   5. Emit `notification.dispatch` audit event
 *
 * This service runs in the same request transaction as the action it
 * notifies about (use the optional `tx` for atomicity). If dispatch
 * fails, the calling action should also fail — per doc 05 §6.6 we
 * promise at-least-once delivery for the in-app channel.
 */

import { prisma } from "@/lib/db";
import { auditEmit, SYSTEM_ACTOR, type AuditActor } from "@/lib/audit";
import type { Prisma } from "@/generated/prisma/client";
import {
  type NotificationDispatchInput,
  type NotificationChannel,
} from "./types";
import { resolveChannels, resolveSeverity } from "./preferences";

export interface DispatchOptions {
  /** Optional transaction client for atomic dispatch+mutation. */
  tx?: Prisma.TransactionClient;
  /**
   * Actor on the audit event. Defaults to SYSTEM_ACTOR because most
   * notifications fire as side-effects of state changes, not as direct
   * user actions.
   */
  actor?: AuditActor;
}

export interface DispatchResult {
  notificationId: string;
  channels: NotificationChannel[];
  dispatchedAt: Date;
}

export async function dispatchNotification(
  input: NotificationDispatchInput,
  options: DispatchOptions = {},
): Promise<DispatchResult> {
  const severity = resolveSeverity(input.kind, input.severity);
  const channels = await resolveChannels({
    userId: input.recipientUserId,
    kind: input.kind,
    severity,
    override: input.channels,
  });

  const now = new Date();
  const inAppActive = channels.includes("in_app");
  const emailActive = channels.includes("email");
  const smsActive = channels.includes("sms");

  // Build row data
  const data = {
    recipientUserId: input.recipientUserId,
    tenantId: input.tenantId ?? null,
    kind: input.kind,
    severity,
    title: input.title,
    body: input.body,
    actionUrl: input.actionUrl ?? null,
    actionLabel: input.actionLabel ?? null,
    resourceType: input.resourceType ?? null,
    resourceId: input.resourceId ?? null,
    channels,
    dispatchedAt: now,
    deliveredInAppAt: inAppActive ? now : null,
  };

  const db = options.tx ?? prisma;
  const row = await db.notification.create({
    data,
    select: { id: true, dispatchedAt: true },
  });

  // Email channel — Phase 1 stub. Logs to console; real send via
  // SendGrid lands when SOW intake / contributor onboarding need it.
  if (emailActive) {
    // eslint-disable-next-line no-console
    console.log(
      `[notify.email] ${input.kind} → user ${input.recipientUserId} :: ${input.title}`,
    );
    // When real send is wired, update deliveredEmailAt on success.
  }

  // SMS channel — Phase 1 stub. Critical-only per locked decision #9.
  if (smsActive) {
    // eslint-disable-next-line no-console
    console.log(
      `[notify.sms] ${input.kind} → user ${input.recipientUserId} :: ${input.title}`,
    );
  }

  // Audit emit. tenantId may be null (cross-tenant or system events).
  await auditEmit(
    {
      tenantId: input.tenantId ?? null,
      actor: options.actor ?? SYSTEM_ACTOR,
      action: "notification.dispatch",
      resource: { type: "notification", id: row.id },
      payload: {
        kind: input.kind,
        severity,
        channels,
        recipientUserId: input.recipientUserId,
      },
      severity: severity === "critical" ? "warning" : "info",
    },
    { tx: options.tx },
  );

  return {
    notificationId: row.id,
    channels,
    dispatchedAt: row.dispatchedAt,
  };
}

/**
 * Mark a notification as read for the recipient. Returns true if the
 * row was updated, false if not found or not owned by the user (don't
 * leak existence of other users' notifications).
 *
 * Idempotent: re-marking a read notification is a no-op.
 */
export async function markNotificationRead(
  notificationId: string,
  recipientUserId: string,
): Promise<{ updated: boolean; alreadyRead: boolean }> {
  const row = await prisma.notification.findUnique({
    where: { id: notificationId },
    select: { id: true, recipientUserId: true, readAt: true },
  });
  if (!row || row.recipientUserId !== recipientUserId) {
    return { updated: false, alreadyRead: false };
  }
  if (row.readAt) {
    return { updated: false, alreadyRead: true };
  }
  await prisma.notification.update({
    where: { id: notificationId },
    data: { readAt: new Date() },
  });
  return { updated: true, alreadyRead: false };
}

/**
 * Mark all unread notifications as read for a user. Returns the count
 * of rows updated.
 */
export async function markAllNotificationsRead(
  recipientUserId: string,
): Promise<{ updatedCount: number }> {
  const result = await prisma.notification.updateMany({
    where: { recipientUserId, readAt: null },
    data: { readAt: new Date() },
  });
  return { updatedCount: result.count };
}
