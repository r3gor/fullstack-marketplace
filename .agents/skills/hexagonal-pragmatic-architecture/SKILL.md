---
name: hexagonal-pragmatic-architecture
description: Pragmatic implementation of Hexagonal Architecture (Ports & Adapters) focused on clear dependency direction, strong domain isolation, and maintainable modular growth
---

# Hexagonal Architecture – Pragmatic Modular Core

## 1. Architectural Position

This project follows a pragmatic implementation of Hexagonal Architecture (Ports & Adapters).

The goal is not academic purity, but:

- Clear dependency direction
- Strong domain isolation
- Extensibility without over-engineering
- Maintainable modular growth

Core logic must remain independent from:

- HTTP frameworks
- Databases
- Messaging systems
- External libraries
- Infrastructure details

The domain must not depend on infrastructure.

---

## 2. Structural Overview

The system is organized around a modular core with clear boundaries:

src/
  core/
    entities/
    value-objects/
    services/
    ports/
    exceptions/

  application/
    dto/

  infrastructure/
    persistence/
    messaging/
    external-services/

  interfaces/
    http/
    cli/
    workers/

  bootstrap/

---

## 3. Dependency Direction Rules

- Core must not import from infrastructure or interfaces.
- Infrastructure implements ports defined in core.
- Interfaces depend on application/core.
- Bootstrap wires everything together.
- No circular dependencies allowed.

If a dependency violates these rules, the agent must stop and request architectural clarification.

---

## 4. Service per Aggregate Strategy

Application behavior is grouped by aggregate.

Instead of creating one class per use-case by default,
related behaviors are grouped into cohesive services.

Example:

If a system manages Orders:

OrderService:
  - createOrder()
  - cancelOrder()
  - confirmPayment()

These methods evolve for the same reasons.
Therefore they belong together.

Avoid fragmenting behavior into excessive micro-classes unless cohesion decreases.

---

## 5. Domain Entities

Entities:

- Have identity
- Represent core business concepts
- Contain behavior that naturally belongs to them

Entities must not:

- Contain infrastructure logic
- Contain HTTP logic
- Contain persistence code

If entity size grows excessively,
evaluate extraction of domain services.

---

## 6. Domain Services

Use domain services when:

- Logic involves multiple entities
- Behavior does not naturally belong to a single entity
- Business rules are complex
- Variation strategies are expected

Example:

In a financial system:
A TransferService coordinating two accounts
is a domain service.

Avoid creating domain services for trivial operations.

---

## 7. Value Objects

Value Objects:

- Are immutable
- Have no identity
- Are compared by value
- Protect invariants

They encapsulate validation and domain meaning.

Example:

Instead of passing primitive strings,
use Email, Money, Percentage, Identifier, etc.

Value Objects must:

- Enforce validity at creation time
- Avoid exposing internal mutation
- Increase domain expressiveness

Avoid unnecessary Value Object proliferation.

Use them strategically.

---

## 8. Ports & Adapters

Ports (interfaces) belong to the core.

They define required behavior from external systems.

Adapters live in infrastructure and implement ports.

Example:

Core defines:
  PaymentGateway (port)

Infrastructure implements:
  StripePaymentAdapter
  MockPaymentAdapter

Core must never depend on Stripe or external SDKs.

---

## 9. Exceptions

Domain-specific exceptions must be explicit.

Avoid generic errors for business rules.

Example:

InvalidStateException
ResourceAlreadyProcessedException

Infrastructure errors must not leak into domain.

---

## 10. DTO Separation

DTOs exist to:

- Represent transport-layer contracts
- Isolate domain from external representations

Domain entities must not mirror external payload shapes.

Mapping between DTO and domain should happen at the boundary layer.

---

## 11. Dependency Injection Strategy

All dependencies must be wired in a central bootstrap module.

Bootstrap responsibilities:

- Instantiate adapters
- Instantiate services
- Connect ports to implementations
- Initialize controllers

Core must not instantiate infrastructure directly.

No hidden instantiation inside domain logic.

---

## 12. Pragmatism Clause

Hexagonal architecture is applied pragmatically.

Avoid:

- Over-segmentation
- Excessive indirection
- Premature generalization
- Artificial abstraction layers

When architectural trade-offs arise:

The agent must:
1. Explain the trade-off
2. Present alternatives
3. Request confirmation before structural decisions

---

## 13. Architectural Smell Detection

If the agent detects:

- Growing service bloat
- Circular dependencies
- Infrastructure leaking into core
- Excessive primitive obsession
- Overuse of abstraction

It must:

- Describe the smell
- Propose a refactor
- Ask for approval before restructuring

Architecture is evolutionary.

Clarity over cleverness.
Cohesion over fragmentation.
Intentional boundaries over accidental structure.
