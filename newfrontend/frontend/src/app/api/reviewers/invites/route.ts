/**
 * POST /api/reviewers/invites — reviewer self-register invite (Option 2).
 * Creates a pending invite code + optional email with signup link (no temp password).
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/auth/require-role";
import { buildEmailHtml, sendEmail } from "@/lib/email";
import { DEFAULT_TEMPLATES } from "@/lib/stores/email-template-store";
import { createReviewerInvite } from "@/lib/reviewer/invite-store";
import { getBaseUrl } from "@/lib/utils/base-url";
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_TENANT_ID = "tnt-acme-corp";

const bodySchema = z.object({
  email: z.string().email(),
  note: z.string().max(2000).optional(),
});

async function resolveInviter(email: string) {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter });
  try {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        tenantId: true,
        tenant: { select: { name: true } },
      },
    });
    return user;
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(req: NextRequest) {
  const guard = await requireRole(["enterprise", "admin", "super_admin"]);
  if (guard instanceof NextResponse) return guard;

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
  }

  const inviter = await resolveInviter(guard.email);
  const tenantId = inviter?.tenantId ?? DEFAULT_TENANT_ID;
  const orgName = inviter?.tenant?.name ?? "Your organization";
  const inviterName =
    `${inviter?.firstName ?? ""} ${inviter?.lastName ?? ""}`.trim() || guard.session.user?.name || "Your admin";

  let invite;
  try {
    invite = createReviewerInvite({
      email: body.email,
      tenantId,
      invitedByUserId: guard.userId,
      invitedByName: inviterName,
      invitedByEmail: guard.email,
      orgName,
      note: body.note,
    });
  } catch (err) {
    return NextResponse.json(
      { message: err instanceof Error ? err.message : "Could not create invite." },
      { status: 409 },
    );
  }

  const baseUrl = getBaseUrl();
  const registerUrl = `${baseUrl}/auth/register/reviewer?code=${encodeURIComponent(invite.code)}`;

  const tpl = DEFAULT_TEMPLATES.reviewer_invitation;
  const payload: Record<string, string> = {
    reviewerName: body.email.split("@")[0] ?? "there",
    inviterName,
    inviterOrg: orgName,
    loginEmail: body.email.trim().toLowerCase(),
    registerUrl,
    expiryDays: "7",
    personalNote: body.note?.trim() ? `<p>${body.note.trim()}</p>` : "",
  };

  const subject = tpl.subject.replace(/\{\{(\w+)\}\}/g, (_, k) => payload[k] ?? "");
  const html = buildEmailHtml({
    bodyHtml: tpl.bodyHtml,
    headerColor: tpl.headerColor,
    logoUrl: tpl.logoUrl,
    footerText: tpl.footerText,
    payload,
  });

  const emailResult = await sendEmail({
    to: body.email.trim().toLowerCase(),
    subject,
    html,
  });

  return NextResponse.json({
    code: invite.code,
    registerUrl,
    email: invite.email,
    expiresAt: invite.expiresAt,
    emailSent: emailResult.success,
  });
}
