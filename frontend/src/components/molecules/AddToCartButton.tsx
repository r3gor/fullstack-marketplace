'use client'

import { useCartStore } from '@/lib/stores'
import { Button } from '@/components/atoms/Button'
import { HugeiconsIcon } from '@hugeicons/react'
import { ShoppingCartAdd02Icon } from '@hugeicons/core-free-icons'

interface AddToCartButtonProps {
  productId: number
  title: string
  price: number
  thumbnail: string | null
  disabled?: boolean
}

export function AddToCartButton({ productId, title, price, thumbnail, disabled }: AddToCartButtonProps) {
  const addItem = useCartStore((s) => s.addItem)
  const openCart = useCartStore((s) => s.openCart)

  function handleClick() {
    addItem({ productId, title, price, thumbnail: thumbnail ?? '' })
    openCart()
  }

  return (
    <Button
      variant="primary"
      className="w-full"
      disabled={disabled}
      onClick={handleClick}
    >
      <HugeiconsIcon icon={ShoppingCartAdd02Icon} size={16} color="currentColor" strokeWidth={1.5} />
      Agregar al carrito
    </Button>
  )
}
