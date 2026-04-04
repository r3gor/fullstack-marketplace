# Backend Design — Go API

## Stack

| Componente | Decisión | Justificación |
|------------|----------|---------------|
| Lenguaje | Go 1.22+ | Compilado, performante, tipado estricto |
| Framework HTTP | Fiber v2 | API compatible Express, middleware ecosistema |
| Generador SQL | sqlc | SQL puro compilado a Go, sin ORM mágico |
| Migraciones | golang-migrate | SQL versionado, sin abstracción innecesaria |
| Auth | JWT en cookies httpOnly | Sin localStorage, CSRF mitigado con SameSite=Lax |
| Base de datos | PostgreSQL 16 | Prod-ready, transacciones, integridad referencial |
| Tests | testify + httptest | Estándar Go |

---

## Arquitectura — Hexagonal Pragmática

```
backend/
├── bootstrap/          ← Inyección de dependencias + arranque del servidor
│   └── app.go
├── core/               ← Dominio puro (sin imports de infra/HTTP)
│   ├── domain/         ← Entidades + errores de dominio
│   │   ├── user.go
│   │   ├── order.go
│   │   ├── order_item.go
│   │   ├── favorite.go
│   │   └── errors.go   ← ValidationError, NotFoundError, ConflictError
│   └── port/           ← Interfaces (puertos de salida)
│       ├── repositories.go   ← UserRepository, OrderRepository, etc.
│       └── audit.go          ← AuditLogger port
├── application/        ← Casos de uso + DTOs
│   ├── auth_service.go
│   ├── user_service.go
│   ├── order_service.go
│   ├── favorite_service.go
│   ├── review_service.go     ← valida + delega a Strapi
│   └── dto/
│       ├── auth_dto.go
│       ├── order_dto.go
│       └── review_dto.go
├── infrastructure/     ← Adaptadores (HTTP, DB, Logger, Strapi)
│   ├── http/
│   │   ├── server.go
│   │   ├── middleware/
│   │   │   ├── auth.go         ← JWT verification + ctx injection
│   │   │   └── correlation.go  ← CorrelationID generation
│   │   └── handler/
│   │       ├── auth_handler.go
│   │       ├── user_handler.go
│   │       ├── order_handler.go
│   │       ├── favorite_handler.go
│   │       └── review_handler.go
│   ├── postgres/
│   │   ├── db.go             ← connection pool
│   │   ├── queries/          ← archivos .sql para sqlc
│   │   │   ├── users.sql
│   │   │   ├── orders.sql
│   │   │   ├── favorites.sql
│   │   │   └── review_submissions.sql
│   │   └── sqlc/             ← código generado por sqlc (no editar)
│   ├── strapi/
│   │   └── client.go         ← HTTP client para Strapi API (crear reviews)
│   └── logger/
│       ├── app_logger.go     ← logs técnicos (debugging)
│       └── audit_logger.go   ← implementación del puerto AuditLogger
└── migrations/
    ├── 001_create_users.up.sql
    ├── 001_create_users.down.sql
    └── ...
```

---

## Schema PostgreSQL

```sql
-- Usuarios
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(60)  NOT NULL,  -- bcrypt
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Órdenes
CREATE TABLE orders (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES users(id) ON DELETE CASCADE,
  total_amount NUMERIC(10,2) NOT NULL,
  status       VARCHAR(20) NOT NULL DEFAULT 'pending',
    -- pending | paid | shipped | delivered | cancelled
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Items de orden
CREATE TABLE order_items (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id          UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id        INTEGER NOT NULL,  -- ID externo de Strapi
  quantity          INTEGER NOT NULL CHECK (quantity > 0),
  price_at_purchase NUMERIC(10,2) NOT NULL
);

-- Favoritos
CREATE TABLE favorites (
  user_id    UUID    REFERENCES users(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, product_id)
);

-- Control de reseñas (las reseñas viven en Strapi)
CREATE TABLE review_submissions (
  user_id          UUID    REFERENCES users(id) ON DELETE CASCADE,
  product_id       INTEGER NOT NULL,
  strapi_review_id VARCHAR(255) NOT NULL,  -- documentId de Strapi
  submitted_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, product_id)  -- garantiza 1 reseña por usuario/producto
);
```

> **Nota:** No hay tabla `reviews` en PostgreSQL. Las reseñas viven en Strapi para aprovechar el sistema de moderación del admin.

---

## Arquitectura de Reviews

