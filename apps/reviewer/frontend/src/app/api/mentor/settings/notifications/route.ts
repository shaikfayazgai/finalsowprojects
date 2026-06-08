import { NextRequest, NextResponse } from "next/server";
import { requireRequest } from "@/lib/api/request-context";
import { setNotificationPrefs } from "@/lib/mentor/runtime-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

  setNotificationPrefs(ctx.userId, { rows: body.rows });
  return NextResponse.json({ success: true });
}
