"use client";

import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
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

async function getJSON<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    const err = new Error(`${url} → ${res.status}`) as Error & { status?: number };
    err.status = res.status;
    throw err;
  }
  return (await res.json()) as T;
}

/** Skills registry — structured skills (name + level + category) persisted in contributor_skills. */
export function useContributorSkillsList() {
  const { status } = useSession();
  return useQuery({
    queryKey: keys.list,
    enabled: status === "authenticated",
    queryFn: () => getJSON<SkillListResponse>("/api/contributor/skills"),
  });
}

export function useContributorSkillDetail(skillId: string | undefined) {
  const { status } = useSession();
  return useQuery({
    queryKey: keys.detail(skillId ?? ""),
    enabled: Boolean(skillId) && status === "authenticated",
    queryFn: () =>
      getJSON<SkillDetailResponse>(`/api/contributor/skills/${encodeURIComponent(skillId!)}`),
    retry: (_, error) => (error as { status?: number })?.status !== 404,
  });
}
