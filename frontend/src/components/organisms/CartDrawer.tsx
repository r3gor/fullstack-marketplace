'use client'

import Image from 'next/image'
import Link from 'next/link'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  ShoppingBasket01Icon,
  Add01Icon,
  MinusSignIcon,
  Delete02Icon,
} from '@hugeicons/core-free-icons'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { useCartStore } from '@/lib/stores'

export function CartDrawer() {
  const isOpen = useCartStore((s) => s.isOpen)
  const closeCart = useCartStore((s) => s.closeCart)
  const items = useCartStore((s) => s.items)
  const removeItem = useCartStore((s) => s.removeItem)
  const updateQuantity = useCartStore((s) => s.updateQuantity)
  const total = useCartStore((s) => s.total())

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && closeCart()}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-sm">
        <SheetHeader className="border-b border-slate-100 px-5 py-4">
          <SheetTitle className="flex items-center gap-2 text-base font-semibold text-slate-900">
            <HugeiconsIcon icon={ShoppingBasket01Icon} size={18} color="currentColor" strokeWidth={1.5} />
            Tu carrito
            {items.length > 0 && (
              <span className="ml-1 rounded-full bg-cyan-100 px-2 py-0.5 text-xs font-bold text-cyan-700">
                {items.reduce((s, i) => s + i.quantity, 0)}
              </span>
            )}
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-5 text-center">
            <HugeiconsIcon icon={ShoppingBasket01Icon} size={48} color="currentColor" strokeWidth={1.5} className="text-slate-200" />
            <p className="text-sm font-medium text-slate-500">Tu carrito está vacío</p>
            <Link
                href="/products"
                onClick={closeCart}
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Explorar productos
              </Link>
          </div>
        ) : (
          <>
            {/* Item list */}
            <ul className="flex-1 overflow-y-auto divide-y divide-slate-50 px-5">
              {items.map((item) => (
                <li key={item.productId} className="flex gap-3 py-4">
                  {/* Thumbnail */}
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                    {item.thumbnail && (
                      <Image
                        src={item.thumbnail}
                        alt={item.title}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex flex-1 flex-col gap-1.5 min-w-0">
                    <p className="line-clamp-2 text-sm font-medium text-slate-900 leading-snug">
                      {item.title}
                    </p>
                    <p className="text-sm font-bold text-cyan-600">${item.price.toFixed(2)}</p>

                    {/* Qty controls */}
                    <div className="flex items-center gap-2 mt-auto">
                      <button
                        aria-label="Reducir cantidad"
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        className="flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:border-slate-400 hover:text-slate-700 transition-colors"
                      >
                        <HugeiconsIcon icon={MinusSignIcon} size={12} color="currentColor" strokeWidth={2} />
                      </button>
                      <span className="w-6 text-center text-sm font-semibold text-slate-700">
                        {item.quantity}
                      </span>
                      <button
                        aria-label="Aumentar cantidad"
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        className="flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:border-slate-400 hover:text-slate-700 transition-colors"
                      >
                        <HugeiconsIcon icon={Add01Icon} size={12} color="currentColor" strokeWidth={2} />
                      </button>

                      <button
                        aria-label="Eliminar producto"
                        onClick={() => removeItem(item.productId)}
                        className="ml-auto text-slate-400 hover:text-rose-500 transition-colors"
                      >
                        <HugeiconsIcon icon={Delete02Icon} size={16} color="currentColor" strokeWidth={1.5} />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            {/* Footer */}
            <div className="border-t border-slate-100 px-5 py-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Total estimado</span>
                <span className="text-lg font-bold text-slate-900">${total.toFixed(2)}</span>
              </div>

              <Link
                href="/checkout"
                onClick={closeCart}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-cyan-600 active:bg-cyan-700 transition-colors"
              >
                Confirmar pedido →
              </Link>

              <button
                onClick={closeCart}
                className="w-full text-center text-sm text-slate-500 hover:text-slate-700 transition-colors"
              >
                Seguir comprando
              </button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
