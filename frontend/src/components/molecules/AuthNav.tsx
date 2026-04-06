'use client'

import Link from 'next/link'
import { HugeiconsIcon } from '@hugeicons/react'
import { UserCircleIcon } from '@hugeicons/core-free-icons'
import { Button } from '@/components/atoms/Button'
import { useAuthStore } from '@/lib/stores'

export function AuthNav() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  if (isAuthenticated) {
    return (
      <Link href="/account" aria-label="Mi cuenta">
        <Button variant="icon">
          <HugeiconsIcon icon={UserCircleIcon} size={20} color="currentColor" strokeWidth={1.5} />
        </Button>
      </Link>
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
