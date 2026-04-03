# 🟣 Strapi CMS — Guía de Implementación

> Basado en `01-ProjectDefinition.md`. Strapi actúa como Headless CMS para gestionar el catálogo de productos.

---

## ¿Qué es Strapi y cómo encaja en el proyecto?

```
Next.js (Frontend)  →  Strapi (CMS)       →  SQLite (dev) / PostgreSQL (prod)
                    →  Backend propio      →  PostgreSQL
```

Strapi es un **Headless CMS**. Significa que:
- Gestiona el **contenido** (productos, categorías, imágenes)
- Expone una **REST API automáticamente** — sin escribir código de endpoints
- Tiene un **panel admin visual** en `http://localhost:1337/admin`
- El frontend consume esa API igual que cualquier otra API REST

### Responsabilidad en este proyecto

| Strapi gestiona ✅ | Strapi NO gestiona ❌ |
|-------------------|----------------------|
| Products | Users |
| Categories | Orders |
| Tags | Payments |
| Images / Media | Reviews de usuarios reales |
| Contenido editorial | Lógica de negocio |

---

## Paso 1 — Instalar Strapi

```bash
# Desde la raíz del monorepo
npx create-strapi@latest strapi --skip-cloud --typescript --use-npm --no-run --no-git-init --no-example --skip-db
```

El instalador preguntará:
- `Install dependencies` → **Yes**
- `Participate in anonymous A/B testing` → **No**

Resultado: carpeta `strapi/` con el proyecto Strapi 5 + TypeScript listo.

### Base de datos

| Entorno | DB | Configuración |
|---------|-----|--------------|
| Desarrollo local | **SQLite** | Sin configuración extra — funciona por defecto |
| Staging / Producción | **PostgreSQL** | Cambiar variables de entorno (ver abajo) |

> ✅ SQLite → PostgreSQL es un cambio de `.env` — no hay que reescribir código.

---

## Paso 2 — Variables de entorno

### Desarrollo (SQLite) — `strapi/.env`

```env
HOST=0.0.0.0
PORT=1337
APP_KEYS=              # generado automáticamente por Strapi
API_TOKEN_SALT=        # generado automáticamente
ADMIN_JWT_SECRET=      # generado automáticamente
TRANSFER_TOKEN_SALT=   # generado automáticamente
JWT_SECRET=            # generado automáticamente
```

SQLite no necesita variables de DB — Strapi crea el archivo `.tmp/data.db` por defecto.

### Producción (PostgreSQL) — variables adicionales

```env
DATABASE_CLIENT=postgres
DATABASE_HOST=127.0.0.1
DATABASE_PORT=5432
DATABASE_NAME=ecommerce_strapi
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=yourpassword
DATABASE_SSL=false
```

---

## Paso 3 — Levantar Strapi en desarrollo

```bash
cd strapi && npm run develop
```

- Admin panel: `http://localhost:1337/admin`
- Crear tu usuario administrador la primera vez
- En modo `develop` el **Content-Type Builder** está habilitado
- En modo `start` (producción) los Content Types son de solo lectura

---

## Paso 4 — Content Types por código (no via admin UI)

Strapi guarda los Content Types como **archivos JSON en el repositorio**. El admin UI es solo un editor visual que genera esos archivos. Crearlos en código tiene ventajas:

> ✅ Versionables en git · ✅ Sin configuración manual por entorno · ✅ Reproducibles

### Estructura de archivos

```
strapi/src/
├── api/
│   ├── product/
│   │   ├── content-types/product/schema.json
│   │   ├── controllers/product.ts
│   │   ├── routes/product.ts
│   │   └── services/product.ts
│   ├── category/
│   │   ├── content-types/category/schema.json
│   │   ├── controllers/category.ts
│   │   ├── routes/category.ts
│   │   └── services/category.ts
│   └── tag/
│       ├── content-types/tag/schema.json
│       ├── controllers/tag.ts
│       ├── routes/tag.ts
│       └── services/tag.ts
└── components/
    └── product/
        ├── dimensions.json
        └── meta.json
```

Los archivos `controllers`, `routes` y `services` usan el contenido mínimo que Strapi provee por defecto (re-exportan los defaults del core).

---

### `schema.json` — Category

```json
{
  "kind": "collectionType",
  "collectionName": "categories",
  "info": {
    "singularName": "category",
    "pluralName": "categories",
    "displayName": "Category"
  },
  "options": { "draftAndPublish": false },
  "attributes": {
    "name": { "type": "string", "required": true, "unique": true }
  }
}
```

---

### `schema.json` — Tag

```json
{
  "kind": "collectionType",
  "collectionName": "tags",
  "info": {
    "singularName": "tag",
    "pluralName": "tags",
    "displayName": "Tag"
  },
  "options": { "draftAndPublish": false },
  "attributes": {
    "name": { "type": "string", "required": true, "unique": true }
  }
}
```

---

### `schema.json` — Product (completo)

