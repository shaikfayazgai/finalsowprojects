'use client'
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { EnterpriseUser } from '@glimmora/types'

interface AuthState {
  user: EnterpriseUser | null
  isAuthenticated: boolean
  onboardingStep: number
  onboardingCompleted: boolean
  setUser: (user: EnterpriseUser) => void
  setOnboardingStep: (step: number) => void
  completeOnboarding: () => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      onboardingStep: 0,
      onboardingCompleted: false,
      setUser: (user) => set({ user, isAuthenticated: true }),
      setOnboardingStep: (step) => set({ onboardingStep: step }),
      completeOnboarding: () => set({ onboardingCompleted: true, onboardingStep: 4 }),
      logout: () =>
        set({
          user: null,
          isAuthenticated: false,
          onboardingStep: 0,
          onboardingCompleted: false,
        }),
    }),
    {
      name: 'glimmora-enterprise-auth',
      storage: createJSONStorage(() => localStorage),
    }
  )
)
