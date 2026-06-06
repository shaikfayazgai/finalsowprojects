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
