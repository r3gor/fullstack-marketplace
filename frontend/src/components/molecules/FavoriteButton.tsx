'use client'

import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { HugeiconsIcon } from '@hugeicons/react'
import { FavouriteIcon } from '@hugeicons/core-free-icons'
import { Button } from '@/components/atoms/Button'
import { useAuthStore, useFavoritesStore } from '@/lib/stores'
import { favorites, ApiError } from '@/lib/api'

interface FavoriteButtonProps {
  productId: number
  isFavorite?: boolean // SSR initial hint — used only before client store loads
}

export function FavoriteButton({ productId, isFavorite = false }: FavoriteButtonProps) {
  const router = useRouter()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const isHydrated = useAuthStore((s) => s._hasHydrated)

  const favLoaded = useFavoritesStore((s) => s.loaded)
  const storeHas = useFavoritesStore((s) => s.has(productId))
  const addToStore = useFavoritesStore((s) => s.add)
  const removeFromStore = useFavoritesStore((s) => s.remove)

  // Use store value once loaded, SSR prop before that
  const active = favLoaded ? storeHas : isFavorite
  const loading = false // no separate loading state needed — store updates are instant

  async function handleClick() {
    if (!isHydrated) return

    if (!isAuthenticated) {
      toast.info('Inicia sesión para guardar favoritos')
      router.push('/login')
      return
    }

    const next = !active

    // Optimistic: update store immediately
    if (next) {
      addToStore(productId)
    } else {
      removeFromStore(productId)
    }

    try {
      if (next) {
        await favorites.add(productId)
      } else {
        await favorites.remove(productId)
      }
    } catch (err) {
      // Revert store on error
      if (next) {
        removeFromStore(productId)
      } else {
        addToStore(productId)
      }
      const message = err instanceof ApiError ? err.message : 'Error al actualizar favoritos'
      toast.error(message)
    }
  }

  return (
    <Button
      variant="icon"
      aria-label={active ? 'Quitar de favoritos' : 'Agregar a favoritos'}
      disabled={loading}
      onClick={handleClick}
      className="bg-white/80 shadow-sm backdrop-blur-sm hover:bg-white disabled:opacity-60"
    >
      <HugeiconsIcon
        icon={FavouriteIcon}
        size={18}
        color={active ? '#ef4444' : 'currentColor'}
        strokeWidth={1.5}
        style={{ fill: active ? '#ef4444' : 'none' }}
      />
    </Button>
  )
}
