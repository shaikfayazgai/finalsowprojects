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
    const su = session?.user as { name?: string | null; email?: string | null } | undefined;
    const realName = (su?.name ?? "").trim();
    const email = su?.email ?? "";
    const displayName =
      (realName && !realName.includes("@") ? realName : "") ||
      (email ? email.split("@")[0]! : "") ||
      MOCK_MENTORS[fallbackRole].displayName;
    const firstName = displayName.split(/\s+/)[0] || displayName;
    const initials = displayName
      .split(/\s+/)
      .map((p) => p[0] ?? "")
      .slice(0, 2)
      .join("")
      .toUpperCase();
    return {
      ...MOCK_MENTORS[fallbackRole],
      displayName,
      firstName,
      email: email || MOCK_MENTORS[fallbackRole].email,
      avatarInitials: initials || MOCK_MENTORS[fallbackRole].avatarInitials,
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
