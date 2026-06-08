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

/** Neutral, identity-free template used when no persona seed exists. */
function emptyMentorProfile(role: MentorRole): MentorProfile {
  return {
    role,
    id: "",
    displayName: "",
    firstName: "",
    email: "",
    avatarInitials: "",
    title: "",
    country: "",
    timezone: "",
    joinedAt: "",
    bio: "",
    mentorshipIntro: "",
    languages: [],
    competency: [],
    pools: [],
    capacityPerWeek: 0,
    status: "available",
  };
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
  const { status, data: session } = useSession();
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
          profile: MOCK_MENTORS[demoRole] ?? emptyMentorProfile(demoRole),
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
          setData(res);
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

  const fallbackRole: MentorRole =
    DEMO_BYPASS && isMentorRole(demoRole) ? demoRole : "mentor.senior";

  // Fallback profile (while the real /me loads or if it errors): use the REAL
  // signed-in identity from the session — NEVER the mock persona's name (which
  // is why "Priya"/"Amelia" leaked through). Only the non-identity template
  // fields (avatar style, etc.) come from the persona.
  const fallbackProfile: MentorProfile = React.useMemo(() => {
    const base = MOCK_MENTORS[fallbackRole] ?? emptyMentorProfile(fallbackRole);
    const su = session?.user as { name?: string | null; email?: string | null } | undefined;
    const realName = (su?.name ?? "").trim();
    const email = su?.email ?? "";
    const displayName =
      (realName && !realName.includes("@") ? realName : "") ||
      (email ? email.split("@")[0]! : "") ||
      base.displayName;
    const firstName = displayName.split(/\s+/)[0] || displayName;
    const initials = displayName
      .split(/\s+/)
      .map((p) => p[0] ?? "")
      .slice(0, 2)
      .join("")
      .toUpperCase();
    return {
      ...base,
      displayName,
      firstName,
      email: email || base.email,
      avatarInitials: initials || base.avatarInitials,
    };
  }, [session?.user, fallbackRole]);

  return {
    role: data?.role ?? fallbackRole,
    profile: data?.profile ?? fallbackProfile,
    isSeniorOrLead: data?.isSeniorOrLead ?? fallbackRole !== "mentor",
    onboardingComplete: data?.onboardingComplete ?? false,
    loading: status === "loading" || (status === "authenticated" && !data && !error),
    error,
    refresh,
  };
}
