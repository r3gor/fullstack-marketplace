import { Suspense } from 'react'
import { SearchResults } from '@/components/organisms/SearchResults'

export const metadata = {
  title: 'Búsqueda | FS ECommerce',
}

export default function SearchPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-10 space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Resultados de búsqueda</h1>
      <Suspense
        fallback={
          <div className="py-24 text-center text-slate-400">
            <p className="text-sm">Cargando...</p>
          </div>
        }
      >
        <SearchResults />
      </Suspense>
    </main>
  )
}
