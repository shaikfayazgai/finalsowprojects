import { NextRequest, NextResponse } from "next/server";
import { requireRequest } from "@/lib/api/request-context";
import { setNotificationPrefs } from "@/lib/mentor/runtime-store";
import { callMentorBackend } from "@/lib/api/mentor-backend";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type NotifRow = { key: string; prefs: { inApp: boolean; email: boolean; sms: boolean } };

export async function GET() {
  const ctx = await requireRequest({ allowedRoles: ["mentor", "admin", "super_admin"] });
  if (ctx instanceof NextResponse) return ctx;
  const token = (ctx.session.user as { accessToken?: string }).accessToken;
  const res = await callMentorBackend<{ settings?: { notificationPrefs?: { rows?: NotifRow[] } } }>(
    token,
    "/api/mentor/settings",
  );
  const rows = res.ok ? res.data?.settings?.notificationPrefs?.rows ?? null : null;
  return NextResponse.json({ rows }, { status: 200 });
}

export async function PATCH(req: NextRequest) {
  const ctx = await requireRequest({ allowedRoles: ["mentor"] });
  if (ctx instanceof NextResponse) return ctx;

  let body: { rows?: Array<{ key: string; prefs: { inApp: boolean; email: boolean; sms: boolean } }> } = {};
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ message: "Invalid body." }, { status: 400 });
  }

  if (!body.rows?.length) {
    return NextResponse.json({ message: "Missing notification rows." }, { status: 400 });
  }

  // Per-session in-memory + durable backend (mentor_profiles.settings JSONB).
  setNotificationPrefs(ctx.userId, { rows: body.rows });
  const token = (ctx.session.user as { accessToken?: string }).accessToken;
  await callMentorBackend(token, "/api/mentor/settings", {
    method: "PATCH",
    body: { settings: { notificationPrefs: { rows: body.rows } } },
  });

  return NextResponse.json({ success: true });
}
