import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { HugeiconsIcon } from '@hugeicons/react'
import { PackageIcon } from '@hugeicons/core-free-icons'
import { getOrders } from '@/lib/dal'
import { OrderStatusBadge } from '@/components/molecules/OrderStatusBadge'

export const metadata: Metadata = { title: 'Mis pedidos' }

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export default async function OrdersPage() {
  let orders
  try {
    orders = await getOrders()
  } catch {
    redirect('/login')
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">Mis pedidos</h1>
        <p className="mt-1 text-sm text-slate-500">
          {orders.length === 0
            ? 'Aún no has realizado ningún pedido.'
            : `${orders.length} pedido${orders.length !== 1 ? 's' : ''} en total`}
        </p>
      </div>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
          <HugeiconsIcon icon={PackageIcon} size={48} color="currentColor" strokeWidth={1.5} className="text-slate-300" />
          <p className="text-base font-medium text-slate-500">Todavía no tienes pedidos</p>
          <Link href="/products" className="text-sm font-medium text-cyan-600 hover:text-cyan-500 underline underline-offset-2">
            Explorar productos
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                <th className="pb-3 pr-4">Pedido</th>
                <th className="pb-3 pr-4">Fecha</th>
                <th className="pb-3 pr-4">Items</th>
                <th className="pb-3 pr-4">Total</th>
                <th className="pb-3 pr-4">Estado</th>
                <th className="pb-3 text-right">Detalle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {orders.map((order) => (
                <tr key={order.id} className="group hover:bg-slate-50 transition-colors">
                  <td className="py-3.5 pr-4 font-mono text-xs text-slate-500">
                    #{order.id.slice(0, 8).toUpperCase()}
                  </td>
                  <td className="py-3.5 pr-4 text-slate-700">
                    {formatDate(order.created_at)}
                  </td>
                  <td className="py-3.5 pr-4 text-slate-700">
                    {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                  </td>
                  <td className="py-3.5 pr-4 font-semibold text-slate-900">
                    ${order.total_amount.toFixed(2)}
                  </td>
                  <td className="py-3.5 pr-4">
                    <OrderStatusBadge status={order.status} />
                  </td>
                  <td className="py-3.5 text-right">
                    <Link
                      href={`/account/orders/${order.id}`}
                      className="text-xs font-medium text-cyan-600 hover:text-cyan-500 underline underline-offset-2"
                    >
                      Ver detalle →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
