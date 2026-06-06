/**
 * validateSession() — the canonical durable-session check.
 *
 * NextAuth handles JWT signature verification at the cookie layer.
 * Middleware extracts the session id from the JWT claims, then calls
 * this to verify the durable state in Postgres:
 *
 *   - Session row exists
 *   - Not revoked
 *   - Not expired
 *   - User still exists
 *   - Tenant (if any) still active
 *
 * Optional token hash check provides belt-and-suspenders binding when
 * a raw token is available (e.g., server-to-server calls that don't
 * use cookies).
 */

import crypto from "node:crypto";
import { prisma } from "@/lib/db";
import type {
  SessionValidationResult,
  ValidateSessionOptions,
} from "./types";

/**
 * Hash a raw session token for comparison with Session.tokenHash.
 * Uses SHA-256 (no salt — Session.tokenHash is unique per token by
 * design, not a password digest).
 */
export function hashSessionToken(rawToken: string): string {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

export async function validateSession(
  sessionId: string,
  options: ValidateSessionOptions = {},
): Promise<SessionValidationResult> {
  const { expectedRawToken, updateLastActive = true } = options;

  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: {
      user: true,
      tenant: true,
    },
  });

  if (!session) {
    return { valid: false, reason: "not_found" };
  }

  // Token hash check (belt-and-suspenders when raw token is available)
  if (expectedRawToken) {
    const candidateHash = hashSessionToken(expectedRawToken);
    const stored = Buffer.from(session.tokenHash, "hex");
    const candidate = Buffer.from(candidateHash, "hex");
    if (
      stored.length !== candidate.length ||
      !crypto.timingSafeEqual(stored, candidate)
    ) {
      return { valid: false, reason: "token_mismatch", session };
    }
  }

  // Revocation check
  if (session.revokedAt) {
    const reason = (session.revokedReason as SessionValidationResult extends {
      valid: false;
    }
      ? SessionValidationResult["reason"]
      : never) ?? "admin_revoke";
    return { valid: false, reason, session };
  }

  // Expiry check
  if (session.expiresAt.getTime() <= Date.now()) {
    return { valid: false, reason: "expired", session };
  }

  // User existence check — User has no soft-delete column yet (added in
  // a future migration); we'll add `user_suspended` enforcement when
  // User.suspendedAt is introduced.
  if (!session.user) {
    return { valid: false, reason: "not_found", session };
  }

  // Tenant cascade checks (only when session is tenant-scoped)
  if (session.tenant) {
    if (session.tenant.status === "paused") {
      return { valid: false, reason: "tenant_paused", session };
    }
    if (session.tenant.status === "closed") {
      return { valid: false, reason: "tenant_closed", session };
    }
    if (session.tenant.deletedAt) {
      return { valid: false, reason: "tenant_closed", session };
    }
  }

  // Heartbeat: bump lastActiveAt unless suppressed
  if (updateLastActive) {
    await prisma.session.update({
      where: { id: session.id },
      data: { lastActiveAt: new Date() },
    });
  }

  return {
    valid: true,
    session,
    user: session.user,
    tenant: session.tenant ?? null,
  };
}
