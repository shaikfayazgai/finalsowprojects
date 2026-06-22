"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  claimReview,
  decideReview,
  getReviewSubmission,
  listReviewHistory,
  listReviewQueue,
  releaseReview,
} from "@/lib/api/enterprise-review";

const keys = {
  queue: (params: Parameters<typeof listReviewQueue>[0]) =>
    ["enterprise-review", "queue", params] as const,
  history: (params: Parameters<typeof listReviewHistory>[0]) =>
    ["enterprise-review", "history", params] as const,
  submission: (id: string) => ["enterprise-review", "submission", id] as const,
};

export function useReviewQueue(params: Parameters<typeof listReviewQueue>[0] = {}) {
  return useQuery({
    queryKey: keys.queue(params),
    queryFn: () => listReviewQueue(params),
  });
}

export function useReviewHistory(params: Parameters<typeof listReviewHistory>[0] = {}) {
  return useQuery({
    queryKey: keys.history(params),
    queryFn: () => listReviewHistory(params),
  });
}

export function useReviewSubmission(submissionId: string | undefined) {
  return useQuery({
    queryKey: keys.submission(submissionId ?? ""),
    queryFn: () => getReviewSubmission(submissionId!),
    enabled: !!submissionId,
  });
}

export function useClaimReview(submissionId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => claimReview(submissionId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["enterprise-review", "queue"] });
      qc.invalidateQueries({ queryKey: ["enterprise-review", "history"] });
      qc.invalidateQueries({ queryKey: ["enterprise-review", "submission"] });
    },
  });
}

export function useReleaseReview(submissionId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => releaseReview(submissionId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["enterprise-review", "queue"] });
      qc.invalidateQueries({ queryKey: ["enterprise-review", "history"] });
      qc.invalidateQueries({ queryKey: ["enterprise-review", "submission"] });
    },
  });
}

export function useDecideReview(submissionId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Parameters<typeof decideReview>[1]) =>
      decideReview(submissionId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["enterprise-review", "queue"] });
      qc.invalidateQueries({ queryKey: ["enterprise-review", "history"] });
      qc.invalidateQueries({ queryKey: ["enterprise-review", "submission"] });
    },
  });
}
