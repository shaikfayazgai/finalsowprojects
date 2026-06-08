/**
 * POST /api/mentors/invites/validate — check mentor invite + email before password step.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { validateMentorInvite } from "@/lib/mentor/validate-invite";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  inviteCode: z.string().trim().min(4).max(64),
  email: z.string().email(),
});

export async function POST(req: NextRequest) {
  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ message: "Check your invite code and email." }, { status: 400 });
  }

  const result = validateMentorInvite({
    code: body.inviteCode,
    email: body.email,
  });

  if (!result.ok) {
    return NextResponse.json({ message: result.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, orgLabel: result.orgLabel });
}
