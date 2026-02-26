'use client'
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

type MentorRole = 'applicant' | 'pending_onboarding' | 'mentor'

interface AuthState {
  isAuthenticated: boolean
  mentorId: string | null
  role: MentorRole
  setAuth: (mentorId: string, role: MentorRole) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      mentorId: null,
      role: 'applicant',
      setAuth: (mentorId, role) => set({ isAuthenticated: true, mentorId, role }),
      logout: () => set({ isAuthenticated: false, mentorId: null, role: 'applicant' }),
    }),
    {
      name: 'glimmora-mentor-auth',
      storage: createJSONStorage(() => localStorage),
    }
  )
)
