/**
 *   POST /api/mentor/notes    → write a coaching note
 *   Body: { sessionId? | contributorId, body, visibility, tenantId? }
 *
 * Proxies the mentor FastAPI service (`/api/mentor/notes`, table `mentor_notes`).
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireRequest } from "@/lib/api/request-context";
import { callMentorBackend } from "@/lib/api/mentor-backend";
import { adaptNote, type BackendNote } from "./adapt";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const body = z.object({
  sessionId: z.string().min(1).optional(),
  contributorId: z.string().min(1).optional(),
  body: z.string().min(1).max(10_000),
  visibility: z.enum(["private", "shared", "public"]),
  tenantId: z.string().min(1).nullish(),
});

export async function POST(req: NextRequest) {
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
  const res = await callMentorBackend<{ note?: BackendNote }>(token, "/api/mentor/notes", {
    method: "POST",
    body: {
      sessionId: parsed.data.sessionId ?? null,
      contributorId: parsed.data.contributorId ?? null,
      body: parsed.data.body,
      visibility: parsed.data.visibility,
      tenantId: parsed.data.tenantId ?? null,
    },
  });
  if (!res.ok || !res.data?.note) {
    return NextResponse.json(
      { error: "Could not save the note." },
      { status: res.status === 0 ? 503 : res.status },
    );
  }
  return NextResponse.json({ note: adaptNote(res.data.note) }, { status: 201 });
}
