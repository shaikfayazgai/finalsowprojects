/**
 *   GET  /api/mentor/sessions/:sessionId  → session detail
 *   POST /api/mentor/sessions/:sessionId  → action: held | no_show | cancel | reschedule
 *
 * Proxies the mentor FastAPI service (`/api/mentor/sessions/:id`), adapting the
 * snake_case row to the camelCase shape the UI expects.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireRequest } from "@/lib/api/request-context";
import { callMentorBackend } from "@/lib/api/mentor-backend";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const body = z.object({
  action: z.enum(["held", "no_show", "cancel", "reschedule"]),
  reason: z.string().max(2000).optional(),
  scheduledAt: z.string().datetime().optional(),
  durationMinutes: z.number().int().min(1).max(480).optional(),
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
  created_at: string;
  updated_at: string;
};

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
    contributorName: s.contributor_id,
    contributorTitle: null,
    contributorCountry: null,
    focus: s.agenda ?? "Mentorship session",
  };
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const { sessionId } = await params;
  if (!sessionId) return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });

  const ctx = await requireRequest({ allowedRoles: ["mentor", "admin", "super_admin"] });
  if (ctx instanceof NextResponse) return ctx;

  const token = (ctx.session.user as { accessToken?: string }).accessToken;
  const res = await callMentorBackend<{ session?: BackendSession }>(
    token,
    `/api/mentor/sessions/${encodeURIComponent(sessionId)}`,
  );
  if (res.status === 404) return NextResponse.json({ error: "Session not found" }, { status: 404 });
  if (!res.ok || !res.data?.session) {
    return NextResponse.json({ error: "Session not found" }, { status: res.status || 404 });
  }
  return NextResponse.json({ session: adaptSession(res.data.session) }, { status: 200 });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const { sessionId } = await params;
  if (!sessionId) return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });

  const ctx = await requireRequest({ allowedRoles: ["mentor", "admin", "super_admin"] });
  if (ctx instanceof NextResponse) return ctx;

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const parsed = body.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const token = (ctx.session.user as { accessToken?: string }).accessToken;
  const res = await callMentorBackend<{ session?: BackendSession }>(
    token,
    `/api/mentor/sessions/${encodeURIComponent(sessionId)}`,
    { method: "POST", body: parsed.data },
  );
  if (!res.ok || !res.data?.session) {
    return NextResponse.json(
      { error: "Could not update the session." },
      { status: res.status === 0 ? 503 : res.status },
    );
  }
  return NextResponse.json({ session: adaptSession(res.data.session) }, { status: 200 });
}
