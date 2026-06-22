import { create } from "zustand";
import type { SubmissionDetail } from "@/lib/api/contributor";

type SubmissionOverride = Partial<SubmissionDetail> & { id: string };

interface SubmissionStore {
  overrides: Record<string, SubmissionOverride>;
  setSubmissionOverride: (submission: SubmissionOverride) => void;
}

export const useSubmissionStore = create<SubmissionStore>()((set) => ({
  overrides: {},
  setSubmissionOverride: (submission) =>
    set((state) => ({
      overrides: {
        ...state.overrides,
        [submission.id]: {
          ...state.overrides[submission.id],
          ...submission,
        },
      },
    })),
}));
