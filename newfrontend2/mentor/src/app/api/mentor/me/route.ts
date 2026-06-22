import { NextResponse } from "next/server";
import { requireRequest } from "@/lib/api/request-context";
import { buildMentorProfile } from "@/lib/mentor/resolve-mentor-profile";
import { markOnboardingComplete } from "@/lib/mentor/runtime-store";
import { callMentorBackend } from "@/lib/api/mentor-backend";
import {
  parseDemoMentorRole,
  resolveMentorRoleForUser,
  isSeniorMentorRole,
} from "@/lib/mentor/resolve-mentor-role";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Base URL of the bundled mentor FastAPI backend (server-side only). */
function backendBaseUrl(): string {
  return (
    process.env.GLIMMORA_API_BASE_URL ??
    process.env.NEXT_PUBLIC_GLIMMORA_API_URL ??
    process.env.BACKEND_SERVICE_URL ??
    "http://127.0.0.1:8101"
  );
}

/**
 * Read the DURABLE onboarding flag from the backend
 * (`mentor_profiles.settings.onboarding_complete`). Returns null when we can't
 * reach the backend or have no token, so the caller can fall back.
 *
 * This is what makes onboarding a true first-login-only gate: completion is
 * persisted in Postgres, so it never reappears after a password reset or on
 * later logins (the previous in-memory flag reset on every server restart).
 */
async function backendOnboardingComplete(token: string): Promise<boolean | null> {
  try {
    const res = await fetch(`${backendBaseUrl()}/api/v1/mentor/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const body = (await res.json().catch(() => ({}))) as {
      onboardingComplete?: boolean;
    };
    return Boolean(body.onboardingComplete);
  } catch {
    return null;
  }
}

/** Durable profile fields persisted in mentor_profiles + settings JSONB. */
type BackendProfileFields = {
  bio?: string | null;
  mentorshipIntro?: string | null;
  languages?: string[] | null;
  timezone?: string | null;
};

async function backendProfileFields(token: string | undefined): Promise<BackendProfileFields | null> {
  const [profile, settings] = await Promise.all([
    callMentorBackend<{ bio?: string; languages?: string[]; timezone?: string }>(
      token,
      "/api/mentor/profile",
    ),
    callMentorBackend<{ settings?: { mentorshipIntro?: string } }>(token, "/api/mentor/settings"),
  ]);
  if (!profile.ok && !settings.ok) return null;
  return {
    bio: profile.data?.bio ?? null,
    languages: profile.data?.languages ?? null,
    timezone: profile.data?.timezone ?? null,
    mentorshipIntro: settings.data?.settings?.mentorshipIntro ?? null,
  };
}

export async function GET(req: Request) {
  const ctx = await requireRequest({ allowedRoles: ["mentor", "admin", "super_admin"] });
  if (ctx instanceof NextResponse) return ctx;

  const url = new URL(req.url);
  const demoRole = parseDemoMentorRole(url.searchParams.get("role"));
  const role =
    demoRole && process.env.NEXT_PUBLIC_MENTOR_DEMO === "1"
      ? demoRole
      : await resolveMentorRoleForUser(ctx.userId);

  const token = (ctx.session.user as { accessToken?: string }).accessToken;
  // Durable profile fields (bio/languages/timezone/mentorshipIntro) so edits
  // persist across reloads instead of living only in the in-memory store.
  const backend = await backendProfileFields(token);

  const profile = buildMentorProfile({
    userId: ctx.userId,
    email: ctx.email,
    name: ctx.session.user?.name,
    firstName: (ctx.session.user as { firstName?: string }).firstName,
    lastName: (ctx.session.user as { lastName?: string }).lastName,
    role,
    backend,
  });

  // Onboarding is forced ONLY when the backend EXPLICITLY says it's incomplete.
  // The durable backend flag (mentor_profiles.settings.onboarding_complete) is the
  // single source of truth. On any uncertainty — no token, backend slow/down, read
  // error — we DO NOT trap the user in onboarding (default to complete). Trapping an
  // already-onboarded mentor on a transient read failure is far worse than briefly
  // not prompting a brand-new mentor (the backend re-gates that on the next load,
  // and onboarding is enforced server-side on mentor actions anyway).
  const durable = token ? await backendOnboardingComplete(token) : null;
  // durable === true|false → trust the backend. durable === null (no token /
  // backend unreachable) → treat as complete so we never trap an onboarded
  // mentor; a real first-timer is still caught on the next load once the backend
  // (the source of truth) responds with false.
  const onboardingComplete = durable !== null ? durable : true;

  return NextResponse.json({
    profile,
    role,
    isSeniorOrLead: isSeniorMentorRole(role),
    onboardingComplete,
  });
}

export async function POST() {
  const ctx = await requireRequest({ allowedRoles: ["mentor"] });
  if (ctx instanceof NextResponse) return ctx;

  // Persist durably to the backend (mentor_profiles.settings.onboarding_complete)
  // so onboarding never re-appears after a reset/re-login. Keep the in-memory
  // mark as a fallback for token-less (local-credentials) sessions.
  markOnboardingComplete(ctx.userId);
  const token = (ctx.session.user as { accessToken?: string }).accessToken;
  if (token) {
    try {
      await fetch(`${backendBaseUrl()}/api/v1/mentor/me`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
        signal: AbortSignal.timeout(8000),
      });
    } catch {
      // Non-fatal: the in-memory mark still reflects completion for this session.
    }
  }

  return NextResponse.json({ success: true, onboardingComplete: true });
}
