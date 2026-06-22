/**
 * Enterprise profile v3 store — persisted editable identity fields. The
 * read-only profile data (decisions, interventions, activity) is derived
 * elsewhere from the contributor task store + delivery store.
 */

"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  DEFAULT_PROFILE_EDITABLE,
  type ProfileEditableState,
} from "@/types/profile";

interface ProfileStoreState {
  editable: ProfileEditableState;
  lastSavedAt: string | null;

  setEditable: <K extends keyof ProfileEditableState>(
    key: K,
    value: ProfileEditableState[K],
  ) => void;

  replaceEditable: (next: ProfileEditableState) => void;

  markSaved: () => void;
  reset: () => void;
}

export const useProfileStoreV3 = create<ProfileStoreState>()(
  persist(
    (set) => ({
      editable: DEFAULT_PROFILE_EDITABLE,
      lastSavedAt: null,

      setEditable: (key, value) =>
        set((s) => ({ editable: { ...s.editable, [key]: value } })),

      replaceEditable: (next) => set({ editable: next }),

      markSaved: () => set({ lastSavedAt: new Date().toISOString() }),

      reset: () =>
        set({
          editable: DEFAULT_PROFILE_EDITABLE,
          lastSavedAt: null,
        }),
    }),
    { name: "enterprise-profile-v3" },
  ),
);
