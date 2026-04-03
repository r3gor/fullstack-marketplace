import { getCategories } from '@/lib/strapi'
import { CategoryCard } from '@/components/molecules/CategoryCard'

export async function FeaturedCategories() {
  const categories = await getCategories()

  if (categories.length === 0) return null

  return (
    <section
      id="categories"
      className="bg-gray-50 py-16"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-cyan-600">
            Explora por categoría
          </p>
          <h2 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
            ¿Qué estás buscando?
          </h2>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {categories.map((category, index) => (
            <CategoryCard key={category.documentId} category={category} colorIndex={index} />
          ))}
        </div>
      </div>
    </section>
  )
}
