# 📐 Vistas e Interfaces — E-commerce Fullstack

> Basado en `01-ProjectDefinition.md`. Define todas las vistas de la aplicación y su estrategia de rendering en Next.js App Router.

---

## 🗺️ Resumen de Rendering por Vista

| Vista | Ruta | Rendering | Fuente de Datos |
|-------|------|-----------|-----------------|
| Landing Page | `/` | SSG | Strapi |
| About | `/about` | SSG | Strapi |
| Política de envíos | `/shipping-policy` | SSG | Strapi |
| Términos y condiciones | `/terms` | SSG | Strapi |
| Catálogo de productos | `/products` | ISR (60s) | Strapi |
| Categoría | `/categories/[slug]` | ISR (60s) | Strapi |
| Detalle de producto | `/products/[slug]` | SSR | Strapi + Backend |
| Dashboard | `/dashboard` | SSR | Backend |
| Lista de órdenes | `/dashboard/orders` | SSR | Backend |
| Detalle de orden | `/dashboard/orders/[id]` | SSR | Backend |
| Favoritos | `/dashboard/favorites` | SSR | Backend |
| Perfil | `/dashboard/profile` | SSR | Backend |
| Login | `/login` | CSR | Backend (auth) |
| Register | `/register` | CSR | Backend (auth) |
| Carrito | `/cart` | CSR | Estado global |
| Checkout | `/checkout` | CSR | Backend |
| Búsqueda | `/search` | CSR | Strapi |

---

## 🟢 SSG — Static Site Generation

> Contenido que no cambia frecuentemente. Generado en build-time. Máximo performance y SEO.

### `/` — Landing Page

**Secciones:**
- Hero con CTA
- Featured products (desde Strapi)
- Categorías destacadas
- Banner promocional

**Datos:** `fetch` a Strapi en build-time, sin revalidación automática.

---

### `/about`, `/shipping-policy`, `/terms`

Páginas informativas con contenido editorial desde Strapi. Sin lógica dinámica.

---

## 🔵 ISR — Incremental Static Regeneration

> Generado en build + re-validado periódicamente. Equilibrio entre performance y frescura de datos.

### `/products` — Catálogo de productos

**Revalidación:** `60s`  
**Funcionalidades:**
- Grid de productos paginado
- Filtros por categoría, precio, rating → **Client Component** (`<ProductFilters />`)
- Paginación → query params

**Datos:** Strapi `/api/products` con paginación y populate de categoría e imágenes.

---

### `/categories/[slug]` — Productos por categoría

**Revalidación:** `60s`  
Filtra el catálogo por categoría. `generateStaticParams` para pre-generar las rutas de cada categoría en build.

---

### `/products/[slug]` — Detalle de producto (parte estática)

**Revalidación:** `30s`  
La información del producto (título, precio, imágenes, descripción) se genera con ISR desde Strapi.  
Las reviews se obtienen en runtime desde el backend propio (ver SSR abajo).

> ⚠️ En Next.js App Router, esta ruta usará SSR con `cache: 'no-store'` para las reviews, pero `next: { revalidate: 30 }` para los datos del producto via fetch separados.

---

## 🟣 SSR — Server Side Rendering

> Render en cada request. Para datos personalizados por usuario o que cambian en tiempo real.

### `/products/[slug]` — Detalle de producto (completo)

**Combina:**
- Info del producto → Strapi (cacheado con revalidate)
- Reviews reales → Backend propio (no cacheado, `cache: 'no-store'`)
- Datos de usuario autenticado (¿ya dio review? ¿es favorito?) → Backend

**Client Components dentro de esta página:**
- `<AddToCartButton />` — Selector de cantidad + acción de agregar
- `<FavoriteToggle />` — Botón ❤️
- `<ReviewForm />` — Formulario para crear review

---

### `/dashboard` — Dashboard del usuario

Requiere autenticación. Muestra:
- Resumen de cuenta (nombre, email)
- Últimas órdenes
- Actividad reciente

**Datos:** Backend `/api/users/me`, `/api/orders?limit=5`

---

### `/dashboard/orders` — Lista de órdenes

Historial completo de compras del usuario autenticado.  
**Datos:** Backend `/api/orders`

---

### `/dashboard/orders/[id]` — Detalle de orden

Detalle de una orden: items, cantidades, precios, estado, pago.  
**Datos:** Backend `/api/orders/:id`

---

### `/dashboard/favorites` — Favoritos

Lista de productos favoritos del usuario.  
**Datos:** Backend `/api/favorites` → luego fetch a Strapi para info de cada producto.

---

### `/dashboard/profile` — Perfil

Datos del perfil del usuario. Formulario de edición → **Client Component**.  
**Datos:** Backend `/api/users/me`

---

## 🟡 CSR — Client Side Rendering

> Interacciones de UI y formularios. No requieren SEO. Se ejecutan en el cliente.

### `/login` y `/register` — Autenticación

