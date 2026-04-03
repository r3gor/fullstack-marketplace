import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getProductBySlug, getProductSlugs } from '@/lib/strapi'
import { StarRating } from '@/components/atoms/StarRating'
import { PriceDisplay } from '@/components/atoms/PriceDisplay'
import { ProductGallery } from '@/components/organisms/ProductGallery'
import { FavoriteButton } from '@/components/molecules/FavoriteButton'
import { AddToCartButton } from '@/components/molecules/AddToCartButton'

export async function generateStaticParams() {
  const slugs = await getProductSlugs()
  return slugs.map((slug) => ({ slug }))
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const product = await getProductBySlug(slug)

  if (!product) notFound()

  const {
    title,
    description,
    price,
    discountPercentage,
    rating,
    stock,
    availabilityStatus,
    brand,
    sku,
    thumbnail,
    images,
    weight,
    warrantyInformation,
    shippingInformation,
    returnPolicy,
    category,
    dimensions,
  } = product

  const inStock = availabilityStatus?.toLowerCase() !== 'out of stock'

  return (
    <main className="mx-auto max-w-7xl px-4 py-10">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-gray-500">
        <Link href="/products" className="hover:text-gray-900">Catálogo</Link>
        {category && (
          <>
            <span>/</span>
            <Link
              href={`/products?category=${encodeURIComponent(category.name)}`}
              className="capitalize hover:text-gray-900"
            >
              {category.name}
            </Link>
          </>
        )}
        <span>/</span>
        <span className="line-clamp-1 text-gray-900">{title}</span>
      </nav>

      {/* Main grid */}
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
        {/* Gallery */}
        <ProductGallery images={images ?? []} thumbnail={thumbnail} title={title} />

        {/* Info */}
        <div className="flex flex-col gap-4">
          {category && (
            <Link
              href={`/products?category=${encodeURIComponent(category.name)}`}
              className="w-fit rounded-full bg-indigo-50 px-3 py-0.5 text-xs font-semibold uppercase tracking-wide text-indigo-600 hover:bg-indigo-100 capitalize"
            >
              {category.name}
            </Link>
          )}

          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">{title}</h1>

          {rating != null && <StarRating rating={rating} showValue size="md" />}

          <PriceDisplay price={price} discountPercentage={discountPercentage} className="text-xl" />

          {/* Stock status */}
          <div className="flex items-center gap-2 text-sm">
            <span className={`h-2 w-2 rounded-full ${inStock ? 'bg-green-500' : 'bg-red-400'}`} />
            <span className={inStock ? 'text-green-700' : 'text-red-600'}>
              {inStock ? `En stock${stock ? ` · ${stock} disponibles` : ''}` : 'Sin stock'}
            </span>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <div className="flex-1">
              <AddToCartButton documentId={product.documentId} title={title} disabled={!inStock} />
            </div>
            <FavoriteButton documentId={product.documentId} />
          </div>

          {/* Meta */}
          <dl className="mt-2 divide-y divide-gray-100 rounded-xl border border-gray-100 text-sm">
            {brand && <DetailRow label="Marca" value={brand} />}
            {sku && <DetailRow label="SKU" value={sku} />}
            {weight != null && <DetailRow label="Peso" value={`${weight} kg`} />}
            {dimensions && (
              <DetailRow
                label="Dimensiones"
                value={[dimensions.width, dimensions.height, dimensions.depth]
                  .filter(Boolean)
                  .join(' × ') + ' cm'}
              />
            )}
          </dl>
        </div>
      </div>

      {/* Description */}
      {description && (
        <section className="mt-12">
          <h2 className="mb-3 text-lg font-semibold">Descripción</h2>
          <p className="text-gray-600 leading-relaxed">{description}</p>
        </section>
      )}

      {/* Policies */}
      {(warrantyInformation || shippingInformation || returnPolicy) && (
        <section className="mt-8 grid gap-4 sm:grid-cols-3">
          {warrantyInformation && (
            <PolicyCard title="Garantía" text={warrantyInformation} icon="🛡️" />
          )}
          {shippingInformation && (
            <PolicyCard title="Envío" text={shippingInformation} icon="🚚" />
          )}
          {returnPolicy && (
            <PolicyCard title="Devoluciones" text={returnPolicy} icon="↩️" />
          )}
        </section>
      )}

      {/* Reviews placeholder */}
      <section className="mt-12 rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-8 text-center text-gray-400">
        <p className="text-sm font-medium">Reseñas</p>
        <p className="mt-1 text-xs">Disponible cuando el backend esté listo.</p>
      </section>
    </main>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between px-4 py-2">
      <dt className="text-gray-500">{label}</dt>
      <dd className="font-medium text-gray-900">{value}</dd>
    </div>
  )
}

function PolicyCard({ title, text, icon }: { title: string; text: string; icon: string }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-4">
      <p className="mb-1 font-medium">
        <span className="mr-1">{icon}</span>
        {title}
      </p>
      <p className="text-sm text-gray-500">{text}</p>
    </div>
  )
}
