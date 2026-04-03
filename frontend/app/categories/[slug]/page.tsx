import { notFound } from 'next/navigation'
import { getProducts, getCategories, getCategoryNames } from '@/lib/strapi'
import { ProductCard } from '@/components/molecules/ProductCard'
import { Breadcrumb } from '@/components/molecules/Breadcrumb'
import { Pagination } from '@/components/molecules/Pagination'

export const revalidate = 60

export async function generateStaticParams() {
  const names = await getCategoryNames()
  return names.map((name) => ({ slug: encodeURIComponent(name) }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const name = decodeURIComponent(slug)
  return {
    title: `${name.charAt(0).toUpperCase() + name.slice(1)} | FS ECommerce`,
    description: `Explora los mejores productos de ${name}.`,
  }
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ page?: string }>
}) {
  const [{ slug }, { page: pageParam }] = await Promise.all([params, searchParams])
  const categoryName = decodeURIComponent(slug)
  const page = Number(pageParam) || 1

  const [{ data: products, pagination }, categories] = await Promise.all([
    getProducts({ category: categoryName, page, pageSize: 24 }),
    getCategories(),
  ])

  // Verify this category actually exists
  const categoryExists = categories.some(
    (c) => c.name.toLowerCase() === categoryName.toLowerCase(),
  )
  if (!categoryExists) notFound()

  const breadcrumbItems = [
    { label: 'Catálogo', href: '/products' },
    { label: categoryName },
  ]

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 space-y-6">
      <Breadcrumb items={breadcrumbItems} />

      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-bold capitalize text-slate-900">
          {categoryName}
          <span className="ml-2 text-base font-normal text-slate-500">
            · {pagination.total} productos
          </span>
        </h1>
      </div>

      {products.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.documentId} product={product} />
          ))}
        </div>
      ) : (
        <div className="py-20 text-center text-slate-500">
          No hay productos en esta categoría.
        </div>
      )}

      <Pagination pagination={pagination} />
    </main>
  )
}
