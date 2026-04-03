import Link from 'next/link'
import { getProducts } from '@/lib/strapi'
import { ProductCard } from '@/components/molecules/ProductCard'

export async function FeaturedProducts() {
  const { data: products } = await getProducts({ pageSize: 8, sort: 'rating:desc' })

  if (products.length === 0) return null

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      {/* Section header */}
      <div className="mb-8 flex items-end justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-cyan-600">
            Lo mejor del catálogo
          </p>
          <h2 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
            Productos Destacados
          </h2>
        </div>
        <Link
          href="/products"
          className="hidden text-sm font-medium text-cyan-600 hover:text-cyan-500 sm:block"
        >
          Ver todos →
        </Link>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.documentId} product={product} />
        ))}
      </div>

      {/* Mobile "Ver todos" */}
      <div className="mt-8 text-center sm:hidden">
        <Link
          href="/products"
          className="text-sm font-medium text-cyan-600 hover:text-cyan-500"
        >
          Ver todos los productos →
        </Link>
      </div>
    </section>
  )
}
