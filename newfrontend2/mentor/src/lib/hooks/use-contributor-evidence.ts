"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { getContributorAccessToken } from "@/lib/auth/contributor-access-token";
import {
  createContributorProfileEvidence,
  deleteContributorProfileEvidence,
  fetchContributorProfileEvidence,
  updateContributorProfileEvidence,
  type CreateProfileEvidenceBody,
  type ProfileEvidenceQueryParams,
  type UpdateProfileEvidenceBody,
} from "@/lib/api/contributor";

const rootKey = ["contributor", "profile", "evidence"] as const;

function listKey(contributorId: string, params: ProfileEvidenceQueryParams) {
  return [...rootKey, contributorId, params] as const;
}

export function useContributorEvidence(params: ProfileEvidenceQueryParams) {
  const { data: session, status: sessionStatus } = useSession();
  const token = getContributorAccessToken(session);
  const contributorId = session?.user?.id ?? "";
  const enabled = sessionStatus !== "loading" && Boolean(token) && Boolean(contributorId);

  const query = useQuery({
    queryKey: listKey(contributorId, params),
    queryFn: () => fetchContributorProfileEvidence(token!, contributorId, params),
    enabled,
  });

  const qc = useQueryClient();

  const invalidate = () =>
    qc.invalidateQueries({ queryKey: [...rootKey, contributorId] });

  const createMutation = useMutation({
    mutationFn: (body: CreateProfileEvidenceBody) =>
      createContributorProfileEvidence(token!, contributorId, body),
    onSuccess: () => invalidate(),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateProfileEvidenceBody }) =>
      updateContributorProfileEvidence(token!, contributorId, id, body),
    onSuccess: () => invalidate(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteContributorProfileEvidence(token!, contributorId, id),
    onSuccess: () => invalidate(),
  });

  return {
    ...query,
    token,
    contributorId,
    sessionStatus,
    enabled,
    createMutation,
    updateMutation,
    deleteMutation,
  };
}
