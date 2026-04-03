import Link from 'next/link'
import type { StrapiCategory } from '@/lib/strapi'

// Fixed gradient palette — one per category index (cycles if more than 8)
const GRADIENTS = [
  'from-cyan-500 to-blue-600',
  'from-violet-500 to-purple-700',
  'from-rose-500 to-pink-600',
  'from-amber-400 to-orange-500',
  'from-emerald-500 to-teal-600',
  'from-sky-400 to-cyan-600',
  'from-fuchsia-500 to-rose-500',
  'from-lime-400 to-emerald-500',
]

interface CategoryCardProps {
  category: StrapiCategory
  colorIndex: number
}

export function CategoryCard({ category, colorIndex }: CategoryCardProps) {
  const gradient = GRADIENTS[colorIndex % GRADIENTS.length]

  return (
    <Link
      href={`/products?category=${encodeURIComponent(category.name)}`}
      className={`group relative flex h-28 items-end overflow-hidden rounded-2xl bg-gradient-to-br ${gradient} p-4 shadow-sm transition-transform hover:-translate-y-1 hover:shadow-md`}
    >
      {/* Subtle pattern overlay */}
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_70%_20%,white,transparent_60%)]" />

      <span className="relative z-10 text-sm font-semibold capitalize text-white drop-shadow">
        {category.name}
      </span>

      {/* Arrow indicator */}
      <span className="absolute right-3 top-3 text-white/60 transition-transform group-hover:translate-x-0.5 group-hover:text-white">
        →
      </span>
    </Link>
  )
}
