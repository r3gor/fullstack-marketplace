'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'
import type { StrapiCategory } from '@/lib/strapi'

interface ProductFiltersProps {
  categories: StrapiCategory[]
}

export function ProductFilters({ categories }: ProductFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const activeCategory = searchParams.get('category')

  const applyFilter = useCallback(
    (category: string | null) => {
      const params = new URLSearchParams(searchParams.toString())
      if (category) {
        params.set('category', category)
      } else {
        params.delete('category')
      }
      params.delete('page') // reset to page 1 when category changes
      router.push(`/products?${params.toString()}`)
    },
    [router, searchParams],
  )

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        onClick={() => applyFilter(null)}
        className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
          !activeCategory
            ? 'bg-slate-950 text-white ring-2 ring-cyan-500'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
      >
        Todos
      </button>

      {categories.map((cat) => (
        <button
          key={cat.documentId}
          onClick={() => applyFilter(cat.name)}
          className={`rounded-full px-4 py-1.5 text-sm font-medium capitalize transition-colors ${
            activeCategory === cat.name
              ? 'bg-slate-950 text-white ring-2 ring-cyan-500'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {cat.name}
        </button>
      ))}
    </div>
  )
}
