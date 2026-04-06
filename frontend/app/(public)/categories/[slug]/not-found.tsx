import Link from 'next/link'

export default function CategoryNotFound() {
  return (
    <main className="mx-auto flex max-w-7xl flex-col items-center justify-center px-4 py-32 text-center">
      <p className="text-6xl">🗂️</p>
      <h1 className="mt-4 text-2xl font-bold text-slate-900">Categoría no encontrada</h1>
      <p className="mt-2 text-slate-500">
        La categoría que buscas no existe o fue eliminada.
      </p>
      <Link
        href="/products"
        className="mt-6 rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-medium text-white hover:bg-slate-700 transition-colors"
      >
        Ver todos los productos
      </Link>
    </main>
  )
}
