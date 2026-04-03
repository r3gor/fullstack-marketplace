import Link from 'next/link'
import { StarRating } from '@/components/atoms/StarRating'
import { PriceDisplay } from '@/components/atoms/PriceDisplay'
import { StockBadge } from '@/components/atoms/StockBadge'
import { AddToCartButton } from '@/components/molecules/AddToCartButton'
import { FavoriteButton } from '@/components/molecules/FavoriteButton'
import type { StrapiProduct } from '@/lib/strapi'

interface ProductInfoProps {
  product: StrapiProduct
}

export function ProductInfo({ product }: ProductInfoProps) {
  const {
    documentId,
    title,
    price,
    discountPercentage,
    rating,
    stock,
    availabilityStatus,
    brand,
    sku,
    weight,
    dimensions,
    category,
  } = product

  const inStock = availabilityStatus?.toLowerCase() !== 'out of stock'

  return (
    <div className="flex flex-col gap-4">
      {/* Category chip */}
      {category && (
        <Link
          href={`/products?category=${encodeURIComponent(category.name)}`}
          className="w-fit rounded-full bg-cyan-50 px-3 py-0.5 text-xs font-semibold uppercase tracking-wide text-cyan-600 hover:bg-cyan-100 transition-colors capitalize"
        >
          {category.name}
        </Link>
      )}

      {/* Title */}
      <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">{title}</h1>

      {/* Rating */}
      {rating != null && <StarRating rating={rating} showValue size="md" />}

      {/* Price */}
      <PriceDisplay price={price} discountPercentage={discountPercentage} className="text-xl" />

      {/* Stock */}
      <StockBadge availabilityStatus={availabilityStatus} stock={stock} />

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <div className="flex-1">
          <AddToCartButton documentId={documentId} title={title} disabled={!inStock} />
        </div>
        <FavoriteButton documentId={documentId} />
      </div>

      {/* Meta table */}
      <dl className="mt-2 divide-y divide-gray-100 rounded-xl border border-gray-100 text-sm">
        {brand && <MetaRow label="Marca" value={brand} />}
        {sku && <MetaRow label="SKU" value={sku} />}
        {weight != null && <MetaRow label="Peso" value={`${weight} kg`} />}
        {dimensions && (
          <MetaRow
            label="Dimensiones"
            value={
              [dimensions.width, dimensions.height, dimensions.depth]
                .filter(Boolean)
                .join(' × ') + ' cm'
            }
          />
        )}
      </dl>
    </div>
  )
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between px-4 py-2">
      <dt className="text-gray-500">{label}</dt>
      <dd className="font-medium text-gray-900">{value}</dd>
    </div>
  )
}
