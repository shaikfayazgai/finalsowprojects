"use client";

import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { ContributorProfileError } from "@/lib/contributor/profile-errors";
import {
  findSkillById,
  skillsFromTrackProfile,
} from "@/lib/contributor/profile-from-track";
import { useContributorTrack } from "@/lib/hooks/use-contributor-track";
import type { MockCredential, MockSkill, MockTask } from "@/mocks/contributor";

const keys = {
  list: ["contributor", "profile", "skills"] as const,
  detail: (id: string) => ["contributor", "profile", "skills", id] as const,
};

export interface SkillListResponse {
  items: MockSkill[];
  total: number;
}

export interface SkillDetailResponse {
  skill: MockSkill;
  tasksUsingSkill: MockTask[];
  credentialsForSkill: MockCredential[];
}

/** Skills registry — declared skills from onboarding (`/api/contributor/track`). */
export function useContributorSkillsList() {
  const { status } = useSession();
  const trackQuery = useContributorTrack();

  return useQuery({
    queryKey: keys.list,
    enabled: status === "authenticated" && !!trackQuery.data,
    queryFn: (): SkillListResponse => {
      const items = skillsFromTrackProfile(trackQuery.data!.profile);
      return { items, total: items.length };
    },
  });
}

export function useContributorSkillDetail(skillId: string | undefined) {
  const { status } = useSession();
  const trackQuery = useContributorTrack();

  return useQuery({
    queryKey: keys.detail(skillId ?? ""),
    enabled: Boolean(skillId) && status === "authenticated" && !!trackQuery.data,
    queryFn: (): SkillDetailResponse => {
      const items = skillsFromTrackProfile(trackQuery.data!.profile);
      const skill = findSkillById(items, skillId!);
      if (!skill) {
        throw new ContributorProfileError(404, "Skill not found");
      }
      return {
        skill,
        tasksUsingSkill: [],
        credentialsForSkill: [],
      };
    },
    retry: (_, error) => {
      const code = (error as { status?: number })?.status;
      return code !== 404;
    },
  });
}
