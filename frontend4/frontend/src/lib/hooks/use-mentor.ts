"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  claimSubmission,
  decideSubmission,
  getMentorSubmission,
  listMentorQueue,
  releaseSubmission,
} from "@/lib/api/mentor";

const keys = {
  queue: (params: Parameters<typeof listMentorQueue>[0]) =>
    ["mentor", "queue", params] as const,
  submission: (id: string) => ["mentor", "submission", id] as const,
};

export function useMentorQueue(params: Parameters<typeof listMentorQueue>[0] = {}) {
  return useQuery({
    queryKey: keys.queue(params),
    queryFn: () => listMentorQueue(params),
  });
}

export function useMentorSubmission(submissionId: string | undefined) {
  return useQuery({
    queryKey: submissionId ? keys.submission(submissionId) : ["mentor", "submission", "—"],
    queryFn: () => {
      if (!submissionId) throw new Error("submissionId required");
      return getMentorSubmission(submissionId);
    },
    enabled: !!submissionId,
  });
}

export function useClaimSubmission(submissionId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => claimSubmission(submissionId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.submission(submissionId) });
      qc.invalidateQueries({ queryKey: ["mentor", "queue"] });
    },
  });
}

export function useReleaseSubmission(submissionId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => releaseSubmission(submissionId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.submission(submissionId) });
      qc.invalidateQueries({ queryKey: ["mentor", "queue"] });
    },
  });
}

export function useDecideSubmission(submissionId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Parameters<typeof decideSubmission>[1]) =>
      decideSubmission(submissionId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.submission(submissionId) });
      qc.invalidateQueries({ queryKey: ["mentor", "queue"] });
    },
  });
}
