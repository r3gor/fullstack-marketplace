'use client'

import { Button } from '@/components/atoms/Button'
import { CountBadge } from '@/components/atoms/CountBadge'

// Placeholder: cart count will come from Zustand store in future iteration
const cartCount = 0

export function CartButton() {
  return (
    <Button variant="icon" aria-label="Abrir carrito" className="relative">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="9" cy="21" r="1" />
        <circle cx="20" cy="21" r="1" />
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
      </svg>
      <CountBadge count={cartCount} />
    </Button>
  )
}
