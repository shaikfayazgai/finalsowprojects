/**
 * Wipe all client-side session state on logout / session-expiry:
 * localStorage, sessionStorage, non-httpOnly cookies, and the Cache Storage.
 * (The NextAuth session cookie is httpOnly — signOut() clears that server-side.)
 * Best-effort and synchronous-safe; never throws.
 */
export function clearClientSession(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.clear();
  } catch { /* ignore */ }
  try {
    window.sessionStorage.clear();
  } catch { /* ignore */ }
  // Expire all readable (non-httpOnly) cookies for this origin.
  try {
    const paths = ["/", window.location.pathname];
    for (const c of document.cookie.split(";")) {
      const name = c.split("=")[0].trim();
      if (!name) continue;
      for (const p of paths) {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${p}`;
        document.cookie = `${name}=; max-age=0; path=${p}`;
      }
    }
  } catch { /* ignore */ }
  // Clear Cache Storage (PWA/route caches), fire-and-forget.
  try {
    if (window.caches?.keys) {
      window.caches.keys().then((keys) => keys.forEach((k) => window.caches.delete(k))).catch(() => {});
    }
  } catch { /* ignore */ }
}
