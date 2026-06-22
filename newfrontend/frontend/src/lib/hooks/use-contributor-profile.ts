"use client";

import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import {
  availabilityFromTrackProfile,
  skillsFromTrackProfile,
  studentInstitutionLabel,
} from "@/lib/contributor/profile-from-track";
import { useContributorTrack } from "@/lib/hooks/use-contributor-track";
import type {
  ProfileIndexData,
  ProfileRecentTask,
  ProfileTwin,
} from "@/app/contributor/profile/lib/profile-ui-utils";

const keys = {
  index: (userId: string | undefined) => ["contributor", "profile", "index", userId ?? "—"] as const,
};

/**
 * Profile overview data. Onboarding fields (skills, availability, institution)
 * come from `/api/contributor/track`; the delivery record (digital twin +
 * recent contributions) comes from `/api/contributor/profile/stats`, which the
 * backend computes live from the contributor's own tasks + the mentor reviews
 * they received. Stats are best-effort — the profile still renders from
 * onboarding data if they fail to load.
 */
export function useContributorProfileIndex() {
  const { data: session, status } = useSession();
  const trackQuery = useContributorTrack();
  const userId = session?.user?.id;

  return useQuery({
    queryKey: keys.index(userId),
    enabled: status === "authenticated" && !!trackQuery.data,
    queryFn: async (): Promise<ProfileIndexData> => {
      const track = trackQuery.data!;
      const profile = track.profile;
      const skills = skillsFromTrackProfile(profile);

      let twin: ProfileTwin | null = null;
      let recentTasks: ProfileRecentTask[] = [];
      try {
        const res = await fetch("/api/contributor/profile/stats", { cache: "no-store" });
        if (res.ok) {
          const json = (await res.json()) as {
            twin: ProfileTwin | null;
            recentTasks: ProfileRecentTask[];
          };
          twin = json.twin ?? null;
          recentTasks = Array.isArray(json.recentTasks) ? json.recentTasks : [];
        }
      } catch {
        // Delivery metrics are best-effort; keep the empty state on failure.
      }

      return {
        skills,
        skillTotal: skills.length,
        twin,
        recentTasks,
        availability: availabilityFromTrackProfile(profile),
        institution:
          track.persona === "student" ? studentInstitutionLabel(profile) : null,
      };
    },
  });
}
