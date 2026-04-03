import 'dotenv/config'
import * as dotenvLocal from 'dotenv'
import path from 'node:path'

dotenvLocal.config({ path: path.join(process.cwd(), '.env.local') })

const STRAPI_URL = process.env.STRAPI_URL ?? 'http://localhost:1337'
const STRAPI_TOKEN = process.env.STRAPI_SEED_TOKEN ?? ''

if (!STRAPI_TOKEN) {
  console.error('❌ STRAPI_SEED_TOKEN not found in .env.local')
  process.exit(1)
}

// ─── Utils ───────────────────────────────────────────────────────────────────

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

// ─── Strapi REST helpers ────────────────────────────────────────────────────

async function strapiGet(path: string): Promise<any> {
  const res = await fetch(`${STRAPI_URL}/api${path}`, {
    headers: { Authorization: `Bearer ${STRAPI_TOKEN}` },
  })
  if (!res.ok) throw new Error(`GET ${path} → ${res.status}: ${await res.text()}`)
  return res.json()
}

async function strapiPost(path: string, data: unknown): Promise<any> {
  const res = await fetch(`${STRAPI_URL}/api${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${STRAPI_TOKEN}`,
    },
    body: JSON.stringify({ data }),
  })
  if (!res.ok) throw new Error(`POST ${path} → ${res.status}: ${await res.text()}`)
  return res.json()
}

// ─── Category helpers ────────────────────────────────────────────────────────

const categoryCache = new Map<string, string>() // name → documentId

async function findOrCreateCategory(name: string): Promise<string> {
  if (categoryCache.has(name)) return categoryCache.get(name)!

  const { data } = await strapiGet(
    `/categories?filters[name][$eq]=${encodeURIComponent(name)}`
  )

  if (data.length > 0) {
    categoryCache.set(name, data[0].documentId)
    return data[0].documentId
  }

  const created = await strapiPost('/categories', { name })
  categoryCache.set(name, created.data.documentId)
  console.log(`  📁 Category created: "${name}"`)
  return created.data.documentId
}

// ─── Main seed ───────────────────────────────────────────────────────────────

async function seed() {
  console.log('🌱 Fetching products from DummyJSON...')

  const { products, total } = await fetch(
    'https://dummyjson.com/products?limit=194&skip=0&select=id,title,description,price,discountPercentage,rating,stock,availabilityStatus,brand,sku,thumbnail,images,weight,warrantyInformation,shippingInformation,returnPolicy,minimumOrderQuantity,category,dimensions,meta,tags'
  ).then((r) => r.json())

  console.log(`📦 ${total} products fetched. Starting seed...\n`)

  let created = 0
  let skipped = 0

  for (const product of products) {
    // Check idempotency: skip if externalId already exists
    const { data: existing } = await strapiGet(
      `/products?filters[externalId][$eq]=${product.id}`
    )

    if (existing.length > 0) {
      skipped++
      continue
    }

    const categoryDocumentId = await findOrCreateCategory(product.category)

    await strapiPost('/products', {
      title: product.title,
      slug: slugify(product.title),
      description: product.description,
      price: product.price,
      discountPercentage: product.discountPercentage ?? null,
      rating: product.rating ?? null,
      stock: product.stock ?? null,
      availabilityStatus: product.availabilityStatus ?? null,
      brand: product.brand ?? null,
      sku: product.sku ?? null,
      thumbnail: product.thumbnail ?? null,
      images: product.images ?? [],
      weight: product.weight ?? null,
      warrantyInformation: product.warrantyInformation ?? null,
      shippingInformation: product.shippingInformation ?? null,
      returnPolicy: product.returnPolicy ?? null,
      minimumOrderQuantity: product.minimumOrderQuantity ?? null,
      externalId: product.id,
      dimensions: product.dimensions
        ? {
            width: product.dimensions.width ?? null,
            height: product.dimensions.height ?? null,
            depth: product.dimensions.depth ?? null,
          }
        : null,
      meta: product.meta
        ? {
            barcode: product.meta.barcode ?? null,
            qrCode: product.meta.qrCode ?? null,
          }
        : null,
      category: categoryDocumentId,
      // publishedAt must be set to publish the product (draftAndPublish: true)
      publishedAt: new Date().toISOString(),
    })

    created++
    console.log(`  ✅ [${created}] "${product.title}"`)
  }

  console.log(`\n🎉 Seed complete! Created: ${created} | Skipped (already existed): ${skipped}`)
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err.message)
  process.exit(1)
})
