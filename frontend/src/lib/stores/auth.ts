import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { UserResponse } from '@/lib/api/types'

interface AuthState {
  user: UserResponse | null
  isAuthenticated: boolean
  setUser: (user: UserResponse) => void
  clearUser: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,

      setUser: (user) => set({ user, isAuthenticated: true }),

      clearUser: () => set({ user: null, isAuthenticated: false }),
    }),
    {
      name: 'auth',
      // Only persist display data — actual auth is cookie-based
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    },
  ),
)
