# Arquitectura de Logs y Errores

> Documenta el sistema de observabilidad del backend Go: qué se logea, dónde, por qué, y cómo se ven las trazas completas en producción.

---

## Visión general

El sistema de logs tiene **tres capas independientes** que colaboran a través de un `correlation_id` compartido:

```
┌─────────────────────────────────────────────────────────┐
│  HTTP Request                                           │
│                                                         │
│  ① CorrelationID middleware  → genera X-Correlation-ID  │
│     guarda en: Fiber locals + Go context + header resp  │
│                                                         │
│  ② Handler llama al servicio de aplicación             │
│     └─ Servicio llama al repositorio/cliente            │
│        └─ ③ Repo/Client logea si hay error (WARN/ERROR) │
│           (usa CorrelationIDFromCtx para incluir el ID) │
│                                                         │
│  ④ Handler logea si error inesperado (ERROR)            │
│     (incluye correlation_id explícitamente)             │
│                                                         │
│  ⑤ RequestLogger middleware logea al finalizar (siempre)│
│     INFO 2xx · WARN 4xx · ERROR 5xx                     │
│     (incluye body sanitizado cuando status >= 400)      │
│                                                         │
│  ⑥ AuditLogger logea eventos de negocio                 │
│     (disparado desde los servicios de aplicación)       │
└─────────────────────────────────────────────────────────┘
```

---

## Los dos loggers

### `AppLogger` — logs técnicos

- **Propósito:** debuggear el sistema, entender qué pasó en infraestructura
- **Usado en:** middleware, repos, handlers, Strapi client
- **Niveles:** `INFO`, `WARN`, `ERROR`
- **Output:** JSON a stdout

```go
appLog.Error("db_error", "layer", "sqlite", "table", "users", "error", err)
appLog.Warn("domain_constraint", "layer", "sqlite", "constraint", "UNIQUE")
appLog.Info("request", "method", "GET", "status", 200)
```

### `AuditLogger` — eventos de negocio

- **Propósito:** registrar **qué hizo el usuario** (no qué pasó técnicamente)
- **Usado en:** servicios de aplicación (`auth_service`, `order_service`, etc.)
- **Nivel:** siempre `INFO` — son hechos, no errores
- **Disparado:** solo en el camino exitoso (happy path)

```go
auditLog.Record(ctx, port.AuditEvent{
    Event:       "user_registered",
    PerformedBy: user.ID,
    Target:      user.ID,
})
```

---

## Sistema de errores

### Jerarquía de tipos de error

```
error (interfaz Go)
├── domain.ValidationError   → input inválido del usuario → HTTP 400
├── domain.NotFoundError     → recurso no existe → HTTP 404
├── domain.ConflictError     → recurso ya existe → HTTP 409
├── domain.UnauthorizedError → credenciales inválidas → HTTP 401
├── infrastructure.InfraError → fallo técnico en adaptador → HTTP 500
│   └── Unwrap() → permite que errors.As() penetre hasta errores internos
└── fiber.Error              → errores directos de middleware → cualquier HTTP
```

### Regla de propagación

```
Repo/Client
  ├── domain error (NotFound, Conflict) → retorna directamente al servicio
  └── error técnico (DB locked, timeout) → wrappea en InfraError → retorna

Servicio de aplicación
  ├── domain error → deja pasar (errors.As funciona por Unwrap)
  └── InfraError → wrappea con fmt.Errorf("%w") si agrega contexto
      ejemplo: fmt.Errorf("failed to create order: %w", err)

Handler
  ├── errors.As(&ValidationError) → 400
  ├── errors.As(&ConflictError)   → 409
  ├── errors.As(&UnauthorizedError) → 401
  ├── errors.As(&NotFoundError)   → 404
  └── default → 500 + log.Error con correlation_id
```

### `InfraError` — por qué existe

