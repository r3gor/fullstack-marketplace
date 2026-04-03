# 🏠 Landing Page — `/`

> Página de entrada SSG con Hero, productos destacados y categorías. Sin revalidación automática — datos de Strapi al momento del build.

---

## 📋 Resumen

| Aspecto | Decisión |
|---------|----------|
| Ruta | `/` (homepage) |
| Rendering | SSG (`revalidate = false`) |
| Fuente de datos | Strapi — productos por rating + categorías |
| Reemplaza | `app/page.tsx` actual (grid simple) |

> **¿Por qué SSG y no ISR?** El contenido de la landing cambia raramente — nuevas campañas, featured products editados manualmente en Strapi. No necesita frescura automática; se regenera en cada deploy.

---

## 🧩 Atomic Design Breakdown

```
Molecules (nuevos):
  CategoryCard         → tarjeta visual de categoría con gradiente + link

Organisms (nuevos):
  HeroSection          → Server Component, sin datos, 100% estático
  FeaturedProducts     → Server Component, top 8 productos por rating
  FeaturedCategories   → Server Component, todas las categorías
  PromoBanner          → Server Component, banner estático
```

---

## 📐 Layout de la página

```
┌─────────────────────────────────────────────────────────┐
│                      <HeroSection>                       │
│  "Tu tienda de confianza"                               │
│  "Encuentra los mejores productos..."                   │
│  [Ver catálogo]  [Ver categorías]                       │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                   <FeaturedProducts>                     │
│  Productos Destacados                → [Ver todos]      │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                  │
│  │ Card │ │ Card │ │ Card │ │ Card │  (top 8 rating)  │
│  └──────┘ └──────┘ └──────┘ └──────┘                  │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                  <FeaturedCategories>                    │
│  Explora por categoría                                  │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐          │
│  │Beauty  │ │Electro │ │Furnitur│ │Sports  │          │
│  │Gradient│ │Gradient│ │Gradient│ │Gradient│          │
│  └────────┘ └────────┘ └────────┘ └────────┘          │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                     <PromoBanner>                        │
│  "Envíos gratis en compras +$50  · Devoluciones 30 días"│
└─────────────────────────────────────────────────────────┘
```

---

## 🧩 Detalle de componentes

### `molecules/CategoryCard.tsx` (Server Component)
- Props: `category: StrapiCategory`, `colorIndex: number`
- Gradiente de color basado en índice (paleta fija de 8 colores)
- Link a `/products?category={name}`
- Nombre de categoría capitalizado

### `organisms/HeroSection.tsx` (Server Component)
- 100% estático, sin props de datos
- Headline + subheadline
- Dos CTAs: `<Link href="/products">` + `<Link href="#categories">`
- Fondo con gradiente suave

### `organisms/FeaturedProducts.tsx` (Server Component)
- Llama `getProducts({ pageSize: 8, sort: 'rating:desc' })`
- Section header "Productos Destacados" + link "Ver todos →"
- Grid 2×4 de `<ProductCard />`

### `organisms/FeaturedCategories.tsx` (Server Component)
- Llama `getCategories()`
- Section header "Explora por categoría"
- Grid de `<CategoryCard />` con id="categories"

### `organisms/PromoBanner.tsx` (Server Component)
- 100% estático, sin datos
- Tres iconos + textos de beneficios (envío gratis, devoluciones, soporte)

---

## 🔧 Cambios en `lib/strapi.ts`

Agregar parámetro `sort` a `getProducts()`:

```ts
export interface GetProductsParams {
  page?: number
  pageSize?: number
  category?: string
  search?: string
  sort?: string  // ← nuevo: e.g. 'rating:desc'
}
```

---

## 📋 TODOs de implementación

1. Agregar `sort` a `GetProductsParams` y `getProducts()` en `lib/strapi.ts`
2. Crear `src/components/molecules/CategoryCard.tsx`
3. Crear `src/components/organisms/HeroSection.tsx`
4. Crear `src/components/organisms/FeaturedProducts.tsx`
5. Crear `src/components/organisms/FeaturedCategories.tsx`
6. Crear `src/components/organisms/PromoBanner.tsx`
7. Reemplazar `app/page.tsx` con landing page SSG
8. Build + commit
