import { create } from "zustand";

interface OnboardingState {
  track: "general" | "student" | "women" | "";
  setTrack: (track: "general" | "student" | "women") => void;
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  track: "",
  setTrack: (track) => set({ track }),
}));
