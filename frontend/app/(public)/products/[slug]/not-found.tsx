import Link from 'next/link'

export default function ProductNotFound() {
  return (
    <main className="mx-auto flex max-w-7xl flex-col items-center justify-center px-4 py-32 text-center">
      <p className="text-6xl">🔍</p>
      <h1 className="mt-4 text-2xl font-bold text-gray-900">Producto no encontrado</h1>
      <p className="mt-2 text-gray-500">
        El producto que buscas no existe o fue eliminado.
      </p>
      <Link
        href="/products"
        className="mt-6 rounded-full bg-gray-900 px-6 py-2.5 text-sm font-medium text-white hover:bg-gray-700 transition-colors"
      >
        Volver al catálogo
      </Link>
    </main>
  )
}