```json
{
  "kind": "collectionType",
  "collectionName": "products",
  "info": {
    "singularName": "product",
    "pluralName": "products",
    "displayName": "Product"
  },
  "options": { "draftAndPublish": true },
  "attributes": {
    "title": { "type": "string", "required": true },
    "slug": { "type": "uid", "targetField": "title", "required": true },
    "description": { "type": "text" },
    "price": { "type": "decimal", "required": true },
    "discountPercentage": { "type": "decimal" },
    "rating": { "type": "decimal" },
    "stock": { "type": "integer" },
    "availabilityStatus": { "type": "string" },
    "brand": { "type": "string" },
    "sku": { "type": "string", "unique": true },
    "thumbnail": { "type": "string" },
    "images": { "type": "json" },
    "weight": { "type": "decimal" },
    "warrantyInformation": { "type": "text" },
    "shippingInformation": { "type": "text" },
    "returnPolicy": { "type": "text" },
    "minimumOrderQuantity": { "type": "integer" },
    "externalId": { "type": "integer", "unique": true },
    "dimensions": {
      "type": "component",
      "repeatable": false,
      "component": "product.dimensions"
    },
    "meta": {
      "type": "component",
      "repeatable": false,
      "component": "product.meta"
    },
    "category": {
      "type": "relation",
      "relation": "manyToOne",
      "target": "api::category.category",
      "inversedBy": "products"
    },
    "tags": {
      "type": "relation",
      "relation": "manyToMany",
      "target": "api::tag.tag"
    }
  }
}
```

---

### Component: `dimensions.json`

```json
{
  "collectionName": "components_product_dimensions",
  "info": { "displayName": "Dimensions", "icon": "expand" },
  "attributes": {
    "width": { "type": "decimal" },
    "height": { "type": "decimal" },
    "depth": { "type": "decimal" }
  }
}
```

### Component: `meta.json`

```json
{
  "collectionName": "components_product_metas",
  "info": { "displayName": "Meta", "icon": "information" },
  "attributes": {
    "barcode": { "type": "string" },
    "qrCode": { "type": "string" }
  }
}
```

---

### Controllers / Routes / Services (contenido mínimo)

Cada API necesita estos 3 archivos. Usan los defaults del core de Strapi:

```ts
// controllers/product.ts
import { factories } from '@strapi/strapi'
export default factories.createCoreController('api::product.product')

// routes/product.ts
import { factories } from '@strapi/strapi'
export default factories.createCoreRouter('api::product.product')

// services/product.ts
import { factories } from '@strapi/strapi'
export default factories.createCoreService('api::product.product')
```

---

## Paso 5 — Configurar permisos de la API pública

Por defecto, la API de Strapi es privada. Para que Next.js pueda consumirla sin token:

### Opción A — Via admin panel (una sola vez)
**Settings → Users & Permissions → Roles → Public:**
- `product`: habilitar `find` y `findOne`
- `category`: habilitar `find` y `findOne`
- `tag`: habilitar `find`

### Opción B — Via bootstrap script (recomendado para reproducibilidad)

```ts
// strapi/src/index.ts
export default {
  async bootstrap({ strapi }: { strapi: any }) {
    const publicRole = await strapi.db
      .query('plugin::users-permissions.role')
      .findOne({ where: { type: 'public' } })

    if (!publicRole) return

    const permissions = [
      { action: 'api::product.product.find' },
      { action: 'api::product.product.findOne' },
      { action: 'api::category.category.find' },
      { action: 'api::category.category.findOne' },
      { action: 'api::tag.tag.find' },
    ]

    for (const perm of permissions) {
      const existing = await strapi.db
        .query('plugin::users-permissions.permission')
        .findOne({ where: { ...perm, role: publicRole.id } })

      if (!existing) {
        await strapi.db
          .query('plugin::users-permissions.permission')
          .create({ data: { ...perm, role: publicRole.id, enabled: true } })
      }
    }
  },
}
```

---

## Paso 6 — Script de Seed desde DummyJSON

El seed usa la **REST API de Strapi** (nunca la BD directamente). Esto garantiza:
- Validación de datos por Strapi
- Generación correcta de `documentId`, `slug` y relaciones
- Portabilidad a cualquier entorno

### Prerequisito: crear un API Token en Strapi

**Admin → Settings → API Tokens → Create new token:**
- Name: `seed-token`
- Type: `Full access`
- Copiar el token generado

### Script: `strapi/scripts/seed-products.ts`

