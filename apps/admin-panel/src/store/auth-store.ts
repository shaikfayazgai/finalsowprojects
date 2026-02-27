'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { AdminUser, AdminRole } from '@glimmora/types'

interface AuthState {
  user: AdminUser | null
  isAuthenticated: boolean
  adminRole: AdminRole
  setUser: (user: AdminUser) => void
  setAdminRole: (role: AdminRole) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      adminRole: 'standard_admin',
      setUser: (user) => set({ user, isAuthenticated: true, adminRole: user.adminRole }),
      setAdminRole: (adminRole) => set({ adminRole }),
      logout: () => set({ user: null, isAuthenticated: false, adminRole: 'standard_admin' }),
    }),
    {
      name: 'glimmora-admin-auth',
      storage: createJSONStorage(() => localStorage),
    }
  )
)