Sin `InfraError`, un error técnico de SQLite sería un string crudo como `"database is locked"`. Con `InfraError`, el mensaje lleva contexto:

```
"[sqlite] create_order on orders: database is locked"
```

El campo `Unwrap()` garantiza que `errors.As(infraErr, &domain.NotFoundError{})` siga funcionando si alguna vez un error de dominio llega envuelto. Mantiene la cadena de errores Go intacta.

---

## Flujo completo — escenario por escenario

### Escenario 1: Request exitoso — `POST /api/v1/auth/login`

```
① CorrelationID genera: "abc-123"
② Handler llama authService.Login()
   └─ authService llama userRepo.GetByEmail()
      └─ DB retorna el usuario OK — repo NO logea (no hay error)
   └─ bcrypt.CompareHashAndPassword() OK
   └─ authService genera refresh token → repo.Create() OK
⑥ AuditLogger: event="user_logged_in"
④ Handler NO logea (no hay error)
⑤ RequestLogger logea al finalizar:
```

```json
{"level":"INFO","msg":"audit","event":"user_logged_in","performed_by":"uuid-user","target":"uuid-user"}
{"level":"INFO","msg":"request","method":"POST","path":"/api/v1/auth/login","status":200,
 "latency_ms":52,"ip":"127.0.0.1","correlation_id":"abc-123","user_id":""}
```

> **Por qué no hay log del repo:** el camino exitoso no necesita log — el RequestLogger ya registra que el request fue exitoso. Logear cada SELECT/INSERT exitoso sería ruido.

---

### Escenario 2: Error de negocio — email duplicado `POST /api/v1/auth/register` (409)

```
① CorrelationID genera: "def-456"
② Handler llama authService.Register()
   └─ repo.Create() → SQLite devuelve "UNIQUE constraint failed: users.email"
③ Repo detecta UNIQUE constraint → logea WARN + retorna ConflictError
④ Handler detecta ConflictError → retorna 409 (NO logea — es flujo esperado)
⑤ RequestLogger logea al finalizar (WARN porque status=409):
```

```json
{"level":"WARN","msg":"domain_constraint","layer":"sqlite","operation":"create_user",
 "table":"users","constraint":"UNIQUE","field":"email","correlation_id":"def-456"}

{"level":"WARN","msg":"request","method":"POST","path":"/api/v1/auth/register","status":409,
 "latency_ms":57,"ip":"127.0.0.1","correlation_id":"def-456","user_id":"",
 "body":"{\"name\":\"Test\",\"email\":\"john@example.com\",\"password\":\"[REDACTED]\"}"}
```

> **Por qué dos logs:** el log del repo dice **dónde** y **por qué** falló a nivel de datos. El log del middleware dice **qué intentó hacer** el usuario. Juntos por `correlation_id` dan el cuadro completo.

> **Por qué `password: [REDACTED]`:** el body se incluye en errores 4xx para entender qué envió el usuario, pero la contraseña nunca debe aparecer en logs.

---

### Escenario 3: Error de negocio — credenciales inválidas `POST /api/v1/auth/login` (401)

```
① CorrelationID genera: "ghi-789"
② authService.Login() → repo.GetByEmail("noexiste@example.com")
③ Repo: sql.ErrNoRows → logea WARN domain_constraint NOT_FOUND + retorna NotFoundError
   authService convierte NotFoundError → UnauthorizedError (para no revelar si el email existe)
④ Handler detecta UnauthorizedError → retorna 401 (NO logea)
⑤ RequestLogger logea WARN:
```

```json
{"level":"WARN","msg":"domain_constraint","layer":"sqlite","operation":"get_user_by_email",
 "table":"users","constraint":"NOT_FOUND","correlation_id":"ghi-789"}

{"level":"WARN","msg":"request","method":"POST","path":"/api/v1/auth/login","status":401,
 "latency_ms":0,"ip":"127.0.0.1","correlation_id":"ghi-789","user_id":"",
 "body":"{\"email\":\"noexiste@example.com\",\"password\":\"[REDACTED]\"}"}
```

