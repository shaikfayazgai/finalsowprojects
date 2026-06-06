import { create } from "zustand";
import { persist } from "zustand/middleware";

// Holds the phone number captured at contributor registration so the
// onboarding verify step and the profile edit page can pre-fill it.
// Persisted to localStorage so it survives the full-page redirect between
// registration completion and the onboarding flow.
interface ContributorPhonePrefillState {
  phone: string;
  setPhone: (phone: string) => void;
  clear: () => void;
}

export const useContributorPhonePrefill = create<ContributorPhonePrefillState>()(
  persist(
    (set) => ({
      phone: "",
      setPhone: (phone) => set({ phone }),
      clear: () => set({ phone: "" }),
    }),
    { name: "contributor-phone-prefill" },
  ),
);
