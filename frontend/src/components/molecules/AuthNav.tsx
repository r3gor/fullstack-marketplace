'use client'

import Link from 'next/link'
import { Button } from '@/components/atoms/Button'

// Placeholder: auth state will come from Zustand store in future iteration
const isAuthenticated = false

export function AuthNav() {
  if (isAuthenticated) {
    return (
      <Button variant="icon" aria-label="Mi cuenta">
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
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      </Button>
    )
  }

  return (
    <Link href="/login">
      <Button variant="primary" size="sm">
        Iniciar sesión
      </Button>
    </Link>
  )
}
