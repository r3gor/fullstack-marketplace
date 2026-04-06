import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { notFound, redirect } from 'next/navigation'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowLeft01Icon } from '@hugeicons/core-free-icons'
import { getOrder } from '@/lib/dal'
import { getProductsByIds } from '@/lib/strapi'
import { OrderStatusBadge } from '@/components/molecules/OrderStatusBadge'
import type { StrapiProduct } from '@/lib/strapi'

export const metadata: Metadata = { title: 'Detalle del pedido' }

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

interface Props {
  params: Promise<{ id: string }>
}

export default async function OrderDetailPage({ params }: Props) {
  const { id } = await params

  let order
  try {
    order = await getOrder(id)
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes('401')) redirect('/login')
    notFound()
  }

  const productIds = order.items.map((i) => i.product_id)
  const products = await getProductsByIds(productIds)
  const productMap = new Map<number, StrapiProduct>(products.map((p) => [p.id, p]))

  return (
    <div className="flex flex-col gap-6">
      {/* Back + header */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <Link
          href="/account/orders"
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors"
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} size={16} color="currentColor" strokeWidth={1.5} />
          Volver a mis pedidos
        </Link>

        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              Pedido{' '}
              <span className="font-mono text-base text-slate-500">
                #{order.id.slice(0, 8).toUpperCase()}
              </span>
            </h1>
            <p className="mt-1 text-sm text-slate-500">{formatDate(order.created_at)}</p>
          </div>
          <OrderStatusBadge status={order.status} />
        </div>
      </div>

      {/* Items */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="font-semibold text-slate-900">
            Productos ({order.items.length})
          </h2>
        </div>

        <ul className="divide-y divide-slate-50">
          {order.items.map((item) => {
            const product = productMap.get(item.product_id)
            return (
              <li key={item.id} className="flex items-center gap-4 px-6 py-4">
                {/* Thumbnail */}
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                  {product?.thumbnail && (
                    <Image
                      src={product.thumbnail}
                      alt={product.title}
                      fill
                      sizes="56px"
                      className="object-cover"
                    />
                  )}
                </div>

                {/* Title + product_id fallback */}
                <div className="flex-1 min-w-0">
                  {product ? (
                    <Link
                      href={`/products/${product.slug}`}
                      className="line-clamp-2 text-sm font-medium text-slate-900 hover:text-cyan-600 transition-colors"
                    >
                      {product.title}
                    </Link>
                  ) : (
                    <p className="text-sm text-slate-500">Producto #{item.product_id}</p>
                  )}
                  <p className="mt-0.5 text-xs text-slate-400">
                    Qty: {item.quantity} · ${item.price_at_purchase.toFixed(2)} c/u
                  </p>
                </div>

                {/* Subtotal */}
                <p className="shrink-0 font-semibold text-slate-900">
                  ${(item.quantity * item.price_at_purchase).toFixed(2)}
                </p>
              </li>
            )
          })}
        </ul>
      </div>

      {/* Total */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-500">Subtotal</span>
          <span className="font-medium text-slate-700">${order.total_amount.toFixed(2)}</span>
        </div>
        <div className="my-3 border-t border-slate-100" />
        <div className="flex items-center justify-between">
          <span className="font-semibold text-slate-900">Total</span>
          <span className="text-lg font-bold text-cyan-600">${order.total_amount.toFixed(2)}</span>
        </div>
      </div>
    </div>
  )
}
