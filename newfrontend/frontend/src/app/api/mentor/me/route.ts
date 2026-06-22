import { NextResponse } from "next/server";
import { requireRequest } from "@/lib/api/request-context";
import { getBackendServiceUrl } from "@/lib/api/backend-service";
import { buildMentorProfile } from "@/lib/mentor/resolve-mentor-profile";
import type { MentorProfile } from "@/mocks/mentor/personas";
import {
  isOnboardingComplete,
  markOnboardingComplete,
} from "@/lib/mentor/runtime-store";
import {
  parseDemoMentorRole,
  resolveMentorRoleForUser,
  isSeniorMentorRole,
} from "@/lib/mentor/resolve-mentor-role";

/**
 * Overlay the REAL backend mentor_profiles record on top of the
 * session/template-derived profile. Only fields the mentor has actually set
 * win; everything else keeps the template default. Best-effort — a backend
 * miss leaves the template profile untouched.
 */
async function overlayBackendProfile(
  profile: MentorProfile,
  token: string | undefined,
): Promise<MentorProfile> {
  if (!token) return profile;
  try {
    const res = await fetch(new URL("/api/mentor/profile", getBackendServiceUrl()).toString(), {
      headers: { authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) return profile;
    const data = ((await res.json()) as { data?: Record<string, unknown> }).data ?? {};
    const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : undefined);
    const arr = (v: unknown) =>
      Array.isArray(v) && v.length ? v.filter((x): x is string => typeof x === "string") : undefined;
    const settings = (data.settings ?? {}) as Record<string, unknown>;
    const expertise = arr(data.expertise);
    const competency = expertise
      ? expertise.map((skill) => ({ skill, levelMin: 1 as const, levelMax: 3 as const }))
      : profile.competency;
    return {
      ...profile,
      title: str(data.headline) ?? profile.title,
      bio: str(data.bio) ?? profile.bio,
      mentorshipIntro: str(settings.mentorshipIntro) ?? profile.mentorshipIntro,
      languages: arr(data.languages) ?? profile.languages,
      timezone: str(data.timezone) ?? profile.timezone,
      country: str(data.country) ?? profile.country,
      // real "mentor since" from the profile row's creation date
      joinedAt: str(data.created_at) ?? profile.joinedAt,
      competency,
    };
  } catch {
    return profile;
  }
}

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

  const baseProfile = buildMentorProfile({
    userId: ctx.userId,
    email: ctx.email,
    name: ctx.session.user?.name,
    firstName: (ctx.session.user as { firstName?: string }).firstName,
    lastName: (ctx.session.user as { lastName?: string }).lastName,
    role,
  });

  const token = (ctx.session.user as { accessToken?: string } | undefined)?.accessToken;
  const profile = await overlayBackendProfile(baseProfile, token);

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
