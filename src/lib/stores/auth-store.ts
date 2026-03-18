import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthState {
  isMfaEnabled: boolean;
  setMfaEnabled: (v: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isMfaEnabled: false,
      setMfaEnabled: (v) => set({ isMfaEnabled: v }),
    }),
    { name: "gt-auth" }
  )
);
