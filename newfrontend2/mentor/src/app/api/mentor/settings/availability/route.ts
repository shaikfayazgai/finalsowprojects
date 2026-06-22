import { NextRequest, NextResponse } from "next/server";
import { requireRequest } from "@/lib/api/request-context";
import {
  setAvailabilitySettings,
  type MentorAvailabilitySettings,
} from "@/lib/mentor/runtime-store";
import { callMentorBackend } from "@/lib/api/mentor-backend";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const ctx = await requireRequest({ allowedRoles: ["mentor", "admin", "super_admin"] });
  if (ctx instanceof NextResponse) return ctx;
  const token = (ctx.session.user as { accessToken?: string }).accessToken;
  const res = await callMentorBackend<{ settings?: { availability?: MentorAvailabilitySettings } }>(
    token,
    "/api/mentor/settings",
  );
  const availability = res.ok ? res.data?.settings?.availability ?? null : null;
  return NextResponse.json({ availability }, { status: 200 });
}

export async function PATCH(req: NextRequest) {
  const ctx = await requireRequest({ allowedRoles: ["mentor"] });
  if (ctx instanceof NextResponse) return ctx;

  let body: Partial<MentorAvailabilitySettings> = {};
  try {
    body = (await req.json()) as Partial<MentorAvailabilitySettings>;
  } catch {
    return NextResponse.json({ message: "Invalid body." }, { status: 400 });
  }

  if (!body.activeDays || !body.from || !body.to || !body.timezone) {
    return NextResponse.json({ message: "Missing availability fields." }, { status: 400 });
  }

  const availability = {
    activeDays: body.activeDays,
    from: body.from,
    to: body.to,
    timezone: body.timezone,
    capacity: body.capacity ?? 25,
    oooEnabled: body.oooEnabled ?? false,
    oooFrom: body.oooFrom ?? "",
    oooTo: body.oooTo ?? "",
  };

  // Per-session in-memory + durable backend (mentor_profiles.settings JSONB).
  setAvailabilitySettings(ctx.userId, availability);
  const token = (ctx.session.user as { accessToken?: string }).accessToken;
  await callMentorBackend(token, "/api/mentor/settings", {
    method: "PATCH",
    body: { settings: { availability } },
  });

  return NextResponse.json({ success: true });
}
