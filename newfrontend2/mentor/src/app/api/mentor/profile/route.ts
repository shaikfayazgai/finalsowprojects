import { NextRequest, NextResponse } from "next/server";
import { requireRequest } from "@/lib/api/request-context";
import { setProfileOverrides } from "@/lib/mentor/runtime-store";
import { callMentorBackend } from "@/lib/api/mentor-backend";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest) {
  const ctx = await requireRequest({ allowedRoles: ["mentor"] });
  if (ctx instanceof NextResponse) return ctx;

  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ message: "Invalid body." }, { status: 400 });
  }

  const overrides = {
    bio: typeof body.bio === "string" ? body.bio : undefined,
    mentorshipIntro: typeof body.mentorshipIntro === "string" ? body.mentorshipIntro : undefined,
    languages: Array.isArray(body.languages)
      ? body.languages.filter((l): l is string => typeof l === "string")
      : undefined,
    timezone: typeof body.timezone === "string" ? body.timezone : undefined,
  };

  // In-memory override (per-session fallback) + durable backend persistence.
  setProfileOverrides(ctx.userId, overrides);
  const token = (ctx.session.user as { accessToken?: string }).accessToken;

  // mentor_profiles columns (bio/languages/timezone) → PATCH /profile.
  const profileFields: Record<string, unknown> = {};
  if (overrides.bio !== undefined) profileFields.bio = overrides.bio;
  if (overrides.languages !== undefined) profileFields.languages = overrides.languages;
  if (overrides.timezone !== undefined) profileFields.timezone = overrides.timezone;
  if (Object.keys(profileFields).length > 0) {
    await callMentorBackend(token, "/api/mentor/profile", { method: "PATCH", body: profileFields });
  }

  // mentorshipIntro isn't a profile column — persist it in the settings JSONB.
  if (overrides.mentorshipIntro !== undefined) {
    await callMentorBackend(token, "/api/mentor/settings", {
      method: "PATCH",
      body: { settings: { mentorshipIntro: overrides.mentorshipIntro } },
    });
  }

  return NextResponse.json({ success: true });
}
