'use client'

import { useState } from 'react'
import { Button } from '@/components/atoms/Button'

interface FavoriteButtonProps {
  documentId: string
  isFavorite?: boolean
}

export function FavoriteButton({ documentId: _documentId, isFavorite = false }: FavoriteButtonProps) {
  const [active, setActive] = useState(isFavorite)

  return (
    <Button
      variant="icon"
      aria-label={active ? 'Quitar de favoritos' : 'Agregar a favoritos'}
      onClick={() => setActive((prev) => !prev)}
      className="bg-white/80 shadow-sm backdrop-blur-sm hover:bg-white"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        width="18"
        height="18"
        fill={active ? '#ef4444' : 'none'}
        stroke={active ? '#ef4444' : 'currentColor'}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    </Button>
  )
}
