/**
 * POST /api/auth/register/mentor — self-register with invite code (Option 2).
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { registerMentorFromInvite } from "@/lib/mentor/register-mentor";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  firstName: z.string().trim().min(2).max(80),
  lastName: z.string().trim().min(1).max(80),
  email: z.string().email(),
  password: z
    .string()
    .min(8)
    .max(128)
    .refine((p) => /[A-Z]/.test(p) && /[a-z]/.test(p) && /\d/.test(p), {
      message: "Password must include upper, lower, and a number.",
    }),
  inviteCode: z.string().trim().min(4).max(64),
});

export async function POST(req: NextRequest) {
  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await req.json());
  } catch {
    return NextResponse.json(
      { message: "Check your details and try again." },
      { status: 400 },
    );
  }

  try {
    const result = await registerMentorFromInvite(body);
    return NextResponse.json({ ok: true, userId: result.userId, email: result.email });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Couldn't create your mentor account.";
    const status =
      message.includes("already exists") || message.includes("already been used")
        ? 409
        : message.includes("invalid") || message.includes("expired") || message.includes("invited")
          ? 400
          : 500;
    return NextResponse.json({ message }, { status });
  }
}
