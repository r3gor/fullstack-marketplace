import { getCategories } from '@/lib/strapi'
import { CategoryCard } from '@/components/molecules/CategoryCard'

export const revalidate = 3600

export const metadata = {
  title: 'Categorías | FS ECommerce',
  description: 'Explora todos los productos por categoría.',
}

export default async function CategoriesPage() {
  const categories = await getCategories()

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">
        Categorías
        <span className="ml-2 text-base font-normal text-slate-500">
          · {categories.length} categorías
        </span>
      </h1>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {categories.map((category, index) => (
          <CategoryCard key={category.documentId} category={category} colorIndex={index} />
        ))}
      </div>
    </main>
  )
}
