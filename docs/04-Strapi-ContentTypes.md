# 🔧 Strapi — Content Types y Permisos (implementación técnica)

> Explica qué se creó en el paso `strapi-content-types` + `strapi-permissions` y por qué se hizo así.

---

## ¿Qué se hizo?

Se crearon los **Content Types** de Strapi directamente en código (archivos JSON y TypeScript), sin usar el admin panel para configurarlos manualmente. También se configuraron los **permisos públicos** de la API de forma automática.

---

## 1. ¿Qué son los Content Types en Strapi?

Cuando creas un Content Type en Strapi (ya sea via admin UI o por código), Strapi genera automáticamente:

- Una **tabla en la base de datos**
- **Endpoints REST** para ese recurso
- Un **CRUD completo** accesible desde el admin panel

La definición de cada Content Type vive en un archivo `schema.json`. Ese archivo es lo que Strapi lee al arrancar para saber qué modelos existen.

---

## 2. Estructura de archivos creada

```
strapi/src/
├── api/
│   ├── product/
│   │   ├── content-types/product/schema.json  ← modelo de datos
│   │   ├── controllers/product.ts             ← maneja los requests HTTP
│   │   ├── routes/product.ts                  ← define las rutas REST
│   │   └── services/product.ts                ← lógica de negocio
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
├── components/product/
│   ├── dimensions.json                        ← componente reutilizable
│   └── meta.json                              ← componente reutilizable
└── index.ts                                   ← bootstrap de la app
```

---

## 3. Los archivos `schema.json`

Cada Content Type tiene un `schema.json` que define su estructura. Strapi los lee al arrancar y crea/actualiza las tablas en la BD automáticamente.

### `category/schema.json`
```json
{
  "kind": "collectionType",
  "collectionName": "categories",
  "info": { "singularName": "category", "pluralName": "categories", "displayName": "Category" },
  "options": { "draftAndPublish": false },
  "attributes": {
    "name": { "type": "string", "required": true, "unique": true },
    "products": {
      "type": "relation", "relation": "oneToMany",
      "target": "api::product.product", "mappedBy": "category"
    }
  }
}
```

**Puntos clave:**
- `"kind": "collectionType"` → puede tener múltiples entradas (como una tabla normal). La alternativa es `singleType` para contenido único (ej: homepage settings).
- `"draftAndPublish": false` → las categorías no necesitan flujo de borrador, se publican directo.
- La relación `oneToMany` en `products` es el **lado inverso** de la relación — Strapi la necesita para saber que Category tiene muchos Products.

---

### `product/schema.json`
El más complejo. Puntos clave:

```json
"draftAndPublish": true
```
Los productos sí tienen flujo de borrador → hay que **publicarlos** en Strapi para que aparezcan en la API pública.

```json
"slug": { "type": "uid", "targetField": "title", "required": true }
```
El tipo `uid` genera automáticamente un slug único basado en el `title` (ej: "iPhone X" → "iphone-x"). Se usa como identificador en las URLs del frontend (`/products/iphone-x`).

```json
"externalId": { "type": "integer", "unique": true }
```
Campo clave del proyecto. Guarda el `id` del producto en DummyJSON. Permite mapear productos entre DummyJSON ↔ Strapi ↔ Backend propio.

```json
"thumbnail": { "type": "string" },
"images": { "type": "json" }
```
Las imágenes se guardan como **URLs (strings)**, no como archivos subidos a Strapi. Esto simplifica el seed — apuntamos directo a las URLs de DummyJSON CDN.

**Relaciones:**
```json
"category": {
  "type": "relation", "relation": "manyToOne",
  "target": "api::category.category", "inversedBy": "products"
}
```
Cada producto pertenece a una categoría. `inversedBy: "products"` conecta con el campo `products` definido en el schema de Category — así Strapi sabe que es la misma relación vista desde los dos lados.

```json
"tags": {
  "type": "relation", "relation": "manyToMany",
  "target": "api::tag.tag"
}
```
Un producto puede tener múltiples tags, y un tag puede estar en múltiples productos.

---

### Componentes: `dimensions.json` y `meta.json`

Los **componentes** son estructuras de datos reutilizables que se pueden embeber dentro de Content Types. No tienen su propia API REST — solo existen como parte de otros modelos.

```json
// dimensions.json
{
  "collectionName": "components_product_dimensions",
  "info": { "displayName": "Dimensions" },
  "attributes": {
    "width": { "type": "decimal" },
    "height": { "type": "decimal" },
    "depth": { "type": "decimal" }
  }
}
```

