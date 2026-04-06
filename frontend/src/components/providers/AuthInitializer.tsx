'use client'

import { useEffect } from 'react'
import { user as userApi } from '@/lib/api'
import { useAuthStore } from '@/lib/stores'

// Verifies the session cookie is still valid on every app mount.
// If the backend returns 401, clears the stale auth state from localStorage.
export function AuthInitializer() {
  const { setUser, clearUser } = useAuthStore()

  useEffect(() => {
    userApi.me()
      .then(setUser)
      .catch(clearUser)
  }, [setUser, clearUser])

  return null
}
