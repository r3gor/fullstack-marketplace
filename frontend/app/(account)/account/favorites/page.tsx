import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getFavorites } from '@/lib/dal'
import { getProductsByIds } from '@/lib/strapi'
import { FavoritesList } from '@/components/organisms/FavoritesList'

export const metadata: Metadata = { title: 'Mis favoritos' }

export default async function FavoritesPage() {
  let favs
  try {
    favs = await getFavorites()
  } catch {
    redirect('/login')
  }

  const products = await getProductsByIds(favs.map((f) => f.product_id))

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">Mis favoritos</h1>
        <p className="mt-1 text-sm text-slate-500">
          {favs.length === 0
            ? 'Aún no has guardado ningún producto.'
            : `${favs.length} producto${favs.length !== 1 ? 's' : ''} guardado${favs.length !== 1 ? 's' : ''}`}
        </p>
      </div>

      <FavoritesList favs={favs} products={products} />
    </div>
  )
}