```ts
const STRAPI_URL = process.env.STRAPI_URL ?? 'http://localhost:1337'
const STRAPI_TOKEN = process.env.STRAPI_API_TOKEN ?? ''

async function strapiRequest(path: string, options: RequestInit = {}) {
  const res = await fetch(`${STRAPI_URL}/api${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${STRAPI_TOKEN}`,
      ...(options.headers ?? {}),
    },
  })
  if (!res.ok) throw new Error(`Strapi error: ${res.status} ${await res.text()}`)
  return res.json()
}

async function findOrCreateCategory(name: string): Promise<string> {
  const existing = await strapiRequest(`/categories?filters[name][$eq]=${encodeURIComponent(name)}`)
  if (existing.data.length > 0) return existing.data[0].documentId

  const created = await strapiRequest('/categories', {
    method: 'POST',
    body: JSON.stringify({ data: { name } }),
  })
  return created.data.documentId
}

async function seed() {
  console.log('🌱 Fetching products from DummyJSON...')
  const { products } = await fetch('https://dummyjson.com/products?limit=100').then(r => r.json())

  for (const product of products) {
    // Verificar si ya existe (idempotente)
    const existing = await strapiRequest(
      `/products?filters[externalId][$eq]=${product.id}`
    )
    if (existing.data.length > 0) {
      console.log(`⏭️  Skip: "${product.title}" (externalId=${product.id})`)
      continue
    }

    const categoryDocumentId = await findOrCreateCategory(product.category)

    await strapiRequest('/products', {
      method: 'POST',
      body: JSON.stringify({
        data: {
          title: product.title,
          description: product.description,
          price: product.price,
          discountPercentage: product.discountPercentage,
          rating: product.rating,
          stock: product.stock,
          availabilityStatus: product.availabilityStatus,
          brand: product.brand,
          sku: product.sku,
          thumbnail: product.thumbnail,
          images: product.images,
          weight: product.weight,
          warrantyInformation: product.warrantyInformation,
          shippingInformation: product.shippingInformation,
          returnPolicy: product.returnPolicy,
          minimumOrderQuantity: product.minimumOrderQuantity,
          externalId: product.id,
          category: categoryDocumentId,
          dimensions: product.dimensions,
          meta: { barcode: product.meta?.barcode, qrCode: product.meta?.qrCode },
        },
      }),
    })

    console.log(`✅ Created: "${product.title}"`)
  }

  console.log('🎉 Seed completed!')
}

seed().catch(console.error)
```

### Ejecutar el seed

```bash
cd strapi
STRAPI_API_TOKEN=xxxx npx ts-node --esm scripts/seed-products.ts
```

---

## Paso 7 — Consumir la API desde Next.js

### Formato de respuesta de Strapi v5

```json
GET /api/products?populate=category

{
  "data": [
    {
      "id": 1,
      "documentId": "hgv1vny5cebq2l3czil1rpb3",
      "title": "iPhone X",
      "price": 899.00,
      "slug": "iphone-x",
      "category": {
        "id": 1,
        "documentId": "abc123",
        "name": "smartphones"
      }
    }
  ],
  "meta": {
    "pagination": { "page": 1, "pageSize": 25, "pageCount": 4, "total": 100 }
  }
}
```

> ⚠️ Strapi 5 usa `documentId` (string) en lugar de `id` (integer) para consultas. Usar `documentId` en todas las rutas dinámicas.

### Cliente en Next.js: `frontend/src/lib/strapi.ts`

```ts
const STRAPI_URL = process.env.STRAPI_URL ?? 'http://localhost:1337'

export async function getProducts(params?: {
  page?: number
  pageSize?: number
  category?: string
}) {
  const qs = new URLSearchParams({
    'populate': 'category',
    'pagination[page]': String(params?.page ?? 1),
    'pagination[pageSize]': String(params?.pageSize ?? 25),
    ...(params?.category ? { 'filters[category][name][$eq]': params.category } : {}),
  })

  const res = await fetch(`${STRAPI_URL}/api/products?${qs}`, {
    next: { revalidate: 60 },
  })
  return res.json()
}

export async function getProductBySlug(slug: string) {
  const res = await fetch(
    `${STRAPI_URL}/api/products?filters[slug][$eq]=${slug}&populate=category,tags`,
    { cache: 'no-store' } // SSR — no cachear (reviews dinámicas)
  )
  return res.json()
}

export async function getCategories() {
  const res = await fetch(`${STRAPI_URL}/api/categories`, {
    next: { revalidate: 3600 },
  })
  return res.json()
}
```

---

## 📋 Resumen de pasos

| # | Paso | Cómo |
|---|------|------|
| 1 | Instalar Strapi | `npx create-strapi@latest strapi --skip-cloud --typescript` |
| 2 | Configurar .env | SQLite para dev (sin variables de BD) |
| 3 | Levantar en dev | `cd strapi && npm run develop` → crear admin user |
| 4 | Content Types | Crear `schema.json` en código (versionado en git) |
| 5 | Permisos | Bootstrap script en `strapi/src/index.ts` o una vez via admin |
| 6 | Seed | Script `seed-products.ts` vía REST API + API Token |
| 7 | Consumo | `frontend/src/lib/strapi.ts` con fetch + `next.revalidate` |

---

## ⚠️ Consideraciones importantes

- El campo `externalId` es la clave para mapear productos entre DummyJSON ↔ Strapi ↔ Backend propio
- El seed debe ser **idempotente**: verificar por `externalId` antes de crear
- Usar `documentId` (no `id`) para queries y relaciones en Strapi 5
- Las imágenes se guardan como URLs (strings) apuntando a DummyJSON CDN — no se suben a Strapi Media Library en el seed inicial
- En producción, considerar mover imágenes a un bucket S3/Cloudflare R2
