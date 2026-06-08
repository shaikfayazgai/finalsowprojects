/**
 * Shared platform admin-token cache for server-side API proxies.
 *
 * PERF: previously every proxy route had its OWN module-level cache, so a single
 * page that fans out to 4+ superadmin proxies triggered 4+ separate backend
 * logins — and each bcrypt login costs ~2.3s. This module gives ALL proxies one
 * shared, process-wide cache + a single in-flight promise, so concurrent callers
 * share one login instead of each doing their own.
 */

const GLIMMORA_API =
  process.env.GLIMMORA_API_URL || process.env.NEXT_PUBLIC_GLIMMORA_API_URL;
const ADMIN_EMAIL = process.env.GLIMMORA_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.GLIMMORA_ADMIN_PASSWORD;

let cached: { token: string; expiresAt: number } | null = null;
let inFlight: Promise<string | null> | null = null;

async function login(): Promise<string | null> {
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD || !GLIMMORA_API) return null;
  try {
    const res = await fetch(`${GLIMMORA_API}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
    });
    const data = await res.json().catch(() => ({}));
    if (typeof data.access_token === "string") {
      cached = {
        token: data.access_token,
        expiresAt: Math.floor(Date.now() / 1000) + (data.expires_in || 3600),
      };
      return cached.token;
    }
  } catch {
    // ignore
  }
  return null;
}

/** Return a valid admin access token, reusing the cached one when fresh. */
export async function getAdminToken(): Promise<string | null> {
  if (cached && Date.now() / 1000 < cached.expiresAt - 60) return cached.token;
  // Coalesce concurrent callers onto a single login.
  if (!inFlight) {
    inFlight = login().finally(() => {
      inFlight = null;
    });
  }
  return inFlight;
}

/** Force a fresh token on the next call (e.g. after a 401/403 from the backend). */
export function invalidateAdminToken(): void {
  cached = null;
}
