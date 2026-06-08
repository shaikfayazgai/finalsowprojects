/**
 * Session validation + revocation — public surface.
 *
 * Middleware usage:
 *
 *   const result = await validateSession(sessionIdFromJwt);
 *   if (!result.valid) {
 *     // result.reason tells you why: 'expired' | 'tenant_paused' | ...
 *     return redirectToLogin();
 *   }
 *   // result.session, result.user, result.tenant are all populated
 *
 * Revocation:
 *
 *   await revokeSession(sessionId, "user_logout");
 *   await revokeAllSessionsForUser(userId, "password_change", { exceptSessionId });
 *   await revokeAllSessionsForTenant(tenantId, "tenant_paused");
 */

export { validateSession, hashSessionToken } from "./validate";
export {
  revokeSession,
  revokeAllSessionsForUser,
  revokeAllSessionsForTenant,
} from "./revoke";
export type {
  SessionValidationResult,
  SessionValidationSuccess,
  SessionValidationFailure,
  SessionInvalidReason,
  ValidateSessionOptions,
} from "./types";
export type { RevokeReason } from "./revoke";
