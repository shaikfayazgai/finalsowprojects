/**
 * PATCH /api/mentor/profile — persist the mentor's editable profile fields to
 * the REAL backend (`mentor_profiles` table via `/api/mentor/profile`). The FE
 * sends { bio, mentorshipIntro, languages, timezone }; we remap mentorshipIntro
 * → mentorship_intro (stored in settings JSONB by the backend) and forward the
 * rest. No in-memory store, no mock — edits now survive restarts.
 */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getBackendServiceUrl } from "@/lib/api/backend-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest) {
  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ message: "Invalid body." }, { status: 400 });
  }

  const payload: Record<string, unknown> = {};
  if (typeof body.bio === "string") payload.bio = body.bio;
  if (typeof body.timezone === "string") payload.timezone = body.timezone;
  if (typeof body.country === "string") payload.country = body.country;
  if (typeof body.mentorshipIntro === "string") payload.mentorship_intro = body.mentorshipIntro;
  if (Array.isArray(body.languages)) {
    payload.languages = body.languages.filter((l): l is string => typeof l === "string");
  }

  const session = await auth();
  const token = (session?.user as { accessToken?: string } | undefined)?.accessToken;
  if (!token) return NextResponse.json({ message: "Not authenticated." }, { status: 401 });

  try {
    const res = await fetch(new URL("/api/mentor/profile", getBackendServiceUrl()).toString(), {
      method: "PATCH",
      headers: { "Content-Type": "application/json", authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(15_000),
    });
    const text = await res.text();
    return new NextResponse(text, {
      status: res.status,
      headers: { "Content-Type": res.headers.get("Content-Type") ?? "application/json" },
    });
  } catch {
    return NextResponse.json({ message: "Could not save profile." }, { status: 503 });
  }
}
