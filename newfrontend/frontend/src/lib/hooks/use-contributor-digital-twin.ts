"use client";

import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import {
  availabilityFromTrackProfile,
  skillsFromTrackProfile,
  type ProfileAvailability,
} from "@/lib/contributor/profile-from-track";
import { useContributorTrack } from "@/lib/hooks/use-contributor-track";
import type { MockDigitalTwin, MockSkill } from "@/mocks/contributor";

const keys = {
  detail: ["contributor", "profile", "digital-twin"] as const,
};

export interface DigitalTwinDetailData {
  /** Derived delivery record — null until wired to completed-work APIs. */
  twin: MockDigitalTwin | null;
  skills: MockSkill[];
  skillTotal: number;
  availability: ProfileAvailability;
}

/**
 * Digital twin detail. Skills + availability come from onboarding
 * (`/api/contributor/track`); the delivery record (activity, reliability,
 * streaks, reinforcing skills, trend, observations) comes from
 * `/api/contributor/profile/twin-detail`, which the backend computes live from
 * the contributor's own tasks + the mentor reviews they received. The twin is
 * best-effort — the page keeps its empty state if it fails to load.
 */
export function useContributorDigitalTwinDetail() {
  const { status } = useSession();
  const trackQuery = useContributorTrack();

  return useQuery({
    queryKey: keys.detail,
    enabled: status === "authenticated" && !!trackQuery.data,
    queryFn: async (): Promise<DigitalTwinDetailData> => {
      const profile = trackQuery.data!.profile;
      const skills = skillsFromTrackProfile(profile);

      let twin: MockDigitalTwin | null = null;
      try {
        const res = await fetch("/api/contributor/profile/twin-detail", {
          cache: "no-store",
        });
        if (res.ok) {
          const json = (await res.json()) as { twin: MockDigitalTwin | null };
          twin = json.twin ?? null;
        }
      } catch {
        // Delivery metrics are best-effort; keep the empty state on failure.
      }

      return {
        twin,
        skills,
        skillTotal: skills.length,
        availability: availabilityFromTrackProfile(profile),
      };
    },
  });
}
