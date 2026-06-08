/**
 * POST /api/mentors/invites — mentor self-register invite (Option 2).
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/auth/require-role";
import { createMentorInvite } from "@/lib/mentor/invite-store";
import { getBaseUrl } from "@/lib/utils/base-url";
import { getInviteRoleSpec } from "@/lib/admin/invite-routes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  email: z.string().email(),
  firstName: z.string().trim().min(1).max(80).optional(),
  lastName: z.string().trim().max(80).optional(),
  name: z.string().trim().min(2).max(160).optional(),
  mentorRoles: z.array(z.string()).min(1).default(["mentor"]),
  poolIds: z.array(z.string()).optional(),
  note: z.string().max(2000).optional(),
});

export async function POST(req: NextRequest) {
  const guard = await requireRole(["admin", "super_admin"]);
  if (guard instanceof NextResponse) return guard;

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
  }

  const inviterName =
    guard.session.user?.name?.trim() || "Glimmora program manager";

  let firstName = body.firstName?.trim();
  let lastName = body.lastName?.trim();
  if (body.name && !firstName) {
    const parts = body.name.trim().split(/\s+/);
    firstName = parts[0];
    lastName = parts.slice(1).join(" ") || undefined;
  }

  let invite;
  try {
    invite = createMentorInvite({
      email: body.email,
      firstName,
      lastName,
      mentorRoles: body.mentorRoles,
      poolIds: body.poolIds ?? [],
      invitedByUserId: guard.userId,
      invitedByName: inviterName,
      invitedByEmail: guard.email,
      note: body.note,
    });
  } catch (err) {
    return NextResponse.json(
      { message: err instanceof Error ? err.message : "Could not create invite." },
      { status: 409 },
    );
  }

  const baseUrl = getBaseUrl();
  const spec = getInviteRoleSpec("mentor");
  const registerUrl = spec.buildInviteUrl(baseUrl, invite.code);

  return NextResponse.json({
    code: invite.code,
    registerUrl,
    email: invite.email,
    expiresAt: invite.expiresAt,
    emailSent: false,
  });
}