---

### Escenario 4: Error técnico — DB bloqueada `POST /api/v1/orders` (500)

```
① CorrelationID genera: "jkl-012"
② orderService.CreateOrder() → orderRepo.Create()
   └─ db.BeginTx() falla: "database is locked"
③ Repo logea ERROR + retorna InfraError
④ orderService wrappea: fmt.Errorf("failed to create order: %w", infraErr)
   Handler: errors.As no matchea ningún domain error → default → logea ERROR + retorna 500
⑤ RequestLogger logea ERROR:
```

```json
{"level":"ERROR","msg":"db_error","layer":"sqlite","operation":"begin_tx","table":"orders",
 "correlation_id":"jkl-012","error":"database is locked"}

{"level":"ERROR","msg":"failed to create order","user_id":"uuid-user",
 "correlation_id":"jkl-012","error":"[sqlite] begin_tx on orders: database is locked"}

{"level":"ERROR","msg":"request","method":"POST","path":"/api/v1/orders","status":500,
 "latency_ms":8,"ip":"127.0.0.1","user_id":"uuid-user","correlation_id":"jkl-012",
 "body":"{\"items\":[{\"product_id\":5,\"quantity\":2,\"price_at_purchase\":29.99}]}"}
```

> **Tres logs, mismo `correlation_id`:** el de repo dice la causa técnica exacta, el del handler agrega el contexto de negocio ("qué operación de alto nivel falló"), el del middleware agrega el contexto del request ("qué intentaba hacer el usuario").

---

### Escenario 5: Error en cliente externo — Strapi no disponible `POST /products/:id/reviews` (500)

```
③ strapi.Client.CreateReview() → httpClient.Do() falla: "connection refused"
   Client logea ERROR con url y método
④ reviewService wrappea el error
   Handler → default → logea ERROR + retorna 500
⑤ RequestLogger logea ERROR
```

```json
{"level":"ERROR","msg":"strapi_error","layer":"strapi","operation":"create_review",
 "url":"http://localhost:1337/api/reviews","method":"POST",
 "correlation_id":"mno-345","error":"connection refused"}

{"level":"ERROR","msg":"failed to submit review","user_id":"uuid-user","product_id":42,
 "correlation_id":"mno-345","error":"failed to create review in Strapi: connection refused"}

{"level":"ERROR","msg":"request","method":"POST","path":"/api/v1/products/42/reviews",
 "status":500,"latency_ms":10001,"ip":"127.0.0.1","user_id":"uuid-user",
 "correlation_id":"mno-345","body":"{\"rating\":4,\"comment\":\"Great product...\"}"}
```

> **`latency_ms: 10001`** — el timeout de 10s del httpClient es visible en el log del middleware. Permite detectar que el problema fue un timeout externo.

---

### Escenario 6: Respuesta no-2xx de Strapi (WARN, no ERROR)

Cuando Strapi responde pero con status 4xx (ej: token inválido → 401):

```json
{"level":"WARN","msg":"strapi_non2xx","layer":"strapi","operation":"create_review",
 "url":"http://localhost:1337/api/reviews","method":"POST","status_code":401,
 "correlation_id":"pqr-678"}
```

> **WARN y no ERROR** porque Strapi respondió correctamente (la red funciona), pero el resultado fue inesperado. Permite distinguir "Strapi caído" (ERROR) de "problema de configuración/token" (WARN).

---

## El `correlation_id` — cómo funciona

```
Browser/Postman ──────────────────────────────────────────
                                                          │
  Puede enviar: X-Correlation-ID: mi-id-externo          │
  Si no lo envía → el middleware genera uno (UUID v4)    │
                                                          ▼
CorrelationID middleware
  ├─ guarda en Fiber locals → accesible en handlers/middleware via GetCorrelationID(c)
  ├─ guarda en Go context  → accesible en repos/clients via CorrelationIDFromCtx(ctx)
  └─ añade al response header X-Correlation-ID → el cliente lo recibe para soporte
```

