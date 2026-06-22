/**
 * Session revocation helpers.
 *
 * Three flavors:
 *   - revokeSession(id, ...) — one session (logout, admin force-revoke)
 *   - revokeAllSessionsForUser(userId, ...) — password change, user
 *     suspension, account deletion
 *   - revokeAllSessionsForTenant(tenantId, ...) — tenant pause / close
 *
 * Every revocation emits an audit event so the action is traceable.
 *
 * Postgres-side: a later migration will set up a companion Redis
 * blacklist that caches recently-revoked session ids with TTL equal
 * to remaining session lifetime, so middleware can do an O(1) check
 * without hitting Postgres on every request. For Phase 1 the durable
 * `revokedAt` column is the source of truth; Redis is an optimization.
 */

import { prisma } from "@/lib/db";
import { auditEmit, SYSTEM_ACTOR } from "@/lib/audit";
import type { AuditActor } from "@/lib/audit";
import { dispatchNotification } from "@/lib/notifications";
import type { SessionInvalidReason } from "./types";

/**
 * Revokable reasons — narrows from SessionInvalidReason to only those
 * that make sense as an active revocation cause (excludes lookup
 * failures like "not_found").
 */
export type RevokeReason = Extract<
  SessionInvalidReason,
  | "user_logout"
  | "admin_revoke"
  | "password_change"
  | "user_suspended"
  | "tenant_paused"
  | "tenant_closed"
  | "device_untrusted"
>;

interface RevokeOptions {
  /** Actor performing the revocation; defaults to SYSTEM_ACTOR. */
  actor?: AuditActor;
  /** User id of who revoked, for the Session.revokedBy column. */
  revokedBy?: string;
}

/**
 * Revoke a single session. Idempotent — calling twice on an already-
 * revoked session is a no-op (no audit, no overwrite).
 */
export async function revokeSession(
  sessionId: string,
  reason: RevokeReason,
  options: RevokeOptions = {},
): Promise<{ revoked: boolean }> {
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    select: {
      id: true,
      userId: true,
      tenantId: true,
      revokedAt: true,
    },
  });
  if (!session || session.revokedAt) {
    return { revoked: false };
  }

  await prisma.session.update({
    where: { id: sessionId },
    data: {
      revokedAt: new Date(),
      revokedReason: reason,
      revokedBy: options.revokedBy ?? null,
    },
  });

  await auditEmit({
    tenantId: session.tenantId,
    actor: options.actor ?? SYSTEM_ACTOR,
    action: "auth.session.revoke",
    resource: { type: "session", id: session.id },
    payload: { reason, revokedBy: options.revokedBy ?? null },
    severity: "info",
  });

  // Security-awareness notification: when an admin force-revokes
  // someone else's session, the session owner deserves to know.
  // Self-revokes (revokedBy === session.userId) are user-initiated; no
  // notification needed for those — they just clicked the button.
  const adminInitiated =
    options.revokedBy != null && options.revokedBy !== session.userId;
  if (adminInitiated) {
    try {
      await dispatchNotification({
        recipientUserId: session.userId,
        tenantId: session.tenantId,
        kind: "auth.session_revoked",
        severity: "critical",
        title: "A session was signed out by an administrator",
        body: `Reason: ${reason}. If you didn't expect this, review your security settings and contact support.`,
        actionUrl: "/contributor/settings/security",
        actionLabel: "Open security settings",
        resourceType: "session",
        resourceId: session.id,
      });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn(
        "[revokeSession] security notification dispatch failed; continuing",
        err,
      );
    }
  }

  return { revoked: true };
}

/**
 * Bulk-revoke every active session for a user. Used for password
 * change, T&S suspension, account deletion, etc.
 *
 * `exceptSessionId` lets a password-change flow keep the user's
 * current session alive while killing all the others.
 */
export async function revokeAllSessionsForUser(
  userId: string,
  reason: RevokeReason,
  options: RevokeOptions & { exceptSessionId?: string } = {},
): Promise<{ revokedCount: number }> {
  const now = new Date();
  const result = await prisma.session.updateMany({
    where: {
      userId,
      revokedAt: null,
      ...(options.exceptSessionId ? { NOT: { id: options.exceptSessionId } } : {}),
    },
    data: {
      revokedAt: now,
      revokedReason: reason,
      revokedBy: options.revokedBy ?? null,
    },
  });

  if (result.count > 0) {
    await auditEmit({
      tenantId: null,
      actor: options.actor ?? SYSTEM_ACTOR,
      action: "auth.session.revoke.bulk_user",
      resource: { type: "user", id: userId },
      payload: {
        reason,
        revokedCount: result.count,
        exceptSessionId: options.exceptSessionId ?? null,
        revokedBy: options.revokedBy ?? null,
      },
      severity: "warning",
    });

    // Password-change flow specifically: notify the user on the
    // surviving session (exceptSessionId) so they see "we signed out
    // your other devices" on the device they just changed the password
    // on. Other bulk-revoke triggers (user_suspended, admin_revoke)
    // typically kill all sessions, so there's no surviving session to
    // notify on — those users get notified by email out-of-band when
    // the flow is built.
    if (reason === "password_change" && options.exceptSessionId) {
      try {
        await dispatchNotification({
          recipientUserId: userId,
          tenantId: null,
          kind: "auth.password_changed",
          severity: "critical",
          title: "Your password was changed",
          body: `${result.count} other ${result.count === 1 ? "device was" : "devices were"} signed out. If this wasn't you, contact support immediately.`,
          actionUrl: "/contributor/settings/security",
          actionLabel: "Review sessions",
          resourceType: "user",
          resourceId: userId,
        });
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn(
          "[revokeAllSessionsForUser] password-change notification dispatch failed; continuing",
          err,
        );
      }
    }
  }

  return { revokedCount: result.count };
}

/**
 * Bulk-revoke every active session in a tenant. Used when a tenant
 * is paused or closed.
 */
export async function revokeAllSessionsForTenant(
  tenantId: string,
  reason: Extract<RevokeReason, "tenant_paused" | "tenant_closed">,
  options: RevokeOptions = {},
): Promise<{ revokedCount: number }> {
  const now = new Date();
  const result = await prisma.session.updateMany({
    where: {
      tenantId,
      revokedAt: null,
    },
    data: {
      revokedAt: now,
      revokedReason: reason,
      revokedBy: options.revokedBy ?? null,
    },
  });

  if (result.count > 0) {
    await auditEmit({
      tenantId,
      actor: options.actor ?? SYSTEM_ACTOR,
      action: "auth.session.revoke.bulk_tenant",
      resource: { type: "tenant", id: tenantId },
      payload: {
        reason,
        revokedCount: result.count,
        revokedBy: options.revokedBy ?? null,
      },
      severity: "warning",
    });
  }

  return { revokedCount: result.count };
}
