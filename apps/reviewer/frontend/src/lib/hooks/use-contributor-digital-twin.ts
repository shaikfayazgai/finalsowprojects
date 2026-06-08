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

/** Digital twin — onboarding fields from track; delivery metrics empty until wired. */
export function useContributorDigitalTwinDetail() {
  const { status } = useSession();
  const trackQuery = useContributorTrack();

  return useQuery({
    queryKey: keys.detail,
    enabled: status === "authenticated" && !!trackQuery.data,
    queryFn: (): DigitalTwinDetailData => {
      const profile = trackQuery.data!.profile;
      const skills = skillsFromTrackProfile(profile);
      return {
        twin: null,
        skills,
        skillTotal: skills.length,
        availability: availabilityFromTrackProfile(profile),
      };
    },
  });
}
