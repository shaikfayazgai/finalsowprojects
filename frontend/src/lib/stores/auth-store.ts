import { create } from "zustand";
import { persist } from "zustand/middleware";

interface RegistrationData {
  companyName: string;
  countryOfIncorporation: string;
  adminEmail: string;
  companySize?: string;
  industry?: string;
  website?: string;
}

interface OnboardingProgress {
  currentStep: number;
  step1?: {
    taxId: string;
    addressLine1: string;
    addressLine2: string;
    city: string;
    stateProvince: string;
    postalCode: string;
  };
  step2?: {
    billingCurrency: string;
    billingContactEmail: string;
    billingContactName: string;
  };
  lastSaved: string;
}

interface AuthState {
  isMfaEnabled: boolean;
  setMfaEnabled: (v: boolean) => void;

  isOnboardingComplete: boolean;
  setOnboardingComplete: (v: boolean) => void;

  /** True only when the user just registered via SSO from the register page and hasn't completed onboarding yet. */
  pendingOnboarding: boolean;
  setPendingOnboarding: (v: boolean) => void;

  onboardingProgress: OnboardingProgress | null;
  setOnboardingProgress: (v: OnboardingProgress | null) => void;

  registrationData: RegistrationData | null;
  setRegistrationData: (v: RegistrationData | null) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isMfaEnabled: false,
      setMfaEnabled: (v) => set({ isMfaEnabled: v }),

      isOnboardingComplete: false,
      setOnboardingComplete: (v) => set({ isOnboardingComplete: v }),

      pendingOnboarding: false,
      setPendingOnboarding: (v) => set({ pendingOnboarding: v }),

      onboardingProgress: null,
      setOnboardingProgress: (v) => set({ onboardingProgress: v }),

      registrationData: null,
      setRegistrationData: (v) => set({ registrationData: v }),
    }),
    { name: "gt-auth" }
  )
);
