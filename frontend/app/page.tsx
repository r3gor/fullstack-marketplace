import { getProducts } from '@/lib/strapi'
import { ProductCard } from '@/components/molecules/ProductCard'

export default async function Home() {
  const { data: products, pagination } = await getProducts({ pageSize: 24 })

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <div className="mb-6 flex items-baseline justify-between">
        <h1 className="text-2xl font-bold">Productos</h1>
        <span className="text-sm text-gray-500">{pagination.total} productos</span>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.documentId} product={product} />
        ))}
      </div>
    </div>
  )
}

