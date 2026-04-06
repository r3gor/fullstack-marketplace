'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { HugeiconsIcon } from '@hugeicons/react'
import { FavouriteIcon } from '@hugeicons/core-free-icons'
import { Button } from '@/components/atoms/Button'
import { useAuthStore } from '@/lib/stores'
import { favorites, ApiError } from '@/lib/api'

interface FavoriteButtonProps {
  productId: number
  isFavorite?: boolean
}

export function FavoriteButton({ productId, isFavorite = false }: FavoriteButtonProps) {
  const router = useRouter()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const isHydrated = useAuthStore((s) => s._hasHydrated)
  const [active, setActive] = useState(isFavorite)
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    if (!isHydrated) return

    if (!isAuthenticated) {
      toast.info('Inicia sesión para guardar favoritos')
      router.push('/login')
      return
    }

    const next = !active
    setActive(next) // optimistic

    setLoading(true)
    try {
      if (next) {
        await favorites.add(productId)
      } else {
        await favorites.remove(productId)
      }
    } catch (err) {
      setActive(!next) // revert
      const message = err instanceof ApiError ? err.message : 'Error al actualizar favoritos'
      toast.error(message)
    } finally {
      setLoading(false)
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
