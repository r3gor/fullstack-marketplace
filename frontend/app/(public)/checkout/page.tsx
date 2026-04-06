'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { toast } from 'sonner'
import { HugeiconsIcon } from '@hugeicons/react'
import { ShoppingBasket01Icon, ArrowLeft01Icon } from '@hugeicons/core-free-icons'
import { useCartStore } from '@/lib/stores'
import { useAuthStore } from '@/lib/stores'
import { orders } from '@/lib/api'
import { ApiError } from '@/lib/api'

export default function CheckoutPage() {
  const router = useRouter()
  const items = useCartStore((s) => s.items)
  const clearCart = useCartStore((s) => s.clearCart)
  const total = useCartStore((s) => s.total())
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const [loading, setLoading] = useState(false)

  if (items.length === 0) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-24 text-center">
        <HugeiconsIcon icon={ShoppingBasket01Icon} size={64} color="currentColor" strokeWidth={1.5} className="mx-auto text-slate-200 mb-4" />
        <h1 className="text-xl font-bold text-slate-900 mb-2">Tu carrito está vacío</h1>
        <p className="text-sm text-slate-500 mb-6">Agrega productos antes de confirmar un pedido.</p>
        <Link href="/products" className="text-sm font-medium text-cyan-600 hover:text-cyan-500 underline underline-offset-2">
          Explorar productos
        </Link>
      </main>
    )
  }

  async function handleConfirm() {
    if (!isAuthenticated) {
      router.push('/login?redirect=/checkout')
      return
    }

    setLoading(true)
    try {
      const order = await orders.create({
        items: items.map((i) => ({
          product_id: i.productId,
          quantity: i.quantity,
          price_at_purchase: i.price,
        })),
      })
      clearCart()
      toast.success('¡Pedido confirmado!')
      router.push(`/account/orders/${order.id}`)
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Error al crear el pedido. Intenta de nuevo.'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <Link
        href="/products"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors"
      >
        <HugeiconsIcon icon={ArrowLeft01Icon} size={16} color="currentColor" strokeWidth={1.5} />
        Seguir comprando
      </Link>

      <h1 className="mb-6 text-2xl font-bold text-slate-900">Confirmar pedido</h1>

      {/* Items */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden mb-4">
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="font-semibold text-slate-900">Productos ({items.length})</h2>
        </div>
        <ul className="divide-y divide-slate-50">
          {items.map((item) => (
            <li key={item.productId} className="flex items-center gap-4 px-6 py-4">
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                {item.thumbnail && (
                  <Image src={item.thumbnail} alt={item.title} fill sizes="48px" className="object-cover" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="line-clamp-1 text-sm font-medium text-slate-900">{item.title}</p>
                <p className="text-xs text-slate-500">
                  {item.quantity} × ${item.price.toFixed(2)}
                </p>
              </div>
              <p className="shrink-0 font-semibold text-slate-900">
                ${(item.quantity * item.price).toFixed(2)}
              </p>
            </li>
          ))}
        </ul>
      </div>

      {/* Total + CTA */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-500">Total</span>
          <span className="text-xl font-bold text-cyan-600">${total.toFixed(2)}</span>
        </div>

        {!isAuthenticated && (
          <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
            Debes{' '}
            <Link href="/login?redirect=/checkout" className="font-semibold underline underline-offset-2">
              iniciar sesión
            </Link>{' '}
            para confirmar tu pedido.
          </p>
        )}

        <button
          onClick={handleConfirm}
          disabled={loading}
          className="w-full rounded-xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-cyan-600 active:bg-cyan-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Procesando…' : 'Confirmar pedido'}
        </button>
      </div>
    </main>
  )
}
