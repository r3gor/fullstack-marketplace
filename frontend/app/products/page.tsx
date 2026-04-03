import { Suspense } from 'react'
import { getProducts, getCategories } from '@/lib/strapi'
import { ProductCard } from '@/components/molecules/ProductCard'
import { ProductFilters } from '@/components/organisms/ProductFilters'
import { Pagination } from '@/components/molecules/Pagination'

export const revalidate = 60

interface SearchParams {
  category?: string
  page?: string
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const { category, page: pageParam } = await searchParams
  const page = Number(pageParam) || 1

  const [{ data: products, pagination }, categories] = await Promise.all([
    getProducts({ category, page, pageSize: 24 }),
    getCategories(),
  ])

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 space-y-6">
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-bold">
          {category ? (
            <>
              <span className="capitalize">{category}</span>
              <span className="ml-2 text-base font-normal text-gray-500">· {pagination.total} productos</span>
            </>
          ) : (
            <>Catálogo <span className="ml-2 text-base font-normal text-gray-500">· {pagination.total} productos</span></>
          )}
        </h1>
      </div>

      <Suspense>
        <ProductFilters categories={categories} />
      </Suspense>

      {products.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.documentId} product={product} />
          ))}
        </div>
      ) : (
        <div className="py-20 text-center text-gray-500">
          No hay productos en esta categoría.
        </div>
      )}

      <Suspense>
        <Pagination pagination={pagination} />
      </Suspense>
    </main>
  )
}
