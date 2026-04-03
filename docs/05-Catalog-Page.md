# 🛍️ Catálogo de Productos — `/products`

> Implementación de la página de catálogo con ISR + filtros client-side vía URL search params.

---

## 📋 Resumen

| Aspecto | Decisión |
|---------|----------|
| Ruta | `/products` |
| Rendering | ISR (`revalidate: 60`) |
| Fuente de datos | Strapi (`getProducts`, `getCategories`) |
| Filtros | Client Components que modifican URL params |
| Paginación | URL-driven (`?page=N`) |
| Page size | 24 productos por página |

---

## 🏗️ Arquitectura de la página

```
app/products/page.tsx  (Server Component — ISR)
  │
  ├── Lee searchParams: { category?, page? }
  ├── getCategories()   → ISR 1h  (para el filtro)
  ├── getProducts({ category, page, pageSize: 24 })  → ISR 60s
  │
  ├── <ProductFilters categories={categories} />   ← Client Component
  ├── <div className="grid ...">
  │     {products.map(p => <ProductCard product={p} />)}  ← Server Component
  │   </div>
  └── <Pagination pagination={pagination} />        ← Client Component
```

---

## 🔄 Flujo de filtrado

```
Usuario hace click en categoría "beauty"
  → ProductFilters → router.push('/products?category=beauty')
  → Next.js renderiza page.tsx con searchParams.category = "beauty"
  → getProducts({ category: 'beauty', page: 1 }) → Strapi
  → Grid se re-renderiza con productos filtrados
```

Los filtros son **URL-driven** — esto permite:
- URLs compartibles/bookmarkeables
- Back/forward del browser funciona correctamente
- SEO básico (Google puede indexar `/products?category=beauty`)

---

## 🧩 Componentes Nuevos

### `organisms/ProductFilters.tsx` (Client Component)

**Atomic Design:** Organism — compone múltiples elementos interactivos

**Responsabilidad:** Mostrar los chips de categorías y gestionar la selección activa.

**Props:**
```ts
interface ProductFiltersProps {
  categories: StrapiCategory[]
}
```

**Comportamiento:**
- Botón "Todos" → limpia `?category` de la URL
- Botón de categoría → `router.push('/products?category=slug')`
- Highlight visual en la categoría activa (lee `useSearchParams()`)
- Al cambiar categoría, resetea la página a 1

---

### `molecules/Pagination.tsx` (Client Component)

**Atomic Design:** Molecule — combina átomos (botones, texto)

**Props:**
```ts
interface PaginationProps {
  pagination: {
    page: number
    pageSize: number
    pageCount: number
    total: number
  }
}
```

**Comportamiento:**
- Botones ← anterior / siguiente →
- Números de página (máximo 5 visibles)
- Texto "Mostrando X-Y de Z productos"
- Actualiza `?page=N` con `router.push` preservando otros params

---

## 📝 `app/products/page.tsx`

```ts
// Server Component — ISR
export const revalidate = 60

interface SearchParams {
  category?: string
  page?: string
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const page = Number(searchParams.page) || 1
  const category = searchParams.category

  const [products, categories] = await Promise.all([
    getProducts({ category, page, pageSize: 24 }),
    getCategories(),
  ])

  return (
    <main>
      <h1>Catálogo</h1>
      <ProductFilters categories={categories} />
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {products.data.map((product) => (
          <ProductCard key={product.documentId} product={product} />
        ))}
      </div>
      <Pagination pagination={products.meta.pagination} />
    </main>
  )
}
```

---

## 🔧 Cambios en `lib/strapi.ts`

Actualizar `getProducts()` para aceptar filtros:

```ts
interface GetProductsOptions {
  category?: string   // slug de la categoría
  page?: number
  pageSize?: number
}

export async function getProducts(options: GetProductsOptions = {})
```

El fetch a Strapi incluirá:
- `filters[category][slug][$eq]=beauty` (si hay categoría)
- `pagination[page]=2` (si hay página)
- `pagination[pageSize]=24`

---

## 📐 Diseño visual

```
┌─────────────────────────────────────────────────────────┐
│  Catálogo de Productos                                   │
│                                                         │
│  [ Todos ] [ Beauty ] [ Electronics ] [ Furniture ] ... │
│                                          ← filtros →    │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                  │
│  │ Card │ │ Card │ │ Card │ │ Card │                  │
│  └──────┘ └──────┘ └──────┘ └──────┘                  │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                  │
│  │ Card │ │ Card │ │ Card │ │ Card │                  │
│  └──────┘ └──────┘ └──────┘ └──────┘                  │
│                                                         │
│  Mostrando 1-24 de 91 productos                        │
│              [ 1 ] [ 2 ] [ 3 ] →                       │
└─────────────────────────────────────────────────────────┘
```

---

## 📋 TODOs de implementación

1. Actualizar `getProducts()` en `lib/strapi.ts` para soportar filtros y paginación
2. Crear `src/components/organisms/ProductFilters.tsx`
3. Crear `src/components/molecules/Pagination.tsx`
4. Crear `app/products/page.tsx` con ISR + Server Component
5. Verificar que el build pasa y la página funciona
