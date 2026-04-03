'use client'

import { Button } from '@/components/atoms/Button'

// Placeholder: CartDrawer logic (open/close, items) will be wired to Zustand store in future iteration

export function CartDrawer() {
  return (
    <>
      {/* Overlay — hidden until cart is open */}
      <div className="hidden fixed inset-0 z-50 bg-black/40" aria-hidden="true" />

      {/* Drawer panel */}
      <div
        role="dialog"
        aria-label="Carrito de compras"
        className="hidden fixed inset-y-0 right-0 z-50 w-full max-w-sm flex-col bg-white shadow-xl sm:flex"
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-4">
          <h2 className="text-lg font-semibold">Tu carrito</h2>
          <Button variant="icon" aria-label="Cerrar carrito">
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
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </Button>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center gap-3 text-gray-400">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="9" cy="21" r="1" />
            <circle cx="20" cy="21" r="1" />
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
          </svg>
          <p className="text-sm">Tu carrito está vacío</p>
        </div>
      </div>
    </>
  )
}
