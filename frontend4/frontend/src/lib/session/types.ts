/**
 * Types for session validation + revocation.
 */

import type { Session, Tenant, User } from "@/generated/prisma/client";

/**
 * Why a session is invalid. Used both in validation results and as the
 * `revokedReason` stored on the Session row.
 *
 * Categories:
 *   - identity   — session itself doesn't exist or doesn't match
 *   - lifecycle  — expired or idle-timed-out
 *   - admin      — explicit revocation by self or admin
 *   - cascade    — revoked because of a parent state change (tenant
 *                  pause, user suspension, password change)
 */
export type SessionInvalidReason =
  | "not_found" //          identity: no row in Session table
  | "token_mismatch" //      identity: provided token hash doesn't match
  | "expired" //             lifecycle: now > expiresAt
  | "idle_timeout" //        lifecycle: lastActiveAt + idle window passed
  | "user_logout" //         admin: self-initiated logout
  | "admin_revoke" //        admin: force-revoked by an admin
  | "password_change" //     cascade: password rotation invalidated sessions
  | "user_suspended" //      cascade: user suspended by T&S / admin
  | "tenant_paused" //       cascade: tenant paused
  | "tenant_closed" //       cascade: tenant terminated
  | "device_untrusted"; //   cascade: trusted device revoked

export interface SessionValidationSuccess {
  valid: true;
  session: Session;
  user: User;
  tenant: Tenant | null;
}

export interface SessionValidationFailure {
  valid: false;
  reason: SessionInvalidReason;
  /** When the session was found but invalid — useful for audit/UX. */
  session?: Session;
}

export type SessionValidationResult =
  | SessionValidationSuccess
  | SessionValidationFailure;

export interface ValidateSessionOptions {
  /**
   * If provided, the resolver hashes the candidate raw token and
   * compares it with Session.tokenHash. Use this for paths where the
   * JWT layer is bypassed (server-to-server, debug endpoints) and you
   * want belt-and-suspenders token verification.
   *
   * In normal NextAuth-mediated requests, the JWT signature is the
   * authority; pass only `sessionId`.
   */
  expectedRawToken?: string;

  /**
   * Update Session.lastActiveAt to now on successful validation. Drives
   * idle-timeout enforcement (Phase 2). Default: true.
   *
   * Set to false for background read-only checks where you don't want
   * to amplify writes (cron jobs, admin inspection UIs).
   */
  updateLastActive?: boolean;
}
