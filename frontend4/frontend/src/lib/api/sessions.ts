/**
 * Client for the Postgres-backed sessions API.
 *
 * Endpoints:
 *   GET    /api/sessions            — list user's sessions
 *   DELETE /api/sessions/[id]       — revoke one session
 *
 * Distinct from the legacy `useSessions` in `use-auth.ts` which talks
 * to the Glimmora backend. This client targets our own Phase 1 Session
 * table built in migration M3.
 */

export interface SessionListItem {
  id: string;
  issuedAt: string;
  expiresAt: string;
  lastActiveAt: string;
  mfaVerified: boolean;
  ipAddress: string | null;
  userAgent: string | null;
  revokedAt: string | null;
  revokedReason: string | null;
  isCurrent: boolean;
}

export interface SessionListResponse {
  sessions: SessionListItem[];
}

export interface RevokeSessionResponse {
  revoked: boolean;
  sessionId: string;
  wasAlreadyRevoked: boolean;
  wasCurrentSession: boolean;
}

export class SessionsApiError extends Error {
  constructor(
    public status: number,
    public reason?: string,
  ) {
    super(
      `Sessions API error: ${status}${reason ? ` (${reason})` : ""}`,
    );
    this.name = "SessionsApiError";
  }
}

async function parseError(res: Response): Promise<SessionsApiError> {
  const body = await res.json().catch(() => ({}));
  const reason =
    typeof body?.reason === "string" ? body.reason : undefined;
  return new SessionsApiError(res.status, reason);
}

export async function fetchMySessions(): Promise<SessionListResponse> {
  const res = await fetch("/api/sessions", {
    credentials: "include",
    cache: "no-store",
  });
  if (!res.ok) throw await parseError(res);
  return res.json();
}

export async function revokeMySession(
  sessionId: string,
): Promise<RevokeSessionResponse> {
  const res = await fetch(`/api/sessions/${sessionId}`, {
    method: "DELETE",
    credentials: "include",
    cache: "no-store",
  });
  if (!res.ok) throw await parseError(res);
  return res.json();
}
