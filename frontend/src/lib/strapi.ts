const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL ?? 'http://localhost:1337'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface StrapiPagination {
  page: number
  pageSize: number
  pageCount: number
  total: number
}

export interface StrapiCategory {
  id: number
  documentId: string
  name: string
  createdAt: string
  updatedAt: string
}

export interface StrapiDimensions {
  id: number
  width: number | null
  height: number | null
  depth: number | null
}

export interface StrapiMeta {
  id: number
  barcode: string | null
  qrCode: string | null
}

export interface StrapiProduct {
  id: number
  documentId: string
  title: string
  slug: string
  description: string | null
  price: number
  discountPercentage: number | null
  rating: number | null
  stock: number | null
  availabilityStatus: string | null
  brand: string | null
  sku: string | null
  thumbnail: string | null
  images: string[]
  weight: number | null
  warrantyInformation: string | null
  shippingInformation: string | null
  returnPolicy: string | null
  minimumOrderQuantity: number | null
  externalId: number
  createdAt: string
  updatedAt: string
  publishedAt: string
  category: StrapiCategory | null
  dimensions: StrapiDimensions | null
  meta: StrapiMeta | null
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PRODUCT_POPULATE = 'populate[category]=true&populate[dimensions]=true&populate[meta]=true'

function buildUrl(path: string, params?: Record<string, string>): string {
  const base = `${STRAPI_URL}/api${path}`
  if (!params) return base
  const qs = new URLSearchParams(params).toString()
  return `${base}${qs ? `?${qs}` : ''}`
}

// ─── Products ─────────────────────────────────────────────────────────────────

export interface GetProductsParams {
  page?: number
  pageSize?: number
  category?: string
  search?: string
  sort?: string // e.g. 'rating:desc', 'price:asc'
}

export interface GetProductsResult {
  data: StrapiProduct[]
  pagination: StrapiPagination
}

export async function getProducts(params: GetProductsParams = {}): Promise<GetProductsResult> {
  const { page = 1, pageSize = 24, category, search, sort } = params

  let url = `${STRAPI_URL}/api/products?${PRODUCT_POPULATE}`
  url += `&pagination[page]=${page}&pagination[pageSize]=${pageSize}`
  if (category) url += `&filters[category][name][$eq]=${encodeURIComponent(category)}`
  if (search) url += `&filters[title][$containsi]=${encodeURIComponent(search)}`
  if (sort) url += `&sort=${encodeURIComponent(sort)}`

  const res = await fetch(url, { next: { revalidate: 60 } })

  if (!res.ok) throw new Error(`Failed to fetch products: ${res.status}`)

  const json = await res.json()
  return { data: json.data, pagination: json.meta.pagination }
}

export async function getProductBySlug(slug: string): Promise<StrapiProduct | null> {
  const url = `${STRAPI_URL}/api/products?filters[slug][$eq]=${encodeURIComponent(slug)}&${PRODUCT_POPULATE}`

  const res = await fetch(url, { next: { revalidate: 60 } })

  if (!res.ok) throw new Error(`Failed to fetch product: ${res.status}`)

  const json = await res.json()
  return json.data?.[0] ?? null
}

export async function getProductsByIds(ids: number[]): Promise<StrapiProduct[]> {
  if (ids.length === 0) return []

  const filters = ids.map((id, i) => `filters[id][$in][${i}]=${id}`).join('&')
  const url = `${STRAPI_URL}/api/products?${filters}&${PRODUCT_POPULATE}&pagination[pageSize]=${ids.length}`

  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) throw new Error(`Failed to fetch products by ids: ${res.status}`)

  const json = await res.json()
  return json.data ?? []
}

export async function getProductSlugs(): Promise<string[]> {
  const res = await fetch(
    `${STRAPI_URL}/api/products?fields[0]=slug&pagination[pageSize]=200`,
    { next: { revalidate: 3600 } }
  )

  if (!res.ok) throw new Error(`Failed to fetch product slugs: ${res.status}`)

  const json = await res.json()
  return json.data.map((p: Pick<StrapiProduct, 'slug'>) => p.slug)
}

// ─── Categories ───────────────────────────────────────────────────────────────

export async function getCategories(): Promise<StrapiCategory[]> {
  const res = await fetch(`${STRAPI_URL}/api/categories?pagination[pageSize]=100`, {
    next: { revalidate: 3600 },
  })

  if (!res.ok) throw new Error(`Failed to fetch categories: ${res.status}`)

  const json = await res.json()
  return json.data
}

export async function getCategoryNames(): Promise<string[]> {
  const categories = await getCategories()
  return categories.map((c) => c.name)
}
