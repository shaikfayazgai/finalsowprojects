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
): Promise<{ profile: MentorProfile; onboardingComplete: boolean }> {
  if (!token) return { profile, onboardingComplete: false };
  try {
    const res = await fetch(new URL("/api/mentor/profile", getBackendServiceUrl()).toString(), {
      headers: { authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) return { profile, onboardingComplete: false };
    const data = ((await res.json()) as { data?: Record<string, unknown> }).data ?? {};
    const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : undefined);
    const arr = (v: unknown) =>
      Array.isArray(v) && v.length ? v.filter((x): x is string => typeof x === "string") : undefined;
    const settings = (data.settings ?? {}) as Record<string, unknown>;
    // Onboarding completion is persisted on the backend (mentor_profiles.settings).
    // Read it here so the gate fires only ONCE — the in-memory store reset every login.
    const onboardingComplete = Boolean(settings.onboarding_complete ?? settings.onboardingComplete);
    const expertise = arr(data.expertise);
    const competency = expertise
      ? expertise.map((skill) => ({ skill, levelMin: 1 as const, levelMax: 3 as const }))
      : profile.competency;
    return {
      profile: {
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
      },
      onboardingComplete,
    };
  } catch {
    return { profile, onboardingComplete: false };
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
  const { profile, onboardingComplete: backendOnboarded } = await overlayBackendProfile(baseProfile, token);

  return NextResponse.json({
    profile,
    role,
    isSeniorOrLead: isSeniorMentorRole(role),
    // Backend flag is the source of truth (persisted) — the in-memory store is only
    // an optimistic fallback for the moments right after completing onboarding.
    onboardingComplete:
      backendOnboarded ||
      isOnboardingComplete(ctx.userId) ||
      DEV_ONBOARDED_MENTOR_EMAILS.has(ctx.email.toLowerCase()),
  });
}

export async function POST() {
  const ctx = await requireRequest({ allowedRoles: ["mentor"] });
  if (ctx instanceof NextResponse) return ctx;
  const token = (ctx.session.user as { accessToken?: string } | undefined)?.accessToken;
  // PERSIST to the backend (mentor_profiles.settings.onboarding_complete) so the gate
  // fires only ONCE. The in-memory store alone reset on every login → the agreement/
  // details step kept re-appearing. Best-effort backend write + optimistic local flag.
  if (token) {
    try {
      await fetch(new URL("/api/v1/mentor/me", getBackendServiceUrl()).toString(), {
        method: "POST",
        headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
        body: "{}",
        signal: AbortSignal.timeout(8_000),
      });
    } catch {
      /* best-effort; the optimistic flag below still covers this session */
    }
  }
  markOnboardingComplete(ctx.userId);
  return NextResponse.json({ success: true, onboardingComplete: true });
}
