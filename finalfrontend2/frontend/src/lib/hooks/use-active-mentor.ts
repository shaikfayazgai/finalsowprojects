"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { fetchMentorMe, type MentorMeResponse } from "@/lib/api/mentor";
import {
  MOCK_MENTORS,
  isMentorRole,
  type MentorRole,
  type MentorProfile,
} from "@/mocks/mentor/personas";

const DEMO_BYPASS = process.env.NEXT_PUBLIC_MENTOR_DEMO === "1";

/**
 * Coerce the real backend profile (which omits mock-only fields like
 * competency/country/joinedAt/avatarInitials) into a full MentorProfile so
 * components that reference those fields don't crash.
 */
function coerceProfile(raw: Partial<MentorProfile> & Record<string, unknown>, role: MentorRole): MentorProfile {
  const template = MOCK_MENTORS[role];
  const displayName = (raw.displayName as string | undefined) ?? template.displayName;

  // Derive avatarInitials from displayName if the backend didn't send them.
  const derivedInitials =
    displayName
      .trim()
      .split(/\s+/)
      .map((p: string) => p[0] ?? "")
      .join("")
      .slice(0, 2)
      .toUpperCase() || template.avatarInitials;
  const avatarInitials = (raw.avatarInitials as string | undefined) ?? derivedInitials;

  return {
    ...template,
    ...raw,
    role,
    displayName,
    avatarInitials,
    // Real backend returns `expertise` (string[]), not `competency` objects.
    // Keep mock competency as a fallback so the Competency section renders.
    competency:
      Array.isArray(raw.competency) && raw.competency.length > 0
        ? raw.competency
        : template.competency,
    // Fields the real backend may not populate — fall back to template values.
    country: (raw.country as string | undefined) ?? template.country,
    joinedAt: (raw.joinedAt as string | undefined) ?? template.joinedAt,
    languages: Array.isArray(raw.languages) && raw.languages.length > 0
      ? (raw.languages as string[])
      : template.languages,
    timezone: (raw.timezone as string | undefined) ?? template.timezone,
    bio: (raw.bio as string | undefined) ?? template.bio,
    mentorshipIntro: (raw.mentorshipIntro as string | undefined) ?? template.mentorshipIntro,
  } as MentorProfile;
}

/**
 * Active mentor identity — session-backed with optional ?role= demo override.
 */
export function useActiveMentor(): {
  role: MentorRole;
  profile: MentorProfile;
  isSeniorOrLead: boolean;
  onboardingComplete: boolean;
  loading: boolean;
  error: string | null;
  refresh: () => void;
} {
  const sp = useSearchParams();
  const { status } = useSession();
  const demoRole = sp.get("role");
  const [data, setData] = React.useState<MentorMeResponse | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [tick, setTick] = React.useState(0);

  const refresh = React.useCallback(() => setTick((t) => t + 1), []);

  React.useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      if (DEMO_BYPASS && isMentorRole(demoRole)) {
        setData({
          profile: MOCK_MENTORS[demoRole],
          role: demoRole,
          isSeniorOrLead: demoRole !== "mentor",
          onboardingComplete: true,
        });
        setError(null);
      }
      return;
    }

    const c = new AbortController();
    fetchMentorMe(DEMO_BYPASS && isMentorRole(demoRole) ? demoRole : null)
      .then((res) => {
        if (!c.signal.aborted) {
          // Coerce real backend profile to full MentorProfile shape.
          const role: MentorRole = isMentorRole(res.role) ? res.role : "mentor";
          const profile = coerceProfile(
            res.profile as unknown as Partial<MentorProfile> & Record<string, unknown>,
            role,
          );
          setData({ ...res, profile, role });
          setError(null);
        }
      })
      .catch((err: unknown) => {
        if (!c.signal.aborted) {
          setError(err instanceof Error ? err.message : "Could not load mentor profile.");
        }
      });
    return () => c.abort();
  }, [status, demoRole, tick]);

  /**
   * Default to least privilege while /api/mentor/me is loading to avoid
   * briefly exposing senior-only navigation/actions to base mentors.
   */
  const fallbackRole: MentorRole =
    DEMO_BYPASS && isMentorRole(demoRole) ? demoRole : "mentor";

  return {
    role: data?.role ?? fallbackRole,
    profile: data?.profile ?? MOCK_MENTORS[fallbackRole],
    isSeniorOrLead: data?.isSeniorOrLead ?? fallbackRole !== "mentor",
    onboardingComplete: data?.onboardingComplete ?? false,
    loading: status === "loading" || (status === "authenticated" && !data && !error),
    error,
    refresh,
  };
}
