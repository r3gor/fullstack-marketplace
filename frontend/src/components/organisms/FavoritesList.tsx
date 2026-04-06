'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { HugeiconsIcon } from '@hugeicons/react'
import { Delete02Icon, ShoppingCartAdd02Icon } from '@hugeicons/core-free-icons'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { favorites } from '@/lib/api'
import type { StrapiProduct } from '@/lib/strapi'
import type { FavoriteResponse } from '@/lib/api/types'

interface Props {
  favs: FavoriteResponse[]
  products: StrapiProduct[]
}

export function FavoritesList({ favs, products }: Props) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [removing, setRemoving] = useState<number | null>(null)

  const productMap = new Map(products.map((p) => [p.id, p]))

  async function handleRemove(productId: number) {
    setRemoving(productId)
    try {
      await favorites.remove(productId)
      toast.success('Eliminado de favoritos')
      startTransition(() => router.refresh())
    } catch {
      toast.error('No se pudo eliminar. Intenta de nuevo.')
    } finally {
      setRemoving(null)
    }
  }

  if (favs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
        <HugeiconsIcon icon={ShoppingCartAdd02Icon} size={48} color="currentColor" strokeWidth={1.5} className="text-slate-300" />
        <p className="text-base font-medium text-slate-500">No tienes productos favoritos aún</p>
        <Link href="/products">
          <Button variant="outline" size="sm">Explorar productos</Button>
        </Link>
      </div>
    )
  }

  return (
    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {favs.map(({ product_id }) => {
        const product = productMap.get(product_id)
        if (!product) return null

        return (
          <li key={product_id} className="group flex flex-col rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm transition-shadow hover:shadow-md">
            <Link href={`/products/${product.slug}`} className="relative block aspect-video overflow-hidden bg-slate-100">
              {product.thumbnail && (
                <Image
                  src={product.thumbnail}
                  alt={product.title}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
              )}
            </Link>

            <div className="flex flex-1 flex-col gap-2 p-4">
              <Link href={`/products/${product.slug}`} className="line-clamp-2 text-sm font-semibold text-slate-900 hover:text-cyan-600 transition-colors">
                {product.title}
              </Link>

              <p className="text-base font-bold text-cyan-600">
                ${product.price.toFixed(2)}
              </p>

              <div className="mt-auto pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full gap-1.5 text-rose-500 hover:bg-rose-50 hover:text-rose-600"
                  disabled={removing === product_id}
                  onClick={() => handleRemove(product_id)}
                >
                  <HugeiconsIcon icon={Delete02Icon} size={16} color="currentColor" strokeWidth={1.5} />
                  {removing === product_id ? 'Eliminando…' : 'Quitar de favoritos'}
                </Button>
              </div>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
