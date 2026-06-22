import { NextRequest, NextResponse } from "next/server";
import { requireRequest } from "@/lib/api/request-context";
import { setProfileOverrides } from "@/lib/mentor/runtime-store";

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

  setProfileOverrides(ctx.userId, {
    bio: typeof body.bio === "string" ? body.bio : undefined,
    mentorshipIntro: typeof body.mentorshipIntro === "string" ? body.mentorshipIntro : undefined,
    languages: Array.isArray(body.languages)
      ? body.languages.filter((l): l is string => typeof l === "string")
      : undefined,
    timezone: typeof body.timezone === "string" ? body.timezone : undefined,
  });

  return NextResponse.json({ success: true });
}
