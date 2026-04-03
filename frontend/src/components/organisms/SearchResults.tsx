'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import { getProducts } from '@/lib/strapi'
import type { StrapiProduct } from '@/lib/strapi'
import { ProductCard } from '@/components/molecules/ProductCard'

const DEBOUNCE_MS = 350

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debounced
}

export function SearchResults() {
  const searchParams = useSearchParams()
  const rawQuery = searchParams.get('q') ?? ''
  const query = useDebounce(rawQuery, DEBOUNCE_MS)

  const [products, setProducts] = useState<StrapiProduct[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  const search = useCallback(async (q: string) => {
    if (!q.trim()) {
      setProducts([])
      setTotal(0)
      setSearched(false)
      return
    }
    setLoading(true)
    try {
      const result = await getProducts({ search: q, pageSize: 24 })
      setProducts(result.data)
      setTotal(result.pagination.total)
      setSearched(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    search(query)
  }, [query, search])

  if (!rawQuery.trim()) {
    return (
      <div className="py-24 text-center text-slate-400">
        <p className="text-4xl">🔍</p>
        <p className="mt-3 text-sm">Escribe algo para buscar productos</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="py-24 text-center text-slate-400">
        <p className="text-sm">Buscando...</p>
      </div>
    )
  }

  if (searched && products.length === 0) {
    return (
      <div className="py-24 text-center text-slate-400">
        <p className="text-4xl">😕</p>
        <p className="mt-3 text-sm">
          No encontramos productos para{' '}
          <span className="font-semibold text-slate-700">&ldquo;{query}&rdquo;</span>
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {searched && (
        <p className="text-sm text-slate-500">
          {total} resultado{total !== 1 ? 's' : ''} para{' '}
          <span className="font-semibold text-slate-900">&ldquo;{query}&rdquo;</span>
        </p>
      )}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.documentId} product={product} />
        ))}
      </div>
    </div>
  )
}
