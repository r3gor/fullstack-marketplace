'use client'

import { useEffect } from 'react'
import { user as userApi, favorites as favoritesApi } from '@/lib/api'
import { useAuthStore, useFavoritesStore } from '@/lib/stores'

// Verifies the session cookie is still valid on every app mount.
// If the backend returns 401, clears the stale auth state from localStorage.
// If authenticated, also loads the favorites list into the in-memory store
// so FavoriteButton shows the correct state across all catalog pages.
export function AuthInitializer() {
  const { setUser, clearUser } = useAuthStore()
  const setFavorites = useFavoritesStore((s) => s.setFavorites)

  useEffect(() => {
    userApi.me()
      .then((userData) => {
        setUser(userData)
        return favoritesApi.list()
      })
      .then((favs) => {
        setFavorites(favs.map((f) => f.product_id))
      })
      .catch(clearUser)
  }, [setUser, clearUser, setFavorites])

  return null
}
