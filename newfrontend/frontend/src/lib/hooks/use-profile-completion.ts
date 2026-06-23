"use client";

/**
 * Contributor profile-completion status. Reads the freelancer backend
 * (`GET /api/contributor/profile/completion`) which returns the 0–100 %
 * completeness, the per-section booleans, and the list of sections still
 * missing. Drives the circular completion ring on the profile + the
 * 100 %-required gate on the public task marketplace (Opportunities).
 */

import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";

export interface ProfileCompletion {
  completeness: number; // 0..100
  complete: boolean; // true once every gating section is filled
  sections: Record<string, boolean>;
  weights: Record<string, number>; // per-section weight (sums to 100)
  missing: string[]; // keys of gating sections still incomplete
}

const EMPTY: ProfileCompletion = {
  completeness: 0,
  complete: false,
  sections: {},
  weights: {},
  missing: [],
};

/** Friendly labels for the weighted section keys returned by the backend. */
export const SECTION_LABELS: Record<string, string> = {
  basic: "Basic information",
  professional: "Professional details",
  skills: "Skills",
  expertise: "Expertise areas",
  portfolio: "Portfolio projects",
  experience: "Work experience",
  education: "Education",
};

export function useProfileCompletion() {
  const { status } = useSession();
  return useQuery({
    queryKey: ["contributor", "profile", "completion"],
    enabled: status === "authenticated",
    staleTime: 30_000,
    queryFn: async (): Promise<ProfileCompletion> => {
      const res = await fetch("/api/contributor/profile/completion", { cache: "no-store" });
      if (!res.ok) return EMPTY;
      const json = (await res.json().catch(() => ({}))) as Partial<ProfileCompletion>;
      return {
        completeness: Math.max(0, Math.min(100, Number(json?.completeness ?? 0))),
        complete: Boolean(json?.complete),
        sections: (json?.sections as Record<string, boolean>) ?? {},
        weights: (json?.weights as Record<string, number>) ?? {},
        missing: Array.isArray(json?.missing) ? json.missing : [],
      };
    },
  });
}
