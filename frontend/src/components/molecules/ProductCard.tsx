import Image from 'next/image'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { StarRating } from '@/components/atoms/StarRating'
import { PriceDisplay } from '@/components/atoms/PriceDisplay'
import { FavoriteButton } from '@/components/molecules/FavoriteButton'
import { AddToCartButton } from '@/components/molecules/AddToCartButton'
import type { StrapiProduct } from '@/lib/strapi'

interface ProductCardProps {
  product: StrapiProduct
  isFavorite?: boolean
}

export function ProductCard({ product, isFavorite = false }: ProductCardProps) {
  const { title, slug, price, discountPercentage, rating, thumbnail, availabilityStatus, category } = product
  const outOfStock = availabilityStatus?.toLowerCase() === 'out of stock'

  return (
    <Card className="group/card flex flex-col overflow-hidden rounded-2xl p-0 shadow-sm transition-shadow hover:shadow-md">
      {/* Image */}
      <div className="relative aspect-square w-full overflow-hidden bg-gray-50">
        <Link href={`/products/${slug}`} tabIndex={-1}>
          {thumbnail ? (
            <Image
              src={thumbnail}
              alt={title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              className="object-cover transition-transform duration-300 group-hover/card:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-gray-300">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
            </div>
          )}
        </Link>

        {/* Discount badge */}
        {discountPercentage && discountPercentage > 0 ? (
          <span className="absolute left-2 top-2 rounded-full bg-red-500 px-2 py-0.5 text-xs font-semibold text-white">
            -{Math.round(discountPercentage)}%
          </span>
        ) : null}

        {/* Out of stock overlay */}
        {outOfStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-[1px]">
            <span className="rounded-full bg-gray-800 px-3 py-1 text-xs font-semibold text-white">
              Sin stock
            </span>
          </div>
        )}

        {/* Favorite button */}
        <div className="absolute right-2 top-2">
          <FavoriteButton documentId={product.documentId} isFavorite={isFavorite} />
        </div>
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        {/* Category */}
        {category && (
          <span className="text-xs font-medium uppercase tracking-wide text-cyan-600">
            {category.name}
          </span>
        )}

        {/* Title */}
        <Link href={`/products/${slug}`} className="hover:text-cyan-600">
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-gray-800">
            {title}
          </h3>
        </Link>

        {/* Rating */}
        {rating != null && (
          <StarRating rating={rating} />
        )}

        {/* Price */}
        <PriceDisplay
          price={price}
          discountPercentage={discountPercentage}
          className="mt-auto pt-1"
        />

        {/* Add to cart */}
        <AddToCartButton documentId={product.documentId} title={title} />
      </div>
    </Card>
  )
}
