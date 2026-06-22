/**
 * Server-side helper to call the bundled mentor FastAPI backend (:8101) from
 * Next.js API routes, authenticated with the signed-in mentor's backend access
 * token (stored on the NextAuth session as `session.user.accessToken`).
 *
 * Used to wire mentor write/read paths (profile, settings, …) through to real
 * Postgres persistence instead of the in-memory runtime store.
 */

export function mentorBackendBaseUrl(): string {
  return (
    process.env.GLIMMORA_API_BASE_URL ??
    process.env.NEXT_PUBLIC_GLIMMORA_API_URL ??
    process.env.BACKEND_SERVICE_URL ??
    "http://127.0.0.1:8101"
  );
}

export interface MentorBackendResult<T = unknown> {
  ok: boolean;
  status: number;
  data: T | null;
}

/**
 * Call a mentor backend endpoint with the user's bearer token. Never throws —
 * returns { ok:false } on any failure so callers can fall back gracefully.
 */
export async function callMentorBackend<T = unknown>(
  token: string | undefined,
  path: string,
  init?: { method?: string; body?: unknown; timeoutMs?: number },
): Promise<MentorBackendResult<T>> {
  if (!token) return { ok: false, status: 0, data: null };
  try {
    const res = await fetch(`${mentorBackendBaseUrl()}${path}`, {
      method: init?.method ?? "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        ...(init?.body !== undefined ? { "Content-Type": "application/json" } : {}),
      },
      body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
      cache: "no-store",
      signal: AbortSignal.timeout(init?.timeoutMs ?? 8000),
    });
    const json = (await res.json().catch(() => null)) as unknown;
    // Backend wraps payloads as { success, message, data } — unwrap when present.
    const data =
      json && typeof json === "object" && "data" in (json as Record<string, unknown>)
        ? ((json as { data: T }).data ?? null)
        : ((json as T) ?? null);
    return { ok: res.ok, status: res.status, data };
  } catch {
    return { ok: false, status: 0, data: null };
  }
}
