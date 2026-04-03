import { getProducts } from '@/src/lib/strapi'

export default async function Home() {
  const { data: products, pagination } = await getProducts({ pageSize: 10 })

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="mb-2 text-2xl font-bold">Productos desde Strapi</h1>
      <p className="mb-6 text-sm text-gray-500">
        Total: {pagination.total} productos — mostrando {products.length}
      </p>
      <pre className="overflow-auto rounded-lg bg-gray-900 p-6 text-xs text-green-400">
        {JSON.stringify(products, null, 2)}
      </pre>
    </div>
  )
}

