import { notFound } from 'next/navigation'
import { getProductBySlug, getProductSlugs } from '@/lib/strapi'
import { ProductGallery } from '@/components/organisms/ProductGallery'
import { ProductInfo } from '@/components/organisms/ProductInfo'
import { Breadcrumb } from '@/components/molecules/Breadcrumb'
import { PolicyCard } from '@/components/molecules/PolicyCard'

export const revalidate = 60

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

  const { title, description, thumbnail, images, warrantyInformation, shippingInformation, returnPolicy, category } = product

  const breadcrumbItems = [
    { label: 'Catálogo', href: '/products' },
    ...(category ? [{ label: category.name, href: `/products?category=${encodeURIComponent(category.name)}` }] : []),
    { label: title },
  ]

  return (
    <main className="mx-auto max-w-7xl px-4 py-10">
      <Breadcrumb items={breadcrumbItems} />

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
        <ProductGallery images={images ?? []} thumbnail={thumbnail} title={title} />
        <ProductInfo product={product} />
      </div>

      {description && (
        <section className="mt-12">
          <h2 className="mb-3 text-lg font-semibold">Descripción</h2>
          <p className="text-gray-600 leading-relaxed">{description}</p>
        </section>
      )}

      {(warrantyInformation || shippingInformation || returnPolicy) && (
        <section className="mt-8 grid gap-4 sm:grid-cols-3">
          {warrantyInformation && <PolicyCard title="Garantía" text={warrantyInformation} icon="🛡️" />}
          {shippingInformation && <PolicyCard title="Envío" text={shippingInformation} icon="🚚" />}
          {returnPolicy && <PolicyCard title="Devoluciones" text={returnPolicy} icon="↩️" />}
        </section>
      )}

      <section className="mt-12 rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-8 text-center text-gray-400">
        <p className="text-sm font-medium">Reseñas</p>
        <p className="mt-1 text-xs">Disponible cuando el backend esté listo.</p>
      </section>
    </main>
  )
}
