/**
 *   GET  /api/mentor/sessions    → list mentor's sessions (filters via query)
 *   POST /api/mentor/sessions    → schedule a new session
 *
 * Backed by the mentor FastAPI service (`/api/mentor/sessions`, table
 * `mentor_sessions`). The standalone mentor deployment has no Prisma DB, so this
 * proxies to the backend with the signed-in mentor's token and adapts the
 * snake_case rows to the camelCase shape the UI expects.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireRequest } from "@/lib/api/request-context";
import { callMentorBackend } from "@/lib/api/mentor-backend";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const createBody = z.object({
  contributorId: z.string().min(1),
  tenantId: z.string().min(1).nullish(),
  scheduledAt: z.string().datetime(),
  durationMinutes: z.number().int().min(1).max(480).optional(),
  agenda: z.string().max(5000).optional(),
  meetingLink: z.string().max(2000).optional(),
  timezone: z.string().max(100).optional(),
});

type BackendSession = {
  id: string;
  mentor_id: string;
  contributor_id: string;
  tenant_id: string | null;
  scheduled_at: string;
  duration_minutes: number;
  agenda: string | null;
  meeting_link: string | null;
  timezone: string | null;
  status: string;
  cancel_reason: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
};

/**
 * Adapt a backend session row to the enriched camelCase shape the mentorship UI
 * renders. Contributor name/country/focus aren't on `mentor_sessions` (no join
 * in the backend yet) — fall back to the contributor id and agenda so real
 * sessions still display; replace with a backend join when available.
 */
function adaptSession(s: BackendSession) {
  return {
    id: s.id,
    mentorId: s.mentor_id,
    contributorId: s.contributor_id,
    tenantId: s.tenant_id,
    scheduledAt: s.scheduled_at,
    durationMinutes: s.duration_minutes,
    durationMin: s.duration_minutes,
    agenda: s.agenda,
    meetingLink: s.meeting_link,
    externalLink: s.meeting_link,
    timezone: s.timezone,
    status: s.status,
    cancellationReason: s.cancel_reason,
    createdAt: s.created_at,
    updatedAt: s.updated_at,
    // Best-effort enrichment fallbacks (no contributor join on the backend yet).
    contributorName: s.contributor_id,
    contributorTitle: null,
    contributorCountry: null,
    focus: s.agenda ?? "Mentorship session",
  };
}

export async function GET(req: NextRequest) {
  const ctx = await requireRequest({
    allowedRoles: ["mentor", "admin", "super_admin"],
  });
  if (ctx instanceof NextResponse) return ctx;

  const token = (ctx.session.user as { accessToken?: string }).accessToken;
  const url = new URL(req.url);
  const params = new URLSearchParams();
  for (const s of url.searchParams.getAll("status")) params.append("status", s);
  if (url.searchParams.get("upcomingOnly") === "true") params.set("upcomingOnly", "true");
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit") ?? "50"), 1), 100);
  params.set("limit", String(limit));

  const res = await callMentorBackend<{ items?: BackendSession[] }>(
    token,
    `/api/mentor/sessions?${params.toString()}`,
  );
  if (!res.ok) {
    // Backend unreachable → empty list (page shows empty state, never crashes).
    return NextResponse.json({ items: [], total: 0 }, { status: 200 });
  }
  const items = (res.data?.items ?? []).map(adaptSession);
  return NextResponse.json({ items, total: items.length }, { status: 200 });
}

export async function POST(req: NextRequest) {
  const ctx = await requireRequest({
    allowedRoles: ["mentor", "admin", "super_admin"],
  });
  if (ctx instanceof NextResponse) return ctx;

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const parsed = createBody.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const token = (ctx.session.user as { accessToken?: string }).accessToken;
  const res = await callMentorBackend<{ session?: BackendSession }>(token, "/api/mentor/sessions", {
    method: "POST",
    body: parsed.data,
  });
  if (!res.ok || !res.data?.session) {
    return NextResponse.json(
      { error: "Could not schedule the session. Please try again." },
      { status: res.status === 0 ? 503 : res.status },
    );
  }
  return NextResponse.json({ session: adaptSession(res.data.session) }, { status: 201 });
}
