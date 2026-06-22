/**
 * POST /api/reviewers/invites/validate — check invite + email before password step.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { validateReviewerInvite } from "@/lib/reviewer/validate-invite";

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

  try {
    const result = validateReviewerInvite(body);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    return NextResponse.json(
      { message: err instanceof Error ? err.message : "Invite could not be validated." },
      { status: 400 },
    );
  }
}
