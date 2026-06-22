/**
 * Mentor mentorship-sessions client (UI2d).
 */

import type {
  NoteDetail,
  NoteVisibility,
  SessionDetail,
  SessionStatus,
} from "@/lib/mentorship/types";
import type { SessionDetailEnriched } from "@/lib/mentorship/enrichment";

export class MentorshipApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
  ) {
    super(message);
    this.name = "MentorshipApiError";
  }
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    credentials: "same-origin",
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  if (!res.ok) {
    let body: { error?: string; code?: string } = {};
    try {
      body = await res.json();
    } catch {
      /* noop */
    }
    throw new MentorshipApiError(body.error ?? res.statusText, res.status, body.code);
  }
  return (await res.json()) as T;
}

export async function listSessions(params: {
  status?: SessionStatus | SessionStatus[];
  upcomingOnly?: boolean;
} = {}): Promise<{ items: SessionDetailEnriched[]; total?: number }> {
  const q = new URLSearchParams();
  if (params.status) {
    const arr = Array.isArray(params.status) ? params.status : [params.status];
    arr.forEach((s) => q.append("status", s));
  }
  if (params.upcomingOnly) q.set("upcomingOnly", "true");
  return fetchJson(`/api/mentor/sessions?${q.toString()}`);
}

export async function getSession(
  sessionId: string,
): Promise<{ session: SessionDetailEnriched }> {
  return fetchJson(`/api/mentor/sessions/${encodeURIComponent(sessionId)}`);
}

export async function scheduleSessionApi(input: {
  contributorId: string;
  tenantId?: string | null;
  scheduledAt: string;
  durationMinutes?: number;
  agenda?: string;
  meetingLink?: string;
  timezone?: string;
}): Promise<{ session: SessionDetail }> {
  return fetchJson(`/api/mentor/sessions`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function actOnSession(
  sessionId: string,
  action: "held" | "no_show" | "cancel",
  reason?: string,
): Promise<{ session: SessionDetail }> {
  return fetchJson(`/api/mentor/sessions/${sessionId}`, {
    method: "POST",
    body: JSON.stringify({ action, reason }),
  });
}

export async function writeNoteApi(input: {
  sessionId?: string;
  contributorId?: string;
  body: string;
  visibility: NoteVisibility;
  tenantId?: string | null;
}): Promise<{ note: NoteDetail }> {
  return fetchJson(`/api/mentor/notes`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateNoteApi(
  noteId: string,
  input: { body?: string; visibility?: NoteVisibility },
): Promise<{ note: NoteDetail }> {
  return fetchJson(`/api/mentor/notes/${noteId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function deleteNoteApi(noteId: string): Promise<{ deleted: true }> {
  return fetchJson(`/api/mentor/notes/${noteId}`, { method: "DELETE" });
}

export async function listContributorNotes(
  contributorId: string,
): Promise<{ items: NoteDetail[] }> {
  return fetchJson(`/api/mentor/contributors/${contributorId}/notes`);
}
