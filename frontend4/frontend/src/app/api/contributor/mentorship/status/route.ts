import { NextResponse } from "next/server";
import { requireRequest } from "@/lib/api/request-context";
import { prisma } from "@/lib/db";
import { listSessionsForContributor } from "@/lib/mentorship";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const ctx = await requireRequest({ allowedRoles: ["contributor"] });
  if (ctx instanceof NextResponse) return ctx;

  const profile = await prisma.contributorProfile.findUnique({
    where: { userId: ctx.userId },
    select: { mentorshipOptInAt: true, mentorshipFocus: true },
  });

  const sessions = await prisma.$transaction((tx) =>
    listSessionsForContributor(tx, {
      contributorUserId: ctx.userId,
      statuses: ["scheduled"],
      limit: 1,
    }),
  );

  return NextResponse.json({
    optedIn: profile?.mentorshipOptInAt != null,
    focus: profile?.mentorshipFocus ?? null,
    optedInAt: profile?.mentorshipOptInAt?.toISOString() ?? null,
    upcomingSession: sessions[0] ?? null,
  });
}
