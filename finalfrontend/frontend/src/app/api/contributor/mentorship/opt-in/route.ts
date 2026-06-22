import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireRequest } from "@/lib/api/request-context";
import { userHasPermission } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db";
import { assignMentorshipSession, MentorshipServiceError } from "@/lib/mentorship";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const body = z.object({
  focus: z.string().max(500).optional(),
});

export async function POST(req: NextRequest) {
  const ctx = await requireRequest({ allowedRoles: ["contributor"] });
  if (ctx instanceof NextResponse) return ctx;

  if (!(await userHasPermission(ctx.userId, "request.mentorship"))) {
    return NextResponse.json(
      { error: "forbidden", reason: "missing_permission:request.mentorship" },
      { status: 403 },
    );
  }

  let raw: unknown = {};
  try {
    raw = await req.json();
  } catch {
    /* empty body ok */
  }
  const parsed = body.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      await tx.contributorProfile.updateMany({
        where: { userId: ctx.userId },
        data: {
          mentorshipOptInAt: new Date(),
          mentorshipFocus: parsed.data.focus?.trim() || null,
        },
      });

      const session = await assignMentorshipSession(tx, {
        contributorUserId: ctx.userId,
        focus: parsed.data.focus,
        createdBy: ctx.userId,
      });

      await ctx.audit(
        {
          action: "mentorship.opt_in",
          resource: { type: "mentorship_session", id: session.id },
          payload: { focus: parsed.data.focus ?? null, mentorId: session.mentorId },
          severity: "info",
        },
        { tx },
      );

      return session;
    });

    return NextResponse.json({ session: result, assigned: true }, { status: 201 });
  } catch (err) {
    if (err instanceof MentorshipServiceError) {
      const status =
        err.code === "conflict" ? 409 :
        err.code === "validation" ? 400 : 500;
      return NextResponse.json({ error: err.message, code: err.code }, { status });
    }
    // eslint-disable-next-line no-console
    console.error("[contributor.mentorship.opt-in]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
