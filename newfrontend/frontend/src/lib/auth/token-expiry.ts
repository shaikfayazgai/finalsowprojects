"use client";

/**
 * Client-side auto-logout on a genuine token-expiry / token-unavailable 401.
 *
 * Problem this solves: the NextAuth session carries a backend access token. If
 * that token expires (or is momentarily unavailable) while the user is mid-form,
 * the API proxy answers 401 `AUTH_TOKEN_UNAVAILABLE` and pages used to surface
 * "Session is reconnecting — please retry", leaving the user logged-in-but-broken.
 *
 * Instead we treat that specific signal as "your session is no longer valid" and
 * cleanly sign the user out, landing them on the right portal's login so they can
 * re-authenticate. We are deliberately narrow: ONLY the proxy's own
 * `AUTH_TOKEN_UNAVAILABLE` marker (a 401 with that `error` code) triggers logout.
 * A plain backend 401/403 on some specific resource does NOT — those are handled
 * by the calling page as normal errors.
 */

import { signOut } from "next-auth/react";
import { clearClientState } from "@/lib/auth/session-cleanup";
import { registerTokenErrorHandler } from "@/lib/api/client";

/** Marker the API proxy emits when the session has no usable backend token. */
export const AUTH_TOKEN_UNAVAILABLE = "AUTH_TOKEN_UNAVAILABLE";

/**
 * Map the current path to ITS portal's login so logout lands on the right place.
 * Mirrors the canonical PORTAL_LOGINS table in proxy.ts (kept intentionally tiny
 * here to avoid importing server/edge middleware into client code).
 */
const PORTAL_LOGINS: ReadonlyArray<readonly [string, string]> = [
  ["/enterprise/reviewer", "/reviewer/login"], // reviewer lives under /enterprise
  ["/admin", "/admin/login"],
  ["/enterprise", "/enterprise/login"],
  ["/contributor", "/contributor/login"],
  ["/mentor", "/mentor/login"],
  ["/reviewer", "/reviewer/login"],
];

function loginPathForCurrentLocation(): string {
  const pathname =
    typeof window !== "undefined" ? window.location.pathname : "";
  for (const [prefix, login] of PORTAL_LOGINS) {
    if (pathname === prefix || pathname.startsWith(prefix + "/")) return login;
  }
  // Fall back to the contributor login — that's where the long profile wizard
  // lives — else the generic /auth/login.
  return pathname.startsWith("/contributor")
    ? "/contributor/login"
    : "/auth/login";
}

// Guard so concurrent failing requests don't each fire a signOut().
let signingOut = false;

/**
 * Decide whether a parsed response body / error represents a genuine
 * token-expiry that should auto-logout. True ONLY for the proxy's
 * `AUTH_TOKEN_UNAVAILABLE` marker.
 */
export function isAuthTokenError(body: unknown): boolean {
  if (!body || typeof body !== "object") return false;
  const code = (body as { error?: unknown }).error;
  return code === AUTH_TOKEN_UNAVAILABLE;
}

/**
 * If `body` is a token-expiry signal, wipe client state and sign the user out to
 * the portal's login (`?reason=session_expired`). Returns true when it triggered
 * a logout (caller should stop further handling — a navigation is in flight).
 *
 * Idempotent across concurrent callers via the module-level `signingOut` latch.
 */
export function handleAuthTokenError(body: unknown): boolean {
  if (!isAuthTokenError(body)) return false;
  if (signingOut) return true;
  signingOut = true;

  const dest = `${loginPathForCurrentLocation()}?reason=session_expired`;
  // Fire-and-forget: clear client state, then end the NextAuth session and
  // redirect. signOut performs the navigation via callbackUrl.
  void clearClientState()
    .catch(() => {})
    .finally(() => {
      void signOut({ callbackUrl: dest });
    });
  return true;
}

/**
 * Convenience wrapper for the common "fetch then read JSON" pattern. Reads the
 * response body once, auto-logs-out on a token-expiry 401, and otherwise returns
 * the parsed body to the caller. Pages can use their own fetch + pass the parsed
 * error body to `handleAuthTokenError` instead — both paths are equivalent.
 */
export async function readJsonOrLogout(
  res: Response,
): Promise<{ ok: boolean; status: number; body: unknown; loggedOut: boolean }> {
  const body = await res.json().catch(() => ({}));
  if (res.status === 401 && handleAuthTokenError(body)) {
    return { ok: res.ok, status: res.status, body, loggedOut: true };
  }
  return { ok: res.ok, status: res.status, body, loggedOut: false };
}

// Wire this handler into the shared `client.ts` fetch helpers so every page that
// goes through `fetchInternal` / `apiCall` auto-logs-out on a token-expiry 401.
// Browser-only: this module is "use client" and only loaded in client bundles.
if (typeof window !== "undefined") {
  registerTokenErrorHandler(handleAuthTokenError);
}

