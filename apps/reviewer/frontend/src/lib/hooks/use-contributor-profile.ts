"use client";

import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import {
  availabilityFromTrackProfile,
  skillsFromTrackProfile,
  studentInstitutionLabel,
} from "@/lib/contributor/profile-from-track";
import { useContributorTrack } from "@/lib/hooks/use-contributor-track";
import type { ProfileIndexData } from "@/app/contributor/profile/lib/profile-ui-utils";

const keys = {
  index: (userId: string | undefined) => ["contributor", "profile", "index", userId ?? "—"] as const,
};

/**
 * Profile overview data — onboarding fields from `/api/contributor/track`.
 * Delivery metrics (digital twin, recent tasks) stay empty until wired to
 * real completed-work APIs; mocks must not override declared skills.
 */
export function useContributorProfileIndex() {
  const { data: session, status } = useSession();
  const trackQuery = useContributorTrack();
  const userId = session?.user?.id;

  return useQuery({
    queryKey: keys.index(userId),
    enabled: status === "authenticated" && !!trackQuery.data,
    queryFn: (): ProfileIndexData => {
      const track = trackQuery.data!;
      const profile = track.profile;
      const skills = skillsFromTrackProfile(profile);

      return {
        skills,
        skillTotal: skills.length,
        twin: null,
        recentTasks: [],
        availability: availabilityFromTrackProfile(profile),
        institution:
          track.persona === "student" ? studentInstitutionLabel(profile) : null,
      };
    },
  });
}