En el schema de Product se usa así:
```json
"dimensions": {
  "type": "component",
  "repeatable": false,
  "component": "product.dimensions"
}
```
`"product.dimensions"` apunta a `src/components/product/dimensions.json`. El formato es `{carpeta}.{nombre-archivo}`.

---

## 4. Controllers, Routes y Services

Estos 3 archivos son obligatorios para que Strapi registre el API de cada Content Type. En nuestro caso usan los **defaults del core** de Strapi — no necesitamos lógica personalizada:

```ts
// Ejemplo: controllers/product.ts
import { factories } from '@strapi/strapi'
export default factories.createCoreController('api::product.product')
```

Esto le dice a Strapi: *"usa el controller estándar para Product"*, que incluye `find`, `findOne`, `create`, `update`, `delete` listos para usar.

Lo mismo para routes y services. Si en el futuro quisiéramos customizar (ej: agregar validación extra al crear un producto), sobreescribimos métodos aquí.

---

## 5. El archivo `src/index.ts` — Bootstrap de permisos

Este es el **punto de entrada de la aplicación Strapi**. Tiene dos funciones:
- `register()` → se ejecuta antes de que la app se inicialice (para extender código del core)
- `bootstrap()` → se ejecuta justo antes de que el servidor empiece a recibir requests

### ¿Por qué configurar permisos aquí?

Por defecto, **toda la API de Strapi es privada**. Para que Next.js pueda consultar productos y categorías sin autenticación, necesitamos habilitar permisos para el rol `public`.

Hay dos formas de hacerlo:
1. **Manualmente** en el admin panel → Settings → Users & Permissions → Roles → Public (hay que repetirlo en cada entorno nuevo)
2. **Via bootstrap** → se ejecuta automáticamente cada vez que Strapi arranca ✅

### ¿Qué hace exactamente el bootstrap?

```ts
// 1. Busca el rol "public" en la BD
const publicRole = await strapi.db
  .query('plugin::users-permissions.role')
  .findOne({ where: { type: 'public' } })
```
Strapi tiene roles predefinidos: `public` (sin login) y `authenticated` (con login). Buscamos el rol `public` por su `type`.

```ts
// 2. Para cada permiso de la lista...
for (const perm of PUBLIC_PERMISSIONS) {
  const existing = await strapi.db
    .query('plugin::users-permissions.permission')
    .findOne({ where: { action: perm.action, role: publicRole.id } })

  // 3. Si no existe, lo crea
  if (!existing) {
    await strapi.db
      .query('plugin::users-permissions.permission')
      .create({ data: { action: perm.action, role: publicRole.id, enabled: true } })
  }
}
```
Es **idempotente**: verifica si el permiso ya existe antes de crearlo. Si vuelves a arrancar Strapi, no duplica permisos.

### Los permisos habilitados

```ts
const PUBLIC_PERMISSIONS = [
  { action: 'api::product.product.find' },      // GET /api/products
  { action: 'api::product.product.findOne' },   // GET /api/products/:id
  { action: 'api::category.category.find' },    // GET /api/categories
  { action: 'api::category.category.findOne' }, // GET /api/categories/:id
  { action: 'api::tag.tag.find' },              // GET /api/tags
]
```

El formato de las acciones es: `api::{singularName}.{singularName}.{acción}`

Con esto, Next.js puede hacer `fetch('http://localhost:1337/api/products')` sin necesitar ningún token de autenticación.

---

## 6. ¿Qué pasa cuando arranca Strapi con estos archivos?

```
npm run develop
    ↓
Strapi lee todos los schema.json de src/api/*/content-types/
    ↓
Crea/actualiza las tablas en SQLite automáticamente
    ↓
Genera los endpoints REST:
  GET    /api/products
  GET    /api/products/:documentId
  POST   /api/products
  PUT    /api/products/:documentId
  DELETE /api/products/:documentId
  (lo mismo para categories y tags)
    ↓
Ejecuta bootstrap() → configura permisos públicos
    ↓
Servidor listo en http://localhost:1337
```

---

## 7. Verificación

Para confirmar que todo funciona, con Strapi corriendo:

```bash
# Debe devolver lista vacía (aún sin datos) pero con status 200
curl http://localhost:1337/api/products
# {"data":[],"meta":{"pagination":{"page":1,"pageSize":25,"pageCount":0,"total":0}}}

curl http://localhost:1337/api/categories
# {"data":[],...}
```

Si devuelve `403 Forbidden` → los permisos del bootstrap no se aplicaron (verificar que el plugin users-permissions esté instalado).

---

## Siguiente paso: Seed de productos

Con los Content Types y permisos listos, el siguiente paso es poblar Strapi con productos reales desde DummyJSON usando el script de seed. Ver `03-Strapi-CMS.md` → Paso 6.
