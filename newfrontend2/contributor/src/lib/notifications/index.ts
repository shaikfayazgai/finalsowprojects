/**
 * Notification service — public surface.
 *
 * Usage from a route handler:
 *
 *   await ctx.withTx(async (tx) => {
 *     await tx.sow.update({ where: { id: sowId }, data: { stage: "approved" } });
 *     await dispatchNotification(
 *       {
 *         recipientUserId: sponsor.id,
 *         tenantId: ctx.tenant.id,
 *         kind: "sow.approved",
 *         title: "Your SOW is approved",
 *         body: "Helios Q3 modernization passed all stages. Decomposition will start.",
 *         actionUrl: `/enterprise/sow/${sowId}`,
 *         actionLabel: "Open SOW",
 *         resourceType: "sow",
 *         resourceId: sowId,
 *       },
 *       { tx, actor: { userId: ctx.userId, portalRole: ctx.role } },
 *     );
 *   });
 */

export {
  dispatchNotification,
  markNotificationRead,
  markAllNotificationsRead,
} from "./dispatch";
export type { DispatchOptions, DispatchResult } from "./dispatch";

export { resolveChannels, resolveSeverity } from "./preferences";

export type {
  NotificationChannel,
  NotificationSeverity,
  NotificationKind,
  NotificationDispatchInput,
  NotificationSummary,
} from "./types";

export { DEFAULT_SEVERITY, DEFAULT_CHANNELS } from "./types";
