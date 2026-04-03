'use client'

import { Button } from '@/components/atoms/Button'

interface AddToCartButtonProps {
  documentId: string
  title: string
  disabled?: boolean
}

export function AddToCartButton({ documentId: _documentId, title: _title, disabled }: AddToCartButtonProps) {
  return (
    <Button
      variant="primary"
      className="w-full"
      disabled={disabled}
      onClick={() => {
        // TODO: connect to Zustand cart store
        console.log('add to cart:', _documentId)
      }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
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
      Agregar al carrito
    </Button>
  )
}
