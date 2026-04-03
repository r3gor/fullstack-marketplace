# 🔍 Detalle de Producto — `/products/[slug]`

> Implementación de la página de detalle con SSR, galería de imágenes interactiva y generación estática de rutas.

---

## 📋 Resumen

| Aspecto | Decisión |
|---------|----------|
| Ruta | `/products/[slug]` |
| Rendering | SSR (`cache: 'no-store'`) |
| `generateStaticParams` | Sí — pre-genera slugs al build, con fallback dinámico |
| Fuente de datos | Strapi (`getProductBySlug`, `getProductSlugs`) |
| Reviews | Placeholder (Backend no existe aún) |
| Not found | `notFound()` si el slug no existe en Strapi |

> **¿Por qué SSR y no ISR?** El detalle de producto necesita datos frescos: stock, precio y disponibilidad cambian frecuentemente. Un usuario que ve "En stock" debe ver la realidad actual.

---

## 🏗️ Arquitectura de la página

```
app/products/[slug]/page.tsx  (Server Component — SSR)
  │
  ├── generateStaticParams() → getProductSlugs() (ISR 1h en build)
  ├── getProductBySlug(slug) → fetch a Strapi (no-store)
  ├── notFound() si el producto no existe
  │
  ├── Layout: 2 columnas en desktop (galería | info)
  │
  ├── col izquierda:
  │     └── <ProductGallery images={images} thumbnail={thumbnail} />  ← Client
  │
  └── col derecha:
        ├── Breadcrumb: Catálogo → Categoría → Título
        ├── Categoría (chip enlazado a /products?category=X)
        ├── Título, StarRating, PriceDisplay
        ├── <AddToCartButton /> + <FavoriteButton />  ← ya existen (Client)
        ├── Stock badge + disponibilidad
        ├── Descripción
        ├── Detalles técnicos (brand, SKU, weight, dimensions)
        └── Políticas (warranty, shipping, return)
```

---

## 🧩 Componente Nuevo

### `organisms/ProductGallery.tsx` (Client Component)

**Responsabilidad:** Mostrar la imagen principal grande + miniaturas clickeables para cambiar la imagen activa.

**Props:**
```ts
interface ProductGalleryProps {
  images: string[]       // array de URLs (de Strapi)
  thumbnail: string | null
  title: string          // para alt text
}
```

**Comportamiento:**
- Estado local: `activeImage` (URL de la imagen mostrada)
- Inicializa con `thumbnail` si existe, sino `images[0]`
- Click en miniatura → actualiza `activeImage`
- Imagen principal con `next/image` + `fill` en contenedor fijo
- Miniaturas en fila horizontal con borde activo
- Si no hay imágenes: placeholder SVG

---

## 📝 `app/products/[slug]/page.tsx`

```ts
// ISR en build, SSR en runtime
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

  return (
    <main className="mx-auto max-w-7xl px-4 py-10">
      {/* Breadcrumb */}
      {/* Grid 2 columnas */}
      {/* ProductGallery | Info block */}
      {/* Descripción completa */}
      {/* Detalles técnicos */}
      {/* Reviews placeholder */}
    </main>
  )
}
```

---

## 📐 Diseño visual

```
┌─────────────────────────────────────────────────────────────┐
│  ← Catálogo  /  Electronics  /  iPhone 15 Pro              │
│                                                             │
│  ┌─────────────────────┐  ┌─────────────────────────────┐  │
│  │                     │  │  electronics                 │  │
│  │   Imagen principal  │  │  iPhone 15 Pro               │  │
│  │      (grande)       │  │  ★★★★½  (4.5)               │  │
│  │                     │  │                             │  │
│  │ [img1][img2][img3]  │  │  $999   ~~$1099~~  -9%      │  │
│  └─────────────────────┘  │                             │  │
│                           │  [Agregar al carrito]  [♥]  │  │
│                           │                             │  │
│                           │  ✅ En stock · 5 units      │  │
│                           │  Marca: Apple               │  │
│                           │  SKU: A3292                 │  │
│                           └─────────────────────────────┘  │
│                                                             │
│  Descripción                                                │
│  Lorem ipsum...                                             │
│                                                             │
│  Envíos y devoluciones                                      │
│  Dimensiones y peso                                         │
│                                                             │
│  ─── Reseñas ────────────────── [Backend pendiente] ──────  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔧 `not-found.tsx`

Crear `app/products/[slug]/not-found.tsx` con mensaje amigable y link de vuelta al catálogo.

---

## ♻️ Refactor: Aplicar Atomic Design correctamente

La primera implementación de `page.tsx` tenía dos antipatrones:
- `DetailRow` y `PolicyCard` como funciones locales anónimas — no son componentes propios
- Toda la columna derecha (categoría, título, rating, precio, stock, acciones, meta) inline — debería ser un Organism

### Componentes a extraer

```
Atoms (nuevo):
  StockBadge.tsx         → dot coloreado + texto de disponibilidad

Molecules (nuevos):
  Breadcrumb.tsx         → trail de navegación reutilizable en todo el sitio
  PolicyCard.tsx         → tarjeta individual de política (warranty/shipping/return)

Organisms (nuevo):
  ProductInfo.tsx        → columna derecha entera (Server Component)
                           recibe product: StrapiProduct y renderiza todo el bloque
```

### `page.tsx` resultante (limpio)

```tsx
export default async function ProductDetailPage({ params }) {
  const product = await getProductBySlug(slug)

  return (
    <main>
      <Breadcrumb items={[...]} />

      <div className="grid ...">
        <ProductGallery ... />
        <ProductInfo product={product} />
      </div>

      {description && <section>...</section>}

      <section className="grid sm:grid-cols-3">
        <PolicyCard title="Garantía" text={warrantyInformation} icon="🛡️" />
        <PolicyCard title="Envío" text={shippingInformation} icon="🚚" />
        <PolicyCard title="Devoluciones" text={returnPolicy} icon="↩️" />
      </section>

      {/* Reviews placeholder */}
    </main>
  )
}
```

### `ProductInfo` como Organism

```tsx
// organisms/ProductInfo.tsx — Server Component
// Props: product: StrapiProduct
// Renderiza:
//   - CategoryChip (Link a /products?category=X)
//   - h1 título
//   - StarRating
//   - PriceDisplay
//   - StockBadge  ← nuevo atom
//   - div acciones: AddToCartButton + FavoriteButton
//   - dl tabla meta: Marca, SKU, Peso, Dimensiones
```

## 📋 TODOs de implementación

### Primera implementación (commit 6e3160d — completado)
1. ✅ Crear `src/components/organisms/ProductGallery.tsx` (Client)
2. ✅ Crear `app/products/[slug]/page.tsx` con `generateStaticParams` + SSR
3. ✅ Crear `app/products/[slug]/not-found.tsx`

### Refactor Atomic Design (pendiente)
4. Crear `src/components/atoms/StockBadge.tsx`
5. Crear `src/components/molecules/Breadcrumb.tsx`
6. Crear `src/components/molecules/PolicyCard.tsx`
7. Crear `src/components/organisms/ProductInfo.tsx`
8. Refactorizar `app/products/[slug]/page.tsx` para usar los nuevos componentes