**Por qué en Go context y no solo en Fiber locals:**
Los repositorios y clientes HTTP trabajan con `context.Context` estándar de Go, no con `*fiber.Ctx`. Al propagarlo en el contexto, todos los adaptadores de infraestructura pueden incluirlo sin depender de Fiber.

---

## Eventos de auditoría — qué se registra

Los audit logs son distintos a los técnicos — son **hechos de negocio** que interesan al producto:

| Evento | Disparado en | Campos adicionales |
|---|---|---|
| `user_registered` | `auth_service.Register()` | — |
| `user_logged_in` | `auth_service.Login()` | — |
| `user_logged_out` | `auth_service.Logout()` | — |
| `user_updated` | `user_service.UpdateMe()` | — |
| `favorite_added` | `favorite_service.Add()` | `product_id` |
| `favorite_removed` | `favorite_service.Remove()` | `product_id` |
| `order_created` | `order_service.CreateOrder()` | `order_id`, `total_amount` |
| `review_submitted` | `review_service.SubmitReview()` | `product_id`, `strapi_review_id` |

```json
{"level":"INFO","msg":"audit","event":"order_created","performed_by":"uuid-user",
 "target":"uuid-order","order_id":"uuid-order","total_amount":109.97}
```

---

## Reglas de diseño — por qué cada decisión

| Regla | Justificación |
|---|---|
| **Repos logean domain errors como WARN** | El repo sabe en qué tabla/constraint falló. El middleware solo sabe el HTTP status. Ambos juntos dan información completa. |
| **Repos NO logean en el happy path** | Logear cada SELECT/INSERT exitoso sería ruido. El RequestLogger INFO ya cubre que el request fue exitoso. |
| **Handlers no logean domain errors** | Ya los captura el RequestLogger. Loguear aquí sería duplicado. |
| **Handlers sí logean errores inesperados (500)** | Agregan contexto de negocio (`operation`, `user_id`) que el repo no conoce. |
| **`password` → `[REDACTED]` en body** | El body se loguea en 4xx/5xx para entender qué envió el usuario, pero las contraseñas nunca deben aparecer en logs. |
| **WARN para Strapi non-2xx, ERROR para timeout/connection** | Permite distinguir problemas de configuración (WARN, resolvible) de fallos de infraestructura (ERROR, requiere acción). |
| **`InfraError.Unwrap()`** | Mantiene la cadena de errores Go intacta. `errors.As` sigue funcionando a través de capas de wrapping. |
| **AuditLogger separado de AppLogger** | Distintas audiencias: audit → analistas de negocio/compliance; app → ingeniería/SRE. |

---

## Archivos clave

| Archivo | Responsabilidad |
|---|---|
| `infrastructure/logger/app_logger.go` | Logger técnico (INFO/WARN/ERROR, JSON) |
| `infrastructure/logger/audit_logger.go` | Logger de negocio (siempre INFO, eventos semánticos) |
| `infrastructure/infra_error.go` | Tipo `InfraError` para fallos técnicos de adaptadores |
| `infrastructure/http/middleware/correlation.go` | Genera/propaga `correlation_id` en Fiber locals + Go context |
| `infrastructure/http/middleware/request_logger.go` | Log de cada request (nivel según status, body sanitizado en 4xx/5xx) |
| `core/domain/errors.go` | Tipos de error de dominio (ValidationError, NotFoundError, ConflictError, UnauthorizedError) |
| `infrastructure/sqlite/*_repository.go` | Log en cada error con `layer`, `operation`, `table`, `constraint` |
| `infrastructure/strapi/client.go` | Log en errores HTTP con `url`, `method`, `status_code` |
