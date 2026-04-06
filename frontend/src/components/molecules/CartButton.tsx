'use client'

import { useCartStore } from '@/lib/stores'
import { Button } from '@/components/atoms/Button'
import { CountBadge } from '@/components/atoms/CountBadge'
import { HugeiconsIcon } from '@hugeicons/react'
import { ShoppingBasket01Icon } from '@hugeicons/core-free-icons'

export function CartButton() {
  const openCart = useCartStore((s) => s.openCart)
  const count = useCartStore((s) => s.count())
  const isHydrated = useCartStore((s) => s._hasHydrated)

  return (
    <Button variant="icon" aria-label="Abrir carrito" className="relative" onClick={openCart}>
      <HugeiconsIcon icon={ShoppingBasket01Icon} size={20} color="currentColor" strokeWidth={1.5} />
      <CountBadge count={isHydrated ? count : 0} />
    </Button>
  )
}
