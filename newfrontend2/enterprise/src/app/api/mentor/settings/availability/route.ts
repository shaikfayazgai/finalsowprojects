import { NextRequest, NextResponse } from "next/server";
import { requireRequest } from "@/lib/api/request-context";
import {
  setAvailabilitySettings,
  type MentorAvailabilitySettings,
} from "@/lib/mentor/runtime-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

  setAvailabilitySettings(ctx.userId, {
    activeDays: body.activeDays,
    from: body.from,
    to: body.to,
    timezone: body.timezone,
    capacity: body.capacity ?? 25,
    oooEnabled: body.oooEnabled ?? false,
    oooFrom: body.oooFrom ?? "",
    oooTo: body.oooTo ?? "",
  });

  return NextResponse.json({ success: true });
}
