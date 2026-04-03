---
name: logging-hexagonal-pragmatic
description: Logging integration patterns within pragmatic hexagonal architecture, covering domain purity, audit logs, error flow, and correlation ID propagation
---

# 🧠 SKILL — Logging Integration in Pragmatic Hexagonal Architecture

## 🎯 Objetivo

Integrar el sistema de logging dentro de una arquitectura hexagonal pragmática sin:

* Contaminar el dominio
* Romper SRP
* Romper DIP
* Duplicar logs
* Perder trazabilidad
* Acoplar la lógica de negocio a infraestructura

---

# 1️⃣ Ubicación Arquitectónica

Estructura conceptual:

```text
Domain
Application (Services por agregado + Puertos)
Infrastructure (Adapters: Logger, AuditLogger, Controllers)
Bootstrap (Inyección de dependencias)
```

---

# 2️⃣ Reglas por Capa

## 🔷 Domain

* ❌ No conoce Logger
* ❌ No conoce AuditLogger
* ❌ No conoce CorrelationId
* ❌ No logea
* ✅ Lanza errores clasificados
* ✅ Puede envolver errores

Ejemplo:

```pseudo
class Order {
   static create(amount) {
      if (amount <= 0) {
         throw new ValidationError("Amount must be positive")
      }
      return new Order(amount)
   }
}
```

---

## 🔷 Application (Service por agregado)

Responsabilidades:

* Orquestar entidades
* Invocar repositorios (puertos)
* Emitir eventos de negocio (via puerto AuditLogger)
* Envolver errores si agrega contexto

Reglas:

* ❌ No logea si va a relanzar error
* ⚠ Puede logear SOLO si el flujo termina aquí
* ✅ Puede depender del puerto AuditLogger
* ✅ Puede depender del puerto Repository

Ejemplo:

```pseudo
class OrderService {
   constructor(orderRepository, auditLogger) {}

   createOrder(amount, userId) {
      try {
         const order = Order.create(amount)
         orderRepository.save(order)

         auditLogger.record({
            event: "order_created",
            performedBy: userId,
            target: order.id
         })

      } catch (err) {
         throw new ApplicationError(
            "Failed to create order",
            cause=err
         )
      }
   }
}
```

---

## 🔷 Infrastructure

Contiene:

* Logger (Application logs)
* AuditLogger (implementación del puerto)
* Controllers (HTTP, Worker, CLI)
* Implementaciones de Repository

Aquí sí se logea.

Ejemplo:

```pseudo
try {
   orderService.createOrder(req.body.amount, req.user.id)
   return 201
} catch (err) {
   logger.error({
      event: "order_creation_failed",
      correlationId,
      error: err
   })

   return mapErrorToResponse(err)
}
```

---

# 3️⃣ AuditLogger como Puerto

En Application se define el contrato:

```pseudo
interface AuditLogger {
   record(eventData)
}
```

Infrastructure implementa:

```pseudo
class StructuredAuditLogger implements AuditLogger {
   record(eventData) {
      // persistir de forma estructurada e inmutable
   }
}
```

El dominio nunca conoce esta interfaz.

---

# 4️⃣ Error Flow Oficial

Flujo estándar:

```text
Domain throws ValidationError
↓
Application wraps → ApplicationError (opcional)
↓
Controller captura
↓
Logger.error(...)
↓
Map error → respuesta externa
```

Reglas:

* Nunca logear en múltiples capas.
* Nunca perder el error original.
* Nunca transformar error sin conservar causa.

---

# 5️⃣ Correlation ID

* Se genera en el Adapter de entrada.
* Se propaga hacia Application.
* Infrastructure logger lo incluye automáticamente.
* Nunca se genera dentro del dominio.

---

# 6️⃣ Separación Formal de Logs

## 🔹 Application Logs

* Para debugging técnico
* Incluyen stack trace
* Incluyen tipo de error
* Estructurados
* Responden: "¿Por qué falló el sistema?"

---

## 🔹 Audit Logs

* Representan hechos de negocio
* No incluyen stack trace
* No contienen detalles internos técnicos
* Deben ser inmutables
* Responden: "¿Quién hizo qué?"

---

# 7️⃣ Bootstrap Central

Todas las implementaciones se conectan aquí.

```pseudo
const auditLogger = new StructuredAuditLogger()
const repository = new SqlOrderRepository()
const orderService = new OrderService(repository, auditLogger)
const controller = new OrderController(orderService, logger)
```

La inyección nunca ocurre dentro del dominio.

---

# 8️⃣ Prohibiciones Arquitectónicas

❌ Inyectar Logger en Domain
❌ Logear antes de relanzar
❌ Mezclar Audit y Application logs
❌ Crear puertos basados en tecnología (ej: ISqlAuditLogger)
❌ Generar correlationId en múltiples capas

---

# 9️⃣ Casos Excepcionales

Si en el futuro:

* Se detecta que Application necesita logging estructural frecuente,
* O se desea introducir Domain Events formales,
* O se desea agregar observabilidad distribuida,

Debe proponerse una revisión arquitectónica antes de modificar la regla.

No se rompe el modelo sin evaluación.

---

# 🔥 Resultado Arquitectónico

Con esta skill aplicada:

* El dominio permanece puro.
* La trazabilidad es completa.
* El error flow es coherente.
* La arquitectura es escalable.
* Se respeta SOLID correctamente.
* La integración con frameworks es limpia.
* El sistema está preparado para crecer.
