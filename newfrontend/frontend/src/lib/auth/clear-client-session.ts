/**
 * Wipe all client-held state on logout / session-expiry so a signed-out (or
 * "guest") browser can never show the previous user's cached data.
 *
 * Clears:
 *   - localStorage  (zustand-persisted stores, glimmora.mock.* demo overlays)
 *   - sessionStorage
 *   - client-readable cookies (NextAuth's session cookie is httpOnly and is
 *     cleared by signOut() server-side; this mops up any non-httpOnly cookies)
 *
 * Safe to call repeatedly and on the server (no-ops when window is absent).
 */
export function clearClientSession(): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.clear();
  } catch {
    /* storage may be unavailable (private mode) — ignore */
  }

  try {
    window.sessionStorage.clear();
  } catch {
    /* ignore */
  }

  // Expire every client-readable cookie for this path. httpOnly cookies
  // (the NextAuth session) are untouched here — signOut() clears those.
  try {
    for (const cookie of document.cookie.split(";")) {
      const name = cookie.split("=")[0]?.trim();
      if (!name) continue;
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
    }
  } catch {
    /* ignore */
  }
}
