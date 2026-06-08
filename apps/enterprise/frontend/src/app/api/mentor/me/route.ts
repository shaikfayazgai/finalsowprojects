import { NextResponse } from "next/server";
import { requireRequest } from "@/lib/api/request-context";
import { buildMentorProfile } from "@/lib/mentor/resolve-mentor-profile";
import {
  isOnboardingComplete,
  markOnboardingComplete,
} from "@/lib/mentor/runtime-store";
import {
  parseDemoMentorRole,
  resolveMentorRoleForUser,
  isSeniorMentorRole,
} from "@/lib/mentor/resolve-mentor-role";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEV_ONBOARDED_MENTOR_EMAILS = new Set([
  "priya@glimmora.team",
  "amelia@glimmora.team",
]);

export async function GET(req: Request) {
  const ctx = await requireRequest({ allowedRoles: ["mentor", "admin", "super_admin"] });
  if (ctx instanceof NextResponse) return ctx;

  const url = new URL(req.url);
  const demoRole = parseDemoMentorRole(url.searchParams.get("role"));
  const role =
    demoRole && process.env.NEXT_PUBLIC_MENTOR_DEMO === "1"
      ? demoRole
      : await resolveMentorRoleForUser(ctx.userId);

  const profile = buildMentorProfile({
    userId: ctx.userId,
    email: ctx.email,
    name: ctx.session.user?.name,
    firstName: (ctx.session.user as { firstName?: string }).firstName,
    lastName: (ctx.session.user as { lastName?: string }).lastName,
    role,
  });

  return NextResponse.json({
    profile,
    role,
    isSeniorOrLead: isSeniorMentorRole(role),
    onboardingComplete:
      isOnboardingComplete(ctx.userId) ||
      DEV_ONBOARDED_MENTOR_EMAILS.has(ctx.email.toLowerCase()),
  });
}

export async function POST() {
  const ctx = await requireRequest({ allowedRoles: ["mentor"] });
  if (ctx instanceof NextResponse) return ctx;
  markOnboardingComplete(ctx.userId);
  return NextResponse.json({ success: true, onboardingComplete: true });
}
