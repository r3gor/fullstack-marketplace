'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'
import type { StrapiPagination } from '@/lib/strapi'
import { getVisiblePages } from '@/lib/pagination'

interface PaginationProps {
  pagination: StrapiPagination
}

export function Pagination({ pagination }: PaginationProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { page, pageSize, pageCount, total } = pagination

  const goToPage = useCallback(
    (target: number) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set('page', String(target))
      router.push(`/products?${params.toString()}`)
    },
    [router, searchParams],
  )

  if (pageCount <= 1) return null

  const start = (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, total)

  const visiblePages = getVisiblePages(page, pageCount)
  const firstVisible = visiblePages[0]
  const lastVisible = visiblePages[visiblePages.length - 1]

  const btnBase =
    'inline-flex h-9 w-9 items-center justify-center rounded-md text-sm font-medium transition-colors'
  const btnActive = 'bg-gray-900 text-white'
  const btnIdle = 'bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed'

  return (
    <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
      <p className="text-sm text-gray-500">
        Mostrando {start}–{end} de {total} productos
      </p>

      <div className="flex items-center gap-1">
        <button
          onClick={() => goToPage(page - 1)}
          disabled={page <= 1}
          className={`${btnBase} ${btnIdle} px-3`}
          aria-label="Página anterior"
        >
          ←
        </button>

        {firstVisible > 1 && (
          <>
            <button onClick={() => goToPage(1)} className={`${btnBase} ${btnIdle}`}>
              1
            </button>
            {firstVisible > 2 && <span className="px-1 text-gray-400">…</span>}
          </>
        )}

        {visiblePages.map((n) => (
          <button
            key={n}
            onClick={() => goToPage(n)}
            className={`${btnBase} ${n === page ? btnActive : btnIdle}`}
            aria-current={n === page ? 'page' : undefined}
          >
            {n}
          </button>
        ))}

        {lastVisible < pageCount && (
          <>
            {lastVisible < pageCount - 1 && <span className="px-1 text-gray-400">…</span>}
            <button onClick={() => goToPage(pageCount)} className={`${btnBase} ${btnIdle}`}>
              {pageCount}
            </button>
          </>
        )}

        <button
          onClick={() => goToPage(page + 1)}
          disabled={page >= pageCount}
          className={`${btnBase} ${btnIdle} px-3`}
          aria-label="Página siguiente"
        >
          →
        </button>
      </div>
    </div>
  )
}