Formularios con validación en el cliente.  
Al hacer login → Backend devuelve JWT → guardado en cookie httpOnly.

---

### `/cart` — Carrito de compras

Estado global con Zustand (o Context API).  
Persiste en `localStorage`. Al iniciar checkout, valida stock contra backend.

---

### `/checkout` — Proceso de pago

Formulario de envío + datos de pago.  
Flujo: `POST /api/orders` → validar stock → crear orden → procesar pago.

---

### `/search` — Búsqueda

Input con debounce (300ms) → query a Strapi.  
Resultados en tiempo real sin recargar la página.

---

### Componentes Cliente Globales

| Componente | Descripción |
|------------|-------------|
| `<SearchBar />` | En el header, búsqueda global con debounce |
| `<CartDrawer />` | Panel lateral del carrito, accesible desde cualquier página |
| `<ProductCard />` | Tarjeta de producto con toggle de favorito |
| `<ProductFilters />` | Panel de filtros en el catálogo |
| `<AddToCartButton />` | Selector de cantidad + acción agregar |
| `<FavoriteToggle />` | Botón ❤️ en product cards y detalle |
| `<ReviewForm />` | Formulario para escribir una review |
| `<AuthGuard />` | Wrapper para proteger componentes que requieren auth |

---

## 🗂️ Estructura de Rutas — Next.js App Router

```
app/
├── layout.tsx                         # Root layout (header, footer, providers)
├── globals.css
│
├── (public)/                          # Rutas públicas
│   ├── page.tsx                       # Landing Page (SSG)
│   ├── about/page.tsx                 # About (SSG)
│   ├── shipping-policy/page.tsx       # Política de envíos (SSG)
│   ├── terms/page.tsx                 # Términos (SSG)
│   ├── products/
│   │   ├── page.tsx                   # Catálogo (ISR)
│   │   └── [slug]/
│   │       └── page.tsx               # Detalle producto (SSR)
│   ├── categories/
│   │   └── [slug]/page.tsx            # Por categoría (ISR)
│   └── search/page.tsx                # Búsqueda (CSR)
│
├── (auth)/                            # Auth routes
│   ├── layout.tsx                     # Layout mínimo (sin header/footer)
│   ├── login/page.tsx                 # Login (CSR)
│   └── register/page.tsx             # Register (CSR)
│
├── (protected)/                       # Rutas que requieren autenticación
│   ├── dashboard/
│   │   ├── page.tsx                   # Dashboard overview (SSR)
│   │   ├── orders/
│   │   │   ├── page.tsx               # Lista órdenes (SSR)
│   │   │   └── [id]/page.tsx          # Detalle orden (SSR)
│   │   ├── favorites/page.tsx         # Favoritos (SSR)
│   │   └── profile/page.tsx           # Perfil (SSR)
│   ├── cart/page.tsx                  # Carrito (CSR)
│   └── checkout/page.tsx             # Checkout (CSR)
│
└── middleware.ts                      # Protege rutas (protected) con JWT
```

---

## 🔄 Flujo de Datos por Vista

```
Landing Page (SSG)
  └── Strapi → featured products, categories

Catálogo (ISR)
  ├── Strapi → products list (paginado)
  └── [Client] Filtros → query params → re-fetch client-side

Detalle Producto (SSR)
  ├── Strapi → product data (con revalidate)
  ├── Backend → reviews del producto
  └── Backend → auth (¿favorito? ¿ya reviewó?)

Dashboard (SSR)
  └── Backend → user, orders, activity

Cart (CSR)
  └── Zustand store (localStorage)
  └── Validación de stock al checkout

Checkout (CSR)
  └── Backend: POST /api/orders
        → consulta Strapi (validar producto)
        → valida stock
        → crea orden
        → procesa pago
```

---

## 📋 Decisiones Técnicas

| Decisión | Elección | Razón |
|----------|----------|-------|
| State management | Zustand | Carrito y auth state global, ligero |
| Autenticación | JWT en cookies httpOnly | Seguro, funciona con SSR |
| Fetching server | `fetch` nativo de Next.js | Cache integrado (ISR/SSR) |
| Fetching cliente | SWR o React Query | Mutations + cache automático |
| Rutas protegidas | Middleware de Next.js | Verifica JWT antes del render |
| Styling | Tailwind CSS v4 | Ya instalado en el proyecto |

---

## ⚠️ Consideraciones Importantes

- La ruta `/products/[slug]` mezcla estrategias: usa `revalidate` para datos de Strapi y `no-store` para reviews del backend en el mismo Server Component.
- El carrito debe sincronizarse con el servidor al iniciar el checkout para evitar compras de productos sin stock.
- Las rutas del `(protected)` group deben estar cubiertas por el middleware — nunca confiar solo en redirecciones del lado del cliente.
- Usar `generateStaticParams` en `/products/[slug]` y `/categories/[slug]` para pre-generar las rutas más visitadas en build-time.