```
POST /api/v1/products/:id/reviews
  → auth middleware  (JWT válido, user en context)
  → review_handler   (parsea + llama ReviewService)
    → ReviewService:
        1. ¿Compró el producto?      → query order_items WHERE product_id = :id AND order.user_id = me
        2. ¿Ya tiene una reseña?     → query review_submissions WHERE user_id = me AND product_id = :id
        3. ¿Datos válidos?           → rating 1-5, comment 10-1000 chars
        4. POST Strapi API           → /api/reviews con status="pending", user_id, product_id, rating, comment
        5. INSERT review_submissions → guarda strapi_review_id para referencia
    → AuditLogger.record({ event: "review_submitted", ... })
  → 201 Created

Moderación:
  Strapi Admin → cambia status "pending" → "approved" | "rejected"

Lectura (frontend → Strapi directo):
  GET /api/reviews?filters[product_id][$eq]=:id&filters[status][$eq]=approved
```

---

## Endpoints

### Auth

```
POST /api/v1/auth/register   → crea usuario, devuelve JWT en cookie httpOnly
POST /api/v1/auth/login      → verifica credentials, devuelve JWT en cookie httpOnly
POST /api/v1/auth/logout     → limpia cookie
POST /api/v1/auth/refresh    → refresh token → nuevo access token
```

### Usuarios

```
GET /api/v1/users/me         → perfil del usuario autenticado
PATCH /api/v1/users/me       → actualiza nombre/email
```

### Órdenes

```
GET  /api/v1/orders          → lista órdenes del usuario autenticado
POST /api/v1/orders          → crea nueva orden (checkout)
GET  /api/v1/orders/:id      → detalle de orden (solo si es del usuario)
```

### Favoritos

```
GET    /api/v1/favorites         → lista favoritos (product_ids)
POST   /api/v1/favorites/:id     → agrega producto a favoritos
DELETE /api/v1/favorites/:id     → quita producto de favoritos
```

### Reviews

```
POST /api/v1/products/:id/reviews  → valida + crea review en Strapi con status="pending"
```

> **Nota:** No existe GET /reviews en el backend. El frontend consulta Strapi directamente con `?filters[status][$eq]=approved`.

---

## JWT Strategy

- **Access token:** JWT firmado con HS256, expiración 15 min, en cookie `access_token` (httpOnly, Secure, SameSite=Lax)
- **Refresh token:** UUID opaco, almacenado en tabla `refresh_tokens` (user_id, token_hash, expires_at), cookie `refresh_token`
- **Rotación:** POST /auth/refresh invalida el refresh token actual y emite uno nuevo
- **Logout:** Elimina refresh token de DB + limpia ambas cookies

```sql
CREATE TABLE refresh_tokens (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(64) UNIQUE NOT NULL,  -- SHA-256 del token
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## Flujo de Errores

```
Domain → lanza error tipado (ValidationError, NotFoundError, ConflictError)
↓
Application → envuelve si agrega contexto (ApplicationError con cause)
↓
Handler → captura
  → logger.Error(correlationId, err)
  → mapErrorToHTTP(err) → 400 / 401 / 403 / 404 / 409 / 500
↓
Respuesta JSON estándar:
  { "error": "validation_error", "message": "Rating must be between 1 and 5" }
```

---

## Strapi — Cambios Necesarios

### Nuevo Content Type: `Review`

```json
{
  "kind": "collectionType",
  "collectionName": "reviews",
  "info": { "singularName": "review", "pluralName": "reviews" },
  "options": { "draftAndPublish": false },
  "attributes": {
    "user_id":    { "type": "string",  "required": true },
    "product_id": { "type": "integer", "required": true },
    "rating":     { "type": "integer", "required": true, "min": 1, "max": 5 },
    "comment":    { "type": "text",    "required": true },
    "status":     { "type": "enumeration", "enum": ["pending", "approved", "rejected"], "default": "pending" }
  }
}
```

### Permisos Strapi

| Rol | Acción |
|-----|--------|
| Public | `find` con filtro `status=approved` (solo lectura) |
| Backend API Token (full-access) | `create`, `update` (para crear reviews vía backend) |
| Admin | Gestión completa (moderación) |

---

## Variables de Entorno

```env
# backend/.env
DATABASE_URL=postgres://user:password@localhost:5432/fullstack_ecommerce
JWT_SECRET=...
JWT_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d
STRAPI_API_URL=http://localhost:1337
STRAPI_API_TOKEN=...  # Full-access token de Strapi
PORT=8080
```

---

## Pasos de Implementación

1. `go mod init github.com/usuario/fullstack-ecommerce-backend`
2. Instalar dependencias: `fiber`, `pgx`, `bcrypt`, `jwt-go`, `golang-migrate`
3. Configurar `sqlc.yaml` + generar código desde queries `.sql`
4. Escribir migraciones en `migrations/`
5. Implementar en orden: domain → application → infrastructure (DB) → HTTP handlers
6. Agregar middleware de auth + correlationID
7. Implementar Strapi client para reviews
8. Tests de integración para endpoints principales
